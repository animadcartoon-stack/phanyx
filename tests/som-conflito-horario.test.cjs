const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),ts=require('typescript'),vm=require('vm');
const codigo=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/interface/som-conflito-horario.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
function som(window){const exports={};vm.runInNewContext(codigo,{exports,window});return exports;}
test('som indisponível ou bloqueado nunca impede abrir o aviso visual',()=>{
 for(const win of [undefined,{}, {AudioContext:class{constructor(){throw Error('indisponível');}}}]){const api=som(win);assert.doesNotThrow(()=>{api.prepararSomConflito();api.tocarSomConflito();});}
});
test('preparação não toca, reutiliza contexto e conflito toca um sinal curto',()=>{
 let criados=0,resumes=0,inicios=[],fins=[],freq=[],desconexoes=0,contexto;
 class Audio{constructor(){criados++;this.state='suspended';this.currentTime=3;this.destination={};contexto=this;}resume(){resumes++;this.state='running';return Promise.resolve();}createGain(){return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){desconexoes++;}};}createOscillator(){this.oscilador={frequency:{setValueAtTime:(v)=>freq.push(v)},connect(){},start:t=>inicios.push(t),stop:t=>fins.push(t),disconnect(){desconexoes++;}};return this.oscilador;}}
 const api=som({AudioContext:Audio});api.tocarSomConflito();assert.equal(criados,0);api.prepararSomConflito();api.prepararSomConflito();assert.equal(criados,1);assert.equal(resumes,1);assert.equal(inicios.length,0);
 api.tocarSomConflito();assert.deepEqual(inicios,[3]);assert.ok(fins[0]-inicios[0]<0.4);assert.deepEqual(freq,[660,520]);contexto.oscilador.onended();assert.equal(desconexoes,2);
 contexto.state='suspended';api.tocarSomConflito();assert.equal(inicios.length,1);
});
