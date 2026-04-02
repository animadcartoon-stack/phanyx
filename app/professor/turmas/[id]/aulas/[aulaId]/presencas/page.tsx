"use client";

import { useEffect, useState } from "react";
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

export default function PresencasDaAulaPage() {
  const router = useRouter();
  const params = useParams<{ id: string; aulaId: string }>();

  const turmaId = Number(params.id);
  const aulaId = Number(params.aulaId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
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

  async function salvarChamada() {
    if (!dados) return;

    try {
      setSaving(true);
      setErro("");

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

      alert("Chamada salva com sucesso!");
      await carregarDados();
    } catch (e: any) {
      setErro(e?.message || "Erro ao salvar chamada");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8">Carregando chamada...</div>;
  }

  if (!dados) {
    return <div className="p-8">Não foi possível carregar a chamada.</div>;
  }

  return (
    <div className="max-w-6xl space-y-6">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Voltar
      </button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chamada da aula</h1>
        <p className="text-gray-600">
          Turma: <strong>{dados.turma.nome}</strong>
        </p>
        <p className="text-gray-600">
          Aula: <strong>{dados.aula.titulo}</strong>
        </p>
      </div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 gap-3 border-b bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
          <div className="col-span-3">Aluno</div>
          <div className="col-span-2">Matrícula</div>
          <div className="col-span-2">Status aluno</div>
          <div className="col-span-2">Status disciplina</div>
          <div className="col-span-1">Presença</div>
          <div className="col-span-2">Observação</div>
        </div>

        {dados.alunos.length === 0 ? (
          <div className="p-4 text-sm text-gray-600">
            Nenhum aluno matriculado nesta turma.
          </div>
        ) : (
          dados.alunos.map((aluno) => (
            <div
              key={aluno.alunoId}
              className="grid grid-cols-12 gap-3 border-b px-4 py-4 text-sm items-start"
            >
              <div className="col-span-3">
                <p className="font-medium text-gray-900">{aluno.nome}</p>
                <p className="text-gray-500">{aluno.email || "-"}</p>
              </div>

              <div className="col-span-2 text-gray-700">
                {aluno.matricula || "-"}
              </div>

              <div className="col-span-2 text-gray-700">
                {labelStatusAluno(aluno.statusAluno)}
              </div>

              <div className="col-span-2 text-gray-700">
                {labelStatusItem(aluno.statusItemMatricula)}
              </div>

              <div className="col-span-1">
                <select
                  value={statusPorAluno[aluno.alunoId] || "PRESENTE"}
                  onChange={(e) =>
                    setStatusPorAluno((prev) => ({
                      ...prev,
                      [aluno.alunoId]: e.target.value as StatusPresenca,
                    }))
                  }
                  className="w-full border rounded-lg p-2 bg-white text-gray-900"
                >
                  <option value="PRESENTE">Presente</option>
                  <option value="FALTA">Falta</option>
                  <option value="JUSTIFICADA">Justificada</option>
                  <option value="ATESTADO">Atestado</option>
                </select>
              </div>

              <div className="col-span-2">
                <input
                  value={observacaoPorAluno[aluno.alunoId] || ""}
                  onChange={(e) =>
                    setObservacaoPorAluno((prev) => ({
                      ...prev,
                      [aluno.alunoId]: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg p-2 text-gray-900"
                  placeholder="Observação"
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={salvarChamada}
          disabled={saving}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar chamada"}
        </button>
      </div>
    </div>
  );
}