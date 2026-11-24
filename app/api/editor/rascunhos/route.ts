import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const editor = "documentos-templates";
const chaveSchema = z.string().regex(/^(novo|[1-9][0-9]{0,9})$/);
const dadosSchema = z.object({
  editingId: z.number().int().positive().nullable(),
  nome: z.string().max(500),
  descricao: z.string().max(10000),
  tipo: z.string().max(100),
  contexto: z.string().max(500),
  conteudo: z.string().max(1000000),
  ativo: z.boolean(),
  exigeAssinatura: z.boolean(),
  formatoImpressao: z.enum(["A4_INTEIRA", "DUAS_VIAS_A4"]),
  camposVisuais: z.array(z.object({
    id: z.string().max(200), tipo: z.literal("ASSINATURA_DIRETOR"),
    x: z.number().finite(), y: z.number().finite(), largura: z.number().finite(),
    altura: z.number().finite(), pagina: z.number().finite(),
    blocoOffsetX: z.number().finite().optional(), blocoOffsetY: z.number().finite().optional(),
    blocoPaginaX: z.number().finite().optional(), blocoPaginaY: z.number().finite().optional(),
    blocoPapelX: z.number().finite().optional(), blocoPapelY: z.number().finite().optional(),
    blocoLinhaReferenciaDeltaY: z.number().finite().optional(),
  })).max(200),
}).strict();
const putSchema = z.object({ chaveDocumento: chaveSchema, versao: z.number().int().min(0).max(2147483646), dados: dadosSchema }).strict();
const deleteSchema = z.object({ chaveDocumento: chaveSchema, versao: z.number().int().positive() }).strict();
function resposta(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}
async function escopo() {
  const u = await getUserFromToken();
  if (!u || !u.instituicaoId || u.role !== "ADMIN" || u.impersonacao || u.precisaTrocarSenha) return null;
  const instituicao = await prisma.instituicao.findFirst({ where: { id: u.instituicaoId, ativo: true }, select: { id: true } });
  if (!instituicao) return null;
  return { instituicaoId: u.instituicaoId, usuarioId: u.id, editor };
}
async function autorizado(instituicaoId: number, chave: string) {
  if (chave === "novo") return true;
  const id = Number(chave);
  if (id > 2147483647) return false;
  return Boolean(await prisma.documentoTemplate.findFirst({ where: { id, instituicaoId }, select: { id: true } }));
}
function mesmaOrigem(req: NextRequest) {
  return req.headers.get("origin") === req.nextUrl.origin;
}
async function corpo(req: NextRequest) {
  const leitor = req.body?.getReader();
  if (!leitor) throw new Error("INVALID_BODY");
  const partes: Uint8Array[] = [];
  let tamanho = 0;
  try {
    for (;;) {
      const { done, value } = await leitor.read();
      if (done) break;
      tamanho += value.byteLength;
      if (tamanho > 1500000) { await leitor.cancel(); throw new Error("BODY_TOO_LARGE"); }
      partes.push(value);
    }
    return JSON.parse(Buffer.concat(partes).toString("utf8"));
  } finally { leitor.releaseLock(); }
}
function falha(error: unknown) {
  if (error instanceof Error && error.message === "BODY_TOO_LARGE") return resposta({ error: "DRAFT_TOO_LARGE" }, 413);
  if (error instanceof SyntaxError || (error instanceof Error && error.message === "INVALID_BODY")) return resposta({ error: "INVALID_DRAFT" }, 400);
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return resposta({ error: "DRAFT_CONFLICT" }, 409);
  console.error("[DRAFT_API]", error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "UNEXPECTED_ERROR");
  return resposta({ error: "DRAFT_ERROR" }, 500);
}
export async function GET(req: NextRequest) {
  try {
    const e = await escopo();
    if (!e) return resposta({ error: "UNAUTHORIZED" }, 401);
    if (req.method !== "GET" && req.headers.get("x-draft-owner") !== `${e.instituicaoId}:${e.usuarioId}`) return resposta({ error: "DRAFT_OWNER_CHANGED" }, 403);
    const chave = chaveSchema.safeParse(req.nextUrl.searchParams.get("chaveDocumento"));
    if (!chave.success) return resposta({ error: "INVALID_DRAFT" }, 400);
    if (!(await autorizado(e.instituicaoId, chave.data))) return resposta({ error: "NOT_FOUND" }, 404);
    const rascunho = await prisma.rascunhoEditor.findFirst({ where: { ...e, chaveDocumento: chave.data, expiraEm: { gt: new Date() } }, select: { dados: true, versao: true, atualizadoEm: true, expiraEm: true } });
    const segredo = process.env.JWT_SECRET;
    if (!segredo) return resposta({ error: "DRAFT_ERROR" }, 500);
    const chaveLocal = createHmac("sha256", segredo)
      .update(`phanyx-draft-local-v1:${e.instituicaoId}:${e.usuarioId}:${e.editor}:${chave.data}`)
      .digest("base64");
    return resposta({ rascunho, proprietario: `${e.instituicaoId}:${e.usuarioId}`, chaveLocal });
  } catch (error) { return falha(error); }
}
export async function PUT(req: NextRequest) {
  try {
    if (!mesmaOrigem(req)) return resposta({ error: "FORBIDDEN" }, 403);
    const e = await escopo();
    if (!e) return resposta({ error: "UNAUTHORIZED" }, 401);
    if (req.method !== "GET" && req.headers.get("x-draft-owner") !== `${e.instituicaoId}:${e.usuarioId}`) return resposta({ error: "DRAFT_OWNER_CHANGED" }, 403);
    const p = putSchema.safeParse(await corpo(req));
    if (!p.success) return resposta({ error: "INVALID_DRAFT" }, 400);
    const { chaveDocumento, versao, dados } = p.data;
    if ((dados.editingId === null ? "novo" : String(dados.editingId)) !== chaveDocumento) return resposta({ error: "INVALID_DRAFT" }, 400);
    if (!(await autorizado(e.instituicaoId, chaveDocumento))) return resposta({ error: "NOT_FOUND" }, 404);
    const where = { ...e, chaveDocumento };
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 30 * 86400000);
    const result = await prisma.$transaction(async tx => {
      if (versao === 0) {
        await tx.rascunhoEditor.deleteMany({ where: { ...where, expiraEm: { lte: agora } } });
        const r = await tx.rascunhoEditor.create({ data: { ...where, dados, expiraEm }, select: { versao: true, atualizadoEm: true } });
        return r;
      }
      const r = await tx.rascunhoEditor.updateMany({ where: { ...where, versao, expiraEm: { gt: agora } }, data: { dados, expiraEm, versao: { increment: 1 } } });
      if (r.count !== 1) return null;
      return { versao: versao + 1, atualizadoEm: agora };
    });
    return result ? resposta(result) : resposta({ error: "DRAFT_CONFLICT" }, 409);
  } catch (error) { return falha(error); }
}
export async function DELETE(req: NextRequest) {
  try {
    if (!mesmaOrigem(req)) return resposta({ error: "FORBIDDEN" }, 403);
    const e = await escopo();
    if (!e) return resposta({ error: "UNAUTHORIZED" }, 401);
    if (req.method !== "GET" && req.headers.get("x-draft-owner") !== `${e.instituicaoId}:${e.usuarioId}`) return resposta({ error: "DRAFT_OWNER_CHANGED" }, 403);
    const p = deleteSchema.safeParse(await corpo(req));
    if (!p.success) return resposta({ error: "INVALID_DRAFT" }, 400);
    const r = await prisma.rascunhoEditor.deleteMany({ where: { ...e, ...p.data } });
    return r.count === 1 ? resposta({ ok: true }) : resposta({ error: "DRAFT_CONFLICT" }, 409);
  } catch (error) { return falha(error); }
}
