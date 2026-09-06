const fs = require("fs");

const arquivo = "app/master/feriados/page.tsx";
let texto = fs.readFileSync(arquivo, "utf8");

/* =========================================================
   1. IMPORTA O COMPONENTE DE BANDEIRA REAL
========================================================= */

const importBandeira =
  'import BandeiraPais from "@/components/internacionalizacao/BandeiraPais";';

if (!texto.includes(importBandeira)) {
  const ancora =
    'import Link from "next/link";';

  if (!texto.includes(ancora)) {
    throw new Error("Import do Link não encontrado.");
  }

  texto = texto.replace(
    ancora,
    `${ancora}
${importBandeira}`
  );
}

/* =========================================================
   2. SUBSTITUI HELPERS ANTIGOS DE EMOJI DE BANDEIRA
========================================================= */

const inicioHelpers =
  texto.indexOf("const ICONES_RAPIDOS = [");

const fimHelpers =
  texto.indexOf(
    "export default function MasterFeriadosPage() {"
  );

if (
  inicioHelpers === -1 ||
  fimHelpers === -1 ||
  fimHelpers <= inicioHelpers
) {
  throw new Error(
    "Bloco de helpers de ícone não encontrado."
  );
}

const novosHelpers = `const ICONES_RAPIDOS = [
  "📅",
  "🎉",
  "🏛️",
  "⭐",
  "🎓",
] as const;

function usarBandeiraDoPais(
  valor: string | null | undefined
) {
  const atual = String(
    valor || ""
  ).trim();

  return (
    !atual ||
    /^[A-Za-z]{2}$/.test(atual)
  );
}

function normalizarIconeSalvo(
  valor: string | null | undefined
) {
  const atual = String(
    valor || ""
  ).trim();

  // Registros antigos salvos como BR, FR, US etc.
  // passam a usar automaticamente a bandeira gráfica.
  if (
    !atual ||
    /^[A-Za-z]{2}$/.test(atual)
  ) {
    return "";
  }

  return atual;
}

`;

texto =
  texto.slice(0, inicioHelpers) +
  novosHelpers +
  texto.slice(fimHelpers);

/* =========================================================
   3. AO EDITAR, BR ANTIGO PASSA A SIGNIFICAR
      "USAR BANDEIRA AUTOMÁTICA"
========================================================= */

texto = texto.replace(
  /emoji:\s*normalizarIconeSalvo\(\s*feriado\.emoji,\s*feriado\.paisCodigo\s*\),/m,
  `emoji:
        normalizarIconeSalvo(
          feriado.emoji
        ),`
);

/* Caso ainda esteja no formato anterior */
texto = texto.replace(
  /emoji:\s*feriado\.emoji\s*\|\|\s*"",/m,
  `emoji:
        normalizarIconeSalvo(
          feriado.emoji
        ),`
);

/* =========================================================
   4. AO TROCAR O PAÍS, VOLTA PARA BANDEIRA AUTOMÁTICA
========================================================= */

texto = texto.replace(
  /emoji:\s*novoPais\s*\?\s*bandeiraDoPais\(\s*novoPais\s*\)\s*:\s*"",/m,
  `emoji: "",`
);

/* =========================================================
   5. SUBSTITUI O SELETOR VISUAL DE ÍCONES
========================================================= */

const marcadorEmoji =
  '{t("form.emoji")}';

const posicaoEmoji =
  texto.indexOf(marcadorEmoji);

if (posicaoEmoji === -1) {
  throw new Error(
    "Campo form.emoji não encontrado."
  );
}

const inicioCampo =
  texto.lastIndexOf(
    "                    <div>",
    posicaoEmoji
  );

const fimCampo =
  texto.indexOf(
    "                    {form.tipo !==",
    posicaoEmoji
  );

if (
  inicioCampo === -1 ||
  fimCampo === -1
) {
  throw new Error(
    "Bloco visual do ícone não encontrado."
  );
}

const novoCampoIcone = `                    <div>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.emoji")}
                      </span>

                      <p className="mb-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {t("form.iconHint")}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {form.paisCodigo && (
                          <button
                            type="button"
                            aria-pressed={
                              form.emoji === ""
                            }
                            onClick={() =>
                              setForm(
                                (atual) => ({
                                  ...atual,
                                  emoji: "",
                                })
                              )
                            }
                            className={\`flex h-12 min-w-14 items-center justify-center rounded-xl border px-3 transition \${
                              form.emoji === ""
                                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-500/20 dark:bg-blue-950/50"
                                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                            }\`}
                          >
                            <BandeiraPais
                              codigo={
                                form.paisCodigo
                              }
                              nome={nomePais(
                                form.paisCodigo
                              )}
                              className="h-7 w-10 rounded-md object-cover shadow-sm"
                            />
                          </button>
                        )}

                        {ICONES_RAPIDOS.map(
                          (icone) => {
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
                          }
                        )}
                      </div>
                    </div>

`;

texto =
  texto.slice(0, inicioCampo) +
  novoCampoIcone +
  texto.slice(fimCampo);

/* =========================================================
   6. PREVIEW: BANDEIRA REAL QUANDO ÍCONE AUTOMÁTICO
========================================================= */

const regexPreview =
  /<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-800">\s*\{form\.emoji\s*\|\|\s*"📅"\}\s*<\/div>/m;

if (regexPreview.test(texto)) {
  texto = texto.replace(
    regexPreview,
`<div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl shadow-sm dark:bg-slate-800">
                        {form.paisCodigo &&
                        form.emoji === "" ? (
                          <BandeiraPais
                            codigo={
                              form.paisCodigo
                            }
                            nome={nomePais(
                              form.paisCodigo
                            )}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          form.emoji || "📅"
                        )}
                      </div>`
  );
}

/* =========================================================
   7. TABELA: BANDEIRA REAL PARA BR ANTIGO OU AUTOMÁTICO
========================================================= */

const inicioTabela =
  texto.indexOf(
    "feriadosFiltrados.map"
  );

if (inicioTabela === -1) {
  throw new Error(
    "Tabela de feriados não encontrada."
  );
}

const trechoAntesTabela =
  texto.slice(0, inicioTabela);

let trechoTabela =
  texto.slice(inicioTabela);

const regexCaixaIconeTabela =
  /<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl dark:bg-slate-800">[\s\S]*?<\/span>/m;

if (!regexCaixaIconeTabela.test(trechoTabela)) {
  throw new Error(
    "Ícone da tabela não encontrado."
  );
}

trechoTabela =
  trechoTabela.replace(
    regexCaixaIconeTabela,
`<span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xl dark:bg-slate-800">
                                {usarBandeiraDoPais(
                                  feriado.emoji
                                ) ? (
                                  <BandeiraPais
                                    codigo={
                                      feriado.paisCodigo
                                    }
                                    nome={nomePais(
                                      feriado.paisCodigo
                                    )}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  feriado.emoji
                                )}
                              </span>`
  );

texto =
  trechoAntesTabela +
  trechoTabela;

/* =========================================================
   8. GRAVA
========================================================= */

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log("✓ Bandeira gráfica integrada ao formulário");
console.log("✓ Preview atualizado");
console.log("✓ Tabela atualizada");
console.log("✓ BR antigo tratado automaticamente");
