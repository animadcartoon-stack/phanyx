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

const STATUS_VALIDOS = [
  "RASCUNHO",
  "PUBLICADO",
  "ARQUIVADO",
] as const;

const TIPOS_VALIDOS = [
  "NACIONAL",
  "REGIONAL",
  "LOCAL",
] as const;

const PAISES_VALIDOS = new Set<CountryCode>(
  getCountries()
);

type LocaleSuportado =
  (typeof LOCALES_SUPORTADOS)[number];

type StatusFeriado =
  (typeof STATUS_VALIDOS)[number];

type TipoFeriado =
  (typeof TIPOS_VALIDOS)[number];

type TraducaoEntrada = {
  locale?: unknown;
  nome?: unknown;
  titulo?: unknown;
  mensagem?: unknown;
};

type CorpoAtualizacao = {
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

  const resultado =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(textoData);

  if (!resultado) {
    return null;
  }

  const ano = Number(resultado[1]);
  const mes = Number(resultado[2]);
  const dia = Number(resultado[3]);

  const data = new Date(
    Date.UTC(ano, mes - 1, dia)
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
  valor: unknown
): number | null {
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
      usuario: null,
      erro: respostaErro(
        "NAO_AUTENTICADO",
        "Não autenticado.",
        401
      ),
    };
  }

  const usuario = await prisma.user.findUnique({
    where: {
      id: sessao.id,
    },
    select: {
      id: true,
      isMasterAdmin: true,
    },
  });

  if (!usuario?.isMasterAdmin) {
    return {
      usuario: null,
      erro: respostaErro(
        "SEM_PERMISSAO_MASTER",
        "Sem permissão para administrar feriados globais.",
        403
      ),
    };
  }

  return {
    usuario,
    erro: null,
  };
}

