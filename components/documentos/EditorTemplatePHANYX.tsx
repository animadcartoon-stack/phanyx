"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";

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

export default function EditorTemplatePHANYX({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
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
          "editor-template-phanyx min-h-[380px] rounded-b-2xl bg-white px-5 py-5 text-sm leading-7 text-slate-900 outline-none",
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

  if (!editor) return null;

  return (
    <div className="rounded-2xl border bg-white">
      <div className="border-b bg-slate-50 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Ferramentas de edição
        </p>

<select
  defaultValue=""
  onChange={(e) => {
    const fonte = e.target.value;
    if (!fonte) return;
    editor.chain().focus().setFontFamily(fonte).run();
  }}
  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
>
  <option value="" disabled>
    Fonte
  </option>
  {FONTES_WINDOWS.map((fonte) => (
    <option key={fonte} value={fonte}>
      {fonte}
    </option>
  ))}
</select>

<select
  defaultValue=""
  onChange={(e) => {
    const tamanho = e.target.value;
    if (!tamanho) return;
    editor.chain().focus().setMark("textStyle", {
      fontSize: `${tamanho}pt`,
    }).run();
  }}
  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800"
>
  <option value="" disabled>
    Tamanho
  </option>
  {TAMANHOS_FONTE.map((tamanho) => (
    <option key={tamanho} value={tamanho}>
      {tamanho} pt
    </option>
  ))}
</select>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-100"
          >
            🅱️ Negrito
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            𝑰 Itálico
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            U̲ Sublinhado
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            ← Esquerda
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            ↔ Centro
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            → Direita
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("justify").run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            ☰ Justificar
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            Título
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            Subtítulo
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="rounded-xl border bg-white px-3 py-2 text-sm hover:bg-slate-100"
          >
            • Lista
          </button>

          <input
            type="color"
            onChange={(e) =>
              editor.chain().focus().setColor(e.target.value).run()
            }
            className="h-10 w-12 rounded-xl border bg-white"
            title="Cor do texto"
          />
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}