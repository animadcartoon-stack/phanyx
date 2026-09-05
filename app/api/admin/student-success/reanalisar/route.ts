import {
  NextResponse,
} from "next/server";

import {
  OrigemAnaliseStudentSuccess,
} from "@prisma/client";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

import {
  reanalisarInstituicaoStudentSuccess,
} from "@/lib/student-success/reanalisar-instituicao-student-success";

export async function POST() {
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
          status:
            401,
        }
      );
    }

    /*
     * Reanalisar e persistir histórico
     * é uma operação de gestão.
     *
     * Permissão somente de leitura
     * não é suficiente.
     */
    const acesso =
      await verificarAcessoStudentSuccess(
        user,
        "GERENCIAR"
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
          status:
            403,
        }
      );
    }

    /*
     * Toda a lógica acadêmica e de
     * persistência fica concentrada
     * no serviço compartilhado.
     *
     * A rota manual apenas informa:
     *
     * - qual instituição;
     * - origem MANUAL;
     * - qual usuário executou.
     */
    const resultado =
      await reanalisarInstituicaoStudentSuccess({
        instituicaoId:
          acesso.instituicaoId,

        origem:
          OrigemAnaliseStudentSuccess
            .MANUAL,

        executadoPorId:
          user.id,
      });

    /*
     * Mantemos exatamente o mesmo
     * formato de resposta já utilizado
     * pelo frontend.
     */
    return NextResponse.json({
      ok:
        true,

      ...resultado,
    });
  }
  catch (error) {
    console.error(
      "[STUDENT_SUCCESS_REANALISAR]",
      error
    );

    return NextResponse.json(
      {
        error:
          "STUDENT_SUCCESS_REANALYSIS_ERROR",
      },
      {
        status:
          500,
      }
    );
  }
}