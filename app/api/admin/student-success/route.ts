import {
  NextResponse,
} from "next/server";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

import {
  obterPainelStudentSuccess,
} from "@/lib/student-success/obter-painel-student-success";

export async function GET() {
  try {
    const user =
      await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "UNAUTHORIZED",
        },
        {
          status: 401,
        }
      );
    }

    const acesso =
      await verificarAcessoStudentSuccess(
        user,
        "VER"
      );

    if (
      acesso.permitido ===
      false
    ) {
      return NextResponse.json(
        {
          error:
            acesso.motivo,
        },
        {
          status: 403,
        }
      );
    }

    const painel =
      await obterPainelStudentSuccess(
        acesso.instituicaoId
      );

    return NextResponse.json(
      painel
    );
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_GET]",
      error
    );

    return NextResponse.json(
      {
        error:
          "STUDENT_SUCCESS_LOAD_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}