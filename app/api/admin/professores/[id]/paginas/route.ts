import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contextoAdmin } from "@/lib/acompanhamento-permissoes";
import { PAGINAS_PROFESSOR } from "@/lib/portal-professor-permissoes";

export const dynamic = "force-dynamic";

async function perfil(id: number, instituicaoId: number) {
  return prisma.professor.findFirst({ where: { id, instituicaoId }, select: { id: true, nome: true } });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const admin = await contextoAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const professorId = Number(params.id);
  if (!Number.isSafeInteger(professorId) || professorId <= 0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  const professor = await perfil(professorId, admin.instituicaoId);
  if (!professor) return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
  const [regras, configuracoes, historico] = await Promise.all([
    prisma.professorPaginaPortal.findMany({ where: { professorId, instituicaoId: admin.instituicaoId } }),
    prisma.configuracaoPortalInstituicao.findMany({ where: { instituicaoId: admin.instituicaoId, portal: "PROFESSOR" } }),
    prisma.historicoPermissaoProfessor.findMany({ where: { professorId, instituicaoId: admin.instituicaoId }, orderBy: { alteradoEm: "desc" }, take: 30 }),
  ]);
  return NextResponse.json({ professor, historico, paginas: PAGINAS_PROFESSOR.map(p => {
    const regra = regras.find(r => r.chavePagina === p.chave);
    const institucional = configuracoes.find(c => c.chavePagina === p.chave)?.visivel ?? p.padrao;
    return { chave: p.chave, nome: p.nome, modo: regra?.modo ?? "PADRAO", institucional };
  }) }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const admin = await contextoAdmin();
  if (!admin) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  const professorId = Number(params.id);
  if (!Number.isSafeInteger(professorId) || professorId <= 0 || !await perfil(professorId, admin.instituicaoId)) return NextResponse.json({ error: "Professor não encontrado" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const paginas = body?.paginas;
  if (!Array.isArray(paginas) || paginas.length > PAGINAS_PROFESSOR.length ||
      paginas.some(p => !PAGINAS_PROFESSOR.some(r => r.chave === p?.chave) || !["PADRAO", "HABILITADA", "DESABILITADA"].includes(p?.modo)) ||
      new Set(paginas.map(p => p.chave)).size !== paginas.length) {
    return NextResponse.json({ error: "Lista de permissões inválida" }, { status: 400 });
  }
  // Uma transação só confirma o novo estado e a auditoria em conjunto.
  await prisma.$transaction(async tx => {
    for (const p of paginas) {
      const anterior = await tx.professorPaginaPortal.findUnique({ where: { professorId_chavePagina: { professorId, chavePagina: p.chave } } });
      const modoAnterior = anterior?.modo ?? "PADRAO";
      if (modoAnterior === p.modo) continue;
      if (p.modo === "PADRAO") {
        await tx.professorPaginaPortal.deleteMany({ where: { professorId, instituicaoId: admin.instituicaoId, chavePagina: p.chave } });
      } else {
        await tx.professorPaginaPortal.upsert({
          where: { professorId_chavePagina: { professorId, chavePagina: p.chave } },
          create: { instituicaoId: admin.instituicaoId, professorId, chavePagina: p.chave, modo: p.modo },
          update: { modo: p.modo },
        });
      }
      await tx.historicoPermissaoProfessor.create({ data: {
        instituicaoId: admin.instituicaoId, professorId, chavePagina: p.chave,
        modoAnterior, modoNovo: p.modo, alteradoPorId: admin.usuario.id,
      } });
    }
  });
  return NextResponse.json({ ok: true });
}
