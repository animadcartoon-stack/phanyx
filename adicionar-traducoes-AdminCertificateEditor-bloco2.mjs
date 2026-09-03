import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
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
    "paper": {
      "orientation": {
        "landscape": "Paisagem",
        "portrait": "Retrato"
      }
    },
    "models": {
      "dateUnavailable": "Data não disponível"
    }
  },
  "pt-PT": {
    "modalities": {
      "GERAL": "Geral",
      "BACHARELADO": "Bacharelato",
      "LICENCIATURA": "Licenciatura",
      "TECNOLOGO": "Curso Tecnológico",
      "POS_GRADUACAO": "Pós-graduação",
      "MBA": "MBA",
      "MESTRADO": "Mestrado",
      "DOUTORADO": "Doutoramento",
      "TECNICO": "Curso Técnico",
      "CURSO_LIVRE": "Curso Livre",
      "OFICINA": "Oficina",
      "ENSINO_MEDIO": "Ensino Secundário",
      "ENSINO_FUNDAMENTAL": "Ensino Básico",
      "EDUCACAO_INFANTIL": "Educação Infantil",
      "PRE_ESCOLA": "Pré-escolar",
      "EXTENSAO": "Extensão",
      "CAPACITACAO": "Capacitação",
      "TREINAMENTO": "Formação",
      "EJA": "EJA",
      "OUTRO": "Outro"
    },
    "paper": {
      "orientation": {
        "landscape": "Paisagem",
        "portrait": "Retrato"
      }
    },
    "models": {
      "dateUnavailable": "Data não disponível"
    }
  },
  "en-US": {
    "modalities": {
      "GERAL": "General",
      "BACHARELADO": "Bachelor's degree",
      "LICENCIATURA": "Teaching degree",
      "TECNOLOGO": "Technology degree",
      "POS_GRADUACAO": "Postgraduate",
      "MBA": "MBA",
      "MESTRADO": "Master's degree",
      "DOUTORADO": "Doctorate",
      "TECNICO": "Technical course",
      "CURSO_LIVRE": "Open course",
      "OFICINA": "Workshop",
      "ENSINO_MEDIO": "High school",
      "ENSINO_FUNDAMENTAL": "Elementary school",
      "EDUCACAO_INFANTIL": "Early childhood education",
      "PRE_ESCOLA": "Preschool",
      "EXTENSAO": "Extension course",
      "CAPACITACAO": "Professional development",
      "TREINAMENTO": "Training",
      "EJA": "Youth and adult education",
      "OUTRO": "Other"
    },
    "paper": {
      "orientation": {
        "landscape": "Landscape",
        "portrait": "Portrait"
      }
    },
    "models": {
      "dateUnavailable": "Date unavailable"
    }
  },
  "es-ES": {
    "modalities": {
      "GERAL": "General",
      "BACHARELADO": "Grado",
      "LICENCIATURA": "Licenciatura",
      "TECNOLOGO": "Tecnólogo",
      "POS_GRADUACAO": "Posgrado",
      "MBA": "MBA",
      "MESTRADO": "Máster",
      "DOUTORADO": "Doctorado",
      "TECNICO": "Curso técnico",
      "CURSO_LIVRE": "Curso libre",
      "OFICINA": "Taller",
      "ENSINO_MEDIO": "Educación secundaria",
      "ENSINO_FUNDAMENTAL": "Educación primaria",
      "EDUCACAO_INFANTIL": "Educación infantil",
      "PRE_ESCOLA": "Preescolar",
      "EXTENSAO": "Extensión",
      "CAPACITACAO": "Capacitación",
      "TREINAMENTO": "Formación",
      "EJA": "Educación de jóvenes y adultos",
      "OUTRO": "Otro"
    },
    "paper": {
      "orientation": {
        "landscape": "Horizontal",
        "portrait": "Vertical"
      }
    },
    "models": {
      "dateUnavailable": "Fecha no disponible"
    }
  },
  "fr-FR": {
    "modalities": {
      "GERAL": "Général",
      "BACHARELADO": "Licence",
      "LICENCIATURA": "Licence d'enseignement",
      "TECNOLOGO": "Diplôme technologique",
      "POS_GRADUACAO": "Études supérieures",
      "MBA": "MBA",
      "MESTRADO": "Master",
      "DOUTORADO": "Doctorat",
      "TECNICO": "Formation technique",
      "CURSO_LIVRE": "Cours libre",
      "OFICINA": "Atelier",
      "ENSINO_MEDIO": "Enseignement secondaire",
      "ENSINO_FUNDAMENTAL": "Enseignement primaire",
      "EDUCACAO_INFANTIL": "Éducation de la petite enfance",
      "PRE_ESCOLA": "Préscolaire",
      "EXTENSAO": "Formation continue",
      "CAPACITACAO": "Perfectionnement",
      "TREINAMENTO": "Formation",
      "EJA": "Éducation des jeunes et des adultes",
      "OUTRO": "Autre"
    },
    "paper": {
      "orientation": {
        "landscape": "Paysage",
        "portrait": "Portrait"
      }
    },
    "models": {
      "dateUnavailable": "Date indisponible"
    }
  }
};

function mergeProfundo(destino, origem) {
  for (const [chave, valor] of Object.entries(origem)) {
    if (
      valor &&
      typeof valor === "object" &&
      !Array.isArray(valor)
    ) {
      destino[chave] = mergeProfundo(
        destino[chave] &&
        typeof destino[chave] === "object" &&
        !Array.isArray(destino[chave])
          ? destino[chave]
          : {},
        valor
      );
    } else {
      destino[chave] = valor;
    }
  }

  return destino;
}

for (const locale of ["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"]) {
  const arquivo = path.join(process.cwd(), "messages", `${locale}.json`);

  if (!fs.existsSync(arquivo)) {
    console.error(`✗ ${locale}: arquivo não encontrado`);
    process.exitCode = 1;
    continue;
  }

  const atual = JSON.parse(fs.readFileSync(arquivo, "utf8"));

  atual.AdminCertificateEditor = mergeProfundo(
    atual.AdminCertificateEditor || {},
    traducoes[locale]
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(atual, null, 2) + "\n",
    "utf8"
  );

  console.log(`✓ ${locale}: AdminCertificateEditor bloco 2 atualizado`);
}

console.log("\nConcluído.");
