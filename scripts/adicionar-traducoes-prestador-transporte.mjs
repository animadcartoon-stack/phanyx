import fs from "node:fs";
import path from "node:path";

const dados = {
  "pt-BR": {
    actions: {
      addProvider: "+ Cadastrar prestador",
      cancel: "Cancelar",
      saveProvider: "Cadastrar prestador",
      saving: "Salvando..."
    },
    providerForm: {
      title: "Cadastrar prestador de transporte",
      description: "Cadastre uma empresa ou prestador que poderá ser reutilizado em diferentes atividades externas.",
      sections: {
        identification: "Identificação",
        location: "Localização",
        contact: "Contato",
        compliance: "Documentação e regularidade"
      },
      name: "Razão social / nome",
      tradeName: "Nome fantasia",
      type: "Tipo de prestador",
      country: "País",
      region: "Estado / região",
      city: "Cidade",
      phone: "Telefone",
      email: "E-mail",
      site: "Site",
      contactPerson: "Responsável pelo contato",
      contactPhone: "Telefone do responsável",
      contactEmail: "E-mail do responsável",
      documentType: "Tipo de documento",
      documentNumber: "Número do documento",
      licenseNumber: "Número da licença",
      licenseExpiry: "Validade da licença",
      policyNumber: "Número da apólice",
      insuranceExpiry: "Validade do seguro",
      studentVerification: "Transporte estudantil",
      allowsSubcontracting: "Permite subcontratação",
      allowsSubcontractingHelp: "Indica se este prestador pode utilizar outra empresa ou profissional para executar o serviço.",
      notes: "Observações"
    },
    providerTypes: {
      RODOVIARIO: "Rodoviário",
      AEREO: "Aéreo",
      FERROVIARIO: "Ferroviário",
      MARITIMO: "Marítimo",
      MOBILIDADE_AUTONOMA: "Mobilidade autônoma",
      MULTIMODAL: "Multimodal",
      OUTRO: "Outro"
    },
    studentVerification: {
      NAO_VERIFICADO: "Não verificado",
      VERIFICADO: "Verificado",
      NAO_AUTORIZADO: "Não autorizado",
      NAO_APLICAVEL: "Não aplicável"
    },
    success: {
      providerCreated: "Prestador cadastrado com sucesso."
    },
    errors: {
      providerNameRequired: "Informe a razão social ou o nome do prestador.",
      saveProvider: "Não foi possível cadastrar o prestador."
    }
  },

  "pt-PT": {
    actions: {
      addProvider: "+ Registar prestador",
      cancel: "Cancelar",
      saveProvider: "Registar prestador",
      saving: "A guardar..."
    },
    providerForm: {
      title: "Registar prestador de transporte",
      description: "Registe uma empresa ou prestador que poderá ser reutilizado em diferentes atividades externas.",
      sections: {
        identification: "Identificação",
        location: "Localização",
        contact: "Contacto",
        compliance: "Documentação e regularidade"
      },
      name: "Designação social / nome",
      tradeName: "Nome comercial",
      type: "Tipo de prestador",
      country: "País",
      region: "Distrito / região",
      city: "Cidade",
      phone: "Telefone",
      email: "E-mail",
      site: "Site",
      contactPerson: "Responsável de contacto",
      contactPhone: "Telefone do responsável",
      contactEmail: "E-mail do responsável",
      documentType: "Tipo de documento",
      documentNumber: "Número do documento",
      licenseNumber: "Número da licença",
      licenseExpiry: "Validade da licença",
      policyNumber: "Número da apólice",
      insuranceExpiry: "Validade do seguro",
      studentVerification: "Transporte de estudantes",
      allowsSubcontracting: "Permite subcontratação",
      allowsSubcontractingHelp: "Indica se este prestador pode recorrer a outra empresa ou profissional para executar o serviço.",
      notes: "Observações"
    },
    providerTypes: {
      RODOVIARIO: "Rodoviário",
      AEREO: "Aéreo",
      FERROVIARIO: "Ferroviário",
      MARITIMO: "Marítimo",
      MOBILIDADE_AUTONOMA: "Mobilidade autónoma",
      MULTIMODAL: "Multimodal",
      OUTRO: "Outro"
    },
    studentVerification: {
      NAO_VERIFICADO: "Não verificado",
      VERIFICADO: "Verificado",
      NAO_AUTORIZADO: "Não autorizado",
      NAO_APLICAVEL: "Não aplicável"
    },
    success: {
      providerCreated: "Prestador registado com sucesso."
    },
    errors: {
      providerNameRequired: "Indique a designação social ou o nome do prestador.",
      saveProvider: "Não foi possível registar o prestador."
    }
  },

  "en-US": {
    actions: {
      addProvider: "+ Add provider",
      cancel: "Cancel",
      saveProvider: "Add provider",
      saving: "Saving..."
    },
    providerForm: {
      title: "Add transportation provider",
      description: "Register a company or provider that can be reused across different off-site activities.",
      sections: {
        identification: "Identification",
        location: "Location",
        contact: "Contact",
        compliance: "Documentation and compliance"
      },
      name: "Legal name / name",
      tradeName: "Trade name",
      type: "Provider type",
      country: "Country",
      region: "State / region",
      city: "City",
      phone: "Phone",
      email: "Email",
      site: "Website",
      contactPerson: "Contact person",
      contactPhone: "Contact phone",
      contactEmail: "Contact email",
      documentType: "Document type",
      documentNumber: "Document number",
      licenseNumber: "License number",
      licenseExpiry: "License expiration",
      policyNumber: "Insurance policy number",
      insuranceExpiry: "Insurance expiration",
      studentVerification: "Student transportation",
      allowsSubcontracting: "Allows subcontracting",
      allowsSubcontractingHelp: "Indicates whether this provider may use another company or professional to perform the service.",
      notes: "Notes"
    },
    providerTypes: {
      RODOVIARIO: "Road transportation",
      AEREO: "Air transportation",
      FERROVIARIO: "Rail transportation",
      MARITIMO: "Maritime transportation",
      MOBILIDADE_AUTONOMA: "Autonomous mobility",
      MULTIMODAL: "Multimodal",
      OUTRO: "Other"
    },
    studentVerification: {
      NAO_VERIFICADO: "Not verified",
      VERIFICADO: "Verified",
      NAO_AUTORIZADO: "Not authorized",
      NAO_APLICAVEL: "Not applicable"
    },
    success: {
      providerCreated: "Provider added successfully."
    },
    errors: {
      providerNameRequired: "Enter the provider's legal name or name.",
      saveProvider: "The provider could not be added."
    }
  },

  "es-ES": {
    actions: {
      addProvider: "+ Registrar proveedor",
      cancel: "Cancelar",
      saveProvider: "Registrar proveedor",
      saving: "Guardando..."
    },
    providerForm: {
      title: "Registrar proveedor de transporte",
      description: "Registre una empresa o proveedor que podrá reutilizarse en distintas actividades externas.",
      sections: {
        identification: "Identificación",
        location: "Ubicación",
        contact: "Contacto",
        compliance: "Documentación y cumplimiento"
      },
      name: "Razón social / nombre",
      tradeName: "Nombre comercial",
      type: "Tipo de proveedor",
      country: "País",
      region: "Estado / región",
      city: "Ciudad",
      phone: "Teléfono",
      email: "Correo electrónico",
      site: "Sitio web",
      contactPerson: "Persona de contacto",
      contactPhone: "Teléfono de contacto",
      contactEmail: "Correo de contacto",
      documentType: "Tipo de documento",
      documentNumber: "Número del documento",
      licenseNumber: "Número de licencia",
      licenseExpiry: "Vencimiento de la licencia",
      policyNumber: "Número de póliza",
      insuranceExpiry: "Vencimiento del seguro",
      studentVerification: "Transporte estudiantil",
      allowsSubcontracting: "Permite subcontratación",
      allowsSubcontractingHelp: "Indica si este proveedor puede utilizar otra empresa o profesional para prestar el servicio.",
      notes: "Observaciones"
    },
    providerTypes: {
      RODOVIARIO: "Transporte por carretera",
      AEREO: "Transporte aéreo",
      FERROVIARIO: "Transporte ferroviario",
      MARITIMO: "Transporte marítimo",
      MOBILIDADE_AUTONOMA: "Movilidad autónoma",
      MULTIMODAL: "Multimodal",
      OUTRO: "Otro"
    },
    studentVerification: {
      NAO_VERIFICADO: "No verificado",
      VERIFICADO: "Verificado",
      NAO_AUTORIZADO: "No autorizado",
      NAO_APLICAVEL: "No aplicable"
    },
    success: {
      providerCreated: "Proveedor registrado correctamente."
    },
    errors: {
      providerNameRequired: "Indique la razón social o el nombre del proveedor.",
      saveProvider: "No se pudo registrar el proveedor."
    }
  },

  "fr-FR": {
    actions: {
      addProvider: "+ Ajouter un prestataire",
      cancel: "Annuler",
      saveProvider: "Ajouter le prestataire",
      saving: "Enregistrement..."
    },
    providerForm: {
      title: "Ajouter un prestataire de transport",
      description: "Enregistrez une entreprise ou un prestataire pouvant être réutilisé pour différentes activités extérieures.",
      sections: {
        identification: "Identification",
        location: "Localisation",
        contact: "Contact",
        compliance: "Documents et conformité"
      },
      name: "Raison sociale / nom",
      tradeName: "Nom commercial",
      type: "Type de prestataire",
      country: "Pays",
      region: "État / région",
      city: "Ville",
      phone: "Téléphone",
      email: "E-mail",
      site: "Site web",
      contactPerson: "Personne de contact",
      contactPhone: "Téléphone du contact",
      contactEmail: "E-mail du contact",
      documentType: "Type de document",
      documentNumber: "Numéro du document",
      licenseNumber: "Numéro de licence",
      licenseExpiry: "Expiration de la licence",
      policyNumber: "Numéro de police d’assurance",
      insuranceExpiry: "Expiration de l’assurance",
      studentVerification: "Transport des étudiants",
      allowsSubcontracting: "Autorise la sous-traitance",
      allowsSubcontractingHelp: "Indique si ce prestataire peut faire appel à une autre entreprise ou à un professionnel pour exécuter le service.",
      notes: "Observations"
    },
    providerTypes: {
      RODOVIARIO: "Transport routier",
      AEREO: "Transport aérien",
      FERROVIARIO: "Transport ferroviaire",
      MARITIMO: "Transport maritime",
      MOBILIDADE_AUTONOMA: "Mobilité autonome",
      MULTIMODAL: "Multimodal",
      OUTRO: "Autre"
    },
    studentVerification: {
      NAO_VERIFICADO: "Non vérifié",
      VERIFICADO: "Vérifié",
      NAO_AUTORIZADO: "Non autorisé",
      NAO_APLICAVEL: "Non applicable"
    },
    success: {
      providerCreated: "Prestataire ajouté avec succès."
    },
    errors: {
      providerNameRequired: "Indiquez la raison sociale ou le nom du prestataire.",
      saveProvider: "Impossible d’ajouter le prestataire."
    }
  }
};

function merge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value)
    ) {
      target[key] ??= {};
      merge(target[key], value);
    } else {
      target[key] = value;
    }
  }
}

for (const [locale, complemento] of Object.entries(dados)) {
  const arquivo = path.join(
    process.cwd(),
    "messages",
    `${locale}.json`
  );

  const json = JSON.parse(
    fs.readFileSync(
      arquivo,
      "utf8"
    )
  );

  json.AdminExternalActivityTransport ??= {};
  json.AdminExternalActivityTransport.registrations ??= {};

  merge(
    json.AdminExternalActivityTransport.registrations,
    complemento
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(
      json,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(`OK: ${locale}`);
}

console.log(
  "Traduções do cadastro de prestadores atualizadas."
);
