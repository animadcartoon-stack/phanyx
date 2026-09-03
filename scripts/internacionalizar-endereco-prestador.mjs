import fs from "node:fs";
import path from "node:path";

const dados = {
  "pt-BR": {
    postalCode: "CEP / código postal",
    street: "Endereço",
    number: "Número",
    complement: "Complemento",
    district: "Bairro"
  },
  "pt-PT": {
    postalCode: "Código postal",
    street: "Morada",
    number: "Número",
    complement: "Complemento",
    district: "Localidade / bairro"
  },
  "en-US": {
    postalCode: "ZIP / postal code",
    street: "Street address",
    number: "Number",
    complement: "Address complement",
    district: "District / neighborhood"
  },
  "es-ES": {
    postalCode: "Código postal",
    street: "Dirección",
    number: "Número",
    complement: "Complemento",
    district: "Barrio / distrito"
  },
  "fr-FR": {
    postalCode: "Code postal",
    street: "Adresse",
    number: "Numéro",
    complement: "Complément d’adresse",
    district: "Quartier"
  }
};

for (const [locale, complemento] of Object.entries(dados)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(
      arquivo,
      "utf8"
    )
  );

  const destino =
    json
      .AdminExternalActivityTransport
      .registrations
      .providerForm;

  Object.assign(
    destino,
    complemento
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`OK: ${locale}`);
}
