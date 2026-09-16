import fs from "node:fs";

const arquivo = "app/globals.css";

let css = fs.readFileSync(
  arquivo,
  "utf8"
);

const antigo = `html[data-theme-choice="system"].dark
  [class*="bg-gradient"][class*="from-blue-"] {
  background-image: none !important;
  background-color: #262626 !important;
  border-color: #525252 !important;
}`;

const novo = `html.dark[data-theme="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-blue-"],
html.dark[data-theme="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-cyan-"],
html.dark[data-theme="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-sky-"],
html.dark[data-theme="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-indigo-"],
html.dark[data-theme-choice="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-blue-"],
html.dark[data-theme-choice="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-cyan-"],
html.dark[data-theme-choice="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-sky-"],
html.dark[data-theme-choice="system"]
  [class*="rounded-"][class*="bg-gradient"][class*="from-indigo-"] {
  background: #262626 !important;
  background-image: none !important;
  border-color: #525252 !important;
}`;

if (!css.includes(antigo)) {
  throw new Error(
    "A regra antiga não foi encontrada. Nenhuma alteração foi feita."
  );
}

css = css.replace(
  antigo,
  novo
);

fs.writeFileSync(
  arquivo,
  css,
  "utf8"
);

console.log(
  "✓ Regra do tema Sistema atualizada com segurança"
);
