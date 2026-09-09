const fs = require("fs");

const pagePath = "app/professor/aulas/page.tsx";
const apiPath = "app/api/professor/aulas/route.ts";

let page = fs.readFileSync(pagePath, "utf8");
let api = fs.readFileSync(apiPath, "utf8");

const nlPage = page.includes("\r\n") ? "\r\n" : "\n";
const nlApi = api.includes("\r\n") ? "\r\n" : "\n";


// ============================================================
// 1. Limpar espaço extra da API
// ============================================================

api = api.replace(
  /titulo:\s*true,\s*\r?\n\s*\r?\n(\s*)ordem:\s*true,/,
  `titulo: true,${nlApi}$1ordem: true,`
);


// ============================================================
// 2. Acrescentar helpers de disciplina e turma
//    se ainda não estiverem no sorter
// ============================================================

const alvoTitulo =
`    const tituloA = (a.titulo || a.nome || "").trim();
    const tituloB = (b.titulo || b.nome || "").trim();`;

const novoTitulo =
`    const tituloA = (a.titulo || a.nome || "").trim();
    const tituloB = (b.titulo || b.nome || "").trim();

    const disciplinaA = (a.disciplina?.nome || "").trim();
    const disciplinaB = (b.disciplina?.nome || "").trim();

    const turmaA = (a.turma?.nome || "").trim();
    const turmaB = (b.turma?.nome || "").trim();`;

if (
  !page.includes("const disciplinaA =") &&
  page.includes(alvoTitulo)
) {
  page = page.replace(alvoTitulo, novoTitulo);
}


// ============================================================
// 3. Corrigir ordem crescente:
//    disciplina -> turma -> ordem -> título
// ============================================================

const regexAsc =
/case "ordemAsc": \{[\s\S]*?return compararTexto\(tituloA, tituloB\);\r?\n\s*\}/;

const novoAsc =
`case "ordemAsc": {
        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );

        if (porDisciplina !== 0) {
          return porDisciplina;
        }

        const porTurma = compararTexto(
          turmaA,
          turmaB
        );

        if (porTurma !== 0) {
          return porTurma;
        }

        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return compararTexto(tituloA, tituloB);
      }`;

if (!regexAsc.test(page)) {
  throw new Error(
    "Bloco ordemAsc não encontrado para correção."
  );
}

page = page.replace(
  regexAsc,
  novoAsc.replace(/\n/g, nlPage)
);


// ============================================================
// 4. Corrigir ordem decrescente:
//    disciplina -> turma -> ordem desc -> título
// ============================================================

const regexDesc =
/case "ordemDesc": \{[\s\S]*?return compararTexto\(tituloA, tituloB\);\r?\n\s*\}/;

const novoDesc =
`case "ordemDesc": {
        const porDisciplina = compararTexto(
          disciplinaA,
          disciplinaB
        );

        if (porDisciplina !== 0) {
          return porDisciplina;
        }

        const porTurma = compararTexto(
          turmaA,
          turmaB
        );

        if (porTurma !== 0) {
          return porTurma;
        }

        if (ordemAValida !== ordemBValida) {
          return ordemAValida ? -1 : 1;
        }

        if (ordemA !== ordemB) {
          return ordemB - ordemA;
        }

        return compararTexto(tituloA, tituloB);
      }`;

if (!regexDesc.test(page)) {
  throw new Error(
    "Bloco ordemDesc não encontrado para correção."
  );
}

page = page.replace(
  regexDesc,
  novoDesc.replace(/\n/g, nlPage)
);


fs.writeFileSync(pagePath, page, "utf8");
fs.writeFileSync(apiPath, api, "utf8");

console.log(
  "OK: ordenação por aula agora respeita Disciplina -> Turma -> Ordem."
);

console.log(
  "OK: formatação da API limpa."
);
