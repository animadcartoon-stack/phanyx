import "server-only";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { ErroBiblioteca, obterContextoBiblioteca, respostaErroBiblioteca } from "@/lib/biblioteca-acesso";
import { paginaVisivel } from "@/lib/portal-config";
import { direitosLeituraBiblioteca } from "@/lib/biblioteca-direitos-leitura";

export function falhaLeitor(status: number, codigo: string): never {
  throw new ErroBiblioteca(status, codigo, codigo);
}

export async function obterLeitorBiblioteca() {
  const usuario = await getUserFromToken();
  if (!usuario) falhaLeitor(401, "NAO_AUTENTICADO");
  const role = usuario.role.toUpperCase();
  if (!usuario.instituicaoId || !["ALUNO", "PROFESSOR"].includes(role)) falhaLeitor(403, "ACESSO_NEGADO");
  const portal = role === "ALUNO" ? "aluno" as const : "professor" as const;
  const contexto = await obterContextoBiblioteca(usuario);
  if (!await paginaVisivel(contexto.instituicaoId, role as "ALUNO" | "PROFESSOR", `${portal}.biblioteca`)) {
    falhaLeitor(403, "PORTAL_BIBLIOTECA_DESABILITADO");
  }
  const where = { userId: usuario.id, instituicaoId: contexto.instituicaoId, ativo: true };
  const vinculo = portal === "aluno"
    ? await prisma.aluno.findFirst({ where, select: { id: true } })
    : await prisma.professor.findFirst({ where, select: { id: true } });
  if (!vinculo) falhaLeitor(403, "VINCULO_INVALIDO");
  return { instituicaoId: contexto.instituicaoId, usuarioId: usuario.id, portal,
    vinculoId: vinculo.id, configuracao: contexto.configuracao, impersonacao: usuario.impersonacao };
}

export type LeitorBiblioteca = Awaited<ReturnType<typeof obterLeitorBiblioteca>>;

export const licencasVigentes = (instituicaoId: number): Prisma.BibliotecaLicencaWhereInput => {
  const agora = new Date();
  return { instituicaoId, ativo: true,
    OR: [{ inicioVigencia: null }, { inicioVigencia: { lte: agora } }],
    AND: [{ OR: [{ fimVigencia: null }, { fimVigencia: { gte: agora } }] }] };
};

export function idLeitor(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) falhaLeitor(400, "IDENTIFICADOR_INVALIDO");
  return numero;
}

export async function itemPublicadoLeitor(leitor: LeitorBiblioteca, itemId: number) {
  const item = await prisma.bibliotecaItem.findFirst({
    where: { id: itemId, instituicaoId: leitor.instituicaoId, status: "PUBLICADO" },
    select: { id: true, titulo: true, slug: true, modalidade: true, acessoLivre: true, permitirDownload: true,
      licencas: { where: licencasVigentes(leitor.instituicaoId), select: {
        permitirVisualizacao: true, permitirDownload: true, permitirCopia: true, permitirImpressao: true,
      } } },
  });
  if (!item) falhaLeitor(404, "OBRA_NAO_ENCONTRADA");
  return item;
}

export async function arquivoPdfLeitor(leitor: LeitorBiblioteca, arquivoId: number) {
  const arquivo = await prisma.bibliotecaArquivo.findFirst({
    where: { id: arquivoId, instituicaoId: leitor.instituicaoId, tipo: "PDF", status: "DISPONIVEL",
      arquivadoEm: null, item: { instituicaoId: leitor.instituicaoId, status: "PUBLICADO" } },
    select: { id: true, itemId: true, nomeOriginal: true, storageKey: true },
  });
  if (!arquivo?.storageKey) falhaLeitor(404, "PDF_NAO_ENCONTRADO");
  const item = await itemPublicadoLeitor(leitor, arquivo.itemId);
  const direitos = direitosLeituraBiblioteca(item);
  if (!direitos.lerPdf) falhaLeitor(403, "LEITURA_NAO_AUTORIZADA");
  return { arquivo, item, direitos };
}

export function exigirEscritaLeitor(request: NextRequest, leitor: LeitorBiblioteca) {
  if (leitor.impersonacao) falhaLeitor(403, "IMPERSONACAO_SOMENTE_LEITURA");
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (origin && origin !== new URL(request.url).origin)) falhaLeitor(403, "ORIGEM_INVALIDA");
  if (!request.headers.get("content-type")?.startsWith("application/json")) falhaLeitor(415, "JSON_OBRIGATORIO");
}

export async function corpoLeitor(request: NextRequest) {
  if (Number(request.headers.get("content-length") || 0) > 65536) falhaLeitor(413, "DADOS_INVALIDOS");
  const reader = request.body?.getReader();
  if (!reader) falhaLeitor(400, "DADOS_INVALIDOS");
  let tamanho = 0; const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    tamanho += value.length;
    if (tamanho > 65536) { await reader.cancel(); falhaLeitor(413, "DADOS_INVALIDOS"); }
    chunks.push(value);
  }
  try {
    const corpo = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) falhaLeitor(400, "DADOS_INVALIDOS");
    return corpo as Record<string, unknown>;
  } catch { falhaLeitor(400, "DADOS_INVALIDOS"); }
}

export function jsonLeitor(dados: unknown, status = 200) {
  return NextResponse.json(dados, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function erroLeitor(erro: unknown) {
  const resposta = respostaErroBiblioteca(erro);
  return jsonLeitor({ codigo: resposta.corpo.codigo }, resposta.status);
}
