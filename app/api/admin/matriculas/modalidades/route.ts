import { createHash } from "node:crypto";
import { idCursoPrincipal } from "@/lib/matriculas/cursos-adicionais";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { ErroModalidades, idsPositivos } from "@/lib/matriculas/combos";
import {
  carregarOfertasModalidades,
  prepararContratacaoModalidades,
  confirmarContratacaoModalidades,
} from "@/lib/matriculas/modalidades-servidor";

export const dynamic = "force-dynamic";

export async function GET(req?: Request) {
  try {
    const user = await administradorCombos();
    const principalId = idCursoPrincipal(req ? new URL(req.url).searchParams.get("cursoPrincipalId") : null);
    const principal = principalId === null ? null : await prisma.curso.findFirst({
      where: { id: principalId, instituicaoId: user.instituicaoId, ativo: true, excluidoEm: null },
      select: { id: true, nome: true, permiteCursosAdicionais: true },
    });
    if (principalId !== null && !principal?.permiteCursosAdicionais) throw new ErroModalidades("PRINCIPAL_NAO_PERMITE_ADICIONAIS", 409);
    const ofertas = await carregarOfertasModalidades(prisma, user.instituicaoId);
    return NextResponse.json({ principal, ofertas: principalId === null ? ofertas : ofertas.filter(o => o.cursoId === principalId || o.curso.disponivelComoAdicional) });
  } catch (error) {
    return erroCombos(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await administradorCombos();
    const body = (await request.json()) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ErroModalidades("SELECAO_INVALIDA");
    if (body.acao === "PREVIA") {
      const previa = await prisma.$transaction(
        async (tx) => {
          const p = await prepararContratacaoModalidades(
            tx,
            user.instituicaoId,
            body,
          );
          return { calculo: p.calculo, versao: p.versao, snapshot: p.snapshot };
        },
        { isolationLevel: "RepeatableRead", timeout: 20000 },
      );
      return NextResponse.json(previa);
    }
    if (
      body.acao !== "CONFIRMAR" ||
      typeof body.chave !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.chave,
      )
    ) {
      throw new ErroModalidades("SELECAO_INVALIDA");
    }
    const [alunoId] = idsPositivos([body.alunoId]);
    const turmaIds = idsPositivos(body.turmaIds).sort((a, b) => a - b);
    const pedidoHash = createHash("sha256")
      .update(
        JSON.stringify({
          alunoId,
          ...(body.cursoPrincipalId != null ? { cursoPrincipalId: idCursoPrincipal(body.cursoPrincipalId) } : {}),
          turmaIds,
          dataInicioCurso: body.dataInicioCurso || null,
          primeiroVencimento: body.primeiroVencimento,
          status: body.status,
          versao: body.versao,
          ajuste: body.ajuste || null,
        }),
      )
      .digest("hex");
    const chave = `${user.instituicaoId}:${user.id}:${body.chave}`;
    const matricula = await prisma.$transaction(
      async (tx) => {
        // O aluno serializa confirmações duplicadas e a disputa por horários.
        await tx.$queryRaw`SELECT "id" FROM "Aluno" WHERE "id" = ${alunoId} AND "instituicaoId" = ${user.instituicaoId} FOR UPDATE`;
        const existente = await tx.matricula.findFirst({
          where: {
            chaveContratacaoModalidades: chave,
            instituicaoId: user.instituicaoId,
          },
          select: {
            id: true,
            numeroMatricula: true,
            contratacaoModalidades: true,
            valorMatricula: true,
            valorMensalidade: true,
          },
        });
        if (existente) {
          const snapshot = existente.contratacaoModalidades as Record<
            string,
            unknown
          >;
          if (snapshot?.pedidoHash !== pedidoHash)
            throw new ErroModalidades("CHAVE_REUTILIZADA", 409);
          return existente;
        }
        // Ordem fixa evita deadlock entre duas contratações com as mesmas turmas.
        if (turmaIds.length)
          await tx.$queryRaw(Prisma.sql`SELECT "id" FROM "Turma" WHERE "instituicaoId" = ${user.instituicaoId}
        AND "id" IN (${Prisma.join(turmaIds)}) ORDER BY "id" FOR UPDATE`);
        return confirmarContratacaoModalidades(
          tx,
          user,
          { ...body, chave, pedidoHash },
          request,
        );
      },
      { isolationLevel: "Serializable", maxWait: 5000, timeout: 30000 },
    );
    return NextResponse.json({ matricula }, { status: 201 });
  } catch (error) {
    return erroCombos(error);
  }
}
