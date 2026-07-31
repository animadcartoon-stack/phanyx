"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Extension,
  mergeAttributes,
  Node as TiptapNode,
} from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { createPortal } from "react-dom";

const FONTES_WINDOWS = [
  "Arial",
  "Arial Black",
  "Bahnschrift",
  "Calibri",
  "Cambria",
  "Candara",
  "Comic Sans MS",
  "Consolas",
  "Constantia",
  "Corbel",
  "Courier New",
  "Franklin Gothic Medium",
  "Gabriola",
  "Georgia",
  "Impact",
  "Lucida Console",
  "Lucida Sans Unicode",
  "Microsoft Sans Serif",
  "Palatino Linotype",
  "Segoe Print",
  "Segoe Script",
  "Segoe UI",
  "Tahoma",
  "Times New Roman",
  "Trebuchet MS",
  "Verdana",
];

const TAMANHOS_FONTE = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "28",
  "32",
  "36",
  "48",
  "72",
];

const ESPACAMENTOS_LINHA = [
  { label: "Linha 1.0", value: "1" },
  { label: "Linha 1.15", value: "1.15" },
  { label: "Linha 1.5", value: "1.5" },
  { label: "Linha 2.0", value: "2" },
  { label: "Linha 2.5", value: "2.5" },
  { label: "Linha 3.0", value: "3" },
];

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize || null,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

const LineHeight = Extension.create({
  name: "lineHeight",

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
});

const ALTURA_A4_MM = 297;
const ALTURA_CABECALHO_MM = 42;
const ALTURA_RODAPE_MM = 28;

const ALTURA_UTIL_PAGINA_MM =
  ALTURA_A4_MM -
  ALTURA_CABECALHO_MM -
  ALTURA_RODAPE_MM;

function mmParaPx(valor: number) {
  return (
    valor *
    (96 / 25.4)
  );
}

const PageBreakPHANYX =
  TiptapNode.create({
    name: "pageBreak",

    group: "block",

    atom: true,

    selectable: false,

    draggable: false,

    addAttributes() {
      return {
        paginaAnterior: {
          default: 1,

          parseHTML: (element) =>
            Number(
              element.getAttribute(
                "data-pagina-anterior"
              ) || 1
            ),

          renderHTML: (attributes) => ({
            "data-pagina-anterior":
              attributes.paginaAnterior,
          }),
        },

        paginaSeguinte: {
          default: 2,

          parseHTML: (element) =>
            Number(
              element.getAttribute(
                "data-pagina-seguinte"
              ) || 2
            ),

          renderHTML: (attributes) => ({
            "data-pagina-seguinte":
              attributes.paginaSeguinte,
          }),
        },
      };
    },

    parseHTML() {
      return [
        {
          tag:
            'div[data-phanyx-page-break="true"]',
        },
      ];
    },

    renderHTML({
      HTMLAttributes,
    }) {
      const paginaAnterior =
        Number(
          HTMLAttributes[
          "data-pagina-anterior"
          ] || 1
        );

      const paginaSeguinte =
        Number(
          HTMLAttributes[
          "data-pagina-seguinte"
          ] || paginaAnterior + 1
        );

      return [
        "div",

        mergeAttributes(
          HTMLAttributes,
          {
            "data-phanyx-page-break":
              "true",

            contenteditable:
              "false",

            class:
              "phanyx-page-break",
          }
        ),

        [
          "div",
          {
            class:
              "phanyx-page-break__rodape",
          },

          [
            "span",
            {},
            "Área reservada para rodapé",
          ],

          [
            "span",
            {},
            `Página ${paginaAnterior}`,
          ],
        ],

        [
          "div",
          {
            class:
              "phanyx-page-break__intervalo",
          },
        ],

        [
          "div",
          {
            class:
              "phanyx-page-break__cabecalho",
          },

          [
            "span",
            {},
            "Área reservada para cabeçalho e logo",
          ],

          [
            "span",
            {},
            `Página ${paginaSeguinte}`,
          ],
        ],
      ];
    },
  });

type Props = {
  value: string;
  onChange: (html: string) => void;
};

