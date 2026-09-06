const fs = require("fs");

const pagina =
  "app/admin/configuracoes/instituicao/page.tsx";

const bruto =
  fs.readFileSync(pagina, "utf8");

const eol =
  bruto.includes("\r\n")
    ? "\r\n"
    : "\n";

let texto =
  bruto.replace(/\r\n/g, "\n");

function exigir(condicao, mensagem) {
  if (!condicao) {
    throw new Error(mensagem);
  }
}

/* =========================================================
   1. IMPORTS
========================================================= */

if (
  !/import \{[^}]*useMemo[^}]*\} from "react";/.test(
    texto
  )
) {
  exigir(
    texto.includes(
      'import { useEffect, useRef, useState } from "react";'
    ),
    "Import React esperado não encontrado."
  );

  texto = texto.replace(
    'import { useEffect, useRef, useState } from "react";',
    'import { useEffect, useMemo, useRef, useState } from "react";'
  );
}

if (
  !texto.includes(
    'from "libphonenumber-js"'
  )
) {
  exigir(
    texto.includes(
      'import Link from "next/link";'
    ),
    "Import Link não encontrado."
  );

  texto = texto.replace(
    'import Link from "next/link";',
`import Link from "next/link";
import {
  getCountries,
  type CountryCode,
} from "libphonenumber-js";
import {
  useLocale,
  useTranslations,
} from "next-intl";
import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";`
  );
}

/* =========================================================
   2. TIPO ConfigInstituicao
========================================================= */

if (
  !texto.includes(
    "paisCodigo?: string | null;"
  )
) {
  exigir(
    texto.includes(
`  cidade?: string;
  estado?: string;`
    ),
    "Campos cidade/estado do tipo não encontrados."
  );

  texto = texto.replace(
`  cidade?: string;
  estado?: string;`,
`  cidade?: string;
  estado?: string;
  paisCodigo?: string | null;
  fusoHorario?: string;`
  );
}

/* =========================================================
   3. HOOKS DE I18N
========================================================= */

if (
  !texto.includes(
    'useTranslations("InstitutionGeoSettings")'
  )
) {
  const ancora =
`export default function ConfigInstituicaoPage() {
  const [form, setForm] = useState<ConfigInstituicao>({});`;

  exigir(
    texto.includes(ancora),
    "Início de ConfigInstituicaoPage não encontrado."
  );

  texto = texto.replace(
    ancora,
`export default function ConfigInstituicaoPage() {
  const tGeo =
    useTranslations("InstitutionGeoSettings");

  const locale = useLocale();

  const [montado, setMontado] =
    useState(false);

  const [form, setForm] = useState<ConfigInstituicao>({});`
  );
}

/* =========================================================
   4. PAÍSES + FUSOS
========================================================= */

if (
  !texto.includes(
    "const nomesPaises = useMemo"
  )
) {
  const regexLayout =
    /  const layoutSelecionado = normalizarLayoutProfissional\(\s*form\.estiloPapelTimbrado \|\| form\.estiloDocumento\s*\);/m;

  const achado =
    texto.match(regexLayout);

  exigir(
    Boolean(achado),
    "layoutSelecionado não encontrado."
  );

  const bloco = `${achado[0]}

  const nomesPaises = useMemo(() => {
    try {
      return new Intl.DisplayNames(
        [locale],
        {
          type: "region",
        }
      );
    } catch {
      return new Intl.DisplayNames(
        ["pt-BR"],
        {
          type: "region",
        }
      );
    }
  }, [locale]);

  const paises = useMemo(() => {
    if (!montado) {
      return [];
    }

    return getCountries()
      .map((codigo) => ({
        codigo,
        nome:
          nomesPaises.of(codigo) ||
          codigo,
      }))
      .sort((a, b) =>
        a.nome.localeCompare(
          b.nome,
          locale
        )
      );
  }, [
    locale,
    montado,
    nomesPaises,
  ]);

  const fusosHorarios = useMemo(() => {
    if (!montado) {
      return [];
    }

    const intlComFusos =
      Intl as typeof Intl & {
        supportedValuesOf?: (
          chave: "timeZone"
        ) => string[];
      };

    const fallback = [
      "America/Sao_Paulo",
      "America/Manaus",
      "America/Rio_Branco",
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "Europe/Lisbon",
      "Europe/London",
      "Europe/Madrid",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];

    const encontrados =
      intlComFusos.supportedValuesOf?.(
        "timeZone"
      ) || fallback;

    return Array.from(
      new Set([
        ...(form.fusoHorario
          ? [form.fusoHorario]
          : []),
        ...encontrados,
      ])
    );
  }, [
    montado,
    form.fusoHorario,
  ]);

  function usarFusoDoDispositivo() {
    const fuso =
      Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone;

    if (!fuso) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      fusoHorario: fuso,
    }));
  }`;

  texto = texto.replace(
    regexLayout,
    bloco
  );
}

