'use client';
// Keep the original about:blank tab; no blob navigation or font upload.
export async function abrirVisualizacaoNavegador(url: string, init?: RequestInit) {
  const aba = window.open('about:blank', '_blank');
  if (!aba) throw new Error('Popup blocked');
  const doc = aba.document;
  aba.opener = null;
  doc.title = 'PHANYX';
  doc.body.textContent = 'PHANYX…';
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 45000);
  try {
    const res = await fetch(url, {...init, credentials:'include', cache:'no-store', signal:controller.signal});
    if (!res.ok) throw new Error('HTTP '+res.status);
    const dados = await res.json();
    if (typeof dados.html !== 'string') throw new Error('Invalid preview');
    // Parse inert markup and transfer only the isolated document, not arbitrary outer HTML.
    const parsed = new DOMParser().parseFromString(dados.html, 'text/html');
    const source = parsed.querySelector('body > iframe');
    const content = source?.getAttribute('srcdoc');
    if (!content || source?.getAttribute('sandbox') !== 'allow-scripts allow-modals') throw new Error('Invalid preview');
    if (aba.closed) return;
    const frame = doc.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts allow-modals');
    frame.setAttribute('title', source.getAttribute('title') || 'PHANYX');
    frame.style.cssText = 'display:block;width:100%;height:100%;border:0';
    frame.srcdoc = content;
    doc.title = parsed.title || 'PHANYX';
    doc.documentElement.style.height = '100%';
    doc.body.style.cssText = 'margin:0;height:100%;overflow:hidden';
    doc.body.replaceChildren(frame);
  } catch (e) {
    if (!aba.closed) doc.body.textContent = 'PHANYX — '+(e instanceof Error ? e.message : 'Preview error');
    throw e;
  } finally {
    window.clearTimeout(timer);
  }
}
