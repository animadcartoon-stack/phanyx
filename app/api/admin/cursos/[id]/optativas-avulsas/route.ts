import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { ErroModalidades, idsPositivos, minutos } from "@/lib/matriculas/combos";
import { cabeNoHorario } from "@/lib/matriculas/optativas-avulsas";
import { bloquearSessoesOptativas, ocupacoesOptativas } from "@/lib/matriculas/optativas-avulsas-servidor";

export const dynamic = "force-dynamic";
type Contexto = { params: { id: string } };
const erroDados = () => new ErroModalidades("OPTATIVA_CONFIGURACAO_INVALIDA");

export async function GET(_request: Request, { params }: Contexto) {
  try {
    const { instituicaoId } = await administradorCombos();
    const [cursoId] = idsPositivos([params.id]);
    const curso = await prisma.curso.findFirst({
      where: { id: cursoId, instituicaoId, excluidoEm: null, matriculaDiretaTurma: true },
      select: { optativasAvulsasAtivas: true },
    });
    if (!curso) throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 404);
    const [disciplinas, turmas, professores, sessoes] = await Promise.all([
      prisma.disciplina.findMany({ where: { cursoId, instituicaoId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.turma.findMany({ where: { cursoId, instituicaoId, ativa: true },
        select: { id: true, nome: true, turno: true, periodoLetivo: true }, orderBy: { nome: "asc" } }),
      prisma.professor.findMany({ where: { instituicaoId, ativo: true }, select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
      prisma.sessaoOptativaAvulsa.findMany({ where: { cursoId, instituicaoId, ativa: true },
        include: { disciplina: { select: { nome: true } }, turmas: { select: { turmaId: true } } },
        orderBy: [{ diaSemana: "asc" }, { horaInicio: "asc" }, { id: "asc" }] }),
    ]);
    const ocupacoes = await ocupacoesOptativas(prisma, instituicaoId, sessoes.map(s => s.id));
    return NextResponse.json({ ativo: curso.optativasAvulsasAtivas, disciplinas, turmas, professores,
      sessoes: sessoes.map(s => ({ ...s, ocupadas: ocupacoes.get(s.id) ?? 0 })) });
  } catch (error) { return erroCombos(error); }
}

export async function POST(request: Request, { params }: Contexto) {
  try {
    const { instituicaoId } = await administradorCombos();
    const [cursoId] = idsPositivos([params.id]);
    const body = await request.json() as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw erroDados();
    await prisma.$transaction(async tx => {
      const curso = await tx.curso.findFirst({
        where: { id: cursoId, instituicaoId, excluidoEm: null, matriculaDiretaTurma: true, publicacaoRedeDestino: null },
        select: { id: true, optativasAvulsasAtivas: true },
      });
      if (!curso) throw new ErroModalidades("OPTATIVA_INDISPONIVEL", 404);
      if (body.acao === "ATIVAR" && typeof body.ativo === "boolean") {
        await tx.curso.update({ where: { id_instituicaoId: { id: cursoId, instituicaoId } },
          data: { optativasAvulsasAtivas: body.ativo } });
        return;
      }

      if (!curso.optativasAvulsasAtivas) throw erroDados();
      const capacidade = Number(body.capacidade);
      const professorId = body.professorId == null || body.professorId === "" ? null : idsPositivos([body.professorId])[0];
      if (professorId && !await tx.professor.findFirst({ where: { id: professorId, instituicaoId, ativo: true }, select: { id: true } })) throw erroDados();
      if (body.acao === "ATUALIZAR" || body.acao === "ARQUIVAR") {
        const [sessaoId] = idsPositivos([body.sessaoId]);
        await bloquearSessoesOptativas(tx, instituicaoId, [sessaoId]);
        const sessao = await tx.sessaoOptativaAvulsa.findFirst({ where: { id: sessaoId, cursoId, instituicaoId, ativa: true }, select: { id: true } });
        if (!sessao) throw erroDados();
        const ocupadas = (await ocupacoesOptativas(tx, instituicaoId, [sessaoId])).get(sessaoId) ?? 0;
        if (body.acao === "ATUALIZAR" && (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 2000)) throw erroDados();
        if (ocupadas > (body.acao === "ARQUIVAR" ? 0 : capacidade)) throw new ErroModalidades("OPTATIVA_COM_MATRICULAS", 409);
        await tx.sessaoOptativaAvulsa.update({ where: { id_instituicaoId: { id: sessaoId, instituicaoId } },
          data: body.acao === "ARQUIVAR" ? { ativa: false } : { professorId, capacidade } });
        return;
      }

      const [disciplinaId] = idsPositivos([body.disciplinaId]);
      const turmaIds = idsPositivos(body.turmaIds);
      const diaSemana = body.diaSemana;
      const horaInicio = typeof body.horaInicio === "string" ? body.horaInicio : "";
      const horaFim = typeof body.horaFim === "string" ? body.horaFim : "";
      if (body.acao !== "CRIAR" || !turmaIds.length || !Number.isInteger(capacidade) || capacidade < 1 || capacidade > 2000 ||
          typeof diaSemana !== "number" || !Number.isInteger(diaSemana) || diaSemana < 0 || diaSemana > 6 ||
          minutos(horaInicio) === null || minutos(horaFim) === null || horaInicio >= horaFim) throw erroDados();

      const disciplina = await tx.disciplina.findFirst({ where: { id: disciplinaId, cursoId, instituicaoId, ativo: true }, select: { id: true } });
      const turmas = await tx.turma.findMany({ where: { id: { in: turmaIds }, cursoId, instituicaoId, ativa: true },
        select: { id: true, periodoLetivo: true, horariosAvulsos: { where: { ativo: true, instituicaoId } } } });
      const horario = { diaSemana, horaInicio, horaFim };
      if (!disciplina || turmas.length !== turmaIds.length || new Set(turmas.map(t => t.periodoLetivo)).size !== 1 ||
          turmas.some(t => !cabeNoHorario(horario, t.horariosAvulsos))) throw erroDados();
      const existente = await tx.sessaoOptativaAvulsa.findFirst({
        where: { instituicaoId, cursoId, ativa: true, disciplinaId, ...horario,
          turmas: { some: { turmaId: { in: turmaIds } } } }, select: { id: true },
      });
      if (existente) throw new ErroModalidades("REGISTRO_DUPLICADO", 409);
      await tx.sessaoOptativaAvulsa.create({
        data: { instituicaoId, cursoId, disciplinaId, professorId, capacidade, ...horario,
          turmas: { create: turmaIds.map(turmaId => ({ turmaId })) } },
      });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ ok: true });
  } catch (error) { return erroCombos(error); }
}
