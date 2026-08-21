import crypto from "node:crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { enfileirarArquivoCracha } from "@/lib/crachas/fila-emissao-massiva";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const TAMANHO_PADRAO_ARQUIVO = 500;
const TAMANHO_MAXIMO_ARQUIVO = 500;
const LIMITE_MAXIMO_ALUNOS = 100000;

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function limitarTamanhoArquivo(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isInteger(numero)) {
    return TAMANHO_PADRAO_ARQUIVO;
  }

  return Math.min(
    TAMANHO_MAXIMO_ARQUIVO,
    Math.max(50, numero)
  );
}

function mensagemErro(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Erro desconhecido durante a preparação do lote.";
}

function respostaLoteExistente(lote: {
  id: number;
  status: string;
  total: number;
  aptos: number;
  semFoto: number;
  totalArquivos: number;
}) {
  return NextResponse.json({
    sucesso: true,
    reutilizado: true,
    lote: {
      id: lote.id,
      status: lote.status,
      total: lote.total,
      aptos: lote.aptos,
      semFoto: lote.semFoto,
      totalArquivos: lote.totalArquivos,
    },
  });
}

export async function POST(req: NextRequest) {
  let loteIdCriado: number | null = null;

  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão." },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    const instituicaoId = user.instituicaoId;

    const planoInstituicao =
      await obterPlanoInstituicao(instituicaoId);

    if (
      !planoTemRecurso(
        planoInstituicao,
        "CRACHAS_EMISSAO"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A emissão massiva de crachás está disponível a partir do Plano Profissional.",
          codigo:
            "RECURSO_NAO_DISPONIVEL_NO_PLANO",
          plano: planoInstituicao,
          recurso: "CRACHAS_EMISSAO",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const modeloId = Number(body.modeloId || 0);
    const nomeRecebido = limparTexto(body.nome);
    const tamanhoArquivo =
      limitarTamanhoArquivo(body.tamanhoArquivo);

    const chaveRecebida = limparTexto(
      body.chaveIdempotencia ||
        req.headers.get("idempotency-key")
    );

    const identificadorRequisicao =
      chaveRecebida || crypto.randomUUID();

    const chaveIdempotencia =
      `${instituicaoId}:crachas-alunos:${identificadorRequisicao}`;

    const loteExistente =
      await prisma.crachaLoteEmissao.findUnique({
        where: {
          chaveIdempotencia,
        },
        select: {
          id: true,
          status: true,
          total: true,
          aptos: true,
          semFoto: true,
          totalArquivos: true,
        },
      });

    if (loteExistente) {
      return respostaLoteExistente(
        loteExistente
      );
    }

    if (
      !Number.isInteger(modeloId) ||
      modeloId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione um modelo de crachá para os alunos.",
        },
        { status: 400 }
      );
    }

    const modelo =
      await prisma.crachaModelo.findFirst({
        where: {
          id: modeloId,
          instituicaoId,
          tipoPessoa: "ALUNO",
          ativo: true,
        },
        select: {
          id: true,
          nome: true,
          tipoPessoa: true,
        },
      });

    if (!modelo) {
      return NextResponse.json(
        {
          error:
            "O modelo de crachá para alunos não foi encontrado ou está inativo.",
        },
        { status: 404 }
      );
    }

    const loteEmAndamento =
      await prisma.crachaLoteEmissao.findFirst({
        where: {
          instituicaoId,
          status: {
            in: [
              "PENDENTE",
              "PREPARANDO",
              "PROCESSANDO",
            ],
          },
        },
        select: {
          id: true,
          status: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      });

    if (loteEmAndamento) {
      return NextResponse.json(
        {
          error:
            "Já existe uma emissão massiva de crachás em andamento nesta instituição.",
          loteId: loteEmAndamento.id,
          statusLote: loteEmAndamento.status,
        },
        { status: 409 }
      );
    }

    const totalAlunosAtivos =
      await prisma.aluno.count({
        where: {
          instituicaoId,
          ativo: true,
        },
      });

    if (totalAlunosAtivos === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum aluno ativo foi encontrado nesta instituição.",
        },
        { status: 400 }
      );
    }

    if (
      totalAlunosAtivos >
      LIMITE_MAXIMO_ALUNOS
    ) {
      return NextResponse.json(
        {
          error:
            `A emissão massiva está limitada a ${LIMITE_MAXIMO_ALUNOS} alunos por lote.`,
          totalEncontrado: totalAlunosAtivos,
        },
        { status: 400 }
      );
    }

    const alunos =
      await prisma.aluno.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          nome: true,
          nomeSocial: true,
          matricula: true,
          fotoPerfil: true,
        },
      });

    const alunosAptos = alunos.filter(
      (aluno) =>
        Boolean(limparTexto(aluno.fotoPerfil))
    );

    const total = alunos.length;
    const aptos = alunosAptos.length;
    const semFoto = total - aptos;

    if (aptos === 0) {
      return NextResponse.json(
        {
          error:
            "Nenhum aluno ativo possui foto oficial para emissão do crachá.",
          resumo: {
            total,
            aptos,
            semFoto,
          },
        },
        { status: 400 }
      );
    }

    const totalArquivos = Math.ceil(
      aptos / tamanhoArquivo
    );

    const nomeLote =
      nomeRecebido ||
      `Crachás de alunos - ${new Date().toLocaleDateString(
        "pt-BR"
      )}`;

    const lote =
      await prisma.crachaLoteEmissao.create({
        data: {
          instituicaoId,
          modeloId: modelo.id,
          criadoPorId: user.id,
          chaveIdempotencia,
          nome: nomeLote,
          tipoPessoa: "ALUNO",
          filtrosJson: {
            filtro: "TODOS_ALUNOS_ATIVOS",
          },
          status: "PREPARANDO",
          total,
          aptos,
          semFoto,
          processados: semFoto,
          erros: 0,
          tamanhoArquivo,
          totalArquivos,
          arquivosConcluidos: 0,
        },
        select: {
          id: true,
        },
      });

    loteIdCriado = lote.id;

    const ordemPorAluno =
      new Map<number, number>();

    alunos.forEach((aluno, indice) => {
      ordemPorAluno.set(
        aluno.id,
        indice + 1
      );
    });

    const numeroArquivoPorAluno =
      new Map<number, number>();

    alunosAptos.forEach((aluno, indice) => {
      numeroArquivoPorAluno.set(
        aluno.id,
        Math.floor(indice / tamanhoArquivo) +
          1
      );
    });

    const arquivosParaCriar =
      Array.from(
        {
          length: totalArquivos,
        },
        (_, indice) => {
          const numero = indice + 1;
          const inicio =
            indice * tamanhoArquivo;
          const alunosDoArquivo =
            alunosAptos.slice(
              inicio,
              inicio + tamanhoArquivo
            );

          const primeiraOrdem =
            ordemPorAluno.get(
              alunosDoArquivo[0].id
            ) || 1;

          const ultimaOrdem =
            ordemPorAluno.get(
              alunosDoArquivo[
                alunosDoArquivo.length - 1
              ].id
            ) || primeiraOrdem;

          return {
            loteId: lote.id,
            numero,
            status: "PENDENTE",
            total: alunosDoArquivo.length,
            processados: 0,
            erros: 0,
            primeiraOrdem,
            ultimaOrdem,
          };
        }
      );

    await prisma.crachaLoteArquivo.createMany({
      data: arquivosParaCriar,
    });

    const arquivosCriados =
      await prisma.crachaLoteArquivo.findMany({
        where: {
          loteId: lote.id,
        },
        select: {
          id: true,
          numero: true,
        },
        orderBy: {
          numero: "asc",
        },
      });

    const arquivoIdPorNumero =
      new Map<number, number>(
        arquivosCriados.map((arquivo) => [
          arquivo.numero,
          arquivo.id,
        ])
      );

    const TAMANHO_BLOCO_INSERCAO = 500;

    for (
      let inicio = 0;
      inicio < alunos.length;
      inicio += TAMANHO_BLOCO_INSERCAO
    ) {
      const bloco = alunos.slice(
        inicio,
        inicio + TAMANHO_BLOCO_INSERCAO
      );

      await prisma.crachaLoteItem.createMany({
        data: bloco.map(
          (aluno, indiceBloco) => {
            const numeroArquivo =
              numeroArquivoPorAluno.get(
                aluno.id
              );

            const arquivoId =
              numeroArquivo !== undefined
                ? arquivoIdPorNumero.get(
                    numeroArquivo
                  ) || null
                : null;

            const possuiFoto = Boolean(
              limparTexto(aluno.fotoPerfil)
            );

            return {
              loteId: lote.id,
              arquivoId,
              ordem:
                inicio + indiceBloco + 1,
              pessoaId: aluno.id,
              tipoPessoa: "ALUNO",
              status: possuiFoto
                ? "PENDENTE"
                : "SEM_FOTO",
              nomeSnapshot:
                limparTexto(
                  aluno.nomeSocial
                ) ||
                limparTexto(aluno.nome),
              identificacaoSnapshot:
                limparTexto(
                  aluno.matricula
                ) || null,
              fotoUrlSnapshot:
                limparTexto(
                  aluno.fotoPerfil
                ) || null,
              erroMensagem: possuiFoto
                ? null
                : "Aluno sem foto oficial.",
              processadoEm: possuiFoto
                ? null
                : new Date(),
            };
          }
        ),
      });
    }

    await prisma.crachaLoteEmissao.update({
      where: {
        id: lote.id,
      },
      data: {
        status: "PENDENTE",
        erroMensagem: null,
      },
    });

    const primeiroArquivo =
      arquivosCriados[0];

    if (!primeiroArquivo) {
      throw new Error(
        "O lote foi preparado, mas nenhum arquivo foi criado."
      );
    }

    await enfileirarArquivoCracha({
      loteId: lote.id,
      arquivoId: primeiroArquivo.id,
    });

    return NextResponse.json(
      {
        sucesso: true,
        reutilizado: false,
        mensagem:
          "A emissão massiva foi enviada para processamento.",
        lote: {
          id: lote.id,
          nome: nomeLote,
          status: "PENDENTE",
          total,
          aptos,
          semFoto,
          tamanhoArquivo,
          totalArquivos,
          primeiroArquivoId:
            primeiroArquivo.id,
        },
      },
      { status: 202 }
    );
  } catch (error: unknown) {
    console.error(
      "ERRO AO PREPARAR EMISSÃO MASSIVA DE CRACHÁS:",
      error
    );

    if (loteIdCriado) {
      await prisma.crachaLoteEmissao
        .updateMany({
          where: {
            id: loteIdCriado,
            status: {
              notIn: [
                "CONCLUIDO",
                "CONCLUIDO_PARCIAL",
                "CANCELADO",
              ],
            },
          },
          data: {
            status: "ERRO",
            erroMensagem:
              mensagemErro(error),
            finalizadoEm: new Date(),
          },
        })
        .catch(() => null);
    }

    return NextResponse.json(
      {
        error:
          mensagemErro(error) ||
          "Não foi possível preparar a emissão massiva.",
      },
      { status: 500 }
    );
  }
}