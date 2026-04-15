"use client";

import { useEffect, useState } from "react";

type AtividadeItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  createdAt?: string | null;
  notaMaxima: number;
  status: string;
  disciplina?: {
    id: number;
    nome?: string | null;
    titulo?: string | null;
  } | null;
  turma?: {
    id: number;
    nome?: string | null;
  } | null;
};

export default function ProfessorAtividadesPage() {
  const [atividades, setAtividades] = useState<AtividadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<"sucesso" | "erro" | "">("");
  const [acaoEmAndamento, setAcaoEmAndamento] = useState<string>("");

  async function carregarAtividades() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/professor/atividades");
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao carregar atividades");
      }

      setAtividades(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar atividades");
    } finally {
      setLoading(false);
    }
  }

function mostrarFeedback(tipo: "sucesso" | "erro", mensagem: string) {
  setFeedbackTipo(tipo);
  setFeedback(mensagem);

  setTimeout(() => {
    setFeedback("");
    setFeedbackTipo("");
  }, 3000);
}

  useEffect(() => {
    carregarAtividades();
  }, []);

  function formatarData(data?: string | null) {
    if (!data) return "Sem prazo";

    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

function formatarTempoRelativo(data?: string | null) {
  if (!data) return "";

  try {
    const agora = new Date().getTime();
    const criadoEm = new Date(data).getTime();
    const diffMs = agora - criadoEm;

    const minutos = Math.floor(diffMs / (1000 * 60));
    const horas = Math.floor(diffMs / (1000 * 60 * 60));
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutos < 1) return "agora mesmo";
    if (minutos < 60) return `há ${minutos} min`;
    if (horas < 24) return `há ${horas} hora${horas > 1 ? "s" : ""}`;
    return `há ${dias} dia${dias > 1 ? "s" : ""}`;
  } catch {
    return "";
  }
}

  function getStatusBadge(status: string) {
    if (status === "PUBLICADA") {
      return "bg-green-100 text-green-700";
    }

    if (status === "ENCERRADA") {
      return "bg-gray-100 text-gray-700";
    }

    return "bg-yellow-100 text-yellow-700";
  }

  function getStatusLabel(status: string) {
    if (status === "PUBLICADA") return "Publicada";
    if (status === "ENCERRADA") return "Encerrada";
    return "Rascunho";
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerencie atividades, prazos e entregas dos alunos.
            </p>
          </div>

{feedback && (
  <div
    className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
      feedbackTipo === "sucesso"
        ? "border-green-200 bg-green-50 text-green-700"
        : "border-red-200 bg-red-50 text-red-700"
    }`}
  >
    {feedback}
  </div>
)}

          <a
            href="/professor/atividades/nova"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Nova atividade
          </a>
        </div>

        {loading && (
          <div className="rounded-2xl border bg-white p-6 text-sm text-gray-500 shadow-sm">
            Carregando atividades...
          </div>
        )}

        {!loading && erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {erro}
          </div>
        )}

        {!loading && !erro && atividades.length === 0 && (
          <div className="rounded-2xl border bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Nenhuma atividade cadastrada
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Crie a primeira atividade para começar a receber entregas.
            </p>
          </div>
        )}

        {!loading && !erro && atividades.length > 0 && (
          <div className="grid gap-4">
            {atividades.map((atividade) => (
              <div
                key={atividade.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {atividade.titulo}
                      </h2>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(
                          atividade.status
                        )}`}
                      >
                        {getStatusLabel(atividade.status)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>
                        <strong className="font-medium text-gray-700">
                          Disciplina:
                        </strong>{" "}
                        {atividade.disciplina?.nome ||
                          atividade.disciplina?.titulo ||
                          "Não informada"}
                      </span>

                      <span>
                        <strong className="font-medium text-gray-700">
                          Prazo:
                        </strong>{" "}
                        {formatarData(atividade.prazo)}
                      </span>

                      <span>
                        <strong className="font-medium text-gray-700">
                          Nota máxima:
                        </strong>{" "}
                        {atividade.notaMaxima}
                      </span>

                      {atividade.turma?.nome && (
                        <span>
                          <strong className="font-medium text-gray-700">
                            Turma:
                          </strong>{" "}
                          {atividade.turma.nome}
                        </span>
                      )}
                    </div>

{atividade.createdAt && (
  <span>
    <strong className="font-medium text-gray-700">
      Criado em:
    </strong>{" "}
    {new Date(atividade.createdAt).toLocaleDateString("pt-BR")} às{" "}
    {new Date(atividade.createdAt).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })}{" "}
    • {formatarTempoRelativo(atividade.createdAt)}
  </span>
)}

                    {atividade.descricao && (
                      <p className="text-sm text-gray-600">
                        {atividade.descricao}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
  <a
  href={`/professor/atividades/${atividade.id}/editar`}
  className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
>
  Abrir
</a>

{atividade.status === "RASCUNHO" && (
  <button
    onClick={async () => {
      try {
        setAcaoEmAndamento(`publicar-${atividade.id}`);

        const res = await fetch(`/api/professor/atividades/${atividade.id}/publicar`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarFeedback("erro", data?.error || "Erro ao publicar atividade");
          return;
        }

        mostrarFeedback("sucesso", "Atividade publicada com sucesso");
        await carregarAtividades();
      } catch (error) {
        console.error(error);
        mostrarFeedback("erro", "Erro ao publicar atividade");
      } finally {
        setAcaoEmAndamento("");
      }
    }}
    disabled={acaoEmAndamento === `publicar-${atividade.id}`}
    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {acaoEmAndamento === `publicar-${atividade.id}` ? "Publicando..." : "Publicar"}
  </button>
)}

{atividade.status === "PUBLICADA" && (
  <button
    onClick={async () => {
      try {
        setAcaoEmAndamento(`despublicar-${atividade.id}`);

        const res = await fetch(`/api/professor/atividades/${atividade.id}/despublicar`, {
          method: "POST",
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarFeedback("erro", data?.error || "Erro ao voltar para rascunho");
          return;
        }

        mostrarFeedback("sucesso", "Atividade voltou para rascunho");
        await carregarAtividades();
      } catch (error) {
        console.error(error);
        mostrarFeedback("erro", "Erro ao voltar para rascunho");
      } finally {
        setAcaoEmAndamento("");
      }
    }}
    disabled={acaoEmAndamento === `despublicar-${atividade.id}`}
    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {acaoEmAndamento === `despublicar-${atividade.id}`
      ? "Voltando..."
      : "Voltar para rascunho"}
  </button>
)}

  {atividade.status === "RASCUNHO" && (
  <button
    onClick={async () => {
      try {
        setAcaoEmAndamento(`excluir-${atividade.id}`);

        const res = await fetch(`/api/professor/atividades/${atividade.id}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarFeedback("erro", data?.error || "Erro ao excluir atividade");
          return;
        }

        mostrarFeedback("sucesso", "Atividade excluída com sucesso");
        await carregarAtividades();
      } catch (error) {
        console.error(error);
        mostrarFeedback("erro", "Erro ao excluir atividade");
      } finally {
        setAcaoEmAndamento("");
      }
    }}
    disabled={acaoEmAndamento === `excluir-${atividade.id}`}
    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {acaoEmAndamento === `excluir-${atividade.id}` ? "Excluindo..." : "Excluir"}
  </button>
)}
  
</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}