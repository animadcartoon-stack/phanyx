import {
  prisma,
} from "@/lib/prisma";

export type AcaoStudentSuccess =
  | "VER"
  | "GERENCIAR";

type UsuarioStudentSuccess = {
  id: number;

  instituicaoId?:
    | number
    | string
    | null;

  role?:
    | string
    | null;

  isMasterAdmin?:
    boolean;
};

type ResultadoAcessoStudentSuccess =
  | {
      permitido: true;
      instituicaoId: number;
    }
  | {
      permitido: false;
      instituicaoId:
        | number
        | null;

      motivo:
        | "INSTITUTION_NOT_AVAILABLE"
        | "FORBIDDEN";
    };

export async function verificarAcessoStudentSuccess(
  user:
    UsuarioStudentSuccess,
  acao:
    AcaoStudentSuccess
):
  Promise<ResultadoAcessoStudentSuccess> {

  const instituicaoId =
    Number(
      user.instituicaoId
    );

  if (
    !Number.isInteger(
      instituicaoId
    ) ||
    instituicaoId <= 0
  ) {
    return {
      permitido:
        false,

      instituicaoId:
        null,

      motivo:
        "INSTITUTION_NOT_AVAILABLE",
    };
  }

  const role =
    String(
      user.role ?? ""
    ).toUpperCase();

  /*
   * Perfis administrativos com
   * acesso direto ao Student Success.
   */
  const adminGeral =
    role ===
      "ADMIN" ||
    role ===
      "SUPER_ADMIN" ||
    role ===
      "GERENCIA" ||
    user.isMasterAdmin ===
      true;

  if (
    adminGeral
  ) {
    return {
      permitido:
        true,

      instituicaoId,
    };
  }

  /*
   * VER:
   * - *
   * - studentSuccess.ver
   * - studentSuccess.gerenciar
   *
   * GERENCIAR:
   * - *
   * - studentSuccess.gerenciar
   */
  const chavesPermitidas =
    acao ===
    "GERENCIAR"
      ? [
          "*",
          "academico.studentSuccess.gerenciar",
        ]
      : [
          "*",
          "academico.studentSuccess.ver",
          "academico.studentSuccess.gerenciar",
        ];

  const permissoes =
    await prisma
      .departamentoPermissao
      .findMany({
        where: {
          departamento: {
            funcionarios: {
              some: {
                userId:
                  user.id,

                instituicaoId,
              },
            },
          },

          chave: {
            in:
              chavesPermitidas,
          },

          ativo:
            true,
        },

        select: {
          chave:
            true,
        },
      });

  const permitido =
    permissoes.some(
      (
        item
      ) =>
        chavesPermitidas.includes(
          item.chave
        )
    );

  if (
    !permitido
  ) {
    return {
      permitido:
        false,

      instituicaoId,

      motivo:
        "FORBIDDEN",
    };
  }

  return {
    permitido:
      true,

    instituicaoId,
  };
}