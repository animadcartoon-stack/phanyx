import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
async function operadorAutorizado() {
  const user = await getUserFromToken();
  return user && user.instituicaoId && !user.impersonacao && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") ? user : null;
}

export async function GET() {
  const user = await operadorAutorizado();
  if (!user) return NextResponse.json({ error: "Sem permissão administrativa." }, { status: 403 });
  const planos = await prisma.planoCoberturaDocente.findMany({
    where: { instituicaoId: user.instituicaoId! },
    orderBy: { criadoEm: "desc" }, take: 100,
    include: {
      professorTitular: { select: { nome: true } },
      turma: { select: { nome: true } },
      disciplina: { select: { nome: true } },
      substituicaoDocente: { select: { id: true, status: true, professorSubstituto: { select: { nome: true } } } },
    },
  });
  return NextResponse.json({ planos }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(req: Request) {
  const user = await operadorAutorizado();
  if (!user) return NextResponse.json({ error: "Sem permissão administrativa." }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = Number(body?.id), acao = String(body?.acao || "");
  const motivo = typeof body?.motivo === "string" ? body.motivo.trim().slice(0, 2000) : "";
  if (!Number.isSafeInteger(id) || id <= 0 || !["APROVAR_E_DESIGNAR", "DEVOLVER"].includes(acao))
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  if (acao === "DEVOLVER" && !motivo) return NextResponse.json({ error: "Informe a orientação para o professor." }, { status: 400 });
  const substitutoId = Number(body?.professorSubstitutoId);
  if (acao === "APROVAR_E_DESIGNAR" && (!Number.isSafeInteger(substitutoId) || substitutoId <= 0))
    return NextResponse.json({ error: "Selecione o professor substituto." }, { status: 400 });
  try {
    const resultado = await prisma.$transaction(async tx => {
      const plano = await tx.planoCoberturaDocente.findFirst({
        where: { id, instituicaoId: user.instituicaoId!, status: "ENVIADO", substituicaoDocenteId: null },
        select: { id: true, professorTitularId: true, turmaId: true, disciplinaId: true, dataAula: true, titulo: true },
      });
      if (!plano) throw new Error("Plano não está mais aguardando aprovação.");
      if (acao === "DEVOLVER") {
        await tx.planoCoberturaDocente.update({ where: { id }, data: { status: "DEVOLVIDO", devolutiva: motivo } });
        return { status: "DEVOLVIDO" };
      }
      if (plano.professorTitularId === substitutoId) throw new Error("O substituto deve ser diferente do titular.");
      const substituto = await tx.professor.findFirst({
        where: { id: substitutoId, instituicaoId: user.instituicaoId!, ativo: true }, select: { id: true },
      });
      if (!substituto) throw new Error("Professor substituto indisponível.");
      const existe = await tx.substituicaoDocente.findFirst({
        where: { instituicaoId: user.instituicaoId!, turmaId: plano.turmaId, disciplinaId: plano.disciplinaId,
          status: { in: ["AGENDADA", "ATIVA", "SUSPENSA"] } }, select: { id: true },
      });
      if (existe) throw new Error("Já existe substituição aberta para esta turma e disciplina. Verifique o agendamento.");
      // Mantem a mesma convencao da rota administrativa de substituicoes:
      // cobertura do dia corrente ja deve nascer ATIVA para vincular aulas.
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const diaCobertura = new Date(plano.dataAula);
      diaCobertura.setHours(0, 0, 0, 0);
      const statusInicial = diaCobertura <= hoje ? "ATIVA" : "AGENDADA";
      const substituicao = await tx.substituicaoDocente.create({ data: {
        instituicaoId: user.instituicaoId!, professorTitularId: plano.professorTitularId, professorSubstitutoId: substitutoId,
        turmaId: plano.turmaId, disciplinaId: plano.disciplinaId, dataInicio: plano.dataAula, dataFim: plano.dataAula,
        motivo: "Ausência docente - cobertura de aula", observacoes: `Plano de cobertura: ${plano.titulo}`,
        status: statusInicial, criadoPorId: user.id,
      } });
      await tx.planoCoberturaDocente.update({ where: { id }, data: {
        status: "APROVADO", aprovadoEm: new Date(), aprovadoPorId: user.id,
        substituicaoDocenteId: substituicao.id, devolutiva: null,
      } });
      return { status: "APROVADO", substituicaoDocenteId: substituicao.id };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 25000 });
    return NextResponse.json({ message: acao === "DEVOLVER" ? "Plano devolvido." : "Cobertura aprovada e substituto designado.", ...resultado });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Não foi possível concluir a análise.";
    return NextResponse.json({ error: mensagem }, { status: 409 });
  }
}
