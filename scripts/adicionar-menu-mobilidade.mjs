import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve("app/admin/AdminShell.tsx");

let texto = fs.readFileSync(arquivo, "utf8");

function inserirAntes(anchor, bloco, descricao) {
  if (texto.includes(bloco.trim())) {
    console.log(`ℹ ${descricao} já existe`);
    return;
  }

  const indice = texto.indexOf(anchor);

  if (indice < 0) {
    throw new Error(
      `Não foi possível localizar o ponto para: ${descricao}`
    );
  }

  texto =
    texto.slice(0, indice) +
    bloco +
    texto.slice(indice);

  console.log(`✓ ${descricao}`);
}

/*
 * 1. Permissão do setor.
 */
inserirAntes(
  '  const podeGerenciarEmailInstitucional =',
`  const podeVerMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.dashboard.ver") ||
    podeAcessar("mobilidade.gerenciar");

`,
  "permissão da Mobilidade"
);

/*
 * 2. Ao entrar numa rota /admin/mobilidade,
 *    abrir automaticamente o setor no desktop.
 */
if (
  !texto.includes(
    'pathname.startsWith("/admin/mobilidade")'
  )
) {
  const anchor =
    'if (pathname.startsWith("/admin/biblioteca"))';

  const indice = texto.indexOf(anchor);

  if (indice >= 0) {
    const inicioLinha =
      texto.lastIndexOf("\n", indice) + 1;

    const indentacao =
      texto.slice(inicioLinha, indice);

    const bloco =
`${indentacao}if (pathname.startsWith("/admin/mobilidade")) {
${indentacao}  setMenuAberto("mobilidade");
${indentacao}  return;
${indentacao}}

`;

    texto =
      texto.slice(0, inicioLinha) +
      bloco +
      texto.slice(inicioLinha);

    console.log(
      "✓ abertura automática pela rota"
    );
  } else {
    console.log(
      "⚠ Não foi localizado o bloco automático da Biblioteca; o menu ainda funcionará por clique."
    );
  }
} else {
  console.log(
    "ℹ abertura automática já existe"
  );
}

/*
 * 3. O link Visão geral só fica ativo
 *    exatamente no dashboard.
 */
if (
  !texto.includes(
    'if (path === "/admin/mobilidade")'
  )
) {
  const anchor =
    '    if (path === "/admin/biblioteca") {';

  const bloco =
`    if (path === "/admin/mobilidade") {
      return pathname === "/admin/mobilidade";
    }

`;

  inserirAntes(
    anchor,
    bloco,
    "estado ativo da Mobilidade"
  );
}

/*
 * 4. Setor próprio no menu desktop.
 */
const blocoDesktop =
`                {podeVerMobilidade && (
                  <div className="mt-2 border-t pt-2">
                    <button
                      type="button"
                      onClick={() => toggleMenu("mobilidade")}
                      className={buttonClass}
                    >
                      <span className={sectionTitleClass}>
                        🌍 {tNav("internationalMobility")}
                      </span>

                      <span>
                        {menuAberto === "mobilidade" ? "▾" : "▸"}
                      </span>
                    </button>

                    {menuAberto === "mobilidade" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">
                        <Link
                          href="/admin/mobilidade"
                          className={getLinkClass("/admin/mobilidade")}
                        >
                          📊 {tNav("overview")}
                        </Link>
                      </div>
                    )}
                  </div>
                )}

`;

if (!texto.includes('toggleMenu("mobilidade")')) {
  const desktopAnchor =
    '                {podeVerBiblioteca && (';

  inserirAntes(
    desktopAnchor,
    blocoDesktop,
    "setor Mobilidade no menu desktop"
  );
} else {
  console.log(
    "ℹ menu desktop da Mobilidade já existe"
  );
}

/*
 * 5. Mobile:
 *    acrescentar Mobilidade dentro do painel Acadêmico,
 *    sem criar um 9º botão na barra inferior.
 */
if (
  !texto.includes(
    'data-mobile-mobilidade="true"'
  )
) {
  const inicioMobile =
    texto.indexOf(
      'menuMobileAberto === "Acad'
    );

  if (inicioMobile < 0) {
    throw new Error(
      "Painel Acadêmico mobile não encontrado."
    );
  }

  const anchorBiblioteca =
    texto.indexOf(
      '{podeVerBiblioteca && (',
      inicioMobile
    );

  if (anchorBiblioteca < 0) {
    throw new Error(
      "Ponto de inserção mobile antes da Biblioteca não encontrado."
    );
  }

  const inicioLinha =
    texto.lastIndexOf(
      "\n",
      anchorBiblioteca
    ) + 1;

  const indentacao =
    texto.slice(
      inicioLinha,
      anchorBiblioteca
    );

  const blocoMobile =
`${indentacao}{podeVerMobilidade && (
${indentacao}  <Link
${indentacao}    href="/admin/mobilidade"
${indentacao}    data-mobile-mobilidade="true"
${indentacao}    className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
${indentacao}  >
${indentacao}    🌍 {tNav("internationalMobility")}
${indentacao}  </Link>
${indentacao})}

`;

  texto =
    texto.slice(0, inicioLinha) +
    blocoMobile +
    texto.slice(inicioLinha);

  console.log(
    "✓ acesso mobile à Mobilidade"
  );
} else {
  console.log(
    "ℹ acesso mobile já existe"
  );
}

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log("");
console.log(
  "✓ MENU DE MOBILIDADE INTERNACIONAL ADICIONADO"
);
