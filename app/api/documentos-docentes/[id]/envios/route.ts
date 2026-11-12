import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prepararEmailDocumentoDocente } from "@/lib/email";
import {
  emailDestinoDocente,
  eventosEmailDocente,
  idDestinoDocente,
  lerRegistroEmailDocente,
  type ResultadoEmailDocente,
} from "@/lib/documentos-docentes/destinos-email";
import { gerarPdfDocente } from "@/lib/documentos-docentes/gerar-pdf";
import { documentoAutorizado } from "@/lib/documentos-docentes/seguranca";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function resolverDestinatarios(instituicaoId: number, tipo: unknown, destino: unknown) {
  if (tipo === "EMAIL") {
    const email = emailDestinoDocente(destino);
    return email ? { rotulo: email, emails: [email] } : null;
  }

  const id = idDestinoDocente(destino);
  if (!id) return null;

  if (tipo === "USUARIO") {
    const usuario = await prisma.user.findFirst({
      where: { id, instituicaoId, ativo: true },
      select: { nome: true, email: true },
    });
    const email = emailDestinoDocente(usuario?.email);
    return usuario && email ? { rotulo: `${usuario.nome} (#${id})`, emails: [email] } : null;
  }

  if (tipo !== "DEPARTAMENTO") return null;
  const departamento = await prisma.departamento.findFirst({
    where: { id, instituicaoId, ativo: true },
    select: { nome: true },
  });
  if (!departamento) return null;

  const vinculo = { instituicaoId, departamentoId: id, ativo: true };
  const membros = await prisma.user.findMany({
    where: { instituicaoId, ativo: true, OR: [{ funcionario: { is: vinculo } }, { professor: { is: vinculo } }] },
    select: { email: true },
  });
  const emails = new Map<string, string>();
  for (const membro of membros) {
    const email = emailDestinoDocente(membro.email);
    if (email) emails.set(email.toLowerCase(), email);
  }
  return { rotulo: `${departamento.nome} (#${id})`, emails: [...emails.values()] };
}

function respostaRegistro(descricao: string | null) {
  return NextResponse.json(lerRegistroEmailDocente(descricao)?.resultado ?? { estado: "incerto" });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await documentoAutorizado(Number(params.id));
  if (!auth) return NextResponse.json({ error: "Documento não encontrado ou sem permissão." }, { status: 404 });
  const { ctx, documento } = auth;
  if (ctx.papel !== "ADMIN") return NextResponse.json({ error: "Apenas a administração pode enviar PDFs por e-mail." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const versao = idDestinoDocente(body?.versao);
  const operacao = body?.operacao;
  if (!versao || versao > documento.versaoAtual || typeof operacao !== "string" || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(operacao)) {
    return NextResponse.json({ error: "Versão ou identificador de envio inválido." }, { status: 400 });
  }

  const prefixo = `req:${operacao}|`;
  const buscaEnvio = { documentoId: documento.id, usuarioId: ctx.usuario.id, tipo: { in: [...eventosEmailDocente] }, descricao: { startsWith: prefixo } };
  const anterior = await prisma.documentoDocenteEvento.findFirst({ where: buscaEnvio });
  if (anterior) return respostaRegistro(anterior.descricao);
  if (documento.status === "CANCELADO") return NextResponse.json({ error: "O documento foi excluído da Central." }, { status: 409 });

  const destinatarios = await resolverDestinatarios(ctx.instituicaoId, body.tipo, body.destino);
  if (!destinatarios?.emails.length) {
    return NextResponse.json({ error: "O destinatário selecionado não tem um e-mail ativo para receber o PDF." }, { status: 422 });
  }
  const pdf = await gerarPdfDocente(auth, versao);
  if (!pdf.ok) return pdf;
  const content = Buffer.from(await pdf.arrayBuffer());
  const enviar = await prepararEmailDocumentoDocente(ctx.instituicaoId).catch(() => null);
  if (!enviar) return NextResponse.json({ error: "O serviço de e-mail não está configurado para o envio." }, { status: 503 });

  const descricao = (resultado: ResultadoEmailDocente) => prefixo + JSON.stringify({ destino: destinatarios.rotulo, resultado });
  const reserva = await prisma.$transaction(async tx => {
    // O bloqueio da linha do documento serializa a reserva de um mesmo envio.
    const vigente = await tx.documentoDocente.updateMany({
      where: { id: documento.id, instituicaoId: ctx.instituicaoId, status: { not: "CANCELADO" } },
      data: { atualizadoEm: new Date() },
    });
    const repetido = await tx.documentoDocenteEvento.findFirst({ where: buscaEnvio });
    if (repetido) return { repetido };
    if (vigente.count !== 1) return null;
    const evento = await tx.documentoDocenteEvento.create({
      data: { documentoId: documento.id, usuarioId: ctx.usuario.id, tipo: "EMAIL_EM_ENVIO", versao, descricao: descricao({ estado: "processando" }) },
    });
    return { evento };
  });
  if (!reserva) return NextResponse.json({ error: "O documento foi excluído da Central." }, { status: 409 });
  if (reserva.repetido) return respostaRegistro(reserva.repetido.descricao);

  let resultado: ResultadoEmailDocente;
  try {
    const titulo = documento.titulo.replace(/[\r\n]+/g, " ");
    const entrega = await enviar({
      ...(body.tipo === "DEPARTAMENTO" ? { bcc: destinatarios.emails } : { to: destinatarios.emails[0] }),
      subject: titulo,
      text: `Segue em anexo o PDF do documento “${titulo}”, versão ${versao}, enviado pela Central de documentos docentes do PHANYX.`,
      attachments: [{ filename: `documento-docente-${documento.id}-v${versao}.pdf`, content, contentType: "application/pdf" }],
    });
    const aceitos = entrega.accepted.length;
    resultado = { estado: "aceito", aceitos, recusados: destinatarios.emails.length - aceitos };
  } catch (erro) {
    console.error("Envio de documento docente:", reserva.evento.id, erro instanceof Error ? erro.name : "Erro");
    resultado = { estado: "incerto" };
  }
  await prisma.documentoDocenteEvento.update({
    where: { id: reserva.evento.id },
    data: { tipo: resultado.estado === "aceito" ? "EMAIL_ENVIADO" : "EMAIL_SEM_CONFIRMACAO", descricao: descricao(resultado) },
  }).catch(() => console.error("Falha ao registrar resultado de envio de documento docente:", reserva.evento.id));
  return NextResponse.json(resultado);
}
