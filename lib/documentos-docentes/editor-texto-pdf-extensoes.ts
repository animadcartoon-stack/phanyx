import { Extension, Node, type Editor } from "@tiptap/core";
import { TableView } from "@tiptap/extension-table";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";
import { TableMap, findTable, selectionCell } from "@tiptap/pm/tables";

export const posicoesImagemPdf = ["inline", "centro", "esquerda", "direita", "atraves-esquerda", "atraves-direita", "frente", "atras"] as const;
export type PosicaoImagemPdf = typeof posicoesImagemPdf[number];
const niveisRecuo = 8;
const espacamentos = ["1", "1.15", "1.5", "2", "2.5", "3"];

function numeroInteiro(valor: unknown, padrao: number, min: number, max: number) {
  if (valor == null || valor === "") return padrao;
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= min && numero <= max ? numero : padrao;
}

function posicaoImagem(valor: unknown): PosicaoImagemPdf {
  return posicoesImagemPdf.includes(valor as PosicaoImagemPdf) ? valor as PosicaoImagemPdf : "inline";
}

function fonteImagem(valor: unknown): valor is string {
  return typeof valor === "string" && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+={0,2}$/i.test(valor);
}

export const ImagemTextoPdf = Node.create({
  name: "imagemTextoPdf",
  group: "inline",
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null, rendered: false },
      alt: { default: "", rendered: false },
      posicao: { default: "inline", rendered: false, parseHTML: el => posicaoImagem(el.getAttribute("data-posicao")) },
      largura: { default: null, rendered: false, parseHTML: el => numeroInteiro(el.getAttribute("data-largura"), 0, 5, 100) || null },
      deslocamentoX: { default: 0, rendered: false, parseHTML: el => numeroInteiro(el.getAttribute("data-x"), 0, -600, 600) },
      deslocamentoY: { default: 0, rendered: false, parseHTML: el => numeroInteiro(el.getAttribute("data-y"), 0, -600, 600) },
      sombra: { default: false, rendered: false, parseHTML: el => el.getAttribute("data-sombra") === "true" },
    };
  },

  parseHTML() {
    return [{
      tag: "img[src]",
      getAttrs: el => fonteImagem(el.getAttribute("src"))
        ? { src: el.getAttribute("src"), alt: el.getAttribute("alt") ?? "" }
        : false,
    }];
  },

  renderHTML({ node }) {
    const { src, alt, sombra } = node.attrs;
    const posicao = posicaoImagem(node.attrs.posicao);
    const largura = numeroInteiro(node.attrs.largura, 0, 5, 100);
    const x = numeroInteiro(node.attrs.deslocamentoX, 0, -600, 600);
    const y = numeroInteiro(node.attrs.deslocamentoY, 0, -600, 600);
    const origem = fonteImagem(src) ? src : "";
    const contorno = posicao.startsWith("atraves-") && origem ? `;shape-outside:url("${origem}")` : "";
    return ["img", {
      class: "phx-texto-pdf-imagem",
      src: origem,
      alt: typeof alt === "string" ? alt : "",
      "data-posicao": posicao,
      "data-largura": largura || null,
      "data-x": x,
      "data-y": y,
      "data-sombra": sombra === true ? "true" : "false",
      style: `width:${largura ? `${largura}%` : "auto"};--phx-imagem-x:${x}px;--phx-imagem-y:${y}px${contorno}`,
    }];
  },
});

const tiposParagrafo = ["paragraph", "heading"];
export const espacamentosTextoPdf = espacamentos;

export function mudarRecuoTextoPdf(editor: Editor, passo: 1 | -1) {
  return editor.commands.command(({ tr }) => {
    const { from, to } = tr.selection;
    let alterado = false;
    tr.doc.nodesBetween(from, to, (node, pos) => {
      if (!tiposParagrafo.includes(node.type.name)) return;
      const anterior = numeroInteiro(node.attrs.recuo, 0, 0, niveisRecuo);
      const recuo = Math.min(niveisRecuo, Math.max(0, anterior + passo));
      if (recuo !== anterior) tr.setNodeMarkup(pos, undefined, { ...node.attrs, recuo });
      alterado = true;
      return false;
    });
    return alterado;
  });
}

export const ParagrafoTextoPdf = Extension.create({
  name: "paragrafoTextoPdf",

  addGlobalAttributes() {
    return [{
      types: tiposParagrafo,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: el => espacamentos.includes(el.style.lineHeight) ? el.style.lineHeight : null,
          renderHTML: a => espacamentos.includes(a.lineHeight) ? { style: `line-height:${a.lineHeight}` } : {},
        },
        recuo: {
          default: 0,
          parseHTML: el => numeroInteiro(el.getAttribute("data-recuo"), 0, 0, niveisRecuo),
          renderHTML: a => {
            const recuo = numeroInteiro(a.recuo, 0, 0, niveisRecuo);
            return recuo ? { "data-recuo": recuo, style: `padding-inline-start:${recuo * 24}px` } : {};
          },
        },
      },
    }];
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => !this.editor.isActive("table") && mudarRecuoTextoPdf(this.editor, 1),
      "Shift-Tab": () => !this.editor.isActive("table") && mudarRecuoTextoPdf(this.editor, -1),
    };
  },
});

function estiloTabela(atributos: Record<string, unknown>) {
  const largura = numeroInteiro(atributos.larguraTabela, 100, 25, 100);
  const borda = numeroInteiro(atributos.bordaTabela, 1, 0, 12);
  return `width:${largura}%;--phx-borda-tabela:${borda}px`;
}

export class VisualTabelaTextoPdf extends TableView {
  constructor(node: ProseMirrorNode, min: number, view: EditorView, atributos?: Record<string, unknown>) {
    super(node, min, view, atributos);
    this.aplicarEstilo(node);
  }

