import { NextRequest, NextResponse } from "next/server";
import { TipoVersaoCertificado } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";

class ErroApiCertificado extends Error {
  status: number;

  constructor(mensagem: string, status = 400) {
    super(mensagem);
    this.name = "ErroApiCertificado";
    this.status = status;
  }
}

function valorFoiInformado(valor: unknown) {
  return valor !== null && valor !== undefined && valor !== "";
}

function lerIdPositivo(valor: unknown, nomeCampo: string) {
  if (!valorFoiInformado(valor)) {
    return null;
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw new ErroApiCertificado(`${nomeCampo} inválido.`, 400);
  }

  return numero;
}

function normalizarTipoVersao(valor: unknown) {
  const tipo = String(valor || TipoVersaoCertificado.RASCUNHO)
    .trim()
    .toUpperCase();

  if (
    tipo !== TipoVersaoCertificado.RASCUNHO &&
    tipo !== TipoVersaoCertificado.PUBLICADO
  ) {
    throw new ErroApiCertificado(
      "Tipo de versão do certificado inválido.",
      400
    );
  }

  return tipo as TipoVersaoCertificado;
}

async function obterUsuarioAdmin() {
  const user = await getUserFromToken();

  if (!user || user.role !== "ADMIN") {
    throw new ErroApiCertificado("Não autorizado.", 401);
  }

  if (!user.instituicaoId) {
    throw new ErroApiCertificado(
      "Instituição do usuário não encontrada.",
      400
    );
  }

  return user;
}

async function resolverVersaoAlvo(params: {
  instituicaoId: number;
  versaoIdValor?: unknown;
  modeloIdValor?: unknown;
  tipoVersaoValor?: unknown;
  permitirPublicado: boolean;
}) {
  const versaoId = lerIdPositivo(
    params.versaoIdValor,
    "ID da versão"
  );

  const modeloId = lerIdPositivo(
    params.modeloIdValor,
    "ID do modelo"
  );

  if (versaoId && modeloId) {
    throw new ErroApiCertificado(
      "Informe versaoId ou modeloId, não os dois ao mesmo tempo.",
      400
    );
  }

  /*
   * Sem versaoId ou modeloId, a rota mantém o comportamento legado.
   * Porém, agora filtra somente os campos sem versão vinculada.
   */
  if (!versaoId && !modeloId) {
    return null;
  }

  let versao = null;

  if (versaoId) {
    versao = await prisma.certificadoModeloVersao.findFirst({
      where: {
        id: versaoId,
        modelo: {
          instituicaoId: params.instituicaoId,
        },
      },
      select: {
        id: true,
        modeloId: true,
        tipo: true,
      },
    });
  } else if (modeloId) {
    const tipo = normalizarTipoVersao(params.tipoVersaoValor);

    versao = await prisma.certificadoModeloVersao.findFirst({
      where: {
        modeloId,
        tipo,
        modelo: {
          instituicaoId: params.instituicaoId,
        },
      },
      select: {
        id: true,
        modeloId: true,
        tipo: true,
      },
    });
  }

  if (!versao) {
    throw new ErroApiCertificado(
      "Versão do modelo de certificado não encontrada.",
      404
    );
  }

  if (
    !params.permitirPublicado &&
    versao.tipo === TipoVersaoCertificado.PUBLICADO
  ) {
    throw new ErroApiCertificado(
      "A versão publicada não pode ser editada diretamente. Edite o rascunho e publique novamente.",
      409
    );
  }

  return versao;
}

