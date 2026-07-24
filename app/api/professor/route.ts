import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";
import { TipoRemuneracaoRH } from "@prisma/client";

// LISTAR
export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const professores = await prisma.professor.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
  user: true,
  turmas: true,
  polo: true,
  funcionario: {
    include: {
      departamento: true,
    },
  },
 historicosRemuneracaoRH: {
    orderBy: {
      alteradoEm: "desc",
    },
    take: 50,
  },
},
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(professores);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar professores" },
      { status: 500 }
    );
  }
}

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function gerarSenhaTemporaria() {
  const sufixo = crypto.randomBytes(4).toString("hex");
  return `Phx@${sufixo}`;
}

function numeroDecimalOuNull(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return null;
  }

  const texto = String(valor).trim();

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

function numeroInteiroOuNull(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    String(valor).trim() === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0
    ? numero
    : null;
}

async function gerarCodigoFuncionario(
  instituicaoId: number
) {
  const ultimoFuncionario =
    await prisma.funcionario.findFirst({
      where: {
        instituicaoId,
        codigoFuncionario: {
          not: null,
        },
      },
      orderBy: {
        id: "desc",
      },
      select: {
        codigoFuncionario: true,
      },
    });

  const codigoAtual = String(
    ultimoFuncionario?.codigoFuncionario || ""
  ).replace(/\D/g, "");

  const proximoNumero = codigoAtual
    ? Number(codigoAtual) + 1
    : 1;

  return String(proximoNumero).padStart(4, "0");
}

// CRIAR
export async function POST(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
  return NextResponse.json(
    { error: "Sem permissão" },
    { status: 403 }
  );
}

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const possuiVinculoRH =
  body.possuiVinculoRH === true;

const departamentoId =
  numeroInteiroOuNull(body.departamentoId);

const tipoRemuneracaoTexto = limparTexto(
  body.tipoRemuneracao
).toUpperCase();

let tipoRemuneracao:
  | TipoRemuneracaoRH
  | null = null;

if (tipoRemuneracaoTexto) {
  const tiposPermitidos = Object.values(
    TipoRemuneracaoRH
  );

  if (
    !tiposPermitidos.includes(
      tipoRemuneracaoTexto as TipoRemuneracaoRH
    )
  ) {
    return NextResponse.json(
      {
        error:
          "A modalidade de remuneração informada é inválida.",
      },
      { status: 400 }
    );
  }

  tipoRemuneracao =
    tipoRemuneracaoTexto as TipoRemuneracaoRH;
}

if (possuiVinculoRH && !tipoRemuneracao) {
  return NextResponse.json(
    {
      error:
        "Selecione a modalidade de remuneração do professor.",
    },
    { status: 400 }
  );
}

const salarioBase = numeroDecimalOuNull(
  body.salarioBase
);

const valorHoraAula = numeroDecimalOuNull(
  body.valorHoraAula
);

const valorHoraTrabalhada = numeroDecimalOuNull(
  body.valorHoraTrabalhada
);

const valorPorAula = numeroDecimalOuNull(
  body.valorPorAula
);

const valorPorTurma = numeroDecimalOuNull(
  body.valorPorTurma
);

const valorPorDisciplina = numeroDecimalOuNull(
  body.valorPorDisciplina
);

const cargaHorariaSemanal = numeroDecimalOuNull(
  body.cargaHorariaSemanal
);

