import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    removeQuestion: "Remover este passageiro do veículo?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "pt-PT": {
    removeQuestion: "Remover este passageiro do veículo?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "en-US": {
    removeQuestion: "Remove this passenger from the vehicle?",
    confirmRemove: "Confirm removal",
    cancelRemove: "Cancel"
  },

  "es-ES": {
    removeQuestion: "¿Eliminar este pasajero del vehículo?",
    confirmRemove: "Confirmar eliminación",
    cancelRemove: "Cancelar"
  },

  "fr-FR": {
    removeQuestion: "Retirer ce passager du véhicule ?",
    confirmRemove: "Confirmer le retrait",
    cancelRemove: "Annuler"
  }
};

for (const [locale, valores] of Object.entries(traducoes)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  json.AdminExternalActivityTransport ??= {};
  json.AdminExternalActivityTransport.passengerAssignment ??= {};

  json.AdminExternalActivityTransport.passengerAssignment = {
    ...json.AdminExternalActivityTransport.passengerAssignment,
    ...valores
  };

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("Traduções da confirmação de remoção adicionadas.");