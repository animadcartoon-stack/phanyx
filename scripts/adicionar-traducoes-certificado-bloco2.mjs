import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    paper: {
      orientation: {
        portrait: "Retrato",
        landscape: "Paisagem"
      }
    },
    models: {
      dateUnavailable: "Data não disponível"
    },
    modalities: {
      GERAL: "Geral",
      BACHARELADO: "Bacharelado",
      LICENCIATURA: "Licenciatura",
      TECNOLOGO: "Tecnólogo",
      POS_GRADUACAO: "Pós-graduação",
      MBA: "MBA",
      MESTRADO: "Mestrado",
      DOUTORADO: "Doutorado",
      TECNICO: "Curso Técnico",
      CURSO_LIVRE: "Curso Livre",
      OFICINA: "Oficina",
      ENSINO_MEDIO: "Ensino Médio",
      ENSINO_FUNDAMENTAL: "Ensino Fundamental",
      EDUCACAO_INFANTIL: "Educação Infantil",
      PRE_ESCOLA: "Pré-escola",
      EXTENSAO: "Extensão",
      CAPACITACAO: "Capacitação",
      TREINAMENTO: "Treinamento",
      EJA: "EJA",
      OUTRO: "Outro"
    }
  },

  "pt-PT": {
    paper: {
      orientation: {
        portrait: "Retrato",
        landscape: "Paisagem"
      }
    },
    models: {
      dateUnavailable: "Data não disponível"
    },
    modalities: {
      GERAL: "Geral",
      BACHARELADO: "Licenciatura",
      LICENCIATURA: "Licenciatura",
      TECNOLOGO: "Curso Tecnológico",
      POS_GRADUACAO: "Pós-graduação",
      MBA: "MBA",
      MESTRADO: "Mestrado",
      DOUTORADO: "Doutoramento",
      TECNICO: "Curso Técnico",
      CURSO_LIVRE: "Curso Livre",
      OFICINA: "Oficina",
      ENSINO_MEDIO: "Ensino Secundário",
      ENSINO_FUNDAMENTAL: "Ensino Básico",
      EDUCACAO_INFANTIL: "Educação Pré-escolar",
      PRE_ESCOLA: "Pré-escola",
      EXTENSAO: "Extensão",
      CAPACITACAO: "Capacitação",
      TREINAMENTO: "Formação",
      EJA: "Educação de Adultos",
      OUTRO: "Outro"
    }
  },

  "en-US": {
    paper: {
      orientation: {
        portrait: "Portrait",
        landscape: "Landscape"
      }
    },
    models: {
      dateUnavailable: "Date unavailable"
    },
    modalities: {
      GERAL: "General",
      BACHARELADO: "Bachelor's Degree",
      LICENCIATURA: "Teaching Degree",
      TECNOLOGO: "Technology Degree",
      POS_GRADUACAO: "Postgraduate",
      MBA: "MBA",
      MESTRADO: "Master's Degree",
      DOUTORADO: "Doctorate",
      TECNICO: "Technical Course",
      CURSO_LIVRE: "Non-degree Course",
      OFICINA: "Workshop",
      ENSINO_MEDIO: "High School",
      ENSINO_FUNDAMENTAL: "Elementary School",
      EDUCACAO_INFANTIL: "Early Childhood Education",
      PRE_ESCOLA: "Preschool",
      EXTENSAO: "Extension Course",
      CAPACITACAO: "Professional Development",
      TREINAMENTO: "Training",
      EJA: "Adult Education",
      OUTRO: "Other"
    }
  },

  "es-ES": {
    paper: {
      orientation: {
        portrait: "Vertical",
        landscape: "Horizontal"
      }
    },
    models: {
      dateUnavailable: "Fecha no disponible"
    },
    modalities: {
      GERAL: "General",
      BACHARELADO: "Grado",
      LICENCIATURA: "Licenciatura",
      TECNOLOGO: "Grado Tecnológico",
      POS_GRADUACAO: "Posgrado",
      MBA: "MBA",
      MESTRADO: "Máster",
      DOUTORADO: "Doctorado",
      TECNICO: "Curso Técnico",
      CURSO_LIVRE: "Curso Libre",
      OFICINA: "Taller",
      ENSINO_MEDIO: "Educación Secundaria",
      ENSINO_FUNDAMENTAL: "Educación Primaria",
      EDUCACAO_INFANTIL: "Educación Infantil",
      PRE_ESCOLA: "Preescolar",
      EXTENSAO: "Curso de Extensión",
      CAPACITACAO: "Capacitación",
      TREINAMENTO: "Formación",
      EJA: "Educación de Adultos",
      OUTRO: "Otro"
    }
  },

  "fr-FR": {
    paper: {
      orientation: {
        portrait: "Portrait",
        landscape: "Paysage"
      }
    },
    models: {
      dateUnavailable: "Date indisponible"
    },
    modalities: {
      GERAL: "Général",
      BACHARELADO: "Licence",
      LICENCIATURA: "Licence d'enseignement",
      TECNOLOGO: "Diplôme technologique",
      POS_GRADUACAO: "Études supérieures",
      MBA: "MBA",
      MESTRADO: "Master",
      DOUTORADO: "Doctorat",
      TECNICO: "Formation technique",
      CURSO_LIVRE: "Formation libre",
      OFICINA: "Atelier",
      ENSINO_MEDIO: "Enseignement secondaire",
      ENSINO_FUNDAMENTAL: "Enseignement primaire",
      EDUCACAO_INFANTIL: "Éducation de la petite enfance",
      PRE_ESCOLA: "Préscolaire",
      EXTENSAO: "Formation d'extension",
      CAPACITACAO: "Perfectionnement professionnel",
      TREINAMENTO: "Formation",
      EJA: "Éducation des adultes",
      OUTRO: "Autre"
    }
  }
};

function objeto(valor) {
  return valor && typeof valor === "object" && !Array.isArray(valor);
}

function mergeProfundo(destino, origem) {
  const resultado = objeto(destino) ? { ...destino } : {};

  for (const [chave, valor] of Object.entries(origem)) {
    if (objeto(valor)) {
      resultado[chave] = mergeProfundo(resultado[chave], valor);
    } else {
      resultado[chave] = valor;
    }
  }

  return resultado;
}

for (const [locale, patch] of Object.entries(traducoes)) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    throw new Error(`Arquivo não encontrado: ${arquivo}`);
  }

  const original = fs.readFileSync(arquivo, "utf8");
  const dados = JSON.parse(original);

  const backup = `${arquivo}.antes-certificado-bloco2.bak`;

  if (!fs.existsSync(backup)) {
    fs.writeFileSync(backup, original, "utf8");
  }

  dados.AdminCertificateEditor = mergeProfundo(
    dados.AdminCertificateEditor || {},
    patch
  );

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(dados, null, 2)}\n`,
    "utf8"
  );

  console.log(`OK: ${locale}`);
}

console.log("Traduções-base do Editor de Certificados atualizadas.");
