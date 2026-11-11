"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import { NodeSelection } from "@tiptap/pm/state";
import {
  espacamentosTextoPdf, estilosTextoPdf, ImagemTextoPdf, ParagrafoTextoPdf, posicoesImagemPdf,
  FormatoTabelaTextoPdf, VisualTabelaTextoPdf, larguraColunaTextoPdf, type PosicaoImagemPdf,
} from "@/lib/documentos-docentes/editor-texto-pdf-extensoes";
import { textosEditorTextoPdf } from "@/lib/documentos-docentes/i18n-editor-texto-pdf";
import type { TextoImportadoPdf } from "@/lib/documentos-docentes/texto-editavel-pdf";
import { botaoLeitorPdf } from "./LeitorPdfDocumento";
import { useTelaCheiaPdf } from "./useTelaCheiaPdf";
import { lerImagemPdf } from "@/lib/documentos-docentes/imagem-pdf-local";
import { ConfiguracaoPapelTextoPdf, PreviaPapelTextoPdf } from "./PapelTextoPdf";
import { cssImpressaoPapelPdf, logoPapelPdf, papelPadrao, type InstituicaoPapelPdf } from "@/lib/documentos-docentes/papel-texto-pdf";
import { textosPapelTextoPdf } from "@/lib/documentos-docentes/i18n-papel-texto-pdf";

const fontesComuns = ["Arial", "Calibri", "Cambria", "Courier New", "Georgia", "Segoe UI", "Tahoma", "Times New Roman", "Verdana"];
const tamanhos = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
const campo = "rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900";
const tipoImagem = "imagemTextoPdf";
type AtributosImagem = {
  posicao: PosicaoImagemPdf; largura: number | null; deslocamentoX: number; deslocamentoY: number; alt: string; sombra: boolean;
};

function Botao({ children, onClick, ativo, disabled }: {
  children: ReactNode; onClick: () => void; ativo?: boolean; disabled?: boolean;
}) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-pressed={ativo}
    className={`${botaoLeitorPdf} ${ativo ? "border-blue-700 bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200" : ""}`}>{children}</button>;
}

