import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    actualDeparture: "Saída real",
    actualArrival: "Chegada real"
  },

  "pt-PT": {
    actualDeparture: "Saída real",
    actualArrival: "Chegada real"
  },

  "en-US": {
    actualDeparture: "Actual departure",
    actualArrival: "Actual arrival"
  },

  "es-ES": {
    actualDeparture: "Salida real",
    actualArrival: "Llegada real"
  },

  "fr-FR": {
    actualDeparture: "Départ réel",
    actualArrival: "Arrivée réelle"
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
  json.AdminExternalActivityTransport.segments ??= {};

  json.AdminExternalActivityTransport.segments = {
    ...json.AdminExternalActivityTransport.segments,
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
console.log("Traduções dos horários reais adicionadas.");