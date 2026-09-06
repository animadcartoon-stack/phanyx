const fs = require("fs");

const arquivo =
  "app/master/feriados/page.tsx";

let texto =
  fs.readFileSync(
    arquivo,
    "utf8"
  );

/* =========================================================
   1. HELPERS DE ÍCONE / BANDEIRA
========================================================= */

if (
  !texto.includes(
    "function bandeiraDoPais("
  )
) {
  const ancora =
    /export default function MasterFeriadosPage\(\) \{/;

  if (!ancora.test(texto)) {
    throw new Error(
      "Início de MasterFeriadosPage não encontrado."
    );
  }

  const helpers = `const ICONES_RAPIDOS = [
  "📅",
  "🎉",
  "🏛️",
  "⭐",
  "🎓",
] as const;

function bandeiraDoPais(
  codigo: string
) {
  const normalizado = String(
    codigo || ""
  )
    .trim()
    .toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      normalizado
    )
  ) {
    return "📅";
  }

  return normalizado.replace(
    /./g,
    (letra) =>
      String.fromCodePoint(
        127397 +
          letra.charCodeAt(0)
      )
  );
}

function normalizarIconeSalvo(
  valor: string | null | undefined,
  paisCodigo: string
) {
  const atual = String(
    valor || ""
  ).trim();

  // Compatibilidade com registros antigos
  // que tenham sido salvos como BR, FR, US etc.
  if (
    /^[A-Za-z]{2}$/.test(
      atual
    )
  ) {
    return bandeiraDoPais(
      atual
    );
  }

  if (atual) {
    return atual;
  }

  return bandeiraDoPais(
    paisCodigo
  );
}

`;

  texto = texto.replace(
    ancora,
    helpers +
      "export default function MasterFeriadosPage() {"
  );
}

/* =========================================================
   2. AO EDITAR: CONVERTER BR ANTIGO PARA BANDEIRA
========================================================= */

const regexEmojiEdicao =
  /emoji:\s*feriado\.emoji\s*\|\|\s*"",/m;

if (
  regexEmojiEdicao.test(texto)
) {
  texto = texto.replace(
    regexEmojiEdicao,
`emoji:
        normalizarIconeSalvo(
          feriado.emoji,
          feriado.paisCodigo
        ),`
  );
} else if (
  !texto.includes(
    "normalizarIconeSalvo(\n          feriado.emoji"
  )
) {
  throw new Error(
    "Campo emoji da edição não encontrado."
  );
}

/* =========================================================
   3. AO ESCOLHER PAÍS: BANDEIRA AUTOMÁTICA
========================================================= */

const regexPais =
  /(value=\{\s*form\.paisCodigo\s*\}\s*)onChange=\{\(\s*event\s*\)\s*=>\s*setForm\(\s*\(atual\)\s*=>\s*\(\{\s*\.\.\.atual,\s*paisCodigo:\s*event\s*\.target\s*\.value,\s*\}\)\s*\)\s*\}/m;

if (
  regexPais.test(texto)
) {
  texto = texto.replace(
    regexPais,
`$1onChange={(event) => {
                          const novoPais =
                            event.target.value;

                          setForm(
                            (atual) => ({
                              ...atual,
                              paisCodigo:
                                novoPais,
                              emoji:
                                novoPais
                                  ? bandeiraDoPais(
                                      novoPais
                                    )
                                  : "",
                            })
                          );
                        }}`
  );
} else if (
  !texto.includes(
    "const novoPais ="
  )
) {
  throw new Error(
    "Seletor de país não encontrado."
  );
}

/* =========================================================
   4. SUBSTITUI INPUT DE EMOJI POR BOTÕES VISUAIS
========================================================= */

const marcador =
  '{t("form.emoji")}';

const posicaoMarcador =
  texto.indexOf(marcador);

if (
  posicaoMarcador === -1
) {
  throw new Error(
    "Label form.emoji não encontrado."
  );
}

const inicioCampo =
  texto.lastIndexOf(
    "                    <label>",
    posicaoMarcador
  );

const fimCampo =
  texto.indexOf(
    "                    {form.tipo !==",
    posicaoMarcador
  );

if (
  inicioCampo === -1 ||
  fimCampo === -1
) {
  throw new Error(
    "Bloco visual do ícone não pôde ser localizado."
  );
}

const blocoVisual = `                    <div>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.emoji")}
                      </span>

                      <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.iconHint")}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {Array.from(
                          new Set([
                            ...(form.paisCodigo
                              ? [
                                  bandeiraDoPais(
                                    form.paisCodigo
                                  ),
                                ]
                              : []),
                            ...ICONES_RAPIDOS,
                          ])
                        ).map((icone) => {
                          const selecionado =
                            form.emoji ===
                            icone;

                          return (
                            <button
                              key={icone}
                              type="button"
                              aria-pressed={
                                selecionado
                              }
                              onClick={() =>
                                setForm(
                                  (atual) => ({
                                    ...atual,
                                    emoji:
                                      icone,
                                  })
                                )
                              }
                              className={\`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-xl transition \${
                                selecionado
                                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/50"
                                  : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                              }\`}
                            >
                              {icone}
                            </button>
                          );
                        })}
                      </div>
                    </div>

`;

texto =
  texto.slice(
    0,
    inicioCampo
  ) +
  blocoVisual +
  texto.slice(
    fimCampo
  );

/* =========================================================
   5. TABELA: MOSTRAR BANDEIRA MESMO EM REGISTRO ANTIGO BR
========================================================= */

const regexIconeTabela =
  /\{feriado\.emoji\s*\|\|\s*"📅"\}/m;

if (
  regexIconeTabela.test(texto)
) {
  texto = texto.replace(
    regexIconeTabela,
`{normalizarIconeSalvo(
                                  feriado.emoji,
                                  feriado.paisCodigo
                                )}`
  );
}

/* =========================================================
   6. TRADUÇÕES DO CAMPO
========================================================= */

const traducoes = {
  "pt-BR": {
    label:
      "Ícone do aviso",
    hint:
      "A bandeira do país é selecionada automaticamente. Clique em outro ícone se preferir.",
  },
  "pt-PT": {
    label:
      "Ícone do aviso",
    hint:
      "A bandeira do país é selecionada automaticamente. Clique noutro ícone se preferir.",
  },
  "en-US": {
    label:
      "Notice icon",
    hint:
      "The country's flag is selected automatically. Choose another icon if you prefer.",
  },
  "es-ES": {
    label:
      "Icono del aviso",
    hint:
      "La bandera del país se selecciona automáticamente. Elige otro icono si lo prefieres.",
  },
  "fr-FR": {
    label:
      "Icône de l’avis",
    hint:
      "Le drapeau du pays est sélectionné automatiquement. Choisissez une autre icône si vous le souhaitez.",
  },
};

const mensagensAtualizadas =
  {};

for (
  const [locale, dados]
  of Object.entries(
    traducoes
  )
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

  if (
    inicioMaster === -1
  ) {
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

  const regexEmoji =
    /"emoji"\s*:\s*"[^"]*"/;

  if (
    !regexEmoji.test(master)
  ) {
    throw new Error(
      `form.emoji não encontrado em ${locale}.`
    );
  }

  master = master.replace(
    regexEmoji,
    `"emoji": ${JSON.stringify(
      dados.label
    )}`
  );

  if (
    !master.includes(
      '"iconHint"'
    )
  ) {
    master = master.replace(
      /("emoji"\s*:\s*"[^"]*")/,
      `$1,\n      "iconHint": ${JSON.stringify(
        dados.hint
      )}`
    );
  }

  const final =
    antes + master;

  JSON.parse(final);

  mensagensAtualizadas[
    caminho
  ] = final;
}

/* =========================================================
   7. SÓ AGORA GRAVA TUDO
========================================================= */

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

for (
  const [caminho, conteudo]
  of Object.entries(
    mensagensAtualizadas
  )
) {
  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );
}

console.log(
  "✓ Campo de ícone convertido para seletor visual"
);
console.log(
  "✓ Bandeira automática por país habilitada"
);
console.log(
  "✓ Registro antigo BR será convertido visualmente"
);
console.log(
  "✓ Traduções atualizadas nos 5 idiomas"
);
