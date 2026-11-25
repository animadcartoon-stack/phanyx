'use client';
// Open synchronously from the user gesture; never upload local font files.
export async function abrirVisualizacaoNavegador(url:string, init?:RequestInit) {
  const aba = window.open('about:blank','_blank');
  if (!aba) throw new Error('Popup blocked');
  aba.opener = null;
  aba.document.title = 'PHANYX';
  aba.document.body.textContent = 'PHANYX…';
  try {
    const res = await fetch(url,{...init,credentials:'include',cache:'no-store'});
    if (!res.ok) throw new Error('HTTP '+res.status);
    const dados = await res.json();
    if (typeof dados.html !== 'string' || !dados.html.includes('sandbox="allow-scripts allow-modals"')) throw new Error('Invalid preview');
    const objeto = URL.createObjectURL(new Blob([dados.html],{type:'text/html;charset=utf-8'}));
    aba.location.replace(objeto);
    window.setTimeout(()=>URL.revokeObjectURL(objeto),120000);
  } catch(e) {aba.close();throw e;}
}
