import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { centavos, ErroModalidades } from "@/lib/matriculas/combos";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    nome: z.string().trim().min(1).max(120),
    ativo: z.boolean(),
    minimoModalidades: z.number().int().min(2).max(100),
    maximoModalidades: z.number().int().min(2).max(100).nullable(),
    modoPreco: z.enum(["FIXO", "SOMA", "PERCENTUAL"]),
    valorMatricula: z.union([z.string(), z.number()]),
    valorMensalidade: z.union([z.string(), z.number()]).nullable(),
    descontoPercentual: z.union([z.string(), z.number()]).nullable().optional(),
    quantidadeParcelas: z.number().int().min(1).max(120),
    cursoIds: z.array(z.number().int().positive()).min(2).max(100),
    id: z.number().int().positive().optional(),
    versao: z.string().optional(),
  })
  .strict();

export async function GET() {
  try {
    const user = await administradorCombos();
    const [combos, cursos] = await Promise.all([
      prisma.comboModalidades.findMany({
        where: { instituicaoId: user.instituicaoId },
        include: { cursos: true },
        orderBy: { nome: "asc" },
      }),
      prisma.curso.findMany({
        where: { instituicaoId: user.instituicaoId, excluidoEm: null },
        select: {
          id: true,
          nome: true,
          ativo: true,
          participaCombo: true,
          valorMatricula: true,
          valorMensalidade: true,
          valorMensalidadeCombo: true,
          quantidadeParcelas: true,
        },
        orderBy: { nome: "asc" },
      }),
    ]);
    return NextResponse.json({
      combos: combos.map((c) => ({
        ...c,
        cursoIds: c.cursos.map((v) => v.cursoId),
      })),
      cursos,
    });
  } catch (error) {
    return erroCombos(error);
  }
}

async function salvar(req: Request, editar: boolean) {
  try {
    const user = await administradorCombos();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) throw new ErroModalidades("REGRA_INVALIDA");
    const { id, versao, cursoIds, ...dados } = parsed.data;
    if (
      (editar && (!id || !versao)) ||
      new Set(cursoIds).size !== cursoIds.length ||
      cursoIds.length < dados.minimoModalidades ||
      (dados.maximoModalidades !== null &&
        dados.maximoModalidades < dados.minimoModalidades)
    ) {
      throw new ErroModalidades("REGRA_INVALIDA");
    }
    const valorMatricula = centavos(dados.valorMatricula) / 100;
    const valorMensalidade =
      dados.modoPreco === "FIXO"
        ? centavos(dados.valorMensalidade) / 100
        : null;
    const descontoPercentual =
      dados.modoPreco === "PERCENTUAL"
        ? centavos(dados.descontoPercentual) / 100
        : null;
    if (descontoPercentual !== null && descontoPercentual > 100)
      throw new ErroModalidades("VALOR_INVALIDO");
    const combo = await prisma.$transaction(
      async (tx) => {
        const homonimo = await tx.comboModalidades.findFirst({
          where: {
            instituicaoId: user.instituicaoId,
            nome: dados.nome,
            ...(editar ? { id: { not: id } } : {}),
          },
          select: { id: true },
        });
        if (homonimo) throw new ErroModalidades("REGISTRO_DUPLICADO", 409);
        const cursos = await tx.curso.findMany({
          where: {
            id: { in: cursoIds },
            instituicaoId: user.instituicaoId,
            ativo: true,
            excluidoEm: null,
            participaCombo: true,
          },
          select: { id: true, valorMensalidadeCombo: true },
        });
        if (cursos.length !== cursoIds.length)
          throw new ErroModalidades("CURSOS_COMBO_INVALIDOS");
        if (
          dados.modoPreco === "SOMA" &&
          cursos.some((c) => c.valorMensalidadeCombo === null)
        ) {
          throw new ErroModalidades("PRECO_COMBO_NAO_CONFIGURADO");
        }
        const data = {
          ...dados,
          valorMatricula,
          valorMensalidade,
          descontoPercentual,
        };
        if (editar) {
          const esperado = new Date(versao);
          if (Number.isNaN(esperado.getTime()))
            throw new ErroModalidades("REGRA_INVALIDA");
          const atualizado = await tx.comboModalidades.updateMany({
            where: {
              id,
              instituicaoId: user.instituicaoId,
              updatedAt: esperado,
            },
            data,
          });
          if (!atualizado.count)
            throw new ErroModalidades("DADOS_ALTERADOS", 409);
          await tx.comboModalidadesCurso.deleteMany({
            where: { comboId: id, instituicaoId: user.instituicaoId },
          });
          await tx.comboModalidadesCurso.createMany({
            data: cursoIds.map((cursoId) => ({
              comboId: id,
              cursoId,
              instituicaoId: user.instituicaoId,
            })),
          });
          return { id };
        }
        return tx.comboModalidades.create({
          data: {
            ...data,
            instituicaoId: user.instituicaoId,
            cursos: { create: cursoIds.map((cursoId) => ({ cursoId })) },
          },
          select: { id: true },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return NextResponse.json(combo, { status: editar ? 200 : 201 });
  } catch (error) {
    return erroCombos(error);
  }
}
export async function POST(req: Request) {
  return salvar(req, false);
}
export async function PUT(req: Request) {
  return salvar(req, true);
}
