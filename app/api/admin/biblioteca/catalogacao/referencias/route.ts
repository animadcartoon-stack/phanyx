import {
  AcaoAuditoriaBiblioteca,
} from "@prisma/client";
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
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function responderErro(
  erro: unknown
) {
  if (erro instanceof ErroBiblioteca) {
    const resposta =
      respostaErroBiblioteca(
        erro
      );

    return responder(
      resposta.corpo,
      resposta.status
    );
  }

  console.error(
    "[biblioteca/catalogacao/referencias]",
    erro
  );

  return responder(
    {
      error:
        "Não foi possível processar os registros bibliográficos.",
      codigo: "ERRO_INTERNO",
    },
    500
  );
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

function textoObrigatorio(
  valor: unknown,
  limite: number
) {
  if (
    typeof valor !== "string" ||
    !valor.trim()
  ) {
    falhar(
      400,
      "O nome é obrigatório.",
      "NOME_OBRIGATORIO"
    );
  }

  const texto =
    valor.trim();

  if (texto.length > limite) {
    falhar(
      400,
      "O nome ultrapassa o limite permitido.",
      "NOME_MUITO_LONGO"
    );
  }

  return texto;
}

function textoOpcional(
  valor: unknown,
  limite: number
) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(
      400,
      "O valor informado é inválido.",
      "CAMPO_INVALIDO"
    );
  }

  const texto =
    valor.trim();

  if (!texto) {
    return null;
  }

  if (texto.length > limite) {
    falhar(
      400,
      "O valor ultrapassa o limite permitido.",
      "CAMPO_MUITO_LONGO"
    );
  }

  return texto;
}

function criarSlug(
  valor: string
) {
  return valor
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    )
    .slice(0, 180);
}

