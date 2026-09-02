import fs from "node:fs";
import path from "node:path";

const namespace = "AdminCommercialLeadGenerationCenter";

const traducoes = {
  "pt-BR": {
    "header": {
      "section": "Comercial",
      "title": "Central de Captação",
      "description": "Acompanhe a entrada de leads, formulários, campanhas, distribuição e integrações da instituição.",
      "period": "Período: {month} de {year}"
    },
    "actions": {
      "refresh": "↻ Atualizar",
      "updating": "Atualizando...",
      "tryAgain": "Tentar novamente"
    },
    "errors": {
      "load": "Não foi possível carregar a Central de Captação.",
      "openTitle": "Não foi possível abrir a Central de Captação"
    },
    "statuses": {
      "received": "Recebida",
      "validating": "Validando",
      "processing": "Processando",
      "processed": "Processada",
      "duplicate": "Duplicada",
      "rejected": "Rejeitada",
      "spam": "Spam",
      "error": "Erro"
    },
    "indicators": {
      "submissionsToday": {
        "title": "Submissões hoje",
        "detail": "{count} no mês"
      },
      "newLeads": {
        "title": "Novos leads",
        "detail": "{count} leads impactados"
      },
      "processing": {
        "title": "Processamento",
        "detail": "{count} processadas"
      },
      "pending": {
        "title": "Pendências",
        "withErrors": "{count} com erro",
        "noErrors": "Sem erros no mês"
      }
    },
    "quickAccess": {
      "heading": "Acessos rápidos",
      "description": "Configure e acompanhe os componentes da Central de Captação.",
      "channels": {
        "title": "Canais",
        "description": "{active} ativos de {total}"
      },
      "campaigns": {
        "title": "Campanhas",
        "description": "{active} ativas de {total}"
      },
      "forms": {
        "title": "Formulários",
        "description": "{published} publicados de {total}"
      },
      "submissions": {
        "title": "Submissões",
        "description": "{count} recebidas no mês"
      },
      "distribution": {
        "title": "Distribuição",
        "description": "{count} regras ativas"
      },
      "integrations": {
        "title": "Integrações",
        "description": "{active} ativas de {total}"
      }
    },
    "performance": {
      "title": "Desempenho do mês",
      "description": "Situação das submissões recebidas.",
      "processed": "Processadas",
      "duplicates": "Duplicadas",
      "rejected": "Rejeitadas",
      "spam": "Spam",
      "withErrors": "Com erro",
      "processingRate": "Taxa de processamento",
      "errorRate": "Taxa de erro"
    },
    "structure": {
      "title": "Estrutura ativa",
      "description": "Recursos atualmente disponíveis para captação.",
      "activeChannels": "Canais ativos",
      "activeCampaigns": "Campanhas ativas",
      "publishedForms": "Formulários publicados",
      "distributionRules": "Regras de distribuição",
      "activeIntegrations": "Integrações ativas",
      "integrationErrorSingular": "{count} integração com erro.",
      "integrationErrorPlural": "{count} integrações com erro."
    },
    "latest": {
      "title": "Últimas submissões",
      "description": "As 10 entradas mais recentes da Central.",
      "viewAll": "Ver todas",
      "emptyTitle": "Nenhuma submissão recebida",
      "emptyDescription": "Assim que um lead entrar, ele aparecerá aqui.",
      "columns": {
        "lead": "Lead",
        "source": "Origem",
        "campaign": "Campanha",
        "status": "Status",
        "linkedLead": "Lead vinculado",
        "receivedAt": "Recebido em",
        "action": "Ação"
      },
      "noName": "Sem nome",
      "noEmail": "Sem e-mail",
      "open": "Abrir"
    }
  },
  "pt-PT": {
    "header": {
      "section": "Comercial",
      "title": "Central de Captação",
      "description": "Acompanhe a entrada de leads, formulários, campanhas, distribuição e integrações da instituição.",
      "period": "Período: {month} de {year}"
    },
    "actions": {
      "refresh": "↻ Atualizar",
      "updating": "A atualizar...",
      "tryAgain": "Tentar novamente"
    },
    "errors": {
      "load": "Não foi possível carregar a Central de Captação.",
      "openTitle": "Não foi possível abrir a Central de Captação"
    },
    "statuses": {
      "received": "Recebida",
      "validating": "Em validação",
      "processing": "Em processamento",
      "processed": "Processada",
      "duplicate": "Duplicada",
      "rejected": "Rejeitada",
      "spam": "Spam",
      "error": "Erro"
    },
    "indicators": {
      "submissionsToday": {
        "title": "Submissões hoje",
        "detail": "{count} no mês"
      },
      "newLeads": {
        "title": "Novos leads",
        "detail": "{count} leads abrangidos"
      },
      "processing": {
        "title": "Processamento",
        "detail": "{count} processadas"
      },
      "pending": {
        "title": "Pendências",
        "withErrors": "{count} com erro",
        "noErrors": "Sem erros no mês"
      }
    },
    "quickAccess": {
      "heading": "Acessos rápidos",
      "description": "Configure e acompanhe os componentes da Central de Captação.",
      "channels": {
        "title": "Canais",
        "description": "{active} ativos de {total}"
      },
      "campaigns": {
        "title": "Campanhas",
        "description": "{active} ativas de {total}"
      },
      "forms": {
        "title": "Formulários",
        "description": "{published} publicados de {total}"
      },
      "submissions": {
        "title": "Submissões",
        "description": "{count} recebidas no mês"
      },
      "distribution": {
        "title": "Distribuição",
        "description": "{count} regras ativas"
      },
      "integrations": {
        "title": "Integrações",
        "description": "{active} ativas de {total}"
      }
    },
    "performance": {
      "title": "Desempenho do mês",
      "description": "Situação das submissões recebidas.",
      "processed": "Processadas",
      "duplicates": "Duplicadas",
      "rejected": "Rejeitadas",
      "spam": "Spam",
      "withErrors": "Com erro",
      "processingRate": "Taxa de processamento",
      "errorRate": "Taxa de erro"
    },
    "structure": {
      "title": "Estrutura ativa",
      "description": "Recursos atualmente disponíveis para captação.",
      "activeChannels": "Canais ativos",
      "activeCampaigns": "Campanhas ativas",
      "publishedForms": "Formulários publicados",
      "distributionRules": "Regras de distribuição",
      "activeIntegrations": "Integrações ativas",
      "integrationErrorSingular": "{count} integração com erro.",
      "integrationErrorPlural": "{count} integrações com erro."
    },
    "latest": {
      "title": "Últimas submissões",
      "description": "As 10 entradas mais recentes da Central.",
      "viewAll": "Ver todas",
      "emptyTitle": "Nenhuma submissão recebida",
      "emptyDescription": "Assim que entrar um lead, aparecerá aqui.",
      "columns": {
        "lead": "Lead",
        "source": "Origem",
        "campaign": "Campanha",
        "status": "Estado",
        "linkedLead": "Lead associado",
        "receivedAt": "Recebido em",
        "action": "Ação"
      },
      "noName": "Sem nome",
      "noEmail": "Sem e-mail",
      "open": "Abrir"
    }
  },
  "en-US": {
    "header": {
      "section": "Sales",
      "title": "Lead Generation Center",
      "description": "Track incoming leads, forms, campaigns, distribution rules, and integrations for the institution.",
      "period": "Period: {month} {year}"
    },
    "actions": {
      "refresh": "↻ Refresh",
      "updating": "Refreshing...",
      "tryAgain": "Try again"
    },
    "errors": {
      "load": "Could not load the Lead Generation Center.",
      "openTitle": "Could not open the Lead Generation Center"
    },
    "statuses": {
      "received": "Received",
      "validating": "Validating",
      "processing": "Processing",
      "processed": "Processed",
      "duplicate": "Duplicate",
      "rejected": "Rejected",
      "spam": "Spam",
      "error": "Error"
    },
    "indicators": {
      "submissionsToday": {
        "title": "Submissions today",
        "detail": "{count} this month"
      },
      "newLeads": {
        "title": "New leads",
        "detail": "{count} leads impacted"
      },
      "processing": {
        "title": "Processing",
        "detail": "{count} processed"
      },
      "pending": {
        "title": "Pending",
        "withErrors": "{count} with errors",
        "noErrors": "No errors this month"
      }
    },
    "quickAccess": {
      "heading": "Quick access",
      "description": "Configure and monitor the components of the Lead Generation Center.",
      "channels": {
        "title": "Channels",
        "description": "{active} active of {total}"
      },
      "campaigns": {
        "title": "Campaigns",
        "description": "{active} active of {total}"
      },
      "forms": {
        "title": "Forms",
        "description": "{published} published of {total}"
      },
      "submissions": {
        "title": "Submissions",
        "description": "{count} received this month"
      },
      "distribution": {
        "title": "Distribution",
        "description": "{count} active rules"
      },
      "integrations": {
        "title": "Integrations",
        "description": "{active} active of {total}"
      }
    },
    "performance": {
      "title": "Monthly performance",
      "description": "Status of received submissions.",
      "processed": "Processed",
      "duplicates": "Duplicates",
      "rejected": "Rejected",
      "spam": "Spam",
      "withErrors": "With errors",
      "processingRate": "Processing rate",
      "errorRate": "Error rate"
    },
    "structure": {
      "title": "Active setup",
      "description": "Resources currently available for lead generation.",
      "activeChannels": "Active channels",
      "activeCampaigns": "Active campaigns",
      "publishedForms": "Published forms",
      "distributionRules": "Distribution rules",
      "activeIntegrations": "Active integrations",
      "integrationErrorSingular": "{count} integration with an error.",
      "integrationErrorPlural": "{count} integrations with errors."
    },
    "latest": {
      "title": "Latest submissions",
      "description": "The 10 most recent entries in the Center.",
      "viewAll": "View all",
      "emptyTitle": "No submissions received",
      "emptyDescription": "As soon as a lead comes in, it will appear here.",
      "columns": {
        "lead": "Lead",
        "source": "Source",
        "campaign": "Campaign",
        "status": "Status",
        "linkedLead": "Linked lead",
        "receivedAt": "Received at",
        "action": "Action"
      },
      "noName": "No name",
      "noEmail": "No email",
      "open": "Open"
    }
  },
  "es-ES": {
    "header": {
      "section": "Comercial",
      "title": "Centro de Captación",
      "description": "Supervisa la entrada de leads, formularios, campañas, reglas de distribución e integraciones de la institución.",
      "period": "Período: {month} de {year}"
    },
    "actions": {
      "refresh": "↻ Actualizar",
      "updating": "Actualizando...",
      "tryAgain": "Intentar de nuevo"
    },
    "errors": {
      "load": "No se pudo cargar el Centro de Captación.",
      "openTitle": "No se pudo abrir el Centro de Captación"
    },
    "statuses": {
      "received": "Recibida",
      "validating": "Validando",
      "processing": "Procesando",
      "processed": "Procesada",
      "duplicate": "Duplicada",
      "rejected": "Rechazada",
      "spam": "Spam",
      "error": "Error"
    },
    "indicators": {
      "submissionsToday": {
        "title": "Envíos de hoy",
        "detail": "{count} este mes"
      },
      "newLeads": {
        "title": "Nuevos leads",
        "detail": "{count} leads impactados"
      },
      "processing": {
        "title": "Procesamiento",
        "detail": "{count} procesadas"
      },
      "pending": {
        "title": "Pendientes",
        "withErrors": "{count} con error",
        "noErrors": "Sin errores este mes"
      }
    },
    "quickAccess": {
      "heading": "Accesos rápidos",
      "description": "Configura y supervisa los componentes del Centro de Captación.",
      "channels": {
        "title": "Canales",
        "description": "{active} activos de {total}"
      },
      "campaigns": {
        "title": "Campañas",
        "description": "{active} activas de {total}"
      },
      "forms": {
        "title": "Formularios",
        "description": "{published} publicados de {total}"
      },
      "submissions": {
        "title": "Envíos",
        "description": "{count} recibidos este mes"
      },
      "distribution": {
        "title": "Distribución",
        "description": "{count} reglas activas"
      },
      "integrations": {
        "title": "Integraciones",
        "description": "{active} activas de {total}"
      }
    },
    "performance": {
      "title": "Rendimiento del mes",
      "description": "Situación de los envíos recibidos.",
      "processed": "Procesadas",
      "duplicates": "Duplicadas",
      "rejected": "Rechazadas",
      "spam": "Spam",
      "withErrors": "Con error",
      "processingRate": "Tasa de procesamiento",
      "errorRate": "Tasa de error"
    },
    "structure": {
      "title": "Estructura activa",
      "description": "Recursos disponibles actualmente para la captación.",
      "activeChannels": "Canales activos",
      "activeCampaigns": "Campañas activas",
      "publishedForms": "Formularios publicados",
      "distributionRules": "Reglas de distribución",
      "activeIntegrations": "Integraciones activas",
      "integrationErrorSingular": "{count} integración con error.",
      "integrationErrorPlural": "{count} integraciones con errores."
    },
    "latest": {
      "title": "Últimos envíos",
      "description": "Las 10 entradas más recientes del Centro.",
      "viewAll": "Ver todos",
      "emptyTitle": "No se han recibido envíos",
      "emptyDescription": "En cuanto entre un lead, aparecerá aquí.",
      "columns": {
        "lead": "Lead",
        "source": "Origen",
        "campaign": "Campaña",
        "status": "Estado",
        "linkedLead": "Lead vinculado",
        "receivedAt": "Recibido el",
        "action": "Acción"
      },
      "noName": "Sin nombre",
      "noEmail": "Sin correo electrónico",
      "open": "Abrir"
    }
  },
  "fr-FR": {
    "header": {
      "section": "Commercial",
      "title": "Centre d’acquisition",
      "description": "Suivez l’arrivée des prospects, formulaires, campagnes, règles de distribution et intégrations de l’établissement.",
      "period": "Période : {month} {year}"
    },
    "actions": {
      "refresh": "↻ Actualiser",
      "updating": "Actualisation...",
      "tryAgain": "Réessayer"
    },
    "errors": {
      "load": "Impossible de charger le Centre d’acquisition.",
      "openTitle": "Impossible d’ouvrir le Centre d’acquisition"
    },
    "statuses": {
      "received": "Reçue",
      "validating": "Validation",
      "processing": "Traitement",
      "processed": "Traitée",
      "duplicate": "Doublon",
      "rejected": "Rejetée",
      "spam": "Spam",
      "error": "Erreur"
    },
    "indicators": {
      "submissionsToday": {
        "title": "Soumissions aujourd’hui",
        "detail": "{count} ce mois-ci"
      },
      "newLeads": {
        "title": "Nouveaux prospects",
        "detail": "{count} prospects concernés"
      },
      "processing": {
        "title": "Traitement",
        "detail": "{count} traitées"
      },
      "pending": {
        "title": "En attente",
        "withErrors": "{count} avec erreur",
        "noErrors": "Aucune erreur ce mois-ci"
      }
    },
    "quickAccess": {
      "heading": "Accès rapides",
      "description": "Configurez et suivez les composants du Centre d’acquisition.",
      "channels": {
        "title": "Canaux",
        "description": "{active} actifs sur {total}"
      },
      "campaigns": {
        "title": "Campagnes",
        "description": "{active} actives sur {total}"
      },
      "forms": {
        "title": "Formulaires",
        "description": "{published} publiés sur {total}"
      },
      "submissions": {
        "title": "Soumissions",
        "description": "{count} reçues ce mois-ci"
      },
      "distribution": {
        "title": "Distribution",
        "description": "{count} règles actives"
      },
      "integrations": {
        "title": "Intégrations",
        "description": "{active} actives sur {total}"
      }
    },
    "performance": {
      "title": "Performance du mois",
      "description": "État des soumissions reçues.",
      "processed": "Traitées",
      "duplicates": "Doublons",
      "rejected": "Rejetées",
      "spam": "Spam",
      "withErrors": "Avec erreur",
      "processingRate": "Taux de traitement",
      "errorRate": "Taux d’erreur"
    },
    "structure": {
      "title": "Structure active",
      "description": "Ressources actuellement disponibles pour l’acquisition.",
      "activeChannels": "Canaux actifs",
      "activeCampaigns": "Campagnes actives",
      "publishedForms": "Formulaires publiés",
      "distributionRules": "Règles de distribution",
      "activeIntegrations": "Intégrations actives",
      "integrationErrorSingular": "{count} intégration en erreur.",
      "integrationErrorPlural": "{count} intégrations en erreur."
    },
    "latest": {
      "title": "Dernières soumissions",
      "description": "Les 10 entrées les plus récentes du Centre.",
      "viewAll": "Tout afficher",
      "emptyTitle": "Aucune soumission reçue",
      "emptyDescription": "Dès qu’un prospect arrivera, il apparaîtra ici.",
      "columns": {
        "lead": "Prospect",
        "source": "Origine",
        "campaign": "Campagne",
        "status": "Statut",
        "linkedLead": "Prospect associé",
        "receivedAt": "Reçu le",
        "action": "Action"
      },
      "noName": "Sans nom",
      "noEmail": "Sans e-mail",
      "open": "Ouvrir"
    }
  }
};

const arquivos = [
  ["pt-BR", path.join("messages", "pt-BR.json")],
  ["pt-PT", path.join("messages", "pt-PT.json")],
  ["en-US", path.join("messages", "en-US.json")],
  ["es-ES", path.join("messages", "es-ES.json")],
  ["fr-FR", path.join("messages", "fr-FR.json")],
];

for (const [locale, arquivoRelativo] of arquivos) {
  const arquivo = path.resolve(process.cwd(), arquivoRelativo);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const conteudo = JSON.parse(
    fs.readFileSync(arquivo, "utf8")
  );

  conteudo[namespace] = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(conteudo, null, 2) + "\n",
    "utf8"
  );

  console.log(
    `✓ ${locale}: ${namespace} atualizado`
  );
}

console.log(
  "\nConcluído. Os cinco arquivos de idioma foram atualizados."
);
