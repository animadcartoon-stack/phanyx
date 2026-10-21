"use client";

import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent, type RefObject } from "react";

type Campo = { id: number; grupoId?: string | null; bloqueado?: boolean | null };
type Caixa = { x: number; y: number; largura: number; altura: number };
type Opcoes<T extends Campo> = {
  canvasRef: RefObject<HTMLDivElement>;
  caixaRef: RefObject<HTMLDivElement>;
  obterCampos: () => readonly T[];
  podeIniciar: () => boolean;
  aoAtivar: (ativa: boolean) => void;
  aoSelecionar: (ids: number[]) => void;
  aoSelecionarTexto: (editor: HTMLElement) => void;
};

/** O gesto pertence a janela ate soltar o mouse, mesmo passando sobre uma figura. */
export default function useSelecaoArrasteCertificado<T extends Campo>(opcoes: Opcoes<T>) {
  const contexto = useRef(opcoes);
  contexto.current = opcoes;
  const limparRef = useRef<(() => void) | null>(null);
  const ativaRef = useRef(false);
  const textoEmSelecaoRef = useRef(false);

  const cancelar = useCallback(() => { limparRef.current?.(); }, []);
  useEffect(() => cancelar, [cancelar]);

  const iniciarTexto = useCallback((editor: HTMLElement) => {
    cancelar();
    textoEmSelecaoRef.current = true;
    const doc = editor.ownerDocument, janela = doc.defaultView!;
    const limpar = () => {
      janela.removeEventListener("mouseup", finalizar, true);
      janela.removeEventListener("blur", limpar);
      textoEmSelecaoRef.current = false;
      limparRef.current = null;
    };
    const finalizar = () => {
      limpar();
      if (editor.isConnected) contexto.current.aoSelecionarTexto(editor);
    };
    limparRef.current = limpar;
    janela.addEventListener("mouseup", finalizar, true);
    janela.addEventListener("blur", limpar);
  }, [cancelar]);

  const iniciar = useCallback((evento: ReactMouseEvent<HTMLDivElement>) => {
    const atual = contexto.current, papel = atual.canvasRef.current;
    if (evento.button !== 0 || !papel || !atual.podeIniciar()) return;
    const alvo = evento.target as Element;
    if (alvo.closest("[data-campo-certificado-id], [data-cert-grupo-caixa], [contenteditable], input, textarea, select, button, a, [data-controle-ponto-forma]")) return;
    const superficie = evento.currentTarget;
    if (alvo !== superficie && alvo !== papel) return;
    cancelar();
    evento.preventDefault();
    evento.stopPropagation();
    const doc = papel.ownerDocument, janela = doc.defaultView!;
    papel.focus({ preventScroll: true });
    // Remove uma selecao antiga da pagina antes que ela vire um arraste nativo.
    doc.getSelection()?.removeAllRanges();
    const inicio = { x: evento.clientX, y: evento.clientY };
    const anteriores = new Map(atual.obterCampos().map(campo => [campo.id, campo]));
    const elementos = Array.from(papel.querySelectorAll<HTMLElement>("[data-campo-certificado-id]"));
    const caixas = elementos.flatMap(elemento => {
      const id = Number(elemento.dataset.campoSelecaoId || elemento.dataset.campoCertificadoId);
      const campo = anteriores.get(id);
      if (!campo || campo.bloqueado) return [];
      const rect = elemento.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? [{ id, rect }] : [];
    });
    const selecionar = (caixa: Caixa) => {
      const ids = new Set(caixas.filter(({ rect }) => rect.left <= caixa.x + caixa.largura && rect.right >= caixa.x && rect.top <= caixa.y + caixa.altura && rect.bottom >= caixa.y).map(item => item.id));
      const grupos = new Set([...ids].map(id => anteriores.get(id)?.grupoId).filter(Boolean));
      for (const { id } of caixas) {
        const campo = anteriores.get(id)!;
        if (campo.grupoId && grupos.has(campo.grupoId)) ids.add(id);
      }
      return [...ids];
    };
    const userSelect = papel.style.userSelect;
    papel.style.userSelect = "none";
    ativaRef.current = true;
    atual.aoAtivar(true);
    let arrastou = false;
    const desenhar = (ev: globalThis.MouseEvent) => {
      const caixa = { x: Math.min(inicio.x, ev.clientX), y: Math.min(inicio.y, ev.clientY), largura: Math.abs(ev.clientX - inicio.x), altura: Math.abs(ev.clientY - inicio.y) };
      arrastou ||= Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) >= 4;
      const elemento = contexto.current.caixaRef.current;
      if (elemento) {
        const rect = papel.getBoundingClientRect();
        const escalaX = rect.width / papel.offsetWidth || 1, escalaY = rect.height / papel.offsetHeight || 1;
        Object.assign(elemento.style, { left: `${(caixa.x - rect.left) / escalaX}px`, top: `${(caixa.y - rect.top) / escalaY}px`, width: `${caixa.largura / escalaX}px`, height: `${caixa.altura / escalaY}px` });
      }
      return caixa;
    };
    const mover = (ev: globalThis.MouseEvent) => { ev.preventDefault(); desenhar(ev); };
    const impedirArraste = (ev: Event) => ev.preventDefault();
    const limpar = () => {
      janela.removeEventListener("mousemove", mover, true);
      janela.removeEventListener("mouseup", finalizar, true);
      janela.removeEventListener("dragstart", impedirArraste, true);
      janela.removeEventListener("blur", limpar);
      janela.removeEventListener("keydown", teclado, true);
      papel.style.userSelect = userSelect;
      ativaRef.current = false;
      limparRef.current = null;
      contexto.current.aoAtivar(false);
    };
    const finalizar = (ev: globalThis.MouseEvent) => {
      const caixa = desenhar(ev);
      const ids = arrastou ? selecionar(caixa) : [];
      limpar();
      contexto.current.aoSelecionar(ids);
    };
    const teclado = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") { ev.preventDefault(); limpar(); }
    };
    limparRef.current = limpar;
    janela.addEventListener("mousemove", mover, true);
    janela.addEventListener("mouseup", finalizar, true);
    janela.addEventListener("dragstart", impedirArraste, true);
    janela.addEventListener("blur", limpar);
    janela.addEventListener("keydown", teclado, true);
  }, [cancelar]);

  return { iniciar, iniciarTexto, cancelar, ativaRef, textoEmSelecaoRef };
}
