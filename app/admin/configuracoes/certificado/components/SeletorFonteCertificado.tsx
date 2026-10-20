"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GRUPOS_FONTES_CERTIFICADO, ESCRITAS_FONTES_CERTIFICADO } from "@/lib/certificados/fontesCertificado";
import useAmostrasFontes from "./useAmostrasFontes";

const normalizarBusca = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const familiaCss = (nome: string) => `"${nome.replace(/["\\]/g, "")}"`;
const ALTURA_LINHA = 86;
const ALTURA_LISTA = 300;
type GrupoFonte = keyof typeof GRUPOS_FONTES_CERTIFICADO;

export default function SeletorFonteCertificado({ value, onChange, labels, textoAmostra = "" }: {
  value: string | null;
  onChange: (fonte: string) => void;
  labels: { search: string; hint: string; system: string; calligraphy: string; handwriting: string; serif: string; sans: string; display: string };
  textoAmostra?: string;
}) {
  const tr = useTranslations("AdminCertificateEditor.fonts");
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<GrupoFonte | "">("");
  const [aberto, setAberto] = useState(false);
  const [rolagem, setRolagem] = useState(0);
  const [ativo, setAtivo] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const categorias = Object.keys(GRUPOS_FONTES_CERTIFICADO) as GrupoFonte[];
  const nomesGrupos = useMemo<Record<GrupoFonte, string>>(() => ({
    ...labels, ink: tr("ink"), festive: tr("festive"), greek: tr("greek"), arabic: tr("arabic"), retro: tr("retro"),
  }), [labels, tr]);
  const termo = normalizarBusca(busca);
  const opcoes = useMemo(() => Object.entries(GRUPOS_FONTES_CERTIFICADO).flatMap(([chave, fontes]) => {
    const grupo = chave as GrupoFonte;
    if (categoria && grupo !== categoria) return [];
    return fontes.filter(fonte => normalizarBusca(fonte).includes(termo) || normalizarBusca(nomesGrupos[grupo]).includes(termo)).map(fonte => ({ fonte, grupo }));
  }), [categoria, termo, nomesGrupos]);
  const inicio = Math.max(0, Math.min(Math.floor(rolagem / ALTURA_LINHA) - 2, Math.max(0, opcoes.length - 1)));
  const visiveis = aberto ? opcoes.slice(inicio, inicio + Math.ceil(ALTURA_LISTA / ALTURA_LINHA) + 4) : [];
  const amostra = textoAmostra.replace(/\s+/g, " ").trim().slice(0, 48) || tr("sampleText");
  const amostraDe = (nome: string) => ESCRITAS_FONTES_CERTIFICADO[nome] === "arabic" ? "الخط العربي" : ESCRITAS_FONTES_CERTIFICADO[nome] === "greek" ? "Ελληνική γραφή" : amostra;
  const estadoFonte = useAmostrasFontes(visiveis.map(item => item.fonte), amostra, tentativa);
  const temErro = visiveis.some(item => estadoFonte(item.fonte) === "erro");

  useEffect(() => {
    if (!aberto) return;
    function fecharFora(evento: PointerEvent) {
      if (!rootRef.current?.contains(evento.target as Node)) setAberto(false);
    }
    document.addEventListener("pointerdown", fecharFora, true);
    return () => document.removeEventListener("pointerdown", fecharFora, true);
  }, [aberto]);

  function rolarPara(indice: number) {
    const proximo = Math.max(0, Math.min(opcoes.length - 1, indice));
    setAtivo(proximo);
    const lista = listaRef.current;
    const topo = proximo * ALTURA_LINHA;
    const altura = lista?.clientHeight || ALTURA_LISTA;
    if (lista && (topo < lista.scrollTop || topo + ALTURA_LINHA > lista.scrollTop + altura)) {
      lista.scrollTop = Math.max(0, topo - Math.max(0, altura - ALTURA_LINHA));
      setRolagem(lista.scrollTop);
    }
  }
  function abrir() {
    const indice = Math.max(0, opcoes.findIndex(item => item.fonte === value));
    setAtivo(indice);
    const topo = Math.max(0, indice * ALTURA_LINHA - ALTURA_LINHA);
    setRolagem(topo);
    setAberto(true);
    window.requestAnimationFrame(() => { if (listaRef.current) { listaRef.current.scrollTop = topo; listaRef.current.focus({ preventScroll: true }); } });
  }
  function escolher(nome: string) {
    if (estadoFonte(nome) !== "pronto") return;
    onChange(nome);
    setAberto(false);
    botaoRef.current?.focus({ preventScroll: true });
  }
  function reiniciarFiltro() {
    setRolagem(0);setAtivo(0);
    if (listaRef.current) listaRef.current.scrollTop = 0;
  }

  return <div ref={rootRef} className="space-y-2" onKeyDown={evento => {
    if (evento.key === "Escape" && aberto) { evento.preventDefault();evento.stopPropagation();setAberto(false);botaoRef.current?.focus({ preventScroll: true }); }
  }}>
    <select value={categoria} onChange={evento => { setCategoria(evento.target.value as GrupoFonte | "");reiniciarFiltro(); }} aria-label={tr("category")}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800">
      <option value="">{tr("allCategories")}</option>
      {categorias.map(chave => <option key={chave} value={chave}>{nomesGrupos[chave]}</option>)}
    </select>
    <input type="search" value={busca} onChange={evento => { setBusca(evento.target.value);reiniciarFiltro(); }} placeholder={labels.search} aria-label={labels.search}
      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800" />
    <button ref={botaoRef} type="button" aria-label={tr("chooseFont")} aria-haspopup="listbox" aria-expanded={aberto} aria-controls={aberto ? id : undefined}
      onMouseDown={evento => evento.preventDefault()} onClick={() => aberto ? setAberto(false) : abrir()}
      onKeyDown={evento => { if (evento.key === "ArrowDown" || evento.key === "ArrowUp") { evento.preventDefault();abrir(); } }}
      className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-3 py-2 text-left text-slate-900">
      <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontFamily: value ? familiaCss(value) : undefined, fontSize: value ? 24 : 14, lineHeight: "1.8" }}>{value || tr("mixedFonts")}</span>
      <span aria-hidden="true" className="ml-2 text-xs">▾</span>
    </button>
    {aberto && <>
      <p className="text-xs text-slate-500 dark:text-slate-400">{tr("visualListHint")}</p>
      <div ref={listaRef} id={id} role="listbox" tabIndex={0} aria-label={tr("chooseFont")}
        aria-activedescendant={ativo >= inicio && ativo < inicio + visiveis.length ? `${id}-${ativo}` : undefined}
        className="overflow-y-auto rounded-xl border border-slate-300 bg-white text-slate-900" style={{ height: ALTURA_LISTA, maxHeight: "40vh", overflowAnchor: "none", overscrollBehaviorY: "contain", contain: "layout paint", scrollbarGutter: "stable" }}
        onScroll={evento => setRolagem(evento.currentTarget.scrollTop)}
        onKeyDown={evento => {
          if (["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "].includes(evento.key)) {
            evento.preventDefault();evento.stopPropagation();
            if (evento.key === "ArrowDown") rolarPara(ativo + 1);
            else if (evento.key === "ArrowUp") rolarPara(ativo - 1);
            else if (evento.key === "Home") rolarPara(0);
            else if (evento.key === "End") rolarPara(opcoes.length - 1);
            else if (opcoes[ativo]) escolher(opcoes[ativo].fonte);
          }
        }}>
        {opcoes.length ? <div style={{ height: opcoes.length * ALTURA_LINHA, position: "relative" }}>
          {visiveis.map((item, index) => {
            const estado = estadoFonte(item.fonte), escrita = ESCRITAS_FONTES_CERTIFICADO[item.fonte];
            return <button key={item.fonte} type="button" role="option" id={`${id}-${inicio + index}`} tabIndex={-1}
              aria-selected={value === item.fonte} aria-label={item.fonte} aria-disabled={estado !== "pronto"}
              onMouseDown={evento => evento.preventDefault()} onClick={() => escolher(item.fonte)}
              className={`absolute left-0 w-full border-b border-slate-100 px-3 text-left ${value === item.fonte ? "bg-blue-100" : inicio + index === ativo ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
              style={{ top: (inicio + index) * ALTURA_LINHA, height: ALTURA_LINHA }}>
              <span className="block truncate text-[11px] leading-5 text-slate-600">{item.fonte} · {nomesGrupos[item.grupo]}</span>
              {estado === "pronto" ? <span data-amostra-fonte={item.fonte} dir={escrita === "arabic" ? "rtl" : "ltr"}
                lang={escrita === "arabic" ? "ar" : escrita === "greek" ? "el" : undefined}
                className="block overflow-x-auto whitespace-nowrap px-2 text-[28px] leading-[56px]" style={{ fontFamily: familiaCss(item.fonte), fontWeight: 400, fontStyle: "normal" }}>{amostraDe(item.fonte)}</span>
                : <span className="block text-xs leading-[56px] text-slate-500">{tr(estado === "erro" ? "fontLoadError" : "loadingSamples")}</span>}
            </button>;
          })}
        </div> : <p className="p-4 text-sm text-slate-600" role="status">{tr("noResults")}</p>}
      </div>
      {temErro && <button type="button" onMouseDown={evento => evento.preventDefault()} onClick={() => setTentativa(valor => valor + 1)} className="text-xs text-blue-700 underline dark:text-blue-300">{tr("retrySamples")}</button>}
    </>}
    {(categoria === "greek" || categoria === "arabic") && <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{tr("scriptHint")}</p>}
    <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{labels.hint}</p>
  </div>;
}
