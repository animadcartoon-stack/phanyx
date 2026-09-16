const fs = require("fs");

const pagina =
  "app/master/feriados/page.tsx";

function lerArquivo(caminho) {
  const bruto =
    fs.readFileSync(
      caminho,
      "utf8"
    );

  return {
    eol:
      bruto.includes("\r\n")
        ? "\r\n"
        : "\n",
    texto:
      bruto.replace(
        /\r\n/g,
        "\n"
      ),
  };
}

function exigir(
  condicao,
  mensagem
) {
  if (!condicao) {
    throw new Error(
      mensagem
    );
  }
}

function localizarObjeto(
  conteudo,
  nome
) {
  const posChave =
    conteudo.indexOf(
      `"${nome}"`
    );

  exigir(
    posChave !== -1,
    `${nome} não encontrado.`
  );

  const inicio =
    conteudo.indexOf(
      "{",
      posChave
    );

  exigir(
    inicio !== -1,
    `Objeto ${nome} inválido.`
  );

  let profundidade = 0;
  let emString = false;
  let escape = false;

  for (
    let i = inicio;
    i < conteudo.length;
    i++
  ) {
    const char =
      conteudo[i];

    if (emString) {
      if (escape) {
        escape = false;
      } else if (
        char === "\\"
      ) {
        escape = true;
      } else if (
        char === '"'
      ) {
        emString = false;
      }

      continue;
    }

    if (char === '"') {
      emString = true;
      continue;
    }

    if (char === "{") {
      profundidade++;
    } else if (
      char === "}"
    ) {
      profundidade--;

      if (
        profundidade === 0
      ) {
        return {
          inicio,
          fim: i,
        };
      }
    }
  }

  throw new Error(
    `Fim de ${nome} não encontrado.`
  );
}

/* =========================================================
   1. PÁGINA MASTER
========================================================= */

const arquivoPagina =
  lerArquivo(
    pagina
  );

let texto =
  arquivoPagina.texto;

/* ---------------------------------------------------------
   Helper de data civil
--------------------------------------------------------- */

