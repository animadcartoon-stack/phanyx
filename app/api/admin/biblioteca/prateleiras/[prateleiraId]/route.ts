import {
  AcaoAuditoriaBiblioteca,
  BibliotecaPrateleira,
  Prisma,
  TipoPrateleiraBiblioteca,
  VisibilidadePrateleiraBiblioteca,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Parametros = {
  params: {
    prateleiraId: string;
  };
};

const TIPOS_ADMIN = new Set<TipoPrateleiraBiblioteca>([
  TipoPrateleiraBiblioteca.INSTITUCIONAL,
  TipoPrateleiraBiblioteca.DIDATICA,
  TipoPrateleiraBiblioteca.DESTAQUE,
  TipoPrateleiraBiblioteca.TEMATICA,
]);

const VISIBILIDADES = new Set<VisibilidadePrateleiraBiblioteca>(
  Object.values(VisibilidadePrateleiraBiblioteca),
);

const PRATELEIRA_SELECT = {
  id: true,
  instituicaoId: true,
  nome: true,
  descricao: true,
  tipo: true,
  visibilidade: true,
  slug: true,
  capaUrl: true,
  cor: true,
  icone: true,
  ordem: true,
  destaque: true,
  ativa: true,
  criadoEm: true,
  atualizadoEm: true,
  criadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  atualizadoPor: {
    select: {
      id: true,
      nome: true,
      email: true,
    },
  },
  _count: {
    select: {
      itens: true,
    },
  },
} as const;

type CamposSnapshot = Pick<
  BibliotecaPrateleira,
  | "nome"
  | "descricao"
  | "tipo"
  | "visibilidade"
  | "slug"
  | "capaUrl"
  | "cor"
  | "icone"
  | "ordem"
  | "destaque"
  | "ativa"
>;

function responder(corpo: unknown, status = 200) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string,
): never {
  throw new ErroBiblioteca(status, mensagem, codigo);
}

function responderErro(erro: unknown) {
  const resposta = respostaErroBiblioteca(erro);
  return responder(resposta.corpo, resposta.status);
}

function obterId(params: Parametros["params"]) {
  const texto = params.prateleiraId;

  if (!/^[1-9]\d*$/.test(texto)) {
    falhar(
      400,
      "O identificador da prateleira \u00e9 inv\u00e1lido.",
      "PRATELEIRA_ID_INVALIDO",
    );
  }

  const id = Number(texto);

  if (!Number.isSafeInteger(id)) {
    falhar(
      400,
      "O identificador da prateleira \u00e9 inv\u00e1lido.",
      "PRATELEIRA_ID_INVALIDO",
    );
  }

  return id;
}

async function lerCorpo(request: NextRequest) {
  try {
    const corpo = await request.json();

    if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
      falhar(
        400,
        "O corpo da requisi\u00e7\u00e3o deve ser um objeto JSON v\u00e1lido.",
        "CORPO_INVALIDO",
      );
    }

    return corpo as Record<string, unknown>;
  } catch (erro) {
    if (erro instanceof ErroBiblioteca) {
      throw erro;
    }

    falhar(
      400,
      "O corpo da requisi\u00e7\u00e3o cont\u00e9m um JSON inv\u00e1lido.",
      "JSON_INVALIDO",
    );
  }
}

function textoObrigatorio(valor: unknown, campo: string, limite: number) {
  if (typeof valor !== "string" || !valor.trim()) {
    falhar(400, `O campo ${campo} \u00e9 obrigat\u00f3rio.`, "CAMPO_OBRIGATORIO");
  }

  const texto = valor.trim();

  if (texto.length > limite) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto;
}

function textoOpcional(valor: unknown, campo: string, limite: number) {
  if (valor === null || valor === "") {
    return null;
  }

  if (typeof valor !== "string") {
    falhar(400, `O campo ${campo} deve ser um texto.`, "CAMPO_INVALIDO");
  }

  const texto = valor.trim();

  if (texto.length > limite) {
    falhar(
      400,
      `O campo ${campo} ultrapassa o limite permitido.`,
      "CAMPO_MUITO_LONGO",
    );
  }

  return texto || null;
}

