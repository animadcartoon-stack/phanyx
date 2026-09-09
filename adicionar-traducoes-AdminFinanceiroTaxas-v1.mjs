import fs from "node:fs";
import path from "node:path";

const namespace = "AdminFinanceiroTaxas";
const locales = ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"];
const traducoes = {
  "pt-BR": {
    "title": "Taxas Avulsas",
    "subtitle": "Cadastre taxas e gere cobran\u00e7as reais para alunos.",
    "form": {
      "titleCreate": "Cadastro de taxa avulsa",
      "titleEdit": "Editar taxa avulsa"
    },
    "fields": {
      "name": "Nome da taxa",
      "category": "Categoria",
      "value": "Valor",
      "active": "Ativa",
      "requiresDueDate": "Exige vencimento",
      "description": "Descri\u00e7\u00e3o",
      "note": "Observa\u00e7\u00e3o"
    },
    "placeholders": {
      "name": "Ex.: Matr\u00edcula",
      "searchStudent": "Digite nome, matr\u00edcula ou e-mail"
    },
    "categories": {
      "enrollment": "Matr\u00edcula",
      "withdrawal": "Trancamento",
      "makeupExam": "Segunda chamada",
      "declaration": "Declara\u00e7\u00e3o",
      "transcript": "Hist\u00f3rico",
      "extraClass": "Aula extra",
      "custom": "Personalizada"
    },
    "buttons": {
      "saving": "Salvando...",
      "createFee": "Cadastrar taxa",
      "saveChanges": "Salvar edi\u00e7\u00e3o",
      "cancelEditing": "Cancelar edi\u00e7\u00e3o",
      "generating": "Gerando...",
      "generateCharge": "Gerar lan\u00e7amento",
      "edit": "Editar",
      "delete": "Excluir"
    },
    "charge": {
      "title": "Gerar cobran\u00e7a para aluno",
      "subtitle": "Transforme uma taxa cadastrada em lan\u00e7amento financeiro real.",
      "searchStudent": "Buscar aluno",
      "selectStudent": "Selecionar aluno",
      "selectStudentOption": "Selecione um aluno",
      "searchingStudents": "Buscando alunos...",
      "registeredFee": "Taxa cadastrada",
      "selectFee": "Selecione uma taxa",
      "dueDate": "Vencimento"
    },
    "list": {
      "title": "Taxas cadastradas",
      "loading": "Carregando taxas...",
      "empty": "Nenhuma taxa cadastrada."
    },
    "table": {
      "name": "Nome",
      "category": "Categoria",
      "value": "Valor",
      "active": "Ativa",
      "dueDate": "Vencimento",
      "actions": "A\u00e7\u00f5es"
    },
    "common": {
      "yes": "Sim",
      "no": "N\u00e3o"
    },
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "errors": {
      "loadFees": "Erro ao carregar taxas",
      "searchStudents": "Erro ao buscar alunos",
      "saveFee": "Erro ao salvar taxa",
      "generateCharge": "Erro ao gerar lan\u00e7amento",
      "deleteFee": "Erro ao excluir taxa"
    },
    "messages": {
      "created": "Taxa criada com sucesso.",
      "updated": "Taxa atualizada com sucesso.",
      "chargeGenerated": "Lan\u00e7amento financeiro gerado com sucesso.",
      "deleted": "Taxa exclu\u00edda com sucesso. O cadastro foi removido do sistema."
    },
    "confirm": {
      "title": "Excluir taxa",
      "message": "Deseja realmente excluir esta taxa? Essa a\u00e7\u00e3o n\u00e3o poder\u00e1 ser desfeita.",
      "confirm": "Excluir taxa",
      "cancel": "Cancelar"
    }
  },
  "pt-PT": {
    "title": "Taxas Avulsas",
    "subtitle": "Registe taxas e gere cobran\u00e7as reais para os alunos.",
    "form": {
      "titleCreate": "Registo de taxa avulsa",
      "titleEdit": "Editar taxa avulsa"
    },
    "fields": {
      "name": "Nome da taxa",
      "category": "Categoria",
      "value": "Valor",
      "active": "Ativa",
      "requiresDueDate": "Exige vencimento",
      "description": "Descri\u00e7\u00e3o",
      "note": "Observa\u00e7\u00e3o"
    },
    "placeholders": {
      "name": "Ex.: Matr\u00edcula",
      "searchStudent": "Introduza nome, matr\u00edcula ou e-mail"
    },
    "categories": {
      "enrollment": "Matr\u00edcula",
      "withdrawal": "Suspens\u00e3o da matr\u00edcula",
      "makeupExam": "Segunda chamada",
      "declaration": "Declara\u00e7\u00e3o",
      "transcript": "Hist\u00f3rico",
      "extraClass": "Aula extra",
      "custom": "Personalizada"
    },
    "buttons": {
      "saving": "A guardar...",
      "createFee": "Registar taxa",
      "saveChanges": "Guardar edi\u00e7\u00e3o",
      "cancelEditing": "Cancelar edi\u00e7\u00e3o",
      "generating": "A gerar...",
      "generateCharge": "Gerar lan\u00e7amento",
      "edit": "Editar",
      "delete": "Eliminar"
    },
    "charge": {
      "title": "Gerar cobran\u00e7a para aluno",
      "subtitle": "Transforme uma taxa registada num lan\u00e7amento financeiro real.",
      "searchStudent": "Pesquisar aluno",
      "selectStudent": "Selecionar aluno",
      "selectStudentOption": "Selecione um aluno",
      "searchingStudents": "A pesquisar alunos...",
      "registeredFee": "Taxa registada",
      "selectFee": "Selecione uma taxa",
      "dueDate": "Vencimento"
    },
    "list": {
      "title": "Taxas registadas",
      "loading": "A carregar taxas...",
      "empty": "Nenhuma taxa registada."
    },
    "table": {
      "name": "Nome",
      "category": "Categoria",
      "value": "Valor",
      "active": "Ativa",
      "dueDate": "Vencimento",
      "actions": "A\u00e7\u00f5es"
    },
    "common": {
      "yes": "Sim",
      "no": "N\u00e3o"
    },
    "toast": {
      "errorTitle": "N\u00e3o foi poss\u00edvel concluir",
      "successTitle": "Tudo certo"
    },
    "errors": {
      "loadFees": "Erro ao carregar as taxas",
      "searchStudents": "Erro ao pesquisar alunos",
      "saveFee": "Erro ao guardar a taxa",
      "generateCharge": "Erro ao gerar o lan\u00e7amento",
      "deleteFee": "Erro ao eliminar a taxa"
    },
    "messages": {
      "created": "Taxa criada com sucesso.",
      "updated": "Taxa atualizada com sucesso.",
      "chargeGenerated": "Lan\u00e7amento financeiro gerado com sucesso.",
      "deleted": "Taxa eliminada com sucesso. O registo foi removido do sistema."
    },
    "confirm": {
      "title": "Eliminar taxa",
      "message": "Pretende realmente eliminar esta taxa? Esta a\u00e7\u00e3o n\u00e3o poder\u00e1 ser anulada.",
      "confirm": "Eliminar taxa",
      "cancel": "Cancelar"
    }
  },
  "en-US": {
    "title": "One-time Fees",
    "subtitle": "Create fees and generate real charges for students.",
    "form": {
      "titleCreate": "Create one-time fee",
      "titleEdit": "Edit one-time fee"
    },
    "fields": {
      "name": "Fee name",
      "category": "Category",
      "value": "Amount",
      "active": "Active",
      "requiresDueDate": "Requires due date",
      "description": "Description",
      "note": "Note"
    },
    "placeholders": {
      "name": "Example: Enrollment",
      "searchStudent": "Enter name, enrollment number, or email"
    },
    "categories": {
      "enrollment": "Enrollment",
      "withdrawal": "Withdrawal",
      "makeupExam": "Make-up exam",
      "declaration": "Declaration",
      "transcript": "Transcript",
      "extraClass": "Extra class",
      "custom": "Custom"
    },
    "buttons": {
      "saving": "Saving...",
      "createFee": "Create fee",
      "saveChanges": "Save changes",
      "cancelEditing": "Cancel editing",
      "generating": "Generating...",
      "generateCharge": "Generate charge",
      "edit": "Edit",
      "delete": "Delete"
    },
    "charge": {
      "title": "Generate charge for student",
      "subtitle": "Turn a registered fee into a real financial entry.",
      "searchStudent": "Search student",
      "selectStudent": "Select student",
      "selectStudentOption": "Select a student",
      "searchingStudents": "Searching students...",
      "registeredFee": "Registered fee",
      "selectFee": "Select a fee",
      "dueDate": "Due date"
    },
    "list": {
      "title": "Registered fees",
      "loading": "Loading fees...",
      "empty": "No fees registered."
    },
    "table": {
      "name": "Name",
      "category": "Category",
      "value": "Amount",
      "active": "Active",
      "dueDate": "Due date",
      "actions": "Actions"
    },
    "common": {
      "yes": "Yes",
      "no": "No"
    },
    "toast": {
      "errorTitle": "Could not complete the action",
      "successTitle": "All set"
    },
    "errors": {
      "loadFees": "Error loading fees",
      "searchStudents": "Error searching students",
      "saveFee": "Error saving fee",
      "generateCharge": "Error generating charge",
      "deleteFee": "Error deleting fee"
    },
    "messages": {
      "created": "Fee created successfully.",
      "updated": "Fee updated successfully.",
      "chargeGenerated": "Financial entry generated successfully.",
      "deleted": "Fee deleted successfully. The record was removed from the system."
    },
    "confirm": {
      "title": "Delete fee",
      "message": "Do you really want to delete this fee? This action cannot be undone.",
      "confirm": "Delete fee",
      "cancel": "Cancel"
    }
  },
  "es-ES": {
    "title": "Tasas Adicionales",
    "subtitle": "Registra tasas y genera cobros reales para los alumnos.",
    "form": {
      "titleCreate": "Registro de tasa adicional",
      "titleEdit": "Editar tasa adicional"
    },
    "fields": {
      "name": "Nombre de la tasa",
      "category": "Categor\u00eda",
      "value": "Importe",
      "active": "Activa",
      "requiresDueDate": "Requiere vencimiento",
      "description": "Descripci\u00f3n",
      "note": "Observaci\u00f3n"
    },
    "placeholders": {
      "name": "Ej.: Matr\u00edcula",
      "searchStudent": "Escribe nombre, matr\u00edcula o correo electr\u00f3nico"
    },
    "categories": {
      "enrollment": "Matr\u00edcula",
      "withdrawal": "Baja temporal",
      "makeupExam": "Segunda convocatoria",
      "declaration": "Declaraci\u00f3n",
      "transcript": "Expediente acad\u00e9mico",
      "extraClass": "Clase extra",
      "custom": "Personalizada"
    },
    "buttons": {
      "saving": "Guardando...",
      "createFee": "Registrar tasa",
      "saveChanges": "Guardar cambios",
      "cancelEditing": "Cancelar edici\u00f3n",
      "generating": "Generando...",
      "generateCharge": "Generar cobro",
      "edit": "Editar",
      "delete": "Eliminar"
    },
    "charge": {
      "title": "Generar cobro para alumno",
      "subtitle": "Convierte una tasa registrada en un movimiento financiero real.",
      "searchStudent": "Buscar alumno",
      "selectStudent": "Seleccionar alumno",
      "selectStudentOption": "Selecciona un alumno",
      "searchingStudents": "Buscando alumnos...",
      "registeredFee": "Tasa registrada",
      "selectFee": "Selecciona una tasa",
      "dueDate": "Vencimiento"
    },
    "list": {
      "title": "Tasas registradas",
      "loading": "Cargando tasas...",
      "empty": "No hay tasas registradas."
    },
    "table": {
      "name": "Nombre",
      "category": "Categor\u00eda",
      "value": "Importe",
      "active": "Activa",
      "dueDate": "Vencimiento",
      "actions": "Acciones"
    },
    "common": {
      "yes": "S\u00ed",
      "no": "No"
    },
    "toast": {
      "errorTitle": "No se pudo completar la acci\u00f3n",
      "successTitle": "Todo listo"
    },
    "errors": {
      "loadFees": "Error al cargar las tasas",
      "searchStudents": "Error al buscar alumnos",
      "saveFee": "Error al guardar la tasa",
      "generateCharge": "Error al generar el cobro",
      "deleteFee": "Error al eliminar la tasa"
    },
    "messages": {
      "created": "Tasa creada correctamente.",
      "updated": "Tasa actualizada correctamente.",
      "chargeGenerated": "Movimiento financiero generado correctamente.",
      "deleted": "Tasa eliminada correctamente. El registro se elimin\u00f3 del sistema."
    },
    "confirm": {
      "title": "Eliminar tasa",
      "message": "\u00bfDeseas realmente eliminar esta tasa? Esta acci\u00f3n no se puede deshacer.",
      "confirm": "Eliminar tasa",
      "cancel": "Cancelar"
    }
  },
  "fr-FR": {
    "title": "Frais Ponctuels",
    "subtitle": "Enregistrez des frais et g\u00e9n\u00e9rez de vraies cr\u00e9ances pour les \u00e9l\u00e8ves.",
    "form": {
      "titleCreate": "Cr\u00e9er des frais ponctuels",
      "titleEdit": "Modifier les frais ponctuels"
    },
    "fields": {
      "name": "Nom des frais",
      "category": "Cat\u00e9gorie",
      "value": "Montant",
      "active": "Actifs",
      "requiresDueDate": "\u00c9ch\u00e9ance requise",
      "description": "Description",
      "note": "Observation"
    },
    "placeholders": {
      "name": "Ex. : Inscription",
      "searchStudent": "Saisissez le nom, le matricule ou l\u2019e-mail"
    },
    "categories": {
      "enrollment": "Inscription",
      "withdrawal": "Suspension d\u2019inscription",
      "makeupExam": "Session de rattrapage",
      "declaration": "Attestation",
      "transcript": "Relev\u00e9 de notes",
      "extraClass": "Cours suppl\u00e9mentaire",
      "custom": "Personnalis\u00e9s"
    },
    "buttons": {
      "saving": "Enregistrement...",
      "createFee": "Cr\u00e9er les frais",
      "saveChanges": "Enregistrer les modifications",
      "cancelEditing": "Annuler la modification",
      "generating": "G\u00e9n\u00e9ration...",
      "generateCharge": "G\u00e9n\u00e9rer la cr\u00e9ance",
      "edit": "Modifier",
      "delete": "Supprimer"
    },
    "charge": {
      "title": "G\u00e9n\u00e9rer une cr\u00e9ance pour un \u00e9l\u00e8ve",
      "subtitle": "Transformez des frais enregistr\u00e9s en une \u00e9criture financi\u00e8re r\u00e9elle.",
      "searchStudent": "Rechercher un \u00e9l\u00e8ve",
      "selectStudent": "S\u00e9lectionner un \u00e9l\u00e8ve",
      "selectStudentOption": "S\u00e9lectionnez un \u00e9l\u00e8ve",
      "searchingStudents": "Recherche des \u00e9l\u00e8ves...",
      "registeredFee": "Frais enregistr\u00e9s",
      "selectFee": "S\u00e9lectionnez des frais",
      "dueDate": "\u00c9ch\u00e9ance"
    },
    "list": {
      "title": "Frais enregistr\u00e9s",
      "loading": "Chargement des frais...",
      "empty": "Aucun frais enregistr\u00e9."
    },
    "table": {
      "name": "Nom",
      "category": "Cat\u00e9gorie",
      "value": "Montant",
      "active": "Actifs",
      "dueDate": "\u00c9ch\u00e9ance",
      "actions": "Actions"
    },
    "common": {
      "yes": "Oui",
      "no": "Non"
    },
    "toast": {
      "errorTitle": "Impossible de terminer l\u2019action",
      "successTitle": "Termin\u00e9"
    },
    "errors": {
      "loadFees": "Erreur lors du chargement des frais",
      "searchStudents": "Erreur lors de la recherche des \u00e9l\u00e8ves",
      "saveFee": "Erreur lors de l\u2019enregistrement des frais",
      "generateCharge": "Erreur lors de la g\u00e9n\u00e9ration de la cr\u00e9ance",
      "deleteFee": "Erreur lors de la suppression des frais"
    },
    "messages": {
      "created": "Frais cr\u00e9\u00e9s avec succ\u00e8s.",
      "updated": "Frais mis \u00e0 jour avec succ\u00e8s.",
      "chargeGenerated": "\u00c9criture financi\u00e8re g\u00e9n\u00e9r\u00e9e avec succ\u00e8s.",
      "deleted": "Frais supprim\u00e9s avec succ\u00e8s. L\u2019enregistrement a \u00e9t\u00e9 retir\u00e9 du syst\u00e8me."
    },
    "confirm": {
      "title": "Supprimer les frais",
      "message": "Voulez-vous vraiment supprimer ces frais ? Cette action est irr\u00e9versible.",
      "confirm": "Supprimer les frais",
      "cancel": "Annuler"
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