function responderErro(
  error: unknown,
  mensagemPadrao: string,
  identificadorLog: string
) {
  if (error instanceof ErroApiCertificado) {
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(identificadorLog, error);

  const detalhe =
    error instanceof Error ? error.message : String(error);

  return NextResponse.json(
    {
      error: mensagemPadrao,
      detalhe:
        process.env.NODE_ENV === "development"
          ? detalhe
          : undefined,
    },
    {
      status: 500,
    }
  );
}

export async function GET(req: NextRequest) {
  try {
    const user = await obterUsuarioAdmin();
    const { searchParams } = new URL(req.url);

    const versaoAlvo = await resolverVersaoAlvo({
      instituicaoId: user.instituicaoId,
      versaoIdValor:
        searchParams.get("versaoId") ||
        searchParams.get("certificadoModeloVersaoId"),
      modeloIdValor: searchParams.get("modeloId"),
      tipoVersaoValor: searchParams.get("versao"),
      permitirPublicado: true,
    });

    const campos = await prisma.certificadoCampo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        certificadoModeloVersaoId: versaoAlvo?.id ?? null,
      },
      orderBy: [
        {
          pagina: "asc",
        },
        {
          ordem: "asc",
        },
        {
          id: "asc",
        },
      ],
    });

    return NextResponse.json({
      campos,
      escopo: versaoAlvo
        ? {
            tipo: versaoAlvo.tipo,
            modeloId: versaoAlvo.modeloId,
            versaoId: versaoAlvo.id,
          }
        : {
            tipo: "LEGADO",
            modeloId: null,
            versaoId: null,
          },
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao buscar campos do certificado.",
      "ERRO AO BUSCAR CAMPOS DO CERTIFICADO:"
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await obterUsuarioAdmin();
    const body = await req.json();

    const versaoAlvo = await resolverVersaoAlvo({
      instituicaoId: user.instituicaoId,
      versaoIdValor:
        body?.versaoId ??
        body?.certificadoModeloVersaoId,
      modeloIdValor: body?.modeloId,
      tipoVersaoValor: body?.versao,
      permitirPublicado: false,
    });

    const tipo = String(body?.tipo || "").trim();

    if (!tipo) {
      throw new ErroApiCertificado(
        "Tipo do campo não informado.",
        400
      );
    }

    const campo = await prisma.certificadoCampo.create({
      data: {
        instituicaoId: user.instituicaoId,
        certificadoModeloVersaoId: versaoAlvo?.id ?? null,

        tipo,

        x: Number(body?.x ?? 100),
        y: Number(body?.y ?? 100),
        largura: Number(body?.largura ?? 220),
        altura: Number(body?.altura ?? 40),

        fonte: String(body?.fonte || "Helvetica"),
        tamanho: Number(body?.tamanho ?? 18),
        cor: String(body?.cor || "#1e3a8a"),
        alinhamento: String(body?.alinhamento || "left"),

        pagina: Number(body?.pagina ?? 1),
        ordem:
          body?.ordem !== undefined && body?.ordem !== null
            ? Number(body.ordem)
            : null,

        lineHeight:
          body?.lineHeight !== undefined &&
          body?.lineHeight !== null
            ? Number(body.lineHeight)
            : null,

        marcador:
          typeof body?.marcador === "string"
            ? body.marcador
            : null,

        dadosJson: body?.dadosJson ?? null,
      },
    });

    return NextResponse.json(campo);
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao criar campo do certificado.",
      "ERRO AO CRIAR CAMPO DO CERTIFICADO:"
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await obterUsuarioAdmin();
    const body = await req.json();

    const id = lerIdPositivo(body?.id, "Campo");

    if (!id) {
      throw new ErroApiCertificado("Campo inválido.", 400);
    }

    const campoExistente =
      await prisma.certificadoCampo.findFirst({
        where: {
          id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          certificadoModeloVersao: {
            select: {
              id: true,
              tipo: true,
            },
          },
        },
      });

    if (!campoExistente) {
      throw new ErroApiCertificado(
        "Campo não encontrado.",
        404
      );
    }

    if (
      campoExistente.certificadoModeloVersao?.tipo ===
      TipoVersaoCertificado.PUBLICADO
    ) {
      throw new ErroApiCertificado(
        "A versão publicada não pode ser alterada diretamente.",
        409
      );
    }

    const campoAtualizado =
      await prisma.certificadoCampo.update({
        where: {
          id,
        },
        data: {
          tipo:
            typeof body?.tipo === "string" &&
            body.tipo.trim()
              ? body.tipo.trim()
              : campoExistente.tipo,

          x:
            typeof body?.x === "number"
              ? body.x
              : campoExistente.x,

          y:
            typeof body?.y === "number"
              ? body.y
              : campoExistente.y,

          largura:
            typeof body?.largura === "number"
              ? body.largura
              : campoExistente.largura,

          altura:
            typeof body?.altura === "number"
              ? body.altura
              : campoExistente.altura,

          fonte:
            typeof body?.fonte === "string"
              ? body.fonte
              : campoExistente.fonte,

          tamanho:
            typeof body?.tamanho === "number"
              ? body.tamanho
              : campoExistente.tamanho,

          cor:
            typeof body?.cor === "string"
              ? body.cor
              : campoExistente.cor,

          alinhamento:
            typeof body?.alinhamento === "string"
              ? body.alinhamento
              : campoExistente.alinhamento,

          pagina:
            typeof body?.pagina === "number"
              ? body.pagina
              : campoExistente.pagina,

          ordem:
            body?.ordem === null
              ? null
              : typeof body?.ordem === "number"
                ? body.ordem
                : campoExistente.ordem,

          lineHeight:
            body?.lineHeight === null
              ? null
              : typeof body?.lineHeight === "number"
                ? body.lineHeight
                : campoExistente.lineHeight,

          marcador:
            body?.marcador === null
              ? null
              : typeof body?.marcador === "string"
                ? body.marcador
                : campoExistente.marcador,

          dadosJson:
            body?.dadosJson !== undefined
              ? body.dadosJson
              : campoExistente.dadosJson,
        },
      });

    return NextResponse.json(campoAtualizado);
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao atualizar campo do certificado.",
      "ERRO AO ATUALIZAR CAMPO DO CERTIFICADO:"
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await obterUsuarioAdmin();
    const { searchParams } = new URL(req.url);

    const id = lerIdPositivo(
      searchParams.get("id"),
      "Campo"
    );

    if (!id) {
      throw new ErroApiCertificado("Campo inválido.", 400);
    }

    const campoExistente =
      await prisma.certificadoCampo.findFirst({
        where: {
          id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          certificadoModeloVersao: {
            select: {
              id: true,
              tipo: true,
            },
          },
        },
      });

    if (!campoExistente) {
      throw new ErroApiCertificado(
        "Campo não encontrado.",
        404
      );
    }

    if (
      campoExistente.certificadoModeloVersao?.tipo ===
      TipoVersaoCertificado.PUBLICADO
    ) {
      throw new ErroApiCertificado(
        "A versão publicada não pode ser excluída diretamente.",
        409
      );
    }

    await prisma.certificadoCampo.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao excluir campo do certificado.",
      "ERRO AO EXCLUIR CAMPO DO CERTIFICADO:"
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await obterUsuarioAdmin();
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    const versaoAlvo = await resolverVersaoAlvo({
      instituicaoId: user.instituicaoId,

      versaoIdValor:
        body?.versaoId ??
        body?.certificadoModeloVersaoId ??
        searchParams.get("versaoId") ??
        searchParams.get("certificadoModeloVersaoId"),

      modeloIdValor:
        body?.modeloId ??
        searchParams.get("modeloId"),

      tipoVersaoValor:
        body?.versao ??
        searchParams.get("versao"),

      permitirPublicado: false,
    });

    const camposRecebidos = Array.isArray(body?.campos)
      ? body.campos
      : [];

    const camposValidos = camposRecebidos.filter(
      (campo: any) => {
        if (!campo) return false;
        if (campo.id === -999999) return false;
        if (campo.arrayPreview === true) return false;
        if (campo.idOriginalArray) return false;
        if (!String(campo?.tipo || "").trim()) return false;

        return true;
      }
    );

    const camposParaCriar = camposValidos.map(
      (campo: any, index: number) => {
        const {
          id: _id,
          bancoId: _bancoId,
          tempId: _tempId,
          arrayPreview: _arrayPreview,
          idOriginalArray: _idOriginalArray,

          versaoId: _versaoId,
          modeloId: _modeloId,
          versao: _versao,
          certificadoModeloVersaoId:
            _certificadoModeloVersaoId,

          dadosJson: dadosJsonRecebido,
          ...campoSemControle
        } = campo;

        const dadosJson: any = {
          ...(dadosJsonRecebido || {}),
          ...campoSemControle,
        };

        delete dadosJson.id;
        delete dadosJson.bancoId;
        delete dadosJson.tempId;
        delete dadosJson.arrayPreview;
        delete dadosJson.idOriginalArray;

        delete dadosJson.versaoId;
        delete dadosJson.modeloId;
        delete dadosJson.versao;
        delete dadosJson.certificadoModeloVersaoId;

        return {
          instituicaoId: user.instituicaoId,
          certificadoModeloVersaoId:
            versaoAlvo?.id ?? null,

          tipo: String(campo?.tipo || "").trim(),

          x: Number(campo?.x ?? 100),
          y: Number(campo?.y ?? 100),
          largura: Number(campo?.largura ?? 220),
          altura: Number(campo?.altura ?? 40),

          fonte: String(campo?.fonte || "Helvetica"),
          tamanho: Number(campo?.tamanho ?? 18),
          cor: String(campo?.cor || "#1e3a8a"),
          alinhamento: String(
            campo?.alinhamento || "left"
          ),

          pagina: Number(campo?.pagina ?? 1),
          ordem: Number(campo?.ordem ?? index + 1),

          lineHeight:
            campo?.lineHeight !== undefined &&
            campo?.lineHeight !== null
              ? Number(campo.lineHeight)
              : null,

          marcador:
            typeof campo?.marcador === "string"
              ? campo.marcador
              : null,

          dadosJson,
        };
      }
    );

    const whereEscopo = {
      instituicaoId: user.instituicaoId,
      certificadoModeloVersaoId:
        versaoAlvo?.id ?? null,
    };

    await prisma.$transaction(async (tx) => {
      /*
       * Apaga somente os campos do escopo que está sendo salvo:
       * legado ou uma versão específica.
       */
      await tx.certificadoCampo.deleteMany({
        where: whereEscopo,
      });

      if (camposParaCriar.length > 0) {
        await tx.certificadoCampo.createMany({
          data: camposParaCriar,
        });
      }

      if (versaoAlvo) {
        /*
         * Atualiza as datas do rascunho e do modelo,
         * sem tocar nos certificados emitidos.
         */
        const agora = new Date();

        await tx.certificadoModeloVersao.update({
          where: {
            id: versaoAlvo.id,
          },
          data: {
            atualizadoEm: agora,
          },
        });

        await tx.certificadoModelo.update({
          where: {
            id: versaoAlvo.modeloId,
          },
          data: {
            atualizadoEm: agora,
          },
        });
      } else {
        /*
         * Mantém o comportamento antigo somente quando o editor
         * estiver salvando o certificado legado.
         */
        await tx.certificado.updateMany({
          where: {
            instituicaoId: user.instituicaoId,
          },
          data: {
            arquivoUrl: null,
          },
        });
      }
    });

    const campos = await prisma.certificadoCampo.findMany({
      where: whereEscopo,
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
      totalSalvo: campos.length,

      escopo: versaoAlvo
        ? {
            tipo: versaoAlvo.tipo,
            modeloId: versaoAlvo.modeloId,
            versaoId: versaoAlvo.id,
          }
        : {
            tipo: "LEGADO",
            modeloId: null,
            versaoId: null,
          },

      campos: campos.map((campo: any) => {
        const dados = campo.dadosJson || {};

        return {
          ...campo,
          ...dados,
          id: campo.id,
          bancoId: campo.id,
        };
      }),
    });
  } catch (error: unknown) {
    return responderErro(
      error,
      "Erro ao salvar modelo completo do certificado.",
      "ERRO AO SALVAR MODELO COMPLETO DO CERTIFICADO:"
    );
  }
}