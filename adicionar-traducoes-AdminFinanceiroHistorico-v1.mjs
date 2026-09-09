import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFinanceiroHistorico";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

const traducoes = {
  "pt-BR": {
    "title": "Histórico de Cobrança",
    "subtitle": "Registre e acompanhe as cobranças realizadas pela equipe.",
    "messages": {
      "loadError": "Erro ao carregar histórico",
      "saveError": "Erro ao registrar histórico",
      "saveSuccess": "Histórico registrado com sucesso."
    },
    "fields": {
      "studentId": "ID do aluno",
      "studentName": "Nome do aluno",
      "financialEntryId": "ID do lançamento financeiro",
      "responsible": "Responsável",
      "channel": "Canal",
      "action": "Ação",
      "note": "Observação"
    },
    "common": {
      "optional": "Opcional",
      "notProvided": "Não informado"
    },
    "channels": {
      "whatsapp": "WhatsApp",
      "manual": "Manual",
      "email": "E-mail",
      "phone": "Telefone",
      "system": "Sistema"
    },
    "actions": {
      "chargeSent": "Cobrança enviada",
      "reminderSent": "Lembrete enviado",
      "contactMade": "Contato realizado",
      "negotiation": "Negociação",
      "note": "Observação",
      "chargeCopied": "Cobrança copiada",
      "manualSettlement": "Baixa manual"
    },
    "buttons": {
      "saving": "Registrando...",
      "register": "Registrar histórico"
    },
    "recent": {
      "title": "Registros recentes",
      "loading": "Carregando histórico...",
      "empty": "Nenhum registro encontrado.",
      "student": "Aluno",
      "responsible": "Responsável",
      "entry": "Lançamento"
    }
  },
  "pt-PT": {
    "title": "Histórico de Cobranças",
    "subtitle": "Registe e acompanhe as cobranças realizadas pela equipa.",
    "messages": {
      "loadError": "Erro ao carregar o histórico",
      "saveError": "Erro ao registar o histórico",
      "saveSuccess": "Histórico registado com sucesso."
    },
    "fields": {
      "studentId": "ID do aluno",
      "studentName": "Nome do aluno",
      "financialEntryId": "ID do lançamento financeiro",
      "responsible": "Responsável",
      "channel": "Canal",
      "action": "Ação",
      "note": "Observação"
    },
    "common": {
      "optional": "Opcional",
      "notProvided": "Não informado"
    },
    "channels": {
      "whatsapp": "WhatsApp",
      "manual": "Manual",
      "email": "E-mail",
      "phone": "Telefone",
      "system": "Sistema"
    },
    "actions": {
      "chargeSent": "Cobrança enviada",
      "reminderSent": "Lembrete enviado",
      "contactMade": "Contacto realizado",
      "negotiation": "Negociação",
      "note": "Observação",
      "chargeCopied": "Cobrança copiada",
      "manualSettlement": "Baixa manual"
    },
    "buttons": {
      "saving": "A registar...",
      "register": "Registar histórico"
    },
    "recent": {
      "title": "Registos recentes",
      "loading": "A carregar histórico...",
      "empty": "Nenhum registo encontrado.",
      "student": "Aluno",
      "responsible": "Responsável",
      "entry": "Lançamento"
    }
  },
  "en-US": {
    "title": "Collection History",
    "subtitle": "Record and track collection actions performed by the team.",
    "messages": {
      "loadError": "Error loading collection history",
      "saveError": "Error recording collection history",
      "saveSuccess": "Collection history recorded successfully."
    },
    "fields": {
      "studentId": "Student ID",
      "studentName": "Student name",
      "financialEntryId": "Financial entry ID",
      "responsible": "Responsible person",
      "channel": "Channel",
      "action": "Action",
      "note": "Note"
    },
    "common": {
      "optional": "Optional",
      "notProvided": "Not provided"
    },
    "channels": {
      "whatsapp": "WhatsApp",
      "manual": "Manual",
      "email": "Email",
      "phone": "Phone",
      "system": "System"
    },
    "actions": {
      "chargeSent": "Collection message sent",
      "reminderSent": "Reminder sent",
      "contactMade": "Contact completed",
      "negotiation": "Negotiation",
      "note": "Note",
      "chargeCopied": "Collection message copied",
      "manualSettlement": "Manual settlement"
    },
    "buttons": {
      "saving": "Recording...",
      "register": "Record history"
    },
    "recent": {
      "title": "Recent records",
      "loading": "Loading history...",
      "empty": "No records found.",
      "student": "Student",
      "responsible": "Responsible person",
      "entry": "Financial entry"
    }
  },
  "es-ES": {
    "title": "Historial de Cobros",
    "subtitle": "Registra y consulta las acciones de cobro realizadas por el equipo.",
    "messages": {
      "loadError": "Error al cargar el historial",
      "saveError": "Error al registrar el historial",
      "saveSuccess": "Historial registrado correctamente."
    },
    "fields": {
      "studentId": "ID del alumno",
      "studentName": "Nombre del alumno",
      "financialEntryId": "ID del movimiento financiero",
      "responsible": "Responsable",
      "channel": "Canal",
      "action": "Acción",
      "note": "Observación"
    },
    "common": {
      "optional": "Opcional",
      "notProvided": "No informado"
    },
    "channels": {
      "whatsapp": "WhatsApp",
      "manual": "Manual",
      "email": "Correo electrónico",
      "phone": "Teléfono",
      "system": "Sistema"
    },
    "actions": {
      "chargeSent": "Cobro enviado",
      "reminderSent": "Recordatorio enviado",
      "contactMade": "Contacto realizado",
      "negotiation": "Negociación",
      "note": "Observación",
      "chargeCopied": "Mensaje de cobro copiado",
      "manualSettlement": "Regularización manual"
    },
    "buttons": {
      "saving": "Registrando...",
      "register": "Registrar historial"
    },
    "recent": {
      "title": "Registros recientes",
      "loading": "Cargando historial...",
      "empty": "No se encontraron registros.",
      "student": "Alumno",
      "responsible": "Responsable",
      "entry": "Movimiento"
    }
  },
  "fr-FR": {
    "title": "Historique des Recouvrements",
    "subtitle": "Enregistrez et suivez les actions de recouvrement réalisées par l’équipe.",
    "messages": {
      "loadError": "Erreur lors du chargement de l’historique",
      "saveError": "Erreur lors de l’enregistrement de l’historique",
      "saveSuccess": "Historique enregistré avec succès."
    },
    "fields": {
      "studentId": "ID de l’élève",
      "studentName": "Nom de l’élève",
      "financialEntryId": "ID de l’écriture financière",
      "responsible": "Responsable",
      "channel": "Canal",
      "action": "Action",
      "note": "Observation"
    },
    "common": {
      "optional": "Facultatif",
      "notProvided": "Non renseigné"
    },
    "channels": {
      "whatsapp": "WhatsApp",
      "manual": "Manuel",
      "email": "E-mail",
      "phone": "Téléphone",
      "system": "Système"
    },
    "actions": {
      "chargeSent": "Relance envoyée",
      "reminderSent": "Rappel envoyé",
      "contactMade": "Contact effectué",
      "negotiation": "Négociation",
      "note": "Observation",
      "chargeCopied": "Message de relance copié",
      "manualSettlement": "Régularisation manuelle"
    },
    "buttons": {
      "saving": "Enregistrement...",
      "register": "Enregistrer l’historique"
    },
    "recent": {
      "title": "Enregistrements récents",
      "loading": "Chargement de l’historique...",
      "empty": "Aucun enregistrement trouvé.",
      "student": "Élève",
      "responsible": "Responsable",
      "entry": "Écriture"
    }
  }
};

for (const locale of locales) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const backup = `${arquivo}.antes-${namespace}.bak`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(arquivo, backup);
    console.log(`Backup criado: ${backup}`);
  } else {
    console.log(`Backup já existe: ${backup}`);
  }

  const conteudo = fs.readFileSync(arquivo, "utf8");
  const json = JSON.parse(conteudo.replace(/^\uFEFF/, ""));

  json[namespace] = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK traduções: ${locale}`);
}

console.log(`Namespace ${namespace} instalado nos 5 idiomas.`);
