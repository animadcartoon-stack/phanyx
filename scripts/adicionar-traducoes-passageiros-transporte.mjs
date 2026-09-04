import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Passageiros",
    linkedPassengers: "Passageiros vinculados",
    noLinkedPassengers: "Nenhum passageiro vinculado a este veículo.",
    selectPassenger: "Selecione um participante",
    seat: "Assento",
    seatPlaceholder: "Ex.: 12A",
    linkPassenger: "Vincular passageiro",
    linkingPassenger: "Vinculando...",
    noPassengersAvailable: "Nenhum outro participante disponível para este trecho.",
    passengerLinked: "Passageiro vinculado ao veículo com sucesso.",
    passengerRequired: "Selecione um participante para vincular.",
    linkError: "Não foi possível vincular o passageiro ao veículo.",
    alreadyLinkedToSegment: "Este participante já está vinculado a outro veículo neste trecho.",
    status: {
      PLANEJADO: "Planejado",
      AGUARDANDO_EMBARQUE: "Aguardando embarque",
      EMBARCADO: "Embarcado",
      NAO_EMBARCOU: "Não embarcou",
      DESEMBARCADO: "Desembarcado",
      TRANSFERIDO: "Transferido",
      CANCELADO: "Cancelado"
    }
  },

  "pt-PT": {
    title: "Passageiros",
    linkedPassengers: "Passageiros associados",
    noLinkedPassengers: "Nenhum passageiro associado a este veículo.",
    selectPassenger: "Selecione um participante",
    seat: "Lugar",
    seatPlaceholder: "Ex.: 12A",
    linkPassenger: "Associar passageiro",
    linkingPassenger: "A associar...",
    noPassengersAvailable: "Nenhum outro participante disponível para este trajeto.",
    passengerLinked: "Passageiro associado ao veículo com sucesso.",
    passengerRequired: "Selecione um participante para associar.",
    linkError: "Não foi possível associar o passageiro ao veículo.",
    alreadyLinkedToSegment: "Este participante já está associado a outro veículo neste trajeto.",
    status: {
      PLANEJADO: "Planeado",
      AGUARDANDO_EMBARQUE: "A aguardar embarque",
      EMBARCADO: "Embarcado",
      NAO_EMBARCOU: "Não embarcou",
      DESEMBARCADO: "Desembarcado",
      TRANSFERIDO: "Transferido",
      CANCELADO: "Cancelado"
    }
  },

  "en-US": {
    title: "Passengers",
    linkedPassengers: "Linked passengers",
    noLinkedPassengers: "No passenger is linked to this vehicle.",
    selectPassenger: "Select a participant",
    seat: "Seat",
    seatPlaceholder: "Ex.: 12A",
    linkPassenger: "Link passenger",
    linkingPassenger: "Linking...",
    noPassengersAvailable: "No other participant is available for this segment.",
    passengerLinked: "Passenger linked to the vehicle successfully.",
    passengerRequired: "Select a participant to link.",
    linkError: "The passenger could not be linked to the vehicle.",
    alreadyLinkedToSegment: "This participant is already linked to another vehicle in this segment.",
    status: {
      PLANEJADO: "Planned",
      AGUARDANDO_EMBARQUE: "Waiting to board",
      EMBARCADO: "Boarded",
      NAO_EMBARCOU: "Did not board",
      DESEMBARCADO: "Disembarked",
      TRANSFERIDO: "Transferred",
      CANCELADO: "Canceled"
    }
  },

  "es-ES": {
    title: "Pasajeros",
    linkedPassengers: "Pasajeros vinculados",
    noLinkedPassengers: "No hay ningún pasajero vinculado a este vehículo.",
    selectPassenger: "Seleccione un participante",
    seat: "Asiento",
    seatPlaceholder: "Ej.: 12A",
    linkPassenger: "Vincular pasajero",
    linkingPassenger: "Vinculando...",
    noPassengersAvailable: "No hay otro participante disponible para este trayecto.",
    passengerLinked: "Pasajero vinculado al vehículo correctamente.",
    passengerRequired: "Seleccione un participante para vincular.",
    linkError: "No se pudo vincular el pasajero al vehículo.",
    alreadyLinkedToSegment: "Este participante ya está vinculado a otro vehículo en este trayecto.",
    status: {
      PLANEJADO: "Planificado",
      AGUARDANDO_EMBARQUE: "Esperando embarque",
      EMBARCADO: "Embarcado",
      NAO_EMBARCOU: "No embarcó",
      DESEMBARCADO: "Desembarcado",
      TRANSFERIDO: "Transferido",
      CANCELADO: "Cancelado"
    }
  },

  "fr-FR": {
    title: "Passagers",
    linkedPassengers: "Passagers associés",
    noLinkedPassengers: "Aucun passager n'est associé à ce véhicule.",
    selectPassenger: "Sélectionnez un participant",
    seat: "Siège",
    seatPlaceholder: "Ex. : 12A",
    linkPassenger: "Associer le passager",
    linkingPassenger: "Association...",
    noPassengersAvailable: "Aucun autre participant n'est disponible pour ce trajet.",
    passengerLinked: "Passager associé au véhicule avec succès.",
    passengerRequired: "Sélectionnez un participant à associer.",
    linkError: "Impossible d'associer le passager au véhicule.",
    alreadyLinkedToSegment: "Ce participant est déjà associé à un autre véhicule sur ce trajet.",
    status: {
      PLANEJADO: "Planifié",
      AGUARDANDO_EMBARQUE: "En attente d'embarquement",
      EMBARCADO: "Embarqué",
      NAO_EMBARCOU: "N'a pas embarqué",
      DESEMBARCADO: "Débarqué",
      TRANSFERIDO: "Transféré",
      CANCELADO: "Annulé"
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

  json.AdminExternalActivityTransport.passengerAssignment = {
    ...(json.AdminExternalActivityTransport.passengerAssignment || {}),
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
console.log("Traduções de passageiros adicionadas.");