function conteudoParaHtmlSeguro(valor: string) {
  const texto = String(valor || "");

  const pareceHtml =
    texto.includes("<p") ||
    texto.includes("<div") ||
    texto.includes("<h1") ||
    texto.includes("<h2") ||
    texto.includes("<strong") ||
    texto.includes("<span") ||
    texto.includes("<br");

  if (pareceHtml) return texto;

  return texto
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const linhas = bloco
        .split("\n")
        .map((linha) => linha.trim())
        .filter(Boolean);

      return `<p>${linhas.join("<br />")}</p>`;
    })
    .join("\n");
}

function blocoPossuiConteudoVisivel(
  node: any
) {
  const texto =
    String(
      node?.textContent || ""
    ).trim();

  if (texto) {
    return true;
  }

  return [
    "horizontalRule",
    "image",
    "table",
  ].includes(
    String(
      node?.type?.name || ""
    )
  );
}

export default function EditorTemplatePHANYX({ value, onChange }: Props) {
  const [fonteAtual, setFonteAtual] = useState("");
  const [tamanhoAtual, setTamanhoAtual] = useState("");

  const [
  formatacaoAtiva,
  setFormatacaoAtiva,
] = useState({
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

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(1);

  const [
    espacoFinalPx,
    setEspacoFinalPx,
  ] = useState(
    mmParaPx(
      ALTURA_UTIL_PAGINA_MM
    )
  );

  const barraOriginalRef =
  useRef<HTMLDivElement | null>(null);

const barraContainerRef =
  useRef<HTMLDivElement | null>(null);

const [portalPronto, setPortalPronto] =
  useState(false);

const [barraFlutuante, setBarraFlutuante] =
  useState(false);

  const barraFlutuanteRef =
  useRef(false);

const [barraMedidas, setBarraMedidas] =
  useState({
    left: 8,
    width: 640,
  });

  const editor = useEditor({

    extensions: [
      StarterKit,
      PageBreakPHANYX,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      LineHeight,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: conteudoParaHtmlSeguro(value) || "<p></p>",
    parseOptions: {
      preserveWhitespace: "full",
    },
    editorProps: {
      attributes: {
        class:
          "editor-template-phanyx text-[11pt] leading-[normal] text-slate-900 outline-none",
      },
      handleKeyDown(view, event) {
        if (event.key === "Tab") {
          event.preventDefault();
          view.dispatch(view.state.tr.insertText("    "));
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

    const novoConteudo = conteudoParaHtmlSeguro(value);
    const atual = editor.getHTML();

    if (atual === novoConteudo) return;

    editor.commands.setContent(novoConteudo || "<p></p>", {
      emitUpdate: false,
      preserveWhitespace: "full",
    } as any);
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;

    function limparFonte(valor: any) {
      return String(valor || "")
        .replaceAll('"', "")
        .replaceAll("'", "")
        .split(",")[0]
        .trim();
    }

    function limparTamanho(valor: any) {
      const texto = String(valor || "").trim();
      if (!texto) return "";

      if (texto.includes("px")) {
        const numero = Number(texto.replace("px", ""));
        return Number.isFinite(numero) ? String(Math.round(numero * 0.75)) : "";
      }

      return texto.replace("pt", "").trim();
    }

    function atualizarSelecao() {
      const attrs = editor.getAttributes("textStyle");

      let fonte = limparFonte(attrs.fontFamily);
      let tamanho = limparTamanho(attrs.fontSize);

      const selection = window.getSelection();
      const node = selection?.anchorNode;

      const elemento =
  node?.nodeType === Node.TEXT_NODE
    ? node.parentElement
    : (node as HTMLElement | null);

const computed =
  elemento
    ? window.getComputedStyle(
        elemento
      )
    : null;

if (computed) {
  if (!fonte) {
    fonte =
      limparFonte(
        computed.fontFamily
      );
  }

  if (!tamanho) {
    tamanho =
      limparTamanho(
        computed.fontSize
      );
  }
}

setFonteAtual(fonte || "");
setTamanhoAtual(tamanho || "");

const pesoFonte =
  String(
    computed?.fontWeight || ""
  ).toLowerCase();

const pesoFonteNumerico =
  Number.parseInt(
    pesoFonte,
    10
  );

const negritoVisual =
  pesoFonte === "bold" ||
  pesoFonte === "bolder" ||
  (
    Number.isFinite(
      pesoFonteNumerico
    ) &&
    pesoFonteNumerico >= 600
  );

const italicoVisual =
  String(
    computed?.fontStyle || ""
  ).toLowerCase() === "italic";

const sublinhadoVisual =
  String(
    computed?.textDecorationLine ||
      computed?.textDecoration ||
      ""
  )
    .toLowerCase()
    .includes("underline");
      const alinhamentoAtivo = (
  valor: string
) =>
  editor.isActive(
    "paragraph",
    {
      textAlign: valor,
    }
  ) ||
  editor.isActive(
    "heading",
    {
      textAlign: valor,
    }
  );

const centro =
  alinhamentoAtivo("center");

const direita =
  alinhamentoAtivo("right");

const justificar =
  alinhamentoAtivo("justify");

const esquerda =
  alinhamentoAtivo("left") ||
  (
    !centro &&
    !direita &&
    !justificar
  );

setFormatacaoAtiva({
  negrito:
  editor.isActive("bold") ||
  negritoVisual,

italico:
  editor.isActive("italic") ||
  italicoVisual,

sublinhado:
  editor.isActive("underline") ||
  sublinhadoVisual,

  esquerda,

  centro,

  direita,

  justificar,

  titulo:
    editor.isActive(
      "heading",
      {
        level: 1,
      }
    ),

  subtitulo:
    editor.isActive(
      "heading",
      {
        level: 2,
      }
    ),

  lista:
    editor.isActive(
      "bulletList"
    ),
});
    }

    editor.on("selectionUpdate", atualizarSelecao);
    editor.on("transaction", atualizarSelecao);
    document.addEventListener("selectionchange", atualizarSelecao);

    atualizarSelecao();

    return () => {
      editor.off("selectionUpdate", atualizarSelecao);
      editor.off("transaction", atualizarSelecao);
      document.removeEventListener("selectionchange", atualizarSelecao);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    let frame:
      number | null = null;

    const alturaUtilPx =
      mmParaPx(
        ALTURA_UTIL_PAGINA_MM
      );

    function paginarConteudo() {
      frame = null;

      const elementos =
        Array.from(
          editor.view.dom.children
        ) as HTMLElement[];

      const blocosDocumento: Array<{
        node: any;
        offset: number;
        index: number;
      }> = [];

      editor.state.doc.forEach(
        (
          node,
          offset,
          index
        ) => {
          blocosDocumento.push({
            node,
            offset,
            index,
          });
        }
      );

      let ultimoBlocoComConteudo =
        -1;

      for (
        let index =
          blocosDocumento.length - 1;
        index >= 0;
        index -= 1
      ) {
        const bloco =
          blocosDocumento[index];

        if (
          bloco.node.type.name !==
          "pageBreak" &&
          blocoPossuiConteudoVisivel(
            bloco.node
          )
        ) {
          ultimoBlocoComConteudo =
            index;

          break;
        }
      }

      const quebrasAtuais:
        Array<{
          posicaoReal: number;
          posicaoLimpa: number;
          tamanho: number;
        }> = [];

      const quebrasDesejadas:
        Array<{
          posicao: number;
          paginaAnterior: number;
          paginaSeguinte: number;
        }> = [];

      let alturaPaginaAtual = 0;
      let posicaoSemQuebras = 0;
      let paginaAtual = 1;

      blocosDocumento.forEach(
        (
          {
            node,
            offset,
            index,
          },
          indiceBloco
        ) => {
          if (
            node.type.name ===
            "pageBreak"
          ) {
            quebrasAtuais.push({
              posicaoReal:
                offset,

              posicaoLimpa:
                posicaoSemQuebras,

              tamanho:
                node.nodeSize,
            });

            return;
          }

          const elemento =
            elementos[index];

          let alturaElemento = 0;

          if (elemento) {
            const retangulo =
              elemento.getBoundingClientRect();

            const estilos =
              window.getComputedStyle(
                elemento
              );

            const margemSuperior =
              Number.parseFloat(
                estilos.marginTop || "0"
              ) || 0;

            const margemInferior =
              Number.parseFloat(
                estilos.marginBottom || "0"
              ) || 0;

            alturaElemento =
              retangulo.height +
              margemSuperior +
              margemInferior;
          }

          const blocoVazioNoFinal =
            indiceBloco >
            ultimoBlocoComConteudo &&
            !blocoPossuiConteudoVisivel(
              node
            );

          if (
            !blocoVazioNoFinal &&
            alturaPaginaAtual > 0 &&
            alturaPaginaAtual +
            alturaElemento >
            alturaUtilPx
          ) {
            quebrasDesejadas.push({
              posicao:
                posicaoSemQuebras,

              paginaAnterior:
                paginaAtual,

              paginaSeguinte:
                paginaAtual + 1,
            });

            paginaAtual += 1;
            alturaPaginaAtual = 0;
          }

          alturaPaginaAtual +=
            alturaElemento;

          posicaoSemQuebras +=
            node.nodeSize;
        }
      );

      setTotalPaginas(
        Math.max(
          paginaAtual,
          1
        )
      );

      setEspacoFinalPx(
        Math.max(
          0,
          alturaUtilPx -
          alturaPaginaAtual
        )
      );

      const posicoesAtuais =
        quebrasAtuais.map(
          (quebra) =>
            quebra.posicaoLimpa
        );

      const posicoesDesejadas =
        quebrasDesejadas.map(
          (quebra) =>
            quebra.posicao
        );

      const paginaçãoJaCorreta =
        posicoesAtuais.length ===
        posicoesDesejadas.length &&
        posicoesAtuais.every(
          (posicao, index) =>
            posicao ===
            posicoesDesejadas[
            index
            ]
        );

      if (paginaçãoJaCorreta) {
        return;
      }

      const tipoQuebra =
        editor.schema.nodes
          .pageBreak;

      if (!tipoQuebra) {
        return;
      }

      let transaction =
        editor.state.tr;

      for (
        let index =
          quebrasAtuais.length - 1;
        index >= 0;
        index -= 1
      ) {
        const quebra =
          quebrasAtuais[index];

        transaction =
          transaction.delete(
            quebra.posicaoReal,
            quebra.posicaoReal +
            quebra.tamanho
          );
      }

      for (
        let index =
          quebrasDesejadas.length -
          1;
        index >= 0;
        index -= 1
      ) {
        const quebra =
          quebrasDesejadas[index];

        transaction =
          transaction.insert(
            quebra.posicao,

            tipoQuebra.create({
              paginaAnterior:
                quebra.paginaAnterior,

              paginaSeguinte:
                quebra.paginaSeguinte,
            })
          );
      }

      transaction.setMeta(
        "addToHistory",
        false
      );

      transaction.setMeta(
        "phanyxPagination",
        true
      );

      editor.view.dispatch(
        transaction
      );
    }

    function agendarPaginacao() {
      if (frame !== null) {
        window.cancelAnimationFrame(
          frame
        );
      }

      frame =
        window.requestAnimationFrame(
          () => {
            frame =
              window.requestAnimationFrame(
                paginarConteudo
              );
          }
        );
    }

    function aoAlterarEditor({
      transaction,
    }: {
      transaction: any;
    }) {
      if (
        transaction.getMeta(
          "phanyxPagination"
        )
      ) {
        return;
      }

      agendarPaginacao();
    }

    editor.on(
      "transaction",
      aoAlterarEditor
    );

    window.addEventListener(
      "resize",
      agendarPaginacao
    );

    agendarPaginacao();

    return () => {
      editor.off(
        "transaction",
        aoAlterarEditor
      );

      window.removeEventListener(
        "resize",
        agendarPaginacao
      );

      if (frame !== null) {
        window.cancelAnimationFrame(
          frame
        );
      }
    };
  }, [editor]);

  useEffect(() => {
  setPortalPronto(true);

  return () => {
    setPortalPronto(false);
  };
}, []);

useEffect(() => {
  const container =
    barraContainerRef.current;

  if (!container) {
    return;
  }

  let frame:
    number | null = null;

  /*
   * Dois limites diferentes impedem
   * a barra de ficar ligando e
   * desligando no mesmo ponto.
   */
  const LIMITE_PARA_MOSTRAR = 180;
  const LIMITE_PARA_ESCONDER = 60;

  function atualizarBarra() {
    frame = null;

    const retangulo =
      container.getBoundingClientRect();

    const estavaFlutuando =
      barraFlutuanteRef.current;

    let deveFlutuar =
      estavaFlutuando;

    /*
     * A barra começa a flutuar somente
     * depois que o começo do editor
     * saiu da tela e ainda existe uma
     * boa área do editor abaixo.
     */
    if (!estavaFlutuando) {
      deveFlutuar =
        retangulo.top <= -8 &&
        retangulo.bottom >
          LIMITE_PARA_MOSTRAR;
    }

    /*
     * Depois de aberta, ela só fecha
     * quando o editor realmente acabou
     * ou quando voltamos ao topo.
     */
    if (
      estavaFlutuando &&
      (
        retangulo.top > -8 ||
        retangulo.bottom <=
          LIMITE_PARA_ESCONDER
      )
    ) {
      deveFlutuar = false;
    }

    if (
      deveFlutuar !==
      estavaFlutuando
    ) {
      barraFlutuanteRef.current =
        deveFlutuar;

      setBarraFlutuante(
        deveFlutuar
      );
    }

    if (!deveFlutuar) {
      return;
    }

    const esquerda =
      Math.max(
        Math.round(
          retangulo.left
        ),
        8
      );

    const larguraDisponivel =
      Math.max(
        320,
        window.innerWidth -
          esquerda -
          8
      );

    const largura =
      Math.max(
        320,
        Math.floor(
          Math.min(
            retangulo.width,
            larguraDisponivel
          )
        )
      );

    setBarraMedidas(
      (medidasAtuais) => {
        const mesmaEsquerda =
          Math.abs(
            medidasAtuais.left -
              esquerda
          ) < 2;

        const mesmaLargura =
          Math.abs(
            medidasAtuais.width -
              largura
          ) < 2;

        if (
          mesmaEsquerda &&
          mesmaLargura
        ) {
          return medidasAtuais;
        }

        return {
          left: esquerda,
          width: largura,
        };
      }
    );
  }

  function agendarAtualizacao() {
    if (frame !== null) {
      window.cancelAnimationFrame(
        frame
      );
    }

    frame =
      window.requestAnimationFrame(
        atualizarBarra
      );
  }

  /*
   * O true captura também a rolagem
   * interna do painel administrativo.
   */
  document.addEventListener(
    "scroll",
    agendarAtualizacao,
    true
  );

  window.addEventListener(
    "resize",
    agendarAtualizacao
  );

  const observadorTamanho =
    new ResizeObserver(
      agendarAtualizacao
    );

  observadorTamanho.observe(
    container
  );

  agendarAtualizacao();

  return () => {
    document.removeEventListener(
      "scroll",
      agendarAtualizacao,
      true
    );

    window.removeEventListener(
      "resize",
      agendarAtualizacao
    );

    observadorTamanho.disconnect();

    if (frame !== null) {
      window.cancelAnimationFrame(
        frame
      );
    }
  };
}, []);

  if (!editor) return null;

  function classeBotaoFormatacao(
  ativo: boolean
) {
  return [
    "rounded-xl",
    "border",
    "px-3",
    "py-2",
    "text-sm",
    "transition",

    ativo
      ? "phanyx-toolbar-ativo font-bold"
      : "border-slate-300 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800",
  ].join(" ");
}

  function renderizarFerramentas() {
  return (
    <div className="phanyx-editor-toolbar border-b border-slate-700 bg-slate-800 p-3">
      <p className="phanyx-editor-toolbar-title mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-200">
  Ferramentas de edição
</p>

      <div className="flex flex-wrap gap-2">
        <div
        className={`border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800 ${barraFlutuante
            ? "z-[999999] shadow-2xl"
            : "relative z-40"
          }`}
        style={
          barraFlutuante
            ? {
              position: "fixed",
              top: "8px",
              left:
                `${barraMedidas.left}px`,
              width:
                `${barraMedidas.width}px`,
              maxHeight:
                "calc(100vh - 16px)",
              overflowY: "auto",
            }
            : undefined
        }
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Ferramentas de edição
        </p>

        <div className="flex flex-wrap gap-2">
          <select
            value={fonteAtual}
            onChange={(e) => {
              const fonte = e.target.value;
              if (!fonte) return;

              editor.chain().focus().setFontFamily(fonte).run();
              setFonteAtual(fonte);
              onChange(editor.getHTML());
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none hover:bg-slate-100 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800 [&>option]:bg-white [&>option]:text-slate-950 dark:[&>option]:bg-slate-950 dark:[&>option]:text-white"
          >
            <option value="">
              Fonte
            </option>
            {FONTES_WINDOWS.map((fonte) => (
              <option key={fonte} value={fonte}>
                {fonte}
              </option>
            ))}
          </select>

          <select
            value={tamanhoAtual}
            onChange={(e) => {
              const tamanho = e.target.value;
              if (!tamanho) return;

              editor
                .chain()
                .focus()
                .setMark("textStyle", {
                  fontSize: `${tamanho}pt`,
                })
                .run();

              setTamanhoAtual(tamanho);
              onChange(editor.getHTML());
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none hover:bg-slate-100 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800 [&>option]:bg-white [&>option]:text-slate-950 dark:[&>option]:bg-slate-950 dark:[&>option]:text-white"
          >
            <option value="">
              Tamanho
            </option>
            {TAMANHOS_FONTE.map((tamanho) => (
              <option key={tamanho} value={tamanho}>
                {tamanho} pt
              </option>
            ))}
          </select>

          <select
            defaultValue=""
            onChange={(e) => {
              const lineHeight = e.target.value;
              if (!lineHeight) return;

              editor
                .chain()
                .focus()
                .updateAttributes("paragraph", { lineHeight })
                .updateAttributes("heading", { lineHeight })
                .run();

              onChange(editor.getHTML());
            }}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none hover:bg-slate-100 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800 [&>option]:bg-white [&>option]:text-slate-950 dark:[&>option]:bg-slate-950 dark:[&>option]:text-white"
          >
            <option value="">
              Espaçamento
            </option>
            {ESPACAMENTOS_LINHA.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.negrito
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleBold()
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.negrito
  )}
>
  🅱️ Negrito
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.italico
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleItalic()
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.italico
  )}
>
  𝑰 Itálico
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.sublinhado
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleUnderline()
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.sublinhado
  )}
>
  U̲ Sublinhado
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.esquerda
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .setTextAlign("left")
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.esquerda
  )}
>
  ← Esquerda
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.centro
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .setTextAlign("center")
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.centro
  )}
>
  ↔ Centro
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.direita
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .setTextAlign("right")
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.direita
  )}
>
  → Direita
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.justificar
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .setTextAlign("justify")
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.justificar
  )}
>
  ☰ Justificar
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.titulo
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 1,
      })
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.titulo
  )}
