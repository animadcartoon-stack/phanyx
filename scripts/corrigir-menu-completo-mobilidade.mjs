import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "app/admin/AdminShell.tsx"
);

let texto = fs.readFileSync(
  arquivo,
  "utf8"
);

/* =========================================================
   1. PERMISSÕES
   ========================================================= */

if (
  !texto.includes(
    "const podeVerProgramasMobilidade"
  )
) {
  const ancora = `  const podeVerConveniosMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.convenios.ver") ||
    podeAcessar("mobilidade.convenios.gerenciar");`;

  const novo = `${ancora}

  const podeVerProgramasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.programas.ver") ||
    podeAcessar("mobilidade.programas.gerenciar");

  const podeVerOfertasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.ofertas.ver") ||
    podeAcessar("mobilidade.ofertas.gerenciar");`;

  if (!texto.includes(ancora)) {
    throw new Error(
      "Não encontrei o bloco de permissões dos Convênios."
    );
  }

  texto = texto.replace(
    ancora,
    novo
  );

  console.log(
    "✓ permissões de Programas e Ofertas"
  );
}

/* =========================================================
   2. MENU DESKTOP
   ========================================================= */

if (
  !texto.includes(
    'href="/admin/mobilidade/programas"'
  )
) {
  const ancora = `                        {podeVerConveniosMobilidade && (
                          <Link
                            href="/admin/mobilidade/convenios"
                            className={getLinkClass(
                              "/admin/mobilidade/convenios"
                            )}
                          >
                            🤝 {tNav("mobilityAgreements")}
                          </Link>
                        )}`;

  const novo = `${ancora}

                        {podeVerProgramasMobilidade && (
                          <Link
                            href="/admin/mobilidade/programas"
                            className={getLinkClass(
                              "/admin/mobilidade/programas"
                            )}
                          >
                            🎓 {tNav("mobilityPrograms")}
                          </Link>
                        )}

                        {podeVerOfertasMobilidade && (
                          <Link
                            href="/admin/mobilidade/ofertas"
                            className={getLinkClass(
                              "/admin/mobilidade/ofertas"
                            )}
                          >
                            📣 {tNav("mobilityOffers")}
                          </Link>
                        )}`;

  if (!texto.includes(ancora)) {
    throw new Error(
      "Não encontrei o link desktop de Convênios."
    );
  }

  texto = texto.replace(
    ancora,
    novo
  );

  console.log(
    "✓ Programas e Ofertas no menu desktop"
  );
}

/* =========================================================
   3. MENU MOBILE
   ========================================================= */

const marcadorMobile =
  'data-mobile-mobilidade="true"';

const inicioMobile =
  texto.indexOf(marcadorMobile);

if (inicioMobile === -1) {
  throw new Error(
    "Não encontrei o bloco mobile da Mobilidade."
  );
}

const trechoMobile =
  texto.slice(
    inicioMobile,
    inicioMobile + 5000
  );

if (
  !trechoMobile.includes(
    'href="/admin/mobilidade/programas"'
  )
) {
  const ancora = `                        <Link
                          href="/admin/mobilidade/instituicoes-parceiras"
                          className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          🌐 {tNav("partnerInstitutions")}
                        </Link>`;

  const novo = `${ancora}

                        {podeVerConveniosMobilidade && (
                          <Link
                            href="/admin/mobilidade/convenios"
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            🤝 {tNav("mobilityAgreements")}
                          </Link>
                        )}

                        {podeVerProgramasMobilidade && (
                          <Link
                            href="/admin/mobilidade/programas"
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            🎓 {tNav("mobilityPrograms")}
                          </Link>
                        )}

                        {podeVerOfertasMobilidade && (
                          <Link
                            href="/admin/mobilidade/ofertas"
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            📣 {tNav("mobilityOffers")}
                          </Link>
                        )}`;

  if (!texto.includes(ancora)) {
    throw new Error(
      "Não encontrei o link mobile de Instituições parceiras."
    );
  }

  texto = texto.replace(
    ancora,
    novo
  );

  console.log(
    "✓ Convênios, Programas e Ofertas no menu mobile"
  );
}

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log("");
console.log(
  "✓ MENU DE MOBILIDADE INTERNACIONAL ATUALIZADO"
);
