import { NextResponse } from "next/server";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const LOCALES_SUPORTADOS = [
  "pt-BR",
  "pt-PT",
  "en-US",
  "es-ES",
  "fr-FR",
] as const;

const STATUS_VALIDOS = new Set([
  "RASCUNHO",
  "PUBLICADO",
  "ARQUIVADO",
]);

const TIPOS_VALIDOS = new Set([
  "NACIONAL",
  "REGIONAL",
  "LOCAL",
]);

const PAISES_VALIDOS = new Set<CountryCode>(
  getCountries()
);

type LocaleSuportado =
  (typeof LOCALES_SUPORTADOS)[number];

type TraducaoEntrada = {
  locale?: unknown;
  nome?: unknown;
  titulo?: unknown;
  mensagem?: unknown;
};

type CorpoFeriado = {
  paisCodigo?: unknown;
  regiaoCodigo?: unknown;
  cidade?: unknown;

  dataFeriado?: unknown;
  inicioExibicao?: unknown;
  fimExibicao?: unknown;

  tipo?: unknown;
  status?: unknown;

  prioridade?: unknown;
  emoji?: unknown;

  traducoes?: unknown;
};

function respostaErro(
  code: string,
  error: string,
  status: number
) {
  return NextResponse.json(
    {
      ok: false,
      code,
      error,
    },
    { status }
  );
}

function texto(
  valor: unknown,
  limite = 500
) {
  const resultado = String(valor ?? "").trim();

  if (!resultado) {
    return null;
  }

  return resultado.slice(0, limite);
}

function normalizarPais(
  valor: unknown
): CountryCode | null {
  const codigo = String(valor ?? "")
    .trim()
    .toUpperCase() as CountryCode;

  if (!codigo || !PAISES_VALIDOS.has(codigo)) {
    return null;
  }

  return codigo;
}

function normalizarDataCivil(
  valor: unknown
): Date | null {
  const textoData = String(valor ?? "").trim();

  const correspondencia =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      textoData
    );

  if (!correspondencia) {
    return null;
  }

  const ano = Number(correspondencia[1]);
  const mes = Number(correspondencia[2]);
  const dia = Number(correspondencia[3]);

  const data = new Date(
    Date.UTC(
      ano,
      mes - 1,
      dia,
      0,
      0,
      0,
      0
    )
  );

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return data;
}

function numeroInteiro(
  valor: unknown,
  padrao = 0
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return padrao;
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    !Number.isFinite(numero)
  ) {
    return null;
  }

  return numero;
}

async function obterMaster() {
  const sessao = await getUserFromToken();

  if (!sessao) {
    return {
      erro: respostaErro(
        "NAO_AUTENTICADO",
        "Não autenticado.",
        401
      ),
      usuario: null,
    };
  }

  const usuario = await prisma.user.findUnique({
    where: {
      id: sessao.id,
    },
    select: {
      id: true,
      nome: true,
      email: true,
      role: true,
      isMasterAdmin: true,
    },
  });

  if (
    !usuario ||
    usuario.isMasterAdmin !== true
  ) {
    return {
      erro: respostaErro(
        "SEM_PERMISSAO_MASTER",
        "Sem permissão para administrar feriados globais.",
        403
      ),
      usuario: null,
    };
  }

  return {
    erro: null,
    usuario,
  };
}

