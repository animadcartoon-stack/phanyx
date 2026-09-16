import fs from "node:fs";

const arquivo = "app/globals.css";

let css = fs.readFileSync(
  arquivo,
  "utf8"
);

const marcador =
  "PHANYX — SISTEMA ESCURO — SUPERFICIES GLOBAIS NEUTRAS";

if (css.includes(marcador)) {
  console.log(
    "✓ Regra global do Sistema já existe. Nada foi duplicado."
  );

  process.exit(0);
}

const bloco = `

/* =========================================================
   PHANYX — SISTEMA ESCURO — SUPERFICIES GLOBAIS NEUTRAS
   Azul fica para ações, seleção e foco.
   Cards, buscas e selects usam cinzas neutros.
   ========================================================= */

@media (prefers-color-scheme: dark) {

  /* -------------------------------------------------------
     HERO / CARDS COM GRADIENTE AZUL
     ------------------------------------------------------- */

  html[data-theme="system"].dark
    header[class*="bg-gradient"][class*="from-blue-"],
  html[data-theme="system"].dark
    header[class*="bg-gradient"][class*="from-cyan-"],
  html[data-theme="system"].dark
    header[class*="bg-gradient"][class*="from-sky-"],
  html[data-theme="system"].dark
    header[class*="bg-gradient"][class*="from-indigo-"],
  html[data-theme="system"].dark
    section[class*="bg-gradient"][class*="from-blue-"],
  html[data-theme="system"].dark
    section[class*="bg-gradient"][class*="from-cyan-"],
  html[data-theme="system"].dark
    section[class*="bg-gradient"][class*="from-sky-"],
  html[data-theme="system"].dark
    section[class*="bg-gradient"][class*="from-indigo-"],
  html[data-theme="system"].dark
    div[class*="rounded-3xl"][class*="bg-gradient"][class*="from-blue-"],
  html[data-theme="system"].dark
    div[class*="rounded-3xl"][class*="bg-gradient"][class*="from-cyan-"],
  html[data-theme="system"].dark
    div[class*="rounded-3xl"][class*="bg-gradient"][class*="from-sky-"],
  html[data-theme="system"].dark
    div[class*="rounded-3xl"][class*="bg-gradient"][class*="from-indigo-"] {
    background: #262626 !important;
    background-color: #262626 !important;
    background-image: none !important;
    border-color: #525252 !important;
  }


  /* -------------------------------------------------------
     CAMPOS DE BUSCA
     ------------------------------------------------------- */

  html[data-theme="system"].dark
    input[type="search"],
  html[data-theme="system"].dark
    input[role="searchbox"] {
    background: #303030 !important;
    background-color: #303030 !important;
    border-color: #686868 !important;
    color: #ffffff !important;
  }

  html[data-theme="system"].dark
    input[type="search"]::placeholder,
  html[data-theme="system"].dark
    input[role="searchbox"]::placeholder {
    color: #b5b5b5 !important;
    -webkit-text-fill-color: #b5b5b5 !important;
    opacity: 1 !important;
  }


  /* -------------------------------------------------------
     SELECTS NATIVOS
     ------------------------------------------------------- */

  html[data-theme="system"].dark select {
    background: #303030 !important;
    background-color: #303030 !important;
    border-color: #686868 !important;
    color: #ffffff !important;
    color-scheme: dark;
  }

  html[data-theme="system"].dark select option {
    background: #303030 !important;
    background-color: #303030 !important;
    color: #ffffff !important;
  }


  /* -------------------------------------------------------
     FOCO
     Azul apenas como indicação de ação/foco
     ------------------------------------------------------- */

  html[data-theme="system"].dark
    input[type="search"]:focus,
  html[data-theme="system"].dark
    select:focus {
    border-color: #787878 !important;
    outline: none !important;

    box-shadow:
      0 0 0 2px rgba(255, 255, 255, 0.07) !important;
  }
}
`;

fs.writeFileSync(
  arquivo,
  css.trimEnd() +
    bloco +
    "\n",
  "utf8"
);

console.log(
  "✓ Regras globais do tema Sistema adicionadas ao final de app/globals.css"
);
