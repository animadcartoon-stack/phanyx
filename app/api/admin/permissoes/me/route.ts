import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import { obterPermissoesUsuario } from "@/lib/permissoes-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Não autorizado",
        },
        {
          status: 401,
        }
      );
    }

    const permissoes =
      await obterPermissoesUsuario(
        user
      );

    return NextResponse.json({
      permissoes,
    });
  } catch (error: any) {
    console.error(
      "Erro ao buscar permissões:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao buscar permissões",
      },
      {
        status: 500,
      }
    );
  }
}