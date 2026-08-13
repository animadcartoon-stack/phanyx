import nodemailer from "nodemailer";

import {
  exigirConfiguracaoEmailInstituicao,
} from "@/lib/email-instituicao/configuracao";

import {
  descriptografarSenhaEmail,
} from "@/lib/email-instituicao/crypto";

export async function criarTransporterEmailInstituicao(
  instituicaoId: number
) {
  const configuracao =
    await exigirConfiguracaoEmailInstituicao(
      instituicaoId
    );

  const senha =
    descriptografarSenhaEmail(
      configuracao.senhaCriptografada
    );

  const transporter = nodemailer.createTransport({
    host: configuracao.host,
    port: configuracao.port,
    secure: configuracao.secure,

    auth: {
      user: configuracao.usuario,
      pass: senha,
    },
  });

  return {
    transporter,

    remetente: {
      nome:
        configuracao.remetenteNome?.trim() ||
        null,

      email:
        configuracao.remetenteEmail.trim(),
    },

    configuracao: {
      id: configuracao.id,
      instituicaoId:
        configuracao.instituicaoId,

      host: configuracao.host,
      port: configuracao.port,
      secure: configuracao.secure,

      usuario: configuracao.usuario,

      ativo: configuracao.ativo,
    },
  };
}

export function montarRemetenteEmail(params: {
  nome?: string | null;
  email: string;
}) {
  const nome = params.nome?.trim();
  const email = params.email.trim();

  if (!nome) {
    return email;
  }

  return `${nome} <${email}>`;
}