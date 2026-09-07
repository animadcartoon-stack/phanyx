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

const antigo =
`                        <Link
                          href="/master/feriados"
                          className={getLinkClass("/master/feriados")}
                        >
                          📅 {tNav("holidayCalendars")}
                        </Link>`;

const novo =
`                        <Link
                          href="/master/feriados"
                          target="_blank"
                          rel="noopener noreferrer"
                          className={getLinkClass("/master/feriados")}
                        >
                          📅 {tNav("holidayCalendars")}
                        </Link>`;

if (
  texto.includes(
    'href="/master/feriados"'
  ) &&
  texto.includes(
    'href="/master/feriados"\n                          target="_blank"'
  )
) {
  console.log(
    "↷ Calendários e Feriados já abre em nova guia"
  );
  process.exit(0);
}

if (
  !texto.includes(antigo)
) {
  throw new Error(
    "Link Calendários e Feriados não encontrado no formato esperado."
  );
}

texto =
  texto.replace(
    antigo,
    novo
  );

fs.writeFileSync(
  caminho,
  texto.replace(
    /\n/g,
    eol
  ),
  "utf8"
);

console.log(
  "✓ Calendários e Feriados agora abre em nova guia"
);