function normalizarTraducoes(
  valor: unknown
):
  | {
      ok: true;
      traducoes: {
        locale: LocaleSuportado;
        nome: string;
        titulo: string;
        mensagem: string;
      }[];
    }
  | {
      ok: false;
      code: string;
      error: string;
    } {
  if (!Array.isArray(valor)) {
    return {
      ok: false,
      code: "TRADUCOES_INVALIDAS",
      error:
        "Informe as traduções do feriado.",
    };
  }

  const traducoes: {
    locale: LocaleSuportado;
    nome: string;
    titulo: string;
    mensagem: string;
  }[] = [];

  const vistos = new Set<string>();

  for (const item of valor as TraducaoEntrada[]) {
    const locale = String(
      item?.locale ?? ""
    ).trim() as LocaleSuportado;

    if (
      !LOCALES_SUPORTADOS.includes(locale)
    ) {
      return {
        ok: false,
        code: "LOCALE_INVALIDO",
        error: `Locale inválido: ${locale || "-"}.`,
      };
    }

    if (vistos.has(locale)) {
      return {
        ok: false,
        code: "LOCALE_DUPLICADO",
        error: `O locale ${locale} foi informado mais de uma vez.`,
      };
    }

    vistos.add(locale);

    const nome = texto(item?.nome, 200);
    const titulo = texto(item?.titulo, 300);
    const mensagem = texto(
      item?.mensagem,
      4000
    );

    const totalmenteVazio =
      !nome &&
      !titulo &&
      !mensagem;

    if (totalmenteVazio) {
      continue;
    }

    if (
      !nome ||
      !titulo ||
      !mensagem
    ) {
      return {
        ok: false,
        code: "TRADUCAO_INCOMPLETA",
        error:
          `Complete nome, título e mensagem para ${locale}.`,
      };
    }

    traducoes.push({
      locale,
      nome,
      titulo,
      mensagem,
    });
  }

  if (traducoes.length === 0) {
    return {
      ok: false,
      code: "SEM_TRADUCAO",
      error:
        "Informe ao menos uma tradução completa.",
    };
  }

  return {
    ok: true,
    traducoes,
  };
}

export async function GET(req: Request) {
  try {
    const acesso = await obterMaster();

    if (acesso.erro) {
      return acesso.erro;
    }

    const { searchParams } =
      new URL(req.url);

    const paisParam =
      searchParams.get("pais");

    const statusParam =
      String(
        searchParams.get("status") || ""
      )
        .trim()
        .toUpperCase();

    const anoParam =
      searchParams.get("ano");

    const paisCodigo = paisParam
      ? normalizarPais(paisParam)
      : null;

    if (
      paisParam &&
      !paisCodigo
    ) {
      return respostaErro(
        "PAIS_INVALIDO",
        "Código de país inválido.",
        400
      );
    }

    if (
      statusParam &&
      !STATUS_VALIDOS.has(statusParam)
    ) {
      return respostaErro(
        "STATUS_INVALIDO",
        "Status de feriado inválido.",
        400
      );
    }

    let filtroAno:
      | {
          gte: Date;
          lt: Date;
        }
      | undefined;

    if (anoParam) {
      const ano = Number(anoParam);

      if (
        !Number.isInteger(ano) ||
        ano < 1900 ||
        ano > 2200
      ) {
        return respostaErro(
          "ANO_INVALIDO",
          "Ano inválido.",
          400
        );
      }

      filtroAno = {
        gte: new Date(
          Date.UTC(ano, 0, 1)
        ),
        lt: new Date(
          Date.UTC(ano + 1, 0, 1)
        ),
      };
    }

    const feriados =
      await prisma.feriadoGlobal.findMany({
        where: {
          ...(paisCodigo
            ? { paisCodigo }
            : {}),
          ...(statusParam
            ? {
                status:
                  statusParam as
                    | "RASCUNHO"
                    | "PUBLICADO"
                    | "ARQUIVADO",
              }
            : {}),
          ...(filtroAno
            ? {
                dataFeriado:
                  filtroAno,
              }
            : {}),
        },

        include: {
          traducoes: {
            orderBy: {
              locale: "asc",
            },
          },
        },

        orderBy: [
          {
            dataFeriado: "asc",
          },
          {
            prioridade: "desc",
          },
          {
            id: "asc",
          },
        ],
      });

    return NextResponse.json({
      ok: true,
      feriados,
      total: feriados.length,
    });
  } catch (error) {
    console.error(
      "Erro ao listar feriados globais:",
      error
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Erro ao listar feriados.",
      500
    );
  }
}

