"use client";

import { useEffect, useState, useRef } from "react";
import { Extension } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { useTranslations } from "next-intl";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const FONTES_WINDOWS = [
  "Arial","Arial Black","Bahnschrift","Calibri","Cambria","Candara",
  "Comic Sans MS","Consolas","Constantia","Corbel","Courier New",
  "Franklin Gothic Medium","Gabriola","Georgia","Impact","Lucida Console",
  "Lucida Sans Unicode","Microsoft Sans Serif","Palatino Linotype",
  "Segoe Print","Segoe Script","Segoe UI","Tahoma","Times New Roman",
  "Trebuchet MS","Verdana",
];

const TAMANHOS_FONTE = [
  "8","9","10","11","12","14","16","18","20","22","24","28","32","36","48","72",
];

const ESPACAMENTOS_LINHA = [
  { label: "1.0", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
  { label: "3.0", value: "3" },
];

const BackgroundColorPHANYX = Extension.create({
  name: "backgroundColorPHANYX",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],

        attributes: {
          backgroundColor: {
            default: null,

            parseHTML: (element) =>
              element.style.backgroundColor ||
              null,

            renderHTML: (attributes) => {
              if (!attributes.backgroundColor) {
                return {};
              }

              return {
                style:
                  `background-color: ${attributes.backgroundColor}`,
              };
            },
          },
        },
      },
    ];
  },
});


const atributosCelulaTabelaPHANYX = {
  backgroundColor: {
    default: "#ffffff",
    parseHTML: (element: HTMLElement) =>
      element.style.backgroundColor || "#ffffff",
    renderHTML: (attributes: Record<string, any>) => ({
      style: `background-color: ${attributes.backgroundColor || "#ffffff"}`,
    }),
  },

  borderColor: {
    default: "#94a3b8",
    parseHTML: (element: HTMLElement) =>
      element.style.borderColor || "#94a3b8",
    renderHTML: (attributes: Record<string, any>) => ({
      style: `border-color: ${attributes.borderColor || "#94a3b8"}`,
    }),
  },

  borderWidth: {
    default: "1px",
    parseHTML: (element: HTMLElement) =>
      element.style.borderWidth || "1px",
    renderHTML: (attributes: Record<string, any>) => ({
      style: `border-width: ${attributes.borderWidth || "1px"}`,
    }),
  },

  borderStyle: {
    default: "solid",
    parseHTML: (element: HTMLElement) =>
      element.style.borderStyle || "solid",
    renderHTML: (attributes: Record<string, any>) => ({
      style: `border-style: ${attributes.borderStyle || "solid"}`,
    }),
  },

  verticalAlign: {
    default: "top",
    parseHTML: (element: HTMLElement) =>
      element.style.verticalAlign || "top",
    renderHTML: (attributes: Record<string, any>) => ({
      style: `vertical-align: ${attributes.verticalAlign || "top"}`,
    }),
  },

  cellHeight: {
    default: null,
    parseHTML: (element: HTMLElement) =>
      element.style.height || null,
    renderHTML: (attributes: Record<string, any>) =>
      attributes.cellHeight
        ? { style: `height: ${attributes.cellHeight}` }
        : {},
  },
};

const TablePHANYX = Table.configure({
  resizable: true,
  handleWidth: 6,
  cellMinWidth: 50,
  lastColumnResizable: true,
  HTMLAttributes: {
    class: "phanyx-doc-table",
    style:
      "border-collapse: collapse; table-layout: fixed; width: 100%; margin: 8px 0;",
  },
});


const TableRowPHANYX = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      rowHeight: {
        default: null,

        parseHTML: (
          element: HTMLElement
        ) =>
          element.style.height ||
          null,

        renderHTML: (
          attributes: Record<
            string,
            any
          >
        ) =>
          attributes.rowHeight
            ? {
                style:
                  `height: ${attributes.rowHeight}`,
              }
            : {},
      },
    };
  },
}).configure({
  HTMLAttributes: {
    class:
      "phanyx-doc-table-row",
  },
});

function obterPosicaoLinhaAtualPHANYX(
  state: any
) {
  const { $from } =
    state.selection;

  for (
    let depth = $from.depth;
    depth > 0;
    depth -= 1
  ) {
    if (
      $from.node(depth)?.type
        ?.name === "tableRow"
    ) {
      return $from.before(
        depth
      );
    }
  }

  return null;
}


function obterPosicaoTabelaAtualPHANYX(
  state: any
) {
  const { $from } =
    state.selection;

  for (
    let depth = $from.depth;
    depth > 0;
    depth -= 1
  ) {
    if (
      $from.node(depth)?.type
        ?.name === "table"
    ) {
      return $from.before(
        depth
      );
    }
  }

  return null;
}

function obterPosicoesLinhasTabelaPorPosicaoPHANYX(
  state: any,
  tablePos: number | null,
  excetoCabecalho = false
) {
  if (
    tablePos === null
  ) {
    return [];
  }

  const tabela =
    state.doc.nodeAt(
      tablePos
    );

  if (
    !tabela ||
    tabela.type?.name !==
      "table"
  ) {
    return [];
  }

  const posicoes:
    number[] = [];

  tabela.forEach(
    (
      linha: any,
      offset: number
    ) => {
      const primeiraCelula =
        linha.firstChild;

      const ehCabecalho =
        primeiraCelula?.type
          ?.name ===
        "tableHeader";

      if (
        excetoCabecalho &&
        ehCabecalho
      ) {
        return;
      }

      posicoes.push(
        tablePos +
          1 +
          offset
      );
    }
  );

  return posicoes;
}

