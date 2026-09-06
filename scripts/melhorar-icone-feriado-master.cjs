const fs = require("fs");

const arquivo = "app/master/feriados/page.tsx";
let texto = fs.readFileSync(arquivo, "utf8");

/* =========================================================
   1. FUNÇÕES PARA BANDEIRA AUTOMÁTICA
========================================================= */

const ancoraFuncoes = `
export default function MasterFeriadosPage() {`;

if (!texto.includes(ancoraFuncoes)) {
  throw new Error("Âncora para funções auxiliares não encontrada.");
}

const funcoesIcone = `
const ICONES_RAPIDOS = [
  "📅",
  "🎉",
  "🏛️",
  "⭐",
  "🎓",
] as const;

function bandeiraDoPais(codigo: string) {
  const normalizado = String(codigo || "")
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalizado)) {
    return "📅";
  }

  return normalizado
    .split("")
    .map((letra) =>
      String.fromCodePoint(
        127397 + letra.charCodeAt(0)
      )
    )
    .join("");
}

function normalizarIconeSalvo(
  valor: string | null | undefined,
  paisCodigo: string
) {
  const atual = String(valor || "").trim();

  // Compatibilidade com registros antigos salvos como BR, FR, US etc.
  if (/^[A-Za-z]{2}$/.test(atual)) {
    return bandeiraDoPais(atual);
  }

  if (atual) {
    return atual;
  }

  return bandeiraDoPais(paisCodigo);
}

export default function MasterFeriadosPage() {`;

texto = texto.replace(
  ancoraFuncoes,
  funcoesIcone
);

/* =========================================================
   2. AO ESCOLHER O PAÍS, SELECIONAR BANDEIRA AUTOMATICAMENTE
========================================================= */

const padraoPais =
  /onChange=\{\(\s*event\s*\)\s*=>\s*setForm\(\s*\(atual\)\s*=>\s*\(\{\s*\.\.\.atual,\s*paisCodigo:\s*event\s*\.target\s*\.value,\s*\}\)\s*\)\s*\}/m;

if (!padraoPais.test(texto)) {
  throw new Error("onChange do país não encontrado.");
}

texto = texto.replace(
  padraoPais,
`onChange={(event) => {
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

/* =========================================================
   3. CONVERTER BR ANTIGO PARA 🇧🇷 AO EDITAR
========================================================= */

const emojiEdicaoAntigo = `      emoji:
        feriado.emoji || "",`;

const emojiEdicaoNovo = `      emoji:
        normalizarIconeSalvo(
          feriado.emoji,
          feriado.paisCodigo
        ),`;

if (!texto.includes(emojiEdicaoAntigo)) {
  throw new Error("Campo emoji da edição não encontrado.");
}

texto = texto.replace(
  emojiEdicaoAntigo,
  emojiEdicaoNovo
);

/* =========================================================
   4. TROCAR INPUT DE TEXTO POR SELETOR VISUAL
========================================================= */

const inicioEmoji = texto.indexOf(
`                    <label>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.emoji")}`
);

if (inicioEmoji === -1) {
  throw new Error("Início do campo de ícone não encontrado.");
}

const marcadorDepoisEmoji =
`                    {form.tipo !==`;

const fimEmoji = texto.indexOf(
  marcadorDepoisEmoji,
  inicioEmoji
);

if (fimEmoji === -1) {
  throw new Error("Fim do campo de ícone não encontrado.");
}

const novoBlocoEmoji = `                    <div>
                      <span className="mb-2 block text-sm font-semibold">
                        {t("form.emoji")}
                      </span>

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
                            form.emoji === icone;

                          return (
                            <button
                              key={icone}
                              type="button"
                              aria-pressed={
                                selecionado
                              }
                              aria-label={\`\${t(
                                "form.emoji"
                              )}: \${icone}\`}
                              onClick={() =>
                                setForm(
                                  (atual) => ({
                                    ...atual,
                                    emoji: icone,
                                  })
                                )
                              }
                              className={\`flex h-11 min-w-11 items-center justify-center rounded-xl border px-3 text-xl transition \${
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
  texto.slice(0, inicioEmoji) +
  novoBlocoEmoji +
  texto.slice(fimEmoji);

fs.writeFileSync(arquivo, texto, "utf8");

/* =========================================================
   5. RENOMEAR O CAMPO NOS 5 IDIOMAS
========================================================= */

const mensagens = {
  "pt-BR": {
    antigo: '"emoji": "Emoji ou ícone"',
    novo: '"emoji": "Ícone do aviso"',
  },
  "pt-PT": {
    antigo: '"emoji": "Emoji ou ícone"',
    novo: '"emoji": "Ícone do aviso"',
  },
  "en-US": {
    antigo: '"emoji": "Emoji or icon"',
    novo: '"emoji": "Notice icon"',
  },
  "es-ES": {
    antigo: '"emoji": "Emoji o icono"',
    novo: '"emoji": "Icono del aviso"',
  },
  "fr-FR": {
    antigo: '"emoji": "Emoji ou icône"',
    novo: '"emoji": "Icône de l’avis"',
  },
};

for (const [locale, dados] of Object.entries(mensagens)) {
  const caminho = `messages/${locale}.json`;
  let conteudo = fs.readFileSync(caminho, "utf8");

  if (!conteudo.includes(dados.antigo)) {
    throw new Error(
      `Texto esperado não encontrado em ${locale}: ${dados.antigo}`
    );
  }

  conteudo = conteudo.replace(
    dados.antigo,
    dados.novo
  );

  JSON.parse(conteudo);

  fs.writeFileSync(
    caminho,
    conteudo,
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("✓ ÍCONE VISUAL DE FERIADOS IMPLEMENTADO");
console.log("✓ Bandeira automática por país habilitada");
console.log("✓ Registros antigos BR/FR/US serão convertidos visualmente");
