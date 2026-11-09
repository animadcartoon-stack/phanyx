"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";

type Edicao = {
  id: number;
  acao: string;
  usuarioId: number;
  usuarioNome: string | null;
  funcionarioId: number | null;
  masterOriginalId: number | null;
  criadoEm: string;
  motivo: string | null;
  alteracoes: Record<string, { anterior: unknown; novo: unknown }>;
};

const titulos: Record<string, string> = {
  EDICAO: "Edição da matrícula",
  DATA_INICIO: "Alteração da data de início",
  VALORES: "Revisão de valores",
};
const campos: Record<string, string> = {
  alunoId: "Aluno",
  cursoId: "Curso",
  turmaPrincipalId: "Turma principal",
  cursoSemestreId: "Etapa do curso",
  periodoMatriculaId: "Período da matrícula",
  semestre: "Semestre",
  etapaNumero: "Número da etapa",
  organizacaoCurricular: "Organização curricular",
  periodoLetivo: "Período letivo",
  modalidade: "Modalidade",
  tipoContratacao: "Tipo de contratação",
  dataInicioCurso: "Data de início",
  valorMatricula: "Taxa de matrícula",
  valorMensalidade: "Mensalidade",
  bolsaPercentual: "Bolsa",
  antecipacao: "Antecipação",
  valorTotal: "Total contratado",
  quantidadeMensalidades: "Quantidade de mensalidades",
  quantidadeParcelas: "Quantidade de parcelas",
  primeiroVencimento: "Primeiro vencimento",
  dataPrimeiroVencimento: "Data do primeiro vencimento",
  vendedorResponsavelId: "Vendedor responsável",
  itens: "Itens da matrícula",
  disciplinasContratadas: "Disciplinas contratadas",
  contrato: "Contrato",
};
const camposMoeda = new Set(["valorMatricula", "valorMensalidade", "antecipacao", "valorTotal"]);
const camposData = new Set(["dataInicioCurso", "primeiroVencimento", "dataPrimeiroVencimento"]);

export default function HistoricoEdicoesMatriculaModal({ matriculaId, onFechar }: {
  matriculaId: number;
  onFechar: () => void;
}) {
  const [antes, setAntes] = useState<number | null>(null);
  const [pagina, setPagina] = useState<{ edicoes: Edicao[]; proximo: number | null } | null>(null);
  const [erro, setErro] = useState("");
  const locale = useLocale();
  const dataHora = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" });
  const dataCivil = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" });
  const moeda = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const percentual = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 2 });

  useEffect(() => {
    const controller = new AbortController();
    const url = `/api/admin/matriculas/${matriculaId}/historico-edicoes${antes === null ? "" : `?antes=${antes}`}`;
    async function consultar() {
      try {
        const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error("Não foi possível consultar o histórico.");
        setPagina(await res.json());
      } catch {
        if (!controller.signal.aborted) setErro("Não foi possível consultar o histórico.");
      }
    }
    void consultar();
    return () => controller.abort();
  }, [matriculaId, antes]);

  function formatar(campo: string, valor: unknown): string {
    if (valor === null || valor === undefined || valor === "") return "—";
    if (camposMoeda.has(campo)) return moeda.format(Number(valor));
    if (camposData.has(campo)) return dataCivil.format(new Date(String(valor)));
    if (campo === "bolsaPercentual") return percentual.format(Number(valor) / 100);
    if (Array.isArray(valor)) return valor.map(item => {
      if (item && typeof item === "object") {
        return [item.turmaId ? `Turma #${item.turmaId}` : "", item.disciplinaId ? `Disciplina #${item.disciplinaId}` : ""]
          .filter(Boolean).join(" / ");
      }
      return `#${item}`;
    }).join(", ") || "—";
    if (campo.endsWith("Id") || campo === "contrato") return `#${valor}`;
    return String(valor);
  }

  return (
    <PhanyxConfirmModal aberto titulo="Histórico de edições" mensagem={`Matrícula #${matriculaId}. Datas e horas no fuso do navegador.`}
      textoConfirmar="Fechar" mostrarCancelar={false} onConfirmar={onFechar} onCancelar={onFechar}>
      {erro ? <p role="alert">{erro}</p> : pagina === null ? <p role="status">Carregando histórico…</p> :
        pagina.edicoes.length === 0 ? <p>Nenhuma edição registrada desde a ativação do histórico.</p> : (
          <ol className="space-y-3">
            {pagina.edicoes.map(edicao => (
              <li key={edicao.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
                <p className="font-semibold">{titulos[edicao.acao] ?? edicao.acao}</p>
                <time dateTime={edicao.criadoEm}>{dataHora.format(new Date(edicao.criadoEm))}</time>
                <p>{edicao.usuarioNome ? `${edicao.usuarioNome} · ` : ""}Usuário #{edicao.usuarioId}
                  {edicao.funcionarioId !== null ? ` · Funcionário #${edicao.funcionarioId}` : ""}
                  {edicao.masterOriginalId !== null ? ` · Sessão de suporte do usuário #${edicao.masterOriginalId}` : ""}
                </p>
                {edicao.motivo && <p className="mt-1 break-words">{edicao.motivo}</p>}
                {Object.keys(edicao.alteracoes).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Ver o que mudou</summary>
                    <ul className="mt-1 space-y-1">
                      {Object.entries(edicao.alteracoes).map(([campo, valores]) => (
                        <li key={campo} className="break-words">
                          <strong>{campos[campo] ?? campo}</strong>
                          <div>{formatar(campo, valores.anterior)} → {formatar(campo, valores.novo)}</div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ol>
        )}
      {pagina?.proximo != null && (
        <button type="button" className="text-sm font-semibold text-blue-700 dark:text-blue-300"
          onClick={() => { setAntes(pagina.proximo); setPagina(null); }}>
          Ver edições anteriores
        </button>
      )}
    </PhanyxConfirmModal>
  );
}
