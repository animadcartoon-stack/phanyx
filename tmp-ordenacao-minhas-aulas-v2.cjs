const fs = require("fs");

const pagePath = "app/professor/aulas/page.tsx";
const apiPath = "app/api/professor/aulas/route.ts";

let page = fs.readFileSync(pagePath, "utf8");
let api = fs.readFileSync(apiPath, "utf8");

const nlPage = page.includes("\r\n") ? "\r\n" : "\n";
const nlApi = api.includes("\r\n") ? "\r\n" : "\n";


// ============================================================
// 1. API - acrescentar "ordem: true" SOMENTE no select de Aula
// ============================================================

const inicioAulas = api.indexOf(
  "const aulas = await prisma.aula.findMany({"
);

if (inicioAulas === -1) {
  throw new Error(
    "Bloco prisma.aula.findMany não encontrado na API."
  );
}

const fimAulas = api.indexOf(
  `${nlApi}    });`,
  inicioAulas
);

if (fimAulas === -1) {
  throw new Error(
    "Final do prisma.aula.findMany não encontrado."
  );
}

let blocoAulas = api.slice(
  inicioAulas,
  fimAulas
);

if (!blocoAulas.includes("ordem: true,")) {
  const regexTitulo = /^(\s*)titulo:\s*true,\s*$/m;
  const matchTitulo = blocoAulas.match(regexTitulo);

  if (!matchTitulo) {
    throw new Error(
      'Campo "titulo: true" não encontrado no select da Aula.'
    );
  }

  const indent = matchTitulo[1];

  blocoAulas = blocoAulas.replace(
    regexTitulo,
    `${indent}titulo: true,${nlApi}${indent}ordem: true,`
  );

  api =
    api.slice(0, inicioAulas) +
    blocoAulas +
    api.slice(fimAulas);
}


// ============================================================
// 2. PAGE - acrescentar ordem e createdAt ao tipo
// ============================================================

if (!page.includes("ordem?: number | null;")) {
  const regexTituloTipo = /^(\s*)titulo\?: string;\s*$/m;
  const match = page.match(regexTituloTipo);

  if (!match) {
    throw new Error(
      "titulo?: string não encontrado em AulaProfessor."
    );
  }

  const indent = match[1];

  page = page.replace(
    regexTituloTipo,
    `${indent}titulo?: string;${nlPage}` +
      `${indent}ordem?: number | null;`
  );
}

if (!page.includes("createdAt?: string | null;")) {
  const regexOrdemTipo = /^(\s*)ordem\?: number \| null;\s*$/m;
  const match = page.match(regexOrdemTipo);

  if (!match) {
    throw new Error(
      "Campo ordem não encontrado para inserir createdAt."
    );
  }

  const indent = match[1];

  page = page.replace(
    regexOrdemTipo,
    `${indent}ordem?: number | null;${nlPage}` +
      `${indent}createdAt?: string | null;`
  );
}


// ============================================================
// 3. Tipo das opções de ordenação
// ============================================================

if (!page.includes("type OrdenacaoAulas =")) {
  const marcador =
    "export default function ProfessorAulasPage()";

  const pos = page.indexOf(marcador);

  if (pos === -1) {
    throw new Error(
      "Componente ProfessorAulasPage não encontrado."
    );
  }

  const tipo =
`type OrdenacaoAulas =
  | "ordemAsc"
  | "ordemDesc"
  | "alfabeticaAsc"
  | "alfabeticaDesc"
  | "postagemRecente"
  | "postagemAntiga";

`;

  page =
    page.slice(0, pos) +
    tipo.replace(/\n/g, nlPage) +
    page.slice(pos);
}


// ============================================================
// 4. State
// ============================================================

if (!page.includes("const [ordenacao, setOrdenacao]")) {
  const regexErro =
    /^(\s*)const \[erro, setErro\] = useState\(""\);\s*$/m;

  const match = page.match(regexErro);

  if (!match) {
    throw new Error(
      "State de erro não encontrado."
    );
  }

  const indent = match[1];

  page = page.replace(
    regexErro,
    `${indent}const [erro, setErro] = useState("");${nlPage}` +
      `${indent}const [ordenacao, setOrdenacao] =${nlPage}` +
      `${indent}  useState<OrdenacaoAulas>("ordemAsc");`
  );
}


// ============================================================
// 5. Criar aulasOrdenadas antes do return principal
// ============================================================

if (!page.includes("const aulasOrdenadas =")) {
  const inicioComponente = page.indexOf(
    "export default function ProfessorAulasPage()"
  );

  const marcadorReturn = `${nlPage}  return (`;

  const posReturn = page.indexOf(
    marcadorReturn,
    inicioComponente
  );

  if (posReturn === -1) {
    throw new Error(
      "Return principal da página não encontrado."
    );
  }

  const codigoOrdenacao =
`
  const aulasOrdenadas = [...aulas].sort((a, b) => {
    const tituloA = (a.titulo || a.nome || "").trim();
    const tituloB = (b.titulo || b.nome || "").trim();

    const ordemAValida = typeof a.ordem === "number";
    const ordemBValida = typeof b.ordem === "number";

    const ordemA = ordemAValida ? a.ordem! : 0;
    const ordemB = ordemBValida ? b.ordem! : 0;

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
        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return compararTexto(tituloA, tituloB);
      }

      case "ordemDesc": {
        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemB - ordemA;
        }

        return compararTexto(tituloA, tituloB);
      }

      case "alfabeticaAsc":
        return compararTexto(tituloA, tituloB);

      case "alfabeticaDesc":
        return compararTexto(tituloB, tituloA);

      case "postagemAntiga": {
        if (dataA !== dataB) {
          return dataA - dataB;
        }

        return a.id - b.id;
      }

      case "postagemRecente":
      default: {
        if (dataA !== dataB) {
          return dataB - dataA;
        }

        return b.id - a.id;
      }
    }
  });
`;

  page =
    page.slice(0, posReturn) +
    codigoOrdenacao.replace(/\n/g, nlPage) +
    page.slice(posReturn);
}


// ============================================================
// 6. Trocar aulas.map por aulasOrdenadas.map
// ============================================================

if (
  page.includes("{aulas.map((aula) => (") &&
  !page.includes("{aulasOrdenadas.map((aula) => (")
) {
  page = page.replace(
    "{aulas.map((aula) => (",
    "{aulasOrdenadas.map((aula) => ("
  );
}


// ============================================================
// 7. Inserir seletor sem mexer na estrutura do grid
// ============================================================

if (!page.includes('id="ordenacao-aulas"')) {
  const marcador =
    `${nlPage}      {!loading && !erro && aulas.length > 0 && (`;

  const pos = page.indexOf(marcador);

  if (pos === -1) {
    throw new Error(
      "Bloco da lista de aulas não encontrado."
    );
  }

  const seletor =
`
      {!loading && !erro && aulas.length > 0 && (
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
      )}
`;

  page =
    page.slice(0, pos) +
    seletor.replace(/\n/g, nlPage) +
    page.slice(pos);
}


// ============================================================
// GRAVAR SOMENTE DEPOIS DE TODAS AS VALIDAÇÕES
// ============================================================

fs.writeFileSync(
  pagePath,
  page,
  "utf8"
);

fs.writeFileSync(
  apiPath,
  api,
  "utf8"
);

console.log("OK: API atualizada com ordem.");
console.log("OK: filtro de ordenação adicionado em Minhas Aulas.");
console.log("OK: aulas.map substituído por aulasOrdenadas.map.");
