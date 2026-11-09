"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type MatriculaRevisavel = {
  id: number;
  valorMatricula?: number | string | null;
  valorMensalidade?: number | string | null;
  bolsaPercentual?: number | string | null;
};

type Valores = {
  taxa: number;
  mensalidade: number;
  bolsa: number;
  liquida: number;
  antecipacao: number;
  total: number;
};

type Previa = {
  versao: string;
  anterior: Valores;
  nova: Valores;
  vencimentos: string[];
  primeiroVencimento: string | null;
};

const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default function RevisaoValoresMatriculaModal({ matricula, onCancelar, onSalvar }: {
  matricula: MatriculaRevisavel;
  onCancelar: () => void;
  onSalvar: () => void;
}) {
  const locale = useLocale();
  const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const percentual = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });
  const data = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" });
  const formatar = (centavos: number) => moeda.format(centavos / 100);
  const [form, setForm] = useState({
    valorMatricula: String(matricula.valorMatricula ?? 0),
    valorMensalidade: String(matricula.valorMensalidade ?? 0),
    bolsaPercentual: String(matricula.bolsaPercentual ?? 0),
    motivo: "",
  });
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function alterar(campo: keyof typeof form, valor: string) {
    setForm(atual => ({ ...atual, [campo]: valor }));
    setPrevia(null);
    setErro("");
  }

  async function enviar() {
    if (carregando) return;
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch(`/api/admin/matriculas/${matricula.id}/revisao-valores`, {
        method: previa ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, versao: previa?.versao }),
      });
      const dados = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setPrevia(null);
        throw new Error(dados?.error ?? (dados?.codigo === "DADOS_ALTERADOS"
          ? "Outra operação alterou a matrícula. Calcule a prévia novamente."
          : "Não foi possível revisar os valores da matrícula."));
      }
      if (previa) onSalvar();
      else setPrevia(dados);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível revisar os valores.");
    } finally {
      setCarregando(false);
    }
  }

  const campos = [
    { chave: "valorMatricula", texto: "Taxa de matrícula (R$)" },
    { chave: "valorMensalidade", texto: "Mensalidade antes da bolsa (R$)" },
    { chave: "bolsaPercentual", texto: "Bolsa ou desconto (%)", maximo: 100 },
  ] as const;
  const linhas = previa ? [
    ["Taxa de matrícula", formatar(previa.anterior.taxa), formatar(previa.nova.taxa)],
    ["Mensalidade antes da bolsa", formatar(previa.anterior.mensalidade), formatar(previa.nova.mensalidade)],
    ["Bolsa", percentual.format(previa.anterior.bolsa / 10000), percentual.format(previa.nova.bolsa / 10000)],
    ["Mensalidade com bolsa", formatar(previa.anterior.liquida), formatar(previa.nova.liquida)],
    ...(previa.anterior.antecipacao || previa.nova.antecipacao
      ? [["Antecipação abatida", formatar(previa.anterior.antecipacao), formatar(previa.nova.antecipacao)],
        ["Saldo da primeira parcela", formatar(previa.anterior.liquida - previa.anterior.antecipacao),
          formatar(previa.nova.liquida - previa.nova.antecipacao)]]
      : []),
    ["Total antes da pontualidade", formatar(previa.anterior.total), formatar(previa.nova.total)],
  ] : [];

  return (
    <PhanyxConfirmModal
      aberto
      titulo="Revisar valores da matrícula"
      mensagem="Altere os valores da contratação antes de assinar o contrato, emitir cobranças ou registrar pagamentos."
      textoConfirmar={previa ? "Confirmar alteração" : "Calcular prévia"}
      carregando={carregando}
      onConfirmar={() => void enviar()}
      onCancelar={onCancelar}
    >
      <fieldset disabled={carregando} className="space-y-3 text-sm">
        {campos.map(({ chave, texto, ...limites }) => (
          <label key={chave} className="block">
            <span className="mb-1 block font-medium">{texto}</span>
            <input type="number" min={0} max={"maximo" in limites ? limites.maximo : 99999999.99} step="0.01"
              value={form[chave]} onChange={e => alterar(chave, e.target.value)} className={campo} />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block font-medium">Motivo da alteração</span>
          <textarea value={form.motivo} maxLength={1000} rows={2}
            onChange={e => alterar("motivo", e.target.value)} className={campo} />
        </label>
      </fieldset>
      {previa && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
          <table className="w-full text-left">
            <caption className="mb-2 text-left font-semibold">Prévia do contrato e das cobranças</caption>
            <thead><tr><th scope="col">Item</th><th scope="col">Atual</th><th scope="col">Novo</th></tr></thead>
            <tbody>
              {linhas.map(([item, anterior, novo]) => (
                <tr key={item} className="border-t border-slate-200 dark:border-slate-700">
                  <th scope="row" className="py-1 pr-2 font-medium">{item}</th>
                  <td className="py-1 pr-2">{anterior}</td>
                  <td className="py-1">{novo}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {previa.vencimentos.length > 0 && previa.primeiroVencimento ? (
            <p>{previa.vencimentos.length} mensalidades com primeiro vencimento em {data.format(new Date(previa.primeiroVencimento))}.</p>
          ) : <p>O novo valor fica sem mensalidades a cobrar.</p>}
          <p>Ao confirmar, o PHANYX registra a revisão e gera um novo contrato para assinatura.</p>
        </div>
      )}
      {erro && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>}
    </PhanyxConfirmModal>
  );
}