>
  Título
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.subtitulo
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleHeading({
        level: 2,
      })
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.subtitulo
  )}
>
  Subtítulo
</button>

          <button
  type="button"
  aria-pressed={
    formatacaoAtiva.lista
  }
  onClick={() =>
    editor
      .chain()
      .focus()
      .toggleBulletList()
      .run()
  }
  className={classeBotaoFormatacao(
    formatacaoAtiva.lista
  )}
>
  • Lista
</button>

          <input
            type="color"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            className="h-10 w-12 rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950"
            title="Cor do texto"
          />
        </div>
      </div>
      </div>
    </div>
  );
}

  return (
  <div
    ref={barraContainerRef}
    className="relative rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
  >
    <div
  ref={barraOriginalRef}
  className={
    barraFlutuante
      ? "invisible"
      : ""
  }
  aria-hidden={
    barraFlutuante
  }
>
  {renderizarFerramentas()}
</div>

    {portalPronto &&
      barraFlutuante &&
      createPortal(
        <div
          className="phanyx-editor-toolbar-portal overflow-hidden rounded-2xl shadow-2xl"
          style={{
            position: "fixed",
            top: "8px",
            left: `${barraMedidas.left}px`,
            width: `${barraMedidas.width}px`,
            maxHeight: "calc(100vh - 16px)",
            overflowY: "auto",
            zIndex: 2147483000,
            overflowX: "hidden",
          }}
        >
          {renderizarFerramentas()}
        </div>,
        document.body
      )}

    <div className="overflow-x-auto bg-slate-100 p-6 dark:bg-slate-950">
      <div className="mx-auto w-[210mm] shadow-2xl">
        <div className="phanyx-a4-guia-cabecalho">
          <span>
            Área reservada para cabeçalho e logo
          </span>

          <span>Página 1</span>
        </div>

        <div className="bg-white text-black">
          <EditorContent editor={editor} />

          <div
            aria-hidden="true"
            style={{
              height: `${espacoFinalPx}px`,
            }}
          />
        </div>

        <div className="phanyx-a4-guia-rodape">
          <span>
            Área reservada para rodapé
          </span>

          <span>
            Página {totalPaginas}
          </span>
        </div>
      </div>
    </div>
  </div>
);
}