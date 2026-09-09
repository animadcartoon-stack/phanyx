import {
  MobilidadeTipoDocumento,
  Prisma,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroMobilidade,
  exigirGerenciamentoMobilidade,
  respostaErroMobilidade,
} from "@/lib/mobilidade-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    id: string;
    requisitoId: string;
  };
};

const TIPOS_DOCUMENTO = new Set(
  Object.values(MobilidadeTipoDocumento)
);

function idValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function tipoValido(
  valor: unknown
): MobilidadeTipoDocumento | null {
  return typeof valor === "string" &&
    TIPOS_DOCUMENTO.has(
      valor as MobilidadeTipoDocumento
    )
    ? valor as MobilidadeTipoDocumento
    : null;
}

function tituloValido(
  valor: unknown
) {
  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto.length >= 1 &&
    texto.length <= 160
    ? texto
    : null;
}

function textoOpcional(
  valor: unknown,
  maximo = 3000
): string | null | undefined {
  if (
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor !== "string") {
    return undefined;
  }

  const texto = valor.trim();

  if (texto.length > maximo) {
    return undefined;
  }

  return texto || null;
}

function ordemValida(
  valor: unknown
) {
  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero >= 0
    ? numero
    : null;
}

function erroDuplicidade(
  erro: unknown
) {
  return (
    erro instanceof
      Prisma.PrismaClientKnownRequestError &&
    erro.code === "P2002"
  );
}

async function exigirOferta(
  instituicaoId: number,
  ofertaId: number
) {
  const oferta =
    await prisma.mobilidadeOferta.findFirst({
      where: {
        id: ofertaId,
        instituicaoId,
      },
      select: {
        id: true,
      },
    });

  if (!oferta) {
    throw new ErroMobilidade(
      404,
      "OFERTA_NAO_ENCONTRADA",
      "Oferta não encontrada."
    );
  }
}

async function exigirRequisito(
  instituicaoId: number,
  ofertaId: number,
  requisitoId: number
) {
  const requisito =
    await prisma
      .mobilidadeOfertaDocumentoRequisito
      .findFirst({
        where: {
          id: requisitoId,
          instituicaoId,
          ofertaId,
        },
      });

  if (!requisito) {
    throw new ErroMobilidade(
      404,
      "REQUISITO_NAO_ENCONTRADO",
      "Documento não encontrado."
    );
  }

  return requisito;
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroMobilidade(erro);

  return NextResponse.json(
    resposta.corpo,
    {
      status: resposta.status,
    }
  );
}

/* =========================================================
   PATCH
   ========================================================= */

