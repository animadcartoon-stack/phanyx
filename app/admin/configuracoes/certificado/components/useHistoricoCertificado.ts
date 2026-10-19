import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { criarHistoricoCertificado } from "./historicoCertificado";

export default function useHistoricoCertificado<T extends { id: number }>() {
  const estadoRef = useRef<ReturnType<typeof criarHistoricoCertificado<T>> | null>(null);
  if (!estadoRef.current) estadoRef.current = criarHistoricoCertificado<T>([]);
  const estado = estadoRef.current;
  const campos = useSyncExternalStore(estado.subscribe, estado.getSnapshot, estado.getSnapshot);
  const gestoRef = useRef<object | null>(null);
  const campoRef = useRef<EventTarget | null>(null);
  const loteRef = useRef<object | null>(null);
  const ponteiroRef = useRef(false);

  const registrarHistoricoAntesDaAcao = useCallback(() => {
    // O registro e feito na primeira alteracao real, sem etapas vazias.
    if (!gestoRef.current && !loteRef.current) {
      const lote = {};
      loteRef.current = lote;
      queueMicrotask(() => { if (loteRef.current === lote) loteRef.current = null; });
    }
  }, []);

  const setCampos = useCallback((atualizador: T[] | ((prev: T[]) => T[])) => {
    registrarHistoricoAntesDaAcao();
    estado.alterar(atualizador, gestoRef.current || loteRef.current || {});
  }, [estado, registrarHistoricoAntesDaAcao]);

  const encerrarAcao = useCallback(() => {
    gestoRef.current = null;
    loteRef.current = null;
    campoRef.current = null;
    ponteiroRef.current = false;
  }, []);
  const desfazer = useCallback(() => { encerrarAcao(); estado.desfazer(); }, [estado, encerrarAcao]);
  const refazer = useCallback(() => { encerrarAcao(); estado.refazer(); }, [estado, encerrarAcao]);
  const limparHistorico = useCallback(() => { encerrarAcao(); estado.limpar(); }, [estado, encerrarAcao]);

  useEffect(() => {
    const ehCampo = (alvo: EventTarget | null) => alvo instanceof HTMLElement &&
      (alvo.matches("input, textarea, select") || alvo.isContentEditable);
    function iniciar(evento: Event) {
      if (evento.type === "mousedown" && ponteiroRef.current) return;
      // Confirma o numero antes de iniciar outro gesto e antes de trocar a forma.
      const ativo = document.activeElement;
      if (ativo instanceof HTMLElement && ativo.matches("input[data-numero-editavel]") && ativo !== evento.target) {
        flushSync(() => ativo.blur());
      }
      // Focar novamente o mesmo controle mantem a edicao em uma etapa.
      if (campoRef.current !== evento.target || !gestoRef.current) gestoRef.current = {};
      campoRef.current = ehCampo(evento.target) ? evento.target : null;
      ponteiroRef.current = true;
    }
    function focar(evento: Event) {
      if (!ehCampo(evento.target)) return;
      if (campoRef.current !== evento.target) gestoRef.current = {};
      campoRef.current = evento.target;
    }
    function desfocar() {
      if (ponteiroRef.current) campoRef.current = null;
      else encerrarAcao();
    }
    function editar(evento: Event) {
      if (!ehCampo(evento.target)) return;
      if (!gestoRef.current) gestoRef.current = {};
      campoRef.current = evento.target;
    }
    function finalizar() {
      ponteiroRef.current = false;
      const gesto = gestoRef.current;
      // O click ocorre depois de mouseup/pointerup e pertence ao mesmo gesto.
      queueMicrotask(() => {
        if (!campoRef.current && gestoRef.current === gesto) gestoRef.current = null;
      });
    }
    function clicar(evento: Event) {
      if (!ehCampo(evento.target) && !ponteiroRef.current && !gestoRef.current) {
        const gesto = {};
        gestoRef.current = gesto;
        queueMicrotask(() => { if (gestoRef.current === gesto) gestoRef.current = null; });
      }
    }
    function teclado(evento: KeyboardEvent) {
      if (ehCampo(evento.target) || evento.repeat) return;
      gestoRef.current = {};
      finalizar();
    }
    window.addEventListener("pointerdown", iniciar, true);
    window.addEventListener("mousedown", iniciar, true);
    window.addEventListener("focusin", focar, true);
    window.addEventListener("focusout", desfocar, true);
    window.addEventListener("input", editar, true);
    window.addEventListener("change", editar, true);
    window.addEventListener("pointerup", finalizar, true);
    window.addEventListener("mouseup", finalizar, true);
    window.addEventListener("pointercancel", encerrarAcao, true);
    window.addEventListener("blur", encerrarAcao);
    window.addEventListener("click", clicar, true);
    window.addEventListener("keydown", teclado, true);
    return () => {
      window.removeEventListener("pointerdown", iniciar, true);
      window.removeEventListener("mousedown", iniciar, true);
      window.removeEventListener("focusin", focar, true);
      window.removeEventListener("focusout", desfocar, true);
      window.removeEventListener("input", editar, true);
      window.removeEventListener("change", editar, true);
      window.removeEventListener("pointerup", finalizar, true);
      window.removeEventListener("mouseup", finalizar, true);
      window.removeEventListener("pointercancel", encerrarAcao, true);
      window.removeEventListener("blur", encerrarAcao);
      window.removeEventListener("click", clicar, true);
      window.removeEventListener("keydown", teclado, true);
    };
  }, [encerrarAcao]);

  return { campos, setCampos, registrarHistoricoAntesDaAcao, limparHistorico, desfazer, refazer };
}
