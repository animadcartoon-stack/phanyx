// Browser-only presentation of existing server-rendered HTML. Never an official PDF.
export function rotulosNavegador(locale: string) {
  const textos: Record<string, [string,string,string]> = {
    'pt-BR': ['Visualizar no navegador','Imprimir / salvar PDF','Prévia para impressão local. Fontes dependem do dispositivo; paginação e timbrado podem variar. Não substitui documento oficial.'],
    'pt-PT': ['Visualizar no navegador','Imprimir / guardar PDF','Pré-visualização local. As fontes dependem do dispositivo; paginação e timbrado podem variar. Não substitui o documento oficial.'],
    'en-US': ['View in browser','Print / save PDF','Local print preview. Fonts depend on the device; pagination and letterhead may vary. Not an official document.'],
    'es-ES': ['Ver en el navegador','Imprimir / guardar PDF','Vista previa local. Las fuentes dependen del dispositivo; la paginación y el membrete pueden variar. No sustituye al documento oficial.'],
    'fr-FR': ['Voir dans le navigateur','Imprimer / enregistrer PDF','Aperçu local. Les polices dépendent de l’appareil ; la pagination et l’en-tête peuvent varier. Ne remplace pas le document officiel.'],
  };
  return textos[locale] || textos['pt-BR'];
}

export function mensagemFontesSubstituidas(locale: string, fontes: string) {
  const textos: Record<string, string> = {
    "pt-BR": "O servidor usou uma fonte substituta para {fontes}. Abra a prévia no navegador para usar as fontes instaladas neste dispositivo.",
    "pt-PT": "O servidor usou um tipo de letra de substituição para {fontes}. Abra a pré-visualização no navegador para usar os tipos de letra instalados neste dispositivo.",
    "en-US": "The server substituted {fontes}. Open the browser preview to use fonts installed on this device.",
    "es-ES": "El servidor sustituyó {fontes}. Abre la vista previa en el navegador para usar las fuentes instaladas en este dispositivo.",
    "fr-FR": "Le serveur a remplacé {fontes}. Ouvrez l’aperçu dans le navigateur pour utiliser les polices installées sur cet appareil.",
  };
  return (textos[locale] || textos["pt-BR"]).replace("{fontes}", () => fontes);
}
const escapar = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
type Render = {html:string;pdfOptions:{displayHeaderFooter:boolean;headerTemplate:string;footerTemplate:string;margin:{top:string;right:string;bottom:string;left:string}}};
export function montarHtmlNavegador(r: Render, locale: string, avisoLogo = false) {
  const [titulo, imprimir, aviso] = rotulosNavegador(locale);
  const m = r.pdfOptions.margin;
  const medida = (v:string) => /^(?:0|[0-9]+(?:\.[0-9]+)?mm)$/.test(v) ? v : '0';
  const css = `<style>
    @page { size: A4; margin: ${medida(m.top)} ${medida(m.right)} ${medida(m.bottom)} ${medida(m.left)}; }
    .phanyx-local-tools { position: relative; z-index: 1000; padding: 12px; background: #eef2ff; color: #111; font: 14px Arial, sans-serif; }
    .phanyx-local-tools button { padding: 8px; cursor: pointer; }
    .phanyx-local-band { position: relative; z-index: 2; }
    @media screen {
      body { max-width: 210mm; margin: 0 auto !important; padding: 12px !important; }
      body:has(> main.phanyx-conteudo) { padding-inline: 0 !important; }
      body:has(> main.phanyx-conteudo) > .phanyx-local-header {
        min-height: ${medida(m.top)};
      }
      body:not(:has(> .phanyx-local-header)) > main.phanyx-conteudo {
        margin-top: ${medida(m.top)};
      }
      body > main.phanyx-conteudo {
        width: auto;
        margin-left: min(${medida(m.left)}, 9%);
        margin-right: min(${medida(m.right)}, 9%);
      }
    }
    @media print {
      .phanyx-local-tools { display: none !important; }
      .phanyx-local-band { break-inside: avoid; }
    }
  </style>`;
  const csp = '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'sha256-7COemBQXj2QaobdeK1nwM/7QsyuuHf/7kO8cjXPwZKE=\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; base-uri \'none\'; form-action \'none\'; connect-src \'none\'">';
  const tools = '<div class="phanyx-local-tools"><button type="button" id="phanyx-local-print">'+escapar(imprimir)+'</button><p>'+escapar(aviso)+'</p>'+(avisoLogo?'<p>LOGO UNAVAILABLE / LOGOTIPO INDISPONÍVEL</p>':'')+'</div>';
  // Puppeteer header/footer templates are separate documents; include them once in this experimental browser view.
  const band = (s: string, cabecalho = false) =>
    '<div class="phanyx-local-band' + (cabecalho ? ' phanyx-local-header' : '') + '">' +
    s.replace(/<span\s+class="(?:pageNumber|totalPages)"\s*><\/span>/g, '<span>–</span>') + '</div>';
  const header = r.pdfOptions.displayHeaderFooter ? band(r.pdfOptions.headerTemplate, true) : '';
  const footer = r.pdfOptions.displayHeaderFooter ? band(r.pdfOptions.footerTemplate) : '';
  const inner = r.html.replace(/<head(?:\s[^>]*)?>/i, tag=>tag+csp+css).replace(/<body(?:\s[^>]*)?>/i,tag=>tag+tools+header).replace(/<\/body>/i,()=>footer+'<script>document.getElementById("phanyx-local-print").addEventListener("click",()=>window.print());</script></body>');
  // Untrusted document markup lives in an opaque-origin sandbox, never in the application origin.
  return '<!doctype html><html><head><meta charset="utf-8"><title>'+escapar(titulo)+'</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;display:block}</style></head><body><iframe title="'+escapar(titulo)+'" sandbox="allow-scripts allow-modals" srcdoc="'+escapar(inner)+'"></iframe></body></html>';
}
