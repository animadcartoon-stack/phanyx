import fs from "node:fs";

const traducoes = {
  "pt-BR": {
    reservedForAnotherUser:
      "Este exemplar está reservado para outro usuário.",
    reservationExpired:
      "O prazo desta reserva já expirou.",
  },

  "pt-PT": {
    reservedForAnotherUser:
      "Este exemplar está reservado para outro utilizador.",
    reservationExpired:
      "O prazo desta reserva já expirou.",
  },

  "en-US": {
    reservedForAnotherUser:
      "This copy is reserved for another user.",
    reservationExpired:
      "This reservation has expired.",
  },

  "es-ES": {
    reservedForAnotherUser:
      "Este ejemplar está reservado para otro usuario.",
    reservationExpired:
      "El plazo de esta reserva ya ha vencido.",
  },

  "fr-FR": {
    reservedForAnotherUser:
      "Cet exemplaire est réservé pour un autre utilisateur.",
    reservationExpired:
      "Cette réservation a expiré.",
  },
};

for (const [locale, novas] of Object.entries(traducoes)) {
  const arquivo = `messages/${locale}.json`;

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
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
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}