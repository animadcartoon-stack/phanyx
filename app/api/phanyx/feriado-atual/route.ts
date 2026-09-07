import {
  NextRequest,
  NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const LOCALES_SUPORTADOS = new Set([
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
]);

function normalizarLocale(
  valor: string | null
) {
  const locale =
    String(valor || "")
      .trim();

  return LOCALES_SUPORTADOS.has(
    locale
  )
    ? locale
    : "pt-BR";
}

function dataCivilNoFuso(
  data: Date,
  fusoHorario: string
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          fusoHorario,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(data);

  const ano =
    partes.find(
      (parte) =>
        parte.type === "year"
    )?.value;

  const mes =
    partes.find(
      (parte) =>
        parte.type === "month"
    )?.value;

  const dia =
    partes.find(
      (parte) =>
        parte.type === "day"
    )?.value;

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    throw new Error(
      "Não foi possível calcular a data local da instituição."
    );
  }

  return `${ano}-${mes}-${dia}`;
}

function dataPrisma(
  valor: string
) {
  return new Date(
    `${valor}T00:00:00.000Z`
  );
}

function dataBancoISO(
  data: Date
) {
  return data
    .toISOString()
    .slice(0, 10);
}

function calcularDiasRestantes(
  dataLocal: string,
  dataFeriado: string
) {
  const [
    anoHoje,
    mesHoje,
    diaHoje,
  ] =
    dataLocal
      .split("-")
      .map(Number);

  const [
    anoFeriado,
    mesFeriado,
    diaFeriado,
  ] =
    dataFeriado
      .split("-")
      .map(Number);

  if (
    !anoHoje ||
    !mesHoje ||
    !diaHoje ||
    !anoFeriado ||
    !mesFeriado ||
    !diaFeriado
  ) {
    return 0;
  }

  const hojeUTC =
    Date.UTC(
      anoHoje,
      mesHoje - 1,
      diaHoje
    );

  const feriadoUTC =
    Date.UTC(
      anoFeriado,
      mesFeriado - 1,
      diaFeriado
    );

  return Math.round(
    (
      feriadoUTC -
      hojeUTC
    ) /
      86400000
  );
}

export async function GET(
  req: NextRequest
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Sessão não encontrada.",
        },
        {
          status: 401,
        }
      );
    }

    const instituicaoId =
      Number(
        usuario.instituicaoId
      );

    /*
     * Usuários sem instituição não
     * recebem calendário institucional.
     */
    if (
      !Number.isInteger(
        instituicaoId
      ) ||
      instituicaoId <= 0
    ) {
      return NextResponse.json({
        ok: true,
        feriado: null,
      });
    }

    const configuracao =
      await prisma
        .configuracaoInstituicao
        .findUnique({
          where: {
            instituicaoId,
          },
          select: {
            paisCodigo: true,
            fusoHorario: true,
          },
        });

    const paisCodigo =
      String(
        configuracao?.paisCodigo ||
          ""
      )
        .trim()
        .toUpperCase();

    /*
     * Sem país configurado:
     * não adivinhamos o calendário.
     */
    if (!paisCodigo) {
      return NextResponse.json({
        ok: true,
        feriado: null,
      });
    }

    const fusoHorario =
      String(
        configuracao?.fusoHorario ||
          "America/Sao_Paulo"
      ).trim();

    const locale =
      normalizarLocale(
        req.nextUrl.searchParams.get(
          "locale"
        )
      );

    const dataLocal =
      dataCivilNoFuso(
        new Date(),
        fusoHorario
      );

    const hoje =
      dataPrisma(
        dataLocal
      );

    const feriado =
      await prisma
        .feriadoGlobal
        .findFirst({
          where: {
            paisCodigo,
            tipo: "NACIONAL",
            status:
              "PUBLICADO",

            inicioExibicao: {
              lte: hoje,
            },

            fimExibicao: {
              gte: hoje,
            },
          },

          orderBy: [
            {
              prioridade:
                "desc",
            },
            {
              dataFeriado:
                "asc",
            },
            {
              id: "asc",
            },
          ],

          select: {
            id: true,
            paisCodigo: true,
            dataFeriado: true,
            inicioExibicao: true,
            fimExibicao: true,
            prioridade: true,
            emoji: true,

            traducoes: {
              select: {
                locale: true,
                nome: true,
                titulo: true,
                mensagem: true,
              },
            },
          },
        });

    if (!feriado) {
      return NextResponse.json({
        ok: true,
        feriado: null,
        contexto: {
          paisCodigo,
          fusoHorario,
          dataLocal,
          locale,
        },
      });
    }

    const traducao =
      feriado.traducoes.find(
        (item) =>
          item.locale ===
          locale
      ) ||
      feriado.traducoes.find(
        (item) =>
          item.locale ===
          "pt-BR"
      ) ||
      feriado.traducoes[0];

    if (!traducao) {
      return NextResponse.json({
        ok: true,
        feriado: null,
        contexto: {
          paisCodigo,
          fusoHorario,
          dataLocal,
          locale,
        },
      });
    }

    const dataFeriadoISO =
      dataBancoISO(
        feriado.dataFeriado
      );

    const diasRestantes =
      calcularDiasRestantes(
        dataLocal,
        dataFeriadoISO
      );

    return NextResponse.json({
      ok: true,

      feriado: {
        id: feriado.id,

        paisCodigo:
          feriado.paisCodigo,

        dataFeriado:
          dataFeriadoISO,

        diasRestantes,

        inicioExibicao:
          dataBancoISO(
            feriado.inicioExibicao
          ),

        fimExibicao:
          dataBancoISO(
            feriado.fimExibicao
          ),

        prioridade:
          feriado.prioridade,

        emoji:
          feriado.emoji ||
          null,

        locale:
          traducao.locale,

        nome:
          traducao.nome,

        titulo:
          traducao.titulo,

        mensagem:
          traducao.mensagem,
      },

      contexto: {
        instituicaoId,
        paisCodigo,
        fusoHorario,
        dataLocal,
        locale,
      },
    });
  } catch (error) {
    console.error(
      "ERRO AO BUSCAR FERIADO ATUAL:",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "Não foi possível carregar o feriado atual.",
      },
      {
        status: 500,
      }
    );
  }
}