export async function POST(req: Request) {
  try {
    const acesso = await obterMaster();

    if (
      acesso.erro ||
      !acesso.usuario
    ) {
      return acesso.erro;
    }

    let corpo: CorpoFeriado;

    try {
      corpo =
        (await req.json()) as CorpoFeriado;
    } catch {
      return respostaErro(
        "JSON_INVALIDO",
        "Corpo da requisição inválido.",
        400
      );
    }

    const paisCodigo =
      normalizarPais(
        corpo.paisCodigo
      );

    if (!paisCodigo) {
      return respostaErro(
        "PAIS_INVALIDO",
        "Informe um código de país válido.",
        400
      );
    }

    const tipo = String(
      corpo.tipo || "NACIONAL"
    )
      .trim()
      .toUpperCase();

    if (!TIPOS_VALIDOS.has(tipo)) {
      return respostaErro(
        "TIPO_INVALIDO",
        "Tipo de feriado inválido.",
        400
      );
    }

    const status = String(
      corpo.status || "RASCUNHO"
    )
      .trim()
      .toUpperCase();

    if (!STATUS_VALIDOS.has(status)) {
      return respostaErro(
        "STATUS_INVALIDO",
        "Status de feriado inválido.",
        400
      );
    }

    const dataFeriado =
      normalizarDataCivil(
        corpo.dataFeriado
      );

    const inicioExibicao =
      normalizarDataCivil(
        corpo.inicioExibicao
      );

    const fimExibicao =
      normalizarDataCivil(
        corpo.fimExibicao
      );

    if (
      !dataFeriado ||
      !inicioExibicao ||
      !fimExibicao
    ) {
      return respostaErro(
        "DATAS_INVALIDAS",
        "Informe datas válidas no formato YYYY-MM-DD.",
        400
      );
    }

    if (
      inicioExibicao.getTime() >
      fimExibicao.getTime()
    ) {
      return respostaErro(
        "PERIODO_EXIBICAO_INVALIDO",
        "O início da exibição não pode ser posterior ao fim.",
        400
      );
    }

    if (
      dataFeriado.getTime() <
        inicioExibicao.getTime() ||
      dataFeriado.getTime() >
        fimExibicao.getTime()
    ) {
      return respostaErro(
        "FERIADO_FORA_DO_PERIODO",
        "A data do feriado deve estar dentro do período de exibição.",
        400
      );
    }

    const prioridade =
      numeroInteiro(
        corpo.prioridade,
        0
      );

    if (
      prioridade === null ||
      prioridade < 0 ||
      prioridade > 1000
    ) {
      return respostaErro(
        "PRIORIDADE_INVALIDA",
        "A prioridade deve ser um número inteiro entre 0 e 1000.",
        400
      );
    }

    const resultadoTraducoes =
      normalizarTraducoes(
        corpo.traducoes
      );

    if (resultadoTraducoes.ok === false) {
      return respostaErro(
        resultadoTraducoes.code,
        resultadoTraducoes.error,
        400
      );
    }

    if (status === "PUBLICADO") {
      const locaisPresentes =
        new Set(
          resultadoTraducoes.traducoes.map(
            (item) => item.locale
          )
        );

      const faltantes =
        LOCALES_SUPORTADOS.filter(
          (locale) =>
            !locaisPresentes.has(locale)
        );

      if (faltantes.length > 0) {
        return respostaErro(
          "TRADUCOES_PUBLICACAO_INCOMPLETAS",
          `Para publicar, complete os cinco idiomas. Faltando: ${faltantes.join(
            ", "
          )}.`,
          400
        );
      }
    }

    const agora = new Date();

    const feriado =
      await prisma.feriadoGlobal.create({
        data: {
          paisCodigo,

          regiaoCodigo:
            texto(
              corpo.regiaoCodigo,
              30
            ),

          cidade:
            texto(
              corpo.cidade,
              200
            ),

          dataFeriado,
          inicioExibicao,
          fimExibicao,

          tipo:
            tipo as
              | "NACIONAL"
              | "REGIONAL"
              | "LOCAL",

          status:
            status as
              | "RASCUNHO"
              | "PUBLICADO"
              | "ARQUIVADO",

          prioridade,

          emoji:
            texto(
              corpo.emoji,
              50
            ),

          criadoPorId:
            acesso.usuario.id,

          atualizadoPorId:
            acesso.usuario.id,

          publicadoPorId:
            status === "PUBLICADO"
              ? acesso.usuario.id
              : null,

          publicadoEm:
            status === "PUBLICADO"
              ? agora
              : null,

          traducoes: {
            create:
              resultadoTraducoes.traducoes.map(
                (item) => ({
                  locale:
                    item.locale,
                  nome:
                    item.nome,
                  titulo:
                    item.titulo,
                  mensagem:
                    item.mensagem,
                })
              ),
          },
        },

        include: {
          traducoes: {
            orderBy: {
              locale: "asc",
            },
          },
        },
      });

    return NextResponse.json(
      {
        ok: true,
        feriado,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro ao criar feriado global:",
      error
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Erro ao criar feriado.",
      500
    );
  }
}
