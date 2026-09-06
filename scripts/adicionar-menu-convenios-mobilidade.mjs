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

const acessoAntigo = `  const podeVerMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.dashboard.ver") ||
    podeAcessar("mobilidade.gerenciar");`;

const acessoNovo = `  const podeVerMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.dashboard.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    permissoes.some((chave) =>
      chave.startsWith("mobilidade.")
    );

  const podeVerInstituicoesMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.instituicoes.ver") ||
    podeAcessar("mobilidade.instituicoes.gerenciar");

  const podeVerConveniosMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.convenios.ver") ||
    podeAcessar("mobilidade.convenios.gerenciar");`;

if (texto.includes(acessoAntigo)) {
  texto =
    texto.replace(
      acessoAntigo,
      acessoNovo
    );
}

if (
  !texto.includes(
    'href="/admin/mobilidade/convenios"'
  )
) {
  const anchor = `                        <Link
                          href="/admin/mobilidade/instituicoes-parceiras"
                          className={getLinkClass(
                            "/admin/mobilidade/instituicoes-parceiras"
                          )}
                        >
                          🌐 {tNav("partnerInstitutions")}
                        </Link>`;

  if (!texto.includes(anchor)) {
    throw new Error(
      "Link de Instituições Parceiras não encontrado."
    );
  }

  const novo = `${anchor}

                        {podeVerConveniosMobilidade && (
                          <Link
                            href="/admin/mobilidade/convenios"
                            className={getLinkClass(
                              "/admin/mobilidade/convenios"
                            )}
                          >
                            🤝 {tNav("mobilityAgreements")}
                          </Link>
                        )}`;

  texto =
    texto.replace(
      anchor,
      novo
    );
}

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Convênios adicionado ao menu da Mobilidade"
);