/* =========================================================
   5. PAYLOAD montarPayloadConfiguracao
========================================================= */

if (
  !texto.includes(
    "paisCodigo: dados.paisCodigo"
  )
) {
  const antigo =
`      cidade: dados.cidade || "",
      estado: dados.estado || "",`;

  exigir(
    texto.includes(antigo),
    "Payload auxiliar cidade/estado não encontrado."
  );

  texto = texto.replace(
    antigo,
`      cidade: dados.cidade || "",
      estado: dados.estado || "",
      paisCodigo:
        dados.paisCodigo || "",
      fusoHorario:
        dados.fusoHorario || "",`
  );
}

/* =========================================================
   6. PAYLOAD salvar()
========================================================= */

if (
  !texto.includes(
    "paisCodigo: form.paisCodigo"
  )
) {
  const antigo =
`        cidade: form.cidade || "",
        estado: form.estado || "",`;

  exigir(
    texto.includes(antigo),
    "Payload salvar cidade/estado não encontrado."
  );

  texto = texto.replace(
    antigo,
`        cidade: form.cidade || "",
        estado: form.estado || "",
        paisCodigo:
          form.paisCodigo || "",
        fusoHorario:
          form.fusoHorario || "",`
  );
}

/* =========================================================
   7. VIA CEP DEFINE BRASIL
========================================================= */

if (
  !texto.includes(
    'prev.paisCodigo || "BR"'
  )
) {
  const regexViaCep =
    /(estado:\s*data\?\.uf\s*\|\|\s*prev\.estado\s*\|\|\s*"",)/m;

  exigir(
    regexViaCep.test(texto),
    "Trecho do estado retornado pelo ViaCEP não encontrado."
  );

  texto = texto.replace(
    regexViaCep,
`$1
        paisCodigo:
          prev.paisCodigo || "BR",`
  );
}

/* =========================================================
   8. MONTAGEM CLIENT-SIDE
========================================================= */

if (
  !texto.includes(
    "setMontado(true);"
  )
) {
  const regexEffect =
    /  useEffect\(\(\) => \{\s*carregar\(\);\s*\}, \[\]\);/m;

  exigir(
    regexEffect.test(texto),
    "useEffect de carregar não encontrado."
  );

  texto = texto.replace(
    regexEffect,
`  useEffect(() => {
    setMontado(true);
  }, []);

  useEffect(() => {
    carregar();
  }, []);`
  );
}

/* =========================================================
   9. CAMPOS VISUAIS ANTES DE ESTADO
========================================================= */

if (
  !texto.includes(
    'tGeo("country")'
  )
) {
  const marcadorEstado =
    'value={form.estado || ""}';

  const posValor =
    texto.indexOf(
      marcadorEstado
    );

  exigir(
    posValor !== -1,
    "Input de Estado não encontrado."
  );

  const posInicio =
    texto.lastIndexOf(
      "              <div>",
      posValor
    );

  exigir(
    posInicio !== -1,
    "Início do campo Estado não encontrado."
  );

  const bloco = `              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tGeo("country")}
                </label>

                <div className="flex items-center gap-2">
                  <select
                    value={
                      form.paisCodigo || ""
                    }
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        paisCodigo:
                          e.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="">
                      {tGeo(
                        "selectCountry"
                      )}
                    </option>

                    {paises.map(
                      (pais) => (
                        <option
                          key={
                            pais.codigo
                          }
                          value={
                            pais.codigo
                          }
                        >
                          {pais.nome}
                        </option>
                      )
                    )}
                  </select>

                  {form.paisCodigo && (
                    <div className="flex h-10 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900">
                      <BandeiraPais
                        codigo={
                          form.paisCodigo
                        }
                        nome={
                          nomesPaises.of(
                            form.paisCodigo as CountryCode
                          ) ||
                          form.paisCodigo
                        }
                        className="h-full w-full rounded-lg object-cover"
                      />
                    </div>
                  )}
                </div>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {tGeo(
                    "countryHint"
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {tGeo("timezone")}
                </label>

                <select
                  value={
                    form.fusoHorario || ""
                  }
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fusoHorario:
                        e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    {tGeo(
                      "selectTimezone"
                    )}
                  </option>

                  {fusosHorarios.map(
                    (fuso) => (
                      <option
                        key={fuso}
                        value={fuso}
                      >
                        {fuso.replace(
                          /_/g,
                          " "
                        )}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    usarFusoDoDispositivo
                  }
                  className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  {tGeo(
                    "useDeviceTimezone"
                  )}
                </button>

                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  {tGeo(
                    "timezoneHint"
                  )}
                </p>
              </div>

`;

  texto =
    texto.slice(0, posInicio) +
    bloco +
    texto.slice(posInicio);
}

