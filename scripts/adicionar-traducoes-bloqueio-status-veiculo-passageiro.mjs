import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    vehicleStatusIncompatible: "Esta operação do passageiro não pode ser realizada na situação atual do veículo."
  },

  "pt-PT": {
    vehicleStatusIncompatible: "Esta operação do passageiro não pode ser realizada na situação atual do veículo."
  },

  "en-US": {
    vehicleStatusIncompatible: "This passenger operation cannot be performed while the vehicle is in its current status."
  },

  "es-ES": {
    vehicleStatusIncompatible: "Esta operación del pasajero no se puede realizar con el estado actual del vehículo."
  },

  "fr-FR": {
    vehicleStatusIncompatible: "Cette opération sur le passager ne peut pas être effectuée avec le statut actuel du véhicule."
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
console.log("Traduções do bloqueio operacional do passageiro adicionadas.");