export async function PATCH(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.ofertas.gerenciar"
      );

    const ofertaId =
      idValido(params.id);

    const requisitoId =
      idValido(
        params.requisitoId
      );

    if (
      !ofertaId ||
      !requisitoId
    ) {
      throw new ErroMobilidade(
        400,
        "IDENTIFICADOR_INVALIDO",
        "Identificador inválido."
      );
    }

    await exigirOferta(
      instituicaoId,
      ofertaId
    );

    await exigirRequisito(
      instituicaoId,
      ofertaId,
      requisitoId
    );

    const corpo =
      await request
        .json()
        .catch(() => null);

    if (
      !corpo ||
      typeof corpo !== "object" ||
      Array.isArray(corpo)
    ) {
      throw new ErroMobilidade(
        400,
        "CORPO_INVALIDO",
        "Dados inválidos."
      );
    }

    const fonte =
      corpo as Record<
        string,
        unknown
      >;

    const dados: {
      tipo?: MobilidadeTipoDocumento;
      titulo?: string;
      descricao?: string | null;
      obrigatorio?: boolean;
      exigeValidade?: boolean;
      ordem?: number;
      ativo?: boolean;
    } = {};

    if (
      fonte.tipo !== undefined
    ) {
      const tipo =
        tipoValido(
          fonte.tipo
        );

      if (!tipo) {
        throw new ErroMobilidade(
          400,
          "TIPO_DOCUMENTO_INVALIDO",
          "Tipo de documento inválido."
        );
      }

      dados.tipo = tipo;
    }

    if (
      fonte.titulo !== undefined
    ) {
      const titulo =
        tituloValido(
          fonte.titulo
        );

      if (!titulo) {
        throw new ErroMobilidade(
          400,
          "TITULO_INVALIDO",
          "Título inválido."
        );
      }

      dados.titulo = titulo;
    }

    if (
      fonte.descricao !== undefined
    ) {
      const descricao =
        textoOpcional(
          fonte.descricao
        );

      if (
        descricao === undefined
      ) {
        throw new ErroMobilidade(
          400,
          "DESCRICAO_INVALIDA",
          "Descrição inválida."
        );
      }

      dados.descricao =
        descricao;
    }

    if (
      fonte.obrigatorio !== undefined
    ) {
      if (
        typeof fonte.obrigatorio !==
        "boolean"
      ) {
        throw new ErroMobilidade(
          400,
          "OBRIGATORIO_INVALIDO",
          "Valor inválido."
        );
      }

      dados.obrigatorio =
        fonte.obrigatorio;
    }

    if (
      fonte.exigeValidade !== undefined
    ) {
      if (
        typeof fonte.exigeValidade !==
        "boolean"
      ) {
        throw new ErroMobilidade(
          400,
          "VALIDADE_INVALIDA",
          "Valor inválido."
        );
      }

      dados.exigeValidade =
        fonte.exigeValidade;
    }

    if (
      fonte.ativo !== undefined
    ) {
      if (
        typeof fonte.ativo !==
        "boolean"
      ) {
        throw new ErroMobilidade(
          400,
          "ATIVO_INVALIDO",
          "Valor inválido."
        );
      }

      dados.ativo =
        fonte.ativo;
    }

    if (
      fonte.ordem !== undefined
    ) {
      const ordem =
        ordemValida(
          fonte.ordem
        );

      if (
        ordem === null
      ) {
        throw new ErroMobilidade(
          400,
          "ORDEM_INVALIDA",
          "Ordem inválida."
        );
      }

      dados.ordem = ordem;
    }

    if (
      Object.keys(
        dados
      ).length === 0
    ) {
      throw new ErroMobilidade(
        400,
        "SEM_ALTERACOES",
        "Nenhuma alteração informada."
      );
    }

    try {
      const requisito =
        await prisma
          .mobilidadeOfertaDocumentoRequisito
          .update({
            where: {
              id: requisitoId,
            },
            data: dados,
          });

      return NextResponse.json({
        ok: true,
        requisito,
      });
    }
    catch (erro) {
      if (
        erroDuplicidade(erro)
      ) {
        throw new ErroMobilidade(
          409,
          "REQUISITO_DUPLICADO",
          "Documento já cadastrado para esta oferta."
        );
      }

      throw erro;
    }
  }
  catch (erro) {
    return responderErro(erro);
  }
}

/* =========================================================
   DELETE
   ========================================================= */

export async function DELETE(
  _request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.ofertas.gerenciar"
      );

    const ofertaId =
      idValido(params.id);

    const requisitoId =
      idValido(
        params.requisitoId
      );

    if (
      !ofertaId ||
      !requisitoId
    ) {
      throw new ErroMobilidade(
        400,
        "IDENTIFICADOR_INVALIDO",
        "Identificador inválido."
      );
    }

    await exigirOferta(
      instituicaoId,
      ofertaId
    );

    const resultado =
      await prisma
        .mobilidadeOfertaDocumentoRequisito
        .deleteMany({
          where: {
            id: requisitoId,
            instituicaoId,
            ofertaId,
          },
        });

    if (
      resultado.count === 0
    ) {
      throw new ErroMobilidade(
        404,
        "REQUISITO_NAO_ENCONTRADO",
        "Documento não encontrado."
      );
    }

    return NextResponse.json({
      ok: true,
      removido: true,
    });
  }
  catch (erro) {
    return responderErro(erro);
  }
}
