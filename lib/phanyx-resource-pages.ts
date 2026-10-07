import type { LocalePhanyx } from "@/i18n/config";

export const phanyxResourceKeys = [
  "sistema-academico",
  "biblioteca",
  "comercial",
  "financeiro",
  "rh",
  "intercambio",
  "atividades-extracurriculares",
  "ouvidoria-reunioes",
  "certificados",
  "crachas",
] as const;

export type PhanyxResourceKey = (typeof phanyxResourceKeys)[number];

type Highlight = { title: string; description: string };

export type PhanyxResourcePage = {
  key: PhanyxResourceKey;
  slug: string;
  eyebrow: string;
  title: string;
  shortTitle: string;
  description: string;
  image: string;
  imageAlt: string;
  intro: string;
  highlights: Highlight[];
  integrationTitle: string;
  integrationText: string;
  practicalTitle: string;
  practicalText: string;
};

export const phanyxResourceSection: Record<LocalePhanyx, string> = {
  "pt-BR": "recursos",
  "pt-PT": "recursos",
  "en-US": "resources",
  "es-ES": "recursos",
  "fr-FR": "ressources",
};

const slugs: Record<PhanyxResourceKey, Record<LocalePhanyx, string>> = {
  "sistema-academico": {
    "pt-BR": "sistema-academico",
    "pt-PT": "sistema-academico",
    "en-US": "academic-system",
    "es-ES": "sistema-academico",
    "fr-FR": "systeme-academique",
  },
  biblioteca: {
    "pt-BR": "biblioteca",
    "pt-PT": "biblioteca",
    "en-US": "library-management",
    "es-ES": "biblioteca",
    "fr-FR": "gestion-bibliotheque",
  },
  comercial: {
    "pt-BR": "comercial",
    "pt-PT": "comercial",
    "en-US": "lead-capture-sales",
    "es-ES": "captacion-leads-comercial",
    "fr-FR": "prospection-commerciale",
  },
  financeiro: {
    "pt-BR": "financeiro",
    "pt-PT": "financeiro",
    "en-US": "school-finance",
    "es-ES": "finanzas",
    "fr-FR": "finance",
  },
  rh: {
    "pt-BR": "rh",
    "pt-PT": "rh",
    "en-US": "hr",
    "es-ES": "rrhh",
    "fr-FR": "rh",
  },
  intercambio: {
    "pt-BR": "intercambio",
    "pt-PT": "mobilidade-internacional",
    "en-US": "international-mobility",
    "es-ES": "movilidad-internacional",
    "fr-FR": "mobilite-internationale",
  },
  "atividades-extracurriculares": {
    "pt-BR": "atividades-extracurriculares",
    "pt-PT": "atividades-extracurriculares",
    "en-US": "extracurricular-activities",
    "es-ES": "actividades-extracurriculares",
    "fr-FR": "activites-extrascolaires",
  },
  "ouvidoria-reunioes": {
    "pt-BR": "ouvidoria-reunioes",
    "pt-PT": "ouvidoria-reunioes",
    "en-US": "feedback-meetings",
    "es-ES": "atencion-reuniones",
    "fr-FR": "mediation-reunions",
  },
  certificados: {
    "pt-BR": "certificados",
    "pt-PT": "certificados",
    "en-US": "certificate-editor",
    "es-ES": "editor-certificados",
    "fr-FR": "editeur-certificats",
  },
  crachas: {
    "pt-BR": "crachas",
    "pt-PT": "cartoes-identificacao",
    "en-US": "id-badge-creator",
    "es-ES": "creador-credenciales",
    "fr-FR": "creation-badges",
  },
};

const images: Record<LocalePhanyx, Record<PhanyxResourceKey, string>> = {
  "pt-BR": {
    "sistema-academico": "/images/blog-hub/i18n/pt-BR/academic.webp",
    biblioteca: "/images/blog-hub/i18n/pt-BR/library.webp",
    comercial: "/images/blog-hub/i18n/pt-BR/commercial.webp",
    financeiro: "/images/blog-hub/i18n/pt-BR/finance.webp",
    rh: "/images/blog-hub/i18n/pt-BR/hr.webp",
    intercambio: "/images/blog-hub/i18n/pt-BR/exchange.webp",
    "atividades-extracurriculares": "/images/blog-hub/i18n/pt-BR/activities.webp",
    "ouvidoria-reunioes": "/images/blog-hub/i18n/pt-BR/ombudsman.webp",
    certificados: "/images/blog-hub/i18n/pt-BR/certificates.webp",
    crachas: "/images/blog-hub/i18n/pt-BR/badges.webp",
  },
  "pt-PT": {
    "sistema-academico": "/images/blog-hub/i18n/pt-PT/academic.webp",
    biblioteca: "/images/blog-hub/i18n/pt-PT/library.webp",
    comercial: "/images/blog-hub/i18n/pt-PT/commercial.webp",
    financeiro: "/images/blog-hub/i18n/pt-PT/overview.webp",
    rh: "/images/blog-hub/i18n/pt-PT/hr.webp",
    intercambio: "/images/blog-hub/i18n/pt-PT/overview.webp",
    "atividades-extracurriculares": "/images/blog-hub/i18n/pt-PT/activities.webp",
    "ouvidoria-reunioes": "/images/blog-hub/i18n/pt-PT/ombudsman.webp",
    certificados: "/images/blog-hub/i18n/pt-PT/certificates.webp",
    crachas: "/images/blog-hub/i18n/pt-PT/badges.webp",
  },
  "en-US": {
    "sistema-academico": "/images/blog-hub/i18n/en-US/academic.webp",
    biblioteca: "/images/blog-hub/i18n/en-US/library.webp",
    comercial: "/images/blog-hub/i18n/en-US/commercial.webp",
    financeiro: "/images/blog-hub/i18n/en-US/overview.webp",
    rh: "/images/blog-hub/i18n/en-US/hr.webp",
    intercambio: "/images/blog-hub/i18n/en-US/overview.webp",
    "atividades-extracurriculares": "/images/blog-hub/i18n/en-US/activities.webp",
    "ouvidoria-reunioes": "/images/blog-hub/i18n/en-US/ombudsman.webp",
    certificados: "/images/blog-hub/i18n/en-US/certificates.webp",
    crachas: "/images/blog-hub/i18n/en-US/badges.webp",
  },
  "es-ES": {
    "sistema-academico": "/images/blog-hub/i18n/es-ES/academic.webp",
    biblioteca: "/images/blog-hub/i18n/es-ES/library.webp",
    comercial: "/images/blog-hub/i18n/es-ES/commercial.webp",
    financeiro: "/images/blog-hub/i18n/es-ES/overview.webp",
    rh: "/images/blog-hub/i18n/es-ES/hr.webp",
    intercambio: "/images/blog-hub/i18n/es-ES/overview.webp",
    "atividades-extracurriculares": "/images/blog-hub/i18n/es-ES/activities.webp",
    "ouvidoria-reunioes": "/images/blog-hub/i18n/es-ES/ombudsman.webp",
    certificados: "/images/blog-hub/i18n/es-ES/certificates.webp",
    crachas: "/images/blog-hub/i18n/es-ES/badges.webp",
  },
  "fr-FR": {
    "sistema-academico": "/images/blog-hub/i18n/fr-FR/academic.webp",
    biblioteca: "/images/blog-hub/i18n/fr-FR/library.webp",
    comercial: "/images/blog-hub/i18n/fr-FR/commercial.webp",
    financeiro: "/images/blog-hub/i18n/fr-FR/overview.webp",
    rh: "/images/blog-hub/i18n/fr-FR/hr.webp",
    intercambio: "/images/blog-hub/i18n/fr-FR/overview.webp",
    "atividades-extracurriculares": "/images/blog-hub/i18n/fr-FR/activities.webp",
    "ouvidoria-reunioes": "/images/blog-hub/i18n/fr-FR/ombudsman.webp",
    certificados: "/images/blog-hub/i18n/fr-FR/certificates.webp",
    crachas: "/images/blog-hub/i18n/fr-FR/badges.webp",
  },
};

type LocalizedContent = Omit<PhanyxResourcePage, "key" | "slug" | "image">;

