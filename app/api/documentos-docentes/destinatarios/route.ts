import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoDocumentosDocentes } from "@/lib/documentos-docentes/seguranca";
import { emailDestinoDocente, idDestinoDocente } from "@/lib/documentos-docentes/destinos-email";

export const dynamic = "force-dynamic";
const cabecalhos = { "Cache-Control": "private, no-store" };

export async function GET(req: Request) {
  const ctx = await contextoDocumentosDocentes();
  if (ctx?.papel !== "ADMIN") return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  const consulta = new URL(req.url).searchParams;
  const tipo = consulta.get("tipo");
  const busca = (consulta.get("q") ?? "").trim().slice(0, 120);
  const filtroNome = busca ? { nome: { contains: busca, mode: "insensitive" as const } } : {};
  if (tipo === "DEPARTAMENTO") {
    const destinos = await prisma.departamento.findMany({
      where: { instituicaoId: ctx.instituicaoId, ativo: true, ...filtroNome },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    });
    return NextResponse.json({ destinos }, { headers: cabecalhos });
  }
  if (tipo !== "USUARIO") return NextResponse.json({ error: "Tipo de destinatário inválido." }, { status: 400 });
  const id = /^\d+$/.test(busca) ? idDestinoDocente(Number(busca)) : null;
  const usuarios = await prisma.user.findMany({
    where: { instituicaoId: ctx.instituicaoId, ativo: true, ...(id ? { id } : filtroNome) },
    select: { id: true, nome: true, email: true },
    orderBy: [{ nome: "asc" }, { id: "asc" }],
    take: 30,
  });
  return NextResponse.json({ destinos: usuarios.filter(usuario => emailDestinoDocente(usuario.email)) }, { headers: cabecalhos });
}
