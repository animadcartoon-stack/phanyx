import { languages, ui } from './interface.mjs';
import { guideImages, imageCaptions } from './guide-images.mjs';
import { pagePath } from './routes.mjs';

const site = 'https://www.phanyx.com.br';
const supportUrl = site + '/suporte';
const youtubeUrl = 'https://www.youtube.com/@PhanyxAcad%C3%AAmico';
export const roleTopics = {
  start: ['get-started','join'],
  admin: ['admin-login','courses','classes','enrollment','templates','send-plan'],
  teacher: ['teacher-login','attendance','teacher-docs','materials'],
  student: ['student-login','subjects','assignments','grades','certificates'],
  trouble: ['reset','access']
};
const featured = ['get-started','teacher-login','student-login','enrollment','attendance','assignments'];
const loginPaths = {admin:'/login?portal=admin',teacher:'/login?portal=professor',student:'/login?portal=aluno'};
const paths = {
  'get-started':'/', join:'/planos',
  'admin-login':loginPaths.admin, 'teacher-login':loginPaths.teacher, 'student-login':loginPaths.student,
  courses:'/admin/cursos', classes:'/admin/turmas', enrollment:'/admin/matriculas',
  templates:'/admin/documentos/templates', 'send-plan':'/admin/documentos-docentes', attendance:'/professor/turmas',
  'teacher-docs':'/professor/documentos', materials:'/professor/aulas', subjects:'/aluno/disciplinas',
  assignments:'/aluno/trabalhos', grades:'/aluno/boletim', certificates:'/aluno/certificados'
};
const icons = {
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  admin:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18m-11 0v3h4v-3"/>',
  teacher:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4m-4 0h8M7 8h10m-10 4h6"/>',
  student:'<path d="m2 10 10-5 10 5-10 5-10-5Zm4 2v5c3 3 9 3 12 0v-5m4-2v7"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  path:'<path d="M5 5v10a3 3 0 0 0 3 3h10m-4-4 4 4-4 4"/><circle cx="5" cy="5" r="2"/>'
};
const icon = name => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>';
const escape = value => String(value).replace(/[&<>"']/g, character => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]
));
const rich = value => escape(value).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
const nativeUrl = id => site + (paths[id] ?? '/');
const roles = Object.fromEntries(Object.entries(roleTopics).flatMap(([role,ids])=>ids.map(id=>[id,role])));

export function parseArticles(data) {
  return Object.fromEntries(data.map(([id,title,intro,path,first,second,third,note])=>{
    return [id,{id,title,intro,path,steps:[first,second,third],note,role:roles[id]}];
  }));
}

