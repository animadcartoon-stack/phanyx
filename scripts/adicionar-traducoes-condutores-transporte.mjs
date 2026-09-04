import fs from "node:fs";
import path from "node:path";

const dados = {
  "pt-BR": {
    actions: {
      addDriver: "+ Cadastrar condutor",
      saveDriver: "Cadastrar condutor"
    },
    driverForm: {
      title: "Cadastrar condutor",
      description: "Cadastre motoristas, pilotos, operadores e outros condutores que poderão ser utilizados nas atividades externas.",
      sections: {
        identification: "Identificação e prestador",
        contact: "Contato",
        documents: "Documento",
        license: "Licença, habilitação e autorização",
        emergency: "Contato de emergência"
      },
      provider: "Prestador de transporte",
      noProvider: "Sem prestador / condutor próprio",
      name: "Nome do condutor",
      type: "Tipo de condutor",
      phone: "Telefone",
      email: "E-mail",
      documentCountry: "País do documento / licença",
      documentType: "Tipo de documento",
      documentNumber: "Número do documento",
      licenseNumber: "Número da licença / habilitação",
      licenseCategory: "Categoria / classe",
      licenseExpiry: "Validade da licença",
      studentVerification: "Transporte estudantil",
      emergencyContact: "Contato de emergência",
      emergencyPhone: "Telefone de emergência",
      notes: "Observações"
    },
    driverTypes: {
      MOTORISTA: "Motorista",
      PILOTO: "Piloto",
      MAQUINISTA: "Maquinista",
      COMANDANTE_EMBARCACAO: "Comandante de embarcação",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor de veículo autônomo",
      OUTRO: "Outro"
    },
    success: {
      driverCreated: "Condutor cadastrado com sucesso."
    },
    errors: {
      driverNameRequired: "Informe o nome do condutor.",
      saveDriver: "Não foi possível cadastrar o condutor."
    }
  },

  "pt-PT": {
    actions: {
      addDriver: "+ Registar condutor",
      saveDriver: "Registar condutor"
    },
    driverForm: {
      title: "Registar condutor",
      description: "Registe motoristas, pilotos, operadores e outros condutores que poderão ser utilizados nas atividades externas.",
      sections: {
        identification: "Identificação e prestador",
        contact: "Contacto",
        documents: "Documento",
        license: "Licença, habilitação e autorização",
        emergency: "Contacto de emergência"
      },
      provider: "Prestador de transporte",
      noProvider: "Sem prestador / condutor próprio",
      name: "Nome do condutor",
      type: "Tipo de condutor",
      phone: "Telefone",
      email: "E-mail",
      documentCountry: "País do documento / licença",
      documentType: "Tipo de documento",
      documentNumber: "Número do documento",
      licenseNumber: "Número da licença / carta",
      licenseCategory: "Categoria / classe",
      licenseExpiry: "Validade da licença",
      studentVerification: "Transporte de estudantes",
      emergencyContact: "Contacto de emergência",
      emergencyPhone: "Telefone de emergência",
      notes: "Observações"
    },
    driverTypes: {
      MOTORISTA: "Motorista",
      PILOTO: "Piloto",
      MAQUINISTA: "Maquinista",
      COMANDANTE_EMBARCACAO: "Comandante de embarcação",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor de veículo autónomo",
      OUTRO: "Outro"
    },
    success: {
      driverCreated: "Condutor registado com sucesso."
    },
    errors: {
      driverNameRequired: "Indique o nome do condutor.",
      saveDriver: "Não foi possível registar o condutor."
    }
  },

  "en-US": {
    actions: {
      addDriver: "+ Add driver",
      saveDriver: "Add driver"
    },
    driverForm: {
      title: "Add driver",
      description: "Register drivers, pilots, operators and other vehicle operators who may be assigned to off-site activities.",
      sections: {
        identification: "Identification and provider",
        contact: "Contact",
        documents: "Document",
        license: "License and authorization",
        emergency: "Emergency contact"
      },
      provider: "Transportation provider",
      noProvider: "No provider / institution driver",
      name: "Driver / operator name",
      type: "Driver type",
      phone: "Phone",
      email: "Email",
      documentCountry: "Document / license country",
      documentType: "Document type",
      documentNumber: "Document number",
      licenseNumber: "License number",
      licenseCategory: "License class / category",
      licenseExpiry: "License expiration",
      studentVerification: "Student transportation",
      emergencyContact: "Emergency contact",
      emergencyPhone: "Emergency phone",
      notes: "Notes"
    },
    driverTypes: {
      MOTORISTA: "Driver",
      PILOTO: "Pilot",
      MAQUINISTA: "Train operator",
      COMANDANTE_EMBARCACAO: "Vessel master",
      OPERADOR: "Operator",
      OPERADOR_REMOTO: "Remote operator",
      SUPERVISOR_AUTONOMO: "Autonomous vehicle supervisor",
      OUTRO: "Other"
    },
    success: {
      driverCreated: "Driver added successfully."
    },
    errors: {
      driverNameRequired: "Enter the driver or operator name.",
      saveDriver: "The driver could not be added."
    }
  },

  "es-ES": {
    actions: {
      addDriver: "+ Registrar conductor",
      saveDriver: "Registrar conductor"
    },
    driverForm: {
      title: "Registrar conductor",
      description: "Registre conductores, pilotos, operadores y otros responsables que podrán asignarse a actividades externas.",
      sections: {
        identification: "Identificación y proveedor",
        contact: "Contacto",
        documents: "Documento",
        license: "Licencia y autorización",
        emergency: "Contacto de emergencia"
      },
      provider: "Proveedor de transporte",
      noProvider: "Sin proveedor / conductor propio",
      name: "Nombre del conductor",
      type: "Tipo de conductor",
      phone: "Teléfono",
      email: "Correo electrónico",
      documentCountry: "País del documento / licencia",
      documentType: "Tipo de documento",
      documentNumber: "Número del documento",
      licenseNumber: "Número de licencia",
      licenseCategory: "Categoría / clase",
      licenseExpiry: "Validez de la licencia",
      studentVerification: "Transporte estudiantil",
      emergencyContact: "Contacto de emergencia",
      emergencyPhone: "Teléfono de emergencia",
      notes: "Observaciones"
    },
    driverTypes: {
      MOTORISTA: "Conductor",
      PILOTO: "Piloto",
      MAQUINISTA: "Maquinista",
      COMANDANTE_EMBARCACAO: "Capitán de embarcación",
      OPERADOR: "Operador",
      OPERADOR_REMOTO: "Operador remoto",
      SUPERVISOR_AUTONOMO: "Supervisor de vehículo autónomo",
      OUTRO: "Otro"
    },
    success: {
      driverCreated: "Conductor registrado correctamente."
    },
    errors: {
      driverNameRequired: "Introduzca el nombre del conductor.",
      saveDriver: "No se pudo registrar el conductor."
    }
  },

  "fr-FR": {
    actions: {
      addDriver: "+ Ajouter un conducteur",
      saveDriver: "Ajouter le conducteur"
    },
    driverForm: {
      title: "Ajouter un conducteur",
      description: "Enregistrez les conducteurs, pilotes, opérateurs et autres responsables pouvant être affectés aux activités extérieures.",
      sections: {
        identification: "Identification et prestataire",
        contact: "Contact",
        documents: "Document",
        license: "Permis, licence et autorisation",
        emergency: "Contact d’urgence"
      },
      provider: "Prestataire de transport",
      noProvider: "Sans prestataire / conducteur interne",
      name: "Nom du conducteur",
      type: "Type de conducteur",
      phone: "Téléphone",
      email: "E-mail",
      documentCountry: "Pays du document / permis",
      documentType: "Type de document",
      documentNumber: "Numéro du document",
      licenseNumber: "Numéro du permis / licence",
      licenseCategory: "Catégorie / classe",
      licenseExpiry: "Date d’expiration",
      studentVerification: "Transport des étudiants",
      emergencyContact: "Contact d’urgence",
      emergencyPhone: "Téléphone d’urgence",
      notes: "Observations"
    },
    driverTypes: {
      MOTORISTA: "Conducteur",
      PILOTO: "Pilote",
      MAQUINISTA: "Conducteur de train",
      COMANDANTE_EMBARCACAO: "Commandant de navire",
      OPERADOR: "Opérateur",
      OPERADOR_REMOTO: "Opérateur à distance",
      SUPERVISOR_AUTONOMO: "Superviseur de véhicule autonome",
      OUTRO: "Autre"
    },
    success: {
      driverCreated: "Conducteur ajouté avec succès."
    },
    errors: {
      driverNameRequired: "Indiquez le nom du conducteur.",
      saveDriver: "Impossible d’ajouter le conducteur."
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
      merge(
        target[key],
        value
      );
    } else {
      target[key] = value;
    }
  }
}

for (
  const [
    locale,
    complemento
  ] of Object.entries(dados)
) {
  const arquivo =
    path.join(
      process.cwd(),
      "messages",
      `${locale}.json`
    );

  const json =
    JSON.parse(
      fs.readFileSync(
        arquivo,
        "utf8"
      )
    );

  json.AdminExternalActivityTransport ??= {};

  json.AdminExternalActivityTransport.registrations ??= {};

  merge(
    json
      .AdminExternalActivityTransport
      .registrations,
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

  console.log(
    `OK: ${locale}`
  );
}
