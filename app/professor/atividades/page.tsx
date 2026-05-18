"use client";

import { useEffect, useMemo, useState } from "react";

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
    alunos?: {
    id: number;
    nome?: string | null;
    email?: string | null;
    matricula?: string | null;
  }[];
};

function normalizarTexto(valor?: string | number | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function textoBuscaAtividade(atividade: AtividadeItem) {
  return normalizarTexto(
    [
      atividade.titulo,
      atividade.descricao,
      atividade.status,
      atividade.turma?.nome,
      atividade.disciplina?.nome,
      atividade.disciplina?.titulo,
      atividade.prazo ? new Date(atividade.prazo).toLocaleDateString("pt-BR") : "",
      atividade.createdAt ? new Date(atividade.createdAt).toLocaleDateString("pt-BR") : "",
      ...(atividade.alunos || []).flatMap((aluno) => [
        aluno.nome,
        aluno.email,
        aluno.matricula,
      ]),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export default function ProfessorAtividadesPage() {
  const [atividades, setAtividades] = useState<AtividadeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
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

    const atividadesFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return atividades;

    return atividades.filter((atividade) =>
      textoBuscaAtividade(atividade).includes(termo)
    );
  }, [atividades, busca]);

  const sugestoesBusca = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return [];

    return atividadesFiltradas.slice(0, 8).map((atividade) => ({
      chave: String(atividade.id),
      titulo: atividade.titulo,
      turma: atividade.turma?.nome || "Turma não informada",
      disciplina:
        atividade.disciplina?.nome ||
        atividade.disciplina?.titulo ||
        "Disciplina não informada",
      prazo: formatarData(atividade.prazo),
      alunos: atividade.alunos?.map((a) => a.nome).filter(Boolean).join(", ") || "",
    }));
  }, [busca, atividadesFiltradas]);

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

<div className="relative rounded-2xl border bg-white p-4 shadow-sm">
  <input
    value={busca}
    onChange={(e) => setBusca(e.target.value)}
    placeholder="Buscar por aluno, turma, tarefa, período, prazo ou disciplina..."
    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
  />

  {busca.trim() && (
    <div className="absolute left-4 right-4 top-[68px] z-50 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
      {sugestoesBusca.length === 0 ? (
        <p className="px-3 py-3 text-sm text-slate-500">
          Nenhuma sugestão encontrada.
        </p>
      ) : (
        sugestoesBusca.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => setBusca(item.titulo)}
            className="w-full rounded-xl px-3 py-3 text-left hover:bg-blue-50"
          >
            <p className="text-sm font-black text-slate-900">{item.titulo}</p>
            <p className="text-xs text-slate-600">
              Turma {item.turma} • {item.disciplina}
            </p>
            <p className="text-xs font-semibold text-blue-700">
              Prazo: {item.prazo}
            </p>
            {item.alunos && (
              <p className="mt-1 text-xs text-slate-500">
                Alunos: {item.alunos}
              </p>
            )}
          </button>
        ))
      )}
    </div>
  )}
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

        {!loading && !erro && atividadesFiltradas.length === 0 && (
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
            {atividadesFiltradas.map((atividade) => (
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