const ptBR: Record<PhanyxResourceKey, LocalizedContent> = {
  "sistema-academico": {
    eyebrow: "Gestão acadêmica",
    title: "Sistema acadêmico inteligente e completo",
    shortTitle: "Sistema acadêmico",
    description: "Matrículas, turmas, notas, frequência, documentos, regras e automações conectados em uma única plataforma acadêmica.",
    imageAlt: "Sistema acadêmico inteligente e completo do PHANYX",
    intro: "O PHANYX conecta as rotinas acadêmicas desde o cadastro e a matrícula até o acompanhamento do aluno e a conclusão do curso. A inteligência do sistema está em reconhecer contexto, aplicar regras configuradas e reaproveitar informações já cadastradas para reduzir trabalho manual.",
    highlights: [
      { title: "Do ingresso à conclusão", description: "Matrículas, cursos, turmas, disciplinas, frequência, avaliações, documentos e histórico permanecem relacionados ao mesmo aluno." },
      { title: "Regras e automações", description: "Configurações institucionais orientam como fluxos, documentos e ações devem funcionar em cada contexto." },
      { title: "Documentos conforme o contexto", description: "Editores e modelos podem aplicar dados e documentos conforme curso, situação acadêmica e regras definidas." },
      { title: "Áreas conectadas", description: "Administração, departamentos, professores e alunos trabalham em ambientes próprios, compartilhando os dados necessários." },
    ],
    integrationTitle: "Por que chamamos o sistema de inteligente?",
    integrationText: "Não significa que haja IA integrada hoje. A inteligência vem de regras, relacionamentos e automações. Por exemplo, modelos de documentos e certificados podem ser aplicados conforme o contexto acadêmico e as configurações cadastradas.",
    practicalTitle: "Menos retrabalho entre setores",
    practicalText: "Secretaria, coordenação, financeiro, professores e demais departamentos trabalham sobre uma base conectada, reduzindo planilhas e cadastros paralelos.",
  },
  biblioteca: {
    eyebrow: "Biblioteca",
    title: "Gestão de biblioteca integrada ao sistema acadêmico",
    shortTitle: "Biblioteca integrada",
    description: "Acervo físico e digital, catalogação, empréstimos, reservas, renovações, multas e leitura digital conectados à instituição.",
    imageAlt: "Gestão de biblioteca integrada no PHANYX",
    intro: "A biblioteca deixa de funcionar como um sistema isolado. O PHANYX reúne acervo, circulação e recursos digitais no mesmo ecossistema institucional.",
    highlights: [
      { title: "Acervo e catalogação", description: "Cadastro bibliográfico, exemplares, classificação, localização e organização do acervo." },
      { title: "Empréstimos e reservas", description: "Controle de empréstimos, devoluções, reservas e renovações com histórico por usuário." },
      { title: "Multas e regras", description: "Configuração de atraso, carência e valor por dia, com integração financeira quando aplicável." },
      { title: "Biblioteca digital", description: "Obras digitais conforme licença, com leitura, pesquisa, marcações e continuidade de leitura." },
    ],
    integrationTitle: "Biblioteca conectada à instituição",
    integrationText: "Alunos e utilizadores podem ser identificados a partir dos mesmos dados institucionais, evitando cadastros duplicados em sistemas separados.",
    practicalTitle: "Uma visão única do acervo",
    practicalText: "A equipa acompanha circulação, disponibilidade e utilização do acervo dentro do mesmo ambiente de gestão.",
  },
  comercial: {
    eyebrow: "Comercial e captação",
    title: "Captação de leads e setor comercial integrado",
    shortTitle: "Comercial e leads",
    description: "Captação, distribuição, atendimento, tarefas, propostas e conversão de interessados em alunos dentro do mesmo fluxo.",
    imageAlt: "Captação de leads e setor comercial integrado no PHANYX",
    intro: "O setor comercial acompanha o interessado desde a entrada do lead até a conversão, mantendo continuidade com matrícula e operação acadêmica.",
    highlights: [
      { title: "Entrada de leads", description: "Formulários e canais de captação alimentam filas e responsáveis definidos pela instituição." },
      { title: "Distribuição comercial", description: "Rodízio, menor carga, responsável fixo, equipas e distribuição manual ajudam a organizar o atendimento." },
      { title: "Tarefas e contatos", description: "Ligações, WhatsApp, e-mail, reuniões, retornos e propostas ficam organizados no funil." },
      { title: "Conversão conectada", description: "Quando o interessado avança, o processo continua para matrícula e demais etapas sem perder histórico." },
    ],
    integrationTitle: "Do lead à vida acadêmica",
    integrationText: "A captação não termina numa planilha: comercial, matrícula, financeiro e acompanhamento do aluno podem permanecer conectados.",
    practicalTitle: "Visibilidade do funil",
    practicalText: "A instituição acompanha entrada, atendimento, perdas, pausas, conversões e tarefas de cada oportunidade.",
  },
  financeiro: {
    eyebrow: "Financeiro",
    title: "Setor financeiro completo e integrado",
    shortTitle: "Financeiro integrado",
    description: "Mensalidades, cobranças, pagamentos, baixa e relatórios financeiros ligados à vida acadêmica do aluno.",
    imageAlt: "Setor financeiro completo e integrado do PHANYX",
    intro: "Cobrança e contexto acadêmico trabalham melhor quando estão conectados. O PHANYX relaciona a rotina financeira à matrícula e ao aluno.",
    highlights: [
      { title: "Cobranças e mensalidades", description: "Valores, vencimentos, parcelas e cobranças relacionados a matrículas e contratos." },
      { title: "Pagamentos e baixa", description: "Acompanhamento de pagamentos, situações financeiras e ajustes administrativos quando necessários." },
      { title: "Relatórios", description: "Visões para acompanhar recebimentos, pendências e comportamento financeiro da operação." },
      { title: "Integração com a matrícula", description: "O financeiro consulta o mesmo contexto acadêmico usado pelos demais setores." },
    ],
    integrationTitle: "Financeiro conectado ao aluno",
    integrationText: "A instituição reduz divergências entre sistemas ao manter informação financeira e situação acadêmica no mesmo ecossistema.",
    practicalTitle: "Controle sem perder contexto",
    practicalText: "A equipa financeira mantém sua rotina própria sem perder o vínculo com os demais processos acadêmicos e administrativos.",
  },
  rh: {
    eyebrow: "Recursos humanos",
    title: "Sistema de RH completo com acesso móvel integrado",
    shortTitle: "RH com acesso móvel",
    description: "Gestão de pessoas, ponto, solicitações e rotinas de RH integradas ao ambiente institucional e acessíveis em dispositivo móvel.",
    imageAlt: "Sistema de RH completo com acesso móvel integrado no PHANYX",
    intro: "O módulo de RH organiza colaboradores e rotinas de pessoas no mesmo ecossistema da instituição, com experiências adaptadas a dispositivos móveis.",
    highlights: [
      { title: "Colaboradores", description: "Dados funcionais e informações necessárias à gestão das pessoas da instituição." },
      { title: "Ponto e acompanhamento", description: "Recursos para acompanhar jornada e informações do cotidiano do colaborador." },
      { title: "Solicitações", description: "Pedidos e rotinas internas ficam organizados para análise e acompanhamento do RH." },
      { title: "Acesso móvel", description: "Parte das rotinas pode ser consultada e executada em dispositivo móvel." },
    ],
    integrationTitle: "RH dentro da mesma operação institucional",
    integrationText: "Funções, departamentos e permissões podem se relacionar ao restante do ambiente administrativo sem cadastros redundantes.",
    practicalTitle: "Mais autonomia para a equipe",
    practicalText: "O acesso móvel facilita consultas e solicitações do dia a dia enquanto o RH preserva organização e rastreabilidade.",
  },
  intercambio: {
    eyebrow: "Mobilidade internacional",
    title: "Gestão de intercâmbio acadêmico integrada",
    shortTitle: "Intercâmbio acadêmico",
    description: "Convênios, programas, ofertas, vagas, candidaturas, documentos e acompanhamento da mobilidade acadêmica internacional.",
    imageAlt: "Gestão de intercâmbio e mobilidade acadêmica integrada no PHANYX",
    intro: "O PHANYX organiza convênios, programas e oportunidades de mobilidade, permitindo acompanhar candidaturas e documentação em um fluxo próprio.",
    highlights: [
      { title: "Convênios e programas", description: "Parcerias e programas que estruturam as oportunidades internacionais." },
      { title: "Ofertas e vagas", description: "Períodos, datas, vagas, cursos participantes e regras da oferta." },
      { title: "Candidaturas", description: "Candidatos internos e externos, situação, classificação e documentação exigida." },
      { title: "Área do aluno", description: "O estudante acompanha oportunidades e etapas relacionadas à sua candidatura." },
    ],
    integrationTitle: "Mobilidade ligada ao contexto acadêmico",
    integrationText: "Para alunos da instituição, o processo pode aproveitar dados acadêmicos existentes e permanecer conectado à trajetória do estudante.",
    practicalTitle: "Menos planilhas para acompanhar etapas",
    practicalText: "A equipa concentra ofertas, documentos e candidaturas com maior clareza sobre o estágio de cada processo.",
  },
  "atividades-extracurriculares": {
    eyebrow: "Experiências e eventos",
    title: "Controle de atividades extracurriculares, passeios e acampamentos",
    shortTitle: "Atividades e passeios",
    description: "Planejamento, inscrições, participantes e acompanhamento de atividades realizadas além da grade regular.",
    imageAlt: "Gestão de atividades extracurriculares, passeios e acampamentos no PHANYX",
    intro: "Passeios, acampamentos, projetos e outras atividades exigem organização própria. O PHANYX concentra datas, inscrições e participação no ambiente institucional.",
    highlights: [
      { title: "Planejamento", description: "Cadastre atividades, datas, responsáveis e informações necessárias à organização." },
      { title: "Inscrições", description: "Acompanhe inscritos e mantenha participantes ligados à atividade correspondente." },
      { title: "Passeios e acampamentos", description: "Use o mesmo fluxo para diferentes formatos de atividade institucional." },
      { title: "Participação", description: "Tenha uma visão organizada dos alunos e turmas envolvidos." },
    ],
    integrationTitle: "Atividades conectadas aos alunos",
    integrationText: "Os participantes já fazem parte do ambiente acadêmico, reduzindo a necessidade de reconstruir cadastros para cada evento.",
    practicalTitle: "Organização além da sala de aula",
    practicalText: "A escola acompanha experiências que fazem parte da vida institucional mesmo fora da grade curricular.",
  },
  "ouvidoria-reunioes": {
    eyebrow: "Comunicação institucional",
    title: "Ouvidoria e criação de reuniões integradas",
    shortTitle: "Ouvidoria e reuniões",
    description: "Solicitações, feedbacks, atendimentos, agenda e reuniões organizados dentro do mesmo ambiente institucional.",
    imageAlt: "Ouvidoria e criação de reuniões no PHANYX",
    intro: "O PHANYX ajuda a registrar solicitações e organizar reuniões, mantendo histórico, responsáveis e acompanhamento mais claros.",
    highlights: [
      { title: "Ouvidoria", description: "Receba e acompanhe dúvidas, sugestões e manifestações da comunidade institucional." },
      { title: "Atendimentos", description: "Organize respostas e acompanhamento das demandas de forma rastreável." },
      { title: "Reuniões", description: "Crie reuniões com data, participantes e contexto relacionado à instituição." },
      { title: "Histórico", description: "Preserve informações para que decisões não dependam apenas de conversas dispersas." },
    ],
    integrationTitle: "Comunicação com contexto",
    integrationText: "Ouvidoria e reuniões no mesmo ambiente permitem relacionar comunicação, pessoas e processos institucionais.",
    practicalTitle: "Mais continuidade no atendimento",
    practicalText: "O histórico facilita retomadas e reduz o risco de uma demanda se perder quando muda o responsável.",
  },
  certificados: {
    eyebrow: "Documentos acadêmicos",
    title: "Editor integrado de certificados acadêmicos institucionais",
    shortTitle: "Editor de certificados",
    description: "Crie modelos, posicione campos, use variáveis acadêmicas e emita certificados conforme as configurações da instituição.",
    imageAlt: "Editor integrado de certificados acadêmicos institucionais do PHANYX",
    intro: "O editor permite criar modelos próprios conectados aos dados acadêmicos, integrando o documento ao fluxo institucional.",
    highlights: [
      { title: "Modelos visuais", description: "Layouts com textos, imagens, assinaturas e elementos posicionados no documento." },
      { title: "Variáveis acadêmicas", description: "Campos recebem informações do aluno, curso e demais dados do contexto de emissão." },
      { title: "Modelos por curso", description: "Mantenha modelos diferentes relacionados ao tipo de curso ou contexto correspondente." },
      { title: "Pré-visualização e emissão", description: "Confira o documento antes da emissão final e preserve a configuração do editor." },
    ],
    integrationTitle: "O sistema aplica o modelo correto conforme o contexto",
    integrationText: "Regras e vínculos permitem usar o modelo associado ao curso concluído pelo aluno. É um exemplo de automação baseada em contexto e configuração, sem afirmar que exista IA integrada atualmente.",
    practicalTitle: "Padronização institucional",
    practicalText: "Os modelos ficam sob controle da instituição, reduzindo preenchimento repetitivo e mantendo identidade visual consistente.",
  },
  crachas: {
    eyebrow: "Identificação institucional",
    title: "Software integrado para criação de crachás",
    shortTitle: "Criação de crachás",
    description: "Crie crachás acadêmicos e institucionais usando modelos, fotos e dados já existentes no sistema.",
    imageAlt: "Software integrado de criação de crachás no PHANYX",
    intro: "A criação de crachás aproveita informações já cadastradas no PHANYX, reduzindo digitação repetida para alunos e colaboradores.",
    highlights: [
      { title: "Modelos personalizados", description: "Defina aparência, campos e identidade visual dos crachás." },
      { title: "Fotos e dados", description: "Use informações de alunos ou colaboradores já existentes no ambiente institucional." },
      { title: "Identificação", description: "Inclua os campos necessários ao uso acadêmico ou administrativo." },
      { title: "Impressão e exportação", description: "Prepare o resultado conforme o fluxo adotado pela instituição." },
    ],
    integrationTitle: "Dados reaproveitados, menos retrabalho",
    integrationText: "A equipa utiliza cadastros existentes em vez de recriar manualmente nome, foto e demais informações em outra ferramenta.",
    practicalTitle: "Identidade visual sob controle",
    practicalText: "A instituição mantém seus modelos e produz identificações consistentes para diferentes públicos.",
  },
};

