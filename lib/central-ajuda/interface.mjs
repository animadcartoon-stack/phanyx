export const languages = {
  en: 'English', 'pt-br': 'Português (Brasil)', 'pt-pt': 'Português (Portugal)',
  es: 'Español', fr: 'Français'
};

const keys = [
  'help','home','admin','teacher','student','trouble','open','intro','search','placeholder',
  'roles','adminDescription','teacherDescription','studentDescription','browse','popular',
  'supportTitle','supportDescription','support','language','skip','contents','steps','tip',
  'related','previous','next','articles','results','noResults','count','close','zoom',
  'screen','screenPt','notFound','retry','portal','inThisArticle','topicNav','where','searchError'
];

const values = {
  en: [
    'Help Center','Home','Administration','Teacher portal','Student portal','Troubleshooting','Open PHANYX',
    'Step-by-step guides for administrators, teachers, and students.','Search','Search by topic or task',
    'Explore by role','Manage courses, classes, enrollments, and institutional documents.',
    'Record attendance, find materials, and submit lesson plans.','Access lessons, turn in work, and check your records.',
    'Browse guides','Common tasks','Need more help?','Contact PHANYX support if you still have a question.',
    'PHANYX support','Language','Skip to content','Guide contents','Step by step','Tip','Related guides',
    'Previous','Next','Guides','Search results','No matching guides. Try a different term.',
    '{n} results','Close','Enlarge screenshot','PHANYX screenshot','Example screenshot in Brazilian Portuguese',
    'Guide not found','Back to Help Center','Open this area in PHANYX','On this page','Browse topics',
    'Where to go','Unable to load the guides. Reload this page to try again.'
  ],
  'pt-br': [
    'Central de Ajuda','Início','Área administrativa','Área do professor','Área do aluno','Solução de problemas','Abrir PHANYX',
    'Guias passo a passo para administradores, professores e alunos.','Buscar','Busque por assunto ou tarefa',
    'Encontre seu perfil','Gerencie cursos, turmas, matrículas e documentos da instituição.',
    'Faça chamadas, encontre materiais e envie planos de aula.','Acesse aulas, entregue trabalhos e consulte seus registros.',
    'Ver guias','Tarefas frequentes','Precisa de mais ajuda?','Fale com o suporte do PHANYX se ainda tiver dúvidas.',
    'Suporte PHANYX','Idioma','Pular para o conteúdo','Sumário dos guias','Passo a passo','Dica','Guias relacionados',
    'Anterior','Próximo','Guias','Resultados da busca','Nenhum guia encontrado. Tente outro termo.',
    '{n} resultados','Fechar','Ampliar o print','Captura de tela do PHANYX','Captura de exemplo em português do Brasil',
    'Guia não encontrado','Voltar à Central de Ajuda','Abrir esta área no PHANYX','Nesta página','Navegar por assunto',
    'Onde acessar','Não foi possível carregar os guias. Recarregue a página para tentar de novo.'
  ],
  'pt-pt': [
    'Centro de Ajuda','Início','Área administrativa','Área do docente','Área do estudante','Resolução de problemas','Abrir PHANYX',
    'Guias passo a passo para administradores, docentes e estudantes.','Pesquisar','Pesquise por tema ou tarefa',
    'Escolha o seu perfil','Faça a gestão de cursos, turmas, inscrições e documentos da instituição.',
    'Registe presenças, encontre materiais e envie planos de aula.','Aceda às aulas, entregue trabalhos e consulte os seus registos.',
    'Consultar guias','Tarefas frequentes','Precisa de mais ajuda?','Contacte o apoio PHANYX se ainda tiver dúvidas.',
    'Apoio PHANYX','Idioma','Saltar para o conteúdo','Índice dos guias','Passo a passo','Sugestão','Guias relacionados',
    'Anterior','Seguinte','Guias','Resultados da pesquisa','Não foram encontrados guias. Experimente outro termo.',
    '{n} resultados','Fechar','Ampliar a captura','Captura de ecrã do PHANYX','Captura de exemplo em português do Brasil',
    'Guia não encontrado','Voltar ao Centro de Ajuda','Abrir esta área no PHANYX','Nesta página','Navegar por tema',
    'Onde aceder','Não foi possível carregar os guias. Atualize a página para tentar novamente.'
  ],
  es: [
    'Centro de ayuda','Inicio','Área administrativa','Área docente','Área del estudiante','Solución de problemas','Abrir PHANYX',
    'Guías paso a paso para administradores, docentes y estudiantes.','Buscar','Busca por tema o tarea',
    'Elige tu perfil','Gestiona cursos, grupos, matrículas y documentos de tu institución.',
    'Registra la asistencia, encuentra materiales y envía planes de clase.','Accede a las clases, entrega trabajos y consulta tu expediente.',
    'Ver guías','Tareas frecuentes','¿Necesitas más ayuda?','Contacta con el soporte de PHANYX si aún tienes dudas.',
    'Soporte de PHANYX','Idioma','Saltar al contenido','Índice de guías','Paso a paso','Consejo','Guías relacionadas',
    'Anterior','Siguiente','Guías','Resultados de búsqueda','No se encontraron guías. Prueba con otro término.',
    '{n} resultados','Cerrar','Ampliar captura','Captura de pantalla de PHANYX','Captura de ejemplo en portugués de Brasil',
    'Guía no encontrada','Volver al Centro de ayuda','Abrir esta área en PHANYX','En esta página','Explorar por tema',
    'Dónde acceder','No se han podido cargar las guías. Recarga la página para volver a intentarlo.'
  ],
  fr: [
    'Centre d’aide','Accueil','Administration','Espace enseignant','Espace étudiant','Dépannage','Ouvrir PHANYX',
    'Des guides pas à pas pour les administrateurs, les enseignants et les étudiants.','Rechercher','Rechercher un sujet ou une tâche',
    'Choisissez votre profil','Gérez les cours, les classes, les inscriptions et les documents de l’établissement.',
    'Faites l’appel, trouvez des ressources et transmettez vos plans de cours.','Accédez aux cours, remettez vos devoirs et consultez votre dossier.',
    'Voir les guides','Tâches fréquentes','Besoin d’aide ?','Contactez l’assistance PHANYX si vous avez encore une question.',
    'Assistance PHANYX','Langue','Aller au contenu','Sommaire des guides','Étapes','Conseil','Guides associés',
    'Précédent','Suivant','Guides','Résultats de recherche','Aucun guide trouvé. Essayez un autre terme.',
    '{n} résultats','Fermer','Agrandir la capture','Capture d’écran de PHANYX','Exemple de capture en portugais du Brésil',
    'Guide introuvable','Retour au Centre d’aide','Ouvrir cet espace dans PHANYX','Sur cette page','Parcourir les sujets',
    'Où aller','Impossible de charger les guides. Actualisez la page pour réessayer.'
  ]
};

