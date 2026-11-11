import { prisma } from "@/lib/prisma";
import { camposModeloDocente } from "@/lib/documentos-docentes/campos-impressao";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import { professorAutorizado } from "@/lib/portal-professor-permissoes";

export const CONTEXTOS_DOCENTES = ["DOCENTE_PLANO_AULA", "DOCENTE_RELATORIO", "DOCENTE_OUTRO"] as const;

export async function contextoDocumentosDocentes() {
  const usuario = await getUserFromToken();
  if (!usuario?.instituicaoId) return null;
  if (isAdminLike(usuario.role)) return { usuario, instituicaoId: usuario.instituicaoId, papel: "ADMIN" as const, professorId: null };
  if (usuario.role !== "PROFESSOR") return null;
  const professor = await professorAutorizado(usuario.id, usuario.instituicaoId, "professor.documentos");
  if (!professor) return null;
  return { usuario, instituicaoId: usuario.instituicaoId, papel: "PROFESSOR" as const, professorId: professor.id };
}

export async function documentoAutorizado(id: number) {
  const ctx = await contextoDocumentosDocentes();
  if (!ctx || !Number.isSafeInteger(id) || id <= 0) return null;
  const documento = await prisma.documentoDocente.findFirst({
    where: { id, instituicaoId: ctx.instituicaoId, ...(ctx.professorId ? { professorId: ctx.professorId } : {}) },
  });
  return documento ? { ctx, documento } : null;
}

export function lerCampos(valor: unknown): Record<string, string> | null {
  if (valor === null || valor === undefined) return {};
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const dados = Object.entries(valor as Record<string, unknown>);
  if (dados.length > 50) return null;
  const saida: Record<string, string> = {};
  for (const [chave, conteudo] of dados) {
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _-]{0,79}$/u.test(chave) || typeof conteudo !== "string" || conteudo.length > 5000) return null;
    saida[chave] = conteudo;
  }
  return saida;
}

export function camposDoModelo(html: string) {
  return camposModeloDocente(html);
}

export function modeloDocenteValido(template: { ativo: boolean; tipo: string; contexto: string | null }) {
  return template.ativo && template.tipo === "OUTRO" && CONTEXTOS_DOCENTES.includes(template.contexto as typeof CONTEXTOS_DOCENTES[number]);
}
