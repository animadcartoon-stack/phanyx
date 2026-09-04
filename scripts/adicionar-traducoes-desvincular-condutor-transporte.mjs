import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    removeDriver: "Remover condutor",
    removingDriver: "Removendo...",
    driverRemoved: "Condutor removido do veículo com sucesso.",
    removeError: "Não foi possível remover o condutor do veículo.",
    cannotRemoveAfterOperation: "Este condutor não pode mais ser removido porque a operação do veículo já foi iniciada.",
    removeQuestion: "Remover este condutor do veículo?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "pt-PT": {
    removeDriver: "Remover condutor",
    removingDriver: "A remover...",
    driverRemoved: "Condutor removido do veículo com sucesso.",
    removeError: "Não foi possível remover o condutor do veículo.",
    cannotRemoveAfterOperation: "Este condutor já não pode ser removido porque a operação do veículo já foi iniciada.",
    removeQuestion: "Remover este condutor do veículo?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "en-US": {
    removeDriver: "Remove driver",
    removingDriver: "Removing...",
    driverRemoved: "Driver removed from the vehicle successfully.",
    removeError: "The driver could not be removed from the vehicle.",
    cannotRemoveAfterOperation: "This driver can no longer be removed because vehicle operations have already started.",
    removeQuestion: "Remove this driver from the vehicle?",
    confirmRemove: "Confirm removal",
    cancelRemove: "Cancel"
  },

  "es-ES": {
    removeDriver: "Eliminar conductor",
    removingDriver: "Eliminando...",
    driverRemoved: "Conductor eliminado del vehículo correctamente.",
    removeError: "No se pudo eliminar el conductor del vehículo.",
    cannotRemoveAfterOperation: "Este conductor ya no se puede eliminar porque la operación del vehículo ya ha comenzado.",
    removeQuestion: "¿Eliminar este conductor del vehículo?",
    confirmRemove: "Confirmar eliminación",
    cancelRemove: "Cancelar"
  },

  "fr-FR": {
    removeDriver: "Retirer le conducteur",
    removingDriver: "Suppression...",
    driverRemoved: "Conducteur retiré du véhicule avec succès.",
    removeError: "Impossible de retirer le conducteur du véhicule.",
    cannotRemoveAfterOperation: "Ce conducteur ne peut plus être retiré car les opérations du véhicule ont déjà commencé.",
    removeQuestion: "Retirer ce conducteur du véhicule ?",
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
  json.AdminExternalActivityTransport.driverAssignment ??= {};

  json.AdminExternalActivityTransport.driverAssignment = {
    ...json.AdminExternalActivityTransport.driverAssignment,
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
console.log("Traduções para remover condutor adicionadas.");