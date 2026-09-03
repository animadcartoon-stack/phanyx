import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    loading: "Carregando editor de certificados...",
    toast: {
      errorTitle: "Não foi possível concluir",
      successTitle: "Tudo certo"
    },
    freeForm: {
      creationCancelled: "Criação da forma livre cancelada.",
      created: "Forma livre criada. Agora você pode editar pontos e tangentes.",
      pointCreated: "Ponto {count} criado."
    }
  },

  "pt-PT": {
    loading: "A carregar o editor de certificados...",
    toast: {
      errorTitle: "Não foi possível concluir",
      successTitle: "Concluído"
    },
    freeForm: {
      creationCancelled: "Criação da forma livre cancelada.",
      created: "Forma livre criada. Agora pode editar pontos e tangentes.",
      pointCreated: "Ponto {count} criado."
    }
  },

  "en-US": {
    loading: "Loading certificate editor...",
    toast: {
      errorTitle: "Unable to complete",
      successTitle: "Done"
    },
    freeForm: {
      creationCancelled: "Freeform shape creation cancelled.",
      created: "Freeform shape created. You can now edit points and tangents.",
      pointCreated: "Point {count} created."
    }
  },

  "es-ES": {
    loading: "Cargando el editor de certificados...",
    toast: {
      errorTitle: "No se pudo completar",
      successTitle: "Todo listo"
    },
    freeForm: {
      creationCancelled: "Creación de la forma libre cancelada.",
      created: "Forma libre creada. Ahora puede editar puntos y tangentes.",
      pointCreated: "Punto {count} creado."
    }
  },

  "fr-FR": {
    loading: "Chargement de l’éditeur de certificats...",
    toast: {
      errorTitle: "Impossible de terminer",
      successTitle: "Terminé"
    },
    freeForm: {
      creationCancelled: "Création de la forme libre annulée.",
      created: "Forme libre créée. Vous pouvez maintenant modifier les points et les tangentes.",
      pointCreated: "Point {count} créé."
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
  const original = fs.readFileSync(arquivo, "utf8");
  const dados = JSON.parse(original);

  const backup = `${arquivo}.antes-certificado-bloco3.bak`;

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

console.log("Bloco 3 de traduções concluído.");
