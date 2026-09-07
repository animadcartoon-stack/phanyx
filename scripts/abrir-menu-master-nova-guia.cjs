const fs = require("fs");

const caminho =
  "app/admin/AdminShell.tsx";

const bruto =
  fs.readFileSync(
    caminho,
    "utf8"
  );

const eol =
  bruto.includes("\r\n")
    ? "\r\n"
    : "\n";

let texto =
  bruto.replace(
    /\r\n/g,
    "\n"
  );

const rotas = [
  "/master",
  "/master#suporte-usuario",
  "/master/plataforma",
  "/master/boletos-ibe",
];

let alterados = 0;

for (const rota of rotas) {
  const regex = new RegExp(
    `(href="${rota.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    )}")` +
    `(?!\\s*target="_blank")`
  );

  if (!regex.test(texto)) {
    if (
      texto.includes(
        `href="${rota}"`
      ) &&
      texto.includes(
        `href="${rota}"\n                          target="_blank"`
      )
    ) {
      console.log(
        `↷ ${rota} já abre em nova guia`
      );
      continue;
    }

    throw new Error(
      `Link ${rota} não encontrado no formato esperado.`
    );
  }

  texto = texto.replace(
    regex,
`$1
                          target="_blank"
                          rel="noopener noreferrer"`
  );

  alterados++;
  console.log(
    `✓ ${rota}`
  );
}

fs.writeFileSync(
  caminho,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

console.log("");
console.log(
  `✓ ${alterados} links Master atualizados`
);

console.log(
  "✓ Todo o menu MASTER PHANYX abre em nova guia"
);
