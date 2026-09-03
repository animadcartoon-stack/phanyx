import fs from "node:fs";
import path from "node:path";

const dados = {
  "pt-BR": {
    actions: {
      addVehicle: "+ Cadastrar veículo",
      saveVehicle: "Cadastrar veículo"
    },
    vehicleForm: {
      title: "Cadastrar veículo",
      description: "Cadastre um veículo que poderá ser utilizado nos trajetos das atividades externas.",
      sections: {
        identification: "Identificação e prestador",
        registration: "Registro do veículo",
        vehicle: "Características",
        technology: "Condução, rastreamento e tecnologia"
      },
      provider: "Prestador de transporte",
      noProvider: "Sem prestador / veículo próprio",
      name: "Nome / identificação do veículo",
      type: "Tipo de veículo",
      registrationCountry: "País de registro",
      plate: "Placa / matrícula",
      externalIdentifier: "Identificador externo",
      brand: "Marca",
      model: "Modelo",
      year: "Ano",
      capacity: "Capacidade de passageiros",
      accessible: "Veículo acessível para PCD",
      accessibleHelp: "Indica se o veículo possui recursos de acessibilidade para pessoas com deficiência.",
      studentVerification: "Transporte estudantil",
      drivingType: "Tipo de condução",
      drivingSystem: "Sistema de condução",
      softwareVersion: "Versão do software",
      tracking: "Possui rastreamento",
      telemetry: "Possui telemetria",
      trackingProvider: "Provedor de rastreamento",
      externalVehicleId: "ID externo do veículo",
      notes: "Observações"
    },
    vehicleTypes: {
      ONIBUS: "Ônibus",
      MICRO_ONIBUS: "Micro-ônibus",
      VAN: "Van",
      AUTOMOVEL: "Automóvel",
      SUV: "SUV",
      MINIVAN: "Minivan",
      CAMINHAO_ADAPTADO: "Caminhão adaptado",
      AERONAVE: "Aeronave",
      TREM: "Trem",
      METRO: "Metrô",
      BONDE: "Bonde",
      BARCO: "Barco",
      FERRY: "Ferry",
      EMBARCACAO: "Embarcação",
      BICICLETA: "Bicicleta",
      VEICULO_AUTONOMO: "Veículo autônomo",
      OUTRO: "Outro"
    },
    drivingTypes: {
      HUMANA: "Condução humana",
      ADAS: "Assistência avançada ao motorista (ADAS)",
      AUTOMATIZADA_SUPERVISIONADA: "Automatizada supervisionada",
      AUTONOMA: "Autônoma",
      SUPERVISAO_REMOTA: "Supervisão remota",
      MISTA: "Mista",
      NAO_APLICAVEL: "Não aplicável"
    },
    success: {
      vehicleCreated: "Veículo cadastrado com sucesso."
    },
    errors: {
      saveVehicle: "Não foi possível cadastrar o veículo."
    }
  },

  "pt-PT": {
    actions: {
      addVehicle: "+ Registar veículo",
      saveVehicle: "Registar veículo"
    },
    vehicleForm: {
      title: "Registar veículo",
      description: "Registe um veículo que poderá ser utilizado nos trajetos das atividades externas.",
      sections: {
        identification: "Identificação e prestador",
        registration: "Registo do veículo",
        vehicle: "Características",
        technology: "Condução, localização e tecnologia"
      },
      provider: "Prestador de transporte",
      noProvider: "Sem prestador / veículo próprio",
      name: "Nome / identificação do veículo",
      type: "Tipo de veículo",
      registrationCountry: "País de registo",
      plate: "Matrícula / identificação",
      externalIdentifier: "Identificador externo",
      brand: "Marca",
      model: "Modelo",
      year: "Ano",
      capacity: "Capacidade de passageiros",
      accessible: "Veículo acessível a pessoas com deficiência",
      accessibleHelp: "Indica se o veículo dispõe de recursos de acessibilidade.",
      studentVerification: "Transporte de estudantes",
      drivingType: "Tipo de condução",
      drivingSystem: "Sistema de condução",
      softwareVersion: "Versão do software",
      tracking: "Possui localização/rastreamento",
      telemetry: "Possui telemetria",
      trackingProvider: "Fornecedor de rastreamento",
      externalVehicleId: "ID externo do veículo",
      notes: "Observações"
    },
    vehicleTypes: {
      ONIBUS: "Autocarro",
      MICRO_ONIBUS: "Miniautocarro",
      VAN: "Carrinha",
      AUTOMOVEL: "Automóvel",
      SUV: "SUV",
      MINIVAN: "Monovolume",
      CAMINHAO_ADAPTADO: "Camião adaptado",
      AERONAVE: "Aeronave",
      TREM: "Comboio",
      METRO: "Metro",
      BONDE: "Elétrico",
      BARCO: "Barco",
      FERRY: "Ferry",
      EMBARCACAO: "Embarcação",
      BICICLETA: "Bicicleta",
      VEICULO_AUTONOMO: "Veículo autónomo",
      OUTRO: "Outro"
    },
    drivingTypes: {
      HUMANA: "Condução humana",
      ADAS: "Assistência avançada ao condutor (ADAS)",
      AUTOMATIZADA_SUPERVISIONADA: "Automatizada supervisionada",
      AUTONOMA: "Autónoma",
      SUPERVISAO_REMOTA: "Supervisão remota",
      MISTA: "Mista",
      NAO_APLICAVEL: "Não aplicável"
    },
    success: {
      vehicleCreated: "Veículo registado com sucesso."
    },
    errors: {
      saveVehicle: "Não foi possível registar o veículo."
    }
  },

  "en-US": {
    actions: {
      addVehicle: "+ Add vehicle",
      saveVehicle: "Add vehicle"
    },
    vehicleForm: {
      title: "Add vehicle",
      description: "Register a vehicle that can be assigned to off-site activity segments.",
      sections: {
        identification: "Identification and provider",
        registration: "Vehicle registration",
        vehicle: "Vehicle details",
        technology: "Driving, tracking and technology"
      },
      provider: "Transportation provider",
      noProvider: "No provider / institution-owned vehicle",
      name: "Vehicle name / identifier",
      type: "Vehicle type",
      registrationCountry: "Registration country",
      plate: "License plate / registration",
      externalIdentifier: "External identifier",
      brand: "Make",
      model: "Model",
      year: "Year",
      capacity: "Passenger capacity",
      accessible: "Accessible vehicle",
      accessibleHelp: "Indicates whether the vehicle provides accessibility features for people with disabilities.",
      studentVerification: "Student transportation",
      drivingType: "Driving type",
      drivingSystem: "Driving system",
      softwareVersion: "Software version",
      tracking: "Tracking enabled",
      telemetry: "Telemetry enabled",
      trackingProvider: "Tracking provider",
      externalVehicleId: "External vehicle ID",
      notes: "Notes"
    },
    vehicleTypes: {
      ONIBUS: "Bus",
      MICRO_ONIBUS: "Minibus",
      VAN: "Van",
      AUTOMOVEL: "Car",
      SUV: "SUV",
      MINIVAN: "Minivan",
      CAMINHAO_ADAPTADO: "Adapted truck",
      AERONAVE: "Aircraft",
      TREM: "Train",
      METRO: "Subway",
      BONDE: "Tram",
      BARCO: "Boat",
      FERRY: "Ferry",
      EMBARCACAO: "Watercraft",
      BICICLETA: "Bicycle",
      VEICULO_AUTONOMO: "Autonomous vehicle",
      OUTRO: "Other"
    },
    drivingTypes: {
      HUMANA: "Human-operated",
      ADAS: "Advanced driver assistance (ADAS)",
      AUTOMATIZADA_SUPERVISIONADA: "Supervised automated",
      AUTONOMA: "Autonomous",
      SUPERVISAO_REMOTA: "Remote supervision",
      MISTA: "Mixed",
      NAO_APLICAVEL: "Not applicable"
    },
    success: {
      vehicleCreated: "Vehicle added successfully."
    },
    errors: {
      saveVehicle: "The vehicle could not be added."
    }
  },

  "es-ES": {
    actions: {
      addVehicle: "+ Registrar vehículo",
      saveVehicle: "Registrar vehículo"
    },
    vehicleForm: {
      title: "Registrar vehículo",
      description: "Registre un vehículo que podrá asignarse a los trayectos de las actividades externas.",
      sections: {
        identification: "Identificación y proveedor",
        registration: "Registro del vehículo",
        vehicle: "Características",
        technology: "Conducción, seguimiento y tecnología"
      },
      provider: "Proveedor de transporte",
      noProvider: "Sin proveedor / vehículo propio",
      name: "Nombre / identificación del vehículo",
      type: "Tipo de vehículo",
      registrationCountry: "País de registro",
      plate: "Matrícula / identificación",
      externalIdentifier: "Identificador externo",
      brand: "Marca",
      model: "Modelo",
      year: "Año",
      capacity: "Capacidad de pasajeros",
      accessible: "Vehículo accesible",
      accessibleHelp: "Indica si el vehículo dispone de recursos de accesibilidad para personas con discapacidad.",
      studentVerification: "Transporte estudiantil",
      drivingType: "Tipo de conducción",
      drivingSystem: "Sistema de conducción",
      softwareVersion: "Versión del software",
      tracking: "Dispone de seguimiento",
      telemetry: "Dispone de telemetría",
      trackingProvider: "Proveedor de seguimiento",
      externalVehicleId: "ID externo del vehículo",
      notes: "Observaciones"
    },
    vehicleTypes: {
      ONIBUS: "Autobús",
      MICRO_ONIBUS: "Microbús",
      VAN: "Furgoneta",
      AUTOMOVEL: "Automóvil",
      SUV: "SUV",
      MINIVAN: "Miniván",
      CAMINHAO_ADAPTADO: "Camión adaptado",
      AERONAVE: "Aeronave",
      TREM: "Tren",
      METRO: "Metro",
      BONDE: "Tranvía",
      BARCO: "Barco",
      FERRY: "Ferry",
      EMBARCACAO: "Embarcación",
      BICICLETA: "Bicicleta",
      VEICULO_AUTONOMO: "Vehículo autónomo",
      OUTRO: "Otro"
    },
    drivingTypes: {
      HUMANA: "Conducción humana",
      ADAS: "Asistencia avanzada al conductor (ADAS)",
      AUTOMATIZADA_SUPERVISIONADA: "Automatizada supervisada",
      AUTONOMA: "Autónoma",
      SUPERVISAO_REMOTA: "Supervisión remota",
      MISTA: "Mixta",
      NAO_APLICAVEL: "No aplicable"
    },
    success: {
      vehicleCreated: "Vehículo registrado correctamente."
    },
    errors: {
      saveVehicle: "No se pudo registrar el vehículo."
    }
  },

  "fr-FR": {
    actions: {
      addVehicle: "+ Ajouter un véhicule",
      saveVehicle: "Ajouter le véhicule"
    },
    vehicleForm: {
      title: "Ajouter un véhicule",
      description: "Enregistrez un véhicule pouvant être affecté aux trajets des activités extérieures.",
      sections: {
        identification: "Identification et prestataire",
        registration: "Immatriculation du véhicule",
        vehicle: "Caractéristiques",
        technology: "Conduite, suivi et technologie"
      },
      provider: "Prestataire de transport",
      noProvider: "Sans prestataire / véhicule propre",
      name: "Nom / identification du véhicule",
      type: "Type de véhicule",
      registrationCountry: "Pays d’immatriculation",
      plate: "Immatriculation / identification",
      externalIdentifier: "Identifiant externe",
      brand: "Marque",
      model: "Modèle",
      year: "Année",
      capacity: "Capacité de passagers",
      accessible: "Véhicule accessible",
      accessibleHelp: "Indique si le véhicule dispose d’équipements d’accessibilité pour les personnes en situation de handicap.",
      studentVerification: "Transport des étudiants",
      drivingType: "Type de conduite",
      drivingSystem: "Système de conduite",
      softwareVersion: "Version du logiciel",
      tracking: "Suivi activé",
      telemetry: "Télémétrie activée",
      trackingProvider: "Fournisseur de suivi",
      externalVehicleId: "ID externe du véhicule",
      notes: "Observations"
    },
    vehicleTypes: {
      ONIBUS: "Autobus",
      MICRO_ONIBUS: "Minibus",
      VAN: "Fourgon",
      AUTOMOVEL: "Automobile",
      SUV: "SUV",
      MINIVAN: "Monospace",
      CAMINHAO_ADAPTADO: "Camion adapté",
      AERONAVE: "Aéronef",
      TREM: "Train",
      METRO: "Métro",
      BONDE: "Tramway",
      BARCO: "Bateau",
      FERRY: "Ferry",
      EMBARCACAO: "Embarcation",
      BICICLETA: "Vélo",
      VEICULO_AUTONOMO: "Véhicule autonome",
      OUTRO: "Autre"
    },
    drivingTypes: {
      HUMANA: "Conduite humaine",
      ADAS: "Aide avancée à la conduite (ADAS)",
      AUTOMATIZADA_SUPERVISIONADA: "Automatisée supervisée",
      AUTONOMA: "Autonome",
      SUPERVISAO_REMOTA: "Supervision à distance",
      MISTA: "Mixte",
      NAO_APLICAVEL: "Non applicable"
    },
    success: {
      vehicleCreated: "Véhicule ajouté avec succès."
    },
    errors: {
      saveVehicle: "Impossible d’ajouter le véhicule."
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
