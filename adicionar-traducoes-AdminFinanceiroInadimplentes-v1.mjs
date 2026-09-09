import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFinanceiroInadimplentes";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];

const traducoes = {
  "pt-BR": {
    "title": "Inadimplentes",
    "openTutorial": "Abrir tutorial guiado",
    "subtitle": "Planilha de alunos com cobranças vencidas e ações rápidas de cobrança e baixa.",
    "tour": {
      "guidedTutorial": "Tutorial guiado",
      "stepOf": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Próximo",
      "goToClosing": "Ir para fechamento",
      "steps": {
        "summary": {
          "title": "Resumo da inadimplência",
          "highlight": "Veja rapidamente quantos alunos estão inadimplentes.",
          "description": "Esses indicadores mostram o total de alunos, cobranças vencidas e valores em atraso."
        },
        "search": {
          "title": "Busca rápida",
          "highlight": "Encontre alunos pelo nome, matrícula ou e-mail.",
          "description": "Use a busca para localizar rapidamente uma pendência específica."
        },
        "list": {
          "title": "Lista de inadimplentes",
          "highlight": "Aqui ficam os alunos com pendências financeiras.",
          "description": "Você pode abrir cobranças, copiar mensagens e cobrar via WhatsApp."
        },
        "settlement": {
          "title": "Regularizar cobrança",
          "highlight": "Registre pagamentos manualmente.",
          "description": "Informe valores, juros, descontos e confirme a baixa."
        }
      }
    },
    "summary": {
      "students": "Alunos inadimplentes",
      "overdueCharges": "Cobranças vencidas",
      "overdueTotal": "Total em atraso"
    },
    "search": {
      "placeholder": "Buscar por nome, matrícula ou e-mail"
    },
    "messages": {
      "allSet": "Tudo certo.",
      "copySuccess": "Mensagem de cobrança copiada com sucesso.",
      "copyError": "Não foi possível copiar a mensagem de cobrança.",
      "invalidWhatsappPhone": "Informe um telefone de WhatsApp válido antes de enviar a cobrança.",
      "whatsappSuccess": "Cobrança aberta no WhatsApp com sucesso.",
      "loadError": "Erro ao carregar inadimplentes",
      "paymentError": "Erro ao registrar pagamento",
      "settlementSuccess": "Cobrança regularizada com sucesso."
    },
    "history": {
      "chargeCopied": "Mensagem de cobrança copiada para o lançamento {entryId}.",
      "whatsappOpened": "Cobrança enviada/aberta no WhatsApp para o telefone {phone}.",
      "manualPaymentDefault": "Pagamento registrado pela tela de inadimplentes."
    },
    "chargeMessage": {
      "greeting": "Olá, {student}. Identificamos uma pendência financeira em seu cadastro na instituição.",
      "charge": "Cobrança",
      "dueDate": "Vencimento",
      "outstandingAmount": "Valor em aberto",
      "regularize": "Pedimos, por gentileza, que regularize a situação junto ao setor financeiro. Após a baixa do pagamento no sistema, seu acesso poderá ser normalizado.",
      "contact": "Em caso de dúvida, entre em contato com a instituição."
    },
    "entryTypes": {
      "enrollment": "Matrícula",
      "tuition": "Mensalidade",
      "fee": "Taxa",
      "discount": "Desconto",
      "other": "Outro"
    },
    "studentStatus": {
      "active": "Ativo",
      "inactive": "Inativo",
      "onLeave": "Trancado",
      "cancelled": "Cancelado",
      "completed": "Concluído",
      "pending": "Pendente"
    },
    "table": {
      "student": "Aluno",
      "enrollment": "Matrícula",
      "email": "E-mail",
      "overdueCharges": "Cobranças vencidas",
      "overdueTotal": "Total em atraso",
      "collection": "Cobrança",
      "actions": "Ações"
    },
    "loading": "Carregando...",
    "empty": "Nenhum aluno inadimplente encontrado.",
    "buttons": {
      "copyCharge": "Copiar cobrança",
      "close": "Fechar",
      "openCharges": "Abrir cobranças",
      "copyMessage": "Copiar mensagem",
      "chargeWhatsapp": "Cobrar no WhatsApp",
      "recording": "Registrando...",
      "recordPayment": "Registrar pagamento",
      "cancel": "Cancelar",
      "openWhatsapp": "Abrir WhatsApp"
    },
    "details": {
      "type": "Tipo",
      "description": "Descrição",
      "dueDate": "Vencimento",
      "finalAmount": "Valor final",
      "outstandingBalance": "Saldo em aberto",
      "action": "Ação"
    },
    "adjustments": {
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa"
    },
    "form": {
      "amountPaid": "Valor pago",
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa",
      "note": "Observação"
    },
    "paymentMethods": {
      "cash": "Dinheiro",
      "card": "Cartão",
      "invoice": "Boleto",
      "transfer": "Transferência",
      "other": "Outro"
    },
    "whatsapp": {
      "kicker": "PHANYX Financeiro",
      "title": "Enviar cobrança por WhatsApp",
      "description": "Informe o telefone com DDD. O PHANYX abrirá o WhatsApp com a mensagem de cobrança já pronta.",
      "phonePlaceholder": "Ex.: 5548999999999"
    }
  },
  "pt-PT": {
    "title": "Alunos em incumprimento",
    "openTutorial": "Abrir tutorial guiado",
    "subtitle": "Lista de alunos com cobranças vencidas e ações rápidas de cobrança e regularização.",
    "tour": {
      "guidedTutorial": "Tutorial guiado",
      "stepOf": "Etapa {current} de {total}",
      "close": "Fechar",
      "previous": "Anterior",
      "next": "Seguinte",
      "goToClosing": "Ir para o fecho",
      "steps": {
        "summary": {
          "title": "Resumo do incumprimento",
          "highlight": "Veja rapidamente quantos alunos estão em incumprimento.",
          "description": "Estes indicadores mostram o total de alunos, cobranças vencidas e valores em atraso."
        },
        "search": {
          "title": "Pesquisa rápida",
          "highlight": "Encontre alunos pelo nome, matrícula ou e-mail.",
          "description": "Utilize a pesquisa para localizar rapidamente uma pendência específica."
        },
        "list": {
          "title": "Lista de alunos em incumprimento",
          "highlight": "Aqui estão os alunos com pendências financeiras.",
          "description": "Pode abrir cobranças, copiar mensagens e efetuar cobranças via WhatsApp."
        },
        "settlement": {
          "title": "Regularizar cobrança",
          "highlight": "Registe pagamentos manualmente.",
          "description": "Indique valores, juros, descontos e confirme a regularização."
        }
      }
    },
    "summary": {
      "students": "Alunos em incumprimento",
      "overdueCharges": "Cobranças vencidas",
      "overdueTotal": "Total em atraso"
    },
    "search": {
      "placeholder": "Pesquisar por nome, matrícula ou e-mail"
    },
    "messages": {
      "allSet": "Tudo certo.",
      "copySuccess": "Mensagem de cobrança copiada com sucesso.",
      "copyError": "Não foi possível copiar a mensagem de cobrança.",
      "invalidWhatsappPhone": "Indique um número de WhatsApp válido antes de enviar a cobrança.",
      "whatsappSuccess": "Cobrança aberta no WhatsApp com sucesso.",
      "loadError": "Erro ao carregar os alunos em incumprimento",
      "paymentError": "Erro ao registar o pagamento",
      "settlementSuccess": "Cobrança regularizada com sucesso."
    },
    "history": {
      "chargeCopied": "Mensagem de cobrança copiada para o lançamento {entryId}.",
      "whatsappOpened": "Cobrança enviada/aberta no WhatsApp para o telefone {phone}.",
      "manualPaymentDefault": "Pagamento registado no ecrã de alunos em incumprimento."
    },
    "chargeMessage": {
      "greeting": "Olá, {student}. Identificámos uma pendência financeira no seu registo na instituição.",
      "charge": "Cobrança",
      "dueDate": "Vencimento",
      "outstandingAmount": "Valor em aberto",
      "regularize": "Solicitamos, por favor, que regularize a situação junto do setor financeiro. Após o registo do pagamento no sistema, o seu acesso poderá ser normalizado.",
      "contact": "Em caso de dúvida, contacte a instituição."
    },
    "entryTypes": {
      "enrollment": "Matrícula",
      "tuition": "Propina",
      "fee": "Taxa",
      "discount": "Desconto",
      "other": "Outro"
    },
    "studentStatus": {
      "active": "Ativo",
      "inactive": "Inativo",
      "onLeave": "Matrícula suspensa",
      "cancelled": "Cancelado",
      "completed": "Concluído",
      "pending": "Pendente"
    },
    "table": {
      "student": "Aluno",
      "enrollment": "Matrícula",
      "email": "E-mail",
      "overdueCharges": "Cobranças vencidas",
      "overdueTotal": "Total em atraso",
      "collection": "Cobrança",
      "actions": "Ações"
    },
    "loading": "A carregar...",
    "empty": "Nenhum aluno em incumprimento encontrado.",
    "buttons": {
      "copyCharge": "Copiar cobrança",
      "close": "Fechar",
      "openCharges": "Abrir cobranças",
      "copyMessage": "Copiar mensagem",
      "chargeWhatsapp": "Cobrar no WhatsApp",
      "recording": "A registar...",
      "recordPayment": "Registar pagamento",
      "cancel": "Cancelar",
      "openWhatsapp": "Abrir WhatsApp"
    },
    "details": {
      "type": "Tipo",
      "description": "Descrição",
      "dueDate": "Vencimento",
      "finalAmount": "Valor final",
      "outstandingBalance": "Saldo em aberto",
      "action": "Ação"
    },
    "adjustments": {
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa"
    },
    "form": {
      "amountPaid": "Valor pago",
      "discount": "Desconto",
      "interest": "Juros",
      "penalty": "Multa",
      "note": "Observação"
    },
    "paymentMethods": {
      "cash": "Dinheiro",
      "card": "Cartão",
      "invoice": "Referência/Boleto",
      "transfer": "Transferência",
      "other": "Outro"
    },
    "whatsapp": {
      "kicker": "PHANYX Financeiro",
      "title": "Enviar cobrança por WhatsApp",
      "description": "Indique o número de telefone com indicativo. O PHANYX abrirá o WhatsApp com a mensagem de cobrança preparada.",
      "phonePlaceholder": "Ex.: 351912345678"
    }
  },
  "en-US": {
    "title": "Students in Arrears",
    "openTutorial": "Open guided tutorial",
    "subtitle": "Student list with overdue charges and quick collection and payment actions.",
    "tour": {
      "guidedTutorial": "Guided tutorial",
      "stepOf": "Step {current} of {total}",
      "close": "Close",
      "previous": "Previous",
      "next": "Next",
      "goToClosing": "Go to closing",
      "steps": {
        "summary": {
          "title": "Arrears summary",
          "highlight": "Quickly see how many students have overdue balances.",
          "description": "These indicators show the total number of students, overdue charges, and outstanding amounts."
        },
        "search": {
          "title": "Quick search",
          "highlight": "Find students by name, enrollment number, or email.",
          "description": "Use search to quickly locate a specific outstanding balance."
        },
        "list": {
          "title": "Students in arrears",
          "highlight": "Students with outstanding financial obligations appear here.",
          "description": "You can open charges, copy collection messages, and contact students through WhatsApp."
        },
        "settlement": {
          "title": "Settle a charge",
          "highlight": "Record payments manually.",
          "description": "Enter amounts, interest, discounts, and confirm the payment."
        }
      }
    },
    "summary": {
      "students": "Students in arrears",
      "overdueCharges": "Overdue charges",
      "overdueTotal": "Total overdue"
    },
    "search": {
      "placeholder": "Search by name, enrollment number, or email"
    },
    "messages": {
      "allSet": "All set.",
      "copySuccess": "Collection message copied successfully.",
      "copyError": "The collection message could not be copied.",
      "invalidWhatsappPhone": "Enter a valid WhatsApp phone number before sending the collection message.",
      "whatsappSuccess": "The collection message was opened in WhatsApp successfully.",
      "loadError": "Error loading students in arrears",
      "paymentError": "Error recording payment",
      "settlementSuccess": "Charge settled successfully."
    },
    "history": {
      "chargeCopied": "Collection message copied for financial entry {entryId}.",
      "whatsappOpened": "Collection message sent/opened in WhatsApp for phone number {phone}.",
      "manualPaymentDefault": "Payment recorded from the students-in-arrears page."
    },
    "chargeMessage": {
      "greeting": "Hello, {student}. We identified an outstanding financial balance on your account with the institution.",
      "charge": "Charge",
      "dueDate": "Due date",
      "outstandingAmount": "Outstanding amount",
      "regularize": "Please contact the finance department to settle the outstanding balance. Once the payment is recorded in the system, your access may be restored.",
      "contact": "If you have any questions, please contact the institution."
    },
    "entryTypes": {
      "enrollment": "Enrollment",
      "tuition": "Tuition",
      "fee": "Fee",
      "discount": "Discount",
      "other": "Other"
    },
    "studentStatus": {
      "active": "Active",
      "inactive": "Inactive",
      "onLeave": "On leave",
      "cancelled": "Cancelled",
      "completed": "Completed",
      "pending": "Pending"
    },
    "table": {
      "student": "Student",
      "enrollment": "Enrollment",
      "email": "Email",
      "overdueCharges": "Overdue charges",
      "overdueTotal": "Total overdue",
      "collection": "Collection",
      "actions": "Actions"
    },
    "loading": "Loading...",
    "empty": "No students in arrears found.",
    "buttons": {
      "copyCharge": "Copy collection message",
      "close": "Close",
      "openCharges": "Open charges",
      "copyMessage": "Copy message",
      "chargeWhatsapp": "Contact via WhatsApp",
      "recording": "Recording...",
      "recordPayment": "Record payment",
      "cancel": "Cancel",
      "openWhatsapp": "Open WhatsApp"
    },
    "details": {
      "type": "Type",
      "description": "Description",
      "dueDate": "Due date",
      "finalAmount": "Final amount",
      "outstandingBalance": "Outstanding balance",
      "action": "Action"
    },
    "adjustments": {
      "discount": "Discount",
      "interest": "Interest",
      "penalty": "Late fee"
    },
    "form": {
      "amountPaid": "Amount paid",
      "discount": "Discount",
      "interest": "Interest",
      "penalty": "Late fee",
      "note": "Note"
    },
    "paymentMethods": {
      "cash": "Cash",
      "card": "Card",
      "invoice": "Invoice/Bank slip",
      "transfer": "Bank transfer",
      "other": "Other"
    },
    "whatsapp": {
      "kicker": "PHANYX Finance",
      "title": "Send collection message via WhatsApp",
      "description": "Enter the phone number with country/area code. PHANYX will open WhatsApp with the collection message ready to send.",
      "phonePlaceholder": "Example: 15551234567"
    }
  },
  "es-ES": {
    "title": "Alumnos morosos",
    "openTutorial": "Abrir tutorial guiado",
    "subtitle": "Lista de alumnos con cobros vencidos y acciones rápidas de cobro y regularización.",
    "tour": {
      "guidedTutorial": "Tutorial guiado",
      "stepOf": "Paso {current} de {total}",
      "close": "Cerrar",
      "previous": "Anterior",
      "next": "Siguiente",
      "goToClosing": "Ir al cierre",
      "steps": {
        "summary": {
          "title": "Resumen de morosidad",
          "highlight": "Consulta rápidamente cuántos alumnos tienen pagos atrasados.",
          "description": "Estos indicadores muestran el total de alumnos, cobros vencidos e importes pendientes."
        },
        "search": {
          "title": "Búsqueda rápida",
          "highlight": "Encuentra alumnos por nombre, matrícula o correo electrónico.",
          "description": "Utiliza la búsqueda para localizar rápidamente una deuda específica."
        },
        "list": {
          "title": "Lista de alumnos morosos",
          "highlight": "Aquí aparecen los alumnos con obligaciones financieras pendientes.",
          "description": "Puedes abrir cobros, copiar mensajes y contactar por WhatsApp."
        },
        "settlement": {
          "title": "Regularizar cobro",
          "highlight": "Registra pagos manualmente.",
          "description": "Indica importes, intereses, descuentos y confirma el pago."
        }
      }
    },
    "summary": {
      "students": "Alumnos morosos",
      "overdueCharges": "Cobros vencidos",
      "overdueTotal": "Total vencido"
    },
    "search": {
      "placeholder": "Buscar por nombre, matrícula o correo electrónico"
    },
    "messages": {
      "allSet": "Todo correcto.",
      "copySuccess": "Mensaje de cobro copiado correctamente.",
      "copyError": "No se pudo copiar el mensaje de cobro.",
      "invalidWhatsappPhone": "Introduce un número de WhatsApp válido antes de enviar el cobro.",
      "whatsappSuccess": "El cobro se abrió correctamente en WhatsApp.",
      "loadError": "Error al cargar los alumnos morosos",
      "paymentError": "Error al registrar el pago",
      "settlementSuccess": "Cobro regularizado correctamente."
    },
    "history": {
      "chargeCopied": "Mensaje de cobro copiado para el movimiento {entryId}.",
      "whatsappOpened": "Cobro enviado/abierto en WhatsApp para el teléfono {phone}.",
      "manualPaymentDefault": "Pago registrado desde la pantalla de alumnos morosos."
    },
    "chargeMessage": {
      "greeting": "Hola, {student}. Hemos identificado una deuda pendiente en tu registro con la institución.",
      "charge": "Cobro",
      "dueDate": "Vencimiento",
      "outstandingAmount": "Importe pendiente",
      "regularize": "Te pedimos que regularices la situación con el área financiera. Una vez registrado el pago en el sistema, tu acceso podrá normalizarse.",
      "contact": "Si tienes alguna duda, ponte en contacto con la institución."
    },
    "entryTypes": {
      "enrollment": "Matrícula",
      "tuition": "Mensualidad",
      "fee": "Tasa",
      "discount": "Descuento",
      "other": "Otro"
    },
    "studentStatus": {
      "active": "Activo",
      "inactive": "Inactivo",
      "onLeave": "Matrícula suspendida",
      "cancelled": "Cancelado",
      "completed": "Finalizado",
      "pending": "Pendiente"
    },
    "table": {
      "student": "Alumno",
      "enrollment": "Matrícula",
      "email": "Correo electrónico",
      "overdueCharges": "Cobros vencidos",
      "overdueTotal": "Total vencido",
      "collection": "Cobro",
      "actions": "Acciones"
    },
    "loading": "Cargando...",
    "empty": "No se encontraron alumnos morosos.",
    "buttons": {
      "copyCharge": "Copiar cobro",
      "close": "Cerrar",
      "openCharges": "Abrir cobros",
      "copyMessage": "Copiar mensaje",
      "chargeWhatsapp": "Cobrar por WhatsApp",
      "recording": "Registrando...",
      "recordPayment": "Registrar pago",
      "cancel": "Cancelar",
      "openWhatsapp": "Abrir WhatsApp"
    },
    "details": {
      "type": "Tipo",
      "description": "Descripción",
      "dueDate": "Vencimiento",
      "finalAmount": "Importe final",
      "outstandingBalance": "Saldo pendiente",
      "action": "Acción"
    },
    "adjustments": {
      "discount": "Descuento",
      "interest": "Intereses",
      "penalty": "Recargo"
    },
    "form": {
      "amountPaid": "Importe pagado",
      "discount": "Descuento",
      "interest": "Intereses",
      "penalty": "Recargo",
      "note": "Observación"
    },
    "paymentMethods": {
      "cash": "Efectivo",
      "card": "Tarjeta",
      "invoice": "Recibo/Boleto",
      "transfer": "Transferencia",
      "other": "Otro"
    },
    "whatsapp": {
      "kicker": "PHANYX Finanzas",
      "title": "Enviar cobro por WhatsApp",
      "description": "Introduce el teléfono con prefijo de país y área. PHANYX abrirá WhatsApp con el mensaje de cobro preparado.",
      "phonePlaceholder": "Ej.: 34600123456"
    }
  },
  "fr-FR": {
    "title": "Élèves en impayé",
    "openTutorial": "Ouvrir le tutoriel guidé",
    "subtitle": "Liste des élèves avec des échéances impayées et des actions rapides de relance et de régularisation.",
    "tour": {
      "guidedTutorial": "Tutoriel guidé",
      "stepOf": "Étape {current} sur {total}",
      "close": "Fermer",
      "previous": "Précédent",
      "next": "Suivant",
      "goToClosing": "Aller à la clôture",
      "steps": {
        "summary": {
          "title": "Résumé des impayés",
          "highlight": "Voyez rapidement combien d’élèves ont des paiements en retard.",
          "description": "Ces indicateurs présentent le nombre d’élèves, les échéances impayées et les montants en retard."
        },
        "search": {
          "title": "Recherche rapide",
          "highlight": "Recherchez un élève par nom, matricule ou e-mail.",
          "description": "Utilisez la recherche pour retrouver rapidement un impayé précis."
        },
        "list": {
          "title": "Liste des élèves en impayé",
          "highlight": "Les élèves ayant des obligations financières en attente apparaissent ici.",
          "description": "Vous pouvez ouvrir les échéances, copier les messages et effectuer une relance via WhatsApp."
        },
        "settlement": {
          "title": "Régulariser une échéance",
          "highlight": "Enregistrez les paiements manuellement.",
          "description": "Saisissez les montants, intérêts, remises et confirmez le règlement."
        }
      }
    },
    "summary": {
      "students": "Élèves en impayé",
      "overdueCharges": "Échéances impayées",
      "overdueTotal": "Total en retard"
    },
    "search": {
      "placeholder": "Rechercher par nom, matricule ou e-mail"
    },
    "messages": {
      "allSet": "Tout est en ordre.",
      "copySuccess": "Message de relance copié avec succès.",
      "copyError": "Impossible de copier le message de relance.",
      "invalidWhatsappPhone": "Saisissez un numéro WhatsApp valide avant d’envoyer la relance.",
      "whatsappSuccess": "La relance a été ouverte dans WhatsApp avec succès.",
      "loadError": "Erreur lors du chargement des élèves en impayé",
      "paymentError": "Erreur lors de l’enregistrement du paiement",
      "settlementSuccess": "Échéance régularisée avec succès."
    },
    "history": {
      "chargeCopied": "Message de relance copié pour l’écriture {entryId}.",
      "whatsappOpened": "Relance envoyée/ouverte dans WhatsApp pour le numéro {phone}.",
      "manualPaymentDefault": "Paiement enregistré depuis la page des élèves en impayé."
    },
    "chargeMessage": {
      "greeting": "Bonjour, {student}. Nous avons identifié un solde financier impayé dans votre dossier auprès de l’établissement.",
      "charge": "Échéance",
      "dueDate": "Date d’échéance",
      "outstandingAmount": "Montant restant dû",
      "regularize": "Nous vous invitons à régulariser la situation auprès du service financier. Une fois le paiement enregistré dans le système, votre accès pourra être rétabli.",
      "contact": "Pour toute question, veuillez contacter l’établissement."
    },
    "entryTypes": {
      "enrollment": "Inscription",
      "tuition": "Frais de scolarité",
      "fee": "Frais",
      "discount": "Remise",
      "other": "Autre"
    },
    "studentStatus": {
      "active": "Actif",
      "inactive": "Inactif",
      "onLeave": "Inscription suspendue",
      "cancelled": "Annulé",
      "completed": "Terminé",
      "pending": "En attente"
    },
    "table": {
      "student": "Élève",
      "enrollment": "Matricule",
      "email": "E-mail",
      "overdueCharges": "Échéances impayées",
      "overdueTotal": "Total en retard",
      "collection": "Relance",
      "actions": "Actions"
    },
    "loading": "Chargement...",
    "empty": "Aucun élève en impayé trouvé.",
    "buttons": {
      "copyCharge": "Copier la relance",
      "close": "Fermer",
      "openCharges": "Ouvrir les échéances",
      "copyMessage": "Copier le message",
      "chargeWhatsapp": "Relancer via WhatsApp",
      "recording": "Enregistrement...",
      "recordPayment": "Enregistrer le paiement",
      "cancel": "Annuler",
      "openWhatsapp": "Ouvrir WhatsApp"
    },
    "details": {
      "type": "Type",
      "description": "Description",
      "dueDate": "Échéance",
      "finalAmount": "Montant final",
      "outstandingBalance": "Solde restant",
      "action": "Action"
    },
    "adjustments": {
      "discount": "Remise",
      "interest": "Intérêts",
      "penalty": "Pénalité"
    },
    "form": {
      "amountPaid": "Montant payé",
      "discount": "Remise",
      "interest": "Intérêts",
      "penalty": "Pénalité",
      "note": "Observation"
    },
    "paymentMethods": {
      "cash": "Espèces",
      "card": "Carte",
      "invoice": "Facture/Bordereau",
      "transfer": "Virement",
      "other": "Autre"
    },
    "whatsapp": {
      "kicker": "PHANYX Finance",
      "title": "Envoyer une relance via WhatsApp",
      "description": "Saisissez le numéro avec l’indicatif du pays et de la zone. PHANYX ouvrira WhatsApp avec le message de relance prêt à être envoyé.",
      "phonePlaceholder": "Ex. : 33612345678"
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