const ptPT: Record<PhanyxResourceKey, LocalizedContent> = {
  ...ptBR,
  "sistema-academico": { ...ptBR["sistema-academico"], eyebrow: "Gestão académica", title: "Sistema académico inteligente e completo", shortTitle: "Sistema académico", description: "Matrículas, turmas, notas, assiduidade, documentos, regras e automatizações ligados numa única plataforma académica.", intro: "O PHANYX liga as rotinas académicas desde o registo e a matrícula até ao acompanhamento do aluno e à conclusão do curso. A inteligência do sistema está em reconhecer contexto, aplicar regras configuradas e reutilizar informação já registada.", integrationTitle: "Porque chamamos o sistema de inteligente?", practicalTitle: "Menos retrabalho entre departamentos" },
  biblioteca: { ...ptBR.biblioteca, description: "Acervo físico e digital, catalogação, empréstimos, reservas, renovações, multas e leitura digital ligados à instituição.", intro: "A biblioteca deixa de funcionar como um sistema isolado. O PHANYX reúne acervo, circulação e recursos digitais no mesmo ecossistema institucional." },
  comercial: { ...ptBR.comercial, eyebrow: "Comercial e captação", title: "Captação de leads e área comercial integrada", description: "Captação, distribuição, atendimento, tarefas, propostas e conversão de interessados em alunos dentro do mesmo fluxo." },
  financeiro: { ...ptBR.financeiro, title: "Área financeira completa e integrada", description: "Mensalidades, cobranças, pagamentos, baixa e relatórios financeiros ligados à vida académica do aluno." },
  rh: { ...ptBR.rh, eyebrow: "Recursos humanos", title: "Sistema de RH completo com acesso móvel integrado", description: "Gestão de pessoas, ponto, pedidos e rotinas de RH integradas no ambiente institucional e acessíveis em dispositivo móvel." },
  intercambio: { ...ptBR.intercambio, title: "Gestão de mobilidade internacional integrada", shortTitle: "Mobilidade internacional", description: "Protocolos, programas, ofertas, vagas, candidaturas, documentos e acompanhamento da mobilidade académica internacional." },
  "atividades-extracurriculares": { ...ptBR["atividades-extracurriculares"], title: "Controlo de atividades extracurriculares, visitas e acampamentos", description: "Planeamento, inscrições, participantes e acompanhamento de atividades realizadas além do currículo regular." },
  "ouvidoria-reunioes": { ...ptBR["ouvidoria-reunioes"], title: "Ouvidoria e criação de reuniões integradas", description: "Pedidos, feedback, atendimentos, agenda e reuniões organizados no mesmo ambiente institucional." },
  certificados: { ...ptBR.certificados, title: "Editor integrado de certificados académicos institucionais", description: "Crie modelos, posicione campos, utilize variáveis académicas e emita certificados conforme as configurações da instituição." },
  crachas: { ...ptBR.crachas, title: "Software integrado para criação de cartões de identificação", shortTitle: "Cartões de identificação", description: "Crie cartões académicos e institucionais usando modelos, fotografias e dados já existentes no sistema." },
};

