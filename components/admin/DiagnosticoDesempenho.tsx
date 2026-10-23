"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { caminhoDiagnostico, criarRegistroDesempenho } from "@/lib/diagnostico-desempenho";

/** Ativado somente por ?diagnostico=desempenho; o relatório permanece nesta aba. */
export default function DiagnosticoDesempenho() {
  const pathname = usePathname();
  const registro = useRef(criarRegistroDesempenho());
  const parar = useRef<() => void>(() => {});
  const [encerrado, setEncerrado] = useState(false);
  const suportados = useRef<string[]>([]);

  useEffect(() => {
    const observadores: PerformanceObserver[] = [];
    const numero = (valor: number) => Math.round(valor * 10) / 10;
    function observar(tipo: string, callback: (entry: PerformanceEntry) => void) {
      if (!window.PerformanceObserver || !PerformanceObserver.supportedEntryTypes.includes(tipo)) return;
      const observer = new PerformanceObserver(lista => lista.getEntries().forEach(callback));
      try {
        observer.observe({ type: tipo, buffered: true, ...(tipo === "event" ? { durationThreshold: 40 } : {}) });
        observadores.push(observer);
        suportados.current.push(tipo);
      } catch { observer.disconnect(); }
    }
    observar("longtask", entry => registro.current.adicionar("tarefasLongas", {
      inicioMs: numero(entry.startTime), duracaoMs: numero(entry.duration),
    }));
    observar("event", entry => {
      const evento = entry as PerformanceEventTiming;
      registro.current.adicionar("interacoes", {
        tipo: evento.name, inicioMs: numero(evento.startTime), duracaoMs: numero(evento.duration),
        esperaMs: numero(evento.processingStart - evento.startTime),
        processamentoMs: numero(evento.processingEnd - evento.processingStart),
      });
    });
    const recurso = (entry: PerformanceEntry) => {
      const item = entry as PerformanceResourceTiming;
      const caminho = caminhoDiagnostico(item.name, window.location.origin);
      if (!caminho) return;
      registro.current.adicionar("recursos", {
        caminho, tipo: item.initiatorType || entry.entryType,
        inicioMs: numero(item.startTime), duracaoMs: numero(item.duration),
        esperaRespostaMs: numero(Math.max(0, item.responseStart - item.requestStart)),
        downloadMs: numero(Math.max(0, item.responseEnd - item.responseStart)),
        bytesTransferidos: item.transferSize,
      });
    };
    observar("resource", recurso);
    observar("navigation", recurso);
    parar.current = () => { observadores.forEach(o => o.disconnect()); setEncerrado(true); };
    const timer = window.setTimeout(() => parar.current(), 3 * 60 * 1000);
    return () => { window.clearTimeout(timer); observadores.forEach(o => o.disconnect()); };
  }, []);

  useEffect(() => {
    if (encerrado) return;
    const caminho = caminhoDiagnostico(pathname, window.location.origin);
    if (caminho) registro.current.adicionar("navegacoes", { caminho, inicioMs: Math.round(performance.now()) });
  }, [pathname, encerrado]);

  function baixar() {
    parar.current();
    const conteudo = JSON.stringify({ ...registro.current.exportar(), suportados: suportados.current }, null, 2);
    const url = URL.createObjectURL(new Blob([conteudo], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "PHANYX-desempenho.json";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <details open className="fixed right-4 top-4 z-[10000000] max-w-sm rounded-xl border border-blue-500 bg-white p-4 text-sm text-slate-900 shadow-xl dark:bg-slate-900 dark:text-white">
    <summary className="cursor-pointer font-bold">{encerrado ? "Medição encerrada" : "Medindo o desempenho por até 3 minutos"}</summary>
    <p className="mt-1">Abra as páginas e menus que estão lentos. O relatório contém apenas tempos e caminhos técnicos, sem dados de formulários.</p>
    <button type="button" onClick={baixar} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 font-bold text-white">Baixar relatório de desempenho</button>
  </details>;
}
