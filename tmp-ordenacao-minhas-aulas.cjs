const fs = require("fs");

const pagePath = "app/professor/aulas/page.tsx";
const apiPath = "app/api/professor/aulas/route.ts";

let page = fs.readFileSync(pagePath, "utf8");
let api = fs.readFileSync(apiPath, "utf8");


// ============================================================
// API: incluir ordem
// ============================================================

if (!api.includes("ordem: true,")) {
  const alvoApi = `        titulo: true,
        descricao: true,`;

  const novoApi = `        titulo: true,
        ordem: true,
        descricao: true,`;

  if (!api.includes(alvoApi)) {
    throw new Error("Ponto para adicionar ordem na API não encontrado.");
  }

  api = api.replace(alvoApi, novoApi);
}


// ============================================================
// PAGE: tipo
// ============================================================

if (!page.includes("ordem?: number | null;")) {
  const alvoTipo = `  titulo?: string;
  nome?: string;`;

  const novoTipo = `  titulo?: string;
  nome?: string;
  ordem?: number | null;
  createdAt?: string | null;`;

  if (!page.includes(alvoTipo)) {
    throw new Error("Tipo AulaProfessor não encontrado.");
  }

  page = page.replace(alvoTipo, novoTipo);
}


// ============================================================
// PAGE: tipo de ordenação
// ============================================================

if (!page.includes("type OrdenacaoAulas =")) {
  const alvo = `export default function ProfessorAulasPage() {`;

  const novo = `type OrdenacaoAulas =
  | "ordemAsc"
  | "ordemDesc"
  | "alfabeticaAsc"
  | "alfabeticaDesc"
  | "postagemRecente"
  | "postagemAntiga";

export default function ProfessorAulasPage() {`;

  if (!page.includes(alvo)) {
    throw new Error("Início do componente não encontrado.");
  }

  page = page.replace(alvo, novo);
}


// ============================================================
// PAGE: state
// ============================================================

if (!page.includes("const [ordenacao, setOrdenacao]")) {
  const alvo = `  const [erro, setErro] = useState("");`;

  const novo = `  const [erro, setErro] = useState("");
  const [ordenacao, setOrdenacao] =
    useState<OrdenacaoAulas>("ordemAsc");`;

  if (!page.includes(alvo)) {
    throw new Error("State erro não encontrado.");
  }

  page = page.replace(alvo, novo);
}


// ============================================================
// PAGE: criar aulasOrdenadas antes do return
// ============================================================

if (!page.includes("const aulasOrdenadas =")) {
  const alvo = `  return (`;

  const novo = `  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const tituloA = (a.titulo || a.nome || "").trim();
    const tituloB = (b.titulo || b.nome || "").trim();

    const disciplinaA = a.disciplina?.nome || "";
    const disciplinaB = b.disciplina?.nome || "";

    const turmaA = a.turma?.nome || "";
    const turmaB = b.turma?.nome || "";

    const ordemA =
      typeof a.ordem === "number"
        ? a.ordem
        : Number.MAX_SAFE_INTEGER;

    const ordemB =
      typeof b.ordem === "number"
        ? b.ordem
        : Number.MAX_SAFE_INTEGER;

    const dataA = a.createdAt
      ? new Date(a.createdAt).getTime()
      : 0;

    const dataB = b.createdAt
      ? new Date(b.createdAt).getTime()
      : 0;

    const compararTexto = (x: string, y: string) =>
      x.localeCompare(y, locale, {
        sensitivity: "base",
        numeric: true,
      });

    switch (ordenacao) {
      case "ordemAsc": {
        const porOrdem = ordemA - ordemB;
        if (porOrdem !== 0) return porOrdem;

        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );
        if (porDisciplina !== 0) return porDisciplina;

        const porTurma = compararTexto(turmaA, turmaB);
        if (porTurma !== 0) return porTurma;

        return compararTexto(tituloA, tituloB);
      }

      case "ordemDesc": {
        const porOrdem = ordemB - ordemA;
        if (porOrdem !== 0) return porOrdem;

        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );
        if (porDisciplina !== 0) return porDisciplina;

        return compararTexto(tituloA, tituloB);
      }

      case "alfabeticaAsc":
        return compararTexto(tituloA, tituloB);

      case "alfabeticaDesc":
        return compararTexto(tituloB, tituloA);

      case "postagemAntiga": {
        const porData = dataA - dataB;
        if (porData !== 0) return porData;
        return a.id - b.id;
      }

      case "postagemRecente":
      default: {
        const porData = dataB - dataA;
        if (porData !== 0) return porData;
        return b.id - a.id;
      }
    }
  });

  return (`;

  if (!page.includes(alvo)) {
    throw new Error("return principal não encontrado.");
  }

  page = page.replace(alvo, novo);
}


// ============================================================
// PAGE: trocar aulas.map
// ============================================================

if (page.includes("{aulas.map((aula) => (")) {
  page = page.replace(
    "{aulas.map((aula) => (",
    "{aulasOrdenadas.map((aula) => ("
  );
}


// ============================================================
// PAGE: seletor antes do grid
// ============================================================

if (!page.includes('id="ordenacao-aulas"')) {
  const alvo = `      {!loading && !erro && aulas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">`;

  const novo = `      {!loading && !erro && aulas.length > 0 && (
        <>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <label
              htmlFor="ordenacao-aulas"
              className="text-sm font-bold text-slate-700 dark:text-slate-200"
            >
              {t("sort.label")}
            </label>

            <select
              id="ordenacao-aulas"
              value={ordenacao}
              onChange={(event) =>
                setOrdenacao(
                  event.target.value as OrdenacaoAulas
                )
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-white sm:w-auto"
            >
              <option value="ordemAsc">
                {t("sort.lessonAsc")}
              </option>
              <option value="ordemDesc">
                {t("sort.lessonDesc")}
              </option>
              <option value="alfabeticaAsc">
                {t("sort.alphabeticalAsc")}
              </option>
              <option value="alfabeticaDesc">
                {t("sort.alphabeticalDesc")}
              </option>
              <option value="postagemRecente">
                {t("sort.newest")}
              </option>
              <option value="postagemAntiga">
                {t("sort.oldest")}
              </option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">`;

  if (!page.includes(alvo)) {
    throw new Error(
      "Grid de aulas não encontrado para inserir o seletor."
    );
  }

  page = page.replace(alvo, novo);


  // fechar fragmento depois do grid
  const fechamento = `          ))}
        </div>
      )}`;

  const fechamentoNovo = `          ))}
          </div>
        </>
      )}`;

  const pos = page.lastIndexOf(fechamento);

  if (pos === -1) {
    throw new Error(
      "Fechamento do grid não encontrado."
    );
  }

  page =
    page.slice(0, pos) +
    fechamentoNovo +
    page.slice(pos + fechamento.length);
}


fs.writeFileSync(pagePath, page, "utf8");
fs.writeFileSync(apiPath, api, "utf8");

console.log("OK: página e API atualizadas.");
