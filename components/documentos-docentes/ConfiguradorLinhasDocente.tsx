"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  atualizarLinhasCampoDocente,
  camposModeloDocente,
  marcadorCampoDocente,
  nomeCampoDocenteValido,
} from "@/lib/documentos-docentes/campos-impressao";

type Props = {
  tipo: string;
  contexto: string;
  conteudo: string;
  aoInserir: (marcador: string) => void;
  aoAlterar: (html: string) => void;
};

const rotulos = {
  "pt-BR": {
    title: "Campos preenchíveis do professor",
    help: "Defina quantas linhas aparecerão no PDF em branco. Quando o professor digitar na tela, o texto crescerá normalmente e empurrará o restante do documento para baixo.",
    name: "Nome do campo", nameHint: "Ex.: Objetivos", lines: "Linhas para preenchimento manual",
    insert: "Inserir campo no editor", update: "Alterar linhas do campo existente", missing: "Esse campo ainda não existe no modelo.",
    invalid: "Informe um nome válido e de 1 a 12 linhas.", inserted: "Campo inserido no editor. Confira a posição e salve o modelo.",
    updated: "Linhas atualizadas no modelo. Salve as alterações.", examples: "Campos existentes", noExisting: "Nenhum campo ainda",
  },
  "pt-PT": {
    title: "Campos preenchíveis do professor", help: "Defina quantas linhas aparecem no PDF em branco. Ao escrever no ecrã, o texto cresce e desloca o restante documento.",
    name: "Nome do campo", nameHint: "Ex.: Objetivos", lines: "Linhas para preenchimento manual", insert: "Inserir campo no editor",
    update: "Alterar linhas do campo existente", missing: "Este campo ainda não existe no modelo.", invalid: "Indique um nome válido e entre 1 e 12 linhas.",
    inserted: "Campo inserido no editor. Verifique a posição e guarde o modelo.", updated: "Linhas alteradas. Guarde o modelo.", examples: "Campos existentes", noExisting: "Nenhum campo ainda",
  },
  "en-US": {
    title: "Teacher fillable fields", help: "Choose the number of writing lines on the blank printable PDF. Digital entries grow naturally and push the next section down.",
    name: "Field name", nameHint: "e.g. Objectives", lines: "Lines for handwriting", insert: "Insert field in editor", update: "Update existing field lines",
    missing: "This field does not exist in the template.", invalid: "Enter a valid name and 1 to 12 lines.", inserted: "Field inserted. Review its position and save the template.",
    updated: "Lines updated. Save the template.", examples: "Existing fields", noExisting: "No fields yet",
  },
  "es-ES": {
    title: "Campos rellenables del profesor", help: "Elige cuántas líneas se mostrarán en el PDF en blanco. El texto digital crecerá y desplazará las secciones siguientes.",
    name: "Nombre del campo", nameHint: "Ej.: Objetivos", lines: "Líneas para escribir a mano", insert: "Insertar campo en el editor",
    update: "Cambiar líneas del campo existente", missing: "Este campo aún no existe en la plantilla.", invalid: "Introduce un nombre válido y de 1 a 12 líneas.",
    inserted: "Campo insertado. Revisa su posición y guarda la plantilla.", updated: "Líneas actualizadas. Guarda la plantilla.", examples: "Campos existentes", noExisting: "Aún no hay campos",
  },
  "fr-FR": {
    title: "Champs à remplir par l'enseignant", help: "Choisissez le nombre de lignes sur le PDF vierge. Le texte saisi s'étend naturellement et décale les sections suivantes.",
    name: "Nom du champ", nameHint: "Ex. : Objectifs", lines: "Lignes pour écriture manuelle", insert: "Insérer le champ dans l'éditeur",
    update: "Modifier les lignes du champ existant", missing: "Ce champ n'existe pas encore dans le modèle.", invalid: "Saisissez un nom valide et entre 1 et 12 lignes.",
    inserted: "Champ inséré. Vérifiez sa position et enregistrez le modèle.", updated: "Lignes modifiées. Enregistrez le modèle.", examples: "Champs existants", noExisting: "Aucun champ pour l'instant",
  },
} as const;

export default function ConfiguradorLinhasDocente({ tipo, contexto, conteudo, aoInserir, aoAlterar }: Props) {
  const locale = useLocale();
  const m = rotulos[locale as keyof typeof rotulos] ?? rotulos["pt-BR"];
  const [nome, setNome] = useState("");
  const [linhas, setLinhas] = useState(3);
  const [aviso, setAviso] = useState("");
  const campos = useMemo(() => camposModeloDocente(conteudo), [conteudo]);
  if (tipo !== "OUTRO" || !["DOCENTE_PLANO_AULA", "DOCENTE_RELATORIO", "DOCENTE_OUTRO"].includes(contexto.trim())) return null;
  const valido = nomeCampoDocenteValido(nome) && Number.isInteger(linhas) && linhas >= 1 && linhas <= 12;
  function inserir() {
    if (!valido) return setAviso(m.invalid);
    aoInserir(marcadorCampoDocente(nome, linhas));
    setAviso(m.inserted);
  }
  function atualizar() {
    if (!valido) return setAviso(m.invalid);
    const atualizado = atualizarLinhasCampoDocente(conteudo, nome, linhas);
    if (!atualizado.quantidade) return setAviso(m.missing);
    aoAlterar(atualizado.html);
    setAviso(m.updated);
  }
  return (
    <section className="pdoc-soft mb-4 space-y-3 rounded-xl border border-blue-300 bg-blue-50/60 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
      <h3 className="pdoc-label text-sm font-semibold">{m.title}</h3>
      <p className="pdoc-muted text-xs text-slate-600 dark:text-slate-300">{m.help}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <label className="pdoc-label block text-xs font-semibold">{m.name}
          <input list="phanyx-campos-docentes-existentes" className="pdoc-input mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" maxLength={120} value={nome} onChange={e=>{
            const digitado=e.target.value;
            const tag=digitado.trim().match(/^\{\{\s*campo:([^{}|]{1,80})(?:\s*\|\s*linhas\s*:\s*(\d{1,2}))?\s*\}\}$/iu);
            setNome(tag ? tag[1].trim() : digitado);
            if(tag?.[2]) {const qtd=Number(tag[2]);if(qtd>=1&&qtd<=12) setLinhas(qtd);}
            setAviso("");
          }} placeholder={m.nameHint}/>
          <datalist id="phanyx-campos-docentes-existentes">{campos.map(c=><option key={c} value={c}/>)}</datalist>
        </label>
        <label className="pdoc-label block text-xs font-semibold">{m.lines}
          <select className="pdoc-input mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white" value={linhas} onChange={e=>setLinhas(Number(e.target.value))}>
            {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!valido} onClick={inserir} className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{m.insert}</button>
        <button type="button" disabled={!valido} onClick={atualizar} className="rounded-lg border border-blue-600 px-3 py-2 text-xs font-semibold text-blue-800 dark:text-blue-200 disabled:opacity-50">{m.update}</button>
      </div>
      <p className="pdoc-muted break-all font-mono text-[11px] text-slate-700 dark:text-slate-300">{valido ? marcadorCampoDocente(nome, linhas) : "{{campo:Objetivos|linhas:5}}"}</p>
      <p className="pdoc-muted text-xs text-slate-600 dark:text-slate-400">{m.examples}: {campos.length ? campos.join(", ") : m.noExisting}</p>
      {aviso && <p role="status" className="pdoc-label text-xs font-medium text-blue-900 dark:text-blue-200">{aviso}</p>}
    </section>
  );
}
