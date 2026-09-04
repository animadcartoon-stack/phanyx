import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const files = {
  "pt-BR": path.join(root, "messages", "pt-BR.json"),
  "pt-PT": path.join(root, "messages", "pt-PT.json"),
  "en-US": path.join(root, "messages", "en-US.json"),
  "es-ES": path.join(root, "messages", "es-ES.json"),
  "fr-FR": path.join(root, "messages", "fr-FR.json"),
};

const translations = {
  "pt-BR": {
    "title": "Gestão de Disciplinas",
    "search": {
      "placeholder": "Buscar por nome da disciplina, curso ou ID",
      "empty": "Nenhuma disciplina encontrada para essa busca"
    },
    "newSubject": {
      "openButton": "+ Nova Disciplina",
      "title": "Nova disciplina",
      "namePlaceholder": "Nome da disciplina",
      "createButton": "Criar disciplina"
    },
    "common": {
      "noCourse": "Sem curso vinculado",
      "noTeacher": "Sem professor vinculado",
      "creating": "Criando...",
      "open": "Abrir",
      "close": "Fechar",
      "edit": "Editar",
      "delete": "Excluir",
      "cancel": "Cancelar",
      "deleting": "Excluindo...",
      "optional": "Opcional",
      "saving": "Salvando..."
    },
    "list": {
      "semester": "Semestre {number}",
      "noSemester": "Sem semestre definido",
      "noCourse": "Sem curso vinculado",
      "subjectCount": "{count, plural, =1 {1 disciplina} other {# disciplinas}}"
    },
    "table": {
      "name": "Nome",
      "teacher": "Professor",
      "actions": "Ações"
    },
    "deleteModal": {
      "title": "Confirmar exclusão",
      "question": "Tem certeza que deseja excluir a disciplina “{name}”?",
      "warning": "Esta ação não pode ser desfeita.",
      "confirm": "Confirmar exclusão"
    },
    "messages": {
      "created": "Disciplina criada com sucesso.",
      "deleted": "Disciplina excluída com sucesso.",
      "updated": "Disciplina atualizada com sucesso."
    },
    "errors": {
      "create": "Erro ao criar disciplina.",
      "delete": "Erro ao excluir disciplina.",
      "load": "Erro ao carregar disciplina.",
      "save": "Erro ao salvar disciplina.",
      "invalidId": "ID de disciplina inválido."
    },
    "toast": {
      "errorTitle": "Erro",
      "successTitle": "Tudo certo"
    },
    "edit": {
      "loading": "Carregando disciplina...",
      "back": "← Voltar para disciplinas",
      "title": "Editar disciplina",
      "description": "Atualize os dados da disciplina, defina o curso e o semestre. O vínculo com turma é opcional.",
      "name": "Nome",
      "code": "Código",
      "subjectDescription": "Descrição",
      "workload": "Carga horária",
      "semester": "Semestre",
      "course": "Curso",
      "enabledTeachers": "Professores habilitados para esta disciplina",
      "noTeachersFound": "Nenhum professor encontrado.",
      "enabledTeachersHelp": "Marque todos os professores que podem lecionar esta disciplina.",
      "prerequisites": "Pré-requisitos desta disciplina",
      "noSubjectsFound": "Nenhuma disciplina encontrada.",
      "prerequisitesHelp": "Marque as disciplinas que o aluno precisa concluir antes de cursar esta.",
      "classes": "Turmas",
      "noClassesFound": "Nenhuma turma encontrada.",
      "classFallback": "Turma #{id}",
      "classSemester": "Semestre: {semester}",
      "noSemester": "Sem semestre",
      "classesHelp": "Opcional: vincule esta disciplina a uma turma apenas se a turma já existir.",
      "saveChanges": "Salvar alterações"
    }
  },
  "pt-PT": {
    "title": "Gestão de Unidades Curriculares",
    "search": {
      "placeholder": "Pesquisar por nome da unidade curricular, curso ou ID",
      "empty": "Nenhuma unidade curricular encontrada para esta pesquisa"
    },
    "newSubject": {
      "openButton": "+ Nova Unidade Curricular",
      "title": "Nova unidade curricular",
      "namePlaceholder": "Nome da unidade curricular",
      "createButton": "Criar unidade curricular"
    },
    "common": {
      "noCourse": "Sem curso associado",
      "noTeacher": "Sem docente associado",
      "creating": "A criar...",
      "open": "Abrir",
      "close": "Fechar",
      "edit": "Editar",
      "delete": "Eliminar",
      "cancel": "Cancelar",
      "deleting": "A eliminar...",
      "optional": "Opcional",
      "saving": "A guardar..."
    },
    "list": {
      "semester": "Semestre {number}",
      "noSemester": "Sem semestre definido",
      "noCourse": "Sem curso associado",
      "subjectCount": "{count, plural, =1 {1 unidade curricular} other {# unidades curriculares}}"
    },
    "table": {
      "name": "Nome",
      "teacher": "Docente",
      "actions": "Ações"
    },
    "deleteModal": {
      "title": "Confirmar eliminação",
      "question": "Tem a certeza de que pretende eliminar a unidade curricular “{name}”?",
      "warning": "Esta ação não pode ser anulada.",
      "confirm": "Confirmar eliminação"
    },
    "messages": {
      "created": "Unidade curricular criada com sucesso.",
      "deleted": "Unidade curricular eliminada com sucesso.",
      "updated": "Unidade curricular atualizada com sucesso."
    },
    "errors": {
      "create": "Erro ao criar a unidade curricular.",
      "delete": "Erro ao eliminar a unidade curricular.",
      "load": "Erro ao carregar a unidade curricular.",
      "save": "Erro ao guardar a unidade curricular.",
      "invalidId": "ID da unidade curricular inválido."
    },
    "toast": {
      "errorTitle": "Erro",
      "successTitle": "Tudo certo"
    },
    "edit": {
      "loading": "A carregar a unidade curricular...",
      "back": "← Voltar às unidades curriculares",
      "title": "Editar unidade curricular",
      "description": "Atualize os dados da unidade curricular, defina o curso e o semestre. A associação a uma turma é opcional.",
      "name": "Nome",
      "code": "Código",
      "subjectDescription": "Descrição",
      "workload": "Carga horária",
      "semester": "Semestre",
      "course": "Curso",
      "enabledTeachers": "Docentes habilitados para esta unidade curricular",
      "noTeachersFound": "Nenhum docente encontrado.",
      "enabledTeachersHelp": "Selecione todos os docentes que podem lecionar esta unidade curricular.",
      "prerequisites": "Pré-requisitos desta unidade curricular",
      "noSubjectsFound": "Nenhuma unidade curricular encontrada.",
      "prerequisitesHelp": "Selecione as unidades curriculares que o aluno deve concluir antes desta.",
      "classes": "Turmas",
      "noClassesFound": "Nenhuma turma encontrada.",
      "classFallback": "Turma #{id}",
      "classSemester": "Semestre: {semester}",
      "noSemester": "Sem semestre",
      "classesHelp": "Opcional: associe esta unidade curricular a uma turma apenas se a turma já existir.",
      "saveChanges": "Guardar alterações"
    }
  },
  "en-US": {
    "title": "Subject Management",
    "search": {
      "placeholder": "Search by subject name, course, or ID",
      "empty": "No subjects were found for this search"
    },
    "newSubject": {
      "openButton": "+ New Subject",
      "title": "New subject",
      "namePlaceholder": "Subject name",
      "createButton": "Create subject"
    },
    "common": {
      "noCourse": "No course linked",
      "noTeacher": "No teacher linked",
      "creating": "Creating...",
      "open": "Open",
      "close": "Close",
      "edit": "Edit",
      "delete": "Delete",
      "cancel": "Cancel",
      "deleting": "Deleting...",
      "optional": "Optional",
      "saving": "Saving..."
    },
    "list": {
      "semester": "Semester {number}",
      "noSemester": "No semester defined",
      "noCourse": "No course linked",
      "subjectCount": "{count, plural, =1 {1 subject} other {# subjects}}"
    },
    "table": {
      "name": "Name",
      "teacher": "Teacher",
      "actions": "Actions"
    },
    "deleteModal": {
      "title": "Confirm deletion",
      "question": "Are you sure you want to delete the subject “{name}”?",
      "warning": "This action cannot be undone.",
      "confirm": "Confirm deletion"
    },
    "messages": {
      "created": "Subject created successfully.",
      "deleted": "Subject deleted successfully.",
      "updated": "Subject updated successfully."
    },
    "errors": {
      "create": "Unable to create the subject.",
      "delete": "Unable to delete the subject.",
      "load": "Unable to load the subject.",
      "save": "Unable to save the subject.",
      "invalidId": "Invalid subject ID."
    },
    "toast": {
      "errorTitle": "Error",
      "successTitle": "All set"
    },
    "edit": {
      "loading": "Loading subject...",
      "back": "← Back to subjects",
      "title": "Edit subject",
      "description": "Update the subject information and define its course and semester. Linking a class is optional.",
      "name": "Name",
      "code": "Code",
      "subjectDescription": "Description",
      "workload": "Workload",
      "semester": "Semester",
      "course": "Course",
      "enabledTeachers": "Teachers qualified to teach this subject",
      "noTeachersFound": "No teachers found.",
      "enabledTeachersHelp": "Select all teachers who are qualified to teach this subject.",
      "prerequisites": "Subject prerequisites",
      "noSubjectsFound": "No subjects found.",
      "prerequisitesHelp": "Select the subjects students must complete before taking this one.",
      "classes": "Classes",
      "noClassesFound": "No classes found.",
      "classFallback": "Class #{id}",
      "classSemester": "Semester: {semester}",
      "noSemester": "No semester",
      "classesHelp": "Optional: link this subject to a class only if the class already exists.",
      "saveChanges": "Save changes"
    }
  },
  "es-ES": {
    "title": "Gestión de Asignaturas",
    "search": {
      "placeholder": "Buscar por nombre de asignatura, curso o ID",
      "empty": "No se encontraron asignaturas para esta búsqueda"
    },
    "newSubject": {
      "openButton": "+ Nueva Asignatura",
      "title": "Nueva asignatura",
      "namePlaceholder": "Nombre de la asignatura",
      "createButton": "Crear asignatura"
    },
    "common": {
      "noCourse": "Sin curso vinculado",
      "noTeacher": "Sin profesor vinculado",
      "creating": "Creando...",
      "open": "Abrir",
      "close": "Cerrar",
      "edit": "Editar",
      "delete": "Eliminar",
      "cancel": "Cancelar",
      "deleting": "Eliminando...",
      "optional": "Opcional",
      "saving": "Guardando..."
    },
    "list": {
      "semester": "Semestre {number}",
      "noSemester": "Sin semestre definido",
      "noCourse": "Sin curso vinculado",
      "subjectCount": "{count, plural, =1 {1 asignatura} other {# asignaturas}}"
    },
    "table": {
      "name": "Nombre",
      "teacher": "Profesor",
      "actions": "Acciones"
    },
    "deleteModal": {
      "title": "Confirmar eliminación",
      "question": "¿Seguro que desea eliminar la asignatura “{name}”?",
      "warning": "Esta acción no se puede deshacer.",
      "confirm": "Confirmar eliminación"
    },
    "messages": {
      "created": "Asignatura creada correctamente.",
      "deleted": "Asignatura eliminada correctamente.",
      "updated": "Asignatura actualizada correctamente."
    },
    "errors": {
      "create": "No se pudo crear la asignatura.",
      "delete": "No se pudo eliminar la asignatura.",
      "load": "No se pudo cargar la asignatura.",
      "save": "No se pudo guardar la asignatura.",
      "invalidId": "ID de asignatura no válido."
    },
    "toast": {
      "errorTitle": "Error",
      "successTitle": "Todo correcto"
    },
    "edit": {
      "loading": "Cargando asignatura...",
      "back": "← Volver a asignaturas",
      "title": "Editar asignatura",
      "description": "Actualice los datos de la asignatura y defina el curso y el semestre. La vinculación con un grupo es opcional.",
      "name": "Nombre",
      "code": "Código",
      "subjectDescription": "Descripción",
      "workload": "Carga horaria",
      "semester": "Semestre",
      "course": "Curso",
      "enabledTeachers": "Profesores habilitados para esta asignatura",
      "noTeachersFound": "No se encontraron profesores.",
      "enabledTeachersHelp": "Seleccione todos los profesores que pueden impartir esta asignatura.",
      "prerequisites": "Prerrequisitos de esta asignatura",
      "noSubjectsFound": "No se encontraron asignaturas.",
      "prerequisitesHelp": "Seleccione las asignaturas que el estudiante debe completar antes de cursar esta.",
      "classes": "Grupos",
      "noClassesFound": "No se encontraron grupos.",
      "classFallback": "Grupo #{id}",
      "classSemester": "Semestre: {semester}",
      "noSemester": "Sin semestre",
      "classesHelp": "Opcional: vincule esta asignatura a un grupo solo si el grupo ya existe.",
      "saveChanges": "Guardar cambios"
    }
  },
  "fr-FR": {
    "title": "Gestion des Matières",
    "search": {
      "placeholder": "Rechercher par nom de matière, cursus ou ID",
      "empty": "Aucune matière trouvée pour cette recherche"
    },
    "newSubject": {
      "openButton": "+ Nouvelle Matière",
      "title": "Nouvelle matière",
      "namePlaceholder": "Nom de la matière",
      "createButton": "Créer la matière"
    },
    "common": {
      "noCourse": "Aucun cursus associé",
      "noTeacher": "Aucun enseignant associé",
      "creating": "Création...",
      "open": "Ouvrir",
      "close": "Fermer",
      "edit": "Modifier",
      "delete": "Supprimer",
      "cancel": "Annuler",
      "deleting": "Suppression...",
      "optional": "Facultatif",
      "saving": "Enregistrement..."
    },
    "list": {
      "semester": "Semestre {number}",
      "noSemester": "Aucun semestre défini",
      "noCourse": "Aucun cursus associé",
      "subjectCount": "{count, plural, =1 {1 matière} other {# matières}}"
    },
    "table": {
      "name": "Nom",
      "teacher": "Enseignant",
      "actions": "Actions"
    },
    "deleteModal": {
      "title": "Confirmer la suppression",
      "question": "Voulez-vous vraiment supprimer la matière « {name} » ?",
      "warning": "Cette action est irréversible.",
      "confirm": "Confirmer la suppression"
    },
    "messages": {
      "created": "Matière créée avec succès.",
      "deleted": "Matière supprimée avec succès.",
      "updated": "Matière mise à jour avec succès."
    },
    "errors": {
      "create": "Impossible de créer la matière.",
      "delete": "Impossible de supprimer la matière.",
      "load": "Impossible de charger la matière.",
      "save": "Impossible d’enregistrer la matière.",
      "invalidId": "ID de matière non valide."
    },
    "toast": {
      "errorTitle": "Erreur",
      "successTitle": "Terminé"
    },
    "edit": {
      "loading": "Chargement de la matière...",
      "back": "← Retour aux matières",
      "title": "Modifier la matière",
      "description": "Mettez à jour les informations de la matière et définissez le cursus et le semestre. L’association à un groupe est facultative.",
      "name": "Nom",
      "code": "Code",
      "subjectDescription": "Description",
      "workload": "Charge horaire",
      "semester": "Semestre",
      "course": "Cursus",
      "enabledTeachers": "Enseignants habilités pour cette matière",
      "noTeachersFound": "Aucun enseignant trouvé.",
      "enabledTeachersHelp": "Sélectionnez tous les enseignants habilités à enseigner cette matière.",
      "prerequisites": "Prérequis de cette matière",
      "noSubjectsFound": "Aucune matière trouvée.",
      "prerequisitesHelp": "Sélectionnez les matières que l’étudiant doit valider avant de suivre celle-ci.",
      "classes": "Groupes",
      "noClassesFound": "Aucun groupe trouvé.",
      "classFallback": "Groupe #{id}",
      "classSemester": "Semestre : {semester}",
      "noSemester": "Aucun semestre",
      "classesHelp": "Facultatif : associez cette matière à un groupe uniquement si le groupe existe déjà.",
      "saveChanges": "Enregistrer les modifications"
    }
  }
};

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  json.AdminSubjects = {
    ...(json.AdminSubjects || {}),
    ...translations[locale],
  };

  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  console.log(`OK: ${locale}`);
}

console.log("Traduções das páginas de Disciplinas atualizadas.");
