import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    "header": {
      "kicker": "Comercial",
      "title": "Relatórios comerciais",
      "description": "Acompanhe leads, conversões, matrículas, vendas e desempenho da equipe comercial.",
      "updating": "Atualizando...",
      "update": "Atualizar relatório"
    },
    "filters": {
      "title": "Filtros",
      "description": "Os indicadores abaixo respeitam os filtros selecionados.",
      "clear": "Limpar",
      "startDate": "Data inicial",
      "endDate": "Data final",
      "salesperson": "Vendedor",
      "course": "Curso",
      "campus": "Polo",
      "all": "Todos"
    },
    "tabs": {
      "overview": "Visão geral",
      "salespeople": "Vendedores",
      "leads": "Leads",
      "enrollments": "Matrículas",
      "courses": "Cursos"
    },
    "indicators": {
      "leadsReceived": "Leads recebidos",
      "leadsConverted": "Leads convertidos",
      "conversionRate": "Taxa de conversão",
      "enrollments": "Matrículas",
      "soldAmount": "Valor vendido",
      "receivedAtEnrollment": "Recebido no ato",
      "averageTicket": "Ticket médio",
      "cancellations": "Cancelamentos",
      "enrollmentsDescription": "Ativas, a iniciar ou concluídas",
      "soldAmountDescription": "Matrícula e mensalidades das vendas válidas",
      "receivedDescription": "Pagamentos registrados no ato da matrícula",
      "averageTicketDescription": "Valor vendido dividido pelas matrículas válidas",
      "cancellationsDescription": "Matrículas do período atualmente canceladas"
    },
    "salespeople": {
      "title": "Desempenho por vendedor",
      "description": "Resultado comercial individual no período selecionado.",
      "columns": {
        "salesperson": "Vendedor",
        "leads": "Leads",
        "conversions": "Conversões",
        "enrollments": "Matrículas",
        "conversion": "Conversão",
        "sold": "Vendido",
        "received": "Recebido"
      },
      "empty": "Nenhum resultado encontrado para este período."
    },
    "leads": {
      "title": "Leads recebidos",
      "description": "Leads recebidos no período e sua situação comercial. Ao filtrar por curso ou polo, a conversão considera a matrícula vinculada correspondente.",
      "columns": {
        "lead": "Lead",
        "contact": "Contato",
        "source": "Origem",
        "responsible": "Responsável",
        "status": "Status",
        "receivedAt": "Recebido em",
        "conversion": "Conversão"
      },
      "empty": "Nenhum lead foi encontrado neste período.",
      "converted": "Convertido",
      "notConverted": "Não convertido"
    },
    "enrollments": {
      "title": "Matrículas do período",
      "description": "Matrículas realizadas no período selecionado, com vendedor, origem e valores comerciais.",
      "columns": {
        "enrollment": "Matrícula",
        "student": "Aluno",
        "courseCampus": "Curso / Polo",
        "salesperson": "Vendedor",
        "source": "Origem",
        "status": "Status",
        "sold": "Vendido",
        "received": "Recebido"
      },
      "empty": "Nenhuma matrícula encontrada no período.",
      "notCounted": "Não contabilizada",
      "expected": "Previsto"
    },
    "courses": {
      "title": "Desempenho por curso",
      "description": "Resultado comercial dos cursos no período selecionado.",
      "columns": {
        "course": "Curso",
        "enrollments": "Matrículas",
        "convertedLeads": "Leads convertidos",
        "share": "Participação",
        "sold": "Vendido",
        "received": "Recebido",
        "averageTicket": "Ticket médio",
        "cancellations": "Cancelamentos"
      },
      "empty": "Nenhum resultado encontrado por curso neste período."
    },
    "common": {
      "noResponsible": "Sem responsável",
      "noCourse": "Sem curso",
      "noCampus": "Sem polo",
      "notProvided": "Não informado",
      "noCourseProvided": "Sem curso informado"
    },
    "status": {
      "active": "Ativa",
      "toStart": "A iniciar",
      "completed": "Concluída",
      "canceled": "Cancelada",
      "pending": "Pendente",
      "converted": "Convertido",
      "lost": "Perdido",
      "new": "Novo"
    },
    "errors": {
      "load": "Não foi possível carregar o relatório comercial.",
      "loadGeneric": "Erro ao carregar relatório comercial."
    }
  },
  "pt-PT": {
    "header": {
      "kicker": "Comercial",
      "title": "Relatórios comerciais",
      "description": "Acompanhe leads, conversões, matrículas, vendas e desempenho da equipa comercial.",
      "updating": "A atualizar...",
      "update": "Atualizar relatório"
    },
    "filters": {
      "title": "Filtros",
      "description": "Os indicadores abaixo respeitam os filtros selecionados.",
      "clear": "Limpar",
      "startDate": "Data inicial",
      "endDate": "Data final",
      "salesperson": "Vendedor",
      "course": "Curso",
      "campus": "Polo",
      "all": "Todos"
    },
    "tabs": {
      "overview": "Visão geral",
      "salespeople": "Vendedores",
      "leads": "Leads",
      "enrollments": "Matrículas",
      "courses": "Cursos"
    },
    "indicators": {
      "leadsReceived": "Leads recebidos",
      "leadsConverted": "Leads convertidos",
      "conversionRate": "Taxa de conversão",
      "enrollments": "Matrículas",
      "soldAmount": "Valor vendido",
      "receivedAtEnrollment": "Recebido no ato",
      "averageTicket": "Ticket médio",
      "cancellations": "Cancelamentos",
      "enrollmentsDescription": "Ativas, a iniciar ou concluídas",
      "soldAmountDescription": "Matrícula e mensalidades das vendas válidas",
      "receivedDescription": "Pagamentos registados no ato da matrícula",
      "averageTicketDescription": "Valor vendido dividido pelas matrículas válidas",
      "cancellationsDescription": "Matrículas do período atualmente canceladas"
    },
    "salespeople": {
      "title": "Desempenho por vendedor",
      "description": "Resultado comercial individual no período selecionado.",
      "columns": {
        "salesperson": "Vendedor",
        "leads": "Leads",
        "conversions": "Conversões",
        "enrollments": "Matrículas",
        "conversion": "Conversão",
        "sold": "Vendido",
        "received": "Recebido"
      },
      "empty": "Nenhum resultado encontrado para este período."
    },
    "leads": {
      "title": "Leads recebidos",
      "description": "Leads recebidos no período e a respetiva situação comercial. Ao filtrar por curso ou polo, a conversão considera a matrícula associada correspondente.",
      "columns": {
        "lead": "Lead",
        "contact": "Contacto",
        "source": "Origem",
        "responsible": "Responsável",
        "status": "Estado",
        "receivedAt": "Recebido em",
        "conversion": "Conversão"
      },
      "empty": "Nenhum lead foi encontrado neste período.",
      "converted": "Convertido",
      "notConverted": "Não convertido"
    },
    "enrollments": {
      "title": "Matrículas do período",
      "description": "Matrículas realizadas no período selecionado, com vendedor, origem e valores comerciais.",
      "columns": {
        "enrollment": "Matrícula",
        "student": "Aluno",
        "courseCampus": "Curso / Polo",
        "salesperson": "Vendedor",
        "source": "Origem",
        "status": "Estado",
        "sold": "Vendido",
        "received": "Recebido"
      },
      "empty": "Nenhuma matrícula encontrada no período.",
      "notCounted": "Não contabilizada",
      "expected": "Previsto"
    },
    "courses": {
      "title": "Desempenho por curso",
      "description": "Resultado comercial dos cursos no período selecionado.",
      "columns": {
        "course": "Curso",
        "enrollments": "Matrículas",
        "convertedLeads": "Leads convertidos",
        "share": "Participação",
        "sold": "Vendido",
        "received": "Recebido",
        "averageTicket": "Ticket médio",
        "cancellations": "Cancelamentos"
      },
      "empty": "Nenhum resultado encontrado por curso neste período."
    },
    "common": {
      "noResponsible": "Sem responsável",
      "noCourse": "Sem curso",
      "noCampus": "Sem polo",
      "notProvided": "Não indicado",
      "noCourseProvided": "Sem curso indicado"
    },
    "status": {
      "active": "Ativa",
      "toStart": "A iniciar",
      "completed": "Concluída",
      "canceled": "Cancelada",
      "pending": "Pendente",
      "converted": "Convertido",
      "lost": "Perdido",
      "new": "Novo"
    },
    "errors": {
      "load": "Não foi possível carregar o relatório comercial.",
      "loadGeneric": "Erro ao carregar o relatório comercial."
    }
  },
  "en-US": {
    "header": {
      "kicker": "Sales",
      "title": "Sales reports",
      "description": "Track leads, conversions, enrollments, sales, and sales-team performance.",
      "updating": "Updating...",
      "update": "Update report"
    },
    "filters": {
      "title": "Filters",
      "description": "The indicators below follow the selected filters.",
      "clear": "Clear",
      "startDate": "Start date",
      "endDate": "End date",
      "salesperson": "Salesperson",
      "course": "Course",
      "campus": "Campus",
      "all": "All"
    },
    "tabs": {
      "overview": "Overview",
      "salespeople": "Salespeople",
      "leads": "Leads",
      "enrollments": "Enrollments",
      "courses": "Courses"
    },
    "indicators": {
      "leadsReceived": "Leads received",
      "leadsConverted": "Leads converted",
      "conversionRate": "Conversion rate",
      "enrollments": "Enrollments",
      "soldAmount": "Amount sold",
      "receivedAtEnrollment": "Received at enrollment",
      "averageTicket": "Average ticket",
      "cancellations": "Cancellations",
      "enrollmentsDescription": "Active, upcoming, or completed",
      "soldAmountDescription": "Enrollment fee and tuition from valid sales",
      "receivedDescription": "Payments recorded at enrollment",
      "averageTicketDescription": "Amount sold divided by valid enrollments",
      "cancellationsDescription": "Enrollments from the period that are currently canceled"
    },
    "salespeople": {
      "title": "Performance by salesperson",
      "description": "Individual sales performance for the selected period.",
      "columns": {
        "salesperson": "Salesperson",
        "leads": "Leads",
        "conversions": "Conversions",
        "enrollments": "Enrollments",
        "conversion": "Conversion",
        "sold": "Sold",
        "received": "Received"
      },
      "empty": "No results found for this period."
    },
    "leads": {
      "title": "Leads received",
      "description": "Leads received during the period and their sales status. When filtering by course or campus, conversion considers the corresponding linked enrollment.",
      "columns": {
        "lead": "Lead",
        "contact": "Contact",
        "source": "Source",
        "responsible": "Responsible",
        "status": "Status",
        "receivedAt": "Received on",
        "conversion": "Conversion"
      },
      "empty": "No leads were found for this period.",
      "converted": "Converted",
      "notConverted": "Not converted"
    },
    "enrollments": {
      "title": "Enrollments in the period",
      "description": "Enrollments completed during the selected period, including salesperson, source, and sales amounts.",
      "columns": {
        "enrollment": "Enrollment",
        "student": "Student",
        "courseCampus": "Course / Campus",
        "salesperson": "Salesperson",
        "source": "Source",
        "status": "Status",
        "sold": "Sold",
        "received": "Received"
      },
      "empty": "No enrollments found for this period.",
      "notCounted": "Not counted",
      "expected": "Expected"
    },
    "courses": {
      "title": "Performance by course",
      "description": "Sales performance of courses during the selected period.",
      "columns": {
        "course": "Course",
        "enrollments": "Enrollments",
        "convertedLeads": "Converted leads",
        "share": "Share",
        "sold": "Sold",
        "received": "Received",
        "averageTicket": "Average ticket",
        "cancellations": "Cancellations"
      },
      "empty": "No course results found for this period."
    },
    "common": {
      "noResponsible": "No responsible person",
      "noCourse": "No course",
      "noCampus": "No campus",
      "notProvided": "Not provided",
      "noCourseProvided": "No course provided"
    },
    "status": {
      "active": "Active",
      "toStart": "Upcoming",
      "completed": "Completed",
      "canceled": "Canceled",
      "pending": "Pending",
      "converted": "Converted",
      "lost": "Lost",
      "new": "New"
    },
    "errors": {
      "load": "Could not load the sales report.",
      "loadGeneric": "Error loading the sales report."
    }
  },
  "es-ES": {
    "header": {
      "kicker": "Comercial",
      "title": "Informes comerciales",
      "description": "Haz seguimiento de leads, conversiones, matrículas, ventas y rendimiento del equipo comercial.",
      "updating": "Actualizando...",
      "update": "Actualizar informe"
    },
    "filters": {
      "title": "Filtros",
      "description": "Los indicadores siguientes respetan los filtros seleccionados.",
      "clear": "Limpiar",
      "startDate": "Fecha inicial",
      "endDate": "Fecha final",
      "salesperson": "Vendedor",
      "course": "Curso",
      "campus": "Sede",
      "all": "Todos"
    },
    "tabs": {
      "overview": "Visión general",
      "salespeople": "Vendedores",
      "leads": "Leads",
      "enrollments": "Matrículas",
      "courses": "Cursos"
    },
    "indicators": {
      "leadsReceived": "Leads recibidos",
      "leadsConverted": "Leads convertidos",
      "conversionRate": "Tasa de conversión",
      "enrollments": "Matrículas",
      "soldAmount": "Importe vendido",
      "receivedAtEnrollment": "Recibido en la matrícula",
      "averageTicket": "Ticket medio",
      "cancellations": "Cancelaciones",
      "enrollmentsDescription": "Activas, próximas a iniciar o finalizadas",
      "soldAmountDescription": "Matrícula y mensualidades de ventas válidas",
      "receivedDescription": "Pagos registrados en el momento de la matrícula",
      "averageTicketDescription": "Importe vendido dividido por las matrículas válidas",
      "cancellationsDescription": "Matrículas del período actualmente canceladas"
    },
    "salespeople": {
      "title": "Rendimiento por vendedor",
      "description": "Resultado comercial individual durante el período seleccionado.",
      "columns": {
        "salesperson": "Vendedor",
        "leads": "Leads",
        "conversions": "Conversiones",
        "enrollments": "Matrículas",
        "conversion": "Conversión",
        "sold": "Vendido",
        "received": "Recibido"
      },
      "empty": "No se encontraron resultados para este período."
    },
    "leads": {
      "title": "Leads recibidos",
      "description": "Leads recibidos durante el período y su situación comercial. Al filtrar por curso o sede, la conversión considera la matrícula vinculada correspondiente.",
      "columns": {
        "lead": "Lead",
        "contact": "Contacto",
        "source": "Origen",
        "responsible": "Responsable",
        "status": "Estado",
        "receivedAt": "Recibido el",
        "conversion": "Conversión"
      },
      "empty": "No se encontraron leads en este período.",
      "converted": "Convertido",
      "notConverted": "No convertido"
    },
    "enrollments": {
      "title": "Matrículas del período",
      "description": "Matrículas realizadas durante el período seleccionado, con vendedor, origen e importes comerciales.",
      "columns": {
        "enrollment": "Matrícula",
        "student": "Alumno",
        "courseCampus": "Curso / Sede",
        "salesperson": "Vendedor",
        "source": "Origen",
        "status": "Estado",
        "sold": "Vendido",
        "received": "Recibido"
      },
      "empty": "No se encontraron matrículas en el período.",
      "notCounted": "No contabilizada",
      "expected": "Previsto"
    },
    "courses": {
      "title": "Rendimiento por curso",
      "description": "Resultado comercial de los cursos durante el período seleccionado.",
      "columns": {
        "course": "Curso",
        "enrollments": "Matrículas",
        "convertedLeads": "Leads convertidos",
        "share": "Participación",
        "sold": "Vendido",
        "received": "Recibido",
        "averageTicket": "Ticket medio",
        "cancellations": "Cancelaciones"
      },
      "empty": "No se encontraron resultados por curso en este período."
    },
    "common": {
      "noResponsible": "Sin responsable",
      "noCourse": "Sin curso",
      "noCampus": "Sin sede",
      "notProvided": "No informado",
      "noCourseProvided": "Sin curso informado"
    },
    "status": {
      "active": "Activa",
      "toStart": "Por iniciar",
      "completed": "Finalizada",
      "canceled": "Cancelada",
      "pending": "Pendiente",
      "converted": "Convertido",
      "lost": "Perdido",
      "new": "Nuevo"
    },
    "errors": {
      "load": "No se pudo cargar el informe comercial.",
      "loadGeneric": "Error al cargar el informe comercial."
    }
  },
  "fr-FR": {
    "header": {
      "kicker": "Commercial",
      "title": "Rapports commerciaux",
      "description": "Suivez les prospects, les conversions, les inscriptions, les ventes et les performances de l’équipe commerciale.",
      "updating": "Mise à jour...",
      "update": "Mettre à jour le rapport"
    },
    "filters": {
      "title": "Filtres",
      "description": "Les indicateurs ci-dessous respectent les filtres sélectionnés.",
      "clear": "Effacer",
      "startDate": "Date de début",
      "endDate": "Date de fin",
      "salesperson": "Commercial",
      "course": "Cours",
      "campus": "Site",
      "all": "Tous"
    },
    "tabs": {
      "overview": "Vue d’ensemble",
      "salespeople": "Commerciaux",
      "leads": "Prospects",
      "enrollments": "Inscriptions",
      "courses": "Cours"
    },
    "indicators": {
      "leadsReceived": "Prospects reçus",
      "leadsConverted": "Prospects convertis",
      "conversionRate": "Taux de conversion",
      "enrollments": "Inscriptions",
      "soldAmount": "Montant vendu",
      "receivedAtEnrollment": "Reçu à l’inscription",
      "averageTicket": "Panier moyen",
      "cancellations": "Annulations",
      "enrollmentsDescription": "Actives, à venir ou terminées",
      "soldAmountDescription": "Frais d’inscription et mensualités des ventes valides",
      "receivedDescription": "Paiements enregistrés lors de l’inscription",
      "averageTicketDescription": "Montant vendu divisé par les inscriptions valides",
      "cancellationsDescription": "Inscriptions de la période actuellement annulées"
    },
    "salespeople": {
      "title": "Performance par commercial",
      "description": "Résultat commercial individuel sur la période sélectionnée.",
      "columns": {
        "salesperson": "Commercial",
        "leads": "Prospects",
        "conversions": "Conversions",
        "enrollments": "Inscriptions",
        "conversion": "Conversion",
        "sold": "Vendu",
        "received": "Reçu"
      },
      "empty": "Aucun résultat trouvé pour cette période."
    },
    "leads": {
      "title": "Prospects reçus",
      "description": "Prospects reçus pendant la période et leur situation commerciale. Lors d’un filtrage par cours ou site, la conversion tient compte de l’inscription correspondante.",
      "columns": {
        "lead": "Prospect",
        "contact": "Contact",
        "source": "Origine",
        "responsible": "Responsable",
        "status": "Statut",
        "receivedAt": "Reçu le",
        "conversion": "Conversion"
      },
      "empty": "Aucun prospect trouvé pour cette période.",
      "converted": "Converti",
      "notConverted": "Non converti"
    },
    "enrollments": {
      "title": "Inscriptions de la période",
      "description": "Inscriptions réalisées pendant la période sélectionnée, avec commercial, origine et montants commerciaux.",
      "columns": {
        "enrollment": "Inscription",
        "student": "Élève",
        "courseCampus": "Cours / Site",
        "salesperson": "Commercial",
        "source": "Origine",
        "status": "Statut",
        "sold": "Vendu",
        "received": "Reçu"
      },
      "empty": "Aucune inscription trouvée pour cette période.",
      "notCounted": "Non comptabilisée",
      "expected": "Prévu"
    },
    "courses": {
      "title": "Performance par cours",
      "description": "Résultat commercial des cours pendant la période sélectionnée.",
      "columns": {
        "course": "Cours",
        "enrollments": "Inscriptions",
        "convertedLeads": "Prospects convertis",
        "share": "Part",
        "sold": "Vendu",
        "received": "Reçu",
        "averageTicket": "Panier moyen",
        "cancellations": "Annulations"
      },
      "empty": "Aucun résultat par cours trouvé pour cette période."
    },
    "common": {
      "noResponsible": "Sans responsable",
      "noCourse": "Sans cours",
      "noCampus": "Sans site",
      "notProvided": "Non renseigné",
      "noCourseProvided": "Cours non renseigné"
    },
    "status": {
      "active": "Active",
      "toStart": "À venir",
      "completed": "Terminée",
      "canceled": "Annulée",
      "pending": "En attente",
      "converted": "Converti",
      "lost": "Perdu",
      "new": "Nouveau"
    },
    "errors": {
      "load": "Impossible de charger le rapport commercial.",
      "loadGeneric": "Erreur lors du chargement du rapport commercial."
    }
  }
};
const arquivos = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

for (const locale of arquivos) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    console.error(`✗ ${locale}: arquivo não encontrado em ${arquivo}`);
    process.exitCode = 1;
    continue;
  }

  const atual = JSON.parse(fs.readFileSync(arquivo, "utf8"));
  atual.AdminCommercialReports = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(atual, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}: AdminCommercialReports atualizado`);
}

console.log("\nConcluído. As traduções de Relatórios comerciais foram atualizadas nos cinco idiomas.");
