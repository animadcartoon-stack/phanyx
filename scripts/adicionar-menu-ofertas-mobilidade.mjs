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
    "const podeVerOfertasMobilidade"
  )
) {
  const anchor = `  const podeVerProgramasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.programas.ver") ||
    podeAcessar("mobilidade.programas.gerenciar");`;

  const novo = `${anchor}

  const podeVerOfertasMobilidade =
    podeAcessar("mobilidade.ver") ||
    podeAcessar("mobilidade.gerenciar") ||
    podeAcessar("mobilidade.ofertas.ver") ||
    podeAcessar("mobilidade.ofertas.gerenciar");`;

  if (!texto.includes(anchor)) {
    throw new Error(
      "Permissões de Programas não encontradas."
    );
  }

  texto =
    texto.replace(
      anchor,
      novo
    );
}

if (
  !texto.includes(
    'href="/admin/mobilidade/ofertas"'
  )
) {
  const anchor = `                        {podeVerProgramasMobilidade && (
                          <Link
                            href="/admin/mobilidade/programas"
                            className={getLinkClass(
                              "/admin/mobilidade/programas"
                            )}
                          >
                            🎓 {tNav("mobilityPrograms")}
                          </Link>
                        )}`;

  const novo = `${anchor}

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

  if (!texto.includes(anchor)) {
    throw new Error(
      "Link de Programas não encontrado."
    );
  }

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
  "✓ Ofertas / Editais adicionado ao menu da Mobilidade"
);