export async function GET() {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.ver"
    );

    const [
      autores,
      editoras,
      categorias,
    ] =
      await Promise.all([
        prisma.bibliotecaAutor.findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            ativo: true,
          },

          orderBy: [
            {
              nomeOrdenacao:
                "asc",
            },
            {
              nome:
                "asc",
            },
          ],

          select: {
            id: true,
            nome: true,
            nomeOrdenacao: true,
            codigoCutterBase: true,
            orcid: true,
          },
        }),

        prisma.bibliotecaEditora.findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            ativo: true,
          },

          orderBy: {
            nome:
              "asc",
          },

          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true,
            pais: true,
          },
        }),

        prisma.bibliotecaCategoria.findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            ativo: true,
          },

          orderBy: [
            {
              ordem:
                "asc",
            },
            {
              nome:
                "asc",
            },
          ],

          select: {
            id: true,
            nome: true,
            slug: true,
            cor: true,
            icone: true,
            categoriaPaiId: true,
          },
        }),
      ]);

    return responder({
      ok: true,
      autores,
      editoras,
      categorias,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido alterar a catalogação durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.editar"
    );

    const corpo =
      await request.json();

    const tipo =
      String(
        corpo?.tipo || ""
      )
        .trim()
        .toUpperCase();

    const nome =
      textoObrigatorio(
        corpo?.nome,
        240
      );

    const ip =
      request.headers
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ||
      request.headers
        .get("x-real-ip") ||
      null;

    const userAgent =
      request.headers
        .get("user-agent")
        ?.slice(0, 2_000) ||
      null;

    if (tipo === "AUTOR") {
      const existente =
        await prisma.bibliotecaAutor.findFirst({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            nome: {
              equals:
                nome,
              mode:
                "insensitive",
            },
          },

          select: {
            id: true,
            nome: true,
            nomeOrdenacao: true,
            codigoCutterBase: true,
            orcid: true,
            ativo: true,
          },
        });

      if (existente) {
        return responder({
          ok: true,
          existente: true,
          registro:
            existente,
        });
      }

      const registro =
        await prisma.bibliotecaAutor.create({
          data: {
            instituicaoId:
              contexto.instituicaoId,

            nome,

            nomeOrdenacao:
              textoOpcional(
                corpo?.nomeOrdenacao,
                240
              ),

            orcid:
              textoOpcional(
                corpo?.orcid,
                40
              ),
          },

          select: {
            id: true,
            nome: true,
            nomeOrdenacao: true,
            codigoCutterBase: true,
            orcid: true,
          },
        });

      await prisma.bibliotecaAuditoria.create({
        data: {
          instituicaoId:
            contexto.instituicaoId,
          usuarioId:
            usuario.id,
          entidade:
            "BibliotecaAutor",
          entidadeId:
            String(registro.id),
          acao:
            AcaoAuditoriaBiblioteca.CRIAR,
          descricao:
            "Autor cadastrado para catalogação bibliográfica.",
          dadosPosteriores:
            registro,
          metadados: {
            origem:
              "catalogacao_referencias",
          },
          ip,
          userAgent,
        },
      });

      return responder(
        {
          ok: true,
          registro,
        },
        201
      );
    }

    if (tipo === "EDITORA") {
      const existente =
        await prisma.bibliotecaEditora.findFirst({
          where: {
            instituicaoId:
              contexto.instituicaoId,
            nome: {
              equals:
                nome,
              mode:
                "insensitive",
            },
          },

          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true,
            pais: true,
            ativo: true,
          },
        });

      if (existente) {
        return responder({
          ok: true,
          existente: true,
          registro:
            existente,
        });
      }

      const registro =
        await prisma.bibliotecaEditora.create({
          data: {
            instituicaoId:
              contexto.instituicaoId,

            nome,

            cidade:
              textoOpcional(
                corpo?.cidade,
                120
              ),

            estado:
              textoOpcional(
                corpo?.estado,
                120
              ),

            pais:
              textoOpcional(
                corpo?.pais,
                120
              ),
          },

          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true,
            pais: true,
          },
        });

      await prisma.bibliotecaAuditoria.create({
        data: {
          instituicaoId:
            contexto.instituicaoId,
          usuarioId:
            usuario.id,
          entidade:
            "BibliotecaEditora",
          entidadeId:
            String(registro.id),
          acao:
            AcaoAuditoriaBiblioteca.CRIAR,
          descricao:
            "Editora cadastrada para catalogação bibliográfica.",
          dadosPosteriores:
            registro,
          metadados: {
            origem:
              "catalogacao_referencias",
          },
          ip,
          userAgent,
        },
      });

      return responder(
        {
          ok: true,
          registro,
        },
        201
      );
    }

    if (tipo === "CATEGORIA") {
      let slug =
        criarSlug(nome);

      if (!slug) {
        slug =
          `assunto-${Date.now()}`;
      }

      const existente =
        await prisma.bibliotecaCategoria.findFirst({
          where: {
            instituicaoId:
              contexto.instituicaoId,

            OR: [
              {
                nome: {
                  equals:
                    nome,
                  mode:
                    "insensitive",
                },
              },
              {
                slug,
              },
            ],
          },

          select: {
            id: true,
            nome: true,
            slug: true,
            cor: true,
            icone: true,
            ativo: true,
          },
        });

      if (existente) {
        return responder({
          ok: true,
          existente: true,
          registro:
            existente,
        });
      }

      const registro =
        await prisma.bibliotecaCategoria.create({
          data: {
            instituicaoId:
              contexto.instituicaoId,

            nome,
            slug,

            descricao:
              textoOpcional(
                corpo?.descricao,
                2_000
              ),
          },

          select: {
            id: true,
            nome: true,
            slug: true,
            cor: true,
            icone: true,
          },
        });

      await prisma.bibliotecaAuditoria.create({
        data: {
          instituicaoId:
            contexto.instituicaoId,
          usuarioId:
            usuario.id,
          entidade:
            "BibliotecaCategoria",
          entidadeId:
            String(registro.id),
          acao:
            AcaoAuditoriaBiblioteca.CRIAR,
          descricao:
            "Assunto/categoria cadastrado para catalogação bibliográfica.",
          dadosPosteriores:
            registro,
          metadados: {
            origem:
              "catalogacao_referencias",
          },
          ip,
          userAgent,
        },
      });

      return responder(
        {
          ok: true,
          registro,
        },
        201
      );
    }

    falhar(
      400,
      "Tipo de registro bibliográfico inválido.",
      "TIPO_REFERENCIA_INVALIDO"
    );
  } catch (erro) {
    return responderErro(erro);
  }
}
