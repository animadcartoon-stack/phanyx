"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type AlunoPresencaApi = {
  itemMatriculaId: number;
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  statusAluno?: string | null;
  statusItemMatricula?: string | null;
  presenca?: {
    id: number;
    status: string;
    observacao?: string | null;
  } | null;
};

type RespostaApi = {
  turma: {
    id: number;
    nome: string;
  };
  aula: {
    id: number;
    titulo: string;
  };
  alunos: AlunoPresencaApi[];
};

type StatusPresenca = "PRESENTE" | "FALTA" | "JUSTIFICADA" | "ATESTADO";

function labelStatusAluno(status?: string | null) {
  switch (status) {
    case "ATIVO":
      return "Ativo";
    case "TRANCADO":
      return "Trancado";
    case "SUSPENSO":
      return "Suspenso";
    case "INADIMPLENTE":
      return "Inadimplente";
    case "TRANSFERIDO":
      return "Transferido";
    case "DESLIGADO":
      return "Desligado";
    case "FORMADO":
      return "Formado";
    case "CANCELADO":
      return "Cancelado";
    case "PAUSA_MEDICA":
      return "Pausa médica";
    case "FALTANTE":
      return "Faltante";
    default:
      return "-";
  }
}

function labelStatusItem(status?: string | null) {
  switch (status) {
    case "A_CURSAR":
      return "A cursar";
    case "EM_CURSO":
      return "Em curso";
    case "CONCLUIDO":
      return "Concluído";
    case "TRANCADO":
      return "Trancado";
    case "REPROVADO":
      return "Reprovado";
    case "CANCELADO":
      return "Cancelado";
    default:
      return "-";
  }
}

function labelPresenca(status?: string) {
  switch (status) {
    case "PRESENTE":
      return "Presente";
    case "FALTA":
      return "Falta";
    case "JUSTIFICADA":
      return "Justificada";
    case "ATESTADO":
      return "Atestado";
    default:
      return "Presente";
  }
}

