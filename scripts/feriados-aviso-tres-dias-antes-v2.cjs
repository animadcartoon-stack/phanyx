const fs = require("fs");

const caminho =
  "app/master/feriados/page.tsx";

const bruto =
  fs.readFileSync(caminho, "utf8");

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
   1. FUNÇÃO PARA DESLOCAR DATA CIVIL
========================================================= */

if (
  !texto.includes(
    "function deslocarDataCivil("
  )
) {
  const regexDataInput =
    /function dataInput\(valor: string \| null \| undefined\) \{\s*if \(!valor\) \{\s*return "";\s*\}\s*return valor\.slice\(0, 10\);\s*\}/m;

  const achado =
    texto.match(regexDataInput);

  exigir(
    achado,
    "Função dataInput não encontrada."
  );

  const novo =
`${achado[0]}

function deslocarDataCivil(
  valor: string,
  dias: number
) {
  const resultado =
    /^(\\d{4})-(\\d{2})-(\\d{2})$/.exec(
      valor
    );

  if (!resultado) {
    return "";
  }

  const data =
    new Date(
      Date.UTC(
        Number(resultado[1]),
        Number(resultado[2]) - 1,
        Number(resultado[3])
      )
    );

  data.setUTCDate(
    data.getUTCDate() + dias
  );

  return data
    .toISOString()
    .slice(0, 10);
}`;

  texto = texto.replace(
    regexDataInput,
    novo
  );
}

/* =========================================================
   2. FUNÇÃO DE ATUALIZAÇÃO DA DATA DO FERIADO
========================================================= */

if (
  !texto.includes(
    "function atualizarDataFeriado("
  )
) {
  const regexAbrirNovo =
    /  function abrirNovo\(\) \{\s*setEditandoId\(null\);\s*setForm\(formularioVazio\(\)\);\s*setLocaleAtivo\(localeAtual\);\s*setModalAberto\(true\);\s*\}/m;

  const achado =
    texto.match(regexAbrirNovo);

  exigir(
    achado,
    "Função abrirNovo não encontrada."
  );

  const novo =
`${achado[0]}

  function atualizarDataFeriado(
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,

      dataFeriado:
        valor,

      /*
       * Padrão PHANYX:
       * aviso começa 3 dias antes
       * e termina no próprio feriado.
       *
       * Os campos continuam editáveis
       * para exceções definidas pelo Master.
       */
      inicioExibicao:
        valor
          ? deslocarDataCivil(
              valor,
              -3
            )
          : "",

      fimExibicao:
        valor,
    }));
  }`;

  texto = texto.replace(
    regexAbrirNovo,
    novo
  );
}

/* =========================================================
   3. TROCA O onChange DO CAMPO DATA DO FERIADO
========================================================= */

if (
  !texto.includes(
    "atualizarDataFeriado(event.target.value)"
  )
) {
  const antigo =
`                        onChange={(event) =>
                          setForm((atual) => ({
                            ...atual,
                            dataFeriado: event.target.value,
                          }))
                        }`;

  exigir(
    texto.includes(antigo),
    "onChange atual de dataFeriado não encontrado."
  );

  const novo =
`                        onChange={(event) =>
                          atualizarDataFeriado(
                            event.target.value
                          )
                        }`;

  texto = texto.replace(
    antigo,
    novo
  );
}

/* =========================================================
   4. EXPLICAÇÃO VISUAL
========================================================= */

if (
  !texto.includes(
    't("form.threeDaysHint")'
  )
) {
  const marcador =
`                        value={form.dataFeriado}
                        onChange={(event) =>
                          atualizarDataFeriado(
                            event.target.value
                          )
                        }`;

  const pos =
    texto.indexOf(marcador);

  exigir(
    pos !== -1,
    "Campo dataFeriado atualizado não encontrado."
  );

  const fimInput =
    texto.indexOf(
      "/>",
      pos
    );

  exigir(
    fimInput !== -1,
    "Fim do input de dataFeriado não encontrado."
  );

  const inserirEm =
    fimInput + 2;

  texto =
    texto.slice(0, inserirEm) +
`
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.threeDaysHint")}
                      </p>` +
    texto.slice(inserirEm);
}

/* =========================================================
   5. TRADUÇÕES
========================================================= */

const traducoes = {
  "pt-BR":
    "Ao escolher a data, o PHANYX inicia o aviso automaticamente 3 dias antes e encerra no próprio dia do feriado. O período pode ser ajustado manualmente.",

  "pt-PT":
    "Ao escolher a data, o PHANYX inicia o aviso automaticamente 3 dias antes e termina no próprio dia do feriado. O período pode ser ajustado manualmente.",

  "en-US":
    "When you select the date, PHANYX automatically starts the notice 3 days before and ends it on the holiday itself. The period can still be adjusted manually.",

  "es-ES":
    "Al seleccionar la fecha, PHANYX inicia automáticamente el aviso 3 días antes y lo finaliza el mismo día festivo. El período puede ajustarse manualmente.",

  "fr-FR":
    "Lorsque vous sélectionnez la date, PHANYX commence automatiquement l’avis 3 jours avant et le termine le jour férié. La période peut toujours être ajustée manuellement.",
};

const mensagensParaGravar = {};

for (
  const [locale, valor]
  of Object.entries(traducoes)
) {
  const arquivo =
    `messages/${locale}.json`;

  const original =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const eolMsg =
    original.includes("\r\n")
      ? "\r\n"
      : "\n";

  let msg =
    original.replace(/\r\n/g, "\n");

  const json =
    JSON.parse(msg);

  if (
    json?.MasterHolidays?.form?.threeDaysHint
  ) {
    mensagensParaGravar[arquivo] = {
      texto: msg,
      eol: eolMsg,
    };

    continue;
  }

  const posMaster =
    msg.indexOf(
      '"MasterHolidays"'
    );

  exigir(
    posMaster !== -1,
    `MasterHolidays não encontrado em ${locale}.`
  );

  const posForm =
    msg.indexOf(
      '"form"',
      posMaster
    );

  exigir(
    posForm !== -1,
    `MasterHolidays.form não encontrado em ${locale}.`
  );

  const posDate =
    msg.indexOf(
      '"date"',
      posForm
    );

  exigir(
    posDate !== -1,
    `form.date não encontrado em ${locale}.`
  );

  const fimLinha =
    msg.indexOf(
      "\n",
      posDate
    );

  exigir(
    fimLinha !== -1,
    `Fim da linha form.date não encontrado em ${locale}.`
  );

  msg =
    msg.slice(0, fimLinha) +
`,
      "threeDaysHint": ${JSON.stringify(
        valor
      )}` +
    msg.slice(fimLinha);

  JSON.parse(msg);

  mensagensParaGravar[arquivo] = {
    texto: msg,
    eol: eolMsg,
  };
}

/* =========================================================
   6. SÓ GRAVA DEPOIS DE VALIDAR TUDO
========================================================= */

fs.writeFileSync(
  caminho,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

for (
  const [
    arquivo,
    dados,
  ]
  of Object.entries(
    mensagensParaGravar
  )
) {
  fs.writeFileSync(
    arquivo,
    dados.texto.replace(
      /\n/g,
      dados.eol
    ),
    "utf8"
  );
}

console.log(
  "✓ Aviso padrão passa a começar 3 dias antes"
);

console.log(
  "✓ Fim da exibição é preenchido com o próprio dia do feriado"
);

console.log(
  "✓ Início e fim continuam editáveis pelo Master"
);

console.log(
  "✓ Orientação adicionada nos 5 idiomas"
);
