import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFinanceiroRelatorios";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
const traducoes = {
  "pt-BR": {
    "title": "Relat\u00f3rios Financeiros",
    "subtitle": "Acompanhe recebimentos, pend\u00eancias, atrasos e inadimpl\u00eancia.",
    "openTour": "Abrir tutorial guiado",
    "loading": "Carregando relat\u00f3rios...",
    "filters": {
      "startDate": "Data inicial",
      "endDate": "Data final",
      "campus": "Polo",
      "allCampuses": "Todos os polos"
    },
    "summary": {
      "entries": "Lan\u00e7amentos",
      "totalPosted": "Total lan\u00e7ado",
      "totalPaid": "Total pago",
      "onlineAsaasIbe": "Online Asaas IBE",
      "paymentsCount": "{count, plural, one {# pagamento} other {# pagamentos}}",
      "pending": "Pendente",
      "overdue": "Atrasado",
      "defaultingStudents": "Inadimplentes"
    },
    "status": {
      "paid": "Pago",
      "pending": "Pendente",
      "partial": "Parcial",
      "overdue": "Atrasado",
      "cancelled": "Cancelado"
    },
    "types": {
      "enrollment": "Matr\u00edcula",
      "tuition": "Mensalidade",
      "fee": "Taxa",
      "discount": "Desconto",
      "other": "Outro"
    },
    "charts": {
      "revenueByDay": "Receita por dia",
      "posted": "Lan\u00e7ado",
      "paid": "Pago",
      "countByStatus": "Quantidade por status",
      "summaryByType": "Resumo por tipo de lan\u00e7amento",
      "value": "Valor"
    },
    "entries": {
      "title": "Lan\u00e7amentos do per\u00edodo",
      "empty": "Nenhum lan\u00e7amento encontrado neste per\u00edodo."
    },
    "table": {
      "student": "Aluno",
      "campus": "Polo",
      "type": "Tipo",
      "description": "Descri\u00e7\u00e3o",
      "finalAmount": "Valor final",
      "paid": "Pago",
      "status": "Status",
      "amount": "Valor"
    },
    "errors": {
      "loadReports": "Erro ao carregar relat\u00f3rios"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Pr\u00f3ximo",
      "finish": "Finalizar",
      "export": {
        "title": "Exporta\u00e7\u00f5es financeiras",
        "highlight": "Exporte os relat\u00f3rios em CSV, Excel ou PDF.",
        "description": "Esses bot\u00f5es permitem baixar os dados financeiros para confer\u00eancia, presta\u00e7\u00e3o de contas ou arquivo interno."
      },
      "period": {
        "title": "Filtro por per\u00edodo",
        "highlight": "Escolha a data inicial e final do relat\u00f3rio.",
        "description": "O PHANYX recalcula os indicadores financeiros conforme o per\u00edodo selecionado."
      },
      "campus": {
        "title": "Filtro por polo",
        "highlight": "Separe os resultados por unidade ou campus.",
        "description": "Quando a institui\u00e7\u00e3o possui polos, voc\u00ea pode analisar os dados financeiros de cada unidade."
      },
      "summary": {
        "title": "Resumo financeiro",
        "highlight": "Veja os principais n\u00fameros do per\u00edodo.",
        "description": "Aqui aparecem lan\u00e7amentos, valores pagos, pendentes, atrasados e alunos inadimplentes."
      },
      "charts": {
        "title": "Gr\u00e1ficos financeiros",
        "highlight": "Acompanhe visualmente a evolu\u00e7\u00e3o financeira.",
        "description": "Os gr\u00e1ficos ajudam a entender receita por dia, status dos lan\u00e7amentos e tipos de cobran\u00e7a."
      },
      "entries": {
        "title": "Lan\u00e7amentos do per\u00edodo",
        "highlight": "Confira cada lan\u00e7amento individualmente.",
        "description": "Essa lista mostra aluno, polo, tipo, descri\u00e7\u00e3o, valor, pagamento e status."
      }
    },
    "pdf": {
      "institutionalReport": "Relat\u00f3rio Financeiro Institucional",
      "period": "Per\u00edodo: {start} at\u00e9 {end}",
      "registrationId": "CNPJ",
      "phone": "Telefone",
      "email": "E-mail",
      "responsible": "Respons\u00e1vel",
      "role": "Cargo",
      "location": "Local",
      "address": "Endere\u00e7o",
      "executiveSummary": "Resumo Executivo",
      "summaryByType": "Resumo por Tipo",
      "entriesForPeriod": "Lan\u00e7amentos do Per\u00edodo",
      "firstEntriesNote": "Observa\u00e7\u00e3o: exibidos os primeiros {count} lan\u00e7amentos no PDF.",
      "page": "P\u00e1gina {current} de {total}",
      "fileSlug": "relatorio_financeiro"
    }
  },
  "pt-PT": {
    "title": "Relat\u00f3rios Financeiros",
    "subtitle": "Acompanhe recebimentos, pend\u00eancias, atrasos e incumprimentos.",
    "openTour": "Abrir tutorial guiado",
    "loading": "A carregar relat\u00f3rios...",
    "filters": {
      "startDate": "Data inicial",
      "endDate": "Data final",
      "campus": "Polo",
      "allCampuses": "Todos os polos"
    },
    "summary": {
      "entries": "Lan\u00e7amentos",
      "totalPosted": "Total lan\u00e7ado",
      "totalPaid": "Total pago",
      "onlineAsaasIbe": "Online Asaas IBE",
      "paymentsCount": "{count, plural, one {# pagamento} other {# pagamentos}}",
      "pending": "Pendente",
      "overdue": "Em atraso",
      "defaultingStudents": "Em incumprimento"
    },
    "status": {
      "paid": "Pago",
      "pending": "Pendente",
      "partial": "Parcial",
      "overdue": "Em atraso",
      "cancelled": "Cancelado"
    },
    "types": {
      "enrollment": "Matr\u00edcula",
      "tuition": "Mensalidade",
      "fee": "Taxa",
      "discount": "Desconto",
      "other": "Outro"
    },
    "charts": {
      "revenueByDay": "Receita por dia",
      "posted": "Lan\u00e7ado",
      "paid": "Pago",
      "countByStatus": "Quantidade por estado",
      "summaryByType": "Resumo por tipo de lan\u00e7amento",
      "value": "Valor"
    },
    "entries": {
      "title": "Lan\u00e7amentos do per\u00edodo",
      "empty": "Nenhum lan\u00e7amento encontrado neste per\u00edodo."
    },
    "table": {
      "student": "Aluno",
      "campus": "Polo",
      "type": "Tipo",
      "description": "Descri\u00e7\u00e3o",
      "finalAmount": "Valor final",
      "paid": "Pago",
      "status": "Estado",
      "amount": "Valor"
    },
    "errors": {
      "loadReports": "Erro ao carregar os relat\u00f3rios"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Seguinte",
      "finish": "Concluir",
      "export": {
        "title": "Exporta\u00e7\u00f5es financeiras",
        "highlight": "Exporte os relat\u00f3rios em CSV, Excel ou PDF.",
        "description": "Estes bot\u00f5es permitem descarregar os dados financeiros para confer\u00eancia, presta\u00e7\u00e3o de contas ou arquivo interno."
      },
      "period": {
        "title": "Filtro por per\u00edodo",
        "highlight": "Escolha a data inicial e final do relat\u00f3rio.",
        "description": "O PHANYX recalcula os indicadores financeiros de acordo com o per\u00edodo selecionado."
      },
      "campus": {
        "title": "Filtro por polo",
        "highlight": "Separe os resultados por unidade ou campus.",
        "description": "Quando a institui\u00e7\u00e3o possui polos, pode analisar os dados financeiros de cada unidade."
      },
      "summary": {
        "title": "Resumo financeiro",
        "highlight": "Veja os principais n\u00fameros do per\u00edodo.",
        "description": "Aqui s\u00e3o apresentados lan\u00e7amentos, valores pagos, pendentes, em atraso e alunos em incumprimento."
      },
      "charts": {
        "title": "Gr\u00e1ficos financeiros",
        "highlight": "Acompanhe visualmente a evolu\u00e7\u00e3o financeira.",
        "description": "Os gr\u00e1ficos ajudam a compreender a receita por dia, o estado dos lan\u00e7amentos e os tipos de cobran\u00e7a."
      },
      "entries": {
        "title": "Lan\u00e7amentos do per\u00edodo",
        "highlight": "Consulte cada lan\u00e7amento individualmente.",
        "description": "Esta lista apresenta aluno, polo, tipo, descri\u00e7\u00e3o, valor, pagamento e estado."
      }
    },
    "pdf": {
      "institutionalReport": "Relat\u00f3rio Financeiro Institucional",
      "period": "Per\u00edodo: {start} a {end}",
      "registrationId": "NIF / ID fiscal",
      "phone": "Telefone",
      "email": "E-mail",
      "responsible": "Respons\u00e1vel",
      "role": "Cargo",
      "location": "Local",
      "address": "Morada",
      "executiveSummary": "Resumo Executivo",
      "summaryByType": "Resumo por Tipo",
      "entriesForPeriod": "Lan\u00e7amentos do Per\u00edodo",
      "firstEntriesNote": "Observa\u00e7\u00e3o: s\u00e3o apresentados os primeiros {count} lan\u00e7amentos no PDF.",
      "page": "P\u00e1gina {current} de {total}",
      "fileSlug": "relatorio_financeiro"
    }
  },
  "en-US": {
    "title": "Financial Reports",
    "subtitle": "Track receivables, pending balances, overdue amounts, and delinquency.",
    "openTour": "Open guided tutorial",
    "loading": "Loading reports...",
    "filters": {
      "startDate": "Start date",
      "endDate": "End date",
      "campus": "Campus",
      "allCampuses": "All campuses"
    },
    "summary": {
      "entries": "Entries",
      "totalPosted": "Total posted",
      "totalPaid": "Total paid",
      "onlineAsaasIbe": "Online Asaas IBE",
      "paymentsCount": "{count, plural, one {# payment} other {# payments}}",
      "pending": "Pending",
      "overdue": "Overdue",
      "defaultingStudents": "Students in arrears"
    },
    "status": {
      "paid": "Paid",
      "pending": "Pending",
      "partial": "Partial",
      "overdue": "Overdue",
      "cancelled": "Cancelled"
    },
    "types": {
      "enrollment": "Enrollment",
      "tuition": "Tuition",
      "fee": "Fee",
      "discount": "Discount",
      "other": "Other"
    },
    "charts": {
      "revenueByDay": "Revenue by day",
      "posted": "Posted",
      "paid": "Paid",
      "countByStatus": "Count by status",
      "summaryByType": "Summary by entry type",
      "value": "Amount"
    },
    "entries": {
      "title": "Entries for the period",
      "empty": "No entries found for this period."
    },
    "table": {
      "student": "Student",
      "campus": "Campus",
      "type": "Type",
      "description": "Description",
      "finalAmount": "Final amount",
      "paid": "Paid",
      "status": "Status",
      "amount": "Amount"
    },
    "errors": {
      "loadReports": "Error loading reports"
    },
    "tour": {
      "label": "Guided tutorial",
      "step": "Step {current} of {total}",
      "close": "Close",
      "previous": "Previous",
      "next": "Next",
      "finish": "Finish",
      "export": {
        "title": "Financial exports",
        "highlight": "Export reports as CSV, Excel, or PDF.",
        "description": "Use these buttons to download financial data for review, accountability, or internal records."
      },
      "period": {
        "title": "Period filter",
        "highlight": "Choose the report start and end dates.",
        "description": "PHANYX recalculates financial indicators based on the selected period."
      },
      "campus": {
        "title": "Campus filter",
        "highlight": "Separate results by unit or campus.",
        "description": "When the institution has multiple campuses, you can analyze the financial data for each unit."
      },
      "summary": {
        "title": "Financial summary",
        "highlight": "Review the main figures for the period.",
        "description": "This section shows entries, paid amounts, pending balances, overdue amounts, and students in arrears."
      },
      "charts": {
        "title": "Financial charts",
        "highlight": "Track financial performance visually.",
        "description": "The charts help explain daily revenue, entry statuses, and charge types."
      },
      "entries": {
        "title": "Entries for the period",
        "highlight": "Review each financial entry individually.",
        "description": "This list shows student, campus, type, description, amount, payment, and status."
      }
    },
    "pdf": {
      "institutionalReport": "Institutional Financial Report",
      "period": "Period: {start} to {end}",
      "registrationId": "Tax ID",
      "phone": "Phone",
      "email": "Email",
      "responsible": "Responsible person",
      "role": "Role",
      "location": "Location",
      "address": "Address",
      "executiveSummary": "Executive Summary",
      "summaryByType": "Summary by Type",
      "entriesForPeriod": "Entries for the Period",
      "firstEntriesNote": "Note: the first {count} entries are shown in the PDF.",
      "page": "Page {current} of {total}",
      "fileSlug": "financial_report"
    }
  },
  "es-ES": {
    "title": "Informes Financieros",
    "subtitle": "Consulta cobros, saldos pendientes, vencimientos y morosidad.",
    "openTour": "Abrir tutorial guiado",
    "loading": "Cargando informes...",
    "filters": {
      "startDate": "Fecha inicial",
      "endDate": "Fecha final",
      "campus": "Campus",
      "allCampuses": "Todos los campus"
    },
    "summary": {
      "entries": "Movimientos",
      "totalPosted": "Total registrado",
      "totalPaid": "Total pagado",
      "onlineAsaasIbe": "Online Asaas IBE",
      "paymentsCount": "{count, plural, one {# pago} other {# pagos}}",
      "pending": "Pendiente",
      "overdue": "Vencido",
      "defaultingStudents": "Alumnos morosos"
    },
    "status": {
      "paid": "Pagado",
      "pending": "Pendiente",
      "partial": "Parcial",
      "overdue": "Vencido",
      "cancelled": "Cancelado"
    },
    "types": {
      "enrollment": "Matr\u00edcula",
      "tuition": "Mensualidad",
      "fee": "Tasa",
      "discount": "Descuento",
      "other": "Otro"
    },
    "charts": {
      "revenueByDay": "Ingresos por d\u00eda",
      "posted": "Registrado",
      "paid": "Pagado",
      "countByStatus": "Cantidad por estado",
      "summaryByType": "Resumen por tipo de movimiento",
      "value": "Importe"
    },
    "entries": {
      "title": "Movimientos del per\u00edodo",
      "empty": "No se encontraron movimientos en este per\u00edodo."
    },
    "table": {
      "student": "Alumno",
      "campus": "Campus",
      "type": "Tipo",
      "description": "Descripci\u00f3n",
      "finalAmount": "Importe final",
      "paid": "Pagado",
      "status": "Estado",
      "amount": "Importe"
    },
    "errors": {
      "loadReports": "Error al cargar los informes"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Paso {current} de {total}",
      "close": "Cerrar",
      "previous": "Anterior",
      "next": "Siguiente",
      "finish": "Finalizar",
      "export": {
        "title": "Exportaciones financieras",
        "highlight": "Exporta los informes en CSV, Excel o PDF.",
        "description": "Estos botones permiten descargar los datos financieros para revisi\u00f3n, rendici\u00f3n de cuentas o archivo interno."
      },
      "period": {
        "title": "Filtro por per\u00edodo",
        "highlight": "Elige la fecha inicial y final del informe.",
        "description": "PHANYX recalcula los indicadores financieros seg\u00fan el per\u00edodo seleccionado."
      },
      "campus": {
        "title": "Filtro por campus",
        "highlight": "Separa los resultados por unidad o campus.",
        "description": "Cuando la instituci\u00f3n tiene varios campus, puedes analizar los datos financieros de cada unidad."
      },
      "summary": {
        "title": "Resumen financiero",
        "highlight": "Consulta las principales cifras del per\u00edodo.",
        "description": "Aqu\u00ed se muestran movimientos, importes pagados, pendientes, vencidos y alumnos morosos."
      },
      "charts": {
        "title": "Gr\u00e1ficos financieros",
        "highlight": "Sigue visualmente la evoluci\u00f3n financiera.",
        "description": "Los gr\u00e1ficos ayudan a comprender los ingresos diarios, los estados de los movimientos y los tipos de cobro."
      },
      "entries": {
        "title": "Movimientos del per\u00edodo",
        "highlight": "Consulta cada movimiento individualmente.",
        "description": "Esta lista muestra alumno, campus, tipo, descripci\u00f3n, importe, pago y estado."
      }
    },
    "pdf": {
      "institutionalReport": "Informe Financiero Institucional",
      "period": "Per\u00edodo: {start} a {end}",
      "registrationId": "NIF / ID fiscal",
      "phone": "Tel\u00e9fono",
      "email": "Correo electr\u00f3nico",
      "responsible": "Responsable",
      "role": "Cargo",
      "location": "Localidad",
      "address": "Direcci\u00f3n",
      "executiveSummary": "Resumen Ejecutivo",
      "summaryByType": "Resumen por Tipo",
      "entriesForPeriod": "Movimientos del Per\u00edodo",
      "firstEntriesNote": "Nota: se muestran los primeros {count} movimientos en el PDF.",
      "page": "P\u00e1gina {current} de {total}",
      "fileSlug": "informe_financiero"
    }
  },
  "fr-FR": {
    "title": "Rapports Financiers",
    "subtitle": "Suivez les encaissements, les soldes en attente, les retards et les impay\u00e9s.",
    "openTour": "Ouvrir le tutoriel guid\u00e9",
    "loading": "Chargement des rapports...",
    "filters": {
      "startDate": "Date de d\u00e9but",
      "endDate": "Date de fin",
      "campus": "Campus",
      "allCampuses": "Tous les campus"
    },
    "summary": {
      "entries": "\u00c9critures",
      "totalPosted": "Total enregistr\u00e9",
      "totalPaid": "Total pay\u00e9",
      "onlineAsaasIbe": "Online Asaas IBE",
      "paymentsCount": "{count, plural, one {# paiement} other {# paiements}}",
      "pending": "En attente",
      "overdue": "En retard",
      "defaultingStudents": "\u00c9l\u00e8ves en impay\u00e9"
    },
    "status": {
      "paid": "Pay\u00e9",
      "pending": "En attente",
      "partial": "Partiel",
      "overdue": "En retard",
      "cancelled": "Annul\u00e9"
    },
    "types": {
      "enrollment": "Inscription",
      "tuition": "Mensualit\u00e9",
      "fee": "Frais",
      "discount": "Remise",
      "other": "Autre"
    },
    "charts": {
      "revenueByDay": "Recettes par jour",
      "posted": "Enregistr\u00e9",
      "paid": "Pay\u00e9",
      "countByStatus": "Nombre par statut",
      "summaryByType": "R\u00e9sum\u00e9 par type d\u2019\u00e9criture",
      "value": "Montant"
    },
    "entries": {
      "title": "\u00c9critures de la p\u00e9riode",
      "empty": "Aucune \u00e9criture trouv\u00e9e pour cette p\u00e9riode."
    },
    "table": {
      "student": "\u00c9l\u00e8ve",
      "campus": "Campus",
      "type": "Type",
      "description": "Description",
      "finalAmount": "Montant final",
      "paid": "Pay\u00e9",
      "status": "Statut",
      "amount": "Montant"
    },
    "errors": {
      "loadReports": "Erreur lors du chargement des rapports"
    },
    "tour": {
      "label": "Tutoriel guid\u00e9",
      "step": "\u00c9tape {current} sur {total}",
      "close": "Fermer",
      "previous": "Pr\u00e9c\u00e9dent",
      "next": "Suivant",
      "finish": "Terminer",
      "export": {
        "title": "Exportations financi\u00e8res",
        "highlight": "Exportez les rapports en CSV, Excel ou PDF.",
        "description": "Ces boutons permettent de t\u00e9l\u00e9charger les donn\u00e9es financi\u00e8res pour contr\u00f4le, reddition de comptes ou archivage interne."
      },
      "period": {
        "title": "Filtre par p\u00e9riode",
        "highlight": "Choisissez les dates de d\u00e9but et de fin du rapport.",
        "description": "PHANYX recalcule les indicateurs financiers selon la p\u00e9riode s\u00e9lectionn\u00e9e."
      },
      "campus": {
        "title": "Filtre par campus",
        "highlight": "S\u00e9parez les r\u00e9sultats par unit\u00e9 ou campus.",
        "description": "Lorsque l\u2019\u00e9tablissement poss\u00e8de plusieurs campus, vous pouvez analyser les donn\u00e9es financi\u00e8res de chaque unit\u00e9."
      },
      "summary": {
        "title": "R\u00e9sum\u00e9 financier",
        "highlight": "Consultez les principaux chiffres de la p\u00e9riode.",
        "description": "Cette section pr\u00e9sente les \u00e9critures, les montants pay\u00e9s, en attente, en retard et les \u00e9l\u00e8ves en impay\u00e9."
      },
      "charts": {
        "title": "Graphiques financiers",
        "highlight": "Suivez visuellement l\u2019\u00e9volution financi\u00e8re.",
        "description": "Les graphiques aident \u00e0 comprendre les recettes quotidiennes, les statuts des \u00e9critures et les types de facturation."
      },
      "entries": {
        "title": "\u00c9critures de la p\u00e9riode",
        "highlight": "Consultez chaque \u00e9criture individuellement.",
        "description": "Cette liste affiche l\u2019\u00e9l\u00e8ve, le campus, le type, la description, le montant, le paiement et le statut."
      }
    },
    "pdf": {
      "institutionalReport": "Rapport Financier Institutionnel",
      "period": "P\u00e9riode : {start} au {end}",
      "registrationId": "Identifiant fiscal",
      "phone": "T\u00e9l\u00e9phone",
      "email": "E-mail",
      "responsible": "Responsable",
      "role": "Fonction",
      "location": "Lieu",
      "address": "Adresse",
      "executiveSummary": "R\u00e9sum\u00e9 Ex\u00e9cutif",
      "summaryByType": "R\u00e9sum\u00e9 par Type",
      "entriesForPeriod": "\u00c9critures de la P\u00e9riode",
      "firstEntriesNote": "Remarque : les {count} premi\u00e8res \u00e9critures sont affich\u00e9es dans le PDF.",
      "page": "Page {current} sur {total}",
      "fileSlug": "rapport_financier"
    }
  }
};

for (const locale of locales) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo nao encontrado: ${arquivo}`);
  }

  const backup = `${arquivo}.antes-${namespace}.bak`;

  if (!fs.existsSync(backup)) {
    fs.copyFileSync(arquivo, backup);
    console.log(`Backup criado: ${backup}`);
  } else {
    console.log(`Backup ja existe: ${backup}`);
  }

  const conteudo = fs.readFileSync(arquivo, "utf8");
  const json = JSON.parse(conteudo.replace(/^\uFEFF/, ""));

  json[namespace] = traducoes[locale];

  fs.writeFileSync(
    arquivo,
    JSON.stringify(json, null, 2) + "\n",
    "utf8"
  );

  console.log(`OK traducoes: ${locale}`);
}

console.log(`Namespace ${namespace} instalado nos 5 idiomas.`);
