"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type Turma = { turmaId: number; cursoId: number; cursoNome: string; turmaNome: string };
type Valores = { taxa: number; liquida: number; antecipacao: number; total: number };
type Previa = {
  versao: string;
  contratacao: string;
  anterior: Valores;
  nova: Valores;
  quantidadeAnterior: number;
  quantidade: number;
  primeiroVencimento: string | null;
  comboAnterior: boolean;
  comboNovo: boolean;
  preservarValores: boolean;
  modalidades: Turma[];
  optativasRetiradas: number;
};
type Dados = { atuais: Turma[]; turmas: Turma[] };
const campo = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100";

export default function AlterarModalidadesMatriculaModal({ matriculaId, onCancelar, onSalvar }: {
  matriculaId: number; onCancelar: () => void; onSalvar: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("EnrollmentCombos");
  const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const data = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" });
  const formatar = (centavos: number) => moeda.format(centavos / 100);
  const url = `/api/admin/matriculas/${matriculaId}/alterar-modalidades`;
  const [dados, setDados] = useState<Dados | null>(null);
  const [selecionadas, setSelecionadas] = useState<Turma[]>([]);
  const [motivo, setMotivo] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function consultar() {
      try {
        const resposta = await fetch(url, { signal: controller.signal, cache: "no-store" });
        const json = await resposta.json().catch(() => null);
        if (!resposta.ok) throw new Error(json?.error || "Não foi possível consultar as modalidades.");
        setDados(json);
        setSelecionadas(json.atuais);
      } catch (erro) {
        if (!controller.signal.aborted) setErro(erro instanceof Error ? erro.message : "Não foi possível consultar as modalidades.");
      }
    }
    void consultar();
    return () => controller.abort();
  }, [url]);

  function selecionar(turmas: Turma[]) {
    setSelecionadas(turmas);
    setPrevia(null);
    setErro("");
  }

  async function enviar() {
    if (!dados || enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const resposta = await fetch(url, {
        method: previa ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ turmaIds: selecionadas.map(turma => turma.turmaId), motivo, versao: previa?.versao }),
      });
      const json = await resposta.json().catch(() => null);
      if (!resposta.ok) {
        setPrevia(null);
        const chave = `errors.${json?.codigo}`;
        throw new Error(json?.error || (t.has(chave) ? t(chave) : "Não foi possível alterar as modalidades."));
      }
      if (previa) onSalvar();
      else setPrevia(json);
    } catch (erro) {
      setErro(erro instanceof Error ? erro.message : "Não foi possível alterar as modalidades.");
    } finally {
      setEnviando(false);
    }
  }

  const disponiveis = dados?.turmas.filter(turma => !selecionadas.some(item => item.cursoId === turma.cursoId)) ?? [];
  const linhas = previa ? [
    ["Taxa de matrícula", formatar(previa.anterior.taxa), formatar(previa.nova.taxa)],
    ["Antecipação abatida", formatar(previa.anterior.antecipacao), formatar(previa.nova.antecipacao)],
    ["Saldo da primeira parcela", formatar(previa.anterior.liquida - previa.anterior.antecipacao),
      formatar(previa.nova.liquida - previa.nova.antecipacao)],
    ["Mensalidade com bolsa", formatar(previa.anterior.liquida), formatar(previa.nova.liquida)],
    ["Parcelas previstas", previa.quantidadeAnterior, previa.quantidade],
    ["Total antes da pontualidade", formatar(previa.anterior.total), formatar(previa.nova.total)],
  ] : [];

  return (
    <PhanyxConfirmModal aberto titulo="Alterar modalidades"
      mensagem="Inclua, retire ou troque cursos na mesma matrícula. A alteração direta vale antes do início do atendimento, da emissão ou assinatura do contrato e da emissão ou pagamento das cobranças."
      textoConfirmar={previa ? "Confirmar alteração" : "Calcular prévia"}
      mostrarConfirmar={dados !== null} carregando={enviando}
      onConfirmar={() => void enviar()} onCancelar={onCancelar}>
      {dados ? (
        <fieldset disabled={enviando} className="space-y-3 text-sm">
          {selecionadas.map(turma => {
            const alternativas = dados.turmas.filter(item => item.cursoId === turma.cursoId && item.turmaId !== turma.turmaId);
            return (
              <div key={turma.cursoId} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                <label className="block">
                  <span className="mb-1 block font-medium">{turma.cursoNome}</span>
                  <select value={turma.turmaId} className={campo} onChange={event => {
                    const nova = alternativas.find(item => item.turmaId === Number(event.target.value));
                    if (nova) selecionar(selecionadas.map(item => item.cursoId === turma.cursoId ? nova : item));
                  }}>
                    <option value={turma.turmaId}>{turma.turmaNome}</option>
                    {alternativas.map(item => <option key={item.turmaId} value={item.turmaId}>{item.turmaNome}</option>)}
                  </select>
                </label>
                <button type="button" className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300"
                  aria-label={`Retirar ${turma.cursoNome}`}
                  onClick={() => selecionar(selecionadas.filter(item => item.cursoId !== turma.cursoId))}>
                  Retirar modalidade
                </button>
              </div>
            );
          })}
          <label className="block">
            <span className="mb-1 block font-medium">Incluir modalidade</span>
            <select value="" className={campo} onChange={event => {
              const nova = disponiveis.find(item => item.turmaId === Number(event.target.value));
              if (nova) selecionar([...selecionadas, nova]);
            }}>
              <option value="">Selecione o curso e a turma</option>
              {disponiveis.map(item => <option key={item.turmaId} value={item.turmaId}>{item.cursoNome} · {item.turmaNome}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block font-medium">Motivo da alteração</span>
            <textarea value={motivo} maxLength={1000} rows={2} className={campo}
              onChange={event => { setMotivo(event.target.value); setPrevia(null); setErro(""); }} />
          </label>
        </fieldset>
      ) : !erro && <p role="status">Carregando modalidades…</p>}
      {previa && (
        <div className="space-y-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
          <p><strong>Nova contratação</strong> · {previa.contratacao}</p>
          <ul className="list-disc pl-5">
            {previa.modalidades.map(turma => <li key={turma.turmaId}>{turma.cursoNome} · {turma.turmaNome}</li>)}
          </ul>
          {previa.preservarValores && <p>A troca de turma mantém os valores contratados.</p>}
          {previa.comboAnterior && !previa.comboNovo && <p>Com a nova composição, serão aplicados os preços avulsos.</p>}
          {previa.optativasRetiradas > 0 && <p>Inscrições em optativas que serão retiradas · {previa.optativasRetiradas}.</p>}
          <table className="w-full text-left">
            <caption className="mb-2 text-left font-semibold">Valores antes e depois</caption>
            <thead><tr><th scope="col">Item</th><th scope="col">Atual</th><th scope="col">Novo</th></tr></thead>
            <tbody>{linhas.map(([item, atual, novo]) => (
              <tr key={item} className="border-t border-slate-200 dark:border-slate-700">
                <th scope="row" className="py-1 pr-2 font-medium">{item}</th>
                <td className="py-1 pr-2">{atual}</td><td className="py-1">{novo}</td>
              </tr>
            ))}</tbody>
          </table>
          {previa.primeiroVencimento && <p>Primeiro vencimento · {data.format(new Date(previa.primeiroVencimento))}.</p>}
          <p>{previa.preservarValores
            ? "Ao confirmar, o PHANYX troca a turma e gera um novo contrato para assinatura."
            : "Ao confirmar, o PHANYX atualiza as parcelas e gera um novo contrato para assinatura."}</p>
        </div>
      )}
      {erro && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>}
    </PhanyxConfirmModal>
  );
}
