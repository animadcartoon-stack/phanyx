import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Veículos do trecho",
    linkedVehicles: "Veículos vinculados",
    noLinkedVehicles: "Nenhum veículo vinculado a este trecho.",
    selectVehicle: "Selecione um veículo",
    linkVehicle: "Vincular veículo",
    linkingVehicle: "Vinculando...",
    noVehiclesAvailable: "Nenhum outro veículo disponível para este trecho.",
    vehicleLinked: "Veículo vinculado ao trecho com sucesso.",
    vehicleRequired: "Selecione um veículo para vincular.",
    linkError: "Não foi possível vincular o veículo ao trecho."
  },

  "pt-PT": {
    title: "Veículos do trajeto",
    linkedVehicles: "Veículos associados",
    noLinkedVehicles: "Nenhum veículo associado a este trajeto.",
    selectVehicle: "Selecione um veículo",
    linkVehicle: "Associar veículo",
    linkingVehicle: "A associar...",
    noVehiclesAvailable: "Nenhum outro veículo disponível para este trajeto.",
    vehicleLinked: "Veículo associado ao trajeto com sucesso.",
    vehicleRequired: "Selecione um veículo para associar.",
    linkError: "Não foi possível associar o veículo ao trajeto."
  },

  "en-US": {
    title: "Segment vehicles",
    linkedVehicles: "Linked vehicles",
    noLinkedVehicles: "No vehicle is linked to this segment.",
    selectVehicle: "Select a vehicle",
    linkVehicle: "Link vehicle",
    linkingVehicle: "Linking...",
    noVehiclesAvailable: "No other vehicle is available for this segment.",
    vehicleLinked: "Vehicle linked to the segment successfully.",
    vehicleRequired: "Select a vehicle to link.",
    linkError: "The vehicle could not be linked to the segment."
  },

  "es-ES": {
    title: "Vehículos del trayecto",
    linkedVehicles: "Vehículos vinculados",
    noLinkedVehicles: "No hay ningún vehículo vinculado a este trayecto.",
    selectVehicle: "Seleccione un vehículo",
    linkVehicle: "Vincular vehículo",
    linkingVehicle: "Vinculando...",
    noVehiclesAvailable: "No hay otro vehículo disponible para este trayecto.",
    vehicleLinked: "Vehículo vinculado al trayecto correctamente.",
    vehicleRequired: "Seleccione un vehículo para vincular.",
    linkError: "No se pudo vincular el vehículo al trayecto."
  },

  "fr-FR": {
    title: "Véhicules du trajet",
    linkedVehicles: "Véhicules associés",
    noLinkedVehicles: "Aucun véhicule n'est associé à ce trajet.",
    selectVehicle: "Sélectionnez un véhicule",
    linkVehicle: "Associer le véhicule",
    linkingVehicle: "Association...",
    noVehiclesAvailable: "Aucun autre véhicule n'est disponible pour ce trajet.",
    vehicleLinked: "Véhicule associé au trajet avec succès.",
    vehicleRequired: "Sélectionnez un véhicule à associer.",
    linkError: "Impossible d'associer le véhicule au trajet."
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

  json.AdminExternalActivityTransport.vehicleAssignment = {
    ...(json.AdminExternalActivityTransport.vehicleAssignment || {}),
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
console.log("Traduções do vínculo de veículo adicionadas.");