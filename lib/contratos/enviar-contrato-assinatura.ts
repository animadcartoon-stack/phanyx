import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { enviarEmailAssinaturaContratoInstitucional } from "@/lib/email";
import { obterTitularContrato } from "@/lib/contratos/contrato-matricula";

export class ErroEnvioContrato extends Error {
  status: number;

  constructor(
    message: string,
    status: number
  ) {
    super(message);
    this.name = "ErroEnvioContrato";
    this.status = status;
  }
}

type EnviarContratoParaAssinaturaParams = {
  contratoId: number;
  instituicaoId: number;
};

export async function enviarContratoParaAssinatura({
  contratoId,
  instituicaoId,
}: EnviarContratoParaAssinaturaParams) {
  const contrato =
    await prisma.contrato.findFirst({
      where: {
        id: contratoId,
        instituicaoId,
      },

      include: {
        aluno: {
          include: {
            user: true,
          },
        },

        instituicao: true,

        matricula: {
          include: {
            curso: true,
          },
        },
      },
    });

  if (!contrato) {
    throw new ErroEnvioContrato(
      "Contrato n\u00e3o encontrado",
      404
    );
  }

  if (contrato.status === "ASSINADO") {
    throw new ErroEnvioContrato(
      "Este contrato j\u00e1 foi assinado",
      400
    );
  }

  const tokenAssinatura =
    contrato.tokenAssinatura ||
    randomUUID();

  if (!contrato.tokenAssinatura) {
    await prisma.contrato.update({
      where: {
        id: contrato.id,
      },

      data: {
        tokenAssinatura,
      },
    });
  }

  const titularContrato =
    obterTitularContrato(
      contrato.aluno
    );

  const emailDestinatario =
    String(
      titularContrato.email ||
      ""
    ).trim();

  if (
    !emailDestinatario ||
    emailDestinatario === "-"
  ) {
    throw new ErroEnvioContrato(
      "Titular do contrato n\u00e3o possui e-mail para receber a solicita\u00e7\u00e3o de assinatura",
      400
    );
  }

  const baseUrl =
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL
          ?.trim() ||
        "https://phanyx.com.br";

  const linkAssinatura =
    `${baseUrl}/assinatura/${tokenAssinatura}`;

  await enviarEmailAssinaturaContratoInstitucional({
    instituicaoId,
    email:
      emailDestinatario,
    nome:
      titularContrato.nome,
    instituicao:
      contrato.instituicao.nome,
    titulo:
      contrato.matricula
        ?.curso
        ?.nome
        ? `Contrato de matr\u00edcula - ${contrato.matricula.curso.nome}`
        : "Contrato",
    linkAssinatura,
  });

  return {
    contratoId:
      contrato.id,
    tokenAssinatura,
    linkAssinatura,
    email:
      emailDestinatario,
  };
}