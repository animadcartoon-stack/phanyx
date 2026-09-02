import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    positiveEvolutionSubtitle:
      "{count, plural, one {# intervenção mensurável} other {# intervenções mensuráveis}}",

    sampleInsufficient:
      "Amostra insuficiente · {count, plural, one {# intervenção mensurável} other {# intervenções mensuráveis}}",

    lessThanOneDay:
      "< 1 dia",

    days:
      "{value, plural, one {# dia} other {# dias}}",
  },

  "pt-PT": {
    positiveEvolutionSubtitle:
      "{count, plural, one {# intervenção mensurável} other {# intervenções mensuráveis}}",

    sampleInsufficient:
      "Amostra insuficiente · {count, plural, one {# intervenção mensurável} other {# intervenções mensuráveis}}",

    lessThanOneDay:
      "< 1 dia",

    days:
      "{value, plural, one {# dia} other {# dias}}",
  },

  "en-US": {
    positiveEvolutionSubtitle:
      "{count, plural, one {# measurable intervention} other {# measurable interventions}}",

    sampleInsufficient:
      "Insufficient sample · {count, plural, one {# measurable intervention} other {# measurable interventions}}",

    lessThanOneDay:
      "< 1 day",

    days:
      "{value, plural, one {# day} other {# days}}",
  },

  "es-ES": {
    positiveEvolutionSubtitle:
      "{count, plural, one {# intervención medible} other {# intervenciones medibles}}",

    sampleInsufficient:
      "Muestra insuficiente · {count, plural, one {# intervención medible} other {# intervenciones medibles}}",

    lessThanOneDay:
      "< 1 día",

    days:
      "{value, plural, one {# día} other {# días}}",
  },

  "fr-FR": {
    positiveEvolutionSubtitle:
      "{count, plural, one {# intervention mesurable} other {# interventions mesurables}}",

    sampleInsufficient:
      "Échantillon insuffisant · {count, plural, one {# intervention mesurable} other {# interventions mesurables}}",

    lessThanOneDay:
      "< 1 jour",

    days:
      "{value, plural, one {# jour} other {# jours}}",
  },
};

const pasta =
  path.join(
    process.cwd(),
    "messages"
  );

for (
  const [
    locale,
    valores,
  ] of Object.entries(
    traducoes
  )
) {
  const arquivo =
    path.join(
      pasta,
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  const dashboard =
    json
      ?.AdminStudentSuccess
      ?.intervention
      ?.dashboard;

  if (!dashboard) {
    throw new Error(
      `AdminStudentSuccess.intervention.dashboard não encontrado em ${locale}.json`
    );
  }

  Object.assign(
    dashboard,
    valores
  );

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(
      json,
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `✅ ${locale}.json atualizado`
  );
}

console.log(
  "\n✅ Ajustes das traduções de efetividade concluídos."
);