const enUS: Record<PhanyxResourceKey, LocalizedContent> = {
  "sistema-academico": {
    eyebrow: "Academic management", title: "Smart, complete academic management system", shortTitle: "Academic system", description: "Enrollment, classes, grades, attendance, documents, rules and automations connected in one academic platform.", imageAlt: "PHANYX smart and complete academic management system", intro: "PHANYX connects academic operations from enrollment through student follow-up and course completion. Its intelligence comes from context, configured rules and connected data that reduce repetitive work.", highlights: [
      { title: "From enrollment to completion", description: "Programs, classes, subjects, attendance, assessments, documents and records stay connected to the same student." },
      { title: "Rules and automations", description: "Institutional settings guide how workflows, documents and actions behave in each context." },
      { title: "Context-aware documents", description: "Editors and templates can apply the appropriate data and document model according to the academic context." },
      { title: "Connected workspaces", description: "Administration, departments, teachers and students use dedicated areas while sharing the data they need." },
    ], integrationTitle: "Why do we call it smart?", integrationText: "This does not mean PHANYX currently has integrated AI. The intelligence comes from rules, relationships and automation. For example, document and certificate templates can be selected from the academic context and configured rules.", practicalTitle: "Less rework across teams", practicalText: "Academic, finance, administrative and teaching teams work from connected records instead of isolated spreadsheets and duplicate databases."
  },
  biblioteca: {
    eyebrow: "Library", title: "Integrated library management", shortTitle: "Library management", description: "Physical and digital collections, cataloging, loans, reservations, renewals, fines and digital reading connected to the institution.", imageAlt: "Integrated PHANYX library management", intro: "The library no longer needs to operate as an isolated system. PHANYX brings collection management, circulation and digital resources into the same institutional ecosystem.", highlights: [
      { title: "Collection and cataloging", description: "Bibliographic records, copies, classification, location and collection organization." },
      { title: "Loans and reservations", description: "Loans, returns, reservations and renewals with a user history." },
      { title: "Fines and policies", description: "Late-return rules, grace periods and daily amounts, with finance integration where applicable." },
      { title: "Digital library", description: "Licensed digital works with reading, search, highlights and reading continuity." },
    ], integrationTitle: "Library connected to the institution", integrationText: "Students and users can rely on existing institutional records instead of being recreated in a separate library database.", practicalTitle: "One view of the collection", practicalText: "Teams can track circulation, availability and usage inside the same management ecosystem."
  },
  comercial: {
    eyebrow: "Admissions and sales", title: "Lead capture and integrated admissions sales", shortTitle: "Leads and sales", description: "Lead capture, distribution, follow-up, tasks, proposals and conversion in one connected flow.", imageAlt: "PHANYX lead capture and integrated sales workflow", intro: "The admissions team can follow a prospect from first contact to conversion while keeping continuity with enrollment and academic operations.", highlights: [
      { title: "Lead capture", description: "Forms and channels feed queues and owners defined by the institution." },
      { title: "Lead distribution", description: "Round robin, workload, fixed owner, teams and manual routing organize follow-up." },
      { title: "Tasks and contacts", description: "Calls, WhatsApp, email, meetings, follow-ups and proposals stay inside the funnel." },
      { title: "Connected conversion", description: "When a prospect converts, the process can continue into enrollment without losing history." },
    ], integrationTitle: "From lead to student lifecycle", integrationText: "The sales process does not have to end in a spreadsheet. Lead capture, enrollment, finance and student follow-up can stay connected.", practicalTitle: "Funnel visibility", practicalText: "The institution can see intake, follow-up, losses, pauses, conversions and pending tasks for each opportunity."
  },
  financeiro: {
    eyebrow: "Finance", title: "Complete integrated school finance", shortTitle: "Integrated finance", description: "Tuition, billing, payments, reconciliation and financial reporting connected to each student's academic context.", imageAlt: "PHANYX integrated school finance system", intro: "School finance works better when billing and academic context are connected. PHANYX links financial routines to enrollment and student records.", highlights: [
      { title: "Billing and tuition", description: "Amounts, due dates, installments and charges linked to enrollment and contracts." },
      { title: "Payments and reconciliation", description: "Track payments, financial status and administrative adjustments when needed." },
      { title: "Reports", description: "Views for receipts, outstanding balances and financial behavior." },
      { title: "Enrollment integration", description: "Finance works with the same academic context used by other departments." },
    ], integrationTitle: "Finance connected to the student", integrationText: "Keeping financial and academic information in one ecosystem reduces discrepancies between separate systems.", practicalTitle: "Control without losing context", practicalText: "Finance keeps its own workflows while staying connected to academic and administrative operations."
  },
  rh: {
    eyebrow: "Human resources", title: "Complete HR system with mobile access", shortTitle: "HR with mobile access", description: "People management, time tracking, requests and HR routines connected to the institution and available on mobile devices.", imageAlt: "PHANYX complete HR system with mobile access", intro: "The HR module organizes employee information and people operations within the same institutional ecosystem, with mobile-friendly access for day-to-day tasks.", highlights: [
      { title: "Employees", description: "Employment data and the information HR needs to manage institutional teams." },
      { title: "Time and follow-up", description: "Tools to support working-time routines and employee follow-up." },
      { title: "Requests", description: "Internal requests stay organized for HR review and follow-up." },
      { title: "Mobile access", description: "Selected routines can be viewed and completed from mobile devices." },
    ], integrationTitle: "HR inside the same institutional operation", integrationText: "Roles, departments and permissions can connect with the wider administrative environment without duplicate records.", practicalTitle: "More autonomy for employees", practicalText: "Mobile access simplifies everyday requests while HR keeps organization and traceability."
  },
  intercambio: {
    eyebrow: "International mobility", title: "Integrated international mobility management", shortTitle: "International mobility", description: "Agreements, programs, offers, seats, applications, documents and follow-up for international academic mobility.", imageAlt: "PHANYX integrated international mobility management", intro: "PHANYX organizes agreements, programs and mobility opportunities so teams can follow applications and documentation in a dedicated workflow.", highlights: [
      { title: "Agreements and programs", description: "Partnerships and programs that structure mobility opportunities." },
      { title: "Offers and seats", description: "Periods, dates, seats, participating programs and offer rules." },
      { title: "Applications", description: "Internal and external applicants, status, ranking and required documents." },
      { title: "Student area", description: "Students can follow opportunities and application stages in their portal." },
    ], integrationTitle: "Mobility connected to academic context", integrationText: "For enrolled students, mobility can reuse existing academic data and remain connected to the student's broader journey.", practicalTitle: "Fewer spreadsheets for complex processes", practicalText: "Teams can centralize offers, documents and applications with a clearer view of every stage."
  },
  "atividades-extracurriculares": {
    eyebrow: "Activities and events", title: "Extracurricular activities, trips and camps", shortTitle: "Activities and trips", description: "Planning, registrations, participants and follow-up for activities beyond the regular curriculum.", imageAlt: "PHANYX extracurricular activities, trips and camps management", intro: "Trips, camps, projects and extracurricular events need their own organization. PHANYX centralizes dates, registrations and participants inside the institutional environment.", highlights: [
      { title: "Planning", description: "Register activities, dates, owners and the information needed for the event." },
      { title: "Registrations", description: "Track participants and keep them linked to the correct activity." },
      { title: "Trips and camps", description: "Use the same workflow for different extracurricular formats." },
      { title: "Participation", description: "See students and classes involved in each activity." },
    ], integrationTitle: "Activities connected to students", integrationText: "Because participants already belong to the academic environment, the institution does not need to rebuild every record for each event.", practicalTitle: "Organization beyond the classroom", practicalText: "Schools can follow experiences that are part of institutional life even when they are outside the formal curriculum."
  },
  "ouvidoria-reunioes": {
    eyebrow: "Institutional communication", title: "Feedback, requests and meetings in one flow", shortTitle: "Feedback and meetings", description: "Requests, feedback, support, agendas and meetings organized in the same institutional environment.", imageAlt: "PHANYX feedback and meetings management", intro: "PHANYX helps teams register requests and organize meetings so ownership, history and follow-up remain clear.", highlights: [
      { title: "Feedback channel", description: "Receive questions, suggestions and other institutional requests." },
      { title: "Support follow-up", description: "Organize responses and follow-up in a traceable flow." },
      { title: "Meetings", description: "Create meetings with dates, participants and institutional context." },
      { title: "History", description: "Preserve information so decisions do not depend on scattered conversations." },
    ], integrationTitle: "Communication with context", integrationText: "When requests and meetings share the same environment, communication can stay connected to people and institutional processes.", practicalTitle: "Continuity in follow-up", practicalText: "History makes handoffs easier and reduces the chance of a request being lost when ownership changes."
  },
  certificados: {
    eyebrow: "Academic documents", title: "Integrated institutional certificate editor", shortTitle: "Certificate editor", description: "Create templates, position fields, use academic variables and issue certificates according to institutional settings.", imageAlt: "PHANYX integrated academic certificate editor", intro: "The certificate editor lets institutions build their own templates and connect them to academic data, making documents part of the institutional workflow.", highlights: [
      { title: "Visual templates", description: "Create layouts with text, images, signatures and positioned elements." },
      { title: "Academic variables", description: "Fields can receive student, program and other contextual data." },
      { title: "Templates by program", description: "Maintain different templates related to program type or context." },
      { title: "Preview and issue", description: "Review the document before final issuance while preserving editor settings." },
    ], integrationTitle: "The system applies the right template for the context", integrationText: "Rules and relationships can select the template associated with the student's completed program. This is context-driven automation and does not imply that PHANYX currently has integrated AI.", practicalTitle: "Institutional standardization", practicalText: "Templates remain under institutional control, reducing repetitive filling and keeping visual identity consistent."
  },
  crachas: {
    eyebrow: "Institutional identification", title: "Integrated ID badge creation software", shortTitle: "ID badge creation", description: "Create academic and staff ID badges using templates, photos and data that already exist in the system.", imageAlt: "PHANYX integrated ID badge creator", intro: "ID badge creation can reuse information already stored in PHANYX, reducing repetitive data entry for students and staff.", highlights: [
      { title: "Custom templates", description: "Define the appearance, fields and visual identity used on badges." },
      { title: "Photos and data", description: "Use existing student or employee information from the institutional environment." },
      { title: "Identification", description: "Include the fields needed for academic or administrative use." },
      { title: "Print and export", description: "Prepare the output for the institution's chosen workflow." },
    ], integrationTitle: "Reuse data, reduce rework", integrationText: "Teams can use existing records instead of recreating names, photos and other information in a separate tool.", practicalTitle: "Consistent institutional identity", practicalText: "The institution controls its templates and can produce consistent identification for different audiences."
  },
};

