const fs = require("fs");

const pagina =
  "app/master/feriados/page.tsx";

let texto =
  fs.readFileSync(
    pagina,
    "utf8"
  );

/* =========================================================
   1. MELHORA O LABEL DO PAÍS
========================================================= */

const paisAntigo = `                      <span className="mb-2 block text-sm font-semibold">
                        {t(
                          "form.country"
                        )}
                      </span>

                      <select`;

const paisNovo = `                      <span className="mb-2 block text-sm font-semibold">
                        {t(
                          "form.countryValidity"
                        )}
                      </span>

                      <p className="mb-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t(
                          "form.countryHint"
                        )}
                      </p>

                      <select`;

if (!texto.includes(paisAntigo)) {
  throw new Error(
    "Bloco do país não encontrado."
  );
}

texto = texto.replace(
  paisAntigo,
  paisNovo
);

/* =========================================================
   2. EXPLICA AS ABAS DE TRADUÇÃO
========================================================= */

const traducoesAntigo = `                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "form.translations"
                    )}
                  </h3>

                  <div className="mt-4 flex flex-wrap gap-2">`;

const traducoesNovo = `                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t(
                      "form.translations"
                    )}
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    {t(
                      "form.translationsHint"
                    )}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">`;

if (!texto.includes(traducoesAntigo)) {
  throw new Error(
    "Bloco de traduções não encontrado."
  );
}

texto = texto.replace(
  traducoesAntigo,
  traducoesNovo
);

/* =========================================================
   3. ADICIONA AS TRADUÇÕES NOS 5 IDIOMAS
========================================================= */

const dados = {
  "pt-BR": {
    countryValidity:
      "País onde o feriado é válido",
    countryHint:
      "Este país define quais instituições receberão o aviso. Não muda ao trocar o idioma da tradução.",
    translationsHint:
      "As abas abaixo traduzem o mesmo feriado. Troque apenas o idioma do texto; o país permanece o mesmo.",
  },

  "pt-PT": {
    countryValidity:
      "País onde o feriado é válido",
    countryHint:
      "Este país define quais instituições receberão o aviso. Não muda ao trocar o idioma da tradução.",
    translationsHint:
      "Os separadores abaixo traduzem o mesmo feriado. Altere apenas o idioma do texto; o país permanece o mesmo.",
  },

  "en-US": {
    countryValidity:
      "Country where the holiday applies",
    countryHint:
      "This country determines which institutions will receive the notice. It does not change when you switch translation language.",
    translationsHint:
      "The tabs below translate the same holiday. Change only the text language; the country remains the same.",
  },

  "es-ES": {
    countryValidity:
      "País donde se aplica el festivo",
    countryHint:
      "Este país determina qué instituciones recibirán el aviso. No cambia al cambiar el idioma de la traducción.",
    translationsHint:
      "Las pestañas siguientes traducen el mismo festivo. Cambia solo el idioma del texto; el país sigue siendo el mismo.",
  },

  "fr-FR": {
    countryValidity:
      "Pays où le jour férié s’applique",
    countryHint:
      "Ce pays détermine quels établissements recevront l’avis. Il ne change pas lorsque vous changez la langue de traduction.",
    translationsHint:
      "Les onglets ci-dessous traduisent le même jour férié. Changez uniquement la langue du texte ; le pays reste identique.",
  },
};

const atualizados = {};

for (
  const [locale, valores]
  of Object.entries(dados)
) {
  const caminho =
    `messages/${locale}.json`;

  let conteudo =
    fs.readFileSync(
      caminho,
      "utf8"
    );

  const inicioMaster =
    conteudo.indexOf(
      '"MasterHolidays"'
    );

  if (inicioMaster === -1) {
    throw new Error(
      `MasterHolidays não encontrado em ${locale}.`
    );
  }

  const antes =
    conteudo.slice(
      0,
      inicioMaster
    );

  let master =
    conteudo.slice(
      inicioMaster
    );

  if (
    !master.includes(
      '"countryValidity"'
    )
  ) {
    master = master.replace(
      /("country"\s*:\s*"[^"]*")/,
      `$1,
      "countryValidity": ${JSON.stringify(
        valores.countryValidity
      )},
      "countryHint": ${JSON.stringify(
        valores.countryHint
      )}`
    );
  }

  if (
    !master.includes(
      '"translationsHint"'
    )
  ) {
    master = master.replace(
      /("translations"\s*:\s*"[^"]*")/,
      `$1,
      "translationsHint": ${JSON.stringify(
        valores.translationsHint
      )}`
    );
  }

  const final =
    antes + master;

  JSON.parse(final);

  atualizados[
    caminho
  ] = final;
}

/* =========================================================
   4. SÓ GRAVA DEPOIS QUE TUDO FOI VALIDADO
========================================================= */

fs.writeFileSync(
  pagina,
  texto,
  "utf8"
);

for (
  const [caminho, conteudo]
  of Object.entries(
    atualizados
  )
) {
  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );
}

console.log(
  "✓ País do feriado ficou mais explícito"
);
console.log(
  "✓ Abas de tradução receberam orientação"
);
console.log(
  "✓ Traduções adicionadas nos 5 idiomas"
);
