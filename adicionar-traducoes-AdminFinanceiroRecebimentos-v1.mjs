import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFinanceiroRecebimentos";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
const traducoes = {
  "pt-BR": {
    "title": "Recebimentos",
    "subtitle": "Busque cobran\u00e7as, registre pagamentos e d\u00ea baixa no sistema.",
    "summary": {
      "totalFinal": "Valor lan\u00e7ado/final",
      "paid": "Valor pago",
      "pending": "Saldo pendente",
      "overdue": "Inadimpl\u00eancia",
      "entriesCount": "{count, plural, one {# lan\u00e7amento} other {# lan\u00e7amentos}}"
    },
    "filters": {
      "searchPlaceholder": "Buscar por aluno, matr\u00edcula, descri\u00e7\u00e3o ou status",
      "allStatuses": "Todos os status",
      "allTypes": "Todos os tipos",
      "allCampuses": "Todos os polos"
    },
    "status": {
      "pending": "Pendente",
      "partial": "Parcial",
      "paid": "Pago",
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
    "paymentMethods": {
      "cash": "Dinheiro",
      "pix": "PIX",
      "card": "Cart\u00e3o",
      "bankSlip": "Boleto",
      "transfer": "Transfer\u00eancia",
      "other": "Outro"
    },
    "batch": {
      "title": "Baixa em lote",
      "selected": "Selecionados: {count}",
      "averageValue": "Valor m\u00e9dio calculado por lan\u00e7amento:",
      "processing": "Baixando...",
      "submit": "Dar baixa em lote"
    },
    "fields": {
      "amountPaid": "Valor pago",
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa",
      "note": "Observa\u00e7\u00e3o"
    },
    "errors": {
      "loadReceipts": "Erro ao carregar recebimentos",
      "loadDocuments": "Erro ao carregar documentos financeiros",
      "settle": "Erro ao dar baixa",
      "selectAtLeastOne": "Selecione pelo menos um lan\u00e7amento antes de fazer a baixa em lote.",
      "settleEntry": "Erro ao dar baixa no lan\u00e7amento {id}",
      "batchSettlement": "Erro na baixa em lote"
    },
    "messages": {
      "settlementSuccess": "Baixa registrada com sucesso. O pagamento foi lan\u00e7ado e o saldo do aluno foi atualizado.",
      "batchSuccess": "Baixa em lote realizada com sucesso. Todos os lan\u00e7amentos selecionados foram processados."
    },
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "documents": {
      "successTitle": "Comprovantes financeiros gerados com sucesso",
      "successDescription": "Abra o recibo ou o comprovante gerado automaticamente ap\u00f3s a baixa.",
      "openReceipt": "Abrir recibo",
      "openProof": "Abrir comprovante"
    },
    "table": {
      "student": "Aluno",
      "type": "Tipo",
      "description": "Descri\u00e7\u00e3o",
      "baseValue": "Valor base",
      "finalValue": "Valor final",
      "paid": "Pago",
      "status": "Status",
      "dueDate": "Vencimento",
      "actions": "A\u00e7\u00f5es",
      "loading": "Carregando...",
      "empty": "Nenhum recebimento encontrado.",
      "campus": "Polo"
    },
    "buttons": {
      "settle": "Dar baixa",
      "confirmSettlement": "Confirmar baixa",
      "cancel": "Cancelar"
    },
    "payments": {
      "title": "Pagamentos registrados:"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Pr\u00f3ximo",
      "goToCash": "Ir para caixa",
      "summary": {
        "title": "Resumo dos recebimentos",
        "highlight": "Veja rapidamente os valores lan\u00e7ados, pagos, pendentes e atrasados.",
        "description": "Esses cards mostram a sa\u00fade financeira dos recebimentos da institui\u00e7\u00e3o."
      },
      "filters": {
        "title": "Filtros de busca",
        "highlight": "Encontre cobran\u00e7as por aluno, matr\u00edcula, status ou tipo.",
        "description": "Use os filtros para localizar lan\u00e7amentos espec\u00edficos de forma r\u00e1pida."
      },
      "campuses": {
        "title": "Filtro por polo",
        "highlight": "Separe os recebimentos por unidade, campus ou filial.",
        "description": "Quando a institui\u00e7\u00e3o possui mais de um polo, esse filtro ajuda a organizar a cobran\u00e7a por unidade."
      },
      "batch": {
        "title": "Baixa em lote",
        "highlight": "Registre v\u00e1rios pagamentos de uma s\u00f3 vez.",
        "description": "Selecione os lan\u00e7amentos na tabela e use esta \u00e1rea para dar baixa coletiva."
      },
      "table": {
        "title": "Lista de lan\u00e7amentos",
        "highlight": "Acompanhe cada cobran\u00e7a individualmente.",
        "description": "Aqui aparecem aluno, tipo, valor, status, vencimento e a\u00e7\u00f5es de baixa."
      }
    }
  },
  "pt-PT": {
    "title": "Recebimentos",
    "subtitle": "Pesquise cobran\u00e7as, registe pagamentos e regularize lan\u00e7amentos no sistema.",
    "summary": {
      "totalFinal": "Valor lan\u00e7ado/final",
      "paid": "Valor pago",
      "pending": "Saldo pendente",
      "overdue": "Incumprimento",
      "entriesCount": "{count, plural, one {# lan\u00e7amento} other {# lan\u00e7amentos}}"
    },
    "filters": {
      "searchPlaceholder": "Pesquisar por aluno, matr\u00edcula, descri\u00e7\u00e3o ou estado",
      "allStatuses": "Todos os estados",
      "allTypes": "Todos os tipos",
      "allCampuses": "Todos os polos"
    },
    "status": {
      "pending": "Pendente",
      "partial": "Parcial",
      "paid": "Pago",
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
    "paymentMethods": {
      "cash": "Dinheiro",
      "pix": "PIX",
      "card": "Cart\u00e3o",
      "bankSlip": "Boleto",
      "transfer": "Transfer\u00eancia",
      "other": "Outro"
    },
    "batch": {
      "title": "Regulariza\u00e7\u00e3o em lote",
      "selected": "Selecionados: {count}",
      "averageValue": "Valor m\u00e9dio calculado por lan\u00e7amento:",
      "processing": "A processar...",
      "submit": "Regularizar em lote"
    },
    "fields": {
      "amountPaid": "Valor pago",
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa",
      "note": "Observa\u00e7\u00e3o"
    },
    "errors": {
      "loadReceipts": "Erro ao carregar os recebimentos",
      "loadDocuments": "Erro ao carregar os documentos financeiros",
      "settle": "Erro ao regularizar o lan\u00e7amento",
      "selectAtLeastOne": "Selecione pelo menos um lan\u00e7amento antes de fazer a regulariza\u00e7\u00e3o em lote.",
      "settleEntry": "Erro ao regularizar o lan\u00e7amento {id}",
      "batchSettlement": "Erro na regulariza\u00e7\u00e3o em lote"
    },
    "messages": {
      "settlementSuccess": "Regulariza\u00e7\u00e3o registada com sucesso. O pagamento foi lan\u00e7ado e o saldo do aluno foi atualizado.",
      "batchSuccess": "Regulariza\u00e7\u00e3o em lote conclu\u00edda com sucesso. Todos os lan\u00e7amentos selecionados foram processados."
    },
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "documents": {
      "successTitle": "Comprovativos financeiros gerados com sucesso",
      "successDescription": "Abra o recibo ou o comprovativo gerado automaticamente ap\u00f3s a regulariza\u00e7\u00e3o.",
      "openReceipt": "Abrir recibo",
      "openProof": "Abrir comprovativo"
    },
    "table": {
      "student": "Aluno",
      "type": "Tipo",
      "description": "Descri\u00e7\u00e3o",
      "baseValue": "Valor base",
      "finalValue": "Valor final",
      "paid": "Pago",
      "status": "Estado",
      "dueDate": "Vencimento",
      "actions": "A\u00e7\u00f5es",
      "loading": "A carregar...",
      "empty": "Nenhum recebimento encontrado.",
      "campus": "Polo"
    },
    "buttons": {
      "settle": "Regularizar",
      "confirmSettlement": "Confirmar regulariza\u00e7\u00e3o",
      "cancel": "Cancelar"
    },
    "payments": {
      "title": "Pagamentos registados:"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Seguinte",
      "goToCash": "Ir para caixa",
      "summary": {
        "title": "Resumo dos recebimentos",
        "highlight": "Veja rapidamente os valores lan\u00e7ados, pagos, pendentes e em atraso.",
        "description": "Estes cart\u00f5es mostram a situa\u00e7\u00e3o financeira dos recebimentos da institui\u00e7\u00e3o."
      },
      "filters": {
        "title": "Filtros de pesquisa",
        "highlight": "Encontre cobran\u00e7as por aluno, matr\u00edcula, estado ou tipo.",
        "description": "Utilize os filtros para localizar rapidamente lan\u00e7amentos espec\u00edficos."
      },
      "campuses": {
        "title": "Filtro por polo",
        "highlight": "Separe os recebimentos por unidade, campus ou filial.",
        "description": "Quando a institui\u00e7\u00e3o possui mais de um polo, este filtro ajuda a organizar a cobran\u00e7a por unidade."
      },
      "batch": {
        "title": "Regulariza\u00e7\u00e3o em lote",
        "highlight": "Registe v\u00e1rios pagamentos de uma s\u00f3 vez.",
        "description": "Selecione os lan\u00e7amentos na tabela e utilize esta \u00e1rea para os regularizar em conjunto."
      },
      "table": {
        "title": "Lista de lan\u00e7amentos",
        "highlight": "Acompanhe cada cobran\u00e7a individualmente.",
        "description": "Aqui s\u00e3o apresentados o aluno, tipo, valor, estado, vencimento e a\u00e7\u00f5es de regulariza\u00e7\u00e3o."
      }
    }
  },
  "en-US": {
    "title": "Receivables",
    "subtitle": "Search charges, record payments, and settle financial entries in the system.",
    "summary": {
      "totalFinal": "Amount posted/final",
      "paid": "Amount paid",
      "pending": "Outstanding balance",
      "overdue": "Overdue",
      "entriesCount": "{count, plural, one {# entry} other {# entries}}"
    },
    "filters": {
      "searchPlaceholder": "Search by student, enrollment, description, or status",
      "allStatuses": "All statuses",
      "allTypes": "All types",
      "allCampuses": "All campuses"
    },
    "status": {
      "pending": "Pending",
      "partial": "Partial",
      "paid": "Paid",
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
    "paymentMethods": {
      "cash": "Cash",
      "pix": "PIX",
      "card": "Card",
      "bankSlip": "Bank slip",
      "transfer": "Bank transfer",
      "other": "Other"
    },
    "batch": {
      "title": "Batch settlement",
      "selected": "Selected: {count}",
      "averageValue": "Average calculated amount per entry:",
      "processing": "Processing...",
      "submit": "Settle selected entries"
    },
    "fields": {
      "amountPaid": "Amount paid",
      "discount": "Discount",
      "interest": "Interest",
      "penalty": "Penalty",
      "note": "Note"
    },
    "errors": {
      "loadReceipts": "Error loading receivables",
      "loadDocuments": "Error loading financial documents",
      "settle": "Error settling the entry",
      "selectAtLeastOne": "Select at least one entry before running a batch settlement.",
      "settleEntry": "Error settling entry {id}",
      "batchSettlement": "Error during batch settlement"
    },
    "messages": {
      "settlementSuccess": "Payment recorded successfully. The payment was posted and the student's balance was updated.",
      "batchSuccess": "Batch settlement completed successfully. All selected entries were processed."
    },
    "toast": {
      "errorTitle": "Could not complete the action",
      "successTitle": "All set"
    },
    "documents": {
      "successTitle": "Financial documents generated successfully",
      "successDescription": "Open the receipt or proof of payment generated automatically after settlement.",
      "openReceipt": "Open receipt",
      "openProof": "Open proof of payment"
    },
    "table": {
      "student": "Student",
      "type": "Type",
      "description": "Description",
      "baseValue": "Base amount",
      "finalValue": "Final amount",
      "paid": "Paid",
      "status": "Status",
      "dueDate": "Due date",
      "actions": "Actions",
      "loading": "Loading...",
      "empty": "No receivables found.",
      "campus": "Campus"
    },
    "buttons": {
      "settle": "Settle",
      "confirmSettlement": "Confirm settlement",
      "cancel": "Cancel"
    },
    "payments": {
      "title": "Recorded payments:"
    },
    "tour": {
      "label": "Guided tutorial",
      "step": "Step {current} of {total}",
      "close": "Close",
      "previous": "Previous",
      "next": "Next",
      "goToCash": "Go to cash management",
      "summary": {
        "title": "Receivables summary",
        "highlight": "Quickly review posted, paid, pending, and overdue amounts.",
        "description": "These cards provide an overview of the institution's receivables."
      },
      "filters": {
        "title": "Search filters",
        "highlight": "Find charges by student, enrollment, status, or type.",
        "description": "Use the filters to quickly locate specific financial entries."
      },
      "campuses": {
        "title": "Campus filter",
        "highlight": "Separate receivables by unit, campus, or branch.",
        "description": "When the institution has more than one campus, this filter helps organize charges by unit."
      },
      "batch": {
        "title": "Batch settlement",
        "highlight": "Record multiple payments at once.",
        "description": "Select entries in the table and use this area to settle them together."
      },
      "table": {
        "title": "Financial entry list",
        "highlight": "Track each charge individually.",
        "description": "This list shows student, type, amount, status, due date, and settlement actions."
      }
    }
  },
  "es-ES": {
    "title": "Cobros",
    "subtitle": "Busca cargos, registra pagos y regulariza movimientos financieros en el sistema.",
    "summary": {
      "totalFinal": "Importe registrado/final",
      "paid": "Importe pagado",
      "pending": "Saldo pendiente",
      "overdue": "Vencido",
      "entriesCount": "{count, plural, one {# movimiento} other {# movimientos}}"
    },
    "filters": {
      "searchPlaceholder": "Buscar por alumno, matr\u00edcula, descripci\u00f3n o estado",
      "allStatuses": "Todos los estados",
      "allTypes": "Todos los tipos",
      "allCampuses": "Todos los campus"
    },
    "status": {
      "pending": "Pendiente",
      "partial": "Parcial",
      "paid": "Pagado",
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
    "paymentMethods": {
      "cash": "Efectivo",
      "pix": "PIX",
      "card": "Tarjeta",
      "bankSlip": "Boleto bancario",
      "transfer": "Transferencia",
      "other": "Otro"
    },
    "batch": {
      "title": "Regularizaci\u00f3n por lote",
      "selected": "Seleccionados: {count}",
      "averageValue": "Importe medio calculado por movimiento:",
      "processing": "Procesando...",
      "submit": "Regularizar en lote"
    },
    "fields": {
      "amountPaid": "Importe pagado",
      "discount": "Descuento",
      "interest": "Intereses",
      "penalty": "Recargo",
      "note": "Observaci\u00f3n"
    },
    "errors": {
      "loadReceipts": "Error al cargar los cobros",
      "loadDocuments": "Error al cargar los documentos financieros",
      "settle": "Error al regularizar el movimiento",
      "selectAtLeastOne": "Selecciona al menos un movimiento antes de realizar la regularizaci\u00f3n por lote.",
      "settleEntry": "Error al regularizar el movimiento {id}",
      "batchSettlement": "Error en la regularizaci\u00f3n por lote"
    },
    "messages": {
      "settlementSuccess": "Pago registrado correctamente. El pago fue contabilizado y el saldo del alumno se actualiz\u00f3.",
      "batchSuccess": "Regularizaci\u00f3n por lote completada correctamente. Todos los movimientos seleccionados fueron procesados."
    },
    "toast": {
      "errorTitle": "No se pudo completar la acci\u00f3n",
      "successTitle": "Todo listo"
    },
    "documents": {
      "successTitle": "Documentos financieros generados correctamente",
      "successDescription": "Abre el recibo o el comprobante generado autom\u00e1ticamente despu\u00e9s de la regularizaci\u00f3n.",
      "openReceipt": "Abrir recibo",
      "openProof": "Abrir comprobante"
    },
    "table": {
      "student": "Alumno",
      "type": "Tipo",
      "description": "Descripci\u00f3n",
      "baseValue": "Importe base",
      "finalValue": "Importe final",
      "paid": "Pagado",
      "status": "Estado",
      "dueDate": "Vencimiento",
      "actions": "Acciones",
      "loading": "Cargando...",
      "empty": "No se encontraron cobros.",
      "campus": "Campus"
    },
    "buttons": {
      "settle": "Regularizar",
      "confirmSettlement": "Confirmar regularizaci\u00f3n",
      "cancel": "Cancelar"
    },
    "payments": {
      "title": "Pagos registrados:"
    },
    "tour": {
      "label": "Tutorial guiado",
      "step": "Paso {current} de {total}",
      "close": "Cerrar",
      "previous": "Anterior",
      "next": "Siguiente",
      "goToCash": "Ir a caja",
      "summary": {
        "title": "Resumen de cobros",
        "highlight": "Consulta r\u00e1pidamente los importes registrados, pagados, pendientes y vencidos.",
        "description": "Estas tarjetas muestran la situaci\u00f3n financiera de los cobros de la instituci\u00f3n."
      },
      "filters": {
        "title": "Filtros de b\u00fasqueda",
        "highlight": "Encuentra cargos por alumno, matr\u00edcula, estado o tipo.",
        "description": "Usa los filtros para localizar r\u00e1pidamente movimientos espec\u00edficos."
      },
      "campuses": {
        "title": "Filtro por campus",
        "highlight": "Separa los cobros por unidad, campus o sede.",
        "description": "Cuando la instituci\u00f3n tiene m\u00e1s de un campus, este filtro ayuda a organizar los cargos por unidad."
      },
      "batch": {
        "title": "Regularizaci\u00f3n por lote",
        "highlight": "Registra varios pagos de una sola vez.",
        "description": "Selecciona los movimientos en la tabla y usa esta \u00e1rea para regularizarlos en conjunto."
      },
      "table": {
        "title": "Lista de movimientos",
        "highlight": "Haz seguimiento de cada cargo individualmente.",
        "description": "Aqu\u00ed se muestran alumno, tipo, importe, estado, vencimiento y acciones de regularizaci\u00f3n."
      }
    }
  },
  "fr-FR": {
    "title": "Encaissements",
    "subtitle": "Recherchez les cr\u00e9ances, enregistrez les paiements et r\u00e9gularisez les \u00e9critures financi\u00e8res.",
    "summary": {
      "totalFinal": "Montant enregistr\u00e9/final",
      "paid": "Montant pay\u00e9",
      "pending": "Solde restant",
      "overdue": "Impay\u00e9s",
      "entriesCount": "{count, plural, one {# \u00e9criture} other {# \u00e9critures}}"
    },
    "filters": {
      "searchPlaceholder": "Rechercher par \u00e9l\u00e8ve, matricule, description ou statut",
      "allStatuses": "Tous les statuts",
      "allTypes": "Tous les types",
      "allCampuses": "Tous les campus"
    },
    "status": {
      "pending": "En attente",
      "partial": "Partiel",
      "paid": "Pay\u00e9",
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
    "paymentMethods": {
      "cash": "Esp\u00e8ces",
      "pix": "PIX",
      "card": "Carte",
      "bankSlip": "Bordereau bancaire",
      "transfer": "Virement",
      "other": "Autre"
    },
    "batch": {
      "title": "R\u00e9gularisation par lot",
      "selected": "S\u00e9lectionn\u00e9s : {count}",
      "averageValue": "Montant moyen calcul\u00e9 par \u00e9criture :",
      "processing": "Traitement...",
      "submit": "R\u00e9gulariser la s\u00e9lection"
    },
    "fields": {
      "amountPaid": "Montant pay\u00e9",
      "discount": "Remise",
      "interest": "Int\u00e9r\u00eats",
      "penalty": "P\u00e9nalit\u00e9",
      "note": "Observation"
    },
    "errors": {
      "loadReceipts": "Erreur lors du chargement des encaissements",
      "loadDocuments": "Erreur lors du chargement des documents financiers",
      "settle": "Erreur lors de la r\u00e9gularisation de l\u2019\u00e9criture",
      "selectAtLeastOne": "S\u00e9lectionnez au moins une \u00e9criture avant d\u2019effectuer une r\u00e9gularisation par lot.",
      "settleEntry": "Erreur lors de la r\u00e9gularisation de l\u2019\u00e9criture {id}",
      "batchSettlement": "Erreur lors de la r\u00e9gularisation par lot"
    },
    "messages": {
      "settlementSuccess": "Paiement enregistr\u00e9 avec succ\u00e8s. Le paiement a \u00e9t\u00e9 comptabilis\u00e9 et le solde de l\u2019\u00e9l\u00e8ve a \u00e9t\u00e9 mis \u00e0 jour.",
      "batchSuccess": "R\u00e9gularisation par lot termin\u00e9e avec succ\u00e8s. Toutes les \u00e9critures s\u00e9lectionn\u00e9es ont \u00e9t\u00e9 trait\u00e9es."
    },
    "toast": {
      "errorTitle": "Impossible de terminer l\u2019action",
      "successTitle": "Termin\u00e9"
    },
    "documents": {
      "successTitle": "Documents financiers g\u00e9n\u00e9r\u00e9s avec succ\u00e8s",
      "successDescription": "Ouvrez le re\u00e7u ou le justificatif g\u00e9n\u00e9r\u00e9 automatiquement apr\u00e8s la r\u00e9gularisation.",
      "openReceipt": "Ouvrir le re\u00e7u",
      "openProof": "Ouvrir le justificatif"
    },
    "table": {
      "student": "\u00c9l\u00e8ve",
      "type": "Type",
      "description": "Description",
      "baseValue": "Montant de base",
      "finalValue": "Montant final",
      "paid": "Pay\u00e9",
      "status": "Statut",
      "dueDate": "\u00c9ch\u00e9ance",
      "actions": "Actions",
      "loading": "Chargement...",
      "empty": "Aucun encaissement trouv\u00e9.",
      "campus": "Campus"
    },
    "buttons": {
      "settle": "R\u00e9gulariser",
      "confirmSettlement": "Confirmer la r\u00e9gularisation",
      "cancel": "Annuler"
    },
    "payments": {
      "title": "Paiements enregistr\u00e9s :"
    },
    "tour": {
      "label": "Tutoriel guid\u00e9",
      "step": "\u00c9tape {current} sur {total}",
      "close": "Fermer",
      "previous": "Pr\u00e9c\u00e9dent",
      "next": "Suivant",
      "goToCash": "Aller \u00e0 la caisse",
      "summary": {
        "title": "R\u00e9sum\u00e9 des encaissements",
        "highlight": "Consultez rapidement les montants enregistr\u00e9s, pay\u00e9s, en attente et en retard.",
        "description": "Ces cartes pr\u00e9sentent la situation financi\u00e8re des encaissements de l\u2019\u00e9tablissement."
      },
      "filters": {
        "title": "Filtres de recherche",
        "highlight": "Trouvez des cr\u00e9ances par \u00e9l\u00e8ve, matricule, statut ou type.",
        "description": "Utilisez les filtres pour localiser rapidement des \u00e9critures sp\u00e9cifiques."
      },
      "campuses": {
        "title": "Filtre par campus",
        "highlight": "S\u00e9parez les encaissements par unit\u00e9, campus ou site.",
        "description": "Lorsque l\u2019\u00e9tablissement poss\u00e8de plusieurs campus, ce filtre permet d\u2019organiser les cr\u00e9ances par unit\u00e9."
      },
      "batch": {
        "title": "R\u00e9gularisation par lot",
        "highlight": "Enregistrez plusieurs paiements en une seule fois.",
        "description": "S\u00e9lectionnez les \u00e9critures dans le tableau et utilisez cette zone pour les r\u00e9gulariser ensemble."
      },
      "table": {
        "title": "Liste des \u00e9critures",
        "highlight": "Suivez chaque cr\u00e9ance individuellement.",
        "description": "Cette liste affiche l\u2019\u00e9l\u00e8ve, le type, le montant, le statut, l\u2019\u00e9ch\u00e9ance et les actions de r\u00e9gularisation."
      }
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
