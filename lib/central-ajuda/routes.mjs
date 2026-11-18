import { languages } from './interface.mjs';

export const helpPageIds = [
  'start','admin','teacher','student','trouble','get-started','join',
  'admin-login','courses','classes','enrollment','templates','send-plan',
  'teacher-login','attendance','teacher-docs','materials',
  'student-login','subjects','assignments','grades','certificates','reset','access'
];

const slugs = {
  en: [
    'get-started','administration','teacher-portal','student-portal','troubleshooting','how-to-use-phanyx','get-phanyx-for-your-institution',
    'admin-sign-in','create-a-course','create-a-class','enroll-a-student','create-a-lesson-plan-template','send-documents-to-teachers',
    'how-to-sign-in-to-the-teacher-portal','record-class-attendance','submit-a-lesson-plan','find-class-materials',
    'how-to-sign-in-to-the-student-portal','open-subjects-and-lessons','submit-an-assignment','check-grades-and-attendance','download-a-certificate','reset-your-password','find-a-missing-menu'
  ],
  'pt-br': [
    'primeiros-passos','area-administrativa','area-do-professor','area-do-aluno','solucao-de-problemas','como-acessar-e-usar-o-phanyx','como-aderir-ao-phanyx',
    'entrar-na-area-administrativa','cadastrar-um-curso','criar-uma-turma','fazer-uma-matricula','criar-modelo-de-plano-de-aula','enviar-documento-aos-professores',
    'como-entrar-na-area-do-professor','como-fazer-chamada','enviar-plano-de-aula','localizar-materiais-da-aula',
    'como-entrar-na-area-do-aluno','acessar-disciplinas-e-aulas','entregar-um-trabalho','consultar-notas-e-presencas','baixar-um-certificado','recuperar-senha','menu-ou-portal-indisponivel'
  ],
  'pt-pt': [
    'primeiros-passos','area-administrativa','area-do-docente','area-do-estudante','resolucao-de-problemas','como-aceder-e-usar-o-phanyx','aderir-ao-phanyx',
    'entrar-na-area-administrativa','criar-um-curso','criar-uma-turma','criar-uma-inscricao','criar-modelo-de-plano-de-aula','enviar-documento-aos-docentes',
    'entrar-na-area-do-docente','registar-presencas','enviar-plano-de-aula','encontrar-materiais-da-aula',
    'entrar-na-area-do-estudante','aceder-a-disciplinas-e-aulas','entregar-um-trabalho','consultar-classificacoes-e-presencas','descarregar-um-certificado','recuperar-palavra-passe','menu-ou-portal-indisponivel'
  ],
  es: [
    'primeros-pasos','administracion','area-docente','area-del-estudiante','solucion-de-problemas','como-acceder-y-usar-phanyx','contratar-phanyx',
    'entrar-en-administracion','crear-un-curso','crear-un-grupo','crear-una-matricula','crear-una-plantilla-de-plan-de-clase','enviar-documentos-a-docentes',
    'entrar-en-el-area-docente','registrar-asistencia','enviar-un-plan-de-clase','encontrar-materiales',
    'entrar-en-el-area-del-estudiante','acceder-a-asignaturas','entregar-un-trabajo','consultar-calificaciones-y-asistencia','descargar-un-certificado','restablecer-contrasena','menu-o-portal-no-disponible'
  ],
  fr: [
    'premiers-pas','administration','espace-enseignant','espace-etudiant','depannage','comment-utiliser-phanyx','adopter-phanyx',
    'se-connecter-a-l-administration','creer-un-cours','creer-une-classe','inscrire-un-etudiant','creer-un-modele-de-plan-de-cours','envoyer-des-documents-aux-enseignants',
    'se-connecter-a-l-espace-enseignant','faire-l-appel','transmettre-un-plan-de-cours','trouver-des-ressources',
    'se-connecter-a-l-espace-etudiant','acceder-aux-matieres','remettre-un-devoir','consulter-les-notes-et-presences','telecharger-un-certificat','reinitialiser-le-mot-de-passe','menu-ou-portail-indisponible'
  ]
};

const routeNames = Object.fromEntries(Object.entries(slugs).map(([locale, values]) => [
  locale, Object.fromEntries(helpPageIds.map((id,index)=>[id,values[index]]))
]));
export const htmlLocale = {en:'en', 'pt-br':'pt-BR', 'pt-pt':'pt-PT', es:'es', fr:'fr'};
export const locales = Object.keys(languages);

export const helpOrigin = 'https://www.phanyx.com.br';

export function pagePath(locale, page = 'home') {
  const prefix = locale === 'en' ? '/ajuda' : '/ajuda/'+locale;
  if (page === 'home') return prefix;
  if (page === 'search') return prefix+'/search';
  const slug = routeNames[locale][page];
  if (!slug) throw new Error('Unknown help page: '+page);
  return prefix+'/'+slug;
}

const pagesByPath = new Map(locales.flatMap(locale =>
  ['home','search',...helpPageIds].map(page=>[pagePath(locale,page),{locale,page}])
));

export function resolveHelpPage(pathname) {
  return pagesByPath.get(pathname.replace(/\/$/,''));
}

export function alternateUrls(page) {
  return Object.fromEntries([
    ...locales.map(locale=>[htmlLocale[locale],helpOrigin+pagePath(locale,page)]),
    ['x-default',helpOrigin+pagePath('en',page)]
  ]);
}

export function helpSitemapPages() {
  return ['home',...helpPageIds].flatMap(page=>{
    const languages = alternateUrls(page);
    return locales.map(locale=>({
      url:helpOrigin+pagePath(locale,page),
      alternates:{languages}
    }));
  });
}