function booleano(valor: unknown, campo: string) {
  if (typeof valor !== "boolean") {
    falhar(
      400,
      `O campo ${campo} deve ser verdadeiro ou falso.`,
      "CAMPO_BOOLEANO_INVALIDO",
    );
  }

  return valor;
}

function ordemValida(valor: unknown) {
  if (
    (typeof valor !== "number" && typeof valor !== "string") ||
    !/^\d+$/.test(String(valor).trim())
  ) {
    falhar(
      400,
      "O campo ordem deve ser um inteiro maior ou igual a zero.",
      "ORDEM_INVALIDA",
    );
  }

  const ordem = Number(valor);

  if (!Number.isSafeInteger(ordem)) {
    falhar(
      400,
      "O campo ordem deve ser um inteiro maior ou igual a zero.",
      "ORDEM_INVALIDA",
    );
  }

  return ordem;
}

function tipoValido(valor: unknown) {
  const tipo = String(valor ?? "")
    .trim()
    .toUpperCase() as TipoPrateleiraBiblioteca;

  if (!TIPOS_ADMIN.has(tipo)) {
    falhar(
      400,
      "O tipo informado \u00e9 inv\u00e1lido para a Central administrativa.",
      "TIPO_PRATELEIRA_INVALIDO",
    );
  }

  return tipo;
}

function visibilidadeValida(valor: unknown) {
  const visibilidade = String(valor ?? "")
    .trim()
    .toUpperCase() as VisibilidadePrateleiraBiblioteca;

  if (!VISIBILIDADES.has(visibilidade)) {
    falhar(
      400,
      "A visibilidade informada \u00e9 inv\u00e1lida.",
      "VISIBILIDADE_INVALIDA",
    );
  }

  if (visibilidade === VisibilidadePrateleiraBiblioteca.PRIVADA) {
    falhar(
      400,
      "Prateleiras privadas pertencem \u00e0 \u00e1rea pessoal do usu\u00e1rio.",
      "VISIBILIDADE_PRIVADA_NAO_PERMITIDA",
    );
  }

  return visibilidade;
}

function obterIp(request: NextRequest) {
  const encaminhado = request.headers.get("x-forwarded-for");
  const candidato =
    encaminhado?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  return candidato ? candidato.slice(0, 255) : null;
}

function obterUserAgent(request: NextRequest) {
  const valor = request.headers.get("user-agent");
  return valor ? valor.slice(0, 4000) : null;
}