function obterPosicoesLinhasSelecionadasPHANYX(
  state: any
) {
  const posicoes =
    new Set<number>();

  const adicionarAncestral = (
    $pos: any
  ) => {
    for (
      let depth = $pos.depth;
      depth > 0;
      depth -= 1
    ) {
      if (
        $pos.node(depth)?.type
          ?.name === "tableRow"
      ) {
        posicoes.add(
          $pos.before(depth)
        );
        return;
      }
    }
  };

  adicionarAncestral(
    state.selection.$from
  );

  adicionarAncestral(
    state.selection.$to
  );

  state.doc.nodesBetween(
    state.selection.from,
    state.selection.to,
    (
      node: any,
      pos: number
    ) => {
      if (
        node.type?.name ===
        "tableRow"
      ) {
        posicoes.add(pos);
      }
    }
  );

  return Array.from(
    posicoes
  ).sort(
    (a, b) => a - b
  );
}

function obterPosicoesLinhasTabelaAtualPHANYX(
  state: any,
  excetoCabecalho = false
) {
  const { $from } =
    state.selection;

  for (
    let depth = $from.depth;
    depth > 0;
    depth -= 1
  ) {
    const node =
      $from.node(depth);

    if (
      node?.type?.name !==
      "table"
    ) {
      continue;
    }

    const posicaoTabela =
      $from.before(depth);

    const posicoes:
      number[] = [];

    node.forEach(
      (
        linha: any,
        offset: number
      ) => {
        const primeiraCelula =
          linha.firstChild;

        const ehCabecalho =
          primeiraCelula?.type
            ?.name ===
          "tableHeader";

        if (
          excetoCabecalho &&
          ehCabecalho
        ) {
          return;
        }

        posicoes.push(
          posicaoTabela +
            1 +
            offset
        );
      }
    );

    return posicoes;
  }

  return [];
}

function aplicarAlturaLinhasPHANYX(
  editor: any,
  posicoes: number[],
  altura: string | null
) {
  if (
    posicoes.length === 0
  ) {
    return false;
  }

  const {
    state,
    view,
  } = editor;

  let transaction =
    state.tr;

  let alterou = false;

  for (
    const posicao of
    Array.from(
      new Set(posicoes)
    )
  ) {
    const linha =
      state.doc.nodeAt(
        posicao
      );

    if (
      !linha ||
      linha.type?.name !==
        "tableRow"
    ) {
      continue;
    }

    transaction =
      transaction.setNodeMarkup(
        posicao,
        undefined,
        {
          ...linha.attrs,
          rowHeight:
            altura,
        }
      );

    /*
     * A altura também é persistida em cada
     * célula da linha. Alguns navegadores
     * respeitam a altura do <td>/<th> com
     * mais consistência do que a do <tr>.
     */
    linha.forEach(
      (
        celula: any,
        offset: number
      ) => {
        if (
          celula.type?.name !==
            "tableCell" &&
          celula.type?.name !==
            "tableHeader"
        ) {
          return;
        }

        const posicaoCelula =
          posicao +
          1 +
          offset;

        transaction =
          transaction.setNodeMarkup(
            posicaoCelula,
            undefined,
            {
              ...celula.attrs,
              cellHeight:
                altura,
            }
          );
      }
    );

    alterou = true;
  }

  if (alterou) {
    view.dispatch(
      transaction
    );
  }

  return alterou;
}

function obterPosicaoDocumentoDaTabelaPHANYX(
  view: any,
  tabela: HTMLTableElement
) {
  const posicaoDentro =
    view.posAtDOM(
      tabela,
      0
    );

  const posicaoSegura =
    Math.max(
      0,
      Math.min(
        posicaoDentro,
        view.state.doc
          .content.size
      )
    );

  const $pos =
    view.state.doc.resolve(
      posicaoSegura
    );

  for (
    let depth = $pos.depth;
    depth > 0;
    depth -= 1
  ) {
    if (
      $pos.node(depth)?.type
        ?.name === "table"
    ) {
      return $pos.before(
        depth
      );
    }
  }

  return null;
}

function aplicarDestaqueLinhasPersistentesPHANYX(
  view: any,
  posicoes: number[]
) {
  view.dom
    .querySelectorAll(
      ".phanyx-row-selected"
    )
    .forEach(
      (elemento: Element) =>
        elemento.classList.remove(
          "phanyx-row-selected"
        )
    );

  for (
    const posicao of posicoes
  ) {
    const elemento =
      view.nodeDOM(
        posicao
      );

    if (
      elemento instanceof
      HTMLElement
    ) {
      elemento.classList.add(
        "phanyx-row-selected"
      );
    }
  }
}

function obterLinhaNaBordaHorizontalPHANYX(
  view: any,
  event: MouseEvent
) {
  const target =
    event.target;

  if (
    !(target instanceof HTMLElement)
  ) {
    return null;
  }

  if (
    target.closest(
      ".column-resize-handle"
    )
  ) {
    return null;
  }

  const celula =
    target.closest(
      "td, th"
    ) as HTMLTableCellElement | null;

  if (
    !celula ||
    !view.dom.contains(
      celula
    )
  ) {
    return null;
  }

  const rect =
    celula.getBoundingClientRect();

  const pertoDaBordaInferior =
    Math.abs(
      event.clientY -
        rect.bottom
    ) <= 6;

  const pertoDaBordaDireita =
    Math.abs(
      event.clientX -
        rect.right
    ) <= 9;

  if (
    !pertoDaBordaInferior ||
    pertoDaBordaDireita
  ) {
    return null;
  }

  return celula.closest(
    "tr"
  ) as HTMLTableRowElement | null;
}