function obterId(
  valor: string
): number | null {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
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
      error: "Informe as traduções.",
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

    if (!LOCALES_SUPORTADOS.includes(locale)) {
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

    if (!nome && !titulo && !mensagem) {
      continue;
    }

    if (!nome || !titulo || !mensagem) {
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

export async function PATCH(
  req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const acesso = await obterMaster();

    if (!acesso.usuario || acesso.erro) {
      return acesso.erro;
    }

    const id = obterId(params.id);

    if (!id) {
      return respostaErro(
        "ID_INVALIDO",
        "Identificador de feriado inválido.",
        400
      );
    }

    const atual =
      await prisma.feriadoGlobal.findUnique({
        where: {
          id,
        },
        include: {
          traducoes: true,
        },
      });

    if (!atual) {
      return respostaErro(
        "FERIADO_NAO_ENCONTRADO",
        "Feriado não encontrado.",
        404
      );
    }

    let corpo: CorpoAtualizacao;

    try {
      corpo =
        (await req.json()) as CorpoAtualizacao;
    } catch {
      return respostaErro(
        "JSON_INVALIDO",
        "Corpo da requisição inválido.",
        400
      );
    }

    let paisCodigo = atual.paisCodigo;

    if (corpo.paisCodigo !== undefined) {
      const pais =
        normalizarPais(corpo.paisCodigo);

      if (!pais) {
        return respostaErro(
          "PAIS_INVALIDO",
          "Código de país inválido.",
          400
        );
      }

      paisCodigo = pais;
    }

    let tipo = atual.tipo as TipoFeriado;

    if (corpo.tipo !== undefined) {
      const valor = String(corpo.tipo)
        .trim()
        .toUpperCase() as TipoFeriado;

      if (!TIPOS_VALIDOS.includes(valor)) {
        return respostaErro(
          "TIPO_INVALIDO",
          "Tipo de feriado inválido.",
          400
        );
      }

      tipo = valor;
    }

    let status = atual.status as StatusFeriado;

    if (corpo.status !== undefined) {
      const valor = String(corpo.status)
        .trim()
        .toUpperCase() as StatusFeriado;

      if (!STATUS_VALIDOS.includes(valor)) {
        return respostaErro(
          "STATUS_INVALIDO",
          "Status de feriado inválido.",
          400
        );
      }

      status = valor;
    }

    let dataFeriado = atual.dataFeriado;

    if (corpo.dataFeriado !== undefined) {
      const data =
        normalizarDataCivil(corpo.dataFeriado);

      if (!data) {
        return respostaErro(
          "DATA_FERIADO_INVALIDA",
          "Data do feriado inválida.",
          400
        );
      }

      dataFeriado = data;
    }

    let inicioExibicao = atual.inicioExibicao;

    if (corpo.inicioExibicao !== undefined) {
      const data =
        normalizarDataCivil(
          corpo.inicioExibicao
        );

      if (!data) {
        return respostaErro(
          "INICIO_EXIBICAO_INVALIDO",
          "Data inicial de exibição inválida.",
          400
        );
      }

      inicioExibicao = data;
    }

    let fimExibicao = atual.fimExibicao;

    if (corpo.fimExibicao !== undefined) {
      const data =
        normalizarDataCivil(
          corpo.fimExibicao
        );

      if (!data) {
        return respostaErro(
          "FIM_EXIBICAO_INVALIDO",
          "Data final de exibição inválida.",
          400
        );
      }

      fimExibicao = data;
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

    let prioridade = atual.prioridade;

    if (corpo.prioridade !== undefined) {
      const numero =
        numeroInteiro(corpo.prioridade);

      if (
        numero === null ||
        numero < 0 ||
        numero > 1000
      ) {
        return respostaErro(
          "PRIORIDADE_INVALIDA",
          "A prioridade deve estar entre 0 e 1000.",
          400
        );
      }

      prioridade = numero;
    }

    let traducoesFinais =
      atual.traducoes.map((item) => ({
        locale:
          item.locale as LocaleSuportado,
        nome: item.nome,
        titulo: item.titulo,
        mensagem: item.mensagem,
      }));

    let substituirTraducoes = false;

    if (corpo.traducoes !== undefined) {
      const resultado =
        normalizarTraducoes(
          corpo.traducoes
        );

      if (resultado.ok === false) {
        return respostaErro(
          resultado.code,
          resultado.error,
          400
        );
      }

      traducoesFinais =
        resultado.traducoes;

      substituirTraducoes = true;
    }

    if (status === "PUBLICADO") {
      const locais =
        new Set(
          traducoesFinais.map(
            (item) => item.locale
          )
        );

      const faltantes =
        LOCALES_SUPORTADOS.filter(
          (locale) =>
            !locais.has(locale)
        );

      if (faltantes.length > 0) {
        return respostaErro(
          "TRADUCOES_PUBLICACAO_INCOMPLETAS",
          `Para publicar, complete os cinco idiomas. Faltando: ${faltantes.join(", ")}.`,
          400
        );
      }
    }

    const virouPublicado =
      status === "PUBLICADO" &&
      atual.status !== "PUBLICADO";

    const feriado =
      await prisma.$transaction(
        async (tx) => {
          if (substituirTraducoes) {
            await tx.feriadoGlobalTraducao.deleteMany({
              where: {
                feriadoId: id,
              },
            });

            await tx.feriadoGlobalTraducao.createMany({
              data: traducoesFinais.map(
                (item) => ({
                  feriadoId: id,
                  locale: item.locale,
                  nome: item.nome,
                  titulo: item.titulo,
                  mensagem: item.mensagem,
                })
              ),
            });
          }

          return tx.feriadoGlobal.update({
            where: {
              id,
            },
            data: {
              paisCodigo,

              regiaoCodigo:
                corpo.regiaoCodigo !== undefined
                  ? texto(
                      corpo.regiaoCodigo,
                      30
                    )
                  : atual.regiaoCodigo,

              cidade:
                corpo.cidade !== undefined
                  ? texto(
                      corpo.cidade,
                      200
                    )
                  : atual.cidade,

              dataFeriado,
              inicioExibicao,
              fimExibicao,
              tipo,
              status,
              prioridade,

              emoji:
                corpo.emoji !== undefined
                  ? texto(
                      corpo.emoji,
                      50
                    )
                  : atual.emoji,

              atualizadoPorId:
                acesso.usuario.id,

              ...(virouPublicado
                ? {
                    publicadoPorId:
                      acesso.usuario.id,
                    publicadoEm:
                      new Date(),
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
          });
        }
      );

    return NextResponse.json({
      ok: true,
      feriado,
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar feriado global:",
      error
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Erro ao atualizar feriado.",
      500
    );
  }
}

export async function DELETE(
  _req: Request,
  {
    params,
  }: {
    params: {
      id: string;
    };
  }
) {
  try {
    const acesso = await obterMaster();

    if (!acesso.usuario || acesso.erro) {
      return acesso.erro;
    }

    const id = obterId(params.id);

    if (!id) {
      return respostaErro(
        "ID_INVALIDO",
        "Identificador de feriado inválido.",
        400
      );
    }

    const feriado =
      await prisma.feriadoGlobal.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!feriado) {
      return respostaErro(
        "FERIADO_NAO_ENCONTRADO",
        "Feriado não encontrado.",
        404
      );
    }

    if (feriado.status !== "RASCUNHO") {
      return respostaErro(
        "EXCLUSAO_NAO_PERMITIDA",
        "Somente feriados em rascunho podem ser excluídos. Arquive registros já publicados.",
        409
      );
    }

    await prisma.feriadoGlobal.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      ok: true,
      excluido: true,
      id,
    });
  } catch (error) {
    console.error(
      "Erro ao excluir feriado global:",
      error
    );

    return respostaErro(
      "ERRO_INTERNO",
      "Erro ao excluir feriado.",
      500
    );
  }
}
