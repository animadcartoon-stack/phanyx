const fs = require("fs");

const arquivos = [
  "app/admin/AdminShell.tsx",
  "app/aluno/layout.tsx",
  "app/professor/layout.tsx",
];

for (const arquivo of arquivos) {
  let conteudo = fs.readFileSync(arquivo, "utf8");

  const original = conteudo;

  conteudo = conteudo.replace(
    /^import PhanyxFeriadoAviso from "@\/components\/ui\/PhanyxFeriadoAviso";\r?\n/m,
    ""
  );

  conteudo = conteudo.replace(
    /^\s*\{!esconderSidebar && <PhanyxFeriadoAviso \/>\}\s*\r?\n/m,
    ""
  );

  conteudo = conteudo.replace(
    /^\s*<PhanyxFeriadoAviso \/>\s*\r?\n/m,
    ""
  );

  if (conteudo === original) {
    console.log(`Nenhuma alteração necessária: ${arquivo}`);
    continue;
  }

  fs.writeFileSync(arquivo, conteudo, "utf8");

  console.log(`Corrigido: ${arquivo}`);
}