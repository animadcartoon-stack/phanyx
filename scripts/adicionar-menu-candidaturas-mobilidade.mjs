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
  !texto.includes(
    "const podeVerCandidaturasMobilidade"
  )
) {
  const ancora = `  const podeVerOfertasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.ofertas.ver") ||
    podeAcessar("mobilidade.ofertas.gerenciar");`;

  const novo = `${ancora}

  const podeVerCandidaturasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.candidaturas.ver") ||
    podeAcessar("mobilidade.candidaturas.gerenciar");`;

  if (!texto.includes(ancora)) {
    throw new Error(
      "Não encontrei as permissões de Ofertas."
    );
  }

  texto =
    texto.replace(
      ancora,
      novo
    );
}

const linkOfertasDesktop = `                        {podeVerOfertasMobilidade && (
                          <Link
                            href="/admin/mobilidade/ofertas"
                            className={getLinkClass(
                              "/admin/mobilidade/ofertas"
                            )}
                          >
                            📣 {tNav("mobilityOffers")}
                          </Link>
                        )}`;

if (
  !texto.includes(
    'href="/admin/mobilidade/candidaturas"'
  )
) {
  const novoDesktop = `${linkOfertasDesktop}

                        {podeVerCandidaturasMobilidade && (
                          <Link
                            href="/admin/mobilidade/candidaturas"
                            className={getLinkClass(
                              "/admin/mobilidade/candidaturas"
                            )}
                          >
                            📝 {tNav("mobilityApplications")}
                          </Link>
                        )}`;

  if (
    !texto.includes(
      linkOfertasDesktop
    )
  ) {
    throw new Error(
      "Não encontrei o link desktop de Ofertas."
    );
  }

  texto =
    texto.replace(
      linkOfertasDesktop,
      novoDesktop
    );
}

const linkOfertasMobile = `                        {podeVerOfertasMobilidade && (
                          <Link
                            href="/admin/mobilidade/ofertas"
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            📣 {tNav("mobilityOffers")}
                          </Link>
                        )}`;

const marcadorMobile =
  texto.indexOf(
    'data-mobile-mobilidade="true"'
  );

if (
  marcadorMobile !== -1
) {
  const trecho =
    texto.slice(
      marcadorMobile,
      marcadorMobile + 7000
    );

  if (
    !trecho.includes(
      'href="/admin/mobilidade/candidaturas"'
    )
  ) {
    const novoMobile = `${linkOfertasMobile}

                        {podeVerCandidaturasMobilidade && (
                          <Link
                            href="/admin/mobilidade/candidaturas"
                            className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                          >
                            📝 {tNav("mobilityApplications")}
                          </Link>
                        )}`;

    if (
      !texto.includes(
        linkOfertasMobile
      )
    ) {
      throw new Error(
        "Não encontrei o link mobile de Ofertas."
      );
    }

    texto =
      texto.replace(
        linkOfertasMobile,
        novoMobile
      );
  }
}

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Candidaturas adicionadas ao menu desktop e mobile"
);
