const fs = require("fs");

const pagina = "app/master/feriados/page.tsx";
let texto = fs.readFileSync(pagina, "utf8");

/* =========================================================
   1. PAÍS: TROCA LABEL E INSERE EXPLICAÇÃO
========================================================= */

if (!texto.includes('"form.countryValidity"')) {
  const regexCountry =
    /\{t\(\s*"form\.country"\s*\)\}/m;

  if (!regexCountry.test(texto)) {
    throw new Error(
      'Chave t("form.country") não encontrada.'
    );
  }

  texto = texto.replace(
    regexCountry,
    '{t("form.countryValidity")}'
  );
}

if (!texto.includes('"form.countryHint"')) {
  const regexSpanCountry =
    /(<span[^>]*>\s*\{t\(\s*"form\.countryValidity"\s*\)\}\s*<\/span>)/m;

  if (!regexSpanCountry.test(texto)) {
    throw new Error(
      "Label visual do país não encontrado."
    );
  }

  texto = texto.replace(
    regexSpanCountry,
`$1

                      <p className="mb-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.countryHint")}
                      </p>`
  );
}

/* =========================================================
   2. TRADUÇÕES: INSERE EXPLICAÇÃO DAS ABAS
========================================================= */

if (!texto.includes('"form.translationsHint"')) {
  const regexTituloTraducoes =
    /(<h3[^>]*>\s*\{t\(\s*"form\.translations"\s*\)\}\s*<\/h3>)/m;

  if (!regexTituloTraducoes.test(texto)) {
    throw new Error(
      "Título de conteúdo traduzido não encontrado."
    );
  }

  texto = texto.replace(
    regexTituloTraducoes,
`$1

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t("form.translationsHint")}
                  </p>`
  );
}

/* =========================================================
   3. NOVAS CHAVES NOS 5 IDIOMAS
========================================================= */

const traducoes = {
  "pt-BR": {
    countryValidity: "País onde o feriado é válido",
    countryHint:
      "Este país define quais instituições receberão o aviso. Ele não muda ao trocar o idioma da tradução.",
    translationsHint:
      "As abas abaixo são traduções do mesmo feriado. Troque apenas o idioma do texto; o país do feriado permanece o mesmo.",
  },

  "pt-PT": {
    countryValidity: "País onde o feriado é válido",
    countryHint:
      "Este país define quais instituições receberão o aviso. Não muda ao trocar o idioma da tradução.",
    translationsHint:
      "Os separadores abaixo são traduções do mesmo feriado. Altere apenas o idioma do texto; o país do feriado permanece o mesmo.",
  },

  "en-US": {
    countryValidity: "Country where the holiday applies",
    countryHint:
      "This country determines which institutions receive the notice. It does not change when you switch translation language.",
    translationsHint:
      "The tabs below are translations of the same holiday. Change only the text language; the holiday country remains the same.",
  },

  "es-ES": {
    countryValidity: "País donde se aplica el festivo",
    countryHint:
      "Este país determina qué instituciones recibirán el aviso. No cambia al cambiar el idioma de la traducción.",
    translationsHint:
      "Las pestañas siguientes son traducciones del mismo festivo. Cambia solo el idioma del texto; el país del festivo permanece igual.",
  },

  "fr-FR": {
    countryValidity: "Pays où le jour férié s’applique",
    countryHint:
      "Ce pays détermine quels établissements recevront l’avis. Il ne change pas lorsque vous changez la langue de traduction.",
    translationsHint:
      "Les onglets ci-dessous sont les traductions du même jour férié. Changez uniquement la langue du texte ; le pays reste identique.",
  },
};

const arquivosAtualizados = {};

for (const [locale, dados] of Object.entries(traducoes)) {
  const caminho = `messages/${locale}.json`;
  let conteudo = fs.readFileSync(caminho, "utf8");

  const indiceMaster =
    conteudo.indexOf('"MasterHolidays"');

  if (indiceMaster === -1) {
    throw new Error(
      `MasterHolidays não encontrado em ${locale}.`
    );
  }

  const indiceForm =
    conteudo.indexOf('"form"', indiceMaster);

  if (indiceForm === -1) {
    throw new Error(
      `MasterHolidays.form não encontrado em ${locale}.`
    );
  }

  const antesForm = conteudo.slice(0, indiceForm);
  let formAteFim = conteudo.slice(indiceForm);

  if (!formAteFim.includes('"countryValidity"')) {
    const regexCountryJson =
      /("country"\s*:\s*"[^"]*")/;

    if (!regexCountryJson.test(formAteFim)) {
      throw new Error(
        `form.country não encontrado em ${locale}.`
      );
    }

    formAteFim = formAteFim.replace(
      regexCountryJson,
`$1,
      "countryValidity": ${JSON.stringify(dados.countryValidity)},
      "countryHint": ${JSON.stringify(dados.countryHint)}`
    );
  }

  if (!formAteFim.includes('"translationsHint"')) {
    const regexTranslationsJson =
      /("translations"\s*:\s*"[^"]*")/;

    if (!regexTranslationsJson.test(formAteFim)) {
      throw new Error(
        `form.translations não encontrado em ${locale}.`
      );
    }

    formAteFim = formAteFim.replace(
      regexTranslationsJson,
`$1,
      "translationsHint": ${JSON.stringify(dados.translationsHint)}`
    );
  }

  const final = antesForm + formAteFim;

  JSON.parse(final);

  arquivosAtualizados[caminho] = final;
}

/* =========================================================
   4. SÓ GRAVA APÓS TODAS AS VALIDAÇÕES
========================================================= */

fs.writeFileSync(
  pagina,
  texto,
  "utf8"
);

for (const [caminho, conteudo] of Object.entries(
  arquivosAtualizados
)) {
  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );
}

console.log("✓ País do feriado explicado no formulário");
console.log("✓ Abas de tradução explicadas");
console.log("✓ Traduções adicionadas nos 5 idiomas");