export function renderPage(lang, page, articles, query = '') {
  const label = ui[lang];
  const articleId = Object.hasOwn(roles, page) ? page : null;
  const topicUrl = id => pagePath(lang,id);
  const roleUrl = role => pagePath(lang,role);
  const locationFor = () => pagePath(lang);

  function searchForm(value = '') {
    return '<form class="search-form" action="'+pagePath(lang,'search')+'" method="get" role="search">' +
      icon('search') +
      '<input type="search" name="q" aria-label="'+escape(label.placeholder)+'" placeholder="'+escape(label.placeholder)+'" maxlength="150" value="'+escape(value)+'" required>' +
      '<button class="primary" type="submit">'+label.search+'</button></form>';
  }

  function header(role) {
    const navItems = ['home','start','admin','teacher','student','trouble'];
    return '<a class="skip" href="#main">'+label.skip+'</a><header class="header"><div class="wrap header-inner">' +
      '<a class="brand" href="'+locationFor()+'"><img class="brand-logo" src="/ajuda-assets/phanyx-wordmark.png" width="414" height="130" alt="PHANYX"><span class="brand-name">'+label.help+'</span></a>' +
      '<div class="header-actions"><label class="lang"><span class="screen-reader">'+label.language+'</span><select id="locale">'+
      Object.entries(languages).map(([value,name])=>'<option value="'+pagePath(value,page === 'not-found' ? 'home' : page)+'" lang="'+value+'"'+(value===lang?' selected':'')+'>'+name+'</option>').join('') +
      '</select></label><a class="open-app" href="'+(role in loginPaths ? site+loginPaths[role] : site)+'">'+label.open+'</a></div></div></header>' +
      '<nav class="navbar" aria-label="'+label.topicNav+'"><div class="wrap nav-inner">'+navItems.map(key=>{
        const href = key === 'home' ? locationFor() : roleUrl(key);
        const active = key === role || (key === 'home' && page === 'home');
        return '<a href="'+href+'"'+(active?' aria-current="page"':'')+'>'+label[key]+'</a>';
      }).join('')+'</div></nav>';
  }

  function supportBand() {
    return '<section class="support-band"><div><h2>'+label.supportTitle+'</h2><p>'+label.supportDescription+'</p></div><a class="primary" href="'+supportUrl+'">'+label.support+' '+icon('arrow')+'</a></section>';
  }

  function footer() {
    return '<footer class="footer"><div class="wrap"><span>PHANYX · '+label.help+'</span><div><a href="'+youtubeUrl+'">'+label.youtube+'</a><a href="'+supportUrl+'">'+label.support+'</a><a href="'+site+'">phanyx.com.br</a></div></div></footer>';
  }

  function resource(article) {
    return '<a class="resource" href="'+topicUrl(article.id)+'"><span>'+label[article.role]+'</span><h3>'+escape(article.title)+'</h3><p>'+escape(article.intro)+'</p></a>';
  }

  function home(articles) {
    const cards = ['admin','teacher','student'].map(role => '<section class="role-card '+role+'"><span class="tile-icon">'+icon(role)+'</span><h3>'+label[role]+'</h3><p>'+label[role+'Description']+'</p><a class="role-link" aria-label="'+escape(label.browse+' — '+label[role])+'" href="'+roleUrl(role)+'">'+label.browse+' '+icon('arrow')+'</a></section>').join('');
    return '<main id="main"><section class="hero"><div class="hero-art" aria-hidden="true"></div><div class="wrap hero-inner"><h1>'+label.help+'</h1><p>'+label.intro+'</p>'+searchForm()+
      '<div class="suggestions">'+['get-started','join','reset'].map(id=>'<a href="'+topicUrl(id)+'">'+escape(articles[id].title)+'</a>').join('')+'</div></div></section>'+
      '<div class="wrap home"><section><h2>'+label.roles+'</h2><div class="role-grid">'+cards+'</div></section><section class="block"><h2>'+label.popular+'</h2><div class="topic-grid">'+featured.map(id=>resource(articles[id])).join('')+'</div></section>'+supportBand()+'</div></main>';
  }

  function crumbs(role, article) {
    return '<nav class="crumbs" aria-label="'+label.where+'"><a href="'+locationFor()+'">'+label.home+'</a><span aria-hidden="true">›</span>'+
      (article ? '<a href="'+roleUrl(role)+'">'+label[role]+'</a><span aria-hidden="true">›</span><span aria-current="page">'+escape(article.title)+'</span>' : '<span aria-current="page">'+label[role]+'</span>')+'</nav>';
  }

  function directory(role, articles) {
    return '<main id="main" class="wrap directory">'+crumbs(role)+'<h1 class="page-title">'+label[role]+'</h1>'+
      '<p class="lead">'+label[role+'Description']+'</p>'+searchForm()+
      '<section class="block"><h2>'+label.articles+'</h2><div class="topic-grid">'+roleTopics[role].map(id=>resource(articles[id])).join('')+'</div></section>'+supportBand()+'</main>';
  }

  function sidebar(articles, article) {
    const groups = Object.entries(roleTopics).map(([role,ids])=>'<details'+(role===article.role?' open':'')+'><summary>'+label[role]+'</summary><ul>'+
      ids.map(id=>'<li><a href="'+topicUrl(id)+'"'+(id===article.id?' aria-current="page"':'')+'>'+escape(articles[id].title)+'</a></li>').join('')+'</ul></details>').join('');
    return '<aside class="side"><strong class="side-title">'+label.contents+'</strong><nav aria-label="'+label.contents+'">'+groups+'</nav>'+
      '<details class="mobile-nav"><summary>'+label.topicNav+'</summary>'+groups+'</details></aside>';
  }

  function screenshot(article, index) {
    const image = guideImages[article.id]?.[index];
    if (!image) return '';
    const translations = imageCaptions[lang];
    const description = image.caption ? translations[image.caption] : article.title;
    const caption = image.caption ? description+' '+translations.archived : image.localized ? label.screen : label.screenPt;
    const src = '/ajuda-assets/' + (image.localized ? image.localized + lang + '.jpg' : image.file);
    return '<figure class="figure"><button type="button" data-image="'+src+'" data-description="'+escape(description)+'" aria-label="'+escape(label.zoom+' — '+description)+'">'+
      '<img src="'+src+'" alt="'+escape(description)+'" loading="lazy"></button><figcaption>'+escape(caption)+'</figcaption></figure>';
  }

  function articlePage(article, articles) {
    const {id, role, title, intro, path, steps, note} = article;
    const ids = roleTopics[role];
    const index = ids.indexOf(id);
    const adjacent = [ids[index-1], ids[index+1]];
    const links = adjacent.map((other,i)=> other ? '<a href="'+topicUrl(other)+'"><span>'+label[i?'next':'previous']+'</span>'+escape(articles[other].title)+'</a>' : '<div></div>').join('');
    const linkedTopics = {
      'get-started':['admin-login','teacher-login','student-login','reset'],
      join:['get-started','courses','classes','enrollment']
    };
    const related = linkedTopics[id] ?? ids.filter(other=>other!==id && !adjacent.includes(other)).slice(0,2);
    const sections = [['instructions',label.steps],['tip',label.tip]];
    if (related.length) sections.push(['related',label.related]);
    return '<main id="main" class="wrap doc-layout">'+sidebar(articles,article)+'<article class="article">'+crumbs(role,article)+
      '<h1 class="page-title">'+escape(title)+'</h1><p class="lead">'+escape(intro)+'</p><div class="path">'+icon('path')+'<span>'+escape(path)+'</span></div>'+
      '<section class="doc-section" id="instructions"><h2>'+label.steps+'</h2><ol class="steps">'+steps.map((step,i)=>'<li><div><p>'+rich(step)+'</p>'+screenshot(article,i)+'</div></li>').join('')+'</ol></section>'+
      '<aside class="note" id="tip"><strong>'+label.tip+'</strong><p>'+rich(note)+'</p></aside>'+
      '<div class="article-actions">'+(paths[id]?'<a class="primary" href="'+escape(nativeUrl(id))+'">'+label[id === 'join' ? 'plans' : id === 'get-started' ? 'open' : 'portal']+' '+icon('arrow')+'</a>':'')+
      '<a class="video-link" href="'+youtubeUrl+'">'+label.youtube+'</a></div>'+
      (related.length?'<section class="doc-section" id="related"><h2>'+label.related+'</h2><ul>'+related.map(other=>'<li><a href="'+topicUrl(other)+'">'+escape(articles[other].title)+'</a></li>').join('')+'</ul></section>':'')+
      '<nav class="pager" aria-label="'+label.topicNav+'">'+links+'</nav></article><aside class="toc"><strong>'+label.inThisArticle+'</strong>'+
        sections.map(([anchor,text])=>'<a href="#'+anchor+'">'+text+'</a>').join('')+'</aside></main>';
  }

  const normalize = value => value.toLocaleLowerCase(lang).normalize('NFD').replace(/\p{Diacritic}/gu,'');
  function results() {
    const ignored = new Set(['phanyx','fanics','fanix','como','how','to','what','is','the','a','o','no','na','de','do','da','em','ao','para','e','del','el','la','en','le','les','dans','du']);
    const terms = normalize(query).match(/[a-z0-9]+/g) ?? [];
    const words = [...new Set(terms.filter(word=>!ignored.has(word)))];
    const aliases = lang.startsWith('pt') ? {
      'get-started':'acesso acessar usar uso tutorial login começar phanyx',
      join:'aderir adesão assinar contratar planos comprar phanyx',
      'teacher-login':'acessar área professor docente acesso login',
      'student-login':'acessar área aluno estudante acesso login',
      attendance:'fazer chamada presenças frequência professor turma',
      assignments:'fazer enviar anexar entrega trabalho aluno estudante',
      enrollment:'fazer matricular estudante inscrição admin',
      courses:'fazer criar cadastro curso incluir'
    } : {};
    const score = article => {
      if (!words.length) return terms.length && article.id === 'get-started' ? 1 : 0;
      const title = normalize(article.title);
      const keywords = normalize(aliases[article.id] ?? '');
      const details = normalize([article.intro,article.path,...article.steps,article.note].join(' '));
      if (!words.every(word=>title.includes(word)||keywords.includes(word)||details.includes(word))) return 0;
      return words.reduce((total,word)=>total+1+(title.includes(word)?5:0)+(keywords.includes(word)?3:0),0);
    };
    const found = Object.values(articles).map(article=>({article,score:score(article)})).filter(item=>item.score).sort((a,b)=>b.score-a.score);
    const directoryLinks = Object.keys(roleTopics).map(role=>'<li><a href="'+roleUrl(role)+'">'+label[role]+'</a></li>').join('');
    return '<main id="main" class="wrap results"><h1 class="page-title">'+label.results+'</h1>'+searchForm(query)+
      (query?'<p role="status">'+(found.length ? label.count.replace('{n}',found.length) : label.noResults)+'</p>':'')+
      (found.length?'<div class="results-list">'+found.map(item=>resource(item.article)).join('')+'</div>':'<ul>'+directoryLinks+'</ul>')+
      supportBand()+'</main>';
  }

  const article = articles[articleId];
  const role = article?.role ?? (Object.hasOwn(roleTopics,page) ? page : '');
  const content = article ? articlePage(article,articles)
    : role ? directory(role,articles)
    : page === 'search' ? results()
    : page === 'not-found' ? '<main id="main" class="wrap directory"><h1 class="page-title">'+label.notFound+'</h1><a href="'+locationFor()+'">'+label.retry+'</a></main>'
    : home(articles);
  return header(role)+content+footer()+
    '<dialog class="dialog" aria-label="'+label.screen+'"><form method="dialog"><button autofocus>'+label.close+'</button></form><img alt=""></dialog>';
}
