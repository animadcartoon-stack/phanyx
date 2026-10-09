import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_MATRICULA = new Set([
  "ATIVA",
  "TRANCADA",
  "CANCELADA",
  "CONCLUIDA",
  "A_INICIAR",
  "SUSPENSA",
  "AGUARDANDO",
  "TRANSFERIDA",
  "INTERCAMBIO",
]);

function inteiroPositivo(valor: string | null, padrao: number) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : padrao;
}

function dataValida(valor: string | null) {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

export async function GET(request: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const role = String(user.role || "").toUpperCase();
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const instituicaoId = Number(user.instituicaoId);
    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const pagina = inteiroPositivo(searchParams.get("page"), 1);
    const limite = Math.min(inteiroPositivo(searchParams.get("limit"), 25), 100);
    const quarentena = searchParams.get("quarentena") === "1";
    const busca = String(searchParams.get("busca") || "").trim().slice(0, 100);
    const status = String(searchParams.get("status") || "TODOS").trim().toUpperCase();
    const inicio = dataValida(searchParams.get("inicio"));
    const fim = dataValida(searchParams.get("fim"));

    const where: any = {
      instituicaoId,
      excluidaEm: quarentena ? { not: null } : null,
    };

    if (status !== "TODOS" && STATUS_MATRICULA.has(status)) {
      where.status = status;
    }

    if (inicio || fim) {
      const campoData = quarentena ? "excluidaEm" : "createdAt";
      where[campoData] = {
        ...(inicio ? { gte: inicio } : {}),
        ...(fim ? { lt: fim } : {}),
      };
    }

    if (busca) {
      const termo = {
        contains: busca,
        mode: "insensitive" as const,
      };

      const buscaMaiuscula = busca.toUpperCase();
      const buscaNumero = Number(busca);
      const or: any[] = [
        { aluno: { nome: termo } },
        { aluno: { nomeSocial: termo } },
        { curso: { nome: termo } },
        { vendedorResponsavel: { nome: termo } },
        { vendedorResponsavelNomeSnapshot: termo },
        {
          itens: {
            some: {
              OR: [
                { disciplina: { nome: termo } },
                { turma: { nome: termo } },
                { turma: { professor: { nome: termo } } },
              ],
            },
          },
        },
      ];

      if (Number.isInteger(buscaNumero) && buscaNumero > 0) {
        or.push({ id: buscaNumero }, { semestre: buscaNumero });
      }

      if (STATUS_MATRICULA.has(buscaMaiuscula)) {
        or.push({ status: buscaMaiuscula });
      }

      where.OR = or;
    }

    const skip = (pagina - 1) * limite;

    const [total, matriculas] = await prisma.$transaction([
      prisma.matricula.count({ where }),
      prisma.matricula.findMany({
        where,
        skip,
        take: limite,
        orderBy: { id: "desc" },
        select: {
          id: true,
          status: true,
          excluidaEm: true,
          excluidaPorId: true,
          motivoExclusao: true,
          periodoLetivo: true,
          modalidade: true,
          semestre: true,
          valorMatricula: true,
          valorMensalidade: true,
          bolsaPercentual: true,
          quantidadeMensalidades: true,
          primeiroVencimento: true,
          vendedorResponsavelId: true,
          vendedorResponsavelNomeSnapshot: true,
          tipoContratacao: true,
          createdAt: true,
          aluno: {
            select: {
              id: true,
              nome: true,
              nomeSocial: true,
              genero: true,
            },
          },
          curso: {
            select: {
              id: true,
              nome: true,
            },
          },
          turmaPrincipal: {
            select: {
              id: true,
              nome: true,
              cursoId: true,
              semestre: true,
              professor: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          disciplinasContratadas: {
            select: {
              disciplinaId: true,
            },
          },
          vendedorResponsavel: {
            select: {
              id: true,
              nome: true,
              cargo: true,
              departamento: {
                select: {
                  id: true,
                  nome: true,
                },
              },
            },
          },
          itens: {
            select: {
              id: true,
              status: true,
              tipoItem: true,
              disciplina: {
                select: {
                  id: true,
                  nome: true,
                  cursoId: true,
                  semestre: true,
                },
              },
              turma: {
                select: {
                  id: true,
                  nome: true,
                  professor: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                  _count: {
                    select: {
                      aulas: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limite));

    return NextResponse.json(
      {
        data: matriculas,
        meta: {
          total,
          page: pagina,
          limit: limite,
          totalPages,
          hasNextPage: pagina < totalPages,
          hasPreviousPage: pagina > 1,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    console.error("Erro ao listar matrículas de forma paginada:", error);
    return NextResponse.json(
      { error: "Erro ao carregar matrículas." },
      { status: 500 },
    );
  }
}