const extraLabels = {
  en: {start:'Get started', startDescription:'Find the right PHANYX portal or see how to get PHANYX for your institution.', troubleDescription:'Recover your password or find the portal and menus you need.', plans:'View PHANYX plans', youtube:'PHANYX on YouTube'},
  'pt-br': {start:'Primeiros passos', startDescription:'Aprenda a acessar o PHANYX ou saiba como aderir pela sua instituição.', troubleDescription:'Recupere sua senha e encontre o portal ou menu que precisa.', plans:'Ver planos do PHANYX', youtube:'PHANYX Acadêmico no YouTube'},
  'pt-pt': {start:'Primeiros passos', startDescription:'Saiba como aceder ao PHANYX ou aderir através da sua instituição.', troubleDescription:'Recupere a sua palavra-passe e encontre o portal ou menu pretendido.', plans:'Consultar planos PHANYX', youtube:'PHANYX Académico no YouTube'},
  es: {start:'Primeros pasos', startDescription:'Aprende a acceder a PHANYX o descubre cómo contratarlo para tu institución.', troubleDescription:'Recupera tu contraseña o encuentra el portal y los menús que necesitas.', plans:'Ver planes de PHANYX', youtube:'PHANYX en YouTube'},
  fr: {start:'Premiers pas', startDescription:'Trouvez votre espace PHANYX ou découvrez comment adopter la plateforme dans votre établissement.', troubleDescription:'Réinitialisez votre mot de passe ou retrouvez votre espace et vos menus.', plans:'Consulter les offres PHANYX', youtube:'PHANYX sur YouTube'}
};

export const ui = Object.fromEntries(Object.entries(values).map(([locale, labels]) => [
  locale, {...Object.fromEntries(keys.map((key, position) => [key, labels[position]])), ...extraLabels[locale]}
]));
