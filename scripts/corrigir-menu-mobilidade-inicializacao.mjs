import fs from "node:fs";
import path from "node:path";

const arquivo = path.resolve(
  "app/admin/AdminShell.tsx"
);

let texto = fs.readFileSync(
  arquivo,
  "utf8"
);

const bloco = `    if (pathname.startsWith("/admin/mobilidade")) {
      setMenuAberto("mobilidade");
      return;
    }

`;

if (!texto.includes(bloco)) {
  throw new Error(
    "Bloco de abertura automática da Mobilidade não encontrado."
  );
}

texto = texto.replace(
  bloco,
  ""
);

fs.writeFileSync(
  arquivo,
  texto,
  "utf8"
);

console.log(
  "✓ Abertura prematura do menu Mobilidade removida"
);
