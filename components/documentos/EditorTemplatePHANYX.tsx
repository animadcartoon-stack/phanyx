"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function EditorTemplatePHANYX({ value, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-b-2xl bg-white px-5 py-5 text-sm leading-7 text-slate-900 outline-none",
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

    const atual = editor.getHTML();
    if (value !== atual) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-2xl border bg-white">
      <div className="border-b bg-slate-50 p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
          Ferramentas de edição
        </p>

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