function obterPosicaoDocumentoDaLinhaPHANYX(
  view: any,
  linha: HTMLTableRowElement
) {
  const posicaoDentro =
    view.posAtDOM(
      linha,
      0
    );

  const posicaoSegura =
    Math.max(
      0,
      Math.min(
        posicaoDentro,
        view.state.doc
          .content.size
      )
    );

  const $pos =
    view.state.doc.resolve(
      posicaoSegura
    );

  for (
    let depth = $pos.depth;
    depth > 0;
    depth -= 1
  ) {
    if (
      $pos.node(depth)?.type
        ?.name === "tableRow"
    ) {
      return $pos.before(
        depth
      );
    }
  }

  return null;
}

function limparDestaqueRedimensionamentoLinhaPHANYX(
  view: any
) {
  view.dom
    .querySelectorAll(
      ".phanyx-row-resize-hover"
    )
    .forEach(
      (elemento: Element) =>
        elemento.classList.remove(
          "phanyx-row-resize-hover"
        )
    );

  view.dom.classList.remove(
    "phanyx-row-resize-cursor"
  );
}

const RowResizePHANYX =
  Extension.create({
    name: "rowResizePHANYX",

    addProseMirrorPlugins() {
      let arrastando = false;

      return [
        new Plugin({
          key:
            new PluginKey(
              "rowResizePHANYX"
            ),

          props: {
            handleDOMEvents: {
              mousemove: (
                view,
                rawEvent
              ) => {
                if (
                  arrastando
                ) {
                  return false;
                }

                const event =
                  rawEvent as MouseEvent;

                limparDestaqueRedimensionamentoLinhaPHANYX(
                  view
                );

                const linha =
                  obterLinhaNaBordaHorizontalPHANYX(
                    view,
                    event
                  );

                if (!linha) {
                  return false;
                }

                linha.classList.add(
                  "phanyx-row-resize-hover"
                );

                view.dom.classList.add(
                  "phanyx-row-resize-cursor"
                );

                return false;
              },

              mouseleave: (
                view
              ) => {
                if (
                  !arrastando
                ) {
                  limparDestaqueRedimensionamentoLinhaPHANYX(
                    view
                  );
                }

                return false;
              },

              mousedown: (
                view,
                rawEvent
              ) => {
                const event =
                  rawEvent as MouseEvent;

                const linha =
                  obterLinhaNaBordaHorizontalPHANYX(
                    view,
                    event
                  );

                if (!linha) {
                  return false;
                }

                const posicaoLinha =
                  obterPosicaoDocumentoDaLinhaPHANYX(
                    view,
                    linha
                  );

                if (
                  posicaoLinha ===
                  null
                ) {
                  return false;
                }

                event.preventDefault();

                arrastando =
                  true;

                const inicioY =
                  event.clientY;

                const alturaInicial =
                  linha
                    .getBoundingClientRect()
                    .height;

                let alturaAtual =
                  Math.round(
                    alturaInicial
                  );

                linha.classList.add(
                  "phanyx-row-resize-hover"
                );

                view.dom.classList.add(
                  "phanyx-row-resize-cursor"
                );

                const mover = (
                  moveEvent:
                    MouseEvent
                ) => {
                  const delta =
                    moveEvent.clientY -
                    inicioY;

                  alturaAtual =
                    Math.max(
                      20,
                      Math.min(
                        500,
                        Math.round(
                          alturaInicial +
                            delta
                        )
                      )
                    );

                  linha.style.height =
                    `${alturaAtual}px`;
                };

                const finalizar =
                  () => {
                    window.removeEventListener(
                      "mousemove",
                      mover
                    );

                    window.removeEventListener(
                      "mouseup",
                      finalizar
                    );

                    arrastando =
                      false;

                    aplicarAlturaLinhasPHANYX(
                      {
                        state:
                          view.state,
                        view,
                      },
                      [posicaoLinha],
                      `${alturaAtual}px`
                    );

                    limparDestaqueRedimensionamentoLinhaPHANYX(
                      view
                    );

                    view.focus();
                  };

                window.addEventListener(
                  "mousemove",
                  mover
                );

                window.addEventListener(
                  "mouseup",
                  finalizar
                );

                return true;
              },
            },
          },
        }),
      ];
    },
  });

const TableCellPHANYX = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...atributosCelulaTabelaPHANYX,
    };
  },
}).configure({
  HTMLAttributes: {
    class: "phanyx-doc-table-cell",
    style: "padding: 6px; min-width: 50px;",
  },
});

const TableHeaderPHANYX = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      ...atributosCelulaTabelaPHANYX,

      backgroundColor: {
        ...atributosCelulaTabelaPHANYX.backgroundColor,
        default: "#e2e8f0",
      },
    };
  },
}).configure({
  HTMLAttributes: {
    class: "phanyx-doc-table-header",
    style:
      "padding: 6px; min-width: 50px; font-weight: 700;",
  },
});

function selecaoEstaDentroDeTabela(state: any) {
  const { $from } = state.selection;

  for (
    let depth = $from.depth;
    depth > 0;
    depth -= 1
  ) {
    const nome =
      $from.node(depth)?.type?.name;

    if (
      nome === "tableCell" ||
      nome === "tableHeader"
    ) {
      return true;
    }
  }

  return false;
}

const FontSize = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) =>
            attributes.fontSize ? { style: `font-size: ${attributes.fontSize}` } : {},
        },
      },
    }];
  },
});

const LineHeight = Extension.create({
  name: "lineHeight",
  addGlobalAttributes() {
    return [{
      types: ["paragraph", "heading"],
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (element) => element.style.lineHeight || null,
          renderHTML: (attributes) =>
            attributes.lineHeight ? { style: `line-height: ${attributes.lineHeight}` } : {},
        },
      },
    }];
  },
});

