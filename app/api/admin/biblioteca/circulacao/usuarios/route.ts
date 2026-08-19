import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function somenteDigitos(
  valor: string | null | undefined
) {
  return String(valor || "")
    .replace(/\D/g, "");
}

function mascararCpf(
  cpf: string | null | undefined
) {
  const numeros =
    somenteDigitos(cpf);

  if (numeros.length !== 11) {
    return null;
  }

  return `***.${numeros.slice(
    3,
    6
  )}.${numeros.slice(
    6,
    9
  )}-**`;
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return responder(
    resposta.corpo,
    resposta.status
  );
}

/* =========================================================
   GET
   Pesquisa pessoas aptas a serem vinculadas
   como tomadoras de empréstimos da biblioteca.
   ========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.emprestimos.gerenciar"
    );

    const { searchParams } =
      new URL(request.url);

    const termo =
      (
        searchParams.get("q") ||
        ""
      ).trim();

    /*
     * Evita consultar listas enormes
     * enquanto o operador ainda está
     * digitando.
     */
    if (termo.length < 2) {
      return responder({
        ok: true,
        usuarios: [],
      });
    }

    const termoDigitos =
      somenteDigitos(termo);

    const usuarios =
      await prisma.user.findMany({
        where: {
          instituicaoId:
            contexto.instituicaoId,

          ativo: true,

          /*
           * O usuário precisa representar
           * aluno, professor ou funcionário
           * ativo da instituição.
           */
          AND: [
            {
              OR: [
                {
                  aluno: {
                    is: {
                      ativo: true,
                    },
                  },
                },

                {
                  professor: {
                    is: {
                      ativo: true,
                    },
                  },
                },

                {
                  funcionario: {
                    is: {
                      ativo: true,
                    },
                  },
                },
              ],
            },

            {
              OR: [
                {
                  nome: {
                    contains: termo,
                    mode: "insensitive",
                  },
                },

                {
                  email: {
                    contains: termo,
                    mode: "insensitive",
                  },
                },

                {
                  aluno: {
                    is: {
                      OR: [
                        {
                          nome: {
                            contains:
                              termo,
                            mode:
                              "insensitive",
                          },
                        },

                        {
                          matricula: {
                            contains:
                              termo,
                            mode:
                              "insensitive",
                          },
                        },

                        ...(termoDigitos
                          ? [
                              {
                                cpf: {
                                  contains:
                                    termoDigitos,
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },
                },

                {
                  professor: {
                    is: {
                      OR: [
                        {
                          nome: {
                            contains:
                              termo,
                            mode:
                              "insensitive",
                          },
                        },

                        {
                          codigoFuncionario:
                            {
                              contains:
                                termo,
                              mode:
                                "insensitive",
                            },
                        },

                        ...(termoDigitos
                          ? [
                              {
                                cpf: {
                                  contains:
                                    termoDigitos,
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },
                },

                {
                  funcionario: {
                    is: {
                      OR: [
                        {
                          nome: {
                            contains:
                              termo,
                            mode:
                              "insensitive",
                          },
                        },

                        {
                          codigoFuncionario:
                            {
                              contains:
                                termo,
                              mode:
                                "insensitive",
                            },
                        },

                        ...(termoDigitos
                          ? [
                              {
                                cpf: {
                                  contains:
                                    termoDigitos,
                                },
                              },
                            ]
                          : []),
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },

        select: {
          id: true,
          nome: true,
          email: true,
          role: true,

          aluno: {
            select: {
              id: true,
              nome: true,
              matricula: true,
              cpf: true,
              ativo: true,
              statusAluno: true,
            },
          },

          professor: {
            select: {
              id: true,
              nome: true,
              codigoFuncionario: true,
              cpf: true,
              ativo: true,
              statusProfessor: true,
            },
          },

          funcionario: {
            select: {
              id: true,
              nome: true,
              codigoFuncionario: true,
              cpf: true,
              ativo: true,
              statusFuncionario: true,
              cargo: true,
            },
          },
        },

        orderBy: [
          {
            nome: "asc",
          },
          {
            id: "asc",
          },
        ],

        take: 20,
      });

    const resultado =
      usuarios.map(
        (item) => {
          const tipo =
            item.aluno
              ? "ALUNO"
              : item.professor
                ? "PROFESSOR"
                : "FUNCIONARIO";

          const cadastro =
            item.aluno ||
            item.professor ||
            item.funcionario;

          const identificador =
            item.aluno
              ?.matricula ||
            item.professor
              ?.codigoFuncionario ||
            item.funcionario
              ?.codigoFuncionario ||
            null;

          const cpf =
            item.aluno?.cpf ||
            item.professor?.cpf ||
            item.funcionario?.cpf ||
            null;

          return {
            id: item.id,

            nome:
              cadastro?.nome ||
              item.nome,

            email:
              item.email,

            role:
              item.role,

            tipo,

            identificador,

            cpfMascarado:
              mascararCpf(cpf),

            alunoStatus:
              item.aluno
                ?.statusAluno ||
              null,

            professorStatus:
              item.professor
                ?.statusProfessor ||
              null,

            funcionarioStatus:
              item.funcionario
                ?.statusFuncionario ||
              null,

            cargo:
              item.funcionario
                ?.cargo ||
              null,
          };
        }
      );

    return responder({
      ok: true,
      usuarios:
        resultado,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}