function snapshot(item: CamposSnapshot) {
  return {
    nome: item.nome,
    descricao: item.descricao,
    tipo: item.tipo,
    visibilidade: item.visibilidade,
    slug: item.slug,
    capaUrl: item.capaUrl,
    cor: item.cor,
    icone: item.icone,
    ordem: item.ordem,
    destaque: item.destaque,
    ativa: item.ativa,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: Parametros,
) {
  try {
    const id = obterId(params);
    const usuario = await getUserFromToken();

    if (!usuario) {
      falhar(401, "Usu\u00e1rio n\u00e3o autenticado.", "NAO_AUTENTICADO");
    }

    const contexto = await obterContextoBiblioteca(usuario);

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const prateleira = await prisma.bibliotecaPrateleira.findFirst({
      where: {
        id,
        instituicaoId: contexto.instituicaoId,
        tipo: {
          not: TipoPrateleiraBiblioteca.PESSOAL,
        },
      },
      select: PRATELEIRA_SELECT,
    });

    if (!prateleira) {
      falhar(404, "Prateleira n\u00e3o encontrada.", "PRATELEIRA_NAO_ENCONTRADA");
    }

    return responder({
      success: true,
      prateleira,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: Parametros,
) {
  try {
    const id = obterId(params);
    const usuario = await getUserFromToken();

    if (!usuario) {
      falhar(401, "Usu\u00e1rio n\u00e3o autenticado.", "NAO_AUTENTICADO");
    }

    const contexto = await obterContextoBiblioteca(usuario);

    if (usuario.impersonacao) {
      falhar(
        403,
        "N\u00e3o \u00e9 permitido editar prateleiras durante uma sess\u00e3o de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.prateleiras.gerenciar",
    );

    const corpo = await lerCorpo(request);
    const dados: Prisma.BibliotecaPrateleiraUncheckedUpdateInput = {};

    if (corpo.nome !== undefined) {
      dados.nome = textoObrigatorio(corpo.nome, "nome", 180);
    }

    if (corpo.descricao !== undefined) {
      dados.descricao = textoOpcional(corpo.descricao, "descricao", 10000);
    }

    if (corpo.tipo !== undefined) {
      dados.tipo = tipoValido(corpo.tipo);
    }

    if (corpo.visibilidade !== undefined) {
      dados.visibilidade = visibilidadeValida(corpo.visibilidade);
    }

    if (corpo.capaUrl !== undefined) {
      dados.capaUrl = textoOpcional(corpo.capaUrl, "capaUrl", 2000);
    }

    if (corpo.cor !== undefined) {
      dados.cor = textoOpcional(corpo.cor, "cor", 100);
    }

    if (corpo.icone !== undefined) {
      dados.icone = textoOpcional(corpo.icone, "icone", 100);
    }

    if (corpo.ordem !== undefined) {
      dados.ordem = ordemValida(corpo.ordem);
    }

    if (corpo.destaque !== undefined) {
      dados.destaque = booleano(corpo.destaque, "destaque");
    }

    if (corpo.ativa !== undefined) {
      dados.ativa = booleano(corpo.ativa, "ativa");
    }

    if (Object.keys(dados).length === 0) {
      falhar(
        400,
        "Informe ao menos um campo para atualizar.",
        "NENHUMA_ALTERACAO_INFORMADA",
      );
    }

    const prateleira = await prisma.$transaction(async (transacao) => {
      const anterior = await transacao.bibliotecaPrateleira.findFirst({
        where: {
          id,
          instituicaoId: contexto.instituicaoId,
          tipo: {
            not: TipoPrateleiraBiblioteca.PESSOAL,
          },
        },
      });

      if (!anterior) {
        falhar(
          404,
          "Prateleira n\u00e3o encontrada.",
          "PRATELEIRA_NAO_ENCONTRADA",
        );
      }

      const atualizada = await transacao.bibliotecaPrateleira.update({
        where: {
          id_instituicaoId: {
            id,
            instituicaoId: contexto.instituicaoId,
          },
        },
        data: {
          ...dados,
          atualizadoPorId: usuario.id,
        },
        select: PRATELEIRA_SELECT,
      });

      const acao =
        anterior.ativa && !atualizada.ativa
          ? AcaoAuditoriaBiblioteca.ARQUIVAR
          : !anterior.ativa && atualizada.ativa
            ? AcaoAuditoriaBiblioteca.RESTAURAR
            : AcaoAuditoriaBiblioteca.ATUALIZAR;

      const descricao =
        acao === AcaoAuditoriaBiblioteca.ARQUIVAR
          ? "Prateleira da Biblioteca desativada."
          : acao === AcaoAuditoriaBiblioteca.RESTAURAR
            ? "Prateleira da Biblioteca restaurada."
            : "Prateleira da Biblioteca atualizada.";

      await transacao.bibliotecaAuditoria.create({
        data: {
          instituicaoId: contexto.instituicaoId,
          usuarioId: usuario.id,
          entidade: "BibliotecaPrateleira",
          entidadeId: String(id),
          acao,
          descricao,
          dadosAnteriores: snapshot(anterior),
          dadosPosteriores: snapshot(atualizada),
          metadados: {
            origem: "admin.biblioteca.prateleiras",
            metodo: "PATCH",
          },
          ip: obterIp(request),
          userAgent: obterUserAgent(request),
        },
      });

      return atualizada;
    });

    return responder({
      success: true,
      message: "Prateleira atualizada com sucesso.",
      prateleira,
    });
  } catch (erro) {
    return responderErro(erro);
  }
}