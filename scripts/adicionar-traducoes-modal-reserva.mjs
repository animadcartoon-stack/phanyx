import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    reservationError:
      "Não foi possível registrar a reserva.",

    reservationImmediateSuccess:
      "Reserva registrada com sucesso. Um exemplar já está disponível e foi separado para este usuário.",

    reservationQueueSuccess:
      "Reserva registrada com sucesso. O usuário foi incluído na fila de espera.",

    reservationQueueSuccessWithPosition:
      "Reserva registrada com sucesso. O usuário ocupa a posição {position} na fila de espera.",
  },

  "pt-PT": {
    reservationError:
      "Não foi possível registar a reserva.",

    reservationImmediateSuccess:
      "Reserva registada com sucesso. Um exemplar já está disponível e foi reservado para este utilizador.",

    reservationQueueSuccess:
      "Reserva registada com sucesso. O utilizador foi incluído na lista de espera.",

    reservationQueueSuccessWithPosition:
      "Reserva registada com sucesso. O utilizador ocupa a posição {position} na lista de espera.",
  },

  "en-US": {
    reservationError:
      "The reservation could not be registered.",

    reservationImmediateSuccess:
      "Reservation registered successfully. A copy is already available and has been held for this user.",

    reservationQueueSuccess:
      "Reservation registered successfully. The user was added to the waiting queue.",

    reservationQueueSuccessWithPosition:
      "Reservation registered successfully. The user is number {position} in the waiting queue.",
  },

  "es-ES": {
    reservationError:
      "No se pudo registrar la reserva.",

    reservationImmediateSuccess:
      "Reserva registrada correctamente. Ya hay un ejemplar disponible y fue reservado para este usuario.",

    reservationQueueSuccess:
      "Reserva registrada correctamente. El usuario fue incluido en la lista de espera.",

    reservationQueueSuccessWithPosition:
      "Reserva registrada correctamente. El usuario ocupa la posición {position} en la lista de espera.",
  },

  "fr-FR": {
    reservationError:
      "La réservation n’a pas pu être enregistrée.",

    reservationImmediateSuccess:
      "Réservation enregistrée avec succès. Un exemplaire est déjà disponible et a été réservé pour cet utilisateur.",

    reservationQueueSuccess:
      "Réservation enregistrée avec succès. L’utilisateur a été ajouté à la file d’attente.",

    reservationQueueSuccessWithPosition:
      "Réservation enregistrée avec succès. L’utilisateur occupe la position {position} dans la file d’attente.",
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

  console.log(
    `✓ ${locale}`
  );
}