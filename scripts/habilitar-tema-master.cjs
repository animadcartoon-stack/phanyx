const fs = require("fs");

const arquivos = [
  "components/theme/PhanyxThemeToggle.tsx",
  "components/theme/PhanyxThemeBoot.tsx",
];

for (const arquivo of arquivos) {
  let texto = fs.readFileSync(arquivo, "utf8");

  const antigo = `  const rotaComTemaPrivado =
    rotaAtual.startsWith("/admin") ||
    rotaAtual.startsWith("/professor") ||
    rotaAtual.startsWith("/aluno");`;

  const novo = `  const rotaComTemaPrivado =
    rotaAtual.startsWith("/admin") ||
    rotaAtual.startsWith("/professor") ||
    rotaAtual.startsWith("/aluno") ||
    rotaAtual.startsWith("/master");`;

  if (!texto.includes(antigo)) {
    throw new Error(
      \`Trecho esperado não encontrado em \${arquivo}\`
    );
  }

  texto = texto.replace(antigo, novo);

  fs.writeFileSync(arquivo, texto, "utf8");

  console.log("✓", arquivo);
}

console.log("\n✓ /master habilitado nos temas PHANYX");
