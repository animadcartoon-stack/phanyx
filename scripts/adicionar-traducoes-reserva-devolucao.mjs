import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    returnSuccessWithReservation:
      "Devolução registrada com sucesso. O exemplar foi reservado para o próximo usuário da fila.",

    returnSuccessWithFineAndReservation:
      "Devolução registrada com sucesso. Multa de {amount} gerada no Financeiro e o exemplar foi reservado para o próximo usuário da fila.",
  },

  "pt-PT": {
    returnSuccessWithReservation:
      "Devolução registada com sucesso. O exemplar foi reservado para o próximo utilizador da fila.",

    returnSuccessWithFineAndReservation:
      "Devolução registada com sucesso. Multa de {amount} gerada nas Finanças e o exemplar foi reservado para o próximo utilizador da fila.",
  },

  "en-US": {
    returnSuccessWithReservation:
      "Return registered successfully. The copy was reserved for the next user in the queue.",

    returnSuccessWithFineAndReservation:
      "Return registered successfully. A fine of {amount} was generated in Finance and the copy was reserved for the next user in the queue.",
  },

  "es-ES": {
    returnSuccessWithReservation:
      "Devolución registrada correctamente. El ejemplar fue reservado para el siguiente usuario de la cola.",

    returnSuccessWithFineAndReservation:
      "Devolución registrada correctamente. Se generó una multa de {amount} en Finanzas y el ejemplar fue reservado para el siguiente usuario de la cola.",
  },

  "fr-FR": {
    returnSuccessWithReservation:
      "Retour enregistré avec succès. L’exemplaire a été réservé pour le prochain utilisateur de la file d’attente.",

    returnSuccessWithFineAndReservation:
      "Retour enregistré avec succès. Une pénalité de {amount} a été générée dans les Finances et l’exemplaire a été réservé pour le prochain utilisateur de la file d’attente.",
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