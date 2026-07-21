import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
  "ALUNO",
  "PROFESSOR",
  "FUNCIONARIO",
  "VISITANTE",
];

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function normalizarTipoPessoa(valor: unknown) {
  return limparTexto(valor).toUpperCase();
}

function gerarCodigoCracha(
  instituicaoId: number,
  tipoPessoa: string,
  pessoaId: number
) {
  const prefixo =
    tipoPessoa === "ALUNO"
      ? "ALU"
      : tipoPessoa === "PROFESSOR"
      ? "PROF"
      : tipoPessoa === "FUNCIONARIO"
      ? "FUNC"
      : tipoPessoa === "VISITANTE"
      ? "VIS"
      : "PHX";

  const ano = new Date().getFullYear();
  const aleatorio = Math.random().toString(36).slice(2, 8).toUpperCase();
  const tempo = Date.now().toString(36).toUpperCase();

  return `PHX-${prefixo}-${instituicaoId}-${ano}-${pessoaId}-${tempo}-${aleatorio}`;
}

async function gerarCodigoUnico(
  instituicaoId: number,
  tipoPessoa: string,
  pessoaId: number
) {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const codigo = gerarCodigoCracha(instituicaoId, tipoPessoa, pessoaId);

    const existente = await prisma.crachaEmitido.findFirst({
      where: {
        codigoCracha: codigo,
      },
      select: {
        id: true,
      },
    });

    if (!existente) {
      return codigo;
    }
  }

  throw new Error("Não foi possível gerar um código único para o crachá.");
}

