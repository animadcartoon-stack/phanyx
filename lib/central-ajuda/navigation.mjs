import menus from './navigation-menus.json' with {type:'json'};
import actions from './navigation-actions.json' with {type:'json'};
import details from './navigation-details.json' with {type:'json'};
import {navigationCopy} from './navigation-copy.mjs';

export {menus as navigationMenus};
export const navigationActions = actions;
const publicPaths = {'get-started':'/',join:'/planos','admin-login':'/login?portal=admin','teacher-login':'/login?portal=professor','student-login':'/login?portal=aluno',reset:'/login',access:'/login'};
const fill = (text,values) => text.replace(/\{(\w+)\}/g,(_,key)=>values[key]??'');
function chainFor(role,path,seen = new Set(),preferredGroup) {
  if(seen.has(path))return null;
  seen.add(path);
  const entries=(menus[role]??[]).filter(item=>item.href===path);
  const entry=entries.find(item=>item.group===preferredGroup)??entries.find(item=>item.group!=='comercial-phanyx')??entries[0];
  if(entry)return {entry,actions:[]};
  const action=actions[path];
  if(!action)return null;
  const parent=chainFor(role,action.from,seen);
  return parent?{entry:parent.entry,actions:[...parent.actions,{...action,target:path}]}:null;
}

export function navigationFor(article,locale) {
  const copy=navigationCopy[locale];
  const role=['admin','teacher','student'].includes(article.role)?article.role:null;
  const target=article.nativePath??publicPaths[article.id]??(role?{admin:'/admin',teacher:'/professor',student:'/aluno'}[role]:'/');
  const path=target.split('#')[0];
  let chain=role?chainFor(role,path,new Set(),article.id==='guide-permissions'?'configuracoes':undefined):null;
  const special=article.id==='guide-appearance'?'theme':article.id==='guide-interface-language'?'language':article.id==='guide-admin-notificacoes'?'bell':article.id==='guide-admin-biblioteca-contratacao'?'library':null;
  if(special==='library')chain=chainFor('admin','/admin/biblioteca');
  const isPublic=Object.hasOwn(publicPaths,article.id);
  const desktop=[];
  if(role&&!isPublic)desktop.push(fill(copy.login,{role:copy[role]}));
  if(special==='theme'||special==='language')desktop.push(copy[special]);
  else if(special==='bell')desktop.push(fill(copy.bell,{item:menus.controls.bell.options[0][locale]}));
  else if(chain&&!isPublic){
    desktop.push(chain.entry.group==='configuracoes'?copy.settings:copy.sidebar);
    if(chain.entry.group)desktop.push(fill(copy.group,{group:menus.groups[chain.entry.group][locale]}));
    desktop.push(fill(chain.entry.group?copy.item:copy.flat,{item:chain.entry.labels[locale]}));
    let page=chain.entry.labels[locale];
    for(const action of chain.actions){desktop.push(fill(copy.action,{page,action:action.labels[locale]}));page=action.labels[locale];}
    if(special==='library')desktop.push(copy.library);
  } else desktop.push(isPublic?copy.public:copy.noMenu);
  const detail=details[article.id];
  if(detail){
    const item=detail.labels[locale];
    if(detail.type==='record')desktop.push(fill(copy.record,{tab:item,open:detail.open[locale]}));
    else if(detail.type==='tab')desktop.push(fill(copy.tab,{item}));
    else desktop.push(fill(copy[detail.type],{item}));
  }
  const mobile=[];
  if(special==='theme'||special==='language')mobile.push(copy[special]);
  else if(chain&&!isPublic){
    const item=(menus.mobile[role]??[]).find(item=>item.href===chain.entry.href);
    if(item&&Object.values(item.labels).every(Boolean)){
      const groupKey=Object.keys(menus.groups).find(key=>menus.groups[key]['pt-br']===item.group||({'rh':'RH'}[key]===item.group));
      mobile.push(fill(item.group?copy.bottom:copy.bottomFlat,{group:groupKey?menus.groups[groupKey][locale]:item.group,item:item.labels[locale]}));
      let page=item.labels[locale];
      for(const action of chain.actions){mobile.push(fill(copy.action,{page,action:action.labels[locale]}));page=action.labels[locale];}
    }
    mobile.push(copy.mobileDirect);
  }else mobile.push(isPublic?copy.public:copy.mobileDirect);
  if(detail)mobile.push(desktop.at(-1));
  const group=chain?.entry.group;
  const control=menus.controls[special]??null;
  const breadcrumb=control?[copy[role],control.labels[locale]]:chain&&!isPublic?[copy[role],...(group?[menus.groups[group][locale]]:[]),chain.entry.labels[locale],...chain.actions.map(action=>action.labels[locale])]:[article.title];
  const mapItems=control?[]:chain?(menus[role]??[]).filter(item=>item.group===chain.entry.group):[];

  return {kind:isPublic?'public':special??(chain?'menu':'direct'),role,target,desktop,mobile,breadcrumb,entry:chain?.entry??null,actions:chain?.actions??[],mapItems,control,copy};
}
