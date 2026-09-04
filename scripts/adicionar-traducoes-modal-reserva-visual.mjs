import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    reservationTitle:
      "Reservar item",

    reservationDescription:
      "Selecione a pessoa para quem este item será reservado.",

    reservationAvailabilityHelp:
      "Se houver um exemplar disponível, ele será separado imediatamente. Caso contrário, o usuário entrará na fila de espera.",

    selectedReservationUser:
      "Usuário da reserva",

    reservationNotes:
      "Observação da reserva",

    reservationNotesPlaceholder:
      "Adicione uma observação, se necessário.",

    optionalReservationNote:
      "Campo opcional.",

    registerReservationAction:
      "Confirmar reserva",
  },

  "pt-PT": {
    reservationTitle:
      "Reservar item",

    reservationDescription:
      "Selecione a pessoa para quem este item será reservado.",

    reservationAvailabilityHelp:
      "Se existir um exemplar disponível, será reservado imediatamente. Caso contrário, o utilizador entrará na lista de espera.",

    selectedReservationUser:
      "Utilizador da reserva",

    reservationNotes:
      "Observação da reserva",

    reservationNotesPlaceholder:
      "Adicione uma observação, se necessário.",

    optionalReservationNote:
      "Campo opcional.",

    registerReservationAction:
      "Confirmar reserva",
  },

  "en-US": {
    reservationTitle:
      "Reserve item",

    reservationDescription:
      "Select the person for whom this item will be reserved.",

    reservationAvailabilityHelp:
      "If a copy is available, it will be held immediately. Otherwise, the user will be added to the waiting queue.",

    selectedReservationUser:
      "Reservation user",

    reservationNotes:
      "Reservation notes",

    reservationNotesPlaceholder:
      "Add a note if necessary.",

    optionalReservationNote:
      "Optional field.",

    registerReservationAction:
      "Confirm reservation",
  },

  "es-ES": {
    reservationTitle:
      "Reservar ejemplar",

    reservationDescription:
      "Seleccione la persona para quien se reservará este título.",

    reservationAvailabilityHelp:
      "Si hay un ejemplar disponible, se reservará inmediatamente. De lo contrario, el usuario entrará en la lista de espera.",

    selectedReservationUser:
      "Usuario de la reserva",

    reservationNotes:
      "Observación de la reserva",

    reservationNotesPlaceholder:
      "Añada una observación si es necesario.",

    optionalReservationNote:
      "Campo opcional.",

    registerReservationAction:
      "Confirmar reserva",
  },

  "fr-FR": {
    reservationTitle:
      "Réserver un document",

    reservationDescription:
      "Sélectionnez la personne pour laquelle ce document sera réservé.",

    reservationAvailabilityHelp:
      "Si un exemplaire est disponible, il sera réservé immédiatement. Sinon, l’utilisateur sera ajouté à la file d’attente.",

    selectedReservationUser:
      "Utilisateur de la réservation",

    reservationNotes:
      "Observation de la réservation",

    reservationNotesPlaceholder:
      "Ajoutez une observation si nécessaire.",

    optionalReservationNote:
      "Champ facultatif.",

    registerReservationAction:
      "Confirmer la réservation",
  },
};

for (
  const [locale, novas] of
  Object.entries(traducoes)
) {
  const arquivo =
    `messages/${locale}.json`;

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  if (!json.AdminLibraryItemUi) {
    throw new Error(
      `Namespace AdminLibraryItemUi não encontrado em ${arquivo}`
    );
  }

  Object.assign(
    json.AdminLibraryItemUi,
    novas
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}