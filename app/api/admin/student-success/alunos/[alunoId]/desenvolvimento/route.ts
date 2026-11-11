import { NextResponse } from "next/server";
import { contextoAdmin } from "@/lib/acompanhamento-permissoes";
import { prisma } from "@/lib/prisma";
import { verificarAcessoStudentSuccess } from "@/lib/student-success/verificar-acesso-student-success";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { alunoId: string } }) {
  const ctx = await contextoAdmin();
  if (!ctx || !(await verificarAcessoStudentSuccess(ctx.usuario, "VER")).permitido) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }
  const alunoId = Number(params.alunoId);
  if (!Number.isSafeInteger(alunoId) || alunoId <= 0 || alunoId > 2147483647) {
    return NextResponse.json({ error: "Aluno inválido" }, { status: 400 });
  }

  const registros = await prisma.registroDesenvolvimento.findMany({
    where: {
      instituicaoId: ctx.instituicaoId,
      alunoId,
      status: { in: ["ENVIADO", "DEVOLVIDO", "PUBLICADO"] },
    },
    select: {
      id: true, titulo: true, tipo: true, descricao: true, conceito: true,
      nota: true, devolutiva: true, status: true, atualizadoEm: true,
      professor: { select: { nome: true } },
      turma: { select: { nome: true } },
    },
    orderBy: [{ atualizadoEm: "desc" }, { id: "desc" }],
    take: 100,
  });
  return NextResponse.json({ registros }, { headers: { "Cache-Control": "private, no-store" } });
}
