const fs = require("fs");
const path = require("path");

const traducoes = {
  "pt-BR": {
    fullName: "Nome completo",
    email: "E-mail",
    phone: "Telefone",
    requiredField: 'O campo "{field}" é obrigatório.'
  },

  "pt-PT": {
    fullName: "Nome completo",
    email: "E-mail",
    phone: "Telefone",
    requiredField: 'O campo "{field}" é obrigatório.'
  },

  "es-ES": {
    fullName: "Nombre completo",
    email: "Correo electrónico",
    phone: "Teléfono",
    requiredField: 'El campo "{field}" es obligatorio.'
  },

  "fr-FR": {
    fullName: "Nom complet",
    email: "Adresse e-mail",
    phone: "Téléphone",
    requiredField: 'Le champ « {field} » est obligatoire.'
  }
};

for (const [locale, textos] of Object.entries(traducoes)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  json.AdminCommercialIntegrations ??= {};
  json.AdminCommercialIntegrations.detail ??= {};
  json.AdminCommercialIntegrations.detail.persistedErrors ??= {};
  json.AdminCommercialIntegrations.detail.persistedErrors.fields ??= {};

  const persisted =
    json.AdminCommercialIntegrations.detail.persistedErrors;

  persisted.fields.fullName = textos.fullName;
  persisted.fields.email = textos.email;
  persisted.fields.phone = textos.phone;
  persisted.requiredField = textos.requiredField;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("Traduções de persistedErrors adicionadas.");
