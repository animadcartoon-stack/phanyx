import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { normalizarPlanosPagamento, ErroPlanosPagamento } from "@/lib/matriculas/planos-pagamento";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { centavos, ErroModalidades } from "@/lib/matriculas/combos";
import { comboPodeSerExcluido } from "@/lib/matriculas/exclusao-combos";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    nome: z.string().trim().min(1).max(120),
    ativo: z.boolean(),
    minimoModalidades: z.number().int().min(2).max(100),
    maximoModalidades: z.number().int().min(2).max(100).nullable(),
    modoPreco: z.enum(["FIXO", "SOMA", "PERCENTUAL"]),
    valorMatricula: z.union([z.string(), z.number()]),
    taxaComoAntecipacao: z.boolean().optional(),
    valorMensalidade: z.union([z.string(), z.number()]).nullable(),
    descontoPercentual: z.union([z.string(), z.number()]).nullable().optional(),
    quantidadeParcelas: z.number().int().min(1).max(120),
    cursoIds: z.array(z.number().int().positive()).min(2).max(100),
    // Ausencia preserva configuracoes de clientes antigos; null limpa explicitamente.
    planosPagamento: z.unknown().optional(),
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
        include: { cursos: true, _count: { select: { matriculas: true } } },
        orderBy: { nome: "asc" },
      }),
      prisma.curso.findMany({
        where: { instituicaoId: user.instituicaoId, excluidoEm: null },
        select: {
          id: true,
          nome: true,
          ativo: true,
          participaCombo: true,
          disponivelComoAdicional: true,
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
        // Conta inclusive matrículas canceladas/arquivadas, sem filtro de status.
        totalMatriculasVinculadas: c._count.matriculas,
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
    const { id, versao, cursoIds, planosPagamento: planosBrutos, ...dados } = parsed.data;
    // Validar no servidor; nunca confiar nos valores formatados pelo formulario.
    const planosValidados = planosBrutos === undefined ? undefined : normalizarPlanosPagamento(planosBrutos);
    const dadosPlanos = planosBrutos === undefined ? {} : {
      planosPagamento: planosValidados
        ? planosValidados as unknown as Prisma.InputJsonValue
        : Prisma.DbNull,
    };
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
    if (dados.taxaComoAntecipacao && valorMatricula <= 0)
      throw new ErroModalidades("VALOR_INVALIDO");
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
          ...dadosPlanos,
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
    if (error instanceof ErroPlanosPagamento) return NextResponse.json(
      { codigo: "PLANOS_PAGAMENTO_INVALIDOS", error: error.message },
      { status: 400 },
    );
    return erroCombos(error);
  }
}
export async function POST(req: Request) {
  return salvar(req, false);
}
export async function PUT(req: Request) {
  return salvar(req, true);
}

// Somente o combo é alterado. Contratos, matrículas e lançamentos permanecem intocados.
// Contrato.matriculaId aponta para a matrícula que referencia ComboModalidades.
const schemaAcaoCombo = z.object({
  id: z.number().int().positive(),
  versao: z.string().min(1),
}).strict();

async function alterarEstadoCombo(req: Request, acao: "EXCLUIR" | "DESATIVAR") {
  try {
    const user = await administradorCombos();
    const parsed = schemaAcaoCombo.safeParse(await req.json());
    if (!parsed.success) throw new ErroModalidades("REGRA_INVALIDA");
    const { id, versao } = parsed.data;
    const esperado = new Date(versao);
    if (Number.isNaN(esperado.getTime())) throw new ErroModalidades("REGRA_INVALIDA");

    const resultado = await prisma.$transaction(async tx => {
      const combo = await tx.comboModalidades.findFirst({
        where: { id, instituicaoId: user.instituicaoId },
        select: { id: true, ativo: true, updatedAt: true },
      });
      if (!combo) throw new ErroModalidades("COMBO_NAO_ENCONTRADO", 404);
      if (combo.updatedAt.getTime() !== esperado.getTime())
        throw new ErroModalidades("DADOS_ALTERADOS", 409);

      if (acao === "DESATIVAR") {
        // PATCH é estritamente unidirecional: não serve para reativar nem editar preço.
        if (combo.ativo) {
          const alterado = await tx.comboModalidades.updateMany({
            where: { id, instituicaoId: user.instituicaoId, updatedAt: esperado },
            data: { ativo: false },
          });
          if (alterado.count !== 1) throw new ErroModalidades("DADOS_ALTERADOS", 409);
        }
        return { codigo: "COMBO_DESATIVADO", id };
      }

      // Jamais excluir mesmo que as matrículas já estejam canceladas ou arquivadas.
      // Contratos são vinculados através das matrículas; verificamos ambos por segurança.
      const [totalMatriculas, totalContratos] = await Promise.all([
        tx.matricula.count({ where: { instituicaoId: user.instituicaoId, comboId: id } }),
        tx.contrato.count({ where: {
          instituicaoId: user.instituicaoId,
          matricula: { is: { instituicaoId: user.instituicaoId, comboId: id } },
        } }),
      ]);
      if (!comboPodeSerExcluido(totalMatriculas, totalContratos))
        throw new ErroModalidades("COMBO_EM_USO", 409, { totalMatriculas, totalContratos });

      // Matricula.comboId tem FK Restrict: uma nova matrícula concorrente também
      // impede a exclusão. Nenhum vínculo financeiro ou contratual é apagado.
      const excluido = await tx.comboModalidades.deleteMany({
        where: { id, instituicaoId: user.instituicaoId, updatedAt: esperado },
      });
      if (excluido.count !== 1) throw new ErroModalidades("DADOS_ALTERADOS", 409);
      return { codigo: "COMBO_EXCLUIDO", id };
    }, { isolationLevel: "Serializable" });

    return NextResponse.json(resultado);
  } catch (error) {
    // Constraint FK: em uma disputa com outra transação, falhar sem apagar histórico.
    const codigo = (error as { code?: string })?.code;
    if (codigo === "P2003" || codigo === "P2014") {
      return NextResponse.json({ codigo: "COMBO_EM_USO" }, { status: 409 });
    }
    return erroCombos(error);
  }
}

export async function DELETE(req: Request) {
  return alterarEstadoCombo(req, "EXCLUIR");
}
export async function PATCH(req: Request) {
  return alterarEstadoCombo(req, "DESATIVAR");
}