  private aplicarEstilo(node: ProseMirrorNode) {
    const largura = numeroInteiro(node.attrs.larguraTabela, 100, 25, 100);
    const borda = numeroInteiro(node.attrs.bordaTabela, 1, 0, 12);
    this.table.style.width = `${largura}%`;
    this.table.style.setProperty("--phx-borda-tabela", `${borda}px`);
  }

  update(node: ProseMirrorNode) {
    const atualizado = super.update(node);
    if (atualizado) this.aplicarEstilo(node);
    return atualizado;
  }
}

export const FormatoTabelaTextoPdf = Extension.create({
  name: "formatoTabelaTextoPdf",
  addGlobalAttributes() {
    return [{
      types: ["table"],
      attributes: {
        larguraTabela: { default: 100, parseHTML: el => numeroInteiro(el.getAttribute("data-largura-tabela"), 100, 25, 100),
          renderHTML: a => ({ "data-largura-tabela": a.larguraTabela, style: estiloTabela(a) }) },
        bordaTabela: { default: 1, parseHTML: el => numeroInteiro(el.getAttribute("data-borda-tabela"), 1, 0, 12),
          renderHTML: a => ({ "data-borda-tabela": a.bordaTabela }) },
      },
    }, {
      types: ["tableRow"],
      attributes: {
        alturaLinha: { default: 0, parseHTML: el => numeroInteiro(el.getAttribute("data-altura-linha"), 0, 0, 400),
          renderHTML: a => {
            const altura = numeroInteiro(a.alturaLinha, 0, 0, 400);
            return altura ? { "data-altura-linha": altura, style: `height:${altura}px` } : {};
          } },
      },
    }];
  },
});

export function larguraColunaTextoPdf(editor: Editor, largura: number) {
  if (!editor.isActive("table") || !Number.isInteger(largura) || largura < 25 || largura > 700) return false;
  return editor.commands.command(({ state, tr }) => {
    const celula = selectionCell(state);
    const tabela = findTable(celula);
    if (!tabela) return false;
    const mapa = TableMap.get(tabela.node);
    const coluna = mapa.findCell(celula.pos - tabela.start).left;
    const posicoes = new Set(Array.from({ length: mapa.height }, (_, linha) => mapa.map[linha * mapa.width + coluna]));
    for (const pos of posicoes) {
      const no = tabela.node.nodeAt(pos);
      if (!no) continue;
      const larguraCelulas = Array.from({ length: no.attrs.colspan }, (_, i) => no.attrs.colwidth?.[i] ?? 0);
      larguraCelulas[coluna - mapa.findCell(pos).left] = largura;
      tr.setNodeMarkup(tabela.start + pos, undefined, { ...no.attrs, colwidth: larguraCelulas });
    }
    return true;
  });
}

export const estilosTextoPdf = `
.phx-texto-pdf { display: flow-root; isolation: isolate; color: #111827; font: 12pt Arial, sans-serif; line-height: 1.35; overflow-wrap: anywhere; }
.phx-texto-pdf p { min-height: 1.35em; margin: 0; position: relative; }
.phx-texto-pdf h1, .phx-texto-pdf h2, .phx-texto-pdf h3 { position: relative; margin: .5em 0 .25em; font-weight: bold; line-height: 1.25; }
.phx-texto-pdf h1 { font-size: 22pt; }
.phx-texto-pdf h2 { font-size: 17pt; }
.phx-texto-pdf h3 { font-size: 14pt; }
.phx-texto-pdf ul, .phx-texto-pdf ol { padding-inline-start: 1.5em; }
.phx-texto-pdf ul { list-style: disc; }
.phx-texto-pdf ol { list-style: decimal; }
.phx-texto-pdf table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: .7em 0; }
.phx-texto-pdf td, .phx-texto-pdf th { border: var(--phx-borda-tabela, 1px) solid #94a3b8; position: relative; min-width: 36px; padding: 6px; vertical-align: top; }
.phx-texto-pdf th { background: #e2e8f0; font-weight: bold; }
.phx-texto-pdf .tableWrapper { overflow-x:auto; }
.phx-texto-pdf .column-resize-handle { position:absolute; right:-2px; top:0; bottom:0; width:4px; background:#2563eb; pointer-events:none; }
.phx-texto-pdf.resize-cursor { cursor:col-resize; }
.phx-texto-pdf .selectedCell { background: #dbeafe; }
.phx-texto-pdf .phx-texto-pdf-imagem { max-width: 100%; height: auto; vertical-align: middle; break-inside: avoid; }
.phx-texto-pdf img[data-posicao=inline] { display: inline-block; }
.phx-texto-pdf img[data-posicao=centro] { display: block; margin: .5em auto; }
.phx-texto-pdf img[data-posicao=esquerda], .phx-texto-pdf img[data-posicao=atraves-esquerda] { float: left; margin: .25em .7em .4em 0; }
.phx-texto-pdf img[data-posicao=direita], .phx-texto-pdf img[data-posicao=atraves-direita] { float: right; margin: .25em 0 .4em .7em; }
.phx-texto-pdf img[data-posicao^=atraves] { shape-margin: 6px; }
.phx-texto-pdf img[data-posicao=frente], .phx-texto-pdf img[data-posicao=atras] { position: absolute; inset: 0 auto auto 0; transform: translate(var(--phx-imagem-x), var(--phx-imagem-y)); }
.phx-texto-pdf img[data-posicao=frente] { z-index: 1; }
.phx-texto-pdf img[data-posicao=atras] { z-index: -1; }
.phx-texto-pdf img[data-sombra=true] { filter: drop-shadow(4px 4px 5px #11182755); }
.phx-texto-pdf img.ProseMirror-selectednode { outline: 2px solid #2563eb; }
`;