type Props = {
  value: string;
  onChange: (html: string) => void;
  minHeightPx?: number;
};

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function conteudoParaHtmlSeguro(valor: string) {
  const texto = String(valor || "");

  if (/<[a-z][\s\S]*>/i.test(texto)) {
    return texto;
  }

  const normalizado = texto.replace(/\r\n/g, "\n");

  if (!normalizado.trim()) {
    return "<p></p>";
  }

  return normalizado
    .split(/\n{2,}/)
    .map((bloco) =>
      `<p>${bloco.split("\n").map((linha) => escaparHtml(linha)).join("<br />")}</p>`
    )
    .join("");
}

export default function EditorSecaoHistoricoPHANYX({
  value,
  onChange,
  minHeightPx = 110,
}: Props) {
  const t = useTranslations("AdminDocumentsTemplatesHistoryEditor");
  const [fonteAtual, setFonteAtual] = useState("");
  const [tamanhoAtual, setTamanhoAtual] = useState("");
  const [mostrarPainelTabela, setMostrarPainelTabela] = useState(false);
  const [linhasNovaTabela, setLinhasNovaTabela] = useState(3);
  const [colunasNovaTabela, setColunasNovaTabela] = useState(3);
  const [novaTabelaComCabecalho, setNovaTabelaComCabecalho] = useState(true);
  const [alturaCelulaTabela, setAlturaCelulaTabela] = useState(32);

  const ultimaPosicaoLinhaTabelaRef =
    useRef<number | null>(
      null
    );

  const ultimaPosicaoTabelaRef =
    useRef<number | null>(
      null
    );

  const ultimasPosicoesLinhasSelecionadasRef =
    useRef<number[]>([]);

  const [
    linhaTabelaSelecionada,
    setLinhaTabelaSelecionada,
  ] = useState<{
    indice: number;
    total: number;
    quantidade: number;
  } | null>(null);

  const [formatacaoAtiva, setFormatacaoAtiva] = useState({
    negrito: false,
    italico: false,
    sublinhado: false,
    esquerda: true,
    centro: false,
    direita: false,
    justificar: false,
    titulo: false,
    subtitulo: false,
    lista: false,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Color,
      BackgroundColorPHANYX,
      TablePHANYX,
      TableRowPHANYX,
      RowResizePHANYX,
      TableHeaderPHANYX,
      TableCellPHANYX,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: conteudoParaHtmlSeguro(value),
    parseOptions: { preserveWhitespace: "full" },
    editorProps: {
      attributes: {
        class:
          "min-h-[96px] px-3 py-3 text-sm leading-relaxed text-slate-950 outline-none dark:text-slate-100",
      },
      handleKeyDown(view, event) {
        if (event.key === "Tab") {
          if (
            selecaoEstaDentroDeTabela(
              view.state
            )
          ) {
            return false;
          }

          event.preventDefault();
          view.dispatch(
            view.state.tr.insertText(
              "    "
            )
          );
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const proximo = conteudoParaHtmlSeguro(value);
    const atual = editor.getHTML();
    if (atual === proximo) return;

    editor.commands.setContent(proximo, {
      emitUpdate: false,
      preserveWhitespace: "full",
    } as any);
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;

    function limparFonte(valor: unknown) {
      return String(valor || "")
        .replaceAll('"', "")
        .replaceAll("'", "")
        .split(",")[0]
        .trim();
    }

    function limparTamanho(valor: unknown) {
      const texto = String(valor || "").trim();
      if (!texto) return "";
      if (texto.includes("px")) {
        const numero = Number(texto.replace("px", ""));
        return Number.isFinite(numero)
          ? String(Math.round(numero * 0.75))
          : "";
      }
      return texto.replace("pt", "").trim();
    }

    function atualizarSelecao() {
      const attrs = editor.getAttributes("textStyle");
      const selection = window.getSelection();
      const node = selection?.anchorNode;
      const elemento =
        node?.nodeType === Node.TEXT_NODE
          ? node.parentElement
          : (node as HTMLElement | null);

      const computed = elemento ? window.getComputedStyle(elemento) : null;

      setFonteAtual(
        limparFonte(attrs.fontFamily) ||
        limparFonte(computed?.fontFamily) ||
        ""
      );

      setTamanhoAtual(
        limparTamanho(attrs.fontSize) ||
        limparTamanho(computed?.fontSize) ||
        ""
      );

      const alinhamentoAtivo = (valor: string) =>
        editor.isActive("paragraph", { textAlign: valor }) ||
        editor.isActive("heading", { textAlign: valor });

      const centro = alinhamentoAtivo("center");
      const direita = alinhamentoAtivo("right");
      const justificar = alinhamentoAtivo("justify");
      const esquerda =
        alinhamentoAtivo("left") || (!centro && !direita && !justificar);

      setFormatacaoAtiva({
        negrito: editor.isActive("bold"),
        italico: editor.isActive("italic"),
        sublinhado: editor.isActive("underline"),
        esquerda,
        centro,
        direita,
        justificar,
        titulo: editor.isActive("heading", { level: 1 }),
        subtitulo: editor.isActive("heading", { level: 2 }),
        lista: editor.isActive("bulletList"),
      });
    }

    editor.on("selectionUpdate", atualizarSelecao);
    editor.on("transaction", atualizarSelecao);
    atualizarSelecao();

    return () => {
      editor.off("selectionUpdate", atualizarSelecao);
      editor.off("transaction", atualizarSelecao);
    };
  }, [editor]);


  useEffect(() => {
    if (!editor) {
      return;
    }

    const reaplicarDestaque =
      () => {
        const posicoes =
          ultimasPosicoesLinhasSelecionadasRef.current;

        if (
          posicoes.length ===
          0
        ) {
          return;
        }

        window.requestAnimationFrame(
          () =>
            aplicarDestaqueLinhasPersistentesPHANYX(
              editor.view,
              posicoes
            )
        );
      };

    editor.on(
      "transaction",
      reaplicarDestaque
    );

    return () => {
      editor.off(
        "transaction",
        reaplicarDestaque
      );
    };
  }, [editor]);

  if (!editor) return null;

  function classeBotao(ativo: boolean) {
    return [
      "rounded-lg border px-2.5 py-2 text-xs font-semibold transition",
      ativo
        ? "border-blue-500 bg-blue-600 text-white"
        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800",
    ].join(" ");
  }

  function sincronizar() {
    onChange(editor.getHTML());
  }


  function selecionarLinhaTabelaPersistente(
    event: any
  ) {
    const target =
      event.target;

    if (
      !(target instanceof HTMLElement)
    ) {
      return;
    }

    const celula =
      target.closest(
        "td, th"
      ) as HTMLTableCellElement | null;

    if (
      !celula ||
      !editor.view.dom.contains(
        celula
      )
    ) {
      return;
    }

    const tabela =
      celula.closest(
        "table"
      ) as HTMLTableElement | null;

    if (!tabela) {
      return;
    }

    const shiftPressionado =
      Boolean(
        event.shiftKey
      );

    /*
     * O clique normal do TipTap precisa terminar primeiro.
     * Só depois lemos editor.state.selection, que então
     * já aponta para a célula realmente clicada.
     */
    window.requestAnimationFrame(
      () => {
        const posicaoLinha =
          obterPosicaoLinhaAtualPHANYX(
            editor.state
          );

        const posicaoTabela =
          obterPosicaoTabelaAtualPHANYX(
            editor.state
          );

        if (
          posicaoLinha === null ||
          posicaoTabela === null
        ) {
          return;
        }

        const posicoesDaTabela =
          obterPosicoesLinhasTabelaPorPosicaoPHANYX(
            editor.state,
            posicaoTabela,
            false
          );

        const indiceLinha =
          posicoesDaTabela.indexOf(
            posicaoLinha
          );

        if (
          indiceLinha < 0
        ) {
          return;
        }

        const mesmaTabela =
          ultimaPosicaoTabelaRef.current ===
          posicaoTabela;

        const anteriores =
          mesmaTabela
            ? ultimasPosicoesLinhasSelecionadasRef.current
            : [];

        let selecionadas =
          [posicaoLinha];

        if (
          shiftPressionado &&
          mesmaTabela
        ) {
          selecionadas =
            Array.from(
              new Set([
                ...anteriores,
                posicaoLinha,
              ])
            );
        }

        ultimaPosicaoLinhaTabelaRef.current =
          posicaoLinha;

        ultimaPosicaoTabelaRef.current =
          posicaoTabela;

        ultimasPosicoesLinhasSelecionadasRef.current =
          selecionadas;

        /*
         * Remove qualquer marca anterior e aplica a nova
         * seleção visual somente nas linhas desta tabela.
         */
        editor.view.dom
          .querySelectorAll(
            ".phanyx-row-selected"
          )
          .forEach(
            (
              elemento: Element
            ) => {
              elemento.classList.remove(
                "phanyx-row-selected"
              );
            }
          );

        const linhasDom =
          Array.from(
            tabela.rows
          );

        for (
          const posicaoSelecionada
          of selecionadas
        ) {
          const indice =
            posicoesDaTabela.indexOf(
              posicaoSelecionada
            );

          if (
            indice >= 0 &&
            linhasDom[indice]
          ) {
            linhasDom[
              indice
            ].classList.add(
              "phanyx-row-selected"
            );
          }
        }

        setLinhaTabelaSelecionada({
          indice:
            indiceLinha + 1,

          total:
            posicoesDaTabela.length,

          quantidade:
            selecionadas.length,
        });
      }
    );
  }

  function memorizarContextoTabela() {
    const posicaoLinha =
      obterPosicaoLinhaAtualPHANYX(
        editor.state
      );

    const posicaoTabela =
      obterPosicaoTabelaAtualPHANYX(
        editor.state
      );

    if (
      posicaoLinha !== null
    ) {
      ultimaPosicaoLinhaTabelaRef.current =
        posicaoLinha;
    }

    if (
      posicaoTabela !== null
    ) {
      ultimaPosicaoTabelaRef.current =
        posicaoTabela;
    }

    const selecionadas =
      obterPosicoesLinhasSelecionadasPHANYX(
        editor.state
      );

    if (
      selecionadas.length >
      0
    ) {
      ultimasPosicoesLinhasSelecionadasRef.current =
        selecionadas;
    }
  }

  function inserirNovaTabela() {
    const rows = Math.min(
      30,
      Math.max(
        1,
        Number(linhasNovaTabela) || 1
      )
    );

    const cols = Math.min(
      12,
      Math.max(
        1,
        Number(colunasNovaTabela) || 1
      )
    );

    editor
      .chain()
      .focus()
      .insertTable({
        rows,
        cols,
        withHeaderRow:
          novaTabelaComCabecalho,
      })
      .run();

    sincronizar();
  }

  function executarComandoTabela(
    executar: () => boolean
  ) {
    executar();
    sincronizar();
  }

  function aplicarAtributoCelulaTabela(
    atributo: string,
    valor: string | null
  ) {
    editor
      .chain()
      .focus()
      .setCellAttribute(
        atributo,
        valor
      )
      .run();

    sincronizar();
  }



  function alterarAlturaLinhasTabela(
    modo:
      | "atual"
      | "selecionadas"
      | "todas"
      | "semCabecalho",
    automatico = false
  ) {
    const posicaoLinhaAtual =
      obterPosicaoLinhaAtualPHANYX(
        editor.state
      );

    const posicaoTabelaAtual =
      obterPosicaoTabelaAtualPHANYX(
        editor.state
      );

    let posicoes:
      number[] = [];

    if (
      modo === "atual"
    ) {
      const posicao =
        ultimaPosicaoLinhaTabelaRef.current ??
        posicaoLinhaAtual;

      posicoes =
        posicao === null
          ? []
          : [posicao];
    }
    else if (
      modo ===
      "selecionadas"
    ) {
      const persistentes =
        ultimasPosicoesLinhasSelecionadasRef.current;

      const selecionadasAtuais =
        obterPosicoesLinhasSelecionadasPHANYX(
          editor.state
        );

      posicoes =
        persistentes.length >
        1
          ? persistentes
          : selecionadasAtuais.length >
            0
            ? selecionadasAtuais
            : persistentes;
    }
    else {
      const posicaoTabela =
        ultimaPosicaoTabelaRef.current ??
        posicaoTabelaAtual;

      posicoes =
        obterPosicoesLinhasTabelaPorPosicaoPHANYX(
          editor.state,
          posicaoTabela,
          modo ===
            "semCabecalho"
        );
    }

    const alturaNumero =
      Math.max(
        20,
        Math.min(
          500,
          Number(
            alturaCelulaTabela
          ) || 32
        )
      );

    const valor =
      automatico
        ? null
        : String(
            alturaNumero
          ) + "px";

    const alterou =
      aplicarAlturaLinhasPHANYX(
        editor,
        posicoes,
        valor
      );

    if (alterou) {
      sincronizar();
    }

    window.requestAnimationFrame(
      () =>
        aplicarDestaqueLinhasPersistentesPHANYX(
          editor.view,
          ultimasPosicoesLinhasSelecionadasRef.current
        )
    );
  }


  return (
    <div className="phanyx-history-section-editor mt-3 overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
      <div className="border-b border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">
          {t("toolbar.title")}
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={fonteAtual}
            onChange={(event) => {
              const fonte = event.target.value;
              if (!fonte) return;
              editor.chain().focus().setFontFamily(fonte).run();
              setFonteAtual(fonte);
              sincronizar();
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">{t("toolbar.font")}</option>
            {FONTES_WINDOWS.map((fonte) => (
              <option key={fonte} value={fonte}>{fonte}</option>
            ))}
          </select>

          <select
            value={tamanhoAtual}
            onChange={(event) => {
              const tamanho = event.target.value;
              if (!tamanho) return;
              editor.chain().focus().setMark("textStyle", {
                fontSize: `${tamanho}pt`,
              }).run();
              setTamanhoAtual(tamanho);
              sincronizar();
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">{t("toolbar.fontSize")}</option>
            {TAMANHOS_FONTE.map((tamanho) => (
              <option key={tamanho} value={tamanho}>{tamanho} pt</option>
            ))}
          </select>

          <select
            defaultValue=""
            onChange={(event) => {
              const altura = event.target.value;
              if (!altura) return;
              editor.chain().focus()
                .updateAttributes("paragraph", { lineHeight: altura })
                .updateAttributes("heading", { lineHeight: altura })
                .run();
              sincronizar();
            }}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">{t("toolbar.lineSpacing")}</option>
            {ESPACAMENTOS_LINHA.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>

          <button type="button" onClick={() => { editor.chain().focus().toggleBold().run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.negrito)}>
            B {t("toolbar.bold")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().toggleItalic().run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.italico)}>
            I {t("toolbar.italic")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().toggleUnderline().run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.sublinhado)}>
            U {t("toolbar.underline")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().setTextAlign("left").run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.esquerda)}>
            ← {t("toolbar.left")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().setTextAlign("center").run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.centro)}>
            ↔ {t("toolbar.center")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().setTextAlign("right").run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.direita)}>
            → {t("toolbar.right")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().setTextAlign("justify").run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.justificar)}>
            ☰ {t("toolbar.justify")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.titulo)}>
            {t("toolbar.heading")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.subtitulo)}>
            {t("toolbar.subheading")}
          </button>

          <button type="button" onClick={() => { editor.chain().focus().toggleBulletList().run(); sincronizar(); }} className={classeBotao(formatacaoAtiva.lista)}>
            • {t("toolbar.list")}
          </button>

          <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            {t("toolbar.textColor")}
            <input
              type="color"
              onChange={(event) => {
                editor.chain().focus().setColor(event.target.value).run();
                sincronizar();
              }}
              className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
              title={t("toolbar.textColor")}
            />
          </label>

          <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            <span className="!text-slate-900 !opacity-100 dark:!text-white">
              {t("toolbar.highlight")}
            </span>

            <input
              type="color"
              defaultValue="#fff59d"
              onChange={(event) => {
                editor
                  .chain()
                  .focus()
                  .setMark("textStyle", {
                    backgroundColor:
                      event.target.value,
                  })
                  .run();

                sincronizar();
              }}
              className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
              title={t(
                "toolbar.highlight"
              )}
            />

            <button
              type="button"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .setMark("textStyle", {
                    backgroundColor:
                      null,
                  })
                  .run();

                sincronizar();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-300 bg-white text-xs font-black text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              title={t(
                "toolbar.clearHighlight"
              )}
              aria-label={t(
                "toolbar.clearHighlight"
              )}
            >
              ×
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setMostrarPainelTabela(
                (atual) => !atual
              )
            }
            className={classeBotao(
              editor.isActive("table")
            )}
            aria-expanded={
              mostrarPainelTabela
            }
          >
            ▦ {t("toolbar.table.button")}
          </button>

          {mostrarPainelTabela ? (
            <div className="phanyx-table-tools-panel w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              {!editor.isActive("table") ? (
                <div className="space-y-3">
                  <div className="text-xs font-black">
                    {t(
                      "toolbar.table.insertTitle"
                    )}
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.rows"
                        )}
                      </span>

                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={
                          linhasNovaTabela
                        }
                        onChange={(event) =>
                          setLinhasNovaTabela(
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </label>

                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.columns"
                        )}
                      </span>

                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={
                          colunasNovaTabela
                        }
                        onChange={(event) =>
                          setColunasNovaTabela(
                            Number(
                              event.target.value
                            )
                          )
                        }
                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </label>

                    <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-2.5 py-2 text-[11px] font-semibold dark:border-slate-700">
                      <input
                        type="checkbox"
                        checked={
                          novaTabelaComCabecalho
                        }
                        onChange={(event) =>
                          setNovaTabelaComCabecalho(
                            event.target.checked
                          )
                        }
                      />

                      {t(
                        "toolbar.table.headerRow"
                      )}
                    </label>

                    <button
                      type="button"
                      onClick={inserirNovaTabela}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-blue-700"
                    >
                      {t(
                        "toolbar.table.insert"
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black">
                        {t(
                          "toolbar.table.editTitle"
                        )}
                      </div>

                      <div className="mt-1 text-[10px] text-slate-600 dark:text-slate-300">
                        {t(
                          "toolbar.table.resizeHelp"
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        executarComandoTabela(
                          () =>
                            editor.commands
                              .deleteTable()
                        )
                      }
                      className="rounded-lg border border-red-300 bg-red-50 px-2.5 py-2 text-[11px] font-bold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                    >
                      {t(
                        "toolbar.table.deleteTable"
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {[
                      [
                        "addColumnBefore",
                        "toolbar.table.addColumnBefore",
                      ],
                      [
                        "addColumnAfter",
                        "toolbar.table.addColumnAfter",
                      ],
                      [
                        "deleteColumn",
                        "toolbar.table.deleteColumn",
                      ],
                      [
                        "addRowBefore",
                        "toolbar.table.addRowBefore",
                      ],
                      [
                        "addRowAfter",
                        "toolbar.table.addRowAfter",
                      ],
                      [
                        "deleteRow",
                        "toolbar.table.deleteRow",
                      ],
                    ].map(
                      ([comando, chave]) => (
                        <button
                          key={comando}
                          type="button"
                          onClick={() =>
                            executarComandoTabela(
                              () =>
                                (
                                  editor
                                    .commands as any
                                )[
                                  comando
                                ]()
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(chave)}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        executarComandoTabela(
                          () =>
                            editor.commands
                              .mergeCells()
                        )
                      }
                      disabled={
                        !editor.can()
                          .mergeCells()
                      }
                      className={[
                        classeBotao(false),
                        !editor.can()
                          .mergeCells()
                          ? "cursor-not-allowed opacity-50"
                          : "",
                      ].join(" ")}
                    >
                      {t(
                        "toolbar.table.mergeCells"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        executarComandoTabela(
                          () =>
                            editor.commands
                              .splitCell()
                        )
                      }
                      disabled={
                        !editor.can()
                          .splitCell()
                      }
                      className={[
                        classeBotao(false),
                        !editor.can()
                          .splitCell()
                          ? "cursor-not-allowed opacity-50"
                          : "",
                      ].join(" ")}
                    >
                      {t(
                        "toolbar.table.splitCell"
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        executarComandoTabela(
                          () =>
                            editor.commands
                              .toggleHeaderRow()
                        )
                      }
                      className={classeBotao(false)}
                    >
                      {t(
                        "toolbar.table.toggleHeaderRow"
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 border-t border-slate-200 pt-3 sm:grid-cols-2 dark:border-slate-800">
                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.cellBackground"
                        )}
                      </span>

                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          defaultValue="#ffffff"
                          onChange={(event) =>
                            aplicarAtributoCelulaTabela(
                              "backgroundColor",
                              event.target.value
                            )
                          }
                          className="h-8 w-11 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-700"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            aplicarAtributoCelulaTabela(
                              "backgroundColor",
                              "#ffffff"
                            )
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-[10px] font-bold dark:border-slate-700"
                        >
                          {t(
                            "toolbar.table.clearBackground"
                          )}
                        </button>
                      </div>
                    </label>

                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.borderStyle"
                        )}
                      </span>

                      <select
                        defaultValue="solid"
                        onChange={(event) =>
                          aplicarAtributoCelulaTabela(
                            "borderStyle",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="solid">
                          {t(
                            "toolbar.table.borderSolid"
                          )}
                        </option>
                        <option value="dashed">
                          {t(
                            "toolbar.table.borderDashed"
                          )}
                        </option>
                        <option value="dotted">
                          {t(
                            "toolbar.table.borderDotted"
                          )}
                        </option>
                        <option value="double">
                          {t(
                            "toolbar.table.borderDouble"
                          )}
                        </option>
                        <option value="none">
                          {t(
                            "toolbar.table.borderNone"
                          )}
                        </option>
                      </select>
                    </label>

                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.borderWidth"
                        )}
                      </span>

                      <select
                        defaultValue="1px"
                        onChange={(event) =>
                          aplicarAtributoCelulaTabela(
                            "borderWidth",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="0px">0</option>
                        <option value="1px">1 px</option>
                        <option value="2px">2 px</option>
                        <option value="3px">3 px</option>
                        <option value="4px">4 px</option>
                      </select>
                    </label>

                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.borderColor"
                        )}
                      </span>

                      <input
                        type="color"
                        defaultValue="#94a3b8"
                        onChange={(event) =>
                          aplicarAtributoCelulaTabela(
                            "borderColor",
                            event.target.value
                          )
                        }
                        className="h-8 w-11 cursor-pointer rounded border border-slate-300 bg-white dark:border-slate-700"
                      />
                    </label>

                    <label className="text-[11px] font-semibold">
                      <span className="mb-1 block">
                        {t(
                          "toolbar.table.verticalAlign"
                        )}
                      </span>

                      <select
                        defaultValue="top"
                        onChange={(event) =>
                          aplicarAtributoCelulaTabela(
                            "verticalAlign",
                            event.target.value
                          )
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="top">
                          {t(
                            "toolbar.table.alignTop"
                          )}
                        </option>
                        <option value="middle">
                          {t(
                            "toolbar.table.alignMiddle"
                          )}
                        </option>
                        <option value="bottom">
                          {t(
                            "toolbar.table.alignBottom"
                          )}
                        </option>
                      </select>
                    </label>

                    <div className="rounded-xl border border-slate-200 p-3 sm:col-span-2 dark:border-slate-800">
                      <div className="mb-2">
                        {linhaTabelaSelecionada ? (
                          <div className="inline-flex rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-[10px] font-black text-blue-800 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                            {linhaTabelaSelecionada.quantidade > 1
                              ? t(
                                  "toolbar.table.selectedRows",
                                  {
                                    count:
                                      linhaTabelaSelecionada.quantidade,
                                  }
                                )
                              : t(
                                  "toolbar.table.selectedRow",
                                  {
                                    row:
                                      linhaTabelaSelecionada.indice,
                                    total:
                                      linhaTabelaSelecionada.total,
                                  }
                                )}
                          </div>
                        ) : (
                          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                            {t(
                              "toolbar.table.selectRowHelp"
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-[11px] font-semibold">
                          <span className="mb-1 block">
                            {t(
                              "toolbar.table.rowHeight"
                            )}
                          </span>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={20}
                              max={500}
                              value={
                                alturaCelulaTabela
                              }
                              onMouseDown={memorizarContextoTabela}
                              onChange={(event) =>
                                setAlturaCelulaTabela(
                                  Number(
                                    event.target.value
                                  )
                                )
                              }
                              className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-2 text-[11px] text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            />

                            <span className="text-[10px] font-bold">
                              px
                            </span>
                          </div>
                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "atual"
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.applyCurrentRow"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "selecionadas"
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.applySelectedRows"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "todas"
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.applyAllRows"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "semCabecalho"
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.applyAllExceptHeader"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "atual",
                              true
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.autoCurrentRow"
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            alterarAlturaLinhasTabela(
                              "todas",
                              true
                            )
                          }
                          className={classeBotao(false)}
                        >
                          {t(
                            "toolbar.table.autoAllRows"
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                        {t(
                          "toolbar.table.rowResizeHelp"
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
                    {t(
                      "toolbar.table.alignmentHelp"
                    )}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <style jsx global>{`
        /* Contraste do painel da ferramenta Tabela */
        .phanyx-table-tools-panel {
          color: #0f172a !important;
          background-color: #ffffff !important;
          opacity: 1 !important;
        }

        .phanyx-table-tools-panel :where(div, span, label):not(button *) {
          color: #0f172a !important;
          opacity: 1 !important;
        }

        .phanyx-table-tools-panel p {
          color: #475569 !important;
          opacity: 1 !important;
        }

        .phanyx-table-tools-panel input[type="number"],
        .phanyx-table-tools-panel select {
          color: #0f172a !important;
          background-color: #ffffff !important;
          opacity: 1 !important;
          -webkit-text-fill-color: #0f172a !important;
        }

        .dark .phanyx-table-tools-panel {
          color: #ffffff !important;
          background-color: #020617 !important;
        }

        .dark .phanyx-table-tools-panel :where(div, span, label):not(button *) {
          color: #ffffff !important;
        }

        .dark .phanyx-table-tools-panel p {
          color: #cbd5e1 !important;
        }

        .dark .phanyx-table-tools-panel input[type="number"],
        .dark .phanyx-table-tools-panel select {
          color: #ffffff !important;
          background-color: #0f172a !important;
          -webkit-text-fill-color: #ffffff !important;
        }

        .phanyx-history-section-editor table.phanyx-doc-table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
        }

        .phanyx-history-section-editor .tableWrapper {
          overflow-x: auto;
          padding: 2px 0 6px;
        }

        .phanyx-history-section-editor td,
        .phanyx-history-section-editor th {
          position: relative;
          box-sizing: border-box;
          color: #0f172a;
        }

        .phanyx-history-section-editor .selectedCell::after {
          position: absolute;
          inset: 0;
          z-index: 2;
          pointer-events: none;
          content: "";
          background: rgba(59, 130, 246, 0.16);
        }

        .phanyx-history-section-editor .column-resize-handle {
          position: absolute;
          top: 0;
          right: -3px;
          bottom: 0;
          width: 6px;
          z-index: 20;
          background: #3b82f6;
          pointer-events: none;
        }


        .phanyx-doc-table-row.phanyx-row-selected
          > td,
        .phanyx-doc-table-row.phanyx-row-selected
          > th {
          box-shadow:
            inset 0 2px 0 #2563eb,
            inset 0 -2px 0 #2563eb;
        }

        .phanyx-doc-table-row.phanyx-row-selected
          > td:first-child,
        .phanyx-doc-table-row.phanyx-row-selected
          > th:first-child {
          border-left-color: #2563eb !important;
        }

        .phanyx-doc-table-row.phanyx-row-selected
          > td:last-child,
        .phanyx-doc-table-row.phanyx-row-selected
          > th:last-child {
          border-right-color: #2563eb !important;
        }

        .phanyx-doc-table-row.phanyx-row-resize-hover
          > td,
        .phanyx-doc-table-row.phanyx-row-resize-hover
          > th {
          box-shadow:
            inset 0 -3px 0 #3b82f6;
        }

        .ProseMirror.phanyx-row-resize-cursor,
        .ProseMirror.phanyx-row-resize-cursor * {
          cursor: row-resize !important;
        }

        .resize-cursor {
          cursor: col-resize;
        }
      `}</style>

      <div
        style={{ minHeight: `${minHeightPx}px` }}
        onClickCapture={
          selecionarLinhaTabelaPersistente
        }
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
