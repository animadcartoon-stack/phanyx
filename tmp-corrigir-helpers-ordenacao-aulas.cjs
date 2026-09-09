const fs = require("fs");

const path = "app/professor/aulas/page.tsx";

let s = fs.readFileSync(path, "utf8");

if (
  s.includes("const disciplinaA =") &&
  s.includes("const disciplinaB =") &&
  s.includes("const turmaA =") &&
  s.includes("const turmaB =")
) {
  console.log("OK: helpers de disciplina/turma já existem.");
  process.exit(0);
}

const regex =
/(\s*const tituloA = \(a\.titulo \|\| a\.nome \|\| ""\)\.trim\(\);\r?\n\s*const tituloB = \(b\.titulo \|\| b\.nome \|\| ""\)\.trim\(\);)/;

const match = s.match(regex);

if (!match) {
  throw new Error(
    "Bloco tituloA/tituloB não encontrado."
  );
}

const nl = s.includes("\r\n") ? "\r\n" : "\n";

const insercao =
match[1] +
nl + nl +
`    const disciplinaA = (a.disciplina?.nome || "").trim();` +
nl +
`    const disciplinaB = (b.disciplina?.nome || "").trim();` +
nl + nl +
`    const turmaA = (a.turma?.nome || "").trim();` +
nl +
`    const turmaB = (b.turma?.nome || "").trim();`;

s = s.replace(regex, insercao);

fs.writeFileSync(path, s, "utf8");

console.log("OK: disciplinaA/disciplinaB adicionados.");
console.log("OK: turmaA/turmaB adicionados.");
