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
  exigirAcessoMobilidade,
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
  };
};

const TIPOS_DOCUMENTO = new Set(
  Object.values(MobilidadeTipoDocumento)
);

function idValido(valor: string) {
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
    valor === undefined ||
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

function booleano(
  valor: unknown,
  padrao: boolean
): boolean | undefined {
  if (valor === undefined) {
    return padrao;
  }

  return typeof valor === "boolean"
    ? valor
    : undefined;
}

function ordemValida(
  valor: unknown
): number | null | undefined {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) &&
    numero >= 0
    ? numero
    : undefined;
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
        titulo: true,
        codigo: true,
        status: true,
      },
    });

  if (!oferta) {
    throw new ErroMobilidade(
      404,
      "OFERTA_NAO_ENCONTRADA",
      "Oferta não encontrada."
    );
  }

  return oferta;
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

export async function GET(
  _request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirAcessoMobilidade(
        usuario,
        "mobilidade.ofertas.ver"
      );

    const ofertaId =
      idValido(params.id);

    if (!ofertaId) {
      throw new ErroMobilidade(
        400,
        "OFERTA_INVALIDA",
        "Oferta inválida."
      );
    }

    const oferta =
      await exigirOferta(
        instituicaoId,
        ofertaId
      );

    const requisitos =
      await prisma
        .mobilidadeOfertaDocumentoRequisito
        .findMany({
          where: {
            instituicaoId,
            ofertaId,
          },
          orderBy: [
            {
              ordem: "asc",
            },
            {
              id: "asc",
            },
          ],
        });

    return NextResponse.json({
      ok: true,
      oferta,
      requisitos,
      tiposDisponiveis:
        Object.values(
          MobilidadeTipoDocumento
        ),
    });
  }
  catch (erro) {
    return responderErro(erro);
  }
}

export async function POST(
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

    if (!ofertaId) {
      throw new ErroMobilidade(
        400,
        "OFERTA_INVALIDA",
        "Oferta inválida."
      );
    }

    await exigirOferta(
      instituicaoId,
      ofertaId
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

    const tipo =
      tipoValido(fonte.tipo);

    if (!tipo) {
      throw new ErroMobilidade(
        400,
        "TIPO_DOCUMENTO_INVALIDO",
        "Tipo de documento inválido."
      );
    }

    const titulo =
      tituloValido(fonte.titulo);

    if (!titulo) {
      throw new ErroMobilidade(
        400,
        "TITULO_INVALIDO",
        "Título inválido."
      );
    }

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

    const obrigatorio =
      booleano(
        fonte.obrigatorio,
        true
      );

    const exigeValidade =
      booleano(
        fonte.exigeValidade,
        false
      );

    const ativo =
      booleano(
        fonte.ativo,
        true
      );

    if (
      obrigatorio === undefined ||
      exigeValidade === undefined ||
      ativo === undefined
    ) {
      throw new ErroMobilidade(
        400,
        "CAMPOS_INVALIDOS",
        "Campos inválidos."
      );
    }

    let ordem =
      ordemValida(
        fonte.ordem
      );

    if (
      ordem === undefined
    ) {
      throw new ErroMobilidade(
        400,
        "ORDEM_INVALIDA",
        "Ordem inválida."
      );
    }

    if (ordem === null) {
      const maior =
        await prisma
          .mobilidadeOfertaDocumentoRequisito
          .aggregate({
            where: {
              instituicaoId,
              ofertaId,
            },
            _max: {
              ordem: true,
            },
          });

      ordem =
        (
          maior._max.ordem ??
          0
        ) + 10;
    }

    try {
      const requisito =
        await prisma
          .mobilidadeOfertaDocumentoRequisito
          .create({
            data: {
              instituicaoId,
              ofertaId,
              tipo,
              titulo,
              descricao,
              obrigatorio,
              exigeValidade,
              ordem,
              ativo,
            },
          });

      return NextResponse.json(
        {
          ok: true,
          requisito,
        },
        {
          status: 201,
        }
      );
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
