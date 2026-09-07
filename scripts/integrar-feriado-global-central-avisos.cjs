const fs = require("fs");

function ler(caminho) {
  const bruto =
    fs.readFileSync(caminho, "utf8");

  return {
    bruto,
    eol:
      bruto.includes("\r\n")
        ? "\r\n"
        : "\n",
    texto:
      bruto.replace(/\r\n/g, "\n"),
  };
}

function gravar(
  caminho,
  texto,
  eol
) {
  fs.writeFileSync(
    caminho,
    texto.replace(/\n/g, eol),
    "utf8"
  );
}

/* =========================================================
   1. BannerPhanyx aceita ReactNode como ícone
========================================================= */

const caminhoBanner =
  "components/phanyx/BannerPhanyx.tsx";

const bannerArquivo =
  ler(caminhoBanner);

let banner =
  bannerArquivo.texto;

if (
  !banner.includes(
    'import type { ReactNode } from "react";'
  )
) {
  banner = banner.replace(
    '"use client";',
`"use client";

import type { ReactNode } from "react";`
  );
}

if (
  banner.includes(
    "  icone: string;"
  )
) {
  banner = banner.replace(
    "  icone: string;",
    "  icone: ReactNode;"
  );
}

/* =========================================================
   2. Novo PhanyxFeriadoAviso
   Sem lista estática de feriados
========================================================= */

const caminhoFeriado =
  "components/ui/PhanyxFeriadoAviso.tsx";

const feriadoArquivo =
  ler(caminhoFeriado);

const novoFeriado =
`"use client";

import { useLocale, useTranslations } from "next-intl";

import BannerPhanyx from "@/components/phanyx/BannerPhanyx";
import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";

export type FeriadoAtivoPhanyx = {
  id: number;
  paisCodigo: string;
  dataFeriado: string;
  inicioExibicao: string;
  fimExibicao: string;
  prioridade: number;
  emoji: string | null;
  locale: string;
  nome: string;
  titulo: string;
  mensagem: string;
};

type Props = {
  feriado: FeriadoAtivoPhanyx;
};

function formatarDataCivil(
  valor: string,
  locale: string
) {
  const partes =
    String(valor || "")
      .split("-")
      .map(Number);

  const [ano, mes, dia] =
    partes;

  if (
    !ano ||
    !mes ||
    !dia
  ) {
    return valor;
  }

  const data =
    new Date(
      Date.UTC(
        ano,
        mes - 1,
        dia
      )
    );

  try {
    return new Intl.DateTimeFormat(
      locale,
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }
    ).format(data);
  } catch {
    return valor;
  }
}

export default function PhanyxFeriadoAviso({
  feriado,
}: Props) {
  const locale = useLocale();

  const t =
    useTranslations(
      "PublicHolidayBanner"
    );

  const dataTexto =
    formatarDataCivil(
      feriado.dataFeriado,
      locale
    );

  const icone =
    feriado.emoji ? (
      feriado.emoji
    ) : (
      <BandeiraPais
        codigo={
          feriado.paisCodigo
        }
        nome={
          feriado.nome
        }
        className="h-7 w-10 rounded-md object-cover"
      />
    );

  return (
    <div className="mb-6">
      <BannerPhanyx
        aviso={{
          id:
            \`feriado-global-\${feriado.id}\`,
          titulo:
            feriado.titulo,
          descricao:
            dataTexto,
          origem:
            t("origin"),
          frase:
            feriado.mensagem,
          icone,
          categoria:
            t("category"),
          cor: "azul",
          prioridade:
            feriado.prioridade,
        }}
      />
    </div>
  );
}
`;

/* =========================================================
   3. CentralAvisos consulta API real
========================================================= */

const caminhoCentral =
  "components/phanyx/CentralAvisosPhanyx.tsx";

const centralArquivo =
  ler(caminhoCentral);

