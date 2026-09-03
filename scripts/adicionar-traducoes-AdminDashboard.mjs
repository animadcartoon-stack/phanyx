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
    title: "Dashboard do Aluno",
    description: "Visão geral da sua jornada acadêmica",
    cards: {
      subjects: "Disciplinas",
      semesters: "Semestres",
      certificates: "Certificados",
    },
  },

  "pt-PT": {
    title: "Painel do Aluno",
    description: "Visão geral do seu percurso académico",
    cards: {
      subjects: "Unidades curriculares",
      semesters: "Semestres",
      certificates: "Certificados",
    },
  },

  "en-US": {
    title: "Student Dashboard",
    description: "Overview of your academic journey",
    cards: {
      subjects: "Subjects",
      semesters: "Semesters",
      certificates: "Certificates",
    },
  },

  "es-ES": {
    title: "Panel del Estudiante",
    description: "Resumen de su trayectoria académica",
    cards: {
      subjects: "Asignaturas",
      semesters: "Semestres",
      certificates: "Certificados",
    },
  },

  "fr-FR": {
    title: "Tableau de bord de l’étudiant",
    description: "Vue d’ensemble de votre parcours académique",
    cards: {
      subjects: "Matières",
      semesters: "Semestres",
      certificates: "Certificats",
    },
  },
};

for (const [locale, file] of Object.entries(files)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Arquivo não encontrado: ${file}`);
  }

  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  json.AdminDashboard = {
    ...(json.AdminDashboard || {}),
    ...translations[locale],
  };

  fs.writeFileSync(
    file,
    `${JSON.stringify(json, null, 2)}\n`,
    "utf8",
  );

  console.log(`OK: ${locale}`);
}

console.log("Traduções do Dashboard atualizadas.");
