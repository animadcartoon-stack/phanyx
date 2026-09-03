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
    header: {
      title: "Contratos",
      description:
        "Gere contratos automaticamente com dados da instituição, aluno, curso e disciplinas.",
    },
    student: {
      sectionTitle: "Selecionar aluno",
      searchLabel: "Buscar aluno",
      searchPlaceholder: "Digite nome, matrícula ou email",
      loading: "Buscando alunos...",
      selectLabel: "Selecionar aluno",
      selectOption: "Selecione um aluno",
    },
    contract: {
      generating: "Gerando contrato...",
      previewTitle: "Pré-visualização do contrato",
      notesTitle: "Observações contratuais",
    },
    summary: {
      title: "Resumo do contrato",
      institution: "Instituição",
      student: "Aluno",
      cpf: "CPF",
      enrollment: "Matrícula",
      course: "Curso",
      contractValue: "Valor do contrato",
      signingCity: "Cidade de assinatura",
      legalRepresentative: "Responsável legal",
    },
    actions: {
      generatePdf: "Gerar PDF do contrato",
      alreadySigned: "Contrato já assinado",
      sending: "Enviando...",
      sendForSignature: "Enviar para assinatura",
    },
    subjects: {
      title: "Disciplinas contratadas",
      none: "Nenhuma disciplina encontrada.",
    },
    messages: {
      generateBeforeSending:
        "Gere o contrato antes de enviar para assinatura.",
      sentForSignature:
        "Contrato enviado para assinatura com sucesso.",
    },
    errors: {
      searchStudents: "Erro ao buscar alunos.",
      generateContract: "Erro ao gerar contrato.",
      sendForSignature: "Erro ao enviar contrato para assinatura.",
    },
  },

  "pt-PT": {
    header: {
      title: "Contratos",
      description:
        "Gere contratos automaticamente com dados da instituição, aluno, curso e unidades curriculares.",
    },
    student: {
      sectionTitle: "Selecionar aluno",
      searchLabel: "Procurar aluno",
      searchPlaceholder: "Introduza nome, matrícula ou email",
      loading: "A procurar alunos...",
      selectLabel: "Selecionar aluno",
      selectOption: "Selecione um aluno",
    },
    contract: {
      generating: "A gerar contrato...",
      previewTitle: "Pré-visualização do contrato",
      notesTitle: "Observações contratuais",
    },
    summary: {
      title: "Resumo do contrato",
      institution: "Instituição",
      student: "Aluno",
      cpf: "CPF",
      enrollment: "Matrícula",
      course: "Curso",
      contractValue: "Valor do contrato",
      signingCity: "Cidade de assinatura",
      legalRepresentative: "Responsável legal",
    },
    actions: {
      generatePdf: "Gerar PDF do contrato",
      alreadySigned: "Contrato já assinado",
      sending: "A enviar...",
      sendForSignature: "Enviar para assinatura",
    },
    subjects: {
      title: "Unidades curriculares contratadas",
      none: "Nenhuma unidade curricular encontrada.",
    },
    messages: {
      generateBeforeSending:
        "Gere o contrato antes de o enviar para assinatura.",
      sentForSignature:
        "Contrato enviado para assinatura com sucesso.",
    },
    errors: {
      searchStudents: "Erro ao procurar alunos.",
      generateContract: "Erro ao gerar contrato.",
      sendForSignature: "Erro ao enviar o contrato para assinatura.",
    },
  },

  "en-US": {
    header: {
      title: "Contracts",
      description:
        "Generate contracts automatically using institution, student, course, and subject data.",
    },
    student: {
      sectionTitle: "Select student",
      searchLabel: "Search student",
      searchPlaceholder: "Enter name, enrollment number, or email",
      loading: "Searching students...",
      selectLabel: "Select student",
      selectOption: "Select a student",
    },
    contract: {
      generating: "Generating contract...",
      previewTitle: "Contract preview",
      notesTitle: "Contract notes",
    },
    summary: {
      title: "Contract summary",
      institution: "Institution",
      student: "Student",
      cpf: "CPF",
      enrollment: "Enrollment",
      course: "Course",
      contractValue: "Contract value",
      signingCity: "Signing city",
      legalRepresentative: "Legal representative",
    },
    actions: {
      generatePdf: "Generate contract PDF",
      alreadySigned: "Contract already signed",
      sending: "Sending...",
      sendForSignature: "Send for signature",
    },
    subjects: {
      title: "Contracted subjects",
      none: "No subjects found.",
    },
    messages: {
      generateBeforeSending:
        "Generate the contract before sending it for signature.",
      sentForSignature:
        "Contract sent for signature successfully.",
    },
    errors: {
      searchStudents: "Unable to search students.",
      generateContract: "Unable to generate the contract.",
      sendForSignature: "Unable to send the contract for signature.",
    },
  },

  "es-ES": {
    header: {
      title: "Contratos",
      description:
        "Genere contratos automáticamente con datos de la institución, el estudiante, el curso y las asignaturas.",
    },
    student: {
      sectionTitle: "Seleccionar estudiante",
      searchLabel: "Buscar estudiante",
      searchPlaceholder: "Introduzca nombre, matrícula o correo electrónico",
      loading: "Buscando estudiantes...",
      selectLabel: "Seleccionar estudiante",
      selectOption: "Seleccione un estudiante",
    },
    contract: {
      generating: "Generando contrato...",
      previewTitle: "Vista previa del contrato",
      notesTitle: "Observaciones contractuales",
    },
    summary: {
      title: "Resumen del contrato",
      institution: "Institución",
      student: "Estudiante",
      cpf: "CPF",
      enrollment: "Matrícula",
      course: "Curso",
      contractValue: "Valor del contrato",
      signingCity: "Ciudad de firma",
      legalRepresentative: "Representante legal",
    },
    actions: {
      generatePdf: "Generar PDF del contrato",
      alreadySigned: "Contrato ya firmado",
      sending: "Enviando...",
      sendForSignature: "Enviar para firma",
    },
    subjects: {
      title: "Asignaturas contratadas",
      none: "No se encontraron asignaturas.",
    },
    messages: {
      generateBeforeSending:
        "Genere el contrato antes de enviarlo para firma.",
      sentForSignature:
        "Contrato enviado para firma correctamente.",
    },
    errors: {
      searchStudents: "Error al buscar estudiantes.",
      generateContract: "Error al generar el contrato.",
      sendForSignature: "Error al enviar el contrato para firma.",
    },
  },

  "fr-FR": {
    header: {
      title: "Contrats",
      description:
        "Générez automatiquement des contrats à partir des données de l’établissement, de l’étudiant, du cursus et des matières.",
    },
    student: {
      sectionTitle: "Sélectionner un étudiant",
      searchLabel: "Rechercher un étudiant",
      searchPlaceholder: "Saisissez le nom, le numéro d’inscription ou l’e-mail",
      loading: "Recherche des étudiants...",
      selectLabel: "Sélectionner un étudiant",
      selectOption: "Sélectionnez un étudiant",
    },
    contract: {
      generating: "Génération du contrat...",
      previewTitle: "Aperçu du contrat",
      notesTitle: "Observations contractuelles",
    },
    summary: {
      title: "Résumé du contrat",
      institution: "Établissement",
      student: "Étudiant",
      cpf: "CPF",
      enrollment: "Inscription",
      course: "Cursus",
      contractValue: "Valeur du contrat",
      signingCity: "Ville de signature",
      legalRepresentative: "Représentant légal",
    },
    actions: {
      generatePdf: "Générer le PDF du contrat",
      alreadySigned: "Contrat déjà signé",
      sending: "Envoi en cours...",
      sendForSignature: "Envoyer pour signature",
    },
    subjects: {
      title: "Matières contractuelles",
      none: "Aucune matière trouvée.",
    },
    messages: {
      generateBeforeSending:
        "Générez le contrat avant de l’envoyer pour signature.",
      sentForSignature:
        "Contrat envoyé pour signature avec succès.",
    },
    errors: {
      searchStudents: "Impossible de rechercher les étudiants.",
      generateContract: "Impossible de générer le contrat.",
      sendForSignature: "Impossible d’envoyer le contrat pour signature.",
    },
  },
};

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  json.AdminContracts = {
    ...(json.AdminContracts || {}),
    ...translations[locale],
  };

  fs.writeFileSync(
    file,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8",
  );

  console.log(`OK: ${locale}`);
}

console.log("Traduções da página de Contratos atualizadas.");
