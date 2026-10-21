"use client";
import CampoNumeroEditavel from "./CampoNumeroEditavel";
import { ehVariavelSimplesCertificado, abreviarVariavelCertificado, type AmostrasVariaveisCertificado } from "@/lib/certificados/variaveisTextoCertificado";
import { useAmostraVariavelCertificado } from "@/components/certificados/TextoVariavelCertificado";
import type { TextoCertificado } from "@/lib/certificados/textoCertificado";

export default function ControlesVariavelCertificado({ campo, amostras, labels, onPreview, onCommit, onCancel, onAbreviar }: {
  campo: TextoCertificado & { id: number }; amostras: AmostrasVariaveisCertificado;
  labels: { width: string; height: string; format: string; full: string; abbreviated: string; testText: string; hint: string };
  onPreview: (chave: "largura" | "altura", valor: number) => void;
  onCommit: () => void; onCancel: () => void; onAbreviar: (valor: boolean) => void;
}) {
  const amostra = useAmostraVariavelCertificado(amostras, campo.id);
  const simples = ehVariavelSimplesCertificado(campo);
  return <section className="space-y-3 rounded-xl border border-slate-200 p-3" data-controles-variavel={campo.tipo}>
    <div className="grid grid-cols-2 gap-2">
      {(["largura", "altura"] as const).map(chave => <label key={chave} className="block text-xs text-slate-600">
        {chave === "largura" ? labels.width : labels.height}
        <CampoNumeroEditavel value={campo[chave] || (chave === "largura" ? 220 : 40)} min={1}
          aria-label={chave === "largura" ? labels.width : labels.height}
          onPreview={v => onPreview(chave, v)} onValueChange={() => onCommit()} onCancel={onCancel}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
      </label>)}
    </div>
    {simples && <>
      <label className="block text-xs font-medium text-slate-600">{labels.format}
        <select value={abreviarVariavelCertificado(campo) ? "abreviado" : "completo"} onChange={e => onAbreviar(e.target.value === "abreviado")}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900">
          <option value="completo">{labels.full}</option><option value="abreviado">{labels.abbreviated}</option>
        </select>
      </label>
      <label className="block text-xs font-medium text-slate-600">{labels.testText}
        <input type="text" value={amostra} onChange={e => amostras.set(campo.id, e.target.value)}
          className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900" />
      </label>
      <p className="text-xs text-slate-500">{labels.hint}</p>
    </>}
  </section>;
}
