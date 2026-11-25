import institution from './institution-walkthrough.json' with {type:'json'};

export const guideImages = {
  'guide-admin-professores-acessos': {
    0:{file:'demo-teaching-access-search-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-access-controls-pt-br.jpg',demo:true,step:1}
  },
  'guide-admin-acompanhamento-aulas': {
    0:{file:'demo-teaching-planning-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-development-pt-br.jpg',demo:true,step:1},
    2:{file:'demo-teaching-requirements-pt-br.jpg',demo:true,step:2}
  },
  'guide-admin-substituicoes-docentes': {
    0:{file:'demo-teaching-substitution-list-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-substitution-form-pt-br.jpg',demo:true,step:1}
  },
  'guide-admin-academico-publicacoes': {
    0:{file:'demo-teaching-publication-list-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-publication-fields-pt-br.jpg',demo:true,step:1},
    2:{file:'demo-teaching-publication-submit-pt-br.jpg',demo:true,step:2}
  },
  'guide-admin-academico-publicacoes-nova': {
    0:{file:'demo-teaching-publication-fields-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-publication-submit-pt-br.jpg',demo:true,step:1}
  },
  'guide-coordination-development': {0:{file:'demo-teaching-development-pt-br.jpg',demo:true,step:0}},
  'guide-coordination-requirements': {0:{file:'demo-teaching-requirements-pt-br.jpg',demo:true,step:0}},
  'guide-admin-polos': {
    0:{file:'settings-poles-identity-pt-br.jpg',step:1},
    1:{file:'settings-poles-address-pt-br.jpg',step:4},
    2:{file:'settings-poles-responsible-pt-br.jpg',step:7}
  },
  'guide-first-setup': {0:{file:'demo-institution-identity-pt-br.jpg',demo:true,step:0}},
  'guide-admin-configuracoes-instituicao': institution.figures,
  'guide-institution-signature': {
    0:{file:'demo-institution-signature-pt-br.jpg',demo:true,step:0}
  },
  'guide-institution-letterhead': {0:{file:'demo-institution-letterhead-simple-pt-br.jpg',demo:true,step:0},1:{file:'demo-institution-letterhead-models-pt-br.jpg',demo:true,step:1},2:{file:'demo-institution-letterhead-preview-pt-br.jpg',demo:true,step:2}},
  'guide-admin-configuracoes-contas-financeiras': {0:{file:'settings-financial-account-pt-br.jpg',step:0}},
  'guide-admin-configuracoes-portais': {0:{file:'demo-settings-portals-pt-br.jpg',demo:true,step:0},1:{file:'demo-settings-portals-save-pt-br.jpg',demo:true,step:2}},
  'guide-admin-atividades-externas-nova': {
    0:{localized:'manual-external-basics-'},
    1:{localized:'manual-external-destination-'},
    2:{localized:'manual-external-dates-'},
    3:{localized:'manual-external-rules-'}
  },
  'guide-admin-atividades-externas': {
    0:{localized:'manual-external-basics-'},
    1:{localized:'manual-external-destination-'},
    2:{localized:'manual-external-dates-'},
    3:{localized:'manual-external-rules-'}
  },
  'guide-admin-departamentos': {0:{file:'manual-departments-pt-br.jpg'}},
  'guide-roles': {0:{file:'manual-departments-pt-br.jpg'}},
  'guide-permissions': {0:{file:'manual-permissions-pt-br.jpg'}},
  'admin-login': {0:{localized:'phanyx-admin-'}},
  'teacher-login': {0:{localized:'phanyx-teacher-'}},
  'student-login': {0:{localized:'phanyx-student-'}},
  reset: {1:{localized:'phanyx-reset-'}},
  access: {0:{localized:'phanyx-admin-'}},
  templates: {1:{file:'template-fields.png'}},
  'teacher-docs': {1:{file:'plan-preview.png'}},
  'send-plan': {
    0:{file:'demo-teaching-documents-list-pt-br.jpg',demo:true,step:0},
    1:{file:'demo-teaching-pdf-editor-pt-br.jpg',demo:true,step:2}
  },
  courses: {
    0:{file:'guide-course-form.webp', caption:'courseForm'},
    2:{file:'guide-course-save.webp', caption:'courseSave'}
  },
  classes: {0:{file:'guide-class-form.webp', caption:'classForm'}},
  enrollment: {0:{file:'guide-enrollment-form.webp', caption:'enrollmentForm'}},
  attendance: {2:{file:'guide-attendance-controls.webp', caption:'attendanceControls'}},
  materials: {2:{file:'guide-teacher-materials.webp', caption:'teacherMaterials'}},
  subjects: {1:{file:'guide-student-subjects.webp', caption:'studentSubjects'}},
  assignments: {2:{file:'guide-student-assignment.webp', caption:'studentAssignment'}},
  grades: {
    0:{file:'guide-student-grades.webp', caption:'studentGrades'},
    2:{file:'guide-student-attendance.webp', caption:'studentAttendance'}
  },
  certificates: {0:{file:'guide-student-certificates.webp', caption:'studentCertificates'}}
};

