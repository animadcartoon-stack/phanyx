export type TextoCertificado = {
  id?: number | string;
  tipo?: string;
  texto?: string | null;
  textoHtml?: string | null;
  textoModo?: string | null;
  arcoAngulo?: number | null;
  arcoRaio?: number | null;
  arcoInvertido?: boolean | null;
  largura?: number | null;
  altura?: number | null;
  tamanho?: number | null;
  fonte?: string | null;
  cor?: string | null;
  negrito?: boolean | null;
  italico?: boolean | null;
  sublinhado?: boolean | null;
  alinhamento?: string | null;
  letterSpacing?: number | null;
  wordSpacing?: number | null;
  lineHeight?: number | null;
  dadosJson?: Record<string, any> | null;
};

const numero = (valor: unknown, padrao: number) => Number.isFinite(Number(valor)) && valor !== null && valor !== undefined ? Number(valor) : padrao;
export function modoTextoCertificado(campo: TextoCertificado) {
  return campo.textoModo ?? campo.dadosJson?.textoModo ?? "NORMAL";
}

export function medidasArcoTexto(campo: TextoCertificado) {
  const html = campo.tipo === "TEXTO_LIVRE" ? campo.textoHtml ?? campo.dadosJson?.textoHtml : null;
  const tamanhos = html ? trechosTextoCertificado(html).map(trecho => {
    const valor = trecho.estilo.fontSize?.match(/^(\d+(?:\.\d+)?)(px|pt)?$/);
    return valor ? Number(valor[1]) * (valor[2] === "pt" ? 4 / 3 : 1) : 0;
  }) : [];
  const tamanho = Math.max(6, numero(campo.tamanho, 18), ...tamanhos);
  const largura = Math.max(20, numero(campo.largura, 320));
  const angulo = Math.max(5, Math.min(180, numero(campo.arcoAngulo ?? campo.dadosJson?.arcoAngulo, 120)));
  const metade = angulo * Math.PI / 360;
  const raio = Math.max(1, numero(campo.arcoRaio ?? campo.dadosJson?.arcoRaio, (Math.max(10, largura - tamanho * .8)) / (2 * Math.sin(metade))));
  const sagita = raio * (1 - Math.cos(metade));
  const alturaMinima = Math.ceil(sagita + tamanho * 1.5);
  const altura = Math.max(alturaMinima, numero(campo.altura, alturaMinima));
  const invertido = Boolean(campo.arcoInvertido ?? campo.dadosJson?.arcoInvertido);
  const base = invertido ? altura - tamanho * .35 - sagita : tamanho * 1.1 + sagita;
  const esquerda = largura / 2 - raio * Math.sin(metade);
  const direita = largura / 2 + raio * Math.sin(metade);
  const d = `M ${esquerda} ${base} A ${raio} ${raio} 0 0 ${invertido ? 0 : 1} ${direita} ${base}`;
  return { largura, altura, alturaMinima, tamanho, angulo, raio, d };
}

