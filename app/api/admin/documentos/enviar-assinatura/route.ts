import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";
import {
  ErroEnvioContrato,
  enviarContratoParaAssinatura,
} from "@/lib/contratos/enviar-contrato-assinatura";

export async function POST(req: Request) {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "N\u00e3o autenticado",
        },
        {
          status: 401,
        }
      );
    }

    if (
      user.role !== "ADMIN" &&
      user.role !== "SUPER_ADMIN" &&
      user.role !== "SECRETARIA" &&
      user.role !== "COORDENADOR"
    ) {
      return NextResponse.json(
        {
          error:
            "Sem permiss\u00e3o",
        },
        {
          status: 403,
        }
      );
    }

    const body =
      await req.json();

    const contratoId =
      Number(
        body?.contratoId
      );

    if (!contratoId) {
      return NextResponse.json(
        {
          error:
            "Contrato inv\u00e1lido",
        },
        {
          status: 400,
        }
      );
    }

    const resultado =
      await enviarContratoParaAssinatura({
        contratoId,
        instituicaoId:
          user.instituicaoId!,
      });

    return NextResponse.json({
      ok: true,
      message:
        "E-mail de assinatura enviado com sucesso",
      linkAssinatura:
        resultado.linkAssinatura,
    });
  } catch (error: any) {
    console.error(
      "Erro ao enviar assinatura:",
      error
    );

    const status =
      error instanceof
        ErroEnvioContrato
        ? error.status
        : 500;

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao enviar assinatura",
      },
      {
        status,
      }
    );
  }
}