const esES: Record<PhanyxResourceKey, LocalizedContent> = {
  "sistema-academico": {
    eyebrow: "Gestión académica", title: "Sistema académico inteligente y completo", shortTitle: "Sistema académico", description: "Matrículas, grupos, notas, asistencia, documentos, reglas y automatizaciones conectados en una única plataforma académica.", imageAlt: "Sistema académico inteligente y completo de PHANYX", intro: "PHANYX conecta las operaciones académicas desde la matrícula hasta el seguimiento del alumno y la finalización del curso. Su inteligencia está en reconocer el contexto, aplicar reglas configuradas y reutilizar datos conectados.",
    highlights: [
      { title: "De la matrícula a la finalización", description: "Programas, grupos, asignaturas, asistencia, evaluaciones, documentos e historial permanecen conectados al mismo alumno." },
      { title: "Reglas y automatizaciones", description: "La configuración institucional orienta cómo funcionan los flujos, documentos y acciones en cada contexto." },
      { title: "Documentos según el contexto", description: "Los editores y plantillas pueden aplicar los datos y modelos adecuados según el contexto académico." },
      { title: "Áreas conectadas", description: "Administración, departamentos, profesores y alumnos trabajan en áreas propias compartiendo los datos necesarios." },
    ],
    integrationTitle: "¿Por qué lo llamamos inteligente?", integrationText: "No significa que PHANYX tenga IA integrada actualmente. La inteligencia proviene de reglas, relaciones y automatizaciones configuradas. Por ejemplo, documentos y certificados pueden seleccionar el modelo adecuado según el contexto académico.", practicalTitle: "Menos trabajo repetido entre áreas", practicalText: "Secretaría, coordinación, finanzas, profesores y demás equipos trabajan con registros conectados en lugar de hojas de cálculo y bases duplicadas."
  },
  biblioteca: {
    eyebrow: "Biblioteca", title: "Gestión de biblioteca integrada", shortTitle: "Biblioteca integrada", description: "Colecciones físicas y digitales, catalogación, préstamos, reservas, renovaciones, multas y lectura digital conectadas a la institución.", imageAlt: "Gestión de biblioteca integrada en PHANYX", intro: "La biblioteca deja de funcionar como un sistema aislado. PHANYX reúne acervo, circulación y recursos digitales en el mismo ecosistema institucional.",
    highlights: [
      { title: "Acervo y catalogación", description: "Registros bibliográficos, ejemplares, clasificación, ubicación y organización del acervo." },
      { title: "Préstamos y reservas", description: "Préstamos, devoluciones, reservas y renovaciones con historial por usuario." },
      { title: "Multas y reglas", description: "Configura retrasos, periodos de gracia y valores diarios, con integración financiera cuando corresponda." },
      { title: "Biblioteca digital", description: "Obras digitales según licencia, con lectura, búsqueda, marcadores y continuidad de lectura." },
    ], integrationTitle: "Biblioteca conectada a la institución", integrationText: "Alumnos y usuarios aprovechan los mismos datos institucionales, evitando registros duplicados en herramientas separadas.", practicalTitle: "Una visión única del acervo", practicalText: "El equipo puede seguir circulación, disponibilidad y uso del acervo dentro del mismo entorno de gestión."
  },
  comercial: {
    eyebrow: "Comercial y captación", title: "Captación de leads y área comercial integrada", shortTitle: "Comercial y leads", description: "Captación, distribución, seguimiento, tareas, propuestas y conversión en un mismo flujo.", imageAlt: "Captación de leads y área comercial integrada en PHANYX", intro: "El equipo comercial puede acompañar al interesado desde el primer contacto hasta la conversión, manteniendo continuidad con matrícula y operación académica.",
    highlights: [
      { title: "Entrada de leads", description: "Formularios y canales de captación alimentan colas y responsables definidos por la institución." },
      { title: "Distribución comercial", description: "Rotación, menor carga, responsable fijo, equipos y distribución manual organizan la atención." },
      { title: "Tareas y contactos", description: "Llamadas, WhatsApp, correo, reuniones, seguimientos y propuestas quedan organizados en el embudo." },
      { title: "Conversión conectada", description: "Cuando el interesado avanza, el proceso continúa hacia la matrícula sin perder el historial." },
    ], integrationTitle: "Del lead a la vida académica", integrationText: "La captación no termina en una hoja de cálculo: comercial, matrícula, finanzas y seguimiento del alumno pueden mantenerse conectados.", practicalTitle: "Visibilidad del embudo", practicalText: "La institución ve entrada, seguimiento, pérdidas, pausas, conversiones y tareas pendientes de cada oportunidad."
  },
  financeiro: {
    eyebrow: "Finanzas", title: "Área financiera completa e integrada", shortTitle: "Finanzas integradas", description: "Cuotas, cobros, pagos, conciliación e informes financieros conectados al contexto académico del alumno.", imageAlt: "Área financiera integrada de PHANYX", intro: "Las finanzas funcionan mejor cuando cobros y contexto académico están conectados. PHANYX relaciona la rutina financiera con matrícula y alumno.",
    highlights: [
      { title: "Cobros y mensualidades", description: "Importes, vencimientos, cuotas y cobros vinculados a matrículas y contratos." },
      { title: "Pagos y conciliación", description: "Seguimiento de pagos, situaciones financieras y ajustes administrativos cuando sean necesarios." },
      { title: "Informes", description: "Vistas para ingresos, pendientes y comportamiento financiero de la operación." },
      { title: "Integración con matrícula", description: "Finanzas trabaja con el mismo contexto académico que utilizan las demás áreas." },
    ], integrationTitle: "Finanzas conectadas al alumno", integrationText: "Mantener información financiera y académica en el mismo ecosistema reduce diferencias entre sistemas separados.", practicalTitle: "Control sin perder contexto", practicalText: "El área financiera conserva sus propios procesos sin perder la conexión con la operación académica y administrativa."
  },
  rh: {
    eyebrow: "Recursos humanos", title: "Sistema de RR. HH. completo con acceso móvil", shortTitle: "RR. HH. móvil", description: "Gestión de personas, control horario, solicitudes y rutinas de RR. HH. integradas y accesibles desde dispositivos móviles.", imageAlt: "Sistema de RR. HH. de PHANYX con acceso móvil", intro: "El módulo de RR. HH. organiza colaboradores y procesos de personas dentro del mismo ecosistema institucional, con acceso adaptado a dispositivos móviles.",
    highlights: [
      { title: "Colaboradores", description: "Datos laborales e información necesaria para gestionar a las personas de la institución." },
      { title: "Control horario", description: "Recursos para acompañar jornada y rutinas cotidianas del colaborador." },
      { title: "Solicitudes", description: "Pedidos internos organizados para análisis y seguimiento del área de RR. HH." },
      { title: "Acceso móvil", description: "Parte de las rutinas puede consultarse y realizarse desde dispositivos móviles." },
    ], integrationTitle: "RR. HH. dentro de la misma operación", integrationText: "Funciones, departamentos y permisos se relacionan con el entorno administrativo sin duplicar registros.", practicalTitle: "Más autonomía para el equipo", practicalText: "El acceso móvil facilita consultas y solicitudes mientras RR. HH. mantiene organización y trazabilidad."
  },
  intercambio: {
    eyebrow: "Movilidad internacional", title: "Gestión integrada de movilidad internacional", shortTitle: "Movilidad internacional", description: "Convenios, programas, ofertas, plazas, candidaturas, documentos y seguimiento de la movilidad académica internacional.", imageAlt: "Gestión de movilidad internacional en PHANYX", intro: "PHANYX organiza convenios, programas y oportunidades para acompañar candidaturas y documentación en un flujo propio.",
    highlights: [
      { title: "Convenios y programas", description: "Alianzas y programas que estructuran las oportunidades de movilidad internacional." },
      { title: "Ofertas y plazas", description: "Periodos, fechas, plazas, cursos participantes y reglas de cada oferta." },
      { title: "Candidaturas", description: "Candidatos internos y externos, estado, clasificación y documentación exigida." },
      { title: "Área del alumno", description: "El estudiante acompaña oportunidades y etapas de su candidatura desde su portal." },
    ], integrationTitle: "Movilidad conectada al contexto académico", integrationText: "Para alumnos de la institución, el proceso aprovecha datos académicos existentes y permanece conectado con su trayectoria.", practicalTitle: "Menos hojas de cálculo", practicalText: "El equipo concentra ofertas, documentos y candidaturas con mayor claridad sobre cada etapa."
  },
  "atividades-extracurriculares": {
    eyebrow: "Actividades y eventos", title: "Actividades extracurriculares, excursiones y campamentos", shortTitle: "Actividades y excursiones", description: "Planificación, inscripciones, participantes y seguimiento de actividades fuera del currículo regular.", imageAlt: "Gestión de actividades extracurriculares en PHANYX", intro: "Excursiones, campamentos, proyectos y otros eventos necesitan organización propia. PHANYX centraliza fechas, inscripciones y participantes.",
    highlights: [
      { title: "Planificación", description: "Registra actividades, fechas, responsables e información necesaria para la organización." },
      { title: "Inscripciones", description: "Acompaña inscritos y mantiene participantes vinculados a la actividad correcta." },
      { title: "Excursiones y campamentos", description: "Utiliza el mismo flujo para diferentes formatos de actividad institucional." },
      { title: "Participación", description: "Obtén una visión organizada de alumnos y grupos involucrados." },
    ], integrationTitle: "Actividades conectadas a los alumnos", integrationText: "Como los participantes ya pertenecen al entorno académico, no es necesario reconstruir sus registros para cada evento.", practicalTitle: "Organización más allá del aula", practicalText: "La institución acompaña experiencias que forman parte de la vida escolar aunque estén fuera del currículo formal."
  },
  "ouvidoria-reunioes": {
    eyebrow: "Comunicación institucional", title: "Atención, feedback y reuniones en un mismo flujo", shortTitle: "Atención y reuniones", description: "Solicitudes, feedback, atención, agenda y reuniones organizados en el mismo entorno institucional.", imageAlt: "Atención y reuniones en PHANYX", intro: "PHANYX ayuda a registrar solicitudes y organizar reuniones para mantener responsables, historial y seguimiento claros.",
    highlights: [
      { title: "Canal de atención", description: "Recibe dudas, sugerencias y otras solicitudes de la comunidad institucional." },
      { title: "Seguimiento", description: "Organiza respuestas y acompañamiento de cada demanda de forma rastreable." },
      { title: "Reuniones", description: "Crea reuniones con fecha, participantes y contexto institucional." },
      { title: "Historial", description: "Conserva información para que las decisiones no dependan de conversaciones dispersas." },
    ], integrationTitle: "Comunicación con contexto", integrationText: "Solicitudes y reuniones en el mismo entorno permiten relacionar comunicación, personas y procesos.", practicalTitle: "Más continuidad en la atención", practicalText: "El historial facilita traspasos y reduce el riesgo de perder una solicitud cuando cambia el responsable."
  },
  certificados: {
    eyebrow: "Documentos académicos", title: "Editor integrado de certificados institucionales", shortTitle: "Editor de certificados", description: "Crea plantillas, posiciona campos, usa variables académicas y emite certificados según la configuración institucional.", imageAlt: "Editor de certificados académicos de PHANYX", intro: "El editor permite construir plantillas propias conectadas a los datos académicos para integrar el documento al flujo institucional.",
    highlights: [
      { title: "Plantillas visuales", description: "Diseña documentos con textos, imágenes, firmas y elementos posicionados." },
      { title: "Variables académicas", description: "Los campos reciben datos del alumno, curso y demás información disponible en el contexto de emisión." },
      { title: "Plantillas por curso", description: "Mantén modelos diferentes relacionados con el tipo de curso o contexto correspondiente." },
      { title: "Vista previa y emisión", description: "Revisa el documento antes de emitirlo conservando la configuración definida." },
    ], integrationTitle: "El sistema aplica la plantilla adecuada según el contexto", integrationText: "Reglas y vínculos permiten utilizar la plantilla asociada al curso concluido por el alumno. Es automatización basada en contexto y configuración, sin afirmar que PHANYX tenga IA integrada actualmente.", practicalTitle: "Estandarización institucional", practicalText: "Las plantillas quedan bajo control de la institución, reduciendo trabajo repetitivo y manteniendo una identidad visual consistente."
  },
  crachas: {
    eyebrow: "Identificación institucional", title: "Software integrado para crear credenciales", shortTitle: "Creación de credenciales", description: "Crea credenciales académicas e institucionales con plantillas, fotos y datos que ya existen en el sistema.", imageAlt: "Creador de credenciales integrado de PHANYX", intro: "La creación de credenciales reutiliza información ya registrada en PHANYX y reduce la digitación repetitiva.",
    highlights: [
      { title: "Plantillas personalizadas", description: "Define apariencia, campos e identidad visual de las credenciales." },
      { title: "Fotos y datos", description: "Utiliza información de alumnos o colaboradores ya registrada en el entorno institucional." },
      { title: "Identificación", description: "Incluye los campos necesarios para el uso académico o administrativo." },
      { title: "Impresión y exportación", description: "Prepara el resultado según el flujo adoptado por la institución." },
    ], integrationTitle: "Reutiliza datos y reduce trabajo", integrationText: "El equipo utiliza registros existentes en lugar de recrear nombre, foto y demás información en otra herramienta.", practicalTitle: "Identidad institucional consistente", practicalText: "La institución controla sus plantillas y produce identificaciones coherentes para diferentes públicos."
  },
};

