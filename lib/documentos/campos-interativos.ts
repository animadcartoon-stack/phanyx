export const ATRIBUTO_CAMPO_ESCOLHA = "data-phanyx-choice";
export const ATRIBUTO_ASSINATURAS_CONTRATO = "data-phanyx-contract-signatures";
export const ATRIBUTO_INICIO_ANEXO = "data-phanyx-start-annex";

export type CampoEscolha = {
  id: string;
  pergunta: string;
  opcoes: string[];
  obrigatoria: boolean;
  estilo: "parenteses" | "colchetes";
};
export type RespostasCampos = Record<string, number>;
export type BlocoAssinaturasContrato = { largura: number; testemunhas: boolean };

export const CONFIG_ASSINATURAS_PADRAO: BlocoAssinaturasContrato = {
  largura: 100,
  testemunhas: true,
};

export function codificarConfiguracaoDocumento(configuracao: unknown) {
  return encodeURIComponent(JSON.stringify(configuracao));
}

export function decodificarConfiguracaoDocumento(valor: string | null): unknown {
  try {
    return valor ? JSON.parse(decodeURIComponent(valor)) : null;
  } catch {
    return null;
  }
}

export function normalizarCampoEscolha(valor: unknown): CampoEscolha | null {
  if (!valor || typeof valor !== "object") return null;
  const { id, pergunta, opcoes, obrigatoria, estilo } = valor as Partial<CampoEscolha>;
  if (
    typeof id !== "string" || !/^[a-z0-9-]{1,64}$/.test(id) ||
    typeof pergunta !== "string" || !pergunta.trim() || pergunta.trim().length > 300 ||
    !Array.isArray(opcoes) || opcoes.length < 2 || opcoes.length > 8 ||
    opcoes.some(opcao => typeof opcao !== "string" || !opcao.trim() || opcao.trim().length > 120) ||
    typeof obrigatoria !== "boolean" ||
    (estilo !== "parenteses" && estilo !== "colchetes")
  ) return null;
  const opcoesLimpas = opcoes.map(opcao => opcao.trim());
  if (new Set(opcoesLimpas.map(opcao => opcao.toLowerCase())).size !== opcoesLimpas.length) return null;
  return { id, pergunta: pergunta.trim(), opcoes: opcoesLimpas, obrigatoria, estilo };
}

export function normalizarBlocoAssinaturas(valor: unknown): BlocoAssinaturasContrato | null {
  if (!valor || typeof valor !== "object") return null;
  const { largura, testemunhas } = valor as Partial<BlocoAssinaturasContrato>;
  if (
    typeof largura !== "number" || !Number.isInteger(largura) || largura < 75 || largura > 100 ||
    typeof testemunhas !== "boolean"
  ) return null;
  return { largura, testemunhas };
}

function elementosDocumento(atributo: string) {
  return new RegExp(`<div\\b[^>]*?\\s${atributo}=(?:"([^"]*)"|'([^']*)')[^>]*>\\s*</div>`, "gi");
}

export function lerCamposEscolha(html: string): CampoEscolha[] {
  return Array.from(html.matchAll(elementosDocumento(ATRIBUTO_CAMPO_ESCOLHA)), elemento =>
    normalizarCampoEscolha(decodificarConfiguracaoDocumento(elemento[1] ?? elemento[2])),
  ).filter((campo): campo is CampoEscolha => campo !== null);
}

export function lerBlocoAssinaturas(atributos: string): BlocoAssinaturasContrato | null {
  const valor = new RegExp(`\\s${ATRIBUTO_ASSINATURAS_CONTRATO}=(?:"([^"]*)"|'([^']*)')`, "i")
    .exec(` ${atributos}`);
  return normalizarBlocoAssinaturas(decodificarConfiguracaoDocumento(valor?.[1] ?? valor?.[2] ?? null));
}

export function validarCamposModelo(html: string) {
  const campos = lerCamposEscolha(html);
  if (campos.length !== Array.from(html.matchAll(elementosDocumento(ATRIBUTO_CAMPO_ESCOLHA))).length) {
    return "campoInvalido";
  }
  if (new Set(campos.map(campo => campo.id)).size !== campos.length) return "campoDuplicado";
  const blocos = Array.from(html.matchAll(elementosDocumento(ATRIBUTO_ASSINATURAS_CONTRATO)));
  if (blocos.length > 1) return "blocoDuplicado";
  if (blocos.some(bloco => !lerBlocoAssinaturas(bloco[0]))) return "blocoInvalido";
  return null;
}

