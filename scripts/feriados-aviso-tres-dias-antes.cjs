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
   1. FUNÇÃO PARA SOMAR/SUBTRAIR DIAS CIVIS
========================================================= */

if (
  !texto.includes(
    "function deslocarDataCivil"
  )
) {
  const ancora =
`function dataInput(valor: string | null | undefined) {
  if (!valor) {
    return "";
  }

  return valor.slice(0, 10);
}`;

  exigir(
    texto.includes(ancora),
    "Função dataInput não encontrada."
  );

  texto = texto.replace(
    ancora,
`${ancora}

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
}`
  );
}

/* =========================================================
   2. DATA DO FERIADO PREENCHE JANELA DE 3 DIAS
========================================================= */

if (
  !texto.includes(
    "function atualizarDataFeriado"
  )
) {
  const ancora =
`  function abrirNovo() {
    setEditandoId(null);
    setForm(formularioVazio());
    setLocaleAtivo(localeAtual);
    setModalAberto(true);
  }`;

  exigir(
    texto.includes(ancora),
    "Função abrirNovo não encontrada."
  );

  texto = texto.replace(
    ancora,
`${ancora}

  function atualizarDataFeriado(
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,

      dataFeriado:
        valor,

      inicioExibicao:
        valor
          ? deslocarDataCivil(
              valor,
              -3
            )
          : "",

      fimExibicao:
        valor || "",
    }));
  }`
  );
}

/* =========================================================
   3. TROCA O onChange DA DATA DO FERIADO
========================================================= */

const regexData =
/onChange=\{\(\s*event\s*\)\s*=>\s*setForm\(\s*\(atual\)\s*=>\s*\(\{\s*\.\.\.atual,\s*dataFeriado:\s*event\s*\.target\s*\.value,\s*\}\)\s*\)\s*\}/m;

if (
  !texto.includes(
    "atualizarDataFeriado("
  ) ||
  regexData.test(texto)
) {
  exigir(
    regexData.test(texto),
    "onChange atual de dataFeriado não encontrado."
  );

  texto = texto.replace(
    regexData,
`onChange={(
                          event
                        ) =>
                          atualizarDataFeriado(
                            event.target.value
                          )
                        }`
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
`                      <input
                        type="date"
                        required
                        value={
                          form.dataFeriado
                        }`;

  const pos =
    texto.indexOf(marcador);

  exigir(
    pos !== -1,
    "Input visual da data do feriado não encontrado."
  );

  const fechamentoInput =
    texto.indexOf(
      "/>",
      pos
    );

  exigir(
    fechamentoInput !== -1,
    "Final do input da data não encontrado."
  );

  const posInsercao =
    fechamentoInput + 2;

  texto =
    texto.slice(0, posInsercao) +
`
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t(
                          "form.threeDaysHint"
                        )}
                      </p>` +
    texto.slice(posInsercao);
}

/* =========================================================
   5. TRADUÇÕES NOS 5 IDIOMAS
========================================================= */

const traducoes = {
  "pt-BR":
    "Ao escolher a data, o PHANYX define automaticamente o início do aviso para 3 dias antes e o término para o próprio dia do feriado.",

  "pt-PT":
    "Ao escolher a data, o PHANYX define automaticamente o início do aviso para 3 dias antes e o fim para o próprio dia do feriado.",

  "en-US":
    "When you select the date, PHANYX automatically starts the notice 3 days before and ends it on the holiday itself.",

  "es-ES":
    "Al seleccionar la fecha, PHANYX inicia automáticamente el aviso 3 días antes y lo finaliza el mismo día festivo.",

  "fr-FR":
    "Lorsque vous sélectionnez la date, PHANYX commence automatiquement l’avis 3 jours avant et le termine le jour férié.",
};

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

  if (
    msg.includes(
      '"threeDaysHint"'
    )
  ) {
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

  fs.writeFileSync(
    arquivo,
    msg.replace(
      /\n/g,
      eolMsg
    ),
    "utf8"
  );
}

/* =========================================================
   6. GRAVA A PÁGINA
========================================================= */

fs.writeFileSync(
  caminho,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

console.log(
  "✓ Aviso padrão alterado para começar 3 dias antes"
);

console.log(
  "✓ Fim da exibição passa a ser preenchido com o dia do feriado"
);

console.log(
  "✓ Período continua editável pelo Master"
);

console.log(
  "✓ Orientação adicionada nos 5 idiomas"
);
