const fs = require("fs");

/* =========================================================
   A. BOTAO TRANSFERIR NA PAGINA ADMIN
   ========================================================= */

const adminFile =
  "app/admin/matriculas/page.tsx";

let admin =
  fs.readFileSync(
    adminFile,
    "utf8"
  );

const label =
  't("actions.transferir")';

const labelPos =
  admin.indexOf(label);

if (labelPos < 0) {
  throw new Error(
    "Botao actions.transferir nao encontrado."
  );
}

const buttonStart =
  admin.lastIndexOf(
    "<button",
    labelPos
  );

const buttonEnd =
  admin.indexOf(
    ">",
    buttonStart
  );

if (
  buttonStart < 0 ||
  buttonEnd < 0
) {
  throw new Error(
    "Tag do botao Transferir nao encontrada."
  );
}

let buttonTag =
  admin.slice(
    buttonStart,
    buttonEnd + 1
  );

/*
 * Substitui qualquer onClick atual do botao.
 */
const onClickRe =
  /onClick=\{[\s\S]*?\}\s*(?=(?:className|disabled|title|aria-)[=\s])/;

if (!onClickRe.test(buttonTag)) {
  throw new Error(
    "onClick do botao Transferir nao encontrado."
  );
}

buttonTag =
  buttonTag.replace(
    onClickRe,
`onClick={() => {
                                    window.open(
                                      \`/admin/matriculas/\${m.id}/transferir\`,
                                      "_blank",
                                      "noopener,noreferrer"
                                    );
                                  }}
                                  `
  );

/*
 * Evita submit acidental.
 */
if (!/\btype\s*=/.test(buttonTag)) {
  buttonTag =
    buttonTag.replace(
      "<button",
      '<button type="button"'
    );
}

admin =
  admin.slice(0, buttonStart) +
  buttonTag +
  admin.slice(buttonEnd + 1);

fs.writeFileSync(
  adminFile,
  admin,
  "utf8"
);

console.log(
  "Transferir agora abre em nova guia."
);


/* =========================================================
   B. CONTINUAR NA PAGINA DE ESCOLHA
   ========================================================= */

const chooserFile =
  "app/admin/matriculas/[id]/transferir/page.tsx";

let chooser =
  fs.readFileSync(
    chooserFile,
    "utf8"
  );

const start =
  chooser.indexOf(
    "  function continuar() {"
  );

const endMarker =
  "\n\n  if (carregando) {";

const end =
  chooser.indexOf(
    endMarker,
    start
  );

if (
  start < 0 ||
  end < 0
) {
  throw new Error(
    "Funcao continuar nao encontrada."
  );
}

const novaFuncao = `  function continuar() {
    if (!tipo) {
      setErro(
        t("errors.selectType")
      );

      return;
    }

    setErro("");

    router.push(
      \`/admin/matriculas/\${matriculaId}/transferir/destino?tipo=\${encodeURIComponent(tipo)}\`
    );
  }`;

chooser =
  chooser.slice(0, start) +
  novaFuncao +
  chooser.slice(end);

fs.writeFileSync(
  chooserFile,
  chooser,
  "utf8"
);

console.log(
  "Continuar agora navega para uma pagina real."
);
