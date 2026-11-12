"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { formasPdf, graficosPdf, lerDadosGraficoPdf, simbolosPdf, type OperacaoVisualPdf } from "@/lib/documentos-docentes/operacoes-visuais-pdf";
import { textosEdicaoVisualPdf } from "@/lib/documentos-docentes/i18n-edicao-visual-pdf";
import { botaoLeitorPdf } from "./LeitorPdfDocumento";

const campo = "w-full rounded-lg border border-slate-300 bg-transparent px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-900";
const fontes = ["Arial", "Calibri", "Verdana", "Tahoma", "Georgia", "Times New Roman", "Courier New"];

export default function FerramentaVisualPdf({ modo, temArea, ocupado, onAplicar, onCancelar }: {
  modo: OperacaoVisualPdf["tipo"];
  temArea: boolean;
  ocupado: boolean;
  onAplicar: (op: OperacaoVisualPdf) => void;
  onCancelar: () => void;
}) {
  const t = textosEdicaoVisualPdf(useLocale());
  const [forma, setForma] = useState<(typeof formasPdf)[number]>("retangulo");
  const [grafico, setGrafico] = useState<(typeof graficosPdf)[number]>("colunas");
  const [dadosGrafico, setDadosGrafico] = useState("");
  const [simbolo, setSimbolo] = useState("✓");
  const [texto, setTexto] = useState("");
  const [cor, setCor] = useState("#0f172a");
  const [fundo, setFundo] = useState("#ffffff");
  const [espessura, setEspessura] = useState("2");
  const [preencher, setPreencher] = useState(false);
  const [tamanho, setTamanho] = useState("12");
  const [fonte, setFonte] = useState(fontes[0]);
  const [negrito, setNegrito] = useState(false);
  const [italico, setItalico] = useState(false);

  const dados = lerDadosGraficoPdf(dadosGrafico);
  const pt = Number(tamanho);
  const traco = Number(espessura);
  let operacao: OperacaoVisualPdf | null = null;
  switch (modo) {
    case "remover": operacao = { tipo: modo, fundo }; break;
    case "texto":
      if (texto.trim() && pt >= 6 && pt <= 72) operacao = { tipo: modo, texto, fundo, cor, fonte, tamanho: pt, negrito, italico };
      break;
    case "forma":
      if (traco >= 0.5 && traco <= 24) operacao = { tipo: modo, forma, cor, espessura: traco, preencher, fundo };
      break;
    case "simbolo":
      if (simbolo.trim()) operacao = { tipo: modo, simbolo: simbolo.trim(), cor };
      break;
    case "grafico":
      if (dados) operacao = { tipo: modo, grafico, dados };
      break;
  }

  return (
    <fieldset disabled={ocupado} className="space-y-3 rounded-lg border border-blue-300 p-3 dark:border-blue-700">
      <legend className="px-1 text-sm font-semibold">{modo === "texto" ? t.editar : t[modo]}</legend>
      <p role="status" className="text-sm">{temArea ? t.areaPronta : t.selecionar}</p>
      {(modo === "remover" || modo === "texto") && <p className="text-xs">{t.retocar}</p>}

      {modo === "forma" && <>
        <label className="block text-sm">{t.forma}
          <select className={campo} value={forma} onChange={e => setForma(e.target.value as typeof forma)}>
            {formasPdf.map((id, i) => <option key={id} value={id}>{t.formas[i]}</option>)}
          </select>
        </label>
        <label className="block text-sm">{t.espessura}
          <input className={campo} type="number" min={0.5} max={24} step={0.5} value={espessura} onChange={e => setEspessura(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={preencher} onChange={e => setPreencher(e.target.checked)} />{t.preencher}
        </label>
      </>}

      {modo === "simbolo" && <>
        <div role="group" aria-label={t.simbolo} className="grid max-h-40 grid-cols-7 gap-1 overflow-auto">
          {simbolosPdf.map(item => <button key={item} type="button" aria-pressed={simbolo === item} className="min-h-8 rounded border border-slate-300 bg-white text-slate-900 aria-pressed:border-blue-700 aria-pressed:bg-blue-100" onClick={() => setSimbolo(item)}>{item}</button>)}
        </div>
        <label className="block text-sm">{t.outroSimbolo}
          <input className={campo} maxLength={32} value={simbolo} onChange={e => setSimbolo(e.target.value)} />
        </label>
      </>}

      {modo === "grafico" && <>
        <label className="block text-sm">{t.grafico}
          <select className={campo} value={grafico} onChange={e => setGrafico(e.target.value as typeof grafico)}>
            {graficosPdf.map((id, i) => <option key={id} value={id}>{t.graficos[i]}</option>)}
          </select>
        </label>
        <label className="block text-sm">{t.dados}
          <textarea className={campo} rows={4} maxLength={700} value={dadosGrafico} placeholder={t.dadosExemplo} onChange={e => setDadosGrafico(e.target.value)} />
          <span className="text-xs">{t.dadosAjuda}</span>
        </label>
      </>}

      {modo === "texto" && <>
        <label className="block text-sm">{t.novoTexto}
          <textarea className={campo} rows={3} maxLength={1000} value={texto} onChange={e => setTexto(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm">{t.fonte}
            <select className={campo} value={fonte} onChange={e => setFonte(e.target.value)}>
              {fontes.map(item => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm">{t.tamanho}
            <input className={campo} type="number" min={6} max={72} value={tamanho} onChange={e => setTamanho(e.target.value)} />
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={negrito} onChange={e => setNegrito(e.target.checked)} />{t.negrito}
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={italico} onChange={e => setItalico(e.target.checked)} />{t.italico}
          </label>
        </div>
      </>}

      <div className="flex flex-wrap gap-3">
        {modo !== "remover" && modo !== "grafico" && <label className="flex items-center gap-1 text-sm">{t.cor}
          <input type="color" className="h-8 w-10" value={cor} onChange={e => setCor(e.target.value)} />
        </label>}
        {(modo === "remover" || modo === "texto" || (modo === "forma" && preencher)) && <label className="flex items-center gap-1 text-sm">{t.fundo}
          <input type="color" className="h-8 w-10" value={fundo} onChange={e => setFundo(e.target.value)} />
        </label>}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!operacao || !temArea} className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
          onClick={() => { if (operacao) onAplicar(operacao); }}>{t.aplicar}</button>
        <button type="button" className={botaoLeitorPdf} onClick={onCancelar}>{t.cancelar}</button>
      </div>
    </fieldset>
  );
}
