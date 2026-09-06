import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "app/admin/mobilidade/instituicoes-parceiras/page.tsx"
);

let texto = fs.readFileSync(
  arquivo,
  "utf8"
);

const antigo = `  const paises =
    useMemo(() => {
      let displayNames:
        | Intl.DisplayNames
        | null = null;

      try {
        displayNames =
          new Intl.DisplayNames(
            [locale],
            {
              type: "region",
            }
          );
      } catch {
        displayNames =
          null;
      }

      return getCountries()
        .map(
          (codigo) => ({
            codigo,
            nome:
              displayNames?.of(
                codigo
              ) ??
              codigo,
          })
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome,
              locale
            )
        );
    }, [locale]);`;

const novo = `  const [
    paises,
    setPaises,
  ] = useState<
    Array<{
      codigo: CountryCode;
      nome: string;
    }>
  >([]);

  useEffect(() => {
    let displayNames:
      | Intl.DisplayNames
      | null = null;

    try {
      displayNames =
        new Intl.DisplayNames(
          [locale],
          {
            type: "region",
          }
        );
    } catch {
      displayNames =
        null;
    }

    const lista =
      getCountries()
        .map(
          (codigo) => ({
            codigo,
            nome:
              displayNames?.of(
                codigo
              ) ??
              codigo,
          })
        )
        .sort(
          (a, b) =>
            a.nome.localeCompare(
              b.nome,
              locale
            )
        );

    setPaises(lista);
  }, [locale]);`;

if (!texto.includes(antigo)) {
  throw new Error(
    "Bloco original de países não encontrado."
  );
}

texto = texto.replace(
  antigo,
  novo
);

/*
 * useMemo deixa de ser necessário
 * nesta página.
 */
texto = texto.replace(
  `  useEffect,
  useMemo,
  useState,`,
  `  useEffect,
  useState,`
);

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Lista de países corrigida para evitar hydration mismatch"
);
