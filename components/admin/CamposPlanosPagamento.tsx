"use client";

import type { ConfiguracaoPlanosPagamento } from "@/lib/matriculas/planos-pagamento";

export type AjusteParcelaFormulario = { numero: string; valor: string };
export type PlanoPagamentoFormulario = {
  id: string;
  nome: string;
  quantidadeParcelas: string;
  valorParcela: string;
  ajustes: AjusteParcelaFormulario[];
  valorAntecipacao: string;
  precoIncluiPontualidade: boolean;
  ativo: boolean;
};

export function planosParaFormulario(valor: ConfiguracaoPlanosPagamento | null | undefined): PlanoPagamentoFormulario[] {
  return (valor?.planos ?? []).map(p => ({
    id: p.id, nome: p.nome, quantidadeParcelas: String(p.quantidadeParcelas),
    valorParcela: String(p.valorParcela),
    ajustes: (p.ajustes ?? []).map(a => ({ numero: String(a.numero), valor: String(a.valor) })),
    valorAntecipacao: String(p.valorAntecipacao ?? '0.00'),
    precoIncluiPontualidade: p.precoIncluiPontualidade, ativo: p.ativo,
  }));
}

function valorCentavos(valor: string) {
  const texto = String(valor).replace(',', '.').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) return null;
  return Math.round(Number(texto) * 100);
}
function moeda(centavos: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(centavos / 100);
}