export function validarRespostasCampos(campos: CampoEscolha[], valor: unknown):
  { respostas: RespostasCampos; erro?: never } | { respostas?: never; erro: "respostaObrigatoria" | "respostaInvalida" } {
  const respostas = valor === undefined ? {} : valor;
  if (!respostas || typeof respostas !== "object" || Array.isArray(respostas)) {
    return { erro: "respostaInvalida" };
  }

  const porId = new Map(campos.map(campo => [campo.id, campo]));
  const entradas = Object.entries(respostas);
  for (const [id, indice] of entradas) {
    const campo = porId.get(id);
    if (!campo || typeof indice !== "number" || !Number.isInteger(indice) || indice < 0 || indice >= campo.opcoes.length) {
      return { erro: "respostaInvalida" };
    }
  }
  if (campos.some(campo => campo.obrigatoria && !Object.hasOwn(respostas, campo.id))) {
    return { erro: "respostaObrigatoria" };
  }
  return { respostas: Object.fromEntries(entradas) };
}

function escaparHtml(texto: string) {
  return texto.replace(/[&<>"']/g, caractere => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere]!
  ));
}

export function marcaCampoEscolha(estilo: CampoEscolha["estilo"], marcada = false) {
  const marca = marcada ? "X" : " ";
  return estilo === "colchetes" ? `[${marca}]` : `(${marca})`;
}

export function renderizarCamposEscolha(html: string, respostas: RespostasCampos = {}) {
  return html.replace(elementosDocumento(ATRIBUTO_CAMPO_ESCOLHA), (_elemento, aspas, apostrofos) => {
    const campo = normalizarCampoEscolha(decodificarConfiguracaoDocumento(aspas ?? apostrofos));
    if (!campo) return "";
    const opcoes = campo.opcoes.map((opcao, indice) =>
      `${marcaCampoEscolha(campo.estilo, respostas[campo.id] === indice)} ${escaparHtml(opcao)}`,
    );
    return `<p style="break-inside:avoid;white-space:pre-wrap"><strong>${escaparHtml(campo.pergunta)}</strong><br>${opcoes.join("<br>")}</p>`;
  });
}

export function inserirAntesDoAnexo(html: string, trecho: string) {
  const anexo = elementosDocumento(ATRIBUTO_INICIO_ANEXO).exec(html);
  if (anexo) return html.slice(0, anexo.index) + trecho + html.slice(anexo.index);
  return /<\/body>/i.test(html) ? html.replace(/<\/body>/i, fechamento => trecho + fechamento) : html + trecho;
}

export function posicionarAssinaturasAntesDoAnexo(html: string) {
  const temAnexo = elementosDocumento(ATRIBUTO_INICIO_ANEXO).test(html);
  const temBloco = elementosDocumento(ATRIBUTO_ASSINATURAS_CONTRATO).test(html);
  if (!temAnexo || temBloco) return html;
  const config = codificarConfiguracaoDocumento(CONFIG_ASSINATURAS_PADRAO);
  return inserirAntesDoAnexo(html, `<div ${ATRIBUTO_ASSINATURAS_CONTRATO}="${config}"></div>`);
}

export function selecionarConteudoContrato(emitido: string, atualizado: string) {
  const usaCampos = [ATRIBUTO_CAMPO_ESCOLHA, ATRIBUTO_ASSINATURAS_CONTRATO, ATRIBUTO_INICIO_ANEXO]
    .some(atributo => emitido.includes(atributo) || atualizado.includes(atributo));
  return usaCampos ? emitido : atualizado;
}

export function renderizarPreviaCamposDocumento(
  html: string,
  rotulos: { assinaturas: string; titular: string; diretor: string; secretaria: string; testemunhas: string },
) {
  return renderizarCamposEscolha(html).replace(
    elementosDocumento(ATRIBUTO_ASSINATURAS_CONTRATO),
    elemento => {
      const bloco = lerBlocoAssinaturas(elemento);
      if (!bloco) return "";
      const linhas = [rotulos.titular, rotulos.diretor, rotulos.secretaria]
        .map(rotulo => `<span style="padding-top:4px;border-top:1px solid;text-align:center">${escaparHtml(rotulo)}</span>`)
        .join("");
      const testemunhas = bloco.testemunhas
        ? `<p style="margin-top:16px">${escaparHtml(rotulos.testemunhas)}</p><p>______________________ &nbsp;&nbsp;&nbsp; ______________________</p>`
        : "";
      return `<div style="width:${bloco.largura}%;break-inside:avoid;margin:16px 0"><p><strong>${escaparHtml(rotulos.assinaturas)}</strong></p><p style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;padding-top:22px">${linhas}</p>${testemunhas}</div>`;
    },
  ).replace(elementosDocumento(ATRIBUTO_INICIO_ANEXO), '<div class="phanyx-inicio-anexo"></div>');
}
