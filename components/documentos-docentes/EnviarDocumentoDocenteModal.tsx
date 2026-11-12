"use client";

import { useEffect, useRef, useState } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import { emailDestinoDocente, type ResultadoEmailDocente, type TipoDestinoDocente } from "@/lib/documentos-docentes/destinos-email";
import { textosGestaoDocente } from "@/lib/documentos-docentes/i18n-gestao";

export type DocumentoParaEnviar = { id: number; titulo: string; versao: number };
type Destino = { id: number; nome: string; email?: string };

const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-600 dark:bg-slate-900";
const modos: TipoDestinoDocente[] = ["EMAIL", "USUARIO", "DEPARTAMENTO"];

export default function EnviarDocumentoDocenteModal({
  documento, locale, onFechar, onResultado,
}: {
  documento: DocumentoParaEnviar;
  locale: string;
  onFechar: () => void;
  onResultado: () => void;
}) {
  const t = textosGestaoDocente(locale);
  const [tipo, setTipo] = useState<TipoDestinoDocente>("EMAIL");
  const [email, setEmail] = useState("");
  const [busca, setBusca] = useState("");
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [selecionado, setSelecionado] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erroBusca, setErroBusca] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState<ResultadoEmailDocente | null>(null);
  const operacao = useRef<string | null>(null);
  const bloqueado = useRef(false);
  const destino = tipo === "EMAIL" ? emailDestinoDocente(email) : Number(selecionado);
  const labels = { EMAIL: t.email, USUARIO: t.usuario, DEPARTAMENTO: t.departamento };

  useEffect(() => {
    if (tipo === "EMAIL") return;
    const controle = new AbortController();
    setBuscando(true);
    setErroBusca("");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/documentos-docentes/destinatarios?${new URLSearchParams({ tipo, q: busca })}`, {
          cache: "no-store",
          signal: controle.signal,
        });
        if (!res.ok) throw new Error(t.falha);
        const dados: { destinos: Destino[] } = await res.json();
        if (!controle.signal.aborted) setDestinos(dados.destinos);
      } catch {
        if (!controle.signal.aborted) setErroBusca(t.falha);
      } finally {
        if (!controle.signal.aborted) setBuscando(false);
      }
    }, 200);
    return () => { window.clearTimeout(timer); controle.abort(); };
  }, [busca, tipo, t.falha]);

  function alterarDestino() {
    operacao.current = null;
    setErro("");
  }

  async function enviar() {
    if (!destino || bloqueado.current || resultado) return;
    bloqueado.current = true;
    setEnviando(true);
    setErro("");
    try {
      operacao.current ??= crypto.randomUUID();
      const res = await fetch(`/api/documentos-docentes/${documento.id}/envios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, destino, versao: documento.versao, operacao: operacao.current }),
      });
      const dados = await res.json();
      if (!res.ok) throw new Error(dados.error ?? t.falha);
      setResultado(dados);
      onResultado();
    } catch (e) {
      setErro(e instanceof Error ? e.message : t.falha);
    } finally {
      bloqueado.current = false;
      setEnviando(false);
    }
  }

  return (
    <PhanyxConfirmModal
      aberto
      titulo={t.enviarPdf}
      mensagem={`${documento.titulo} · ${t.versao} ${documento.versao}`}
      textoConfirmar={t.enviar}
      textoCancelar={resultado ? t.fechar : t.cancelar}
      textoCarregando={t.enviando}
      carregando={enviando}
      mostrarConfirmar={!resultado}
      desabilitarConfirmar={!destino}
      onConfirmar={() => void enviar()}
      onCancelar={onFechar}
    >
      {resultado ? <div role="status" className="space-y-1 text-sm">
        {resultado.estado === "aceito" ? <>
          <p>{t.aceitos} · {resultado.aceitos}</p>
          {resultado.recusados > 0 && <p>{t.recusados} · {resultado.recusados}</p>}
        </> : <p>{t[resultado.estado]}</p>}
      </div> : <fieldset disabled={enviando} className="space-y-3">
        <div className="space-y-1 text-sm">
          <label htmlFor="documento-docente-tipo-destino">{t.modo}</label>
          <select id="documento-docente-tipo-destino" className={campo} value={tipo} onChange={e => {
            alterarDestino();
            setTipo(e.target.value as TipoDestinoDocente);
            setBusca("");
            setDestinos([]);
            setSelecionado("");
          }}>
            {modos.map(modo => <option key={modo} value={modo}>{labels[modo]}</option>)}
          </select>
        </div>
        {tipo === "EMAIL" ? <label className="block space-y-1 text-sm">
          <span>E-mail</span>
          <input className={campo} type="email" maxLength={254} autoComplete="off" value={email}
            onChange={e => { alterarDestino(); setEmail(e.target.value); }} />
        </label> : <>
          <label className="block space-y-1 text-sm">
            <span>{tipo === "USUARIO" ? t.buscarUsuario : t.buscarDepartamento}</span>
            <input className={campo} type="search" maxLength={120} value={busca} onChange={e => {
              alterarDestino();
              setBusca(e.target.value);
              setDestinos([]);
              setSelecionado("");
            }} />
          </label>
          <select aria-label={t.selecionar} className={campo} value={selecionado} disabled={buscando || !destinos.length}
            onChange={e => { alterarDestino(); setSelecionado(e.target.value); }}>
            <option value="">{t.selecionar}</option>
            {destinos.map(item => <option key={item.id} value={item.id}>
              {item.nome} (#{item.id}){item.email ? ` — ${item.email}` : ""}
            </option>)}
          </select>
          {(buscando || erroBusca || !destinos.length) && <p role="status" className="text-xs">{buscando ? t.carregando : erroBusca || t.vazio}</p>}
        </>}
        {tipo === "DEPARTAMENTO" && <p className="text-xs">{t.departamentoAjuda}</p>}
        <p className="text-xs">{t.pdfAjuda}</p>
        {erro && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>}
      </fieldset>}
    </PhanyxConfirmModal>
  );
}
