import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Condutores",
    linkedDrivers: "Condutores vinculados",
    noLinkedDrivers: "Nenhum condutor vinculado a este veículo.",
    selectDriver: "Selecione um condutor",
    selectRole: "Selecione a função",
    linkDriver: "Vincular condutor",
    linkingDriver: "Vinculando...",
    noDriversAvailable: "Nenhum outro condutor disponível para este veículo.",
    driverLinked: "Condutor vinculado ao veículo com sucesso.",
    driverRequired: "Selecione um condutor para vincular.",
    linkError: "Não foi possível vincular o condutor ao veículo.",
    roles: {
      PRINCIPAL: "Principal",
      AUXILIAR: "Auxiliar",
      RESERVA: "Reserva",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor autônomo",
      OUTRO: "Outro"
    }
  },

  "pt-PT": {
    title: "Condutores",
    linkedDrivers: "Condutores associados",
    noLinkedDrivers: "Nenhum condutor associado a este veículo.",
    selectDriver: "Selecione um condutor",
    selectRole: "Selecione a função",
    linkDriver: "Associar condutor",
    linkingDriver: "A associar...",
    noDriversAvailable: "Nenhum outro condutor disponível para este veículo.",
    driverLinked: "Condutor associado ao veículo com sucesso.",
    driverRequired: "Selecione um condutor para associar.",
    linkError: "Não foi possível associar o condutor ao veículo.",
    roles: {
      PRINCIPAL: "Principal",
      AUXILIAR: "Auxiliar",
      RESERVA: "Reserva",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor autónomo",
      OUTRO: "Outro"
    }
  },

  "en-US": {
    title: "Drivers",
    linkedDrivers: "Linked drivers",
    noLinkedDrivers: "No driver is linked to this vehicle.",
    selectDriver: "Select a driver",
    selectRole: "Select a role",
    linkDriver: "Link driver",
    linkingDriver: "Linking...",
    noDriversAvailable: "No other driver is available for this vehicle.",
    driverLinked: "Driver linked to the vehicle successfully.",
    driverRequired: "Select a driver to link.",
    linkError: "The driver could not be linked to the vehicle.",
    roles: {
      PRINCIPAL: "Primary",
      AUXILIAR: "Assistant",
      RESERVA: "Reserve",
      OPERADOR: "Operator",
      OPERADOR_REMOTO: "Remote operator",
      SUPERVISOR_AUTONOMO: "Autonomous supervisor",
      OUTRO: "Other"
    }
  },

  "es-ES": {
    title: "Conductores",
    linkedDrivers: "Conductores vinculados",
    noLinkedDrivers: "No hay ningún conductor vinculado a este vehículo.",
    selectDriver: "Seleccione un conductor",
    selectRole: "Seleccione la función",
    linkDriver: "Vincular conductor",
    linkingDriver: "Vinculando...",
    noDriversAvailable: "No hay otro conductor disponible para este vehículo.",
    driverLinked: "Conductor vinculado al vehículo correctamente.",
    driverRequired: "Seleccione un conductor para vincular.",
    linkError: "No se pudo vincular el conductor al vehículo.",
    roles: {
      PRINCIPAL: "Principal",
      AUXILIAR: "Auxiliar",
      RESERVA: "Reserva",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor autónomo",
      OUTRO: "Otro"
    }
  },

  "fr-FR": {
    title: "Conducteurs",
    linkedDrivers: "Conducteurs associés",
    noLinkedDrivers: "Aucun conducteur n'est associé à ce véhicule.",
    selectDriver: "Sélectionnez un conducteur",
    selectRole: "Sélectionnez le rôle",
    linkDriver: "Associer le conducteur",
    linkingDriver: "Association...",
    noDriversAvailable: "Aucun autre conducteur n'est disponible pour ce véhicule.",
    driverLinked: "Conducteur associé au véhicule avec succès.",
    driverRequired: "Sélectionnez un conducteur à associer.",
    linkError: "Impossible d'associer le conducteur au véhicule.",
    roles: {
      PRINCIPAL: "Principal",
      AUXILIAR: "Auxiliaire",
      RESERVA: "Réserve",
      OPERADOR: "Opérateur",
      OPERADOR_REMOTO: "Opérateur à distance",
      SUPERVISOR_AUTONOMO: "Superviseur autonome",
      OUTRO: "Autre"
    }
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

  json.AdminExternalActivityTransport.driverAssignment = {
    ...(json.AdminExternalActivityTransport.driverAssignment || {}),
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
console.log("Traduções do vínculo de condutor adicionadas.");