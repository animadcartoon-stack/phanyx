const fs = require("fs");

const path = "app/professor/aulas/page.tsx";

let s = fs.readFileSync(path, "utf8");

const nl = s.includes("\r\n") ? "\r\n" : "\n";


// ============================================================
// 1. TIPO DA VISUALIZAÇÃO
// ============================================================

if (!s.includes('type VisualizacaoAulas = "cards" | "lista";')) {
  const marcador =
    "export default function ProfessorAulasPage()";

  const pos = s.indexOf(marcador);

  if (pos === -1) {
    throw new Error(
      "ProfessorAulasPage não encontrado."
    );
  }

  const tipo =
`type VisualizacaoAulas = "cards" | "lista";

`;

  s =
    s.slice(0, pos) +
    tipo.replace(/\n/g, nl) +
    s.slice(pos);
}


// ============================================================
// 2. STATE
// ============================================================

if (!s.includes("const [visualizacao, setVisualizacao]")) {
  const regex =
/(\s*const \[ordenacao, setOrdenacao\] =\r?\n\s*useState<OrdenacaoAulas>\("ordemAsc"\);)/;

  const match = s.match(regex);

  if (!match) {
    throw new Error(
      "State de ordenação não encontrado."
    );
  }

  const novo =
match[1] +
nl +
`  const [visualizacao, setVisualizacao] =` +
nl +
`    useState<VisualizacaoAulas>("cards");`;

  s = s.replace(regex, novo);
}


// ============================================================
// 3. CONTROLE CARDS / LISTA
// ============================================================

if (!s.includes('aria-label={t("view.label")}')) {
  const selectPos = s.indexOf(
    'id="ordenacao-aulas"'
  );

  if (selectPos === -1) {
    throw new Error(
      "Select de ordenação não encontrado."
    );
  }

  const fimSelect = s.indexOf(
    "</select>",
    selectPos
  );

  if (fimSelect === -1) {
    throw new Error(
      "Fechamento do select não encontrado."
    );
  }

  const posInsercao =
    fimSelect + "</select>".length;

  const controle =
`

            <div className="flex items-center gap-2 sm:ml-3">
              <span className="hidden text-sm font-bold text-slate-700 dark:text-slate-200 lg:inline">
                {t("view.label")}
              </span>

              <div
                className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm dark:border-slate-600 dark:bg-slate-900"
                aria-label={t("view.label")}
              >
                <button
                  type="button"
                  onClick={() => setVisualizacao("cards")}
                  aria-pressed={visualizacao === "cards"}
                  title={t("view.cards")}
                  className={
                    visualizacao === "cards"
                      ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>

                  <span className="hidden sm:inline">
                    {t("view.cards")}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setVisualizacao("lista")}
                  aria-pressed={visualizacao === "lista"}
                  title={t("view.list")}
                  className={
                    visualizacao === "lista"
                      ? "inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm"
                      : "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M8 6h13" />
                    <path d="M8 12h13" />
                    <path d="M8 18h13" />
                    <path d="M3 6h.01" />
                    <path d="M3 12h.01" />
                    <path d="M3 18h.01" />
                  </svg>

                  <span className="hidden sm:inline">
                    {t("view.list")}
                  </span>
                </button>
              </div>
            </div>
`;

  s =
    s.slice(0, posInsercao) +
    controle.replace(/\n/g, nl) +
    s.slice(posInsercao);
}


// ============================================================
// 4. GRID DINÂMICO
// ============================================================

const gridAntigo =
  '<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">';

if (s.includes(gridAntigo)) {
  const gridNovo =
`<div
          className={
            visualizacao === "cards"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "grid grid-cols-1 gap-3"
          }
        >`;

  s = s.replace(
    gridAntigo,
    gridNovo.replace(/\n/g, nl)
  );
}


// ============================================================
// 5. CARD / LINHA DINÂMICO
// ============================================================

const artigoAntigo =
  'className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"';

if (s.includes(artigoAntigo)) {
  const artigoNovo =
`className={
                visualizacao === "cards"
                  ? "rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
                  : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
              }`;

  s = s.replace(
    artigoAntigo,
    artigoNovo.replace(/\n/g, nl)
  );
}


// ============================================================
// GRAVAR
// ============================================================

fs.writeFileSync(path, s, "utf8");

console.log("OK: visualização Cards/Lista adicionada.");
console.log("OK: Cards permanece como visualização padrão.");
console.log("OK: layout Lista usa uma aula por linha.");
