import fs from "node:fs";
import path from "node:path";

const traducoes = {
  "pt-BR": {
    title: "Equipe",
    description:
      "Organize os profissionais e acompanhantes responsáveis pela atividade externa.",

    loading: "Carregando equipe...",
    loadError: "Não foi possível carregar a equipe.",
    retry: "Tentar novamente",

    summary: {
      total: "Membros",
      principal: "Responsável principal"
    },

    current: {
      title: "Equipe da atividade",
      count: "{count, plural, =0 {Nenhum membro} =1 {1 membro} other {# membros}}",
      empty: "Nenhum membro foi adicionado à equipe."
    },

    add: {
      title: "Adicionar membro",
      description:
        "Selecione um professor, funcionário ou cadastre um acompanhante externo.",
      open: "Adicionar membro",
      cancel: "Cancelar",
      save: "Adicionar à equipe",
      saving: "Adicionando..."
    },

    form: {
      type: "Tipo de membro",
      role: "Função na atividade",
      person: "Pessoa",
      selectPerson: "Selecione uma pessoa",
      principal: "Responsável principal",
      principalDescription:
        "Define esta pessoa como principal responsável pela equipe.",
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      observation: "Observação",
      namePlaceholder: "Nome completo",
      emailPlaceholder: "email@exemplo.com",
      phonePlaceholder: "Telefone",
      observationPlaceholder:
        "Informações adicionais sobre a função deste membro..."
    },

    member: {
      principal: "Principal",
      noEmail: "E-mail não informado",
      noPhone: "Telefone não informado"
    },

    types: {
      PROFESSOR: "Professor",
      FUNCIONARIO: "Funcionário",
      ACOMPANHANTE_EXTERNO: "Acompanhante externo",
      RESPONSAVEL_VOLUNTARIO: "Responsável voluntário",
      GUIA: "Guia",
      OUTRO: "Outro"
    },

    roles: {
      RESPONSAVEL_GERAL: "Responsável geral",
      COORDENADOR: "Coordenador",
      SUPERVISOR: "Supervisor",
      MONITOR: "Monitor",
      PRIMEIROS_SOCORROS: "Primeiros socorros",
      ACOMPANHANTE: "Acompanhante",
      OUTRO: "Outro"
    },

    groups: {
      professors: "Professores",
      employees: "Funcionários",
      external: "Pessoas externas"
    },

    messages: {
      added: "Membro adicionado à equipe com sucesso.",
      addError: "Não foi possível adicionar o membro.",
      duplicate: "Esta pessoa já faz parte da equipe."
    }
  },

  "pt-PT": {
    title: "Equipa",
    description:
      "Organize os profissionais e acompanhantes responsáveis pela atividade externa.",

    loading: "A carregar equipa...",
    loadError: "Não foi possível carregar a equipa.",
    retry: "Tentar novamente",

    summary: {
      total: "Membros",
      principal: "Responsável principal"
    },

    current: {
      title: "Equipa da atividade",
      count: "{count, plural, =0 {Nenhum membro} =1 {1 membro} other {# membros}}",
      empty: "Ainda não foi adicionado nenhum membro à equipa."
    },

    add: {
      title: "Adicionar membro",
      description:
        "Selecione um professor, funcionário ou registe um acompanhante externo.",
      open: "Adicionar membro",
      cancel: "Cancelar",
      save: "Adicionar à equipa",
      saving: "A adicionar..."
    },

    form: {
      type: "Tipo de membro",
      role: "Função na atividade",
      person: "Pessoa",
      selectPerson: "Selecione uma pessoa",
      principal: "Responsável principal",
      principalDescription:
        "Define esta pessoa como principal responsável pela equipa.",
      name: "Nome",
      email: "E-mail",
      phone: "Telefone",
      observation: "Observação",
      namePlaceholder: "Nome completo",
      emailPlaceholder: "email@exemplo.com",
      phonePlaceholder: "Telefone",
      observationPlaceholder:
        "Informações adicionais sobre a função deste membro..."
    },

    member: {
      principal: "Principal",
      noEmail: "E-mail não indicado",
      noPhone: "Telefone não indicado"
    },

    types: {
      PROFESSOR: "Professor",
      FUNCIONARIO: "Funcionário",
      ACOMPANHANTE_EXTERNO: "Acompanhante externo",
      RESPONSAVEL_VOLUNTARIO: "Responsável voluntário",
      GUIA: "Guia",
      OUTRO: "Outro"
    },

    roles: {
      RESPONSAVEL_GERAL: "Responsável geral",
      COORDENADOR: "Coordenador",
      SUPERVISOR: "Supervisor",
      MONITOR: "Monitor",
      PRIMEIROS_SOCORROS: "Primeiros socorros",
      ACOMPANHANTE: "Acompanhante",
      OUTRO: "Outro"
    },

    groups: {
      professors: "Professores",
      employees: "Funcionários",
      external: "Pessoas externas"
    },

    messages: {
      added: "Membro adicionado à equipa com sucesso.",
      addError: "Não foi possível adicionar o membro.",
      duplicate: "Esta pessoa já faz parte da equipa."
    }
  },

  "en-US": {
    title: "Team",
    description:
      "Organize the professionals and chaperones responsible for the external activity.",

    loading: "Loading team...",
    loadError: "The team could not be loaded.",
    retry: "Try again",

    summary: {
      total: "Members",
      principal: "Lead member"
    },

    current: {
      title: "Activity team",
      count: "{count, plural, =0 {No members} =1 {1 member} other {# members}}",
      empty: "No team members have been added yet."
    },

    add: {
      title: "Add team member",
      description:
        "Select a teacher, employee, or register an external chaperone.",
      open: "Add member",
      cancel: "Cancel",
      save: "Add to team",
      saving: "Adding..."
    },

    form: {
      type: "Member type",
      role: "Activity role",
      person: "Person",
      selectPerson: "Select a person",
      principal: "Lead member",
      principalDescription:
        "Sets this person as the primary person responsible for the team.",
      name: "Name",
      email: "Email",
      phone: "Phone",
      observation: "Notes",
      namePlaceholder: "Full name",
      emailPlaceholder: "email@example.com",
      phonePlaceholder: "Phone number",
      observationPlaceholder:
        "Additional information about this member's role..."
    },

    member: {
      principal: "Lead",
      noEmail: "No email provided",
      noPhone: "No phone provided"
    },

    types: {
      PROFESSOR: "Teacher",
      FUNCIONARIO: "Employee",
      ACOMPANHANTE_EXTERNO: "External chaperone",
      RESPONSAVEL_VOLUNTARIO: "Volunteer guardian",
      GUIA: "Guide",
      OUTRO: "Other"
    },

    roles: {
      RESPONSAVEL_GERAL: "Lead person",
      COORDENADOR: "Coordinator",
      SUPERVISOR: "Supervisor",
      MONITOR: "Monitor",
      PRIMEIROS_SOCORROS: "First aid",
      ACOMPANHANTE: "Chaperone",
      OUTRO: "Other"
    },

    groups: {
      professors: "Teachers",
      employees: "Employees",
      external: "External people"
    },

    messages: {
      added: "Team member added successfully.",
      addError: "The team member could not be added.",
      duplicate: "This person is already on the team."
    }
  },

  "es-ES": {
    title: "Equipo",
    description:
      "Organiza a los profesionales y acompañantes responsables de la actividad externa.",

    loading: "Cargando equipo...",
    loadError: "No se pudo cargar el equipo.",
    retry: "Intentar de nuevo",

    summary: {
      total: "Miembros",
      principal: "Responsable principal"
    },

    current: {
      title: "Equipo de la actividad",
      count: "{count, plural, =0 {Ningún miembro} =1 {1 miembro} other {# miembros}}",
      empty: "Todavía no se ha añadido ningún miembro al equipo."
    },

    add: {
      title: "Añadir miembro",
      description:
        "Selecciona un profesor, empleado o registra un acompañante externo.",
      open: "Añadir miembro",
      cancel: "Cancelar",
      save: "Añadir al equipo",
      saving: "Añadiendo..."
    },

    form: {
      type: "Tipo de miembro",
      role: "Función en la actividad",
      person: "Persona",
      selectPerson: "Selecciona una persona",
      principal: "Responsable principal",
      principalDescription:
        "Define a esta persona como responsable principal del equipo.",
      name: "Nombre",
      email: "Correo electrónico",
      phone: "Teléfono",
      observation: "Observación",
      namePlaceholder: "Nombre completo",
      emailPlaceholder: "email@ejemplo.com",
      phonePlaceholder: "Teléfono",
      observationPlaceholder:
        "Información adicional sobre la función de este miembro..."
    },

    member: {
      principal: "Principal",
      noEmail: "Correo no informado",
      noPhone: "Teléfono no informado"
    },

    types: {
      PROFESSOR: "Profesor",
      FUNCIONARIO: "Empleado",
      ACOMPANHANTE_EXTERNO: "Acompañante externo",
      RESPONSAVEL_VOLUNTARIO: "Responsable voluntario",
      GUIA: "Guía",
      OUTRO: "Otro"
    },

    roles: {
      RESPONSAVEL_GERAL: "Responsable general",
      COORDENADOR: "Coordinador",
      SUPERVISOR: "Supervisor",
      MONITOR: "Monitor",
      PRIMEIROS_SOCORROS: "Primeros auxilios",
      ACOMPANHANTE: "Acompañante",
      OUTRO: "Otro"
    },

    groups: {
      professors: "Profesores",
      employees: "Empleados",
      external: "Personas externas"
    },

    messages: {
      added: "Miembro añadido al equipo correctamente.",
      addError: "No se pudo añadir el miembro.",
      duplicate: "Esta persona ya forma parte del equipo."
    }
  },

  "fr-FR": {
    title: "Équipe",
    description:
      "Organisez les professionnels et accompagnateurs responsables de l’activité extérieure.",

    loading: "Chargement de l’équipe...",
    loadError: "Impossible de charger l’équipe.",
    retry: "Réessayer",

    summary: {
      total: "Membres",
      principal: "Responsable principal"
    },

    current: {
      title: "Équipe de l’activité",
      count: "{count, plural, =0 {Aucun membre} =1 {1 membre} other {# membres}}",
      empty: "Aucun membre n’a encore été ajouté à l’équipe."
    },

    add: {
      title: "Ajouter un membre",
      description:
        "Sélectionnez un enseignant, un employé ou enregistrez un accompagnateur externe.",
      open: "Ajouter un membre",
      cancel: "Annuler",
      save: "Ajouter à l’équipe",
      saving: "Ajout..."
    },

    form: {
      type: "Type de membre",
      role: "Rôle dans l’activité",
      person: "Personne",
      selectPerson: "Sélectionnez une personne",
      principal: "Responsable principal",
      principalDescription:
        "Définit cette personne comme principal responsable de l’équipe.",
      name: "Nom",
      email: "E-mail",
      phone: "Téléphone",
      observation: "Observation",
      namePlaceholder: "Nom complet",
      emailPlaceholder: "email@exemple.com",
      phonePlaceholder: "Téléphone",
      observationPlaceholder:
        "Informations supplémentaires sur le rôle de ce membre..."
    },

    member: {
      principal: "Principal",
      noEmail: "E-mail non renseigné",
      noPhone: "Téléphone non renseigné"
    },

    types: {
      PROFESSOR: "Enseignant",
      FUNCIONARIO: "Employé",
      ACOMPANHANTE_EXTERNO: "Accompagnateur externe",
      RESPONSAVEL_VOLUNTARIO: "Responsable bénévole",
      GUIA: "Guide",
      OUTRO: "Autre"
    },

    roles: {
      RESPONSAVEL_GERAL: "Responsable général",
      COORDENADOR: "Coordinateur",
      SUPERVISOR: "Superviseur",
      MONITOR: "Moniteur",
      PRIMEIROS_SOCORROS: "Premiers secours",
      ACOMPANHANTE: "Accompagnateur",
      OUTRO: "Autre"
    },

    groups: {
      professors: "Enseignants",
      employees: "Employés",
      external: "Personnes externes"
    },

    messages: {
      added: "Membre ajouté à l’équipe avec succès.",
      addError: "Impossible d’ajouter le membre.",
      duplicate: "Cette personne fait déjà partie de l’équipe."
    }
  }
};

const namespace =
  "AdminExternalActivityTeam";

for (
  const [locale, valor]
  of Object.entries(traducoes)
) {
  const arquivo =
    path.resolve(
      process.cwd(),
      `messages/${locale}.json`
    );

  const original =
    fs.readFileSync(
      arquivo,
      "utf8"
    );

  const dados =
    JSON.parse(original);

  if (
    Object.prototype.hasOwnProperty.call(
      dados,
      namespace
    )
  ) {
    console.log(
      `ℹ️ ${locale}: ${namespace} já existe.`
    );
    continue;
  }

  dados[namespace] =
    valor;

  fs.writeFileSync(
    arquivo,
    `${JSON.stringify(
      dados,
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(
    `✅ ${locale}: ${namespace} adicionado.`
  );
}

console.log(
  "✅ Traduções da equipa concluídas."
);