const frFR: Record<PhanyxResourceKey, LocalizedContent> = {
  "sistema-academico": {
    eyebrow: "Gestion académique", title: "Système académique intelligent et complet", shortTitle: "Système académique", description: "Inscriptions, classes, notes, présence, documents, règles et automatisations réunis dans une même plateforme académique.", imageAlt: "Système académique intelligent et complet PHANYX", intro: "PHANYX relie les opérations académiques de l'inscription au suivi de l'étudiant et à la fin du cursus. Son intelligence vient du contexte, des règles configurées et des données connectées.",
    highlights: [
      { title: "De l'inscription à la fin du cursus", description: "Programmes, classes, matières, présence, évaluations, documents et historique restent liés au même étudiant." },
      { title: "Règles et automatisations", description: "Les paramètres de l'établissement orientent le fonctionnement des flux, documents et actions." },
      { title: "Documents selon le contexte", description: "Les éditeurs et modèles appliquent les données et modèles adaptés au contexte académique." },
      { title: "Espaces connectés", description: "Administration, services, enseignants et étudiants utilisent des espaces dédiés et partagent les données nécessaires." },
    ], integrationTitle: "Pourquoi parler de système intelligent ?", integrationText: "Cela ne signifie pas que PHANYX intègre actuellement une IA. L'intelligence repose sur les règles, les relations et les automatisations configurées. Les documents et certificats peuvent par exemple utiliser le modèle adapté au contexte académique.", practicalTitle: "Moins de ressaisie entre services", practicalText: "Les équipes académiques, financières et administratives travaillent sur des données connectées plutôt que sur des feuilles de calcul séparées."
  },
  biblioteca: {
    eyebrow: "Bibliothèque", title: "Gestion de bibliothèque intégrée", shortTitle: "Bibliothèque intégrée", description: "Fonds physiques et numériques, catalogage, prêts, réservations, renouvellements, pénalités et lecture numérique reliés à l'établissement.", imageAlt: "Gestion de bibliothèque intégrée PHANYX", intro: "La bibliothèque ne fonctionne plus comme un système isolé. PHANYX réunit fonds, circulation et ressources numériques dans le même écosystème.",
    highlights: [
      { title: "Fonds et catalogage", description: "Notices bibliographiques, exemplaires, classification, localisation et organisation du fonds." },
      { title: "Prêts et réservations", description: "Prêts, retours, réservations et renouvellements avec historique par usager." },
      { title: "Pénalités et règles", description: "Paramétrez retards, délais de grâce et montants journaliers, avec intégration financière si nécessaire." },
      { title: "Bibliothèque numérique", description: "Œuvres numériques selon licence, avec lecture, recherche, repères et reprise de lecture." },
    ], integrationTitle: "Bibliothèque connectée à l'établissement", integrationText: "Étudiants et usagers utilisent les mêmes données institutionnelles sans recréer des comptes dans un outil séparé.", practicalTitle: "Une vue unique du fonds", practicalText: "L'équipe suit circulation, disponibilité et utilisation du fonds dans le même environnement de gestion."
  },
  comercial: {
    eyebrow: "Admissions et commercial", title: "Acquisition de prospects et suivi commercial intégrés", shortTitle: "Prospects et commercial", description: "Acquisition, attribution, suivi, tâches, propositions et conversion dans un même flux.", imageAlt: "Acquisition de prospects et suivi commercial dans PHANYX", intro: "L'équipe admissions suit un prospect du premier contact à la conversion tout en gardant la continuité avec l'inscription et les opérations académiques.",
    highlights: [
      { title: "Entrée des prospects", description: "Formulaires et canaux alimentent les files et responsables définis par l'établissement." },
      { title: "Attribution commerciale", description: "Rotation, charge, responsable fixe, équipes et attribution manuelle structurent le suivi." },
      { title: "Tâches et contacts", description: "Appels, WhatsApp, e-mails, réunions, relances et propositions restent dans le pipeline." },
      { title: "Conversion connectée", description: "Après conversion, le processus peut continuer vers l'inscription sans perdre l'historique." },
    ], integrationTitle: "Du prospect au parcours étudiant", integrationText: "Le processus commercial ne s'arrête pas dans une feuille de calcul : acquisition, inscription, finance et suivi peuvent rester reliés.", practicalTitle: "Visibilité du pipeline", practicalText: "L'établissement visualise entrées, suivis, pertes, pauses, conversions et tâches de chaque opportunité."
  },
  financeiro: {
    eyebrow: "Finance", title: "Gestion financière complète et intégrée", shortTitle: "Finance intégrée", description: "Frais de scolarité, facturation, paiements, rapprochement et rapports reliés au contexte académique de l'étudiant.", imageAlt: "Gestion financière intégrée PHANYX", intro: "La finance scolaire fonctionne mieux lorsque facturation et contexte académique sont reliés. PHANYX connecte les opérations financières à l'inscription et à l'étudiant.",
    highlights: [
      { title: "Facturation et échéances", description: "Montants, dates, versements et factures liés aux inscriptions et contrats." },
      { title: "Paiements et rapprochement", description: "Suivez paiements, situations financières et ajustements administratifs." },
      { title: "Rapports", description: "Vues sur encaissements, impayés et comportement financier de l'activité." },
      { title: "Intégration avec l'inscription", description: "La finance utilise le même contexte académique que les autres services." },
    ], integrationTitle: "Finance connectée à l'étudiant", integrationText: "Réunir données financières et académiques réduit les écarts entre systèmes séparés.", practicalTitle: "Contrôle sans perdre le contexte", practicalText: "Le service financier conserve ses propres processus tout en restant relié aux opérations académiques et administratives."
  },
  rh: {
    eyebrow: "Ressources humaines", title: "Système RH complet avec accès mobile", shortTitle: "RH avec accès mobile", description: "Gestion des collaborateurs, temps, demandes et processus RH intégrés et accessibles sur mobile.", imageAlt: "Système RH PHANYX avec accès mobile", intro: "Le module RH organise collaborateurs et processus RH dans le même écosystème institutionnel, avec un accès adapté aux appareils mobiles.",
    highlights: [
      { title: "Collaborateurs", description: "Données professionnelles et informations nécessaires à la gestion des équipes." },
      { title: "Temps et suivi", description: "Fonctions pour accompagner les horaires et le quotidien des collaborateurs." },
      { title: "Demandes", description: "Les demandes internes sont organisées pour traitement et suivi par les RH." },
      { title: "Accès mobile", description: "Certaines opérations peuvent être consultées et réalisées sur mobile." },
    ], integrationTitle: "Les RH dans la même organisation", integrationText: "Fonctions, services et autorisations restent reliés au reste de l'environnement administratif sans duplication.", practicalTitle: "Plus d'autonomie pour les équipes", practicalText: "L'accès mobile simplifie les demandes courantes tout en conservant organisation et traçabilité."
  },
  intercambio: {
    eyebrow: "Mobilité internationale", title: "Gestion intégrée de la mobilité internationale", shortTitle: "Mobilité internationale", description: "Accords, programmes, offres, places, candidatures, documents et suivi de la mobilité académique internationale.", imageAlt: "Gestion de la mobilité internationale PHANYX", intro: "PHANYX organise accords, programmes et opportunités afin de suivre candidatures et documents dans un flux dédié.",
    highlights: [
      { title: "Accords et programmes", description: "Partenariats et programmes qui structurent les opportunités de mobilité." },
      { title: "Offres et places", description: "Périodes, dates, places, cursus participants et règles de chaque offre." },
      { title: "Candidatures", description: "Candidats internes et externes, statut, classement et pièces demandées." },
      { title: "Espace étudiant", description: "L'étudiant suit les opportunités et les étapes de sa candidature depuis son portail." },
    ], integrationTitle: "Mobilité liée au contexte académique", integrationText: "Pour les étudiants de l'établissement, le processus peut réutiliser les données académiques existantes et rester lié au parcours étudiant.", practicalTitle: "Moins de feuilles de calcul", practicalText: "L'équipe centralise offres, documents et candidatures avec une vue claire de chaque étape."
  },
  "atividades-extracurriculares": {
    eyebrow: "Activités et événements", title: "Activités extrascolaires, sorties et séjours", shortTitle: "Activités et sorties", description: "Planification, inscriptions, participants et suivi des activités au-delà du programme régulier.", imageAlt: "Gestion des activités extrascolaires dans PHANYX", intro: "Sorties, séjours, projets et autres événements demandent une organisation propre. PHANYX centralise dates, inscriptions et participants.",
    highlights: [
      { title: "Planification", description: "Enregistrez activités, dates, responsables et informations nécessaires à l'organisation." },
      { title: "Inscriptions", description: "Suivez les inscrits et associez chaque participant à la bonne activité." },
      { title: "Sorties et séjours", description: "Utilisez le même flux pour différents formats d'activités institutionnelles." },
      { title: "Participation", description: "Visualisez clairement les étudiants et classes impliqués." },
    ], integrationTitle: "Activités connectées aux étudiants", integrationText: "Les participants étant déjà présents dans l'environnement académique, l'établissement n'a pas à recréer leurs données pour chaque événement.", practicalTitle: "Organisation au-delà de la classe", practicalText: "L'établissement suit les expériences qui font partie de la vie scolaire même hors du programme formel."
  },
  "ouvidoria-reunioes": {
    eyebrow: "Communication institutionnelle", title: "Demandes, retours et réunions dans un même flux", shortTitle: "Demandes et réunions", description: "Demandes, retours, suivi, agenda et réunions organisés dans le même environnement institutionnel.", imageAlt: "Demandes et réunions dans PHANYX", intro: "PHANYX aide à enregistrer les demandes et organiser les réunions afin de conserver responsables, historique et suivi.",
    highlights: [
      { title: "Canal de demandes", description: "Recevez questions, suggestions et autres sollicitations de la communauté." },
      { title: "Suivi", description: "Organisez réponses et traitement de chaque demande de manière traçable." },
      { title: "Réunions", description: "Créez des réunions avec date, participants et contexte institutionnel." },
      { title: "Historique", description: "Conservez les informations utiles pour que les décisions ne dépendent pas de conversations dispersées." },
    ], integrationTitle: "Communication avec contexte", integrationText: "Demandes et réunions dans un même environnement relient communication, personnes et processus.", practicalTitle: "Plus de continuité dans le suivi", practicalText: "L'historique facilite les relais et réduit le risque de perdre une demande lorsque le responsable change."
  },
  certificados: {
    eyebrow: "Documents académiques", title: "Éditeur intégré de certificats institutionnels", shortTitle: "Éditeur de certificats", description: "Créez des modèles, positionnez les champs, utilisez les variables académiques et émettez les certificats selon les paramètres de l'établissement.", imageAlt: "Éditeur de certificats académiques PHANYX", intro: "L'éditeur permet de créer des modèles propres reliés aux données académiques afin d'intégrer les documents au flux institutionnel.",
    highlights: [
      { title: "Modèles visuels", description: "Composez des documents avec textes, images, signatures et éléments positionnés." },
      { title: "Variables académiques", description: "Les champs reçoivent les données de l'étudiant, du cursus et du contexte d'émission." },
      { title: "Modèles par cursus", description: "Maintenez différents modèles liés au type de cursus ou au contexte correspondant." },
      { title: "Aperçu et émission", description: "Vérifiez le document avant émission tout en conservant les paramètres de l'éditeur." },
    ], integrationTitle: "Le système applique le bon modèle selon le contexte", integrationText: "Les règles et liens permettent d'utiliser le modèle associé au cursus terminé par l'étudiant. Il s'agit d'une automatisation fondée sur le contexte et les paramètres, sans prétendre que PHANYX intègre actuellement une IA.", practicalTitle: "Standardisation institutionnelle", practicalText: "Les modèles restent sous le contrôle de l'établissement, réduisent les saisies répétitives et préservent l'identité visuelle."
  },
  crachas: {
    eyebrow: "Identification institutionnelle", title: "Logiciel intégré de création de badges", shortTitle: "Création de badges", description: "Créez des badges étudiants et collaborateurs avec des modèles, photos et données déjà présentes dans le système.", imageAlt: "Créateur de badges intégré PHANYX", intro: "La création de badges réutilise les informations déjà enregistrées dans PHANYX et réduit les saisies répétitives.",
    highlights: [
      { title: "Modèles personnalisés", description: "Définissez l'apparence, les champs et l'identité visuelle des badges." },
      { title: "Photos et données", description: "Utilisez les informations étudiantes ou collaborateurs déjà présentes dans l'environnement." },
      { title: "Identification", description: "Incluez les champs nécessaires à l'usage académique ou administratif." },
      { title: "Impression et export", description: "Préparez le résultat selon le flux choisi par l'établissement." },
    ], integrationTitle: "Réutiliser les données, réduire la ressaisie", integrationText: "Les équipes utilisent les dossiers existants au lieu de recréer noms, photos et autres informations dans un outil séparé.", practicalTitle: "Une identité institutionnelle cohérente", practicalText: "L'établissement garde le contrôle de ses modèles et produit des identifications cohérentes pour différents publics."
  },
};