export default function CamposPlanosPagamento({ planos, onChange, disabled = false }: {
  planos: PlanoPagamentoFormulario[];
  onChange: (valor: PlanoPagamentoFormulario[]) => void;
  disabled?: boolean;
}) {
  const alterar = (id: string, dados: Partial<PlanoPagamentoFormulario>) =>
    onChange(planos.map(p => p.id === id ? { ...p, ...dados } : p));
  return (
    <div className="md:col-span-2 rounded-xl border border-blue-300 bg-blue-50/60 p-4 text-slate-900 dark:border-blue-800 dark:bg-slate-900 dark:text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-semibold">Planos de pagamento (opcional)</h3>
          <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">
            Configure quantas parcelas quiser, de 1 a 120, com valores diferentes por plano. Ao desativar, o valor padrão do curso continua funcionando.
          </p>
        </div>
        <button type="button" disabled={disabled || planos.length >= 40}
          onClick={() => onChange([...planos, {
            id: 'p_' + crypto.randomUUID().replaceAll('-', ''), nome: '', quantidadeParcelas: '12',
            valorParcela: '', ajustes: [], valorAntecipacao: '0.00',
            precoIncluiPontualidade: false, ativo: true,
          }])}
          className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-50">
          + Adicionar plano
        </button>
      </div>
      {planos.length === 0 && <p className="mt-3 text-sm">Nenhum plano adicional configurado. Continua valendo a mensalidade padrão.</p>}
      <div className="mt-3 space-y-3">
        {planos.map((plano, indice) => {
          const qtd = Number(plano.quantidadeParcelas);
          const padrao = valorCentavos(plano.valorParcela);
          const ajustes = (plano.ajustes || []).map(a => ({ numero: Number(a.numero), valor: valorCentavos(a.valor) }));
          const valido = Number.isInteger(qtd) && qtd >= 1 && qtd <= 120 && padrao !== null && padrao > 0 &&
            ajustes.every(a => Number.isInteger(a.numero) && a.numero >= 1 && a.numero <= qtd && a.valor !== null && a.valor > 0) &&
            new Set(ajustes.map(a => a.numero)).size === ajustes.length;
          const total = valido ? padrao! * qtd + ajustes.reduce((s, a) => s + a.valor! - padrao!, 0) : null;
          const primeira = ajustes.find(a => a.numero === 1)?.valor ?? padrao;
          const antecipacao = valorCentavos(plano.valorAntecipacao);
          const creditoValido = primeira != null && antecipacao != null && antecipacao < primeira;
          return (
            <div key={plano.id} className="rounded-xl border border-slate-300 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm">Plano {indice + 1}</strong>
                <button type="button" disabled={disabled} className="text-xs font-semibold text-red-700 hover:underline dark:text-red-300"
                  onClick={() => onChange(planos.filter(p => p.id !== plano.id))}>Remover plano</button>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block text-sm">Nome do plano
                  <input disabled={disabled} value={plano.nome} placeholder="Ex.: 12 parcelas (jan.–dez.)" maxLength={120}
                    onChange={e => alterar(plano.id, { nome: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <label className="block text-sm">Quantidade de parcelas
                  <input disabled={disabled} type="number" min={1} max={120} step={1} value={plano.quantidadeParcelas}
                    onChange={e => alterar(plano.id, { quantidadeParcelas: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <label className="block text-sm">Valor normal de cada parcela (R$)
                  <input disabled={disabled} type="number" min="0.01" step="0.01" value={plano.valorParcela} placeholder="468.00"
                    onChange={e => alterar(plano.id, { valorParcela: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">Parcelas com valor diferente (opcional)</span>
                  <button type="button" disabled={disabled || plano.ajustes.length >= qtd || plano.ajustes.length >= 120}
                    onClick={() => alterar(plano.id, { ajustes: [...plano.ajustes, { numero: '1', valor: '' }] })}
                    className="text-sm font-semibold text-blue-700 hover:underline disabled:opacity-50 dark:text-blue-300">+ Ajustar parcela</button>
                </div>
                <p className="my-1 text-xs text-slate-600 dark:text-slate-300">Exemplo: em 11×, ajuste a parcela 1 para R$ 510,50 e mantenha as outras 10 em R$ 510,55.</p>
                {plano.ajustes.map((ajuste, i) => <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
                  <label className="text-xs">Parcela nº
                    <input disabled={disabled} type="number" min={1} max={120} step={1} value={ajuste.numero}
                      onChange={e => alterar(plano.id, { ajustes: plano.ajustes.map((a,j) => j === i ? {...a,numero:e.target.value} : a) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                  </label>
                  <label className="text-xs">Valor (R$)
                    <input disabled={disabled} type="number" min="0.01" step="0.01" value={ajuste.valor}
                      onChange={e => alterar(plano.id, { ajustes: plano.ajustes.map((a,j) => j === i ? {...a,valor:e.target.value} : a) })}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                  </label>
                  <button type="button" disabled={disabled} onClick={() => alterar(plano.id,{ajustes:plano.ajustes.filter((_,j)=>j!==i)})}
                    className="mt-5 text-sm text-red-700 dark:text-red-300">Remover</button>
                </div>)}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">Antecipação a abater da primeira parcela (R$)
                  <input disabled={disabled} type="number" min={0} step="0.01" value={plano.valorAntecipacao}
                    onChange={e => alterar(plano.id,{valorAntecipacao:e.target.value})}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
                </label>
                <div className="space-y-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" disabled={disabled} checked={plano.ativo} onChange={e => alterar(plano.id,{ativo:e.target.checked})} /> Plano ativo</label>
                  <label className="flex items-center gap-2"><input type="checkbox" disabled={disabled} checked={plano.precoIncluiPontualidade} onChange={e => alterar(plano.id,{precoIncluiPontualidade:e.target.checked})} /> Valores já incluem desconto por pontualidade</label>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-2 text-sm text-slate-900 dark:bg-slate-800 dark:text-slate-100" aria-live="polite">
                {total == null ? 'Preencha os valores para visualizar o total.' :
                  <>Total do plano: <strong>{moeda(total)}</strong>. {creditoValido && antecipacao! > 0 ? <>Entrada antecipada: <strong>{moeda(antecipacao!)}</strong>. Restante da primeira parcela: <strong>{moeda(primeira! - antecipacao!)}</strong>. O total contratado não aumenta.</> : null}</>}
                {!creditoValido && antecipacao != null && antecipacao > 0 ? <p className="mt-1 text-red-700 dark:text-red-300">A antecipação deve ser menor que a primeira parcela.</p> : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs font-medium text-amber-900 dark:text-amber-200">Etapa 1: estes planos são apenas cadastrados. Não geram lançamentos nem substituem os valores de matrícula automaticamente até a integração financeira ser homologada.</p>
    </div>
  );
}