const novaCentral =
`"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

import AvisoInteligenteBanner from "@/components/phanyx/AvisoInteligenteBanner";

import PhanyxFeriadoAviso, {
  type FeriadoAtivoPhanyx,
} from "@/components/ui/PhanyxFeriadoAviso";

type Props = {
  variante?:
    | "dashboard"
    | "compacta";
};

type RespostaFeriadoAtual = {
  ok?: boolean;
  feriado?:
    | FeriadoAtivoPhanyx
    | null;
};

export default function CentralAvisosPhanyx({
  variante = "dashboard",
}: Props) {
  const locale =
    useLocale();

  const tMonthly =
    useTranslations(
      "MonthlyCampaign"
    );

  const tHoliday =
    useTranslations(
      "PublicHolidayBanner"
    );

  const [
    feriado,
    setFeriado,
  ] =
    useState<FeriadoAtivoPhanyx | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  useEffect(() => {
    const controller =
      new AbortController();

    let ativo = true;

    async function carregarFeriado() {
      try {
        setCarregando(true);

        const resposta =
          await fetch(
            \`/api/phanyx/feriado-atual?locale=\${encodeURIComponent(
              locale
            )}\`,
            {
              cache: "no-store",
              credentials:
                "include",
              signal:
                controller.signal,
            }
          );

        if (!resposta.ok) {
          if (ativo) {
            setFeriado(null);
          }

          return;
        }

        const dados =
          (await resposta.json()) as
            RespostaFeriadoAtual;

        if (!ativo) {
          return;
        }

        setFeriado(
          dados?.feriado ||
            null
        );
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name ===
            "AbortError"
        ) {
          return;
        }

        console.error(
          "Erro ao carregar feriado PHANYX:",
          error
        );

        if (ativo) {
          setFeriado(null);
        }
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregarFeriado();

    return () => {
      ativo = false;
      controller.abort();
    };
  }, [locale]);

  /*
   * Evita mostrar o aviso mensal por
   * alguns milissegundos antes de saber
   * se existe feriado ativo.
   */
  if (carregando) {
    return null;
  }

  if (
    variante ===
    "compacta"
  ) {
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400">
        {feriado
          ? tHoliday(
              "compact",
              {
                name:
                  feriado.nome,
              }
            )
          : \`🎗️ \${tMonthly(
              "monthlyCampaign"
            )}\`}
      </div>
    );
  }

  return feriado ? (
    <PhanyxFeriadoAviso
      feriado={feriado}
    />
  ) : (
    <AvisoInteligenteBanner />
  );
}
`;

/* =========================================================
   4. TRADUÇÕES DO BANNER PÚBLICO
========================================================= */

const traducoes = {
  "pt-BR": {
    origin:
      "Calendário Nacional",
    category:
      "Feriado",
    compact:
      "Feriado: {name}",
  },

  "pt-PT": {
    origin:
      "Calendário Nacional",
    category:
      "Feriado",
    compact:
      "Feriado: {name}",
  },

  "en-US": {
    origin:
      "National Calendar",
    category:
      "Holiday",
    compact:
      "Holiday: {name}",
  },

  "es-ES": {
    origin:
      "Calendario Nacional",
    category:
      "Festivo",
    compact:
      "Festivo: {name}",
  },

  "fr-FR": {
    origin:
      "Calendrier national",
    category:
      "Jour férié",
    compact:
      "Jour férié : {name}",
  },
};

const mensagensParaGravar =
  {};

for (
  const [locale, dados]
  of Object.entries(
    traducoes
  )
) {
  const caminho =
    "messages/" + locale + ".json";

  const arquivo =
    ler(caminho);

  let conteudo =
    arquivo.texto;

  const json =
    JSON.parse(conteudo);

  if (
    !json.PublicHolidayBanner
  ) {
    const fim =
      conteudo.lastIndexOf(
        "}"
      );

    if (fim === -1) {
      throw new Error(
        "JSON inválido: " + locale
      );
    }

    const antes =
      conteudo
        .slice(0, fim)
        .replace(
          /\s*$/,
          ""
        );

    const bloco =
      JSON.stringify(
        {
          PublicHolidayBanner:
            dados,
        },
        null,
        2
      )
        .split("\n")
        .slice(1, -1)
        .join("\n");

    conteudo =
      antes +
      ",\n" +
      bloco +
      "\n}\n";

    JSON.parse(
      conteudo
    );
  }

  mensagensParaGravar[
    caminho
  ] = {
    texto:
      conteudo,
    eol:
      arquivo.eol,
  };
}

/* =========================================================
   5. SÓ GRAVA APÓS VALIDAR TUDO
========================================================= */

gravar(
  caminhoBanner,
  banner,
  bannerArquivo.eol
);

gravar(
  caminhoFeriado,
  novoFeriado,
  feriadoArquivo.eol
);

gravar(
  caminhoCentral,
  novaCentral,
  centralArquivo.eol
);

for (
  const [caminho, arquivo]
  of Object.entries(
    mensagensParaGravar
  )
) {
  gravar(
    caminho,
    arquivo.texto,
    arquivo.eol
  );
}

console.log(
  "✓ CentralAvisos agora consulta feriado global"
);

console.log(
  "✓ Lista brasileira hardcoded removida do componente"
);

console.log(
  "✓ Bandeira gráfica habilitada no BannerPhanyx"
);

console.log(
  "✓ Banner internacionalizado nos 5 idiomas"
);