async function buscarPessoaParaCracha(
  tipoPessoa: string,
  pessoaId: number,
  instituicaoId: number
) {
  if (tipoPessoa === "ALUNO") {
    const pessoa = await prisma.aluno.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
      },
    });

    return pessoa
      ? {
          id: pessoa.id,
          nome: pessoa.nome,
          fotoPerfil: pessoa.fotoPerfil,
        }
      : null;
  }

  if (tipoPessoa === "PROFESSOR") {
    const pessoa = await prisma.professor.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
      },
    });

    return pessoa
      ? {
          id: pessoa.id,
          nome: pessoa.nome,
          fotoPerfil: pessoa.fotoPerfil,
        }
      : null;
  }

  if (tipoPessoa === "FUNCIONARIO") {
    const pessoa = await prisma.funcionario.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
      },
    });

    return pessoa
      ? {
          id: pessoa.id,
          nome: pessoa.nome,
          fotoPerfil: pessoa.fotoPerfil,
        }
      : null;
  }

  if (tipoPessoa === "VISITANTE") {
    const pessoa = await prisma.visitante.findFirst({
      where: {
        id: pessoaId,
        instituicaoId,
        arquivado: false,
      },
      select: {
        id: true,
        nome: true,
        fotoPerfil: true,
        codigoCracha: true,
        crachaValidoAte: true,
      },
    });

    return pessoa
      ? {
          id: pessoa.id,
          nome: pessoa.nome,
          fotoPerfil: pessoa.fotoPerfil,
          codigoCracha: pessoa.codigoCracha,
          validadeEm: pessoa.crachaValidoAte,
        }
      : null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const planoInstituicao =
  await obterPlanoInstituicao(
    user.instituicaoId
  );

const podeEmitirCrachas = planoTemRecurso(
  planoInstituicao,
  "CRACHAS_EMISSAO"
);

if (!podeEmitirCrachas) {
  return NextResponse.json(
    {
      error:
        "A emissão de crachás está disponível a partir do Plano Profissional.",
      codigo: "RECURSO_NAO_DISPONIVEL_NO_PLANO",
      plano: planoInstituicao,
      recurso: "CRACHAS_EMISSAO",
    },
    { status: 403 }
  );
}

    const body = await req.json();

    const tipoPessoa = normalizarTipoPessoa(body.tipoPessoa);
    const pessoaId = Number(body.pessoaId || 0);
    const modeloIdRecebido = body.modeloId ? Number(body.modeloId) : null;

    if (!TIPOS_VALIDOS.includes(tipoPessoa)) {
      return NextResponse.json(
        { error: "Tipo de pessoa inválido para emissão de crachá." },
        { status: 400 }
      );
    }

    if (!pessoaId || Number.isNaN(pessoaId)) {
      return NextResponse.json(
        { error: "Pessoa não informada para emissão do crachá." },
        { status: 400 }
      );
    }

    const pessoa = await buscarPessoaParaCracha(
      tipoPessoa,
      pessoaId,
      user.instituicaoId
    );

    if (!pessoa) {
      return NextResponse.json(
        { error: "Pessoa não encontrada nesta instituição." },
        { status: 404 }
      );
    }

    if (!pessoa.fotoPerfil) {
      return NextResponse.json(
        {
          error:
            "Esta pessoa está sem foto oficial. Cadastre a foto antes de emitir o crachá.",
        },
        { status: 400 }
      );
    }

    const modelo = modeloIdRecebido
      ? await prisma.crachaModelo.findFirst({
          where: {
            id: modeloIdRecebido,
            instituicaoId: user.instituicaoId,
            ativo: true,
          },
        })
      : await prisma.crachaModelo.findFirst({
          where: {
            instituicaoId: user.instituicaoId,
            tipoPessoa,
            padrao: true,
            ativo: true,
          },
          orderBy: {
            atualizadoEm: "desc",
          },
        });

    if (!modelo) {
      return NextResponse.json(
        {
          error:
            "Nenhum modelo de crachá ativo foi encontrado para este tipo de pessoa.",
        },
        { status: 404 }
      );
    }

    if (modelo.tipoPessoa !== tipoPessoa) {
      return NextResponse.json(
        {
          error:
            "O modelo selecionado não pertence ao tipo de pessoa escolhido.",
        },
        { status: 400 }
      );
    }

    const codigoCracha =
      tipoPessoa === "VISITANTE" && (pessoa as any).codigoCracha
        ? String((pessoa as any).codigoCracha)
        : await gerarCodigoUnico(user.instituicaoId, tipoPessoa, pessoaId);

    const validadeEm =
      tipoPessoa === "VISITANTE" && (pessoa as any).validadeEm
        ? new Date((pessoa as any).validadeEm)
        : null;

    const crachaEmitido = await prisma.crachaEmitido.create({
      data: {
        instituicaoId: user.instituicaoId,
        modeloId: modelo.id,
        codigoCracha,
        tipoPessoa,
        pessoaId,
        status: "ATIVO",
        validadeEm,
        emitidoPorId: user.id,
      },
    });

    if (tipoPessoa === "VISITANTE") {
      await prisma.visitante.updateMany({
        where: {
          id: pessoaId,
          instituicaoId: user.instituicaoId,
        },
        data: {
          crachaEmitidoEm: new Date(),
          codigoCracha,
        },
      });
    }

    return NextResponse.json({
      sucesso: true,
      cracha: {
        id: crachaEmitido.id,
        codigoCracha: crachaEmitido.codigoCracha,
        tipoPessoa: crachaEmitido.tipoPessoa,
        pessoaId: crachaEmitido.pessoaId,
        modeloId: crachaEmitido.modeloId,
        status: crachaEmitido.status,
        validadeEm: crachaEmitido.validadeEm,
        emitidoEm: crachaEmitido.emitidoEm,
      },
      pessoa,
      modelo: {
        id: modelo.id,
        nome: modelo.nome,
        tipoPessoa: modelo.tipoPessoa,
      },
    });
  } catch (error: any) {
    console.error("ERRO AO EMITIR CRACHÁ:", error);

    return NextResponse.json(
      { error: error?.message || "Erro ao emitir crachá." },
      { status: 500 }
    );
  }
}