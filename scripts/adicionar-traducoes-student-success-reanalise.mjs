import fs from "node:fs";

const arquivos = {
  "pt-BR": "./messages/pt-BR.json",
  "pt-PT": "./messages/pt-PT.json",
  "en-US": "./messages/en-US.json",
  "es-ES": "./messages/es-ES.json",
  "fr-FR": "./messages/fr-FR.json",
};

const traducoes = {
  "pt-BR": {
    button: "Reanalisar alunos",
    running: "Reanalisando alunos...",
    successTitle: "Reanálise concluída",
    studentsAnalyzed: "Alunos analisados",
    changesRecorded: "Alterações acadêmicas registradas",
    noChanges: "Sem alterações",
    initialSnapshots: "Fotografias iniciais",
    error: "Não foi possível concluir a reanálise acadêmica.",
  },

  "pt-PT": {
    button: "Reanalisar alunos",
    running: "A reanalisar alunos...",
    successTitle: "Reanálise concluída",
    studentsAnalyzed: "Alunos analisados",
    changesRecorded: "Alterações académicas registadas",
    noChanges: "Sem alterações",
    initialSnapshots: "Fotografias iniciais",
    error: "Não foi possível concluir a reanálise académica.",
  },

  "en-US": {
    button: "Reanalyze students",
    running: "Reanalyzing students...",
    successTitle: "Reanalysis completed",
    studentsAnalyzed: "Students analyzed",
    changesRecorded: "Academic changes recorded",
    noChanges: "No changes",
    initialSnapshots: "Initial snapshots",
    error: "The academic reanalysis could not be completed.",
  },

  "es-ES": {
    button: "Reanalizar alumnos",
    running: "Reanalizando alumnos...",
    successTitle: "Reanálisis completado",
    studentsAnalyzed: "Alumnos analizados",
    changesRecorded: "Cambios académicos registrados",
    noChanges: "Sin cambios",
    initialSnapshots: "Fotografías iniciales",
    error: "No se pudo completar el reanálisis académico.",
  },

  "fr-FR": {
    button: "Réanalyser les élèves",
    running: "Réanalyse des élèves...",
    successTitle: "Réanalyse terminée",
    studentsAnalyzed: "Élèves analysés",
    changesRecorded: "Modifications académiques enregistrées",
    noChanges: "Aucune modification",
    initialSnapshots: "Photographies initiales",
    error: "La réanalyse académique n'a pas pu être effectuée.",
  },
};

for (
  const [locale, caminho]
  of Object.entries(arquivos)
) {
  const json =
    JSON.parse(
      fs.readFileSync(
        caminho,
        "utf8"
      )
    );

  json.AdminStudentSuccess ??= {};
  json.AdminStudentSuccess.reanalysis ??= {};

  Object.assign(
    json.AdminStudentSuccess.reanalysis,
    traducoes[locale]
  );

  fs.writeFileSync(
    caminho,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(
    `✓ ${locale}`
  );
}

console.log(
  "\nTraduções da reanálise adicionadas."
);