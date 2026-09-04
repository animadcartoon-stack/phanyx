import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": "Devolução registrada com sucesso. Multa de {amount} gerada no Financeiro.",
  "pt-PT": "Devolução registada com sucesso. Multa de {amount} gerada no Financeiro.",
  "en-US": "Return registered successfully. A fine of {amount} was generated in Finance.",
  "es-ES": "Devolución registrada correctamente. Se generó una multa de {amount} en Finanzas.",
  "fr-FR": "Retour enregistré avec succès. Une pénalité de {amount} a été générée dans les Finances.",
};

const raiz = process.cwd();

for (const [locale, texto] of Object.entries(traducoes)) {
  const arquivo = path.join(
    raiz,
    "messages",
    `${locale}.json`
  );

  if (!fs.existsSync(arquivo)) {
    throw new Error(
      `Arquivo não encontrado: ${arquivo}`
    );
  }

  const original =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const usaCrLf =
    original.includes("\r\n");

  const json =
    JSON.parse(original);

  if (
    !json.AdminLibraryItemUi ||
    typeof json.AdminLibraryItemUi !== "object"
  ) {
    throw new Error(
      `${locale}: namespace AdminLibraryItemUi não encontrado.`
    );
  }

  const valorAnterior =
    json.AdminLibraryItemUi.returnSuccessWithFine;

  json.AdminLibraryItemUi.returnSuccessWithFine =
    texto;

  let novo =
    JSON.stringify(
      json,
      null,
      2
    ) + "\n";

  if (usaCrLf) {
    novo =
      novo.replace(
        /\n/g,
        "\r\n"
      );
  }

  fs.writeFileSync(
    arquivo,
    novo,
    "utf8"
  );

  if (
    valorAnterior === texto
  ) {
    console.log(
      `✓ ${locale}: já estava correto`
    );
  } else if (
    valorAnterior !== undefined
  ) {
    console.log(
      `✓ ${locale}: atualizado`
    );
  } else {
    console.log(
      `✓ ${locale}: adicionado`
    );
  }
}

console.log(
  "\nTradução da multa da Biblioteca adicionada nos 5 idiomas."
);