/* =========================================================
   10. TRADUÇÕES
========================================================= */

const traducoes = {
  "pt-BR": {
    country:
      "País da instituição",
    selectCountry:
      "Selecione o país",
    countryHint:
      "Define quais feriados nacionais e recursos internacionais se aplicam à instituição.",
    timezone:
      "Fuso horário",
    selectTimezone:
      "Selecione o fuso horário",
    timezoneHint:
      "Define quando começa e termina o dia local da instituição.",
    useDeviceTimezone:
      "Usar fuso deste dispositivo",
  },

  "pt-PT": {
    country:
      "País da instituição",
    selectCountry:
      "Selecione o país",
    countryHint:
      "Define quais feriados nacionais e recursos internacionais se aplicam à instituição.",
    timezone:
      "Fuso horário",
    selectTimezone:
      "Selecione o fuso horário",
    timezoneHint:
      "Define quando começa e termina o dia local da instituição.",
    useDeviceTimezone:
      "Usar fuso deste dispositivo",
  },

  "en-US": {
    country:
      "Institution country",
    selectCountry:
      "Select country",
    countryHint:
      "Determines which national holidays and international features apply to the institution.",
    timezone:
      "Time zone",
    selectTimezone:
      "Select time zone",
    timezoneHint:
      "Determines when the institution's local day starts and ends.",
    useDeviceTimezone:
      "Use this device's time zone",
  },

  "es-ES": {
    country:
      "País de la institución",
    selectCountry:
      "Selecciona el país",
    countryHint:
      "Determina qué festivos nacionales y funciones internacionales se aplican a la institución.",
    timezone:
      "Zona horaria",
    selectTimezone:
      "Selecciona la zona horaria",
    timezoneHint:
      "Determina cuándo comienza y termina el día local de la institución.",
    useDeviceTimezone:
      "Usar la zona horaria de este dispositivo",
  },

  "fr-FR": {
    country:
      "Pays de l’établissement",
    selectCountry:
      "Sélectionnez le pays",
    countryHint:
      "Détermine quels jours fériés nationaux et fonctionnalités internationales s’appliquent à l’établissement.",
    timezone:
      "Fuseau horaire",
    selectTimezone:
      "Sélectionnez le fuseau horaire",
    timezoneHint:
      "Détermine le début et la fin de la journée locale de l’établissement.",
    useDeviceTimezone:
      "Utiliser le fuseau horaire de cet appareil",
  },
};

const mensagensParaGravar = {};

for (
  const [localeMsg, dados]
  of Object.entries(traducoes)
) {
  const caminho =
    `messages/${localeMsg}.json`;

  const brutoMsg =
    fs.readFileSync(
      caminho,
      "utf8"
    );

  const eolMsg =
    brutoMsg.includes("\r\n")
      ? "\r\n"
      : "\n";

  let msg =
    brutoMsg.replace(
      /\r\n/g,
      "\n"
    );

  const json =
    JSON.parse(msg);

  if (
    !json.InstitutionGeoSettings
  ) {
    const ultimo =
      msg.lastIndexOf("}");

    exigir(
      ultimo !== -1,
      `JSON inválido em ${localeMsg}.`
    );

    const antes =
      msg
        .slice(0, ultimo)
        .replace(/\s*$/, "");

    const bloco =
      JSON.stringify(
        {
          InstitutionGeoSettings:
            dados,
        },
        null,
        2
      )
        .split("\n")
        .slice(1, -1)
        .join("\n");

    msg =
      antes +
      ",\n" +
      bloco +
      "\n}\n";

    JSON.parse(msg);
  }

  mensagensParaGravar[
    caminho
  ] = msg.replace(
    /\n/g,
    eolMsg
  );
}

/* =========================================================
   11. SÓ AGORA GRAVA TUDO
========================================================= */

fs.writeFileSync(
  pagina,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

for (
  const [caminho, conteudo]
  of Object.entries(
    mensagensParaGravar
  )
) {
  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );
}

console.log(
  "✓ País e fuso adicionados à configuração institucional"
);

console.log(
  "✓ ViaCEP passa a associar Brasil automaticamente"
);

console.log(
  "✓ Traduções preparadas nos 5 idiomas"
);
