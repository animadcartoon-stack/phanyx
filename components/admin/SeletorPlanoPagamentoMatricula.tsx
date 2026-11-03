"use client";
import { cotarPlanoPagamento, normalizarPlanosPagamento } from "@/lib/matriculas/planos-pagamento";

export default function SeletorPlanoPagamentoMatricula({ configuracao, selecionadoId, onChange, indisponivel = false }: {
  configuracao: unknown;
  selecionadoId: string;
  onChange: (id: string) => void;
  indisponivel?: boolean;
}) {
  const planos = (normalizarPlanosPagamento(configuracao)?.planos ?? []).filter(p => p.ativo);
  if (!planos.length) return null;
  const plano = planos.find(p => p.id === selecionadoId);
  const cotacao = plano ? cotarPlanoPagamento(plano) : null;
  const moeda = (centavos: number) => new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' }).format(centavos/100);
  return <div className="mt-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
    <label className="block text-sm font-semibold" htmlFor="plano-pagamento-nova">Plano de pagamento (opcional)</label>
    <select id="plano-pagamento-nova" value={indisponivel ? '' : selecionadoId} disabled={indisponivel}
      onChange={e => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <option value="">Manter pagamento padrao do curso</option>
      {planos.map(p => <option key={p.id} value={p.id}>{p.nome} — {p.quantidadeParcelas} parcela(s)</option>)}
    </select>
    {indisponivel && <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">Este fluxo usa o financeiro proprio de disciplinas, combos ou cursos sem grade. Os planos personalizados serao integrados a ele em uma etapa especifica.</p>}
    {!indisponivel && plano && cotacao && <div className="mt-3 space-y-1 text-sm">
      <p>Valor contratado: <strong>{moeda(cotacao.totalCentavos)}</strong></p>
      <p>Antecipacao prevista: <strong>{moeda(cotacao.antecipacaoCentavos)}</strong> — abatida da primeira parcela, sem acrescimo ao total.</p>
      <p>Restante da primeira parcela: <strong>{moeda(cotacao.restantePrimeiraParcelaCentavos)}</strong>.</p>
      <p>{plano.precoIncluiPontualidade ? 'Valores ja contemplam pontualidade; nao aplicar outro desconto.' : 'Valores nominais: regras de pontualidade podem ser aplicadas conforme configuracao institucional.'}</p>
      <p className="text-xs text-amber-800 dark:text-amber-200">O valor informado no ato nao representa baixa automatica. Registre o recebimento exclusivamente no Caixa.</p>
    </div>}
  </div>;
}
