"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { GRUPOS_FONTES_CERTIFICADO, ESCRITAS_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";

const normalizarBusca = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
type GrupoFonte = keyof typeof GRUPOS_FONTES_CERTIFICADO;

export default function SeletorFonteCertificado({ value, onChange, labels }: {
  value: string;
  onChange: (fonte: string) => void;
  labels: { search: string; hint: string; system: string; calligraphy: string; handwriting: string; serif: string; sans: string; display: string };
}) {
  const tr = useTranslations("AdminCertificateEditor.fonts");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<GrupoFonte | "">("");
  const categorias = Object.keys(GRUPOS_FONTES_CERTIFICADO) as GrupoFonte[];
  const nomesGrupos: Record<GrupoFonte, string> = {
    ...labels, ink: tr("ink"), festive: tr("festive"), greek: tr("greek"), arabic: tr("arabic"), retro: tr("retro"),
  };
  const termo = normalizarBusca(busca);
  const grupos = useMemo(() => Object.entries(GRUPOS_FONTES_CERTIFICADO).map(([chave, fontes]) => ({
    chave: chave as GrupoFonte,
    fontes: fontes.filter(fonte => normalizarBusca(fonte).includes(termo)),
  })), [termo]);
  // A busca tambem reconhece a categoria traduzida: pena, nanquim, Natal, arabe...
  const visiveis = grupos.filter(grupo => !categoria || grupo.chave === categoria).map(grupo => ({
    ...grupo,
    fontes: termo && normalizarBusca(nomesGrupos[grupo.chave]).includes(termo)
      ? GRUPOS_FONTES_CERTIFICADO[grupo.chave] : grupo.fontes,
  })).filter(grupo => grupo.fontes.length);
  const selecaoVisivel = visiveis.some(grupo => (grupo.fontes as readonly string[]).includes(value));
  const escrita = ESCRITAS_FONTES_CERTIFICADO[value];
  const amostra = escrita === "arabic" ? "الخط العربي" : escrita === "greek" ? "Ελληνική γραφή" : tr("sampleText");

  return <div className="space-y-2">
    <select value={categoria} onChange={evento => setCategoria(evento.target.value as GrupoFonte | "")} aria-label={tr("category")}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800">
      <option value="">{tr("allCategories")}</option>
      {categorias.map(chave => <option key={chave} value={chave}>{nomesGrupos[chave]}</option>)}
    </select>
    <input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder={labels.search} aria-label={labels.search}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800" />
    <select value={value} onChange={evento => onChange(evento.target.value)} aria-label={tr("chooseFont")}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800">
      {!selecaoVisivel && <option value={value}>{value}</option>}
      {visiveis.map(grupo => <optgroup key={grupo.chave} label={nomesGrupos[grupo.chave]}>
        {grupo.fontes.map(fonte => <option key={fonte} value={fonte}>{fonte}</option>)}
      </optgroup>)}
    </select>
    {!visiveis.length && <p className="text-xs text-slate-600 dark:text-slate-300" role="status">{tr("noResults")}</p>}
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900" aria-label={tr("sampleLabel")}>
      <p className="text-xs text-slate-500">{tr("sampleLabel")} · {value}</p>
      <p dir={escrita === "arabic" ? "rtl" : "ltr"} lang={escrita === "arabic" ? "ar" : escrita === "greek" ? "el" : undefined}
        className="overflow-x-auto whitespace-nowrap px-2 py-3 text-[32px] leading-loose" style={{ fontFamily: `"${value.replace(/["\\]/g, "")}"` }}>
        {amostra}
      </p>
    </div>
    {(categoria === "greek" || categoria === "arabic" || escrita) && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{tr("scriptHint")}</p>}
    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{labels.hint}</p>
  </div>;
}