const duracaoHoraAulaMinutos =
  numeroInteiroOuNull(
    body.duracaoHoraAulaMinutos
  );

    const nome = limparTexto(body.nome);
    const email = limparTexto(body.email).toLowerCase();
    const poloId =
      body.poloId !== undefined &&
      body.poloId !== null &&
      String(body.poloId).trim() !== ""
        ? Number(body.poloId)
        : null;

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do professor é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "O email do professor é obrigatório." },
        { status: 400 }
      );
    }

    if (poloId !== null) {
      const polo = await prisma.polo.findFirst({
        where: {
          id: poloId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!polo) {
        return NextResponse.json(
          { error: "Polo inválido para esta instituição." },
          { status: 400 }
        );
      }
    }

    if (departamentoId !== null) {
  const departamento =
    await prisma.departamento.findFirst({
      where: {
        id: departamentoId,
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

  if (!departamento) {
    return NextResponse.json(
      {
        error:
          "Departamento inválido para esta instituição.",
      },
      { status: 400 }
    );
  }
}

    const userExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (userExistente) {
      return NextResponse.json(
        { error: "Email já cadastrado" },
        { status: 400 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: { nome: true },
    });

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const codigoInformado = limparTexto(
  body.codigoFuncionario
);

const codigoFuncionario = possuiVinculoRH
  ? codigoInformado ||
    (await gerarCodigoFuncionario(
      user.instituicaoId
    ))
  : codigoInformado || null;

const resultado = await prisma.$transaction(
  async (tx) => {
    const novoUser = await tx.user.create({
      data: {
        nome,
        email,
        senha: senhaHash,
        role: "PROFESSOR",
        instituicaoId: user.instituicaoId,
        precisaTrocarSenha: true,
      },
    });

    const funcionario = possuiVinculoRH
      ? await tx.funcionario.create({
          data: {
            nome,
            cpf: body.cpf || null,
            rg: body.rg || null,
            telefone: body.telefone || null,

            dataNascimento: body.dataNascimento
              ? new Date(body.dataNascimento)
              : null,

            endereco: body.endereco || null,
            numero: body.numero || null,
            complemento:
              body.complemento || null,
            bairro: body.bairro || null,
            cidade: body.cidade || null,
            estado: body.estado || null,
            cep: body.cep || null,

            cargo:
              limparTexto(body.cargo) ||
              "Professor",

            setor:
              limparTexto(body.setor) ||
              "Acadêmico",

            fotoPerfil:
              body.fotoPerfil || null,

            documentoUrl:
              body.documentoUrl || null,

            codigoFuncionario,

            dataAdmissao: body.dataAdmissao
              ? new Date(body.dataAdmissao)
              : null,

            salarioBase,
            salario: salarioBase,

            tipoRemuneracao,

            valorHoraAula,
            valorHoraTrabalhada,
            valorPorAula,
            valorPorTurma,
            valorPorDisciplina,

            duracaoHoraAulaMinutos,
            cargaHorariaSemanal,

            observacoesRemuneracao:
              limparTexto(
                body.observacoesRemuneracao
              ) || null,

            tipoContrato:
              body.tipoContrato || null,

            jornadaTrabalho:
              body.jornadaTrabalho || null,

            cargaHorariaMensal:
              numeroInteiroOuNull(
                body.cargaHorariaMensal
              ),

            codigoPonto:
              body.codigoPonto || null,

            pisPasep:
              body.pisPasep || null,

            banco: body.banco || null,
            agencia: body.agencia || null,
            conta: body.conta || null,
            pix: body.pix || null,

            departamentoId,

            instituicaoId:
              user.instituicaoId,

            userId: novoUser.id,

            statusFuncionario:
              body.statusFuncionario ||
              "ATIVO",

            motivoStatus:
              body.motivoStatus || null,

            ativo:
              (body.statusFuncionario ||
                "ATIVO") === "ATIVO",
          },
        })
      : null;

    const novoProfessor =
      await tx.professor.create({
        data: {
          nome,
          cpf: body.cpf || null,
          rg: body.rg || null,
          telefone: body.telefone || null,

          dataNascimento:
            body.dataNascimento
              ? new Date(body.dataNascimento)
              : null,

          titulacao:
            body.titulacao || null,

          especialidade:
            body.especialidade || null,

          formacao:
            body.formacao || null,

          areaAtuacao:
            body.areaAtuacao || null,

          miniBio:
            body.miniBio || null,

          codigoFuncionario,
          fotoPerfil:
            body.fotoPerfil || null,

          documentoUrl:
            body.documentoUrl || null,

          slug: body.slug || null,
          poloId,

          funcionarioId:
            funcionario?.id ?? null,

          userId: novoUser.id,
          instituicaoId:
            user.instituicaoId,
        },

        include: {
          user: true,
          polo: true,
          funcionario: {
            include: {
              departamento: true,
            },
          },
        },
      });

    return {
      novoProfessor,
      funcionario,
    };
  }
);

const novoProfessor =
  resultado.novoProfessor;

    let avisoEmail: string | null = null;

    try {
      await enviarEmailPrimeiroAcesso({
        email,
        nome,
        senha: senhaTemporaria,
        instituicao: instituicao?.nome || "PHANYX",
        portal: "professor",
      });
    } catch (emailError) {
      console.error(
        "ERRO AO ENVIAR EMAIL DE ACESSO DO PROFESSOR:",
        emailError
      );
      avisoEmail =
        "Professor criado com sucesso, mas houve erro ao enviar o email de acesso.";
    }

    return NextResponse.json({
      ...novoProfessor,
      senhaTemporaria,
      avisoEmail,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao criar professor" },
      { status: 500 }
    );
  }
}