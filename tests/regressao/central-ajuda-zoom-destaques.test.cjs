const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function viewer(){
 const events=new Map();
 const element=name=>({name,style:{},children:[],attrs:{},disabled:false,
  addEventListener(type,fn){events.set(name+':'+type,fn);},
  setAttribute(key,value){this.attrs[key]=value;},
  removeAttribute(key){if(key==='style')this.style={};},
  replaceChildren(){this.children=[];},append(child){this.children.push(child);},
  focus(){this.focused=true;}
 });
 const root=element('root'),dialog=element('dialog'),image=element('image'),canvas=element('canvas'),layer=element('layer'),viewport=element('viewport'),output=element('output'),locale=element('locale'),minus=element('minus'),plus=element('plus');
 Object.assign(image,{naturalWidth:225,naturalHeight:558,complete:true});
 Object.assign(viewport,{clientWidth:700,clientHeight:500,scrollLeft:0,scrollTop:0,scrollTo(x,y){this.scrollLeft=x;this.scrollTop=y;},getBoundingClientRect(){return{left:0,top:0};},classList:{add(){},remove(){}}});
 dialog.querySelector=selector=>({'img':image,'.image-canvas':canvas,'.image-viewport':viewport,'output':output,'[data-zoom="out"]':minus,'[data-zoom="in"]':plus})[selector];
 canvas.querySelector=()=>layer;
 root.querySelector=selector=>selector==='#locale'?locale:dialog;
 dialog.showModal=()=>{dialog.open=true;};
 const document={querySelector:()=>root,createElementNS:(_ns,name)=>element(name)};
 const rootPath=process.env.PHANYX_HELP_TEST_ROOT||path.resolve(__dirname,'../..');
 vm.runInNewContext(fs.readFileSync(path.join(rootPath,'public/ajuda-assets/browser.js'),'utf8'),{document,ResizeObserver:class{observe(){}},location:{assign(){}}});
 const open=dataset=>{const button={dataset,focus(){this.focused=true;}};events.get('root:click')({target:{closest:()=>button}});return button;};
 return{events,image,canvas,layer,viewport,output,open};
}

test('o destaque permanece no mesmo local da imagem após ampliar e usar a roda do mouse',()=>{
 const v=viewer();v.open({image:'/ajuda-assets/menu-configuracoes-pt-br.jpg',description:'Instituição',highlights:JSON.stringify([{x:13,y:123,width:209,height:34}]),focus:JSON.stringify({x:0,y:75,width:225,height:130})});
 assert.equal(v.layer.children.length,1);assert.equal(v.layer.children[0].attrs.y,'123');assert.equal(v.layer.attrs.viewBox,'0 0 225 558');
 assert.equal(v.image.style.width,v.canvas.style.width);assert.equal(v.image.style.height,v.canvas.style.height);assert.equal(v.output.value,'200%');
 v.events.get('dialog:click')({target:{closest:()=>({dataset:{zoom:'in'}})}});
 assert.equal(v.output.value,'250%');assert.equal(v.image.style.width,v.canvas.style.width);assert.equal(v.layer.attrs.viewBox,'0 0 225 558');
 let prevented=false;v.events.get('viewport:wheel')({preventDefault(){prevented=true;},deltaY:-100,deltaMode:0,clientX:150,clientY:200});
 assert(prevented);assert.equal(v.image.style.width,v.canvas.style.width);assert.equal(v.layer.children[0].attrs.y,'123');
});
test('abrir uma imagem comum remove os destaques da imagem anterior',()=>{
 const v=viewer();v.open({image:'a.jpg',description:'A',highlights:'[{"x":1,"y":1,"width":20,"height":20}]'});assert.equal(v.layer.children.length,1);
 const button=v.open({image:'b.jpg',description:'B'});assert.equal(v.layer.children.length,0);assert.equal(v.image.alt,'B');
 v.events.get('dialog:close')();assert(button.focused);
});
test('coordenadas inválidas ou fora da imagem não geram marcações',()=>{
 const v=viewer();v.open({image:'a.jpg',description:'A',highlights:'[{"x":-1,"y":1,"width":20,"height":20},{"x":220,"y":1,"width":20,"height":20}]'});assert.equal(v.layer.children.length,0);
 v.open({image:'b.jpg',description:'B',highlights:'<script>'});assert.equal(v.layer.children.length,0);
});