export const imageCaptions = {
  en: {
    archived:'Example from an earlier interface in Brazilian Portuguese.',
    courseForm:'In Courses, find the New Course form and the course name field.',
    courseSave:'Use Save Course, then look in the registered courses list.',
    classForm:'In Classes, find the New class form and the Create class button.',
    enrollmentForm:'In New enrollment, start with the student and the course.',
    attendanceControls:'Use the attendance and notes fields, then save attendance.',
    teacherMaterials:'Use the materials button on the relevant lesson.',
    studentSubjects:'Open Subjects, then use the link on the subject card.',
    studentAssignment:'Check the confirmation message after submitting your work.',
    studentGrades:'Open Grades from the student menu.',
    studentAttendance:'Review the attendance totals at the top of the page.',
    studentCertificates:'Open Certificates from the student menu.'
  },
  'pt-br': {
    archived:'Exemplo de uma versão anterior da interface em português do Brasil.',
    courseForm:'Em Cursos, localize o formulário Novo Curso e o campo Nome do curso.',
    courseSave:'Clique em Salvar Curso e confira a lista de cursos cadastrados.',
    classForm:'Em Turmas, localize o formulário Nova turma e o botão Criar turma.',
    enrollmentForm:'Em Nova matrícula, comece selecionando o aluno e o curso.',
    attendanceControls:'Use os campos de presença e observação e salve a chamada.',
    teacherMaterials:'Use o botão Materiais na aula correspondente.',
    studentSubjects:'Abra Disciplinas e clique no link do cartão da disciplina.',
    studentAssignment:'Confira a mensagem de confirmação depois de enviar o trabalho.',
    studentGrades:'Abra Boletim no menu do aluno.',
    studentAttendance:'Confira os totais de frequência no início da página.',
    studentCertificates:'Abra Certificados no menu do aluno.'
  },
  'pt-pt': {
    archived:'Exemplo de uma versão anterior da interface em português do Brasil.',
    courseForm:'Em Cursos, localize o formulário de novo curso e o campo do nome.',
    courseSave:'Guarde o curso e consulte a lista de cursos registados.',
    classForm:'Em Turmas, localize o formulário de nova turma e o botão para a criar.',
    enrollmentForm:'Na nova inscrição, comece por selecionar o estudante e o curso.',
    attendanceControls:'Use os campos de presença e observação e guarde o registo.',
    teacherMaterials:'Selecione o botão de materiais da aula correspondente.',
    studentSubjects:'Abra Disciplinas e selecione a ligação no cartão da disciplina.',
    studentAssignment:'Confirme a mensagem apresentada após a entrega do trabalho.',
    studentGrades:'Abra a área de classificações no menu do estudante.',
    studentAttendance:'Consulte os totais de assiduidade no início da página.',
    studentCertificates:'Abra Certificados no menu do estudante.'
  },
  es: {
    archived:'Ejemplo de una versión anterior de la interfaz en portugués de Brasil.',
    courseForm:'En Cursos, localiza el formulario de nuevo curso y el campo del nombre.',
    courseSave:'Guarda el curso y comprueba la lista de cursos registrados.',
    classForm:'En Grupos, localiza el formulario de alta y el botón de creación.',
    enrollmentForm:'En la nueva matrícula, empieza por seleccionar el estudiante y el curso.',
    attendanceControls:'Usa los campos de asistencia y observaciones y guarda el registro.',
    teacherMaterials:'Selecciona el botón de materiales de la clase correspondiente.',
    studentSubjects:'Abre Asignaturas y selecciona el enlace de la ficha correspondiente.',
    studentAssignment:'Comprueba el mensaje de confirmación después de entregar tu trabajo.',
    studentGrades:'Abre Calificaciones desde el menú del estudiante.',
    studentAttendance:'Comprueba el resumen de asistencia al inicio de la página.',
    studentCertificates:'Abre Certificados desde el menú del estudiante.'
  },
  fr: {
    archived:'Exemple tiré d’une version antérieure de l’interface en portugais du Brésil.',
    courseForm:'Dans Cours, repérez le formulaire de création et le champ du nom.',
    courseSave:'Enregistrez le cours, puis vérifiez la liste des cours enregistrés.',
    classForm:'Dans Classes, repérez le formulaire de création et son bouton.',
    enrollmentForm:'Dans la nouvelle inscription, sélectionnez d’abord l’étudiant et le cours.',
    attendanceControls:'Utilisez les champs de présence et d’observation, puis enregistrez l’appel.',
    teacherMaterials:'Utilisez le bouton des ressources de la séance concernée.',
    studentSubjects:'Ouvrez Matières, puis sélectionnez le lien sur la fiche de la matière.',
    studentAssignment:'Vérifiez le message de confirmation après avoir remis le devoir.',
    studentGrades:'Ouvrez Notes depuis le menu étudiant.',
    studentAttendance:'Consultez le récapitulatif des présences en haut de la page.',
    studentCertificates:'Ouvrez Certificats depuis le menu étudiant.'
  }
};
