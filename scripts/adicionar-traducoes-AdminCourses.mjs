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
    "common": {
      "saving": "Salvando...",
      "adding": "Adicionando...",
      "deleting": "Excluindo...",
      "cancel": "Cancelar",
      "delete": "Excluir",
      "restore": "Restaurar",
      "understood": "Entendi",
      "openWithArrow": "▼ Abrir",
      "closeWithArrow": "▲ Fechar",
      "code": "Código",
      "course": "Curso",
      "description": "Descrição",
      "modality": "Tipo / modalidade do curso",
      "semesters": "Semestres",
      "enrollmentValue": "Valor da matrícula",
      "monthlyValue": "Valor da mensalidade",
      "installments": "Parcelas",
      "poles": "Polos",
      "status": "Status",
      "notInformed": "Não informado",
      "notInformedFeminine": "Não informada"
    },
    "status": {
      "active": "Ativo",
      "inactive": "Inativo"
    },
    "filters": {
      "active": "Ativos",
      "deleted": "Excluídos",
      "all": "Todos"
    },
    "modalities": {
      "GERAL": "Geral",
      "BACHARELADO": "Bacharelado",
      "LICENCIATURA": "Licenciatura",
      "TECNOLOGO": "Tecnólogo",
      "POS_GRADUACAO": "Pós-graduação",
      "MBA": "MBA",
      "MESTRADO": "Mestrado",
      "DOUTORADO": "Doutorado",
      "TECNICO": "Curso Técnico",
      "CURSO_LIVRE": "Curso Livre",
      "OFICINA": "Oficina",
      "ENSINO_MEDIO": "Ensino Médio",
      "ENSINO_FUNDAMENTAL": "Ensino Fundamental",
      "EDUCACAO_INFANTIL": "Educação Infantil",
      "PRE_ESCOLA": "Pré-escola",
      "EXTENSAO": "Extensão",
      "CAPACITACAO": "Capacitação",
      "TREINAMENTO": "Treinamento",
      "EJA": "EJA",
      "OUTRO": "Outro"
    },
    "list": {
      "header": {
        "title": "Cursos",
        "description": "Cadastre e gerencie os cursos da instituição.",
        "backDashboard": "Voltar ao Painel"
      },
      "create": {
        "title": "Novo Curso",
        "namePlaceholder": "Nome do curso",
        "codePlaceholder": "Código do curso",
        "descriptionPlaceholder": "Descrição",
        "semestersPlaceholder": "Quantidade de semestres",
        "enrollmentValuePlaceholder": "Valor da matrícula",
        "monthlyValuePlaceholder": "Valor da mensalidade",
        "installmentsPlaceholder": "Quantidade de parcelas",
        "modalityHelp": "Essa informação define qual modelo de certificado será usado para o curso.",
        "saveCourse": "Salvar Curso",
        "poles": {
          "label": "Polos onde este curso será ofertado",
          "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}",
          "none": "Nenhum polo cadastrado. Se a instituição não trabalhar com polos, você pode deixar sem seleção por enquanto.",
          "help": "O curso continua sendo da instituição, mas pode ser ofertado em quantos polos desejar."
        }
      },
      "registered": {
        "title": "Cursos cadastrados",
        "searchPlaceholder": "Buscar por nome, código, descrição, valores, parcelas ou polos",
        "loading": "Carregando cursos...",
        "empty": "Nenhum curso encontrado para essa busca."
      },
      "cards": {
        "noPoles": "Sem polos vinculados",
        "courseId": "ID do curso",
        "createdAt": "Criado em",
        "createdBy": "Criado por",
        "deletedAt": "Excluído em",
        "deletedBy": "Excluído por",
        "restoreUntil": "Disponível para restauração até",
        "lastRestoreDay": "⚠️ Último dia para restaurar. Este curso não estará mais disponível após {date}.",
        "restoreWindow": "Cursos excluídos ficam disponíveis para restauração por até 3 dias. Após esse prazo, poderão ser removidos definitivamente do sistema."
      },
      "actions": {
        "viewStructure": "Ver estrutura",
        "buildCurriculum": "Montar grade curricular",
        "editPoles": "Editar polos/unidades"
      },
      "editPoles": {
        "title": "Editar polos e unidades",
        "noActivePoles": "Nenhum polo ativo disponível.",
        "help": "Ao desmarcar uma unidade independente, o curso será retirado e desativado nela, sem apagar o histórico.",
        "save": "Salvar polos"
      },
      "deleteModal": {
        "title": "Excluir curso",
        "confirmation": "Deseja realmente excluir o curso <strong>{course}</strong>?",
        "help": "O curso será apenas arquivado e poderá ser restaurado depois.",
        "deleteCourse": "Excluir curso"
      }
    },
    "detail": {
      "loading": "Carregando curso...",
      "notFound": "Curso não encontrado.",
      "header": {
        "title": "Estrutura do Curso",
        "description": "Cadastre os semestres e vincule as disciplinas de cada semestre.",
        "backCourses": "Voltar para Cursos"
      },
      "network": {
        "receivedTitle": "Curso recebido da rede",
        "synced": "Estrutura sincronizada",
        "publishedBy": "Este curso foi publicado por <strong>{institution}</strong>.",
        "otherInstitution": "outra instituição da rede",
        "controlledByOrigin": "Nome, código, descrição, modalidade, semestres, disciplinas e cargas acadêmicas são controlados pela instituição de origem.",
        "localConfiguration": "Esta unidade pode configurar somente matrícula, mensalidade, parcelas e os dados operacionais locais, como turmas, professores, horários, vagas e matrículas.",
        "originCourse": "Curso de origem",
        "originId": "ID de origem",
        "editRestriction": "Neste curso recebido da rede, somente os valores de matrícula, mensalidade e quantidade de parcelas podem ser alterados por esta unidade.",
        "academicStructureReceived": "Estrutura acadêmica recebida",
        "academicStructureHelp": "Os semestres deste curso são publicados e sincronizados pela instituição de origem. Esta unidade pode consultá-los, mas não pode criar novos semestres nem alterar a matriz curricular."
      },
      "courseForm": {
        "namePlaceholder": "Nome do curso",
        "semestersCount": "Quantidade de semestres do curso",
        "activeCourse": "Curso ativo",
        "descriptionPlaceholder": "Descrição do curso",
        "saveLocalValues": "Salvar valores locais",
        "saveChanges": "Salvar alterações",
        "configureLocalValues": "Configurar valores locais",
        "editCourse": "Editar curso"
      },
      "courseInfo": {
        "expectedSemesters": "Quantidade prevista de semestres"
      },
      "semesters": {
        "addTitle": "Adicionar semestre",
        "numberPlaceholder": "Número do semestre",
        "titlePlaceholder": "Título do semestre",
        "descriptionPlaceholder": "Descrição do semestre",
        "addButton": "Adicionar semestre",
        "none": "Nenhum semestre cadastrado ainda para este curso.",
        "semesterLabel": "Semestre {number}",
        "minimumWorkload": "Carga mínima permitida no semestre (horas)",
        "maximumWorkload": "Carga máxima permitida no semestre (horas)",
        "saveWorkload": "Salvar carga"
      },
      "subjects": {
        "linkedTitle": "Disciplinas já vinculadas",
        "noneLinked": "Nenhuma disciplina vinculada ainda.",
        "noneRegistered": "Nenhuma disciplina cadastrada.",
        "readOnlyNetwork": "Grade recebida da rede — somente leitura.",
        "updateSemester": "Atualizar disciplinas do semestre {number}"
      }
    },
    "messages": {
      "coursePolesUpdated": "Polos do curso atualizados com sucesso.",
      "courseCreated": "Curso criado com sucesso!",
      "courseDeleted": "Curso excluído com sucesso. Ele pode ser restaurado depois.",
      "courseRestored": "Curso restaurado com sucesso.",
      "localValuesUpdated": "Valores locais atualizados com sucesso!",
      "courseUpdated": "Curso atualizado com sucesso!",
      "semesterCreated": "Semestre criado com sucesso!",
      "subjectsSaved": "Disciplinas do semestre {semester} salvas com sucesso!",
      "workloadSaved": "Carga horária salva com sucesso!"
    },
    "errors": {
      "loadCourses": "Erro ao carregar cursos.",
      "loadPoles": "Erro ao carregar polos.",
      "updateCoursePoles": "Erro ao atualizar os polos do curso.",
      "createCourse": "Erro ao criar curso.",
      "deleteCourse": "Erro ao excluir curso.",
      "restoreCourse": "Erro ao restaurar curso.",
      "couldNotSave": "Não foi possível salvar",
      "loadSubjects": "Erro ao carregar disciplinas.",
      "loadCourseSemesters": "Erro ao carregar semestres do curso.",
      "loadCourseData": "Erro ao carregar dados do curso.",
      "editCourse": "Erro ao editar curso.",
      "createSemester": "Erro ao criar semestre.",
      "saveSubjects": "Erro ao salvar disciplinas.",
      "saveWorkload": "Erro ao salvar carga horária."
    },
    "validation": {
      "workloadRequired": "Preencha a carga mínima e a carga máxima antes de salvar.",
      "workloadPositive": "A carga mínima e a carga máxima precisam ser maiores que zero.",
      "workloadOrder": "A carga mínima não pode ser maior que a carga máxima."
    }
  },
  "pt-PT": {
    "common": {
      "saving": "A guardar...",
      "adding": "A adicionar...",
      "deleting": "A eliminar...",
      "cancel": "Cancelar",
      "delete": "Eliminar",
      "restore": "Restaurar",
      "understood": "Entendi",
      "openWithArrow": "▼ Abrir",
      "closeWithArrow": "▲ Fechar",
      "code": "Código",
      "course": "Curso",
      "description": "Descrição",
      "modality": "Tipo / modalidade do curso",
      "semesters": "Semestres",
      "enrollmentValue": "Valor da matrícula",
      "monthlyValue": "Valor da mensalidade",
      "installments": "Prestações",
      "poles": "Polos",
      "status": "Estado",
      "notInformed": "Não informado",
      "notInformedFeminine": "Não informada"
    },
    "status": {
      "active": "Ativo",
      "inactive": "Inativo"
    },
    "filters": {
      "active": "Ativos",
      "deleted": "Eliminados",
      "all": "Todos"
    },
    "modalities": {
      "GERAL": "Geral",
      "BACHARELADO": "Licenciatura",
      "LICENCIATURA": "Licenciatura",
      "TECNOLOGO": "Curso tecnológico",
      "POS_GRADUACAO": "Pós-graduação",
      "MBA": "MBA",
      "MESTRADO": "Mestrado",
      "DOUTORADO": "Doutoramento",
      "TECNICO": "Curso Técnico",
      "CURSO_LIVRE": "Curso Livre",
      "OFICINA": "Oficina",
      "ENSINO_MEDIO": "Ensino Secundário",
      "ENSINO_FUNDAMENTAL": "Ensino Básico",
      "EDUCACAO_INFANTIL": "Educação Pré-Escolar",
      "PRE_ESCOLA": "Pré-escola",
      "EXTENSAO": "Extensão",
      "CAPACITACAO": "Capacitação",
      "TREINAMENTO": "Formação",
      "EJA": "Educação de Adultos",
      "OUTRO": "Outro"
    },
    "list": {
      "header": {
        "title": "Cursos",
        "description": "Registe e faça a gestão dos cursos da instituição.",
        "backDashboard": "Voltar ao Painel"
      },
      "create": {
        "title": "Novo Curso",
        "namePlaceholder": "Nome do curso",
        "codePlaceholder": "Código do curso",
        "descriptionPlaceholder": "Descrição",
        "semestersPlaceholder": "Quantidade de semestres",
        "enrollmentValuePlaceholder": "Valor da matrícula",
        "monthlyValuePlaceholder": "Valor da mensalidade",
        "installmentsPlaceholder": "Quantidade de prestações",
        "modalityHelp": "Esta informação define qual o modelo de certificado que será utilizado para o curso.",
        "saveCourse": "Guardar Curso",
        "poles": {
          "label": "Polos onde este curso será disponibilizado",
          "selectedCount": "{count, plural, one {# selecionado} other {# selecionados}}",
          "none": "Nenhum polo registado. Se a instituição não trabalhar com polos, pode deixar sem seleção por enquanto.",
          "help": "O curso continua a pertencer à instituição, mas pode ser disponibilizado em quantos polos desejar."
        }
      },
      "registered": {
        "title": "Cursos registados",
        "searchPlaceholder": "Pesquisar por nome, código, descrição, valores, prestações ou polos",
        "loading": "A carregar cursos...",
        "empty": "Nenhum curso encontrado para esta pesquisa."
      },
      "cards": {
        "noPoles": "Sem polos associados",
        "courseId": "ID do curso",
        "createdAt": "Criado em",
        "createdBy": "Criado por",
        "deletedAt": "Eliminado em",
        "deletedBy": "Eliminado por",
        "restoreUntil": "Disponível para restauração até",
        "lastRestoreDay": "⚠️ Último dia para restaurar. Este curso deixará de estar disponível após {date}.",
        "restoreWindow": "Os cursos eliminados ficam disponíveis para restauração durante até 3 dias. Após esse prazo, poderão ser removidos definitivamente do sistema."
      },
      "actions": {
        "viewStructure": "Ver estrutura",
        "buildCurriculum": "Montar plano curricular",
        "editPoles": "Editar polos/unidades"
      },
      "editPoles": {
        "title": "Editar polos e unidades",
        "noActivePoles": "Nenhum polo ativo disponível.",
        "help": "Ao desmarcar uma unidade independente, o curso será retirado e desativado nessa unidade, sem apagar o histórico.",
        "save": "Guardar polos"
      },
      "deleteModal": {
        "title": "Eliminar curso",
        "confirmation": "Pretende realmente eliminar o curso <strong>{course}</strong>?",
        "help": "O curso será apenas arquivado e poderá ser restaurado mais tarde.",
        "deleteCourse": "Eliminar curso"
      }
    },
    "detail": {
      "loading": "A carregar curso...",
      "notFound": "Curso não encontrado.",
      "header": {
        "title": "Estrutura do Curso",
        "description": "Registe os semestres e associe as disciplinas de cada semestre.",
        "backCourses": "Voltar aos Cursos"
      },
      "network": {
        "receivedTitle": "Curso recebido da rede",
        "synced": "Estrutura sincronizada",
        "publishedBy": "Este curso foi publicado por <strong>{institution}</strong>.",
        "otherInstitution": "outra instituição da rede",
        "controlledByOrigin": "O nome, código, descrição, modalidade, semestres, disciplinas e cargas académicas são controlados pela instituição de origem.",
        "localConfiguration": "Esta unidade pode configurar apenas a matrícula, mensalidade, prestações e os dados operacionais locais, como turmas, professores, horários, vagas e matrículas.",
        "originCourse": "Curso de origem",
        "originId": "ID de origem",
        "editRestriction": "Neste curso recebido da rede, apenas os valores de matrícula, mensalidade e quantidade de prestações podem ser alterados por esta unidade.",
        "academicStructureReceived": "Estrutura académica recebida",
        "academicStructureHelp": "Os semestres deste curso são publicados e sincronizados pela instituição de origem. Esta unidade pode consultá-los, mas não pode criar novos semestres nem alterar o plano curricular."
      },
      "courseForm": {
        "namePlaceholder": "Nome do curso",
        "semestersCount": "Quantidade de semestres do curso",
        "activeCourse": "Curso ativo",
        "descriptionPlaceholder": "Descrição do curso",
        "saveLocalValues": "Guardar valores locais",
        "saveChanges": "Guardar alterações",
        "configureLocalValues": "Configurar valores locais",
        "editCourse": "Editar curso"
      },
      "courseInfo": {
        "expectedSemesters": "Quantidade prevista de semestres"
      },
      "semesters": {
        "addTitle": "Adicionar semestre",
        "numberPlaceholder": "Número do semestre",
        "titlePlaceholder": "Título do semestre",
        "descriptionPlaceholder": "Descrição do semestre",
        "addButton": "Adicionar semestre",
        "none": "Ainda não existe nenhum semestre registado para este curso.",
        "semesterLabel": "Semestre {number}",
        "minimumWorkload": "Carga mínima permitida no semestre (horas)",
        "maximumWorkload": "Carga máxima permitida no semestre (horas)",
        "saveWorkload": "Guardar carga"
      },
      "subjects": {
        "linkedTitle": "Disciplinas já associadas",
        "noneLinked": "Ainda não existe nenhuma disciplina associada.",
        "noneRegistered": "Nenhuma disciplina registada.",
        "readOnlyNetwork": "Plano recebido da rede — apenas leitura.",
        "updateSemester": "Atualizar disciplinas do semestre {number}"
      }
    },
    "messages": {
      "coursePolesUpdated": "Polos do curso atualizados com sucesso.",
      "courseCreated": "Curso criado com sucesso!",
      "courseDeleted": "Curso eliminado com sucesso. Pode ser restaurado mais tarde.",
      "courseRestored": "Curso restaurado com sucesso.",
      "localValuesUpdated": "Valores locais atualizados com sucesso!",
      "courseUpdated": "Curso atualizado com sucesso!",
      "semesterCreated": "Semestre criado com sucesso!",
      "subjectsSaved": "Disciplinas do semestre {semester} guardadas com sucesso!",
      "workloadSaved": "Carga horária guardada com sucesso!"
    },
    "errors": {
      "loadCourses": "Erro ao carregar os cursos.",
      "loadPoles": "Erro ao carregar os polos.",
      "updateCoursePoles": "Erro ao atualizar os polos do curso.",
      "createCourse": "Erro ao criar o curso.",
      "deleteCourse": "Erro ao eliminar o curso.",
      "restoreCourse": "Erro ao restaurar o curso.",
      "couldNotSave": "Não foi possível guardar",
      "loadSubjects": "Erro ao carregar as disciplinas.",
      "loadCourseSemesters": "Erro ao carregar os semestres do curso.",
      "loadCourseData": "Erro ao carregar os dados do curso.",
      "editCourse": "Erro ao editar o curso.",
      "createSemester": "Erro ao criar o semestre.",
      "saveSubjects": "Erro ao guardar as disciplinas.",
      "saveWorkload": "Erro ao guardar a carga horária."
    },
    "validation": {
      "workloadRequired": "Preencha a carga mínima e a carga máxima antes de guardar.",
      "workloadPositive": "A carga mínima e a carga máxima têm de ser superiores a zero.",
      "workloadOrder": "A carga mínima não pode ser superior à carga máxima."
    }
  },
  "en-US": {
    "common": {
      "saving": "Saving...",
      "adding": "Adding...",
      "deleting": "Deleting...",
      "cancel": "Cancel",
      "delete": "Delete",
      "restore": "Restore",
      "understood": "Got it",
      "openWithArrow": "▼ Open",
      "closeWithArrow": "▲ Close",
      "code": "Code",
      "course": "Course",
      "description": "Description",
      "modality": "Course type / modality",
      "semesters": "Semesters",
      "enrollmentValue": "Enrollment fee",
      "monthlyValue": "Monthly fee",
      "installments": "Installments",
      "poles": "Campuses",
      "status": "Status",
      "notInformed": "Not provided",
      "notInformedFeminine": "Not provided"
    },
    "status": {
      "active": "Active",
      "inactive": "Inactive"
    },
    "filters": {
      "active": "Active",
      "deleted": "Deleted",
      "all": "All"
    },
    "modalities": {
      "GERAL": "General",
      "BACHARELADO": "Bachelor's Degree",
      "LICENCIATURA": "Teaching Degree",
      "TECNOLOGO": "Technology Degree",
      "POS_GRADUACAO": "Postgraduate",
      "MBA": "MBA",
      "MESTRADO": "Master's Degree",
      "DOUTORADO": "Doctorate",
      "TECNICO": "Technical Course",
      "CURSO_LIVRE": "Open Course",
      "OFICINA": "Workshop",
      "ENSINO_MEDIO": "High School",
      "ENSINO_FUNDAMENTAL": "Elementary School",
      "EDUCACAO_INFANTIL": "Early Childhood Education",
      "PRE_ESCOLA": "Preschool",
      "EXTENSAO": "Extension Course",
      "CAPACITACAO": "Professional Development",
      "TREINAMENTO": "Training",
      "EJA": "Adult Education",
      "OUTRO": "Other"
    },
    "list": {
      "header": {
        "title": "Courses",
        "description": "Create and manage the institution's courses.",
        "backDashboard": "Back to Dashboard"
      },
      "create": {
        "title": "New Course",
        "namePlaceholder": "Course name",
        "codePlaceholder": "Course code",
        "descriptionPlaceholder": "Description",
        "semestersPlaceholder": "Number of semesters",
        "enrollmentValuePlaceholder": "Enrollment fee",
        "monthlyValuePlaceholder": "Monthly fee",
        "installmentsPlaceholder": "Number of installments",
        "modalityHelp": "This information determines which certificate template will be used for the course.",
        "saveCourse": "Save Course",
        "poles": {
          "label": "Campuses where this course will be offered",
          "selectedCount": "{count, plural, one {# selected} other {# selected}}",
          "none": "No campus has been registered. If the institution does not work with campuses, you can leave this unselected for now.",
          "help": "The course still belongs to the institution, but it can be offered at as many campuses as needed."
        }
      },
      "registered": {
        "title": "Registered courses",
        "searchPlaceholder": "Search by name, code, description, fees, installments, or campuses",
        "loading": "Loading courses...",
        "empty": "No course found for this search."
      },
      "cards": {
        "noPoles": "No campuses linked",
        "courseId": "Course ID",
        "createdAt": "Created at",
        "createdBy": "Created by",
        "deletedAt": "Deleted at",
        "deletedBy": "Deleted by",
        "restoreUntil": "Available for restoration until",
        "lastRestoreDay": "⚠️ Last day to restore. This course will no longer be available after {date}.",
        "restoreWindow": "Deleted courses remain available for restoration for up to 3 days. After that period, they may be permanently removed from the system."
      },
      "actions": {
        "viewStructure": "View structure",
        "buildCurriculum": "Build curriculum",
        "editPoles": "Edit campuses/units"
      },
      "editPoles": {
        "title": "Edit campuses and units",
        "noActivePoles": "No active campus available.",
        "help": "When an independent unit is unchecked, the course will be removed and disabled there without deleting its history.",
        "save": "Save campuses"
      },
      "deleteModal": {
        "title": "Delete course",
        "confirmation": "Do you really want to delete the course <strong>{course}</strong>?",
        "help": "The course will only be archived and can be restored later.",
        "deleteCourse": "Delete course"
      }
    },
    "detail": {
      "loading": "Loading course...",
      "notFound": "Course not found.",
      "header": {
        "title": "Course Structure",
        "description": "Create semesters and link the subjects for each semester.",
        "backCourses": "Back to Courses"
      },
      "network": {
        "receivedTitle": "Course received from the network",
        "synced": "Synchronized structure",
        "publishedBy": "This course was published by <strong>{institution}</strong>.",
        "otherInstitution": "another institution in the network",
        "controlledByOrigin": "Name, code, description, modality, semesters, subjects, and academic workloads are controlled by the institution of origin.",
        "localConfiguration": "This unit can configure only the enrollment fee, monthly fee, installments, and local operational data such as classes, teachers, schedules, seats, and enrollments.",
        "originCourse": "Origin course",
        "originId": "Origin ID",
        "editRestriction": "For this course received from the network, this unit can change only the enrollment fee, monthly fee, and number of installments.",
        "academicStructureReceived": "Academic structure received",
        "academicStructureHelp": "The semesters in this course are published and synchronized by the institution of origin. This unit can view them but cannot create new semesters or change the curriculum."
      },
      "courseForm": {
        "namePlaceholder": "Course name",
        "semestersCount": "Number of course semesters",
        "activeCourse": "Active course",
        "descriptionPlaceholder": "Course description",
        "saveLocalValues": "Save local values",
        "saveChanges": "Save changes",
        "configureLocalValues": "Configure local values",
        "editCourse": "Edit course"
      },
      "courseInfo": {
        "expectedSemesters": "Expected number of semesters"
      },
      "semesters": {
        "addTitle": "Add semester",
        "numberPlaceholder": "Semester number",
        "titlePlaceholder": "Semester title",
        "descriptionPlaceholder": "Semester description",
        "addButton": "Add semester",
        "none": "No semester has been registered for this course yet.",
        "semesterLabel": "Semester {number}",
        "minimumWorkload": "Minimum workload allowed in the semester (hours)",
        "maximumWorkload": "Maximum workload allowed in the semester (hours)",
        "saveWorkload": "Save workload"
      },
      "subjects": {
        "linkedTitle": "Subjects already linked",
        "noneLinked": "No subject linked yet.",
        "noneRegistered": "No subjects registered.",
        "readOnlyNetwork": "Curriculum received from the network — read only.",
        "updateSemester": "Update subjects for semester {number}"
      }
    },
    "messages": {
      "coursePolesUpdated": "Course campuses updated successfully.",
      "courseCreated": "Course created successfully!",
      "courseDeleted": "Course deleted successfully. It can be restored later.",
      "courseRestored": "Course restored successfully.",
      "localValuesUpdated": "Local values updated successfully!",
      "courseUpdated": "Course updated successfully!",
      "semesterCreated": "Semester created successfully!",
      "subjectsSaved": "Subjects for semester {semester} saved successfully!",
      "workloadSaved": "Workload saved successfully!"
    },
    "errors": {
      "loadCourses": "Unable to load courses.",
      "loadPoles": "Unable to load campuses.",
      "updateCoursePoles": "Unable to update the course campuses.",
      "createCourse": "Unable to create the course.",
      "deleteCourse": "Unable to delete the course.",
      "restoreCourse": "Unable to restore the course.",
      "couldNotSave": "Unable to save",
      "loadSubjects": "Unable to load subjects.",
      "loadCourseSemesters": "Unable to load course semesters.",
      "loadCourseData": "Unable to load course data.",
      "editCourse": "Unable to edit the course.",
      "createSemester": "Unable to create the semester.",
      "saveSubjects": "Unable to save subjects.",
      "saveWorkload": "Unable to save the workload."
    },
    "validation": {
      "workloadRequired": "Fill in the minimum and maximum workload before saving.",
      "workloadPositive": "The minimum and maximum workload must be greater than zero.",
      "workloadOrder": "The minimum workload cannot be greater than the maximum workload."
    }
  },
  "es-ES": {
    "common": {
      "saving": "Guardando...",
      "adding": "Añadiendo...",
      "deleting": "Eliminando...",
      "cancel": "Cancelar",
      "delete": "Eliminar",
      "restore": "Restaurar",
      "understood": "Entendido",
      "openWithArrow": "▼ Abrir",
      "closeWithArrow": "▲ Cerrar",
      "code": "Código",
      "course": "Curso",
      "description": "Descripción",
      "modality": "Tipo / modalidad del curso",
      "semesters": "Semestres",
      "enrollmentValue": "Valor de la matrícula",
      "monthlyValue": "Cuota mensual",
      "installments": "Cuotas",
      "poles": "Sedes",
      "status": "Estado",
      "notInformed": "No informado",
      "notInformedFeminine": "No informada"
    },
    "status": {
      "active": "Activo",
      "inactive": "Inactivo"
    },
    "filters": {
      "active": "Activos",
      "deleted": "Eliminados",
      "all": "Todos"
    },
    "modalities": {
      "GERAL": "General",
      "BACHARELADO": "Grado universitario",
      "LICENCIATURA": "Licenciatura",
      "TECNOLOGO": "Tecnólogo",
      "POS_GRADUACAO": "Posgrado",
      "MBA": "MBA",
      "MESTRADO": "Máster",
      "DOUTORADO": "Doctorado",
      "TECNICO": "Curso Técnico",
      "CURSO_LIVRE": "Curso Libre",
      "OFICINA": "Taller",
      "ENSINO_MEDIO": "Educación Secundaria",
      "ENSINO_FUNDAMENTAL": "Educación Primaria",
      "EDUCACAO_INFANTIL": "Educación Infantil",
      "PRE_ESCOLA": "Preescolar",
      "EXTENSAO": "Extensión",
      "CAPACITACAO": "Capacitación",
      "TREINAMENTO": "Formación",
      "EJA": "Educación de Adultos",
      "OUTRO": "Otro"
    },
    "list": {
      "header": {
        "title": "Cursos",
        "description": "Registre y gestione los cursos de la institución.",
        "backDashboard": "Volver al Panel"
      },
      "create": {
        "title": "Nuevo Curso",
        "namePlaceholder": "Nombre del curso",
        "codePlaceholder": "Código del curso",
        "descriptionPlaceholder": "Descripción",
        "semestersPlaceholder": "Cantidad de semestres",
        "enrollmentValuePlaceholder": "Valor de la matrícula",
        "monthlyValuePlaceholder": "Cuota mensual",
        "installmentsPlaceholder": "Cantidad de cuotas",
        "modalityHelp": "Esta información define qué plantilla de certificado se utilizará para el curso.",
        "saveCourse": "Guardar Curso",
        "poles": {
          "label": "Sedes donde se ofrecerá este curso",
          "selectedCount": "{count, plural, one {# seleccionada} other {# seleccionadas}}",
          "none": "No hay ninguna sede registrada. Si la institución no trabaja con sedes, puede dejarlo sin selección por ahora.",
          "help": "El curso sigue perteneciendo a la institución, pero puede ofrecerse en tantas sedes como sea necesario."
        }
      },
      "registered": {
        "title": "Cursos registrados",
        "searchPlaceholder": "Buscar por nombre, código, descripción, valores, cuotas o sedes",
        "loading": "Cargando cursos...",
        "empty": "No se encontró ningún curso para esta búsqueda."
      },
      "cards": {
        "noPoles": "Sin sedes vinculadas",
        "courseId": "ID del curso",
        "createdAt": "Creado el",
        "createdBy": "Creado por",
        "deletedAt": "Eliminado el",
        "deletedBy": "Eliminado por",
        "restoreUntil": "Disponible para restaurar hasta",
        "lastRestoreDay": "⚠️ Último día para restaurar. Este curso dejará de estar disponible después de {date}.",
        "restoreWindow": "Los cursos eliminados permanecen disponibles para restauración durante un máximo de 3 días. Después de ese plazo, podrán eliminarse definitivamente del sistema."
      },
      "actions": {
        "viewStructure": "Ver estructura",
        "buildCurriculum": "Crear plan de estudios",
        "editPoles": "Editar sedes/unidades"
      },
      "editPoles": {
        "title": "Editar sedes y unidades",
        "noActivePoles": "No hay ninguna sede activa disponible.",
        "help": "Al desmarcar una unidad independiente, el curso se retirará y desactivará allí sin borrar el historial.",
        "save": "Guardar sedes"
      },
      "deleteModal": {
        "title": "Eliminar curso",
        "confirmation": "¿Realmente desea eliminar el curso <strong>{course}</strong>?",
        "help": "El curso solo se archivará y podrá restaurarse posteriormente.",
        "deleteCourse": "Eliminar curso"
      }
    },
    "detail": {
      "loading": "Cargando curso...",
      "notFound": "Curso no encontrado.",
      "header": {
        "title": "Estructura del Curso",
        "description": "Registre los semestres y vincule las asignaturas de cada semestre.",
        "backCourses": "Volver a Cursos"
      },
      "network": {
        "receivedTitle": "Curso recibido de la red",
        "synced": "Estructura sincronizada",
        "publishedBy": "Este curso fue publicado por <strong>{institution}</strong>.",
        "otherInstitution": "otra institución de la red",
        "controlledByOrigin": "El nombre, código, descripción, modalidad, semestres, asignaturas y cargas académicas son controlados por la institución de origen.",
        "localConfiguration": "Esta unidad solo puede configurar la matrícula, la cuota mensual, las cuotas y los datos operativos locales, como grupos, profesores, horarios, plazas y matrículas.",
        "originCourse": "Curso de origen",
        "originId": "ID de origen",
        "editRestriction": "En este curso recibido de la red, esta unidad solo puede modificar el valor de la matrícula, la cuota mensual y la cantidad de cuotas.",
        "academicStructureReceived": "Estructura académica recibida",
        "academicStructureHelp": "Los semestres de este curso son publicados y sincronizados por la institución de origen. Esta unidad puede consultarlos, pero no puede crear nuevos semestres ni modificar el plan de estudios."
      },
      "courseForm": {
        "namePlaceholder": "Nombre del curso",
        "semestersCount": "Cantidad de semestres del curso",
        "activeCourse": "Curso activo",
        "descriptionPlaceholder": "Descripción del curso",
        "saveLocalValues": "Guardar valores locales",
        "saveChanges": "Guardar cambios",
        "configureLocalValues": "Configurar valores locales",
        "editCourse": "Editar curso"
      },
      "courseInfo": {
        "expectedSemesters": "Cantidad prevista de semestres"
      },
      "semesters": {
        "addTitle": "Añadir semestre",
        "numberPlaceholder": "Número del semestre",
        "titlePlaceholder": "Título del semestre",
        "descriptionPlaceholder": "Descripción del semestre",
        "addButton": "Añadir semestre",
        "none": "Todavía no hay ningún semestre registrado para este curso.",
        "semesterLabel": "Semestre {number}",
        "minimumWorkload": "Carga mínima permitida en el semestre (horas)",
        "maximumWorkload": "Carga máxima permitida en el semestre (horas)",
        "saveWorkload": "Guardar carga"
      },
      "subjects": {
        "linkedTitle": "Asignaturas ya vinculadas",
        "noneLinked": "Todavía no hay ninguna asignatura vinculada.",
        "noneRegistered": "No hay asignaturas registradas.",
        "readOnlyNetwork": "Plan de estudios recibido de la red — solo lectura.",
        "updateSemester": "Actualizar asignaturas del semestre {number}"
      }
    },
    "messages": {
      "coursePolesUpdated": "Sedes del curso actualizadas correctamente.",
      "courseCreated": "¡Curso creado correctamente!",
      "courseDeleted": "Curso eliminado correctamente. Puede restaurarse posteriormente.",
      "courseRestored": "Curso restaurado correctamente.",
      "localValuesUpdated": "¡Valores locales actualizados correctamente!",
      "courseUpdated": "¡Curso actualizado correctamente!",
      "semesterCreated": "¡Semestre creado correctamente!",
      "subjectsSaved": "¡Asignaturas del semestre {semester} guardadas correctamente!",
      "workloadSaved": "¡Carga horaria guardada correctamente!"
    },
    "errors": {
      "loadCourses": "Error al cargar los cursos.",
      "loadPoles": "Error al cargar las sedes.",
      "updateCoursePoles": "Error al actualizar las sedes del curso.",
      "createCourse": "Error al crear el curso.",
      "deleteCourse": "Error al eliminar el curso.",
      "restoreCourse": "Error al restaurar el curso.",
      "couldNotSave": "No se pudo guardar",
      "loadSubjects": "Error al cargar las asignaturas.",
      "loadCourseSemesters": "Error al cargar los semestres del curso.",
      "loadCourseData": "Error al cargar los datos del curso.",
      "editCourse": "Error al editar el curso.",
      "createSemester": "Error al crear el semestre.",
      "saveSubjects": "Error al guardar las asignaturas.",
      "saveWorkload": "Error al guardar la carga horaria."
    },
    "validation": {
      "workloadRequired": "Complete la carga mínima y la carga máxima antes de guardar.",
      "workloadPositive": "La carga mínima y la carga máxima deben ser mayores que cero.",
      "workloadOrder": "La carga mínima no puede ser mayor que la carga máxima."
    }
  },
  "fr-FR": {
    "common": {
      "saving": "Enregistrement...",
      "adding": "Ajout...",
      "deleting": "Suppression...",
      "cancel": "Annuler",
      "delete": "Supprimer",
      "restore": "Restaurer",
      "understood": "Compris",
      "openWithArrow": "▼ Ouvrir",
      "closeWithArrow": "▲ Fermer",
      "code": "Code",
      "course": "Cours",
      "description": "Description",
      "modality": "Type / modalité du cours",
      "semesters": "Semestres",
      "enrollmentValue": "Frais d'inscription",
      "monthlyValue": "Mensualité",
      "installments": "Échéances",
      "poles": "Sites",
      "status": "Statut",
      "notInformed": "Non renseigné",
      "notInformedFeminine": "Non renseignée"
    },
    "status": {
      "active": "Actif",
      "inactive": "Inactif"
    },
    "filters": {
      "active": "Actifs",
      "deleted": "Supprimés",
      "all": "Tous"
    },
    "modalities": {
      "GERAL": "Général",
      "BACHARELADO": "Licence",
      "LICENCIATURA": "Licence d'enseignement",
      "TECNOLOGO": "Diplôme technologique",
      "POS_GRADUACAO": "Post-diplôme",
      "MBA": "MBA",
      "MESTRADO": "Master",
      "DOUTORADO": "Doctorat",
      "TECNICO": "Formation Technique",
      "CURSO_LIVRE": "Cours Libre",
      "OFICINA": "Atelier",
      "ENSINO_MEDIO": "Enseignement Secondaire",
      "ENSINO_FUNDAMENTAL": "Enseignement Primaire",
      "EDUCACAO_INFANTIL": "Éducation de la Petite Enfance",
      "PRE_ESCOLA": "Préscolaire",
      "EXTENSAO": "Formation d'Extension",
      "CAPACITACAO": "Perfectionnement",
      "TREINAMENTO": "Formation",
      "EJA": "Éducation des Adultes",
      "OUTRO": "Autre"
    },
    "list": {
      "header": {
        "title": "Cours",
        "description": "Créez et gérez les cours de l'établissement.",
        "backDashboard": "Retour au tableau de bord"
      },
      "create": {
        "title": "Nouveau Cours",
        "namePlaceholder": "Nom du cours",
        "codePlaceholder": "Code du cours",
        "descriptionPlaceholder": "Description",
        "semestersPlaceholder": "Nombre de semestres",
        "enrollmentValuePlaceholder": "Frais d'inscription",
        "monthlyValuePlaceholder": "Mensualité",
        "installmentsPlaceholder": "Nombre d'échéances",
        "modalityHelp": "Cette information détermine le modèle de certificat qui sera utilisé pour le cours.",
        "saveCourse": "Enregistrer le cours",
        "poles": {
          "label": "Sites où ce cours sera proposé",
          "selectedCount": "{count, plural, one {# sélectionné} other {# sélectionnés}}",
          "none": "Aucun site n'est enregistré. Si l'établissement ne travaille pas avec des sites, vous pouvez laisser ce champ vide pour le moment.",
          "help": "Le cours reste rattaché à l'établissement, mais peut être proposé sur autant de sites que nécessaire."
        }
      },
      "registered": {
        "title": "Cours enregistrés",
        "searchPlaceholder": "Rechercher par nom, code, description, montants, échéances ou sites",
        "loading": "Chargement des cours...",
        "empty": "Aucun cours trouvé pour cette recherche."
      },
      "cards": {
        "noPoles": "Aucun site associé",
        "courseId": "ID du cours",
        "createdAt": "Créé le",
        "createdBy": "Créé par",
        "deletedAt": "Supprimé le",
        "deletedBy": "Supprimé par",
        "restoreUntil": "Disponible pour restauration jusqu'au",
        "lastRestoreDay": "⚠️ Dernier jour pour restaurer. Ce cours ne sera plus disponible après le {date}.",
        "restoreWindow": "Les cours supprimés restent disponibles pour restauration pendant 3 jours maximum. Passé ce délai, ils pourront être supprimés définitivement du système."
      },
      "actions": {
        "viewStructure": "Voir la structure",
        "buildCurriculum": "Construire le programme",
        "editPoles": "Modifier les sites/unités"
      },
      "editPoles": {
        "title": "Modifier les sites et unités",
        "noActivePoles": "Aucun site actif disponible.",
        "help": "Lorsqu'une unité indépendante est décochée, le cours y sera retiré et désactivé sans supprimer l'historique.",
        "save": "Enregistrer les sites"
      },
      "deleteModal": {
        "title": "Supprimer le cours",
        "confirmation": "Voulez-vous vraiment supprimer le cours <strong>{course}</strong> ?",
        "help": "Le cours sera uniquement archivé et pourra être restauré ultérieurement.",
        "deleteCourse": "Supprimer le cours"
      }
    },
    "detail": {
      "loading": "Chargement du cours...",
      "notFound": "Cours introuvable.",
      "header": {
        "title": "Structure du Cours",
        "description": "Créez les semestres et associez les matières de chaque semestre.",
        "backCourses": "Retour aux Cours"
      },
      "network": {
        "receivedTitle": "Cours reçu du réseau",
        "synced": "Structure synchronisée",
        "publishedBy": "Ce cours a été publié par <strong>{institution}</strong>.",
        "otherInstitution": "un autre établissement du réseau",
        "controlledByOrigin": "Le nom, le code, la description, la modalité, les semestres, les matières et les charges académiques sont contrôlés par l'établissement d'origine.",
        "localConfiguration": "Cette unité peut uniquement configurer les frais d'inscription, la mensualité, les échéances et les données opérationnelles locales, telles que les classes, enseignants, horaires, places et inscriptions.",
        "originCourse": "Cours d'origine",
        "originId": "ID d'origine",
        "editRestriction": "Pour ce cours reçu du réseau, cette unité peut uniquement modifier les frais d'inscription, la mensualité et le nombre d'échéances.",
        "academicStructureReceived": "Structure académique reçue",
        "academicStructureHelp": "Les semestres de ce cours sont publiés et synchronisés par l'établissement d'origine. Cette unité peut les consulter, mais ne peut pas créer de nouveaux semestres ni modifier le programme."
      },
      "courseForm": {
        "namePlaceholder": "Nom du cours",
        "semestersCount": "Nombre de semestres du cours",
        "activeCourse": "Cours actif",
        "descriptionPlaceholder": "Description du cours",
        "saveLocalValues": "Enregistrer les valeurs locales",
        "saveChanges": "Enregistrer les modifications",
        "configureLocalValues": "Configurer les valeurs locales",
        "editCourse": "Modifier le cours"
      },
      "courseInfo": {
        "expectedSemesters": "Nombre prévu de semestres"
      },
      "semesters": {
        "addTitle": "Ajouter un semestre",
        "numberPlaceholder": "Numéro du semestre",
        "titlePlaceholder": "Titre du semestre",
        "descriptionPlaceholder": "Description du semestre",
        "addButton": "Ajouter un semestre",
        "none": "Aucun semestre n'est encore enregistré pour ce cours.",
        "semesterLabel": "Semestre {number}",
        "minimumWorkload": "Charge minimale autorisée pour le semestre (heures)",
        "maximumWorkload": "Charge maximale autorisée pour le semestre (heures)",
        "saveWorkload": "Enregistrer la charge"
      },
      "subjects": {
        "linkedTitle": "Matières déjà associées",
        "noneLinked": "Aucune matière n'est encore associée.",
        "noneRegistered": "Aucune matière enregistrée.",
        "readOnlyNetwork": "Programme reçu du réseau — lecture seule.",
        "updateSemester": "Mettre à jour les matières du semestre {number}"
      }
    },
    "messages": {
      "coursePolesUpdated": "Sites du cours mis à jour avec succès.",
      "courseCreated": "Cours créé avec succès !",
      "courseDeleted": "Cours supprimé avec succès. Il pourra être restauré ultérieurement.",
      "courseRestored": "Cours restauré avec succès.",
      "localValuesUpdated": "Valeurs locales mises à jour avec succès !",
      "courseUpdated": "Cours mis à jour avec succès !",
      "semesterCreated": "Semestre créé avec succès !",
      "subjectsSaved": "Matières du semestre {semester} enregistrées avec succès !",
      "workloadSaved": "Charge horaire enregistrée avec succès !"
    },
    "errors": {
      "loadCourses": "Impossible de charger les cours.",
      "loadPoles": "Impossible de charger les sites.",
      "updateCoursePoles": "Impossible de mettre à jour les sites du cours.",
      "createCourse": "Impossible de créer le cours.",
      "deleteCourse": "Impossible de supprimer le cours.",
      "restoreCourse": "Impossible de restaurer le cours.",
      "couldNotSave": "Impossible d'enregistrer",
      "loadSubjects": "Impossible de charger les matières.",
      "loadCourseSemesters": "Impossible de charger les semestres du cours.",
      "loadCourseData": "Impossible de charger les données du cours.",
      "editCourse": "Impossible de modifier le cours.",
      "createSemester": "Impossible de créer le semestre.",
      "saveSubjects": "Impossible d'enregistrer les matières.",
      "saveWorkload": "Impossible d'enregistrer la charge horaire."
    },
    "validation": {
      "workloadRequired": "Renseignez la charge minimale et la charge maximale avant d'enregistrer.",
      "workloadPositive": "La charge minimale et la charge maximale doivent être supérieures à zéro.",
      "workloadOrder": "La charge minimale ne peut pas être supérieure à la charge maximale."
    }
  }
};

function mergeDeep(target, source) {
  if (
    target &&
    source &&
    typeof target === "object" &&
    typeof source === "object" &&
    !Array.isArray(target) &&
    !Array.isArray(source)
  ) {
    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        result[key] = mergeDeep(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  return source;
}

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  json.AdminCourses = mergeDeep(
    json.AdminCourses || {},
    translations[locale]
  );

  fs.writeFileSync(
    file,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8"
  );

  console.log(`OK: ${locale}`);
}

console.log("Traduções das páginas de Cursos atualizadas.");
