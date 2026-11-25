const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const s=fs.readFileSync('app/api/admin/documentos/templates/preview-pdf-fiel/route.ts','utf8');
test('HTML does not acquire or release PDF lock',()=>{
assert.match(s,/if \(body\?\.visualizacao !== "navegador"\) \{[\s\S]*?geracaoPdfEmAndamento = true;[\s\S]*?possuiBloqueioPdf = true;/);
assert.match(s,/if \(possuiBloqueioPdf\) geracaoPdfEmAndamento = false;/);
assert.equal((s.match(/geracaoPdfEmAndamento = true;/g)||[]).length,1);
});