function classeStatusPresenca(status?: string) {
  switch (status) {
    case "PRESENTE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FALTA":
      return "border-red-200 bg-red-50 text-red-700";
    case "JUSTIFICADA":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ATESTADO":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function PresencasDaAulaPage() {
  const router = useRouter();
  const params = useParams<{ id: string; aulaId: string }>();

  const turmaId = Number(params.id);
  const aulaId = Number(params.aulaId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [dados, setDados] = useState<RespostaApi | null>(null);

  const [statusPorAluno, setStatusPorAluno] = useState<
    Record<number, StatusPresenca>
  >({});
  const [observacaoPorAluno, setObservacaoPorAluno] = useState<
    Record<number, string>
  >({});

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");
      setMensagem("");

      const res = await fetch(
        `/api/professor/turmas/${turmaId}/aulas/${aulaId}/presencas`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar chamada");
      }

      setDados(data);

      const novoStatus: Record<number, StatusPresenca> = {};
      const novaObservacao: Record<number, string> = {};

      for (const aluno of data.alunos || []) {
        novoStatus[aluno.alunoId] = (aluno.presenca?.status ||
          "PRESENTE") as StatusPresenca;
        novaObservacao[aluno.alunoId] = aluno.presenca?.observacao || "";
      }

      setStatusPorAluno(novoStatus);
      setObservacaoPorAluno(novaObservacao);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar chamada");
      setDados(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      setErro("Turma inválida");
      setLoading(false);
      return;
    }

    if (!Number.isFinite(aulaId) || aulaId <= 0) {
      setErro("Aula inválida");
      setLoading(false);
      return;
    }

    carregarDados();
  }, [turmaId, aulaId]);

  function aplicarStatusEmTodos(status: StatusPresenca) {
    if (!dados) return;

    const novoStatus: Record<number, StatusPresenca> = {};
    for (const aluno of dados.alunos) {
      novoStatus[aluno.alunoId] = status;
    }

    setStatusPorAluno((prev) => ({
      ...prev,
      ...novoStatus,
    }));
  }

  async function salvarChamada() {
    if (!dados) return;

    try {
      setSaving(true);
      setErro("");
      setMensagem("");

      const presencas = dados.alunos.map((aluno) => ({
        alunoId: aluno.alunoId,
        status: statusPorAluno[aluno.alunoId] || "PRESENTE",
        observacao: observacaoPorAluno[aluno.alunoId] || "",
      }));

      const res = await fetch(
        `/api/professor/turmas/${turmaId}/aulas/${aulaId}/presencas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ presencas }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao salvar chamada");
      }

      setMensagem("Chamada salva com sucesso!");
      await carregarDados();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar chamada");
    } finally {
      setSaving(false);
    }
  }

  const resumo = useMemo(() => {
    const valores = Object.values(statusPorAluno);

    return {
      total: valores.length,
      presentes: valores.filter((s) => s === "PRESENTE").length,
      faltas: valores.filter((s) => s === "FALTA").length,
      justificadas: valores.filter((s) => s === "JUSTIFICADA").length,
      atestados: valores.filter((s) => s === "ATESTADO").length,
    };
  }, [statusPorAluno]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">Carregando chamada...</p>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 shadow-sm">
        <p className="text-sm text-red-700">
          Não foi possível carregar a chamada.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Chamada da aula
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Turma: <strong>{dados.turma.nome}</strong>
            </p>
            <p className="text-sm text-slate-600">
              Aula: <strong>{dados.aula.titulo}</strong>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Total
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {resumo.total}
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Presentes
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-700">
                {resumo.presentes}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                Faltas
              </p>
              <p className="mt-1 text-xl font-bold text-red-700">
                {resumo.faltas}
              </p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Justificadas
              </p>
              <p className="mt-1 text-xl font-bold text-amber-700">
                {resumo.justificadas}
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                Atestados
              </p>
              <p className="mt-1 text-xl font-bold text-blue-700">
                {resumo.atestados}
              </p>
            </div>
          </div>
        </div>
      </div>

      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {mensagem && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm">
          {mensagem}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Lançamento da chamada
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Marque a presença individualmente ou use os atalhos rápidos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => aplicarStatusEmTodos("PRESENTE")}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              Todos presentes
            </button>

            <button
              type="button"
              onClick={() => aplicarStatusEmTodos("FALTA")}
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Todos faltaram
            </button>

            <button
              type="button"
              onClick={() => aplicarStatusEmTodos("JUSTIFICADA")}
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
            >
              Todos justificados
            </button>
          </div>
        </div>

        {dados.alunos.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Nenhum aluno matriculado nesta turma.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {dados.alunos.map((aluno) => {
              const statusAtual = statusPorAluno[aluno.alunoId] || "PRESENTE";

              return (
                <div
                  key={aluno.alunoId}
                  className="rounded-2xl border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {aluno.nome}
                        </h3>

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatusPresenca(
                            statusAtual
                          )}`}
                        >
                          {labelPresenca(statusAtual)}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                        <p>
                          <strong className="font-medium text-slate-800">
                            Matrícula:
                          </strong>{" "}
                          {aluno.matricula || "-"}
                        </p>

                        <p>
                          <strong className="font-medium text-slate-800">
                            E-mail:
                          </strong>{" "}
                          {aluno.email || "-"}
                        </p>

                        <p>
                          <strong className="font-medium text-slate-800">
                            Status do aluno:
                          </strong>{" "}
                          {labelStatusAluno(aluno.statusAluno)}
                        </p>

                        <p>
                          <strong className="font-medium text-slate-800">
                            Status da disciplina:
                          </strong>{" "}
                          {labelStatusItem(aluno.statusItemMatricula)}
                        </p>
                      </div>
                    </div>

                    <div className="grid w-full gap-3 xl:max-w-xl xl:grid-cols-[220px_1fr]">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Presença
                        </label>
                        <select
                          value={statusAtual}
                          onChange={(e) =>
                            setStatusPorAluno((prev) => ({
                              ...prev,
                              [aluno.alunoId]:
                                e.target.value as StatusPresenca,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                        >
                          <option value="PRESENTE">Presente</option>
                          <option value="FALTA">Falta</option>
                          <option value="JUSTIFICADA">Justificada</option>
                          <option value="ATESTADO">Atestado</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Observação
                        </label>
                        <input
                          value={observacaoPorAluno[aluno.alunoId] || ""}
                          onChange={(e) =>
                            setObservacaoPorAluno((prev) => ({
                              ...prev,
                              [aluno.alunoId]: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-900 outline-none focus:border-blue-500"
                          placeholder="Ex.: chegou atrasado, apresentou atestado..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvarChamada}
          disabled={saving}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? "Salvando chamada..." : "Salvar chamada"}
        </button>
      </div>
    </div>
  );
}