import fs from "node:fs";
import path from "node:path";

const arquivo =
  path.resolve(
    "app/admin/AdminShell.tsx"
  );

let texto =
  fs.readFileSync(
    arquivo,
    "utf8"
  );

if (
  texto.includes(
    'href="/admin/mobilidade/instituicoes-parceiras"'
  )
) {
  console.log(
    "ℹ Link de Instituições Parceiras já existe."
  );
  process.exit(0);
}

const anchorDesktop = `                        <Link
                          href="/admin/mobilidade"
                          className={getLinkClass("/admin/mobilidade")}
                        >
                          📊 {tNav("overview")}
                        </Link>`;

if (
  !texto.includes(
    anchorDesktop
  )
) {
  throw new Error(
    "Link de visão geral da Mobilidade não encontrado."
  );
}

const novoDesktop =
`${anchorDesktop}

                        <Link
                          href="/admin/mobilidade/instituicoes-parceiras"
                          className={getLinkClass(
                            "/admin/mobilidade/instituicoes-parceiras"
                          )}
                        >
                          🌐 {tNav("partnerInstitutions")}
                        </Link>`;

texto =
  texto.replace(
    anchorDesktop,
    novoDesktop
  );

const mobileMarker =
  'data-mobile-mobilidade="true"';

const inicioMobile =
  texto.indexOf(
    mobileMarker
  );

if (
  inicioMobile >= 0
) {
  const fimLink =
    texto.indexOf(
      "</Link>",
      inicioMobile
    );

  if (
    fimLink >= 0
  ) {
    const posicao =
      fimLink +
      "</Link>".length;

    const linkMobile = `

                    {podeVerMobilidade && (
                      <Link
                        href="/admin/mobilidade/instituicoes-parceiras"
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        🌐 {tNav("partnerInstitutions")}
                      </Link>
                    )}`;

    texto =
      texto.slice(
        0,
        posicao
      ) +
      linkMobile +
      texto.slice(
        posicao
      );
  }
}

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Instituições Parceiras adicionada ao menu desktop e mobile"
);
