import { prisma } from "@/lib/prisma";

export async function obterConfiguracaoEmailInstituicao(
  instituicaoId: number
) {
  if (!Number.isFinite(instituicaoId) || instituicaoId <= 0) {
    return null;
  }

  return prisma.configuracaoEmailInstituicao.findUnique({
    where: {
      instituicaoId,
    },
  });
}

export async function emailInstituicaoDisponivel(
  instituicaoId: number
): Promise<boolean> {
  const configuracao =
    await obterConfiguracaoEmailInstituicao(instituicaoId);

  if (!configuracao) {
    return false;
  }

  return Boolean(
    configuracao.ativo &&
      configuracao.host &&
      configuracao.port &&
      configuracao.usuario &&
      configuracao.senhaCriptografada &&
      configuracao.remetenteEmail
  );
}

export async function exigirConfiguracaoEmailInstituicao(
  instituicaoId: number
) {
  const configuracao =
    await obterConfiguracaoEmailInstituicao(instituicaoId);

  if (!configuracao) {
    throw new Error(
      "Esta instituição não possui configuração de e-mail cadastrada."
    );
  }

  if (!configuracao.ativo) {
    throw new Error(
      "O envio de e-mail está desativado para esta instituição."
    );
  }

  if (!configuracao.host) {
    throw new Error(
      "Servidor SMTP não configurado para esta instituição."
    );
  }

  if (!configuracao.port) {
    throw new Error(
      "Porta SMTP não configurada para esta instituição."
    );
  }

  if (!configuracao.usuario) {
    throw new Error(
      "Usuário SMTP não configurado para esta instituição."
    );
  }

  if (!configuracao.senhaCriptografada) {
    throw new Error(
      "Senha SMTP não configurada para esta instituição."
    );
  }

  if (!configuracao.remetenteEmail) {
    throw new Error(
      "E-mail remetente não configurado para esta instituição."
    );
  }

  return configuracao;
}