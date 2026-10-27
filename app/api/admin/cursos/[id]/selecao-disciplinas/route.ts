import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { ErroSelecaoDisciplinas, idsDaSelecao, normalizarSelecaoDisciplinas, validarModoSelecao } from "@/lib/matriculas/selecao-disciplinas";
import { respostaErroSelecao } from "@/lib/matriculas/selecao-disciplinas-servidor";

export const dynamic = "force-dynamic";
type Contexto = { params: { id: string } };
async function dados(db: Prisma.TransactionClient, instituicaoId: number, cursoId: number) {
  if (!Number.isSafeInteger(cursoId) || cursoId <= 0) throw new ErroSelecaoDisciplinas("CURSO_SELECAO_INVALIDO", undefined, 404);
  const curso = await db.curso.findFirst({ where: { id: cursoId, instituicaoId, excluidoEm: null }, include: { publicacaoRedeDestino: true, semestres: { where: { instituicaoId }, select: { disciplinas: { where: { instituicaoId }, select: { disciplina: { select: { id: true, nome: true, ativo: true, instituicaoId: true } } } } } } } });
  if (!curso) throw new ErroSelecaoDisciplinas("CURSO_SELECAO_INVALIDO", undefined, 404);
  const diretas = curso.semestres.length ? [] : await db.disciplina.findMany({ where: { cursoId, instituicaoId, ativo: true }, select: { id: true, nome: true, ativo: true, instituicaoId: true } });
  const grade = [...new Map([...curso.semestres.flatMap(s => s.disciplinas.map(d => d.disciplina)), ...diretas].filter(d => d.ativo && d.instituicaoId === instituicaoId).map(d => [d.id, { id: d.id, nome: d.nome }])).values()].sort((a,b) => a.nome.localeCompare(b.nome));
  let modoPermitido = true;
  try { validarModoSelecao(curso); } catch { modoPermitido = false; }
  return { curso, resposta: { regras: normalizarSelecaoDisciplinas(curso.regrasSelecaoDisciplinas), grade, modoPermitido, rede: Boolean(curso.publicacaoRedeDestino), updatedAt: curso.updatedAt.toISOString() } };
}
export async function GET(_req: Request, { params }: Contexto) {
  try { const user = await administradorCombos(); return NextResponse.json((await dados(prisma, user.instituicaoId, Number(params.id))).resposta); }
  catch (e) { return await respostaErroSelecao(e) || erroCombos(e); }
}
export async function PUT(req: Request, { params }: Contexto) {
  try {
    const user = await administradorCombos();
    const body = await req.json();
    if (!Object.prototype.hasOwnProperty.call(body, "regras") || typeof body.updatedAt !== "string") throw new ErroSelecaoDisciplinas("REGRAS_SELECAO_INVALIDAS");
    const regras = normalizarSelecaoDisciplinas(body.regras), cursoId = Number(params.id);
    if (!Number.isSafeInteger(cursoId) || cursoId <= 0) throw new ErroSelecaoDisciplinas("CURSO_SELECAO_INVALIDO", undefined, 404);
    const resposta = await prisma.$transaction(async tx => {
      await tx.$queryRaw`SELECT "id" FROM "Curso" WHERE "id"=${cursoId} AND "instituicaoId"=${user.instituicaoId} FOR UPDATE`;
      const atual = await dados(tx, user.instituicaoId, cursoId);
      if (atual.resposta.rede) throw new ErroSelecaoDisciplinas("SELECAO_REDE", undefined, 409);
      if (atual.resposta.updatedAt !== body.updatedAt) throw new ErroSelecaoDisciplinas("SELECAO_ALTERADA", undefined, 409);
      if (regras) {
        validarModoSelecao(atual.curso);
        if (idsDaSelecao(regras).some(id => !atual.resposta.grade.some(d => d.id === id))) throw new ErroSelecaoDisciplinas("GRADE_SELECAO_ALTERADA", undefined, 409);
      }
      await tx.curso.update({ where: { id: cursoId, instituicaoId: user.instituicaoId }, data: { regrasSelecaoDisciplinas: regras ? regras as unknown as Prisma.InputJsonValue : Prisma.DbNull } });
      return (await dados(tx, user.instituicaoId, cursoId)).resposta;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(resposta);
  } catch (e) { return await respostaErroSelecao(e) || erroCombos(e); }
}
