import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    confirmVehicle: "Confirmar veículo",
    confirmingVehicle: "Confirmando...",
    startBoardingOperation: "Iniciar embarque",
    startingBoardingOperation: "Iniciando...",
    startTrip: "Iniciar viagem",
    startingTrip: "Iniciando...",
    markArrived: "Registrar chegada",
    markingArrived: "Registrando...",
    vehicleConfirmed: "Veículo confirmado para o trecho com sucesso.",
    boardingStarted: "Operação de embarque iniciada com sucesso.",
    tripStarted: "Viagem iniciada com sucesso.",
    arrivalRegistered: "Chegada do veículo registrada com sucesso.",
    statusUpdateError: "Não foi possível atualizar a situação do veículo.",
    invalidStatusTransition: "Esta mudança de situação não é permitida para o veículo.",
    noDriver: "Vincule pelo menos um condutor antes de confirmar o veículo.",
    pendingPassengers: "Ainda existem passageiros aguardando definição de embarque. Confirme o embarque ou registre quem não embarcou antes de iniciar a viagem.",
    segmentNotOperational: "Este trecho não permite mais alterações operacionais.",
    boardingAt: "Embarque iniciado em",
    arrivedAt: "Chegada registrada em",
    status: {
      PLANEJADO: "Planejado",
      CONFIRMADO: "Confirmado",
      EM_EMBARQUE: "Em embarque",
      EM_TRANSITO: "Em trânsito",
      CHEGOU: "Chegou",
      CANCELADO: "Cancelado"
    }
  },

  "pt-PT": {
    confirmVehicle: "Confirmar veículo",
    confirmingVehicle: "A confirmar...",
    startBoardingOperation: "Iniciar embarque",
    startingBoardingOperation: "A iniciar...",
    startTrip: "Iniciar viagem",
    startingTrip: "A iniciar...",
    markArrived: "Registar chegada",
    markingArrived: "A registar...",
    vehicleConfirmed: "Veículo confirmado para o trajeto com sucesso.",
    boardingStarted: "Operação de embarque iniciada com sucesso.",
    tripStarted: "Viagem iniciada com sucesso.",
    arrivalRegistered: "Chegada do veículo registada com sucesso.",
    statusUpdateError: "Não foi possível atualizar a situação do veículo.",
    invalidStatusTransition: "Esta alteração de situação não é permitida para o veículo.",
    noDriver: "Associe pelo menos um condutor antes de confirmar o veículo.",
    pendingPassengers: "Ainda existem passageiros a aguardar definição de embarque. Confirme o embarque ou registe quem não embarcou antes de iniciar a viagem.",
    segmentNotOperational: "Este trajeto já não permite alterações operacionais.",
    boardingAt: "Embarque iniciado em",
    arrivedAt: "Chegada registada em",
    status: {
      PLANEJADO: "Planeado",
      CONFIRMADO: "Confirmado",
      EM_EMBARQUE: "Em embarque",
      EM_TRANSITO: "Em trânsito",
      CHEGOU: "Chegou",
      CANCELADO: "Cancelado"
    }
  },

  "en-US": {
    confirmVehicle: "Confirm vehicle",
    confirmingVehicle: "Confirming...",
    startBoardingOperation: "Start boarding",
    startingBoardingOperation: "Starting...",
    startTrip: "Start trip",
    startingTrip: "Starting...",
    markArrived: "Register arrival",
    markingArrived: "Registering...",
    vehicleConfirmed: "Vehicle confirmed for the segment successfully.",
    boardingStarted: "Boarding operation started successfully.",
    tripStarted: "Trip started successfully.",
    arrivalRegistered: "Vehicle arrival registered successfully.",
    statusUpdateError: "The vehicle status could not be updated.",
    invalidStatusTransition: "This vehicle status change is not allowed.",
    noDriver: "Link at least one driver before confirming the vehicle.",
    pendingPassengers: "There are still passengers awaiting a boarding decision. Confirm boarding or record who did not board before starting the trip.",
    segmentNotOperational: "This segment no longer allows operational changes.",
    boardingAt: "Boarding started at",
    arrivedAt: "Arrival registered at",
    status: {
      PLANEJADO: "Planned",
      CONFIRMADO: "Confirmed",
      EM_EMBARQUE: "Boarding",
      EM_TRANSITO: "In transit",
      CHEGOU: "Arrived",
      CANCELADO: "Cancelled"
    }
  },

  "es-ES": {
    confirmVehicle: "Confirmar vehículo",
    confirmingVehicle: "Confirmando...",
    startBoardingOperation: "Iniciar embarque",
    startingBoardingOperation: "Iniciando...",
    startTrip: "Iniciar viaje",
    startingTrip: "Iniciando...",
    markArrived: "Registrar llegada",
    markingArrived: "Registrando...",
    vehicleConfirmed: "Vehículo confirmado para el trayecto correctamente.",
    boardingStarted: "Operación de embarque iniciada correctamente.",
    tripStarted: "Viaje iniciado correctamente.",
    arrivalRegistered: "Llegada del vehículo registrada correctamente.",
    statusUpdateError: "No se pudo actualizar el estado del vehículo.",
    invalidStatusTransition: "Este cambio de estado no está permitido para el vehículo.",
    noDriver: "Vincula al menos un conductor antes de confirmar el vehículo.",
    pendingPassengers: "Todavía hay pasajeros pendientes de definición de embarque. Confirma el embarque o registra quién no embarcó antes de iniciar el viaje.",
    segmentNotOperational: "Este trayecto ya no permite cambios operativos.",
    boardingAt: "Embarque iniciado el",
    arrivedAt: "Llegada registrada el",
    status: {
      PLANEJADO: "Planificado",
      CONFIRMADO: "Confirmado",
      EM_EMBARQUE: "En embarque",
      EM_TRANSITO: "En tránsito",
      CHEGOU: "Llegó",
      CANCELADO: "Cancelado"
    }
  },

  "fr-FR": {
    confirmVehicle: "Confirmer le véhicule",
    confirmingVehicle: "Confirmation...",
    startBoardingOperation: "Démarrer l’embarquement",
    startingBoardingOperation: "Démarrage...",
    startTrip: "Démarrer le trajet",
    startingTrip: "Démarrage...",
    markArrived: "Enregistrer l’arrivée",
    markingArrived: "Enregistrement...",
    vehicleConfirmed: "Véhicule confirmé pour le trajet avec succès.",
    boardingStarted: "Opération d’embarquement démarrée avec succès.",
    tripStarted: "Trajet démarré avec succès.",
    arrivalRegistered: "Arrivée du véhicule enregistrée avec succès.",
    statusUpdateError: "Impossible de mettre à jour le statut du véhicule.",
    invalidStatusTransition: "Ce changement de statut n’est pas autorisé pour le véhicule.",
    noDriver: "Associez au moins un conducteur avant de confirmer le véhicule.",
    pendingPassengers: "Des passagers sont encore en attente d’une décision d’embarquement. Confirmez leur embarquement ou indiquez ceux qui n’ont pas embarqué avant de démarrer le trajet.",
    segmentNotOperational: "Ce trajet n’autorise plus de modifications opérationnelles.",
    boardingAt: "Embarquement démarré le",
    arrivedAt: "Arrivée enregistrée le",
    status: {
      PLANEJADO: "Planifié",
      CONFIRMADO: "Confirmé",
      EM_EMBARQUE: "Embarquement",
      EM_TRANSITO: "En transit",
      CHEGOU: "Arrivé",
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
  json.AdminExternalActivityTransport.vehicleAssignment ??= {};

  const statusAtual =
    json.AdminExternalActivityTransport.vehicleAssignment.status || {};

  const { status, ...raiz } = valores;

  json.AdminExternalActivityTransport.vehicleAssignment = {
    ...json.AdminExternalActivityTransport.vehicleAssignment,
    ...raiz,
    status: {
      ...statusAtual,
      ...status
    }
  };

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log("");
console.log("Traduções da operação de veículos adicionadas.");