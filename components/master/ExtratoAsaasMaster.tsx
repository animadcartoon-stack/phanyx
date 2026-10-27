"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { csvExtrato, hojeExtrato, periodoExtrato, type ExtratoAsaas, type PeriodoExtrato } from "@/lib/master/asaas-extrato-model";
import styles from "@/app/master/master-financeiro.module.css";

function dinheiro(centavos: number, locale: string) { return new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" }).format(centavos / 100); }
function dataHora(iso: string, locale: string) { return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" }).format(new Date(iso)); }
function dia(iso: string, locale: string) { return new Intl.DateTimeFormat(locale, { timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`)); }

export function ResultadoExtratoAsaas({ dados, locale }: { dados: ExtratoAsaas; locale: string }) {
  const [direcao, setDirecao] = useState("TODOS"), [busca, setBusca] = useState(""), [pagina, setPagina] = useState(1);
  const resumo = dados.resumo;
  const termo = busca.trim().toLocaleLowerCase(locale);
  const filtrados = dados.movimentos.filter(m => (direcao === "TODOS" || (direcao === "ENTRADA" ? m.valorCentavos > 0 : m.valorCentavos < 0)) &&
    (!termo || `${m.descricao} ${m.tipo} ${m.id} ${m.referencias.map(r => r.id).join(" ")}`.toLocaleLowerCase(locale).includes(termo))).slice().reverse();
  const paginas = Math.max(1, Math.ceil(filtrados.length / 25)), atual = Math.min(pagina, paginas);
  const movimentos = filtrados.slice((atual - 1) * 25, atual * 25);
  function exportar() {
    const url = URL.createObjectURL(new Blob([csvExtrato(dados)], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url;
    link.download = `extrato-asaas-${dados.ambiente.toLowerCase()}-${dados.periodo.inicio}-${dados.periodo.fim}.csv`;
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <div className={styles.header}>
      <div>
        <p><strong>Conta Asaas conectada ao PHANYX</strong>{dados.conta ? ` · Agência ${dados.conta.agencia || "—"} · Conta ${dados.conta.numero}${dados.conta.digito ? "-" + dados.conta.digito : ""}` : " · Identificação bancária indisponível na consulta"}</p>
        <p className={styles.muted}>Extrato de {dia(dados.periodo.inicio, locale)} a {dia(dados.periodo.fim, locale)} · Consultado em {dataHora(dados.consultadoEm, locale)} (Brasília).</p>
      </div>
      <span className={styles.status}>{dados.ambiente === "PRODUCAO" ? "Asaas · Produção" : "Asaas · Sandbox / testes"}</span>
    </div>
    {dados.ambiente === "SANDBOX" && <p role="note" className={styles.notice}>A conexão está no ambiente de testes do Asaas. Estas movimentações são simulações, sem movimentação de dinheiro real.</p>}
    {!dados.completo && <p role="alert" className={styles.notice}>A consulta alcançou o limite de tempo ou de lançamentos. A lista é parcial e os totais do período estão indisponíveis. Reduza o período e consulte novamente.</p>}
    <div className={styles.cards}>
      <div className={styles.card}><p className={styles.label}>Saldo disponível agora</p><p className={styles.amount}>{dinheiro(dados.saldoAtualCentavos, locale)}</p><p className={styles.muted}>Consulta: {dataHora(dados.saldoConsultadoEm, locale)}</p></div>
      <div className={styles.card}><p className={styles.label}>Entradas no período</p><p className={`${styles.amount} ${styles.credit}`}>{resumo ? dinheiro(resumo.entradasCentavos, locale) : "Indisponível"}</p></div>
      <div className={styles.card}><p className={styles.label}>Saídas no período</p><p className={`${styles.amount} ${styles.debit}`}>{resumo ? dinheiro(resumo.saidasCentavos, locale) : "Indisponível"}</p></div>
      <div className={styles.card}><p className={styles.label}>Movimentação líquida do período</p><p className={styles.amount}>{resumo ? dinheiro(resumo.resultadoCentavos, locale) : "Indisponível"}</p></div>
    </div>
    <p className={styles.muted}>Dados consultados diretamente no Asaas. Entradas e saídas abrangem toda esta conta, incluindo tarifas, transferências e estornos. A movimentação líquida é entradas menos saídas; o saldo disponível é uma consulta atual da conta. Cobranças apenas pendentes ou confirmadas sem lançamento no extrato não entram nestes totais.</p>
    <div className={styles.filters}>
      <label className={styles.field}>Movimentação<select value={direcao} onChange={e => { setDirecao(e.target.value); setPagina(1); }}><option value="TODOS">Todas</option><option value="ENTRADA">Entradas</option><option value="SAIDA">Saídas</option></select></label>
      <label className={styles.field}>Buscar no extrato<input type="search" placeholder="Descrição, tipo ou ID Asaas" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} /></label>
      <button type="button" onClick={exportar} disabled={!dados.completo}>Exportar período em CSV</button>
    </div>
    <p className={styles.muted}>{dados.movimentos.length} lançamentos consultados{dados.totalInformado !== null ? ` de ${dados.totalInformado} informados pelo Asaas` : ""}. {filtrados.length} correspondem à busca. Os cartões totalizam o período completo, independentemente da busca e da página.</p>
    <div className={styles.scroll} tabIndex={0} role="region" aria-label="Lançamentos do extrato Asaas">
      <table className={styles.table}><thead><tr><th scope="col">Data</th><th scope="col">Movimentação e referência Asaas</th><th scope="col" className={styles.money}>Valor</th><th scope="col" className={styles.money}>Saldo após</th></tr></thead><tbody>
        {movimentos.map(m => <tr key={m.id}><td>{dia(m.data, locale)}</td><td>{m.descricao}<span className={styles.reference}>{m.tipo} · ID: {m.id}</span>{m.referencias.map(r => <span key={`${r.tipo}:${r.id}`} className={styles.reference}>{r.tipo}: {r.id}</span>)}</td><td className={`${styles.money} ${m.valorCentavos > 0 ? styles.credit : m.valorCentavos < 0 ? styles.debit : ""}`}>{m.valorCentavos > 0 ? "+ " : ""}{dinheiro(m.valorCentavos, locale)}</td><td className={styles.money}>{m.saldoAposCentavos === null ? "Não informado" : dinheiro(m.saldoAposCentavos, locale)}</td></tr>)}
        {movimentos.length === 0 && <tr><td colSpan={4}>{dados.movimentos.length === 0 ? "O Asaas não retornou movimentações neste período." : "Nenhum lançamento corresponde à busca."}</td></tr>}
      </tbody></table>
    </div>
    <div className={styles.footer}><p className={styles.muted}>Página {atual} de {paginas}</p><div className={styles.actions}><button type="button" onClick={() => setPagina(atual - 1)} disabled={atual === 1}>Anterior</button><button type="button" onClick={() => setPagina(atual + 1)} disabled={atual === paginas}>Próxima</button></div></div>
  </>;
}

export default function ExtratoAsaasMaster() {
  const locale = useLocale();
  const [periodo, setPeriodo] = useState<PeriodoExtrato>(() => periodoExtrato());
  const [dados, setDados] = useState<ExtratoAsaas | null>(null), [erro, setErro] = useState(""), [carregando, setCarregando] = useState(true);
  const sequencia = useRef(0), controller = useRef<AbortController | null>(null);
  const consultar = useCallback(async (filtro: PeriodoExtrato) => {
    const id = ++sequencia.current; controller.current?.abort();
    const atual = new AbortController(); controller.current = atual;
    setDados(null); setErro(""); setCarregando(true);
    try {
      const params = new URLSearchParams(filtro);
      const res = await fetch(`/api/master/asaas/extrato?${params}`, { cache: "no-store", credentials: "include", signal: atual.signal });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Não foi possível consultar o Asaas.");
      if (sequencia.current === id) setDados(json);
    } catch (e) {
      if (!atual.signal.aborted && sequencia.current === id) setErro((e as Error).message || "Não foi possível consultar o Asaas.");
    } finally { if (sequencia.current === id) setCarregando(false); }
  }, []);
  const cancelar = useCallback(() => { sequencia.current++; controller.current?.abort(); }, []);
  useEffect(() => { void consultar(periodoExtrato()); return cancelar; }, [consultar, cancelar]);
  return <section className={styles.panel} aria-labelledby="titulo-extrato-asaas" aria-busy={carregando}>
    <h2 id="titulo-extrato-asaas">Asaas — saldo, entradas e saídas</h2>
    <p className={styles.muted}>Consulte as movimentações registradas no extrato da conta principal conectada.</p>
    <form className={styles.filters} onSubmit={e => { e.preventDefault(); void consultar(periodo); }}>
      <label className={styles.field}>Data inicial<input type="date" required max={periodo.fim || hojeExtrato()} value={periodo.inicio} onChange={e => setPeriodo(p => ({ ...p, inicio: e.target.value }))} /></label>
      <label className={styles.field}>Data final<input type="date" required min={periodo.inicio} max={hojeExtrato()} value={periodo.fim} onChange={e => setPeriodo(p => ({ ...p, fim: e.target.value }))} /></label>
      <button className={styles.primary} type="submit" disabled={carregando}>{carregando ? "Consultando Asaas..." : "Consultar Asaas"}</button>
      <button type="button" disabled={carregando} onClick={() => { const p = periodoExtrato(); setPeriodo(p); void consultar(p); }}>Mês atual</button>
    </form>
    {carregando && <p role="status" className={styles.muted}>Consultando saldo e todas as páginas do extrato no Asaas...</p>}
    {erro && <p role="alert" className={styles.notice}>{erro} Nenhum saldo ou total anterior está sendo apresentado como atualizado.</p>}
    {dados && !carregando && !erro && <ResultadoExtratoAsaas key={dados.consultadoEm} dados={dados} locale={locale} />}
  </section>;
}