if (
  !texto.includes(
    "function deslocarDataCivil("
  )
) {
  const regexDataInput =
    /function dataInput\(valor: string \| null \| undefined\) \{\s*if \(!valor\) \{\s*return "";\s*\}\s*return valor\.slice\(0, 10\);\s*\}/m;

  const achado =
    texto.match(
      regexDataInput
    );

  exigir(
    achado,
    "Função dataInput não encontrada."
  );

  texto = texto.replace(
    regexDataInput,
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
        Number(
          resultado[1]
        ),
        Number(
          resultado[2]
        ) - 1,
        Number(
          resultado[3]
        )
      )
    );

  data.setUTCDate(
    data.getUTCDate() +
      dias
  );

  return data
    .toISOString()
    .slice(0, 10);
}`
  );
}

/* ---------------------------------------------------------
   Data do feriado passa a preencher a janela padrão
--------------------------------------------------------- */

if (
  !texto.includes(
    "inicioExibicao: deslocarDataCivil("
  )
) {
  const regexOnChange =
    /onChange=\{\(event\) =>\s*setForm\(\(atual\) => \(\{\s*\.\.\.atual,\s*dataFeriado: event\.target\.value,\s*\}\)\)\s*\}/m;

  exigir(
    regexOnChange.test(
      texto
    ),
    "onChange de dataFeriado não encontrado."
  );

  texto =
    texto.replace(
      regexOnChange,
`onChange={(event) => {
                          const valor =
                            event.target.value;

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
                              valor,
                          }));
                        }}`
    );
}

/* ---------------------------------------------------------
   Hint abaixo da data
--------------------------------------------------------- */

if (
  !texto.includes(
    't("form.threeDaysHint")'
  )
) {
  const posValor =
    texto.indexOf(
      "value={form.dataFeriado}"
    );

  exigir(
    posValor !== -1,
    "value={form.dataFeriado} não encontrado."
  );

  const fimInput =
    texto.indexOf(
      "/>",
      posValor
    );

  exigir(
    fimInput !== -1,
    "Fim do input dataFeriado não encontrado."
  );

  const insercao =
    fimInput + 2;

  texto =
    texto.slice(
      0,
      insercao
    ) +
`
                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t(
                          "form.threeDaysHint"
                        )}
                      </p>` +
    texto.slice(
      insercao
    );
}

/* =========================================================
   2. TRADUÇÕES
========================================================= */

const traducoes = {
  "pt-BR":
    "Ao escolher a data do feriado, o PHANYX inicia o aviso automaticamente 3 dias antes e encerra no próprio dia. O período pode ser ajustado manualmente.",

  "pt-PT":
    "Ao escolher a data do feriado, o PHANYX inicia automaticamente o aviso 3 dias antes e termina no próprio dia. O período pode ser ajustado manualmente.",

  "en-US":
    "When you select the holiday date, PHANYX automatically starts the notice 3 days before and ends it on the holiday itself. You can adjust the period manually.",

  "es-ES":
    "Al seleccionar la fecha del festivo, PHANYX inicia automáticamente el aviso 3 días antes y lo finaliza el mismo día. El período puede ajustarse manualmente.",

  "fr-FR":
    "Lorsque vous sélectionnez la date du jour férié, PHANYX commence automatiquement l’avis 3 jours avant et le termine le jour même. La période peut être ajustée manuellement.",
};

const mensagens =
  {};

for (
  const [
    locale,
    valor,
  ]
  of Object.entries(
    traducoes
  )
) {
  const caminho =
    `messages/${locale}.json`;

  const arquivo =
    lerArquivo(
      caminho
    );

  let conteudo =
    arquivo.texto;

  const master =
    localizarObjeto(
      conteudo,
      "MasterHolidays"
    );

  const trechoMaster =
    conteudo.slice(
      master.inicio,
      master.fim + 1
    );

  const formRelativo =
    localizarObjeto(
      trechoMaster,
      "form"
    );

  const inicioForm =
    master.inicio +
    formRelativo.inicio;

  const fimForm =
    master.inicio +
    formRelativo.fim;

  let blocoForm =
    conteudo.slice(
      inicioForm,
      fimForm + 1
    );

  if (
    !blocoForm.includes(
      '"threeDaysHint"'
    )
  ) {
    const regexDate =
      /^([ \t]*)"date"\s*:\s*"([^"]*)",?\s*$/m;

    const achado =
      blocoForm.match(
        regexDate
      );

    exigir(
      achado,
      `form.date não encontrado em ${locale}.`
    );

    const indent =
      achado[1];

    const linhaOriginal =
      achado[0].trimEnd();

    const linhaComVirgula =
      linhaOriginal.endsWith(",")
        ? linhaOriginal
        : linhaOriginal + ",";

    blocoForm =
      blocoForm.replace(
        achado[0],
`${indent}${linhaComVirgula.trimStart()}
${indent}"threeDaysHint": ${JSON.stringify(
          valor
        )},`
      );

    conteudo =
      conteudo.slice(
        0,
        inicioForm
      ) +
      blocoForm +
      conteudo.slice(
        fimForm + 1
      );
  }

  JSON.parse(
    conteudo
  );

  mensagens[
    caminho
  ] = {
    texto:
      conteudo,
    eol:
      arquivo.eol,
  };
}

/* =========================================================
   3. SÓ GRAVA APÓS TODAS AS VALIDAÇÕES
========================================================= */

fs.writeFileSync(
  pagina,
  texto.replace(
    /\n/g,
    arquivoPagina.eol
  ),
  "utf8"
);

for (
  const [
    caminho,
    arquivo,
  ]
  of Object.entries(
    mensagens
  )
) {
  fs.writeFileSync(
    caminho,
    arquivo.texto.replace(
      /\n/g,
      arquivo.eol
    ),
    "utf8"
  );
}

console.log(
  "✓ Aviso padrão começa 3 dias antes"
);

console.log(
  "✓ Fim padrão é o próprio dia do feriado"
);

console.log(
  "✓ Início e fim continuam editáveis pelo Master"
);

console.log(
  "✓ Orientação adicionada nos 5 idiomas"
);
