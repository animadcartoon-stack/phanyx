import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    removePassenger: "Remover passageiro",
    removingPassenger: "Removendo...",
    passengerRemoved: "Passageiro removido do veículo com sucesso.",
    removeError: "Não foi possível remover o passageiro do veículo.",
    cannotRemoveAfterOperation: "Este passageiro não pode mais ser removido porque a operação do trecho já foi iniciada."
  },

  "pt-PT": {
    removePassenger: "Remover passageiro",
    removingPassenger: "A remover...",
    passengerRemoved: "Passageiro removido do veículo com sucesso.",
    removeError: "Não foi possível remover o passageiro do veículo.",
    cannotRemoveAfterOperation: "Este passageiro já não pode ser removido porque a operação do trajeto já foi iniciada."
  },

  "en-US": {
    removePassenger: "Remove passenger",
    removingPassenger: "Removing...",
    passengerRemoved: "Passenger removed from the vehicle successfully.",
    removeError: "The passenger could not be removed from the vehicle.",
    cannotRemoveAfterOperation: "This passenger can no longer be removed because segment operations have already started."
  },

  "es-ES": {
    removePassenger: "Eliminar pasajero",
    removingPassenger: "Eliminando...",
    passengerRemoved: "Pasajero eliminado del vehículo correctamente.",
    removeError: "No se pudo eliminar el pasajero del vehículo.",
    cannotRemoveAfterOperation: "Este pasajero ya no se puede eliminar porque la operación del trayecto ya ha comenzado."
  },

  "fr-FR": {
    removePassenger: "Retirer le passager",
    removingPassenger: "Suppression...",
    passengerRemoved: "Passager retiré du véhicule avec succès.",
    removeError: "Impossible de retirer le passager du véhicule.",
    cannotRemoveAfterOperation: "Ce passager ne peut plus être retiré car les opérations du trajet ont déjà commencé."
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
console.log("Traduções para remover passageiro adicionadas.");