import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function lerDepartamentoId(valor: string | null) {
  if (!valor) return null;

  const id = Number(valor);

  return Number.isInteger(id) && id > 0
    ? id
    : null;
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    /*
     * O CRM global da PHANYX não possui funcionários vinculados
     * a uma instituição gestora.
     */
    if (user.isMasterAdmin && !user.instituicaoId) {
      return NextResponse.json([]);
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "O usuário não está vinculado a uma instituição.",
        },
        { status: 403 }
      );
    }

    const podeConsultarResponsaveis =
      temAlgumaPermissao(user, [
        "comercial.leads.ver",
        "comercial.leads.criar",
        "comercial.leads.editar",
        "comercial.leads.atribuir",
        "comercial.vendedores.ver",
        "comercial.vendedores.gerenciar",
      ]);

    if (!podeConsultarResponsaveis) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para consultar responsáveis comerciais.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);

    const busca = String(
      searchParams.get("q") || ""
    ).trim();

    const departamentoId = lerDepartamentoId(
      searchParams.get("departamentoId")
    );

    const where: Prisma.FuncionarioWhereInput = {
      instituicaoId: user.instituicaoId,
      ativo: true,
      statusFuncionario: "ATIVO",
    };

    if (departamentoId) {
      where.departamentoId = departamentoId;
    }

    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          cargo: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          setor: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          departamento: {
            nome: {
              contains: busca,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const funcionarios =
      await prisma.funcionario.findMany({
        where,

        select: {
          id: true,
          nome: true,
          cargo: true,
          setor: true,
          userId: true,

          departamento: {
            select: {
              id: true,
              nome: true,
            },
          },
        },

        orderBy: [
          {
            departamento: {
              nome: "asc",
            },
          },
          {
            nome: "asc",
          },
        ],
      });

    return NextResponse.json(
      funcionarios.map((funcionario) => ({
        id: funcionario.id,
        nome: funcionario.nome,
        cargo: funcionario.cargo,
        setor: funcionario.setor,
        departamento: funcionario.departamento,
        possuiAcessoAoSistema:
          funcionario.userId !== null,
      }))
    );
  } catch (error) {
    console.error(
      "Erro ao carregar responsáveis por leads:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os responsáveis comerciais.",
      },
      { status: 500 }
    );
  }
}