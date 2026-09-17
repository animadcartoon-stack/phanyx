import {
  MobilidadeStatusDocumento,
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

const STATUS_VALIDOS =
  new Set(
    Object.values(
      MobilidadeStatusDocumento
    )
  );

const STATUS_ANALISE =
  new Set<MobilidadeStatusDocumento>([
    MobilidadeStatusDocumento.EM_ANALISE,
    MobilidadeStatusDocumento.APROVADO,
    MobilidadeStatusDocumento.REJEITADO,
    MobilidadeStatusDocumento.CORRECAO_SOLICITADA,
    MobilidadeStatusDocumento.EXPIRADO,
  ]);

function idValido(
  valor: string
) {
  const id = Number(valor);

  return Number.isInteger(id) &&
    id > 0
    ? id
    : null;
}

function textoOpcional(
  valor: unknown,
  maximo = 5000
) {
  if (
    typeof valor !== "string"
  ) {
    return null;
  }

  const texto =
    valor.trim();

  return texto
    ? texto.slice(
        0,
        maximo
      )
    : null;
}

function dataOpcional(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  if (
    typeof valor !== "string"
  ) {
    return undefined;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor
    )
  ) {
    return undefined;
  }

  const data =
    new Date(
      `${valor}T00:00:00.000Z`
    );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return undefined;
  }

  const [ano, mes, dia] =
    valor
      .split("-")
      .map(Number);

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() + 1 !== mes ||
    data.getUTCDate() !== dia
  ) {
    return undefined;
  }

  return data;
}

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
      documentoId: string;
    };
  }
) {
  try {
    const usuario =
      await getUserFromToken();

    const instituicaoId =
      exigirGerenciamentoMobilidade(
        usuario,
        "mobilidade.candidaturas.gerenciar"
      );

    const candidaturaId =
      idValido(
        params.id
      );

    const documentoId =
      idValido(
        params.documentoId
      );

    if (
      !candidaturaId ||
      !documentoId
    ) {
      throw new ErroMobilidade(
        400,
        "ID_INVALIDO",
        "Identificação inválida."
      );
    }

    const atual =
      await prisma.mobilidadeCandidaturaDocumento.findFirst({
        where: {
          id:
            documentoId,

          candidaturaId,

          instituicaoId,
        },

        select: {
          id: true,
          status: true,
          arquivoUrl: true,
          exigeValidade: true,
          validadeAte: true,
        },
      });

    if (!atual) {
      throw new ErroMobilidade(
        404,
        "DOCUMENTO_NAO_ENCONTRADO",
        "Documento da candidatura não encontrado."
      );
    }

    const corpo =
      (await req.json()) as Record<
        string,
        unknown
      >;

    const status =
      corpo.status ===
        undefined
        ? atual.status
        : (
            typeof corpo.status ===
              "string" &&
            STATUS_VALIDOS.has(
              corpo.status as
                MobilidadeStatusDocumento
            )
              ? (
                  corpo.status as
                    MobilidadeStatusDocumento
                )
              : null
          );

    if (!status) {
      throw new ErroMobilidade(
        400,
        "STATUS_DOCUMENTO_INVALIDO",
        "Situação do documento inválida."
      );
    }

    if (
      status !==
        MobilidadeStatusDocumento.NAO_ENVIADO &&
      !atual.arquivoUrl
    ) {
      throw new ErroMobilidade(
        400,
        "DOCUMENTO_NAO_ENVIADO",
        "O documento ainda não foi enviado."
      );
    }

    const validadeAte =
      Object.prototype.hasOwnProperty.call(
        corpo,
        "validadeAte"
      )
        ? dataOpcional(
            corpo.validadeAte
          )
        : atual.validadeAte;

    if (
      validadeAte === undefined
    ) {
      throw new ErroMobilidade(
        400,
        "VALIDADE_INVALIDA",
        "Data de validade inválida."
      );
    }

    if (
      status ===
        MobilidadeStatusDocumento.APROVADO &&
      atual.exigeValidade &&
      !validadeAte
    ) {
      throw new ErroMobilidade(
        400,
        "VALIDADE_OBRIGATORIA",
        "Informe a validade do documento antes de aprová-lo."
      );
    }

    const motivoRejeicao =
      textoOpcional(
        corpo.motivoRejeicao,
        5000
      );

    if (
      (
        status ===
          MobilidadeStatusDocumento.REJEITADO ||
        status ===
          MobilidadeStatusDocumento.CORRECAO_SOLICITADA
      ) &&
      !motivoRejeicao
    ) {
      throw new ErroMobilidade(
        400,
        "MOTIVO_DOCUMENTO_OBRIGATORIO",
        "Informe o motivo da rejeição ou da solicitação de correção."
      );
    }

    const observacoes =
      textoOpcional(
        corpo.observacoes,
        5000
      );

    const analisado =
      STATUS_ANALISE.has(
        status
      );

    await prisma.mobilidadeCandidaturaDocumento.update({
      where: {
        id:
          atual.id,
      },

      data: {
        status,

        validadeAte,

        motivoRejeicao:
          status ===
            MobilidadeStatusDocumento.REJEITADO ||
          status ===
            MobilidadeStatusDocumento.CORRECAO_SOLICITADA
            ? motivoRejeicao
            : null,

        observacoes,

        analisadoEm:
          analisado
            ? new Date()
            : null,

        analisadoPorId:
          analisado
            ? (
                usuario?.id ??
                null
              )
            : null,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (erro) {
    const resposta =
      respostaErroMobilidade(
        erro
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      }
    );
  }
}