function decodificar(texto: string) {
  const entidades: Record<string, string> = {"AElig":"Æ","Aacute":"Á","Acirc":"Â","Agrave":"À","Aring":"Å","Atilde":"Ã","Auml":"Ä","Ccedil":"Ç","ETH":"Ð","Eacute":"É","Ecirc":"Ê","Egrave":"È","Euml":"Ë","Iacute":"Í","Icirc":"Î","Igrave":"Ì","Iuml":"Ï","Ntilde":"Ñ","OElig":"Œ","Oacute":"Ó","Ocirc":"Ô","Ograve":"Ò","Oslash":"Ø","Otilde":"Õ","Ouml":"Ö","Scaron":"Š","THORN":"Þ","Uacute":"Ú","Ucirc":"Û","Ugrave":"Ù","Uuml":"Ü","Yacute":"Ý","Yuml":"Ÿ","aacute":"á","acirc":"â","acute":"´","aelig":"æ","agrave":"à","amp":"&","aring":"å","atilde":"ã","auml":"ä","brvbar":"¦","ccedil":"ç","cedil":"¸","cent":"¢","copy":"©","curren":"¤","deg":"°","divide":"÷","eacute":"é","ecirc":"ê","egrave":"è","eth":"ð","euml":"ë","frac12":"½","frac14":"¼","frac34":"¾","gt":">","iacute":"í","icirc":"î","iexcl":"¡","igrave":"ì","iquest":"¿","iuml":"ï","laquo":"«","lt":"<","macr":"¯","micro":"µ","middot":"·","nbsp":" ","not":"¬","ntilde":"ñ","oacute":"ó","ocirc":"ô","oelig":"œ","ograve":"ò","ordf":"ª","ordm":"º","oslash":"ø","otilde":"õ","ouml":"ö","para":"¶","plusmn":"±","pound":"£","quot":"\"","raquo":"»","reg":"®","scaron":"š","sect":"§","shy":"­","sup1":"¹","sup2":"²","sup3":"³","szlig":"ß","thorn":"þ","times":"×","uacute":"ú","ucirc":"û","ugrave":"ù","uml":"¨","uuml":"ü","yacute":"ý","yen":"¥","yuml":"ÿ","apos":"'"};
  return texto.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z0-9]+);/gi, (original, chave: string) => {
    if (chave[0] !== "#") return entidades[chave] ?? entidades[chave.toLowerCase()] ?? original;
    const valor = chave[1].toLowerCase() === "x" ? parseInt(chave.slice(2), 16) : parseInt(chave.slice(1), 10);
    return valor > 0 && valor <= 0x10ffff ? String.fromCodePoint(valor) : original;
  });
}

export type TrechoTexto = { texto: string; estilo: Record<string, string> };
// O mesmo parser no servidor e no navegador; apenas texto e estilos tipograficos.
export function trechosTextoCertificado(html: string): TrechoTexto[] {
  const fonte = html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "");
  const pilha: { tag: string; estilo: Record<string, string> }[] = [{ tag: "", estilo: {} }];
  const resultado: TrechoTexto[] = [];
  const permitidos: Record<string, string> = { "font-family": "fontFamily", "font-size": "fontSize", "font-weight": "fontWeight", "font-style": "fontStyle", "text-decoration": "textDecoration", "letter-spacing": "letterSpacing", color: "fill" };
  for (const token of fonte.match(/<[^>]*>|[^<]+/g) ?? []) {
    if (!token.startsWith("<")) { resultado.push({ texto: decodificar(token), estilo: { ...pilha[pilha.length - 1].estilo } }); continue; }
    const tag = token.match(/^<\/?\s*([\w-]+)/)?.[1]?.toLowerCase();
    if (!tag) continue;
    if (/^<\//.test(token)) {
      const indice = pilha.map(p => p.tag).lastIndexOf(tag); if (indice > 0) pilha.splice(indice);
      if (["div", "p", "li"].includes(tag) && resultado.length && !resultado[resultado.length - 1].texto.endsWith("\n")) resultado.push({ texto: "\n", estilo: {} });
      continue;
    }
    if (tag === "br") { resultado.push({ texto: "\n", estilo: { ...pilha[pilha.length - 1].estilo } }); continue; }
    if (["div", "p", "li"].includes(tag) && resultado.length && !resultado[resultado.length - 1].texto.endsWith("\n")) resultado.push({ texto: "\n", estilo: {} });
    const estilo = { ...pilha[pilha.length - 1].estilo };
    if (tag === "b" || tag === "strong") estilo.fontWeight = "bold";
    if (tag === "i" || tag === "em") estilo.fontStyle = "italic";
    if (tag === "u") estilo.textDecoration = "underline";
    const css = token.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
    for (const declaracao of decodificar(css?.[1] ?? css?.[2] ?? "").split(";")) {
      const separador = declaracao.indexOf(":");
      const nome = permitidos[declaracao.slice(0, separador).trim().toLowerCase()];
      const valor = decodificar(declaracao.slice(separador + 1).replace(/\s*!important\s*$/i, "").trim());
      if (nome && valor && !/url\s*\(|expression\s*\(/i.test(valor)) estilo[nome] = valor;
    }
    if (!/\/>$/.test(token) && !["img", "hr", "input", "meta", "link"].includes(tag)) pilha.push({ tag, estilo });
  }
  return resultado;
}
