"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import styles from "./RequisitosCursos.module.css";
export type CursoOpcaoRequisito = { id: number; nome: string; ativo?: boolean; excluidoEm?: string | null };
export default function CamposRequisitosCursos({ cursos, ids, onChange, cursoAtualId, disabled = false }: {
  cursos: CursoOpcaoRequisito[]; ids: number[]; onChange: (ids: number[]) => void; cursoAtualId?: number; disabled?: boolean;
}) {
  const t = useTranslations("CourseRequirements");
  const [busca, setBusca] = useState("");
  const opcoes = cursos.filter(c => c.id !== cursoAtualId && !c.excluidoEm && (c.ativo !== false || ids.includes(c.id)) && c.nome.toLocaleLowerCase().includes(busca.toLocaleLowerCase()));
  return <fieldset disabled={disabled} className={`${styles.panel} rounded-xl border p-4 md:col-span-2`}>
    <legend className="px-1 font-semibold">{t("title")}</legend>
    <details open={ids.length > 0}>
    <summary className="cursor-pointer text-sm font-semibold">{t("configure")}</summary>
    <p className="my-3 text-sm">{t("help")}</p>
    <label className="block text-sm">{t("search")}<input type="search" value={busca} onChange={e => setBusca(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
    <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
      {opcoes.map(c => <label key={c.id} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
        <input type="checkbox" checked={ids.includes(c.id)} onChange={e => onChange(e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} />
        <span>{c.nome}{c.ativo === false ? ` · ${t("inactive")}` : ""}</span>
      </label>)}
      {!opcoes.length && <p className="text-sm">{t("none")}</p>}
    </div>
    <p className="mt-3 text-xs">{t("selected", { count: ids.length })}</p>
    </details>
  </fieldset>;
}