function Campo({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1 text-xs font-semibold">{label}{children}</label>;
}

function estadoEditor(editor: Editor | null) {
  if (!editor) return null;
  const texto = editor.getAttributes("textStyle");
  const { selection } = editor.state;
  const imagem = selection instanceof NodeSelection && selection.node.type.name === tipoImagem
    ? selection.node.attrs as AtributosImagem
    : null;
  const tabela = editor.isActive("table") ? editor.getAttributes("table") : null;
  const imagens: { pos: number; nome: string }[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === tipoImagem) imagens.push({ pos, nome: node.attrs.alt });
  });
  return {
    fonte: (texto.fontFamily ?? "").replace(/^["']|["']$/g, ""),
    tamanho: texto.fontSize ?? "",
    cor: /^#[a-f0-9]{6}$/i.test(texto.color ?? "") ? texto.color : "#111827",
    espacamento: editor.getAttributes("paragraph").lineHeight ?? editor.getAttributes("heading").lineHeight ?? "",
    alinhamento: editor.getAttributes("paragraph").textAlign ?? editor.getAttributes("heading").textAlign ?? "left",
    negrito: editor.isActive("bold"),
    italico: editor.isActive("italic"),
    sublinhado: editor.isActive("underline"),
    tabela: tabela ? { largura: tabela.larguraTabela as number, borda: tabela.bordaTabela as number,
      altura: editor.getAttributes("tableRow").alturaLinha as number } : null,
    imagem: imagem ? {
      posicao: imagem.posicao, largura: imagem.largura, deslocamentoX: imagem.deslocamentoX,
      deslocamentoY: imagem.deslocamentoY, alt: imagem.alt, sombra: imagem.sombra, pos: selection.from,
    } : null,
    imagens,
  };
}

export default function EditorTextoPdf({ documento, nome, importado, onVoltar }: {
  documento: TextoImportadoPdf; nome: string; importado: boolean; onVoltar: () => void;
}) {
  const locale = useLocale();
  const t = textosEditorTextoPdf(locale);
  const toolbar = useTranslations("AdminDocumentsTemplatesHistoryEditor.toolbar");
  const leitor = useTranslations("ReaderLibrary");
  const rotulosPapel = textosPapelTextoPdf(locale);
  const tela = useTelaCheiaPdf();
  const botaoSalvar = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [fontes, setFontes] = useState<string[]>(fontesComuns);
  const [aviso, setAviso] = useState("");
  const [zoom, setZoom] = useState(100);
  const [papel, setPapel] = useState(papelPadrao);
  const [marca, setMarca] = useState<InstituicaoPapelPdf | null>(null);
  const usaTimbrado = papel.modelo !== "branco" || (papel.primeira !== "igual" && papel.primeira !== "branco");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [1, 2, 3] } }),
      TextStyleKit.configure({ lineHeight: false, backgroundColor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TableKit.configure({ table: { resizable: true, View: VisualTabelaTextoPdf } }),
      FormatoTabelaTextoPdf,
      ParagrafoTextoPdf,
      ImagemTextoPdf,
    ],
    content: documento.conteudo,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "phx-texto-pdf min-h-[900px] outline-none", "aria-label": t.conteudo, role: "textbox", "aria-multiline": "true" },
      handleKeyDown: (_, evento) => {
        if (evento.key !== "Escape" || tela.telaCheia) return false;
        botaoSalvar.current?.focus();
        return true;
      },
    },
  });
  const atual = useEditorState({ editor, selector: ({ editor: instancia }) => estadoEditor(instancia) });

  useEffect(() => () => frame.current?.remove(), []);

  useEffect(() => {
    if (!usaTimbrado || marca) return;
    const controller = new AbortController();
    void fetch("/api/documentos-docentes/timbrado", { cache: "no-store", signal: controller.signal })
      .then(resposta => resposta.ok ? resposta.json() : null)
      .then((dados: InstituicaoPapelPdf | null) => {
        if (dados && typeof dados.nome === "string" && !controller.signal.aborted) {
          setMarca({ nome: dados.nome, logoUrl: logoPapelPdf(dados.logoUrl, window.location.origin) });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [usaTimbrado, marca]);

  async function voltar() {
    await tela.fechar();
    onVoltar();
  }

  async function carregarFontes() {
    setAviso("");
    const janela = window as Window & { queryLocalFonts?: () => Promise<{ family: string }[]> };
    try {
      if (!janela.queryLocalFonts) throw new Error("FONTES_LOCAIS_INDISPONIVEIS");
      const locais = await janela.queryLocalFonts();
      const familias = locais.map(fonte => fonte.family.trim()).filter(Boolean);
      setFontes([...new Set([...fontesComuns, ...familias])].sort((a, b) => a.localeCompare(b, locale)));
    } catch { setAviso(t.fontesFalha); }
  }

  async function adicionarImagem(arquivo: File) {
    if (!editor) return;
    setAviso("");
    try {
      const { src } = await lerImagemPdf(arquivo);
      if (editor.isDestroyed) return;
      editor.chain().focus().insertContent({ type: tipoImagem, attrs: { src, alt: arquivo.name } }).run();
    } catch { setAviso(t.imagemFalha); }
  }

  function imprimir() {
    if (!editor) return;
    frame.current?.remove();
    const iframe = document.createElement("iframe");
    iframe.title = t.salvar;
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;border:0";
    const logo = usaTimbrado ? marca?.logoUrl : null;
    const origemLogo = logo && !logo.startsWith("data:") ? new URL(logo).origin : "";
    iframe.onload = async () => {
      const destino = iframe.contentWindow;
      const doc = iframe.contentDocument;
      if (!destino || !doc) return;
      doc.title = nome.replace(/\.pdf$/i, "");
      if (logo) {
        const imagem = doc.createElement("img");
        imagem.referrerPolicy = "no-referrer";
        imagem.src = logo;
        await imagem.decode().catch(() => {});
      }
      await doc.fonts.ready;
      await Promise.allSettled(Array.from(doc.images, imagem => imagem.decode()));
      if (!iframe.isConnected) return;
      destino.addEventListener("afterprint", () => iframe.remove(), { once: true });
      destino.focus();
      destino.print();
    };
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: ${origemLogo}; style-src 'unsafe-inline'"><style>${estilosTextoPdf}${cssImpressaoPapelPdf(papel, marca)}</style></head><body><article class="phx-texto-pdf">${editor.getHTML()}</article></body></html>`;
    document.body.append(iframe);
    frame.current = iframe;
  }

  function alterarImagem(atributos: object) {
    if (!editor || !atual?.imagem) return;
    const { pos } = atual.imagem;
    editor.commands.command(({ tr }) => {
      const imagem = tr.doc.nodeAt(pos);
      if (imagem?.type.name !== tipoImagem) return false;
      tr.setNodeMarkup(pos, undefined, { ...imagem.attrs, ...atributos });
      tr.setSelection(NodeSelection.create(tr.doc, pos));
      return true;
    });
  }

  return (
    <main ref={tela.principal} className={`space-y-4 bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 ${tela.telaCheia ? "fixed inset-0 z-[1000] overflow-auto p-4" : "mx-auto max-w-7xl"}`}>
      <style>{estilosTextoPdf}</style>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.titulo}</h1>
          <p className="text-sm">{t.explicacao}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Botao onClick={() => void tela.alternar()}>{tela.telaCheia ? t.sairTelaCheia : leitor("fullscreen")}</Botao>
          <Botao onClick={() => void voltar()}>{t.voltar}</Botao>
          <button ref={botaoSalvar} type="button" disabled={!editor} onClick={imprimir}
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{t.salvar}</button>
        </div>
      </header>
      {importado && <p className="text-sm">{t.importado}</p>}
      {documento.paginasSemTexto.length > 0 && <p role="status" className="text-sm">{t.paginasSemTexto} · {documento.paginasSemTexto.join(", ")}</p>}
      {aviso && <p role="status" className="text-sm text-amber-800 dark:text-amber-300">{aviso}</p>}
      {editor && atual && <section aria-label={toolbar("title")} className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <div className="flex flex-wrap items-end gap-2">
          <Campo label={toolbar("font")}>
            <select className={campo} value={atual.fonte} onChange={e => {
              const fonte = e.target.value.replace(/[\u0000-\u001f\u007f"\\]/g, "");
              if (fonte) editor.chain().focus().setFontFamily(`"${fonte}"`).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}>
              <option value="">Arial</option>
              {fontes.filter(fonte => fonte !== "Arial").map(fonte => <option key={fonte} value={fonte}>{fonte}</option>)}
            </select>
          </Campo>
          <Botao onClick={() => void carregarFontes()}>{t.fontes}</Botao>
          <Campo label={toolbar("fontSize")}>
            <select className={campo} value={atual.tamanho || "12pt"} onChange={e => editor.chain().focus().setFontSize(e.target.value).run()}>
              {tamanhos.map(tamanho => <option key={tamanho} value={`${tamanho}pt`}>{tamanho} pt</option>)}
            </select>
          </Campo>
          <Campo label={toolbar("lineSpacing")}>
            <select className={campo} value={atual.espacamento} onChange={e => {
              const lineHeight = e.target.value || null;
              editor.chain().focus().updateAttributes("paragraph", { lineHeight }).updateAttributes("heading", { lineHeight }).run();
            }}>
              <option value="">1.35</option>
              {espacamentosTextoPdf.map(espaco => <option key={espaco}>{espaco}</option>)}
            </select>
          </Campo>
          <Campo label={toolbar("textColor")}>
            <input type="color" value={atual.cor} className="h-8 w-12 rounded border border-slate-300"
              onChange={e => editor.chain().focus().setColor(e.target.value).run()} />
          </Campo>
          <Botao ativo={atual.negrito} onClick={() => editor.chain().focus().toggleBold().run()}>{toolbar("bold")}</Botao>
          <Botao ativo={atual.italico} onClick={() => editor.chain().focus().toggleItalic().run()}>{toolbar("italic")}</Botao>
          <Botao ativo={atual.sublinhado} onClick={() => editor.chain().focus().toggleUnderline().run()}>{toolbar("underline")}</Botao>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {(["left", "center", "right", "justify"] as const).map(alinhamento => <Botao key={alinhamento} ativo={atual.alinhamento === alinhamento}
            onClick={() => editor.chain().focus().setTextAlign(alinhamento).run()}>{toolbar(alinhamento)}</Botao>)}
          <Botao onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>{toolbar("heading")}</Botao>
          <Botao onClick={() => editor.chain().focus().toggleBulletList().run()}>{toolbar("list")}</Botao>
          <Botao onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>{toolbar("table.insert")}</Botao>
          <Campo label={t.imagem}>
            <input type="file" accept="image/png,image/jpeg,image/webp" className="max-w-[15rem] text-sm"
              onChange={e => { const arquivo = e.target.files?.[0]; if (arquivo) void adicionarImagem(arquivo); e.target.value = ""; }} />
          </Campo>
          {atual.imagens.length > 0 && <Campo label={t.selecionarImagem}>
            <select className={campo} value={atual.imagem?.pos ?? ""} onChange={e => {
              if (e.target.value !== "") editor.chain().focus().setNodeSelection(Number(e.target.value)).run();
            }}>
              <option value="">{t.selecionarImagem}</option>
              {atual.imagens.map((imagem, i) => <option key={imagem.pos} value={imagem.pos}>{imagem.nome || `${t.imagem} ${i + 1}`}</option>)}
            </select>
          </Campo>}
        </div>
        {atual.tabela && <div className="flex flex-wrap items-end gap-2">
          <Botao onClick={() => editor.chain().focus().addRowAfter().run()}>{toolbar("table.addRowAfter")}</Botao>
          <Botao onClick={() => editor.chain().focus().addColumnAfter().run()}>{toolbar("table.addColumnAfter")}</Botao>
          <Botao onClick={() => editor.chain().focus().deleteRow().run()}>{toolbar("table.deleteRow")}</Botao>
          <Botao onClick={() => editor.chain().focus().deleteColumn().run()}>{toolbar("table.deleteColumn")}</Botao>
          <Botao disabled={!editor.can().mergeCells()} onClick={() => editor.chain().focus().mergeCells().run()}>{toolbar("table.mergeCells")}</Botao>
          <Botao disabled={!editor.can().splitCell()} onClick={() => editor.chain().focus().splitCell().run()}>{toolbar("table.splitCell")}</Botao>
          <Campo label={rotulosPapel.tabela}>
            <input className={`w-20 ${campo}`} type="number" min="25" max="100" step="1" key={`largura-${atual.tabela.largura}`}
              defaultValue={atual.tabela.largura} onBlur={e => {
                const valor = Number(e.target.value);
                if (Number.isInteger(valor) && valor >= 25 && valor <= 100) editor.commands.updateAttributes("table", { larguraTabela: valor });
                else e.target.value = String(atual.tabela?.largura);
              }} />
          </Campo>
          <Campo label={rotulosPapel.coluna}>
            <input className={`w-20 ${campo}`} type="number" min="25" max="700" step="1"
              onBlur={e => {
                if (e.target.value) larguraColunaTextoPdf(editor, Number(e.target.value));
                e.target.value = "";
              }} />
          </Campo>
          <Campo label={rotulosPapel.linha}>
            <input className={`w-20 ${campo}`} type="number" min="0" max="400" step="1" key={`linha-${atual.tabela.altura}`}
              defaultValue={atual.tabela.altura} onBlur={e => {
                const valor = Number(e.target.value);
                if (Number.isInteger(valor) && valor >= 0 && valor <= 400) editor.commands.updateAttributes("tableRow", { alturaLinha: valor });
                else e.target.value = String(atual.tabela?.altura);
              }} />
          </Campo>
          <Campo label={rotulosPapel.borda}>
            <input className={`w-20 ${campo}`} type="number" min="0" max="12" step="1" key={`borda-${atual.tabela.borda}`}
              defaultValue={atual.tabela.borda} onBlur={e => {
                const valor = Number(e.target.value);
                if (Number.isInteger(valor) && valor >= 0 && valor <= 12) editor.commands.updateAttributes("table", { bordaTabela: valor });
                else e.target.value = String(atual.tabela?.borda);
              }} />
          </Campo>
          <Botao onClick={() => editor.chain().focus().deleteTable().run()}>{toolbar("table.deleteTable")}</Botao>
        </div>}
        {atual.imagem && <div className="flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
          <Campo label={t.posicao}>
            <select className={campo} value={atual.imagem.posicao} onChange={e => alterarImagem({ posicao: e.target.value })}>
              {posicoesImagemPdf.map(posicao => <option key={posicao} value={posicao}>{t[posicao]}</option>)}
            </select>
          </Campo>
          <Campo label={t.largura}>
            <select className={campo} value={atual.imagem.largura ?? ""} onChange={e => alterarImagem({ largura: e.target.value ? Number(e.target.value) : null })}>
              <option value="">{t.original}</option>
              {[10, 20, 25, 35, 50, 60, 75, 90, 100].map(valor => <option key={valor} value={valor}>{valor}%</option>)}
            </select>
          </Campo>
          {["frente", "atras"].includes(atual.imagem.posicao) && (["deslocamentoX", "deslocamentoY"] as const).map(eixo => (
            <Campo key={eixo} label={t[eixo]}>
              <input key={`${atual.imagem?.pos}-${atual.imagem?.[eixo]}`} type="number" min="-600" max="600" step="1" className={`w-24 ${campo}`}
                defaultValue={atual.imagem?.[eixo]} onBlur={e => {
                  const valor = Number(e.target.value);
                  if (Number.isInteger(valor) && valor >= -600 && valor <= 600) alterarImagem({ [eixo]: valor });
                  else e.target.value = String(atual.imagem?.[eixo]);
                }} />
            </Campo>
          ))}
          <Campo label={t.alt}>
            <input key={`${atual.imagem.pos}-${atual.imagem.alt}`} maxLength={200} defaultValue={atual.imagem.alt}
              className={campo} onBlur={e => alterarImagem({ alt: e.target.value.trim() })} />
          </Campo>
          <Botao ativo={atual.imagem.sombra} onClick={() => alterarImagem({ sombra: !atual.imagem?.sombra })}>{t.sombra}</Botao>
          <Botao onClick={() => editor.chain().focus().deleteSelection().run()}>{t.removerImagem}</Botao>
        </div>}
      </section>}
      <div className="flex items-center gap-2" aria-label={leitor("zoom")}>
        <button type="button" aria-label={leitor("zoomOut")} disabled={zoom <= 50} onClick={() => setZoom(v => v - 25)} className={botaoLeitorPdf}>−</button>
        <button type="button" aria-label={leitor("fitPage")} onClick={() => setZoom(100)} className={botaoLeitorPdf}>{zoom}%</button>
        <button type="button" aria-label={leitor("zoomIn")} disabled={zoom >= 200} onClick={() => setZoom(v => v + 25)} className={botaoLeitorPdf}>+</button>
        <span className="text-xs">{t.teclado}</span>
      </div>
      <ConfiguracaoPapelTextoPdf papel={papel} locale={locale} onChange={setPapel} />
      <PreviaPapelTextoPdf papel={papel} zoom={zoom} marca={marca} locale={locale}>
        <EditorContent editor={editor} />
      </PreviaPapelTextoPdf>
    </main>
  );
}
