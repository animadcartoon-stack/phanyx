import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { enviarEmailPrimeiroAcessoInstitucional } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: { id: string } }) {
  const operador = await getUserFromToken();
  if (!operador || !operador.instituicaoId || operador.impersonacao ||
    (operador.role !== "ADMIN" && operador.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Operação restrita à administração da instituição." }, { status: 403 });
  }
  const id = Number(context.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID de funcionário inválido." }, { status: 400 });
  }
  const funcionario = await prisma.funcionario.findFirst({
    where: { id, instituicaoId: operador.instituicaoId },
    select: { id: true, nome: true, userId: true, statusFuncionario: true,
      user: { select: { id: true, nome: true, email: true, senha: true,
        ativo: true, role: true, isMasterAdmin: true, precisaTrocarSenha: true,
        resetToken: true, resetTokenExpira: true } },
      instituicao: { select: { nome: true } },
    },
  });
  if (!funcionario || !funcionario.user || !funcionario.userId) {
    return NextResponse.json({ error: "O funcionário ainda não possui um usuário de acesso vinculado." }, { status: 400 });
  }
  const usuario = funcionario.user;
  if (!usuario.ativo || !funcionario.statusFuncionario || funcionario.statusFuncionario !== "ATIVO") {
    return NextResponse.json({ error: "O acesso está bloqueado ou o funcionário não está ativo. Regularize a situação antes de enviar credenciais." }, { status: 409 });
  }
  if (usuario.isMasterAdmin || usuario.id === operador.id ||
    usuario.role === "SUPER_ADMIN" || usuario.role === "SUPORTE" || !usuario.email) {
    return NextResponse.json({ error: "Não é permitido redefinir as credenciais desta conta nesta área." }, { status: 403 });
  }
  // Uma senha temporária nova invalida a anterior; jamais é exibida na resposta ou no log.
  const senhaTemporaria = `Phx@${crypto.randomBytes(14).toString("base64url")}`;
  const senhaHash = await bcrypt.hash(senhaTemporaria, 12);
  const estadoAnterior = { senha: usuario.senha, precisaTrocarSenha: usuario.precisaTrocarSenha,
    resetToken: usuario.resetToken, resetTokenExpira: usuario.resetTokenExpira };
  const atualizado = await prisma.user.updateMany({
    where: { id: usuario.id, senha: usuario.senha, ativo: true },
    data: { senha: senhaHash, precisaTrocarSenha: true, resetToken: null, resetTokenExpira: null },
  });
  if (atualizado.count !== 1) {
    return NextResponse.json({ error: "O acesso foi alterado por outra operação. Atualize a página e tente novamente." }, { status: 409 });
  }
  try {
    await enviarEmailPrimeiroAcessoInstitucional({
      instituicaoId: operador.instituicaoId,
      email: usuario.email,
      nome: usuario.nome,
      senha: senhaTemporaria,
      instituicao: funcionario.instituicao.nome,
      portal: usuario.role === "PROFESSOR" ? "professor" : "admin",
    });
  } catch(error) {
    console.error("ENVIO_CREDENCIAIS_FUNCIONARIO", error instanceof Error ? error.message : "Erro de email");
    // Melhor esforço de restauração: evita deixar senha alterada quando o email falha.
    const restauracao = await prisma.user.updateMany({ where: { id: usuario.id, senha: senhaHash }, data: estadoAnterior });
    return NextResponse.json({ error: restauracao.count === 1
      ? "O e-mail não foi enviado; a senha anterior foi preservada. Verifique a configuração de e-mail da instituição."
      : "Falha no envio. O acesso pode ter sido alterado; contate o administrador antes de tentar novamente." }, { status: 502 });
  }
  await prisma.historicoRH.create({ data: {
    funcionarioId: funcionario.id, instituicaoId: operador.instituicaoId, criadoPorId: operador.id,
    tipo: "ENVIO_CREDENCIAIS", titulo: "Envio de novas credenciais de acesso",
    descricao: `Novas credenciais enviadas ao e-mail de acesso cadastrado para ${funcionario.nome}.`,
    observacoes: JSON.stringify({ usuarioId: usuario.id, perfil: usuario.role, email: usuario.email, senhaIncluida: false }),
  }}).catch(error => console.error("HISTORICO_ENVIO_CREDENCIAIS", error));
  return NextResponse.json({ message: "Login e senha temporária enviados por e-mail. A senha deverá ser trocada no primeiro acesso.", usuarioId: usuario.id });
}
