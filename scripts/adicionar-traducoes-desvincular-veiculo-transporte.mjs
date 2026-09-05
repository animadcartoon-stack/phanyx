import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    removeVehicle: "Remover veículo",
    removingVehicle: "Removendo...",
    vehicleRemoved: "Veículo removido do trecho com sucesso.",
    removeError: "Não foi possível remover o veículo do trecho.",
    cannotRemoveAfterOperation: "Este veículo não pode mais ser removido porque a operação já foi iniciada.",
    hasLinks: "Remova primeiro os condutores e passageiros vinculados a este veículo.",
    removeQuestion: "Remover este veículo do trecho?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "pt-PT": {
    removeVehicle: "Remover veículo",
    removingVehicle: "A remover...",
    vehicleRemoved: "Veículo removido do trajeto com sucesso.",
    removeError: "Não foi possível remover o veículo do trajeto.",
    cannotRemoveAfterOperation: "Este veículo já não pode ser removido porque a operação já foi iniciada.",
    hasLinks: "Remova primeiro os condutores e passageiros associados a este veículo.",
    removeQuestion: "Remover este veículo do trajeto?",
    confirmRemove: "Confirmar remoção",
    cancelRemove: "Cancelar"
  },

  "en-US": {
    removeVehicle: "Remove vehicle",
    removingVehicle: "Removing...",
    vehicleRemoved: "Vehicle removed from the segment successfully.",
    removeError: "The vehicle could not be removed from the segment.",
    cannotRemoveAfterOperation: "This vehicle can no longer be removed because operations have already started.",
    hasLinks: "Remove the drivers and passengers linked to this vehicle first.",
    removeQuestion: "Remove this vehicle from the segment?",
    confirmRemove: "Confirm removal",
    cancelRemove: "Cancel"
  },

  "es-ES": {
    removeVehicle: "Eliminar vehículo",
    removingVehicle: "Eliminando...",
    vehicleRemoved: "Vehículo eliminado del trayecto correctamente.",
    removeError: "No se pudo eliminar el vehículo del trayecto.",
    cannotRemoveAfterOperation: "Este vehículo ya no se puede eliminar porque la operación ya ha comenzado.",
    hasLinks: "Elimina primero los conductores y pasajeros vinculados a este vehículo.",
    removeQuestion: "¿Eliminar este vehículo del trayecto?",
    confirmRemove: "Confirmar eliminación",
    cancelRemove: "Cancelar"
  },

  "fr-FR": {
    removeVehicle: "Retirer le véhicule",
    removingVehicle: "Suppression...",
    vehicleRemoved: "Véhicule retiré du trajet avec succès.",
    removeError: "Impossible de retirer le véhicule du trajet.",
    cannotRemoveAfterOperation: "Ce véhicule ne peut plus être retiré car les opérations ont déjà commencé.",
    hasLinks: "Retirez d’abord les conducteurs et les passagers liés à ce véhicule.",
    removeQuestion: "Retirer ce véhicule du trajet ?",
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
  json.AdminExternalActivityTransport.vehicleAssignment ??= {};

  json.AdminExternalActivityTransport.vehicleAssignment = {
    ...json.AdminExternalActivityTransport.vehicleAssignment,
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
console.log("Traduções para remover veículo adicionadas.");