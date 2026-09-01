import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    edit: "Atualizar acompanhamento",
    result: "Resultado",
    resultPlaceholder:
      "Descreva o resultado da intervenção ou a situação atual do acompanhamento...",
    resultRequiredResolved:
      "Informe o resultado para concluir a intervenção.",
    resultRequiredCancelled:
      "Informe o motivo do cancelamento.",
    saveUpdate: "Salvar atualização",
    savingUpdate: "Salvando...",
    updateSuccess:
      "Acompanhamento atualizado com sucesso.",
    updateError:
      "Não foi possível atualizar o acompanhamento.",
    historyUpdate: "Atualizar",
    historyResult: "Resultado",
    historyCompletedAt: "Concluído em",
  },

  "pt-PT": {
    edit: "Atualizar acompanhamento",
    result: "Resultado",
    resultPlaceholder:
      "Descreva o resultado da intervenção ou a situação atual do acompanhamento...",
    resultRequiredResolved:
      "Indique o resultado para concluir a intervenção.",
    resultRequiredCancelled:
      "Indique o motivo do cancelamento.",
    saveUpdate: "Guardar atualização",
    savingUpdate: "A guardar...",
    updateSuccess:
      "Acompanhamento atualizado com sucesso.",
    updateError:
      "Não foi possível atualizar o acompanhamento.",
    historyUpdate: "Atualizar",
    historyResult: "Resultado",
    historyCompletedAt: "Concluído em",
  },

  "en-US": {
    edit: "Update follow-up",
    result: "Outcome",
    resultPlaceholder:
      "Describe the intervention outcome or the current follow-up situation...",
    resultRequiredResolved:
      "Enter the outcome before resolving the intervention.",
    resultRequiredCancelled:
      "Enter the reason for cancellation.",
    saveUpdate: "Save update",
    savingUpdate: "Saving...",
    updateSuccess:
      "Follow-up updated successfully.",
    updateError:
      "The follow-up could not be updated.",
    historyUpdate: "Update",
    historyResult: "Outcome",
    historyCompletedAt: "Completed at",
  },

  "es-ES": {
    edit: "Actualizar seguimiento",
    result: "Resultado",
    resultPlaceholder:
      "Describe el resultado de la intervención o la situación actual del seguimiento...",
    resultRequiredResolved:
      "Indica el resultado antes de resolver la intervención.",
    resultRequiredCancelled:
      "Indica el motivo de la cancelación.",
    saveUpdate: "Guardar actualización",
    savingUpdate: "Guardando...",
    updateSuccess:
      "Seguimiento actualizado correctamente.",
    updateError:
      "No se pudo actualizar el seguimiento.",
    historyUpdate: "Actualizar",
    historyResult: "Resultado",
    historyCompletedAt: "Finalizado el",
  },

  "fr-FR": {
    edit: "Mettre à jour le suivi",
    result: "Résultat",
    resultPlaceholder:
      "Décrivez le résultat de l'intervention ou la situation actuelle du suivi...",
    resultRequiredResolved:
      "Indiquez le résultat avant de clôturer l'intervention.",
    resultRequiredCancelled:
      "Indiquez le motif de l'annulation.",
    saveUpdate: "Enregistrer la mise à jour",
    savingUpdate: "Enregistrement...",
    updateSuccess:
      "Suivi mis à jour avec succès.",
    updateError:
      "Impossible de mettre à jour le suivi.",
    historyUpdate: "Mettre à jour",
    historyResult: "Résultat",
    historyCompletedAt: "Terminé le",
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

  const intervention =
    json
      ?.AdminStudentSuccess
      ?.intervention;

  if (!intervention) {
    throw new Error(
      `AdminStudentSuccess.intervention não encontrado em ${locale}.json`
    );
  }

  intervention.update = {
    edit:
      valores.edit,

    result:
      valores.result,

    resultPlaceholder:
      valores.resultPlaceholder,

    resultRequiredResolved:
      valores.resultRequiredResolved,

    resultRequiredCancelled:
      valores.resultRequiredCancelled,

    save:
      valores.saveUpdate,

    saving:
      valores.savingUpdate,

    success:
      valores.updateSuccess,

    error:
      valores.updateError,
  };

  if (
    !intervention.history
  ) {
    intervention.history = {};
  }

  intervention.history.update =
    valores.historyUpdate;

  intervention.history.result =
    valores.historyResult;

  intervention.history.completedAt =
    valores.historyCompletedAt;

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
  "\n✅ Traduções da atualização de intervenções concluídas."
);