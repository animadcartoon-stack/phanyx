import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Eventos enviados pelo webhook",
    help: "Escolha quais eventos comerciais serão enviados para o endereço de destino.",
    selectAll: "Selecionar todos",
    clearAll: "Desmarcar todos",
    items: {
      submissionProcessed: "Submissão processada",
      submissionDuplicated: "Submissão duplicada",
      submissionRejected: "Submissão rejeitada",
      leadCreated: "Lead criado",
      leadUpdated: "Lead atualizado",
      leadStageChanged: "Etapa do lead alterada",
      leadLost: "Lead perdido",
      leadConverted: "Lead convertido",
      leadOwnerChanged: "Responsável do lead alterado",
      taskCreated: "Tarefa criada",
      taskCompleted: "Tarefa concluída"
    },
    atLeastOneRequired:
      "Selecione pelo menos um evento para o webhook de saída."
  },

  "pt-PT": {
    title: "Eventos enviados pelo webhook",
    help: "Escolha quais eventos comerciais serão enviados para o endereço de destino.",
    selectAll: "Selecionar todos",
    clearAll: "Desmarcar todos",
    items: {
      submissionProcessed: "Submissão processada",
      submissionDuplicated: "Submissão duplicada",
      submissionRejected: "Submissão rejeitada",
      leadCreated: "Lead criado",
      leadUpdated: "Lead atualizado",
      leadStageChanged: "Etapa do lead alterada",
      leadLost: "Lead perdido",
      leadConverted: "Lead convertido",
      leadOwnerChanged: "Responsável do lead alterado",
      taskCreated: "Tarefa criada",
      taskCompleted: "Tarefa concluída"
    },
    atLeastOneRequired:
      "Selecione pelo menos um evento para o webhook de saída."
  },

  "en-US": {
    title: "Events sent by the webhook",
    help: "Choose which commercial events will be sent to the destination endpoint.",
    selectAll: "Select all",
    clearAll: "Clear all",
    items: {
      submissionProcessed: "Submission processed",
      submissionDuplicated: "Duplicate submission",
      submissionRejected: "Submission rejected",
      leadCreated: "Lead created",
      leadUpdated: "Lead updated",
      leadStageChanged: "Lead stage changed",
      leadLost: "Lead lost",
      leadConverted: "Lead converted",
      leadOwnerChanged: "Lead owner changed",
      taskCreated: "Task created",
      taskCompleted: "Task completed"
    },
    atLeastOneRequired:
      "Select at least one event for the outgoing webhook."
  },

  "es-ES": {
    title: "Eventos enviados por el webhook",
    help: "Elige qué eventos comerciales se enviarán al endpoint de destino.",
    selectAll: "Seleccionar todos",
    clearAll: "Desmarcar todos",
    items: {
      submissionProcessed: "Envío procesado",
      submissionDuplicated: "Envío duplicado",
      submissionRejected: "Envío rechazado",
      leadCreated: "Lead creado",
      leadUpdated: "Lead actualizado",
      leadStageChanged: "Etapa del lead modificada",
      leadLost: "Lead perdido",
      leadConverted: "Lead convertido",
      leadOwnerChanged: "Responsable del lead modificado",
      taskCreated: "Tarea creada",
      taskCompleted: "Tarea completada"
    },
    atLeastOneRequired:
      "Selecciona al menos un evento para el webhook de salida."
  },

  "fr-FR": {
    title: "Événements envoyés par le webhook",
    help: "Choisissez les événements commerciaux qui seront envoyés au point de terminaison de destination.",
    selectAll: "Tout sélectionner",
    clearAll: "Tout désélectionner",
    items: {
      submissionProcessed: "Soumission traitée",
      submissionDuplicated: "Soumission en double",
      submissionRejected: "Soumission rejetée",
      leadCreated: "Lead créé",
      leadUpdated: "Lead mis à jour",
      leadStageChanged: "Étape du lead modifiée",
      leadLost: "Lead perdu",
      leadConverted: "Lead converti",
      leadOwnerChanged: "Responsable du lead modifié",
      taskCreated: "Tâche créée",
      taskCompleted: "Tâche terminée"
    },
    atLeastOneRequired:
      "Sélectionnez au moins un événement pour le webhook sortant."
  }
};

for (const [locale, conteudo] of Object.entries(traducoes)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  if (!json.AdminCommercialIntegrations) {
    throw new Error(
      `${locale}: namespace AdminCommercialIntegrations não encontrado`
    );
  }

  json.AdminCommercialIntegrations.list ??= {};
  json.AdminCommercialIntegrations.list.modal ??= {};

  json.AdminCommercialIntegrations.list.modal.webhookEvents = {
    title: conteudo.title,
    help: conteudo.help,
    selectAll: conteudo.selectAll,
    clearAll: conteudo.clearAll,
    items: conteudo.items
  };

  json.AdminCommercialIntegrations.errors ??= {};

  json.AdminCommercialIntegrations.errors.atLeastOneWebhookEvent =
    conteudo.atLeastOneRequired;

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}`);
}

console.log(
  "\n✓ TRADUÇÕES DOS EVENTOS DE WEBHOOK ADICIONADAS NOS 5 IDIOMAS"
);