export const phanyxResourcePages: Record<LocalePhanyx, Record<PhanyxResourceKey, PhanyxResourcePage>> = {
  "pt-BR": Object.fromEntries(phanyxResourceKeys.map((key) => [key, { key, slug: slugs[key]["pt-BR"], image: images["pt-BR"][key], ...ptBR[key] }])) as Record<PhanyxResourceKey, PhanyxResourcePage>,
  "pt-PT": Object.fromEntries(phanyxResourceKeys.map((key) => [key, { key, slug: slugs[key]["pt-PT"], image: images["pt-PT"][key], ...ptPT[key] }])) as Record<PhanyxResourceKey, PhanyxResourcePage>,
  "en-US": Object.fromEntries(phanyxResourceKeys.map((key) => [key, { key, slug: slugs[key]["en-US"], image: images["en-US"][key], ...enUS[key] }])) as Record<PhanyxResourceKey, PhanyxResourcePage>,
  "es-ES": Object.fromEntries(phanyxResourceKeys.map((key) => [key, { key, slug: slugs[key]["es-ES"], image: images["es-ES"][key], ...esES[key] }])) as Record<PhanyxResourceKey, PhanyxResourcePage>,
  "fr-FR": Object.fromEntries(phanyxResourceKeys.map((key) => [key, { key, slug: slugs[key]["fr-FR"], image: images["fr-FR"][key], ...frFR[key] }])) as Record<PhanyxResourceKey, PhanyxResourcePage>,
};

export function phanyxResourcePath(locale: LocalePhanyx, key: PhanyxResourceKey) {
  const page = phanyxResourcePages[locale][key];
  return locale === "pt-BR"
    ? `/blog/${phanyxResourceSection[locale]}/${page.slug}`
    : `/${locale}/blog/${phanyxResourceSection[locale]}/${page.slug}`;
}

export function getPhanyxResourceBySlug(locale: LocalePhanyx, slug: string) {
  return phanyxResourceKeys
    .map((key) => phanyxResourcePages[locale][key])
    .find((page) => page.slug === slug);
}

export function phanyxResourceLanguagePaths(key: PhanyxResourceKey) {
  return Object.fromEntries(
    (["pt-BR", "pt-PT", "en-US", "es-ES", "fr-FR"] as LocalePhanyx[]).map((locale) => [locale, phanyxResourcePath(locale, key)]),
  ) as Record<LocalePhanyx, string>;
}
