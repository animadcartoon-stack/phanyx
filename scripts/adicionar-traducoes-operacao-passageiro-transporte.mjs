import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    startBoarding: "Iniciar embarque",
    startingBoarding: "Iniciando...",
    markBoarded: "Confirmar embarque",
    markingBoarded: "Confirmando...",
    markNoShow: "Não embarcou",
    markingNoShow: "Registrando...",
    markDisembarked: "Confirmar desembarque",
    markingDisembarked: "Confirmando...",
    waitingBoardingSet: "Passageiro colocado em aguardando embarque.",
    boardedSet: "Embarque do passageiro confirmado com sucesso.",
    noShowSet: "Passageiro registrado como não embarcou.",
    disembarkedSet: "Desembarque do passageiro confirmado com sucesso.",
    statusUpdateError: "Não foi possível atualizar a situação do passageiro.",
    invalidStatusTransition: "Esta mudança de situação não é permitida para o passageiro.",
    boardedAt: "Embarcado em",
    disembarkedAt: "Desembarcado em"
  },

  "pt-PT": {
    startBoarding: "Iniciar embarque",
    startingBoarding: "A iniciar...",
    markBoarded: "Confirmar embarque",
    markingBoarded: "A confirmar...",
    markNoShow: "Não embarcou",
    markingNoShow: "A registar...",
    markDisembarked: "Confirmar desembarque",
    markingDisembarked: "A confirmar...",
    waitingBoardingSet: "Passageiro colocado em espera para embarque.",
    boardedSet: "Embarque do passageiro confirmado com sucesso.",
    noShowSet: "Passageiro registado como não embarcou.",
    disembarkedSet: "Desembarque do passageiro confirmado com sucesso.",
    statusUpdateError: "Não foi possível atualizar a situação do passageiro.",
    invalidStatusTransition: "Esta alteração de situação não é permitida para o passageiro.",
    boardedAt: "Embarcado em",
    disembarkedAt: "Desembarcado em"
  },

  "en-US": {
    startBoarding: "Start boarding",
    startingBoarding: "Starting...",
    markBoarded: "Confirm boarding",
    markingBoarded: "Confirming...",
    markNoShow: "Did not board",
    markingNoShow: "Recording...",
    markDisembarked: "Confirm disembarkation",
    markingDisembarked: "Confirming...",
    waitingBoardingSet: "Passenger set to awaiting boarding.",
    boardedSet: "Passenger boarding confirmed successfully.",
    noShowSet: "Passenger recorded as did not board.",
    disembarkedSet: "Passenger disembarkation confirmed successfully.",
    statusUpdateError: "The passenger status could not be updated.",
    invalidStatusTransition: "This passenger status change is not allowed.",
    boardedAt: "Boarded at",
    disembarkedAt: "Disembarked at"
  },

  "es-ES": {
    startBoarding: "Iniciar embarque",
    startingBoarding: "Iniciando...",
    markBoarded: "Confirmar embarque",
    markingBoarded: "Confirmando...",
    markNoShow: "No embarcó",
    markingNoShow: "Registrando...",
    markDisembarked: "Confirmar desembarque",
    markingDisembarked: "Confirmando...",
    waitingBoardingSet: "Pasajero puesto en espera de embarque.",
    boardedSet: "Embarque del pasajero confirmado correctamente.",
    noShowSet: "Pasajero registrado como no embarcó.",
    disembarkedSet: "Desembarque del pasajero confirmado correctamente.",
    statusUpdateError: "No se pudo actualizar el estado del pasajero.",
    invalidStatusTransition: "Este cambio de estado no está permitido para el pasajero.",
    boardedAt: "Embarcado el",
    disembarkedAt: "Desembarcado el"
  },

  "fr-FR": {
    startBoarding: "Démarrer l’embarquement",
    startingBoarding: "Démarrage...",
    markBoarded: "Confirmer l’embarquement",
    markingBoarded: "Confirmation...",
    markNoShow: "N’a pas embarqué",
    markingNoShow: "Enregistrement...",
    markDisembarked: "Confirmer le débarquement",
    markingDisembarked: "Confirmation...",
    waitingBoardingSet: "Passager placé en attente d’embarquement.",
    boardedSet: "Embarquement du passager confirmé avec succès.",
    noShowSet: "Passager enregistré comme n’ayant pas embarqué.",
    disembarkedSet: "Débarquement du passager confirmé avec succès.",
    statusUpdateError: "Impossible de mettre à jour le statut du passager.",
    invalidStatusTransition: "Ce changement de statut n’est pas autorisé pour ce passager.",
    boardedAt: "Embarqué le",
    disembarkedAt: "Débarqué le"
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
console.log("Traduções da operação de passageiros adicionadas.");