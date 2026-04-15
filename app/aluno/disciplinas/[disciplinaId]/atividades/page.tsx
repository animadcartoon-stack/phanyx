"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useAluno } from "@/app/context/AlunoContext";
import { useAuth } from "@/lib/auth-context";

type AtividadeAlunoApi = {
  id: number | string;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima?: number | null;
  status?: string | null;
};

type FeedbackTipo = "sucesso" | "erro" | "aviso";

function formatarData(data?: string | null) {
  if (!data) return "Prazo não informado";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

export default function AtividadesAlunoPage() {
  const { disciplinaId } = useParams();
  const id = Number(disciplinaId);

  const { registrarRespostaAtividade } = useAluno();
  const { user } = useAuth();

  const [atividades, setAtividades] = useState<AtividadeAlunoApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [atividadeSelecionada, setAtividadeSelecionada] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const [toast, setToast] = useState<{
    tipo: FeedbackTipo;
    mensagem: string;
  } | null>(null);

  function mostrarToast(tipo: FeedbackTipo, mensagem: string) {
    setToast({ tipo, mensagem });

    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  useEffect(() => {
    let mounted = true;

    async function carregarAtividades() {
      if (!Number.isFinite(id) || id <= 0) {
        if (mounted) {
          setErro("Disciplina inválida.");
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setErro("");

        const res = await fetch(`/api/aluno/atividades?disciplinaId=${id}`, {
          credentials: "include",
          cache: "no-store",
        });

        if (!mounted) return;

        if (!res.ok) {
          setAtividades([]);
          setLoading(false);
          return;
        }

        const json = await res.json();
        setAtividades(Array.isArray(json) ? json : []);
      } catch {
        if (!mounted) return;
        setAtividades([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    carregarAtividades();

    return () => {
      mounted = false;
    };
  }, [id]);

  const atividadeAtiva = useMemo(() => {
    if (!atividadeSelecionada) return null;

    return (
      atividades.find((atividade) => String(atividade.id) === atividadeSelecionada) ||
      null
    );
  }, [atividades, atividadeSelecionada]);

  async function enviarResposta() {
    if (!atividadeSelecionada) {
      mostrarToast("aviso", "Selecione uma atividade para enviar.");
      return;
    }

    if (!arquivo) {
      mostrarToast("aviso", "Escolha um arquivo antes de enviar.");
      return;
    }

    if (!user?.email) {
      mostrarToast("erro", "Não foi possível identificar o aluno logado.");
      return;
    }

    try {
      setEnviando(true);

      await registrarRespostaAtividade({
        atividadeId: atividadeSelecionada,
        disciplinaId: id,
        alunoEmail: user.email,
        arquivoNome: arquivo.name,
      });

      mostrarToast("sucesso", "Resposta enviada com sucesso.");
      setArquivo(null);
      setAtividadeSelecionada(null);
    } catch (error: any) {
      mostrarToast("erro", error?.message || "Não foi possível enviar a atividade.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      {toast && (
        <div className="fixed right-6 top-6 z-50">
          <div
            className={`rounded-xl px-5 py-3 text-sm font-medium shadow-lg ${
              toast.tipo === "sucesso"
                ? "bg-green-600 text-white"
                : toast.tipo === "erro"
                ? "bg-red-600 text-white"
                : "bg-yellow-400 text-black"
            }`}
          >
            {toast.mensagem}
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">
          Disciplina
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Atividades da disciplina
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Consulte as atividades publicadas pelo professor e envie seus arquivos
          dentro do prazo disponível.
        </p>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando atividades...
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {!loading && !erro && (
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Atividades disponíveis
                </h2>
                <p className="text-sm text-slate-500">
                  Selecione uma atividade para visualizar os detalhes e enviar sua resposta.
                </p>
              </div>

              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {atividades.length} atividade(s)
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {atividades.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-lg font-bold text-slate-900">
                    Nenhuma atividade disponível no momento
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Quando o professor publicar atividades para esta disciplina,
                    elas aparecerão aqui para envio e acompanhamento.
                  </p>
                </div>
              ) : (
                atividades.map((atividade) => {
                  const selecionada = String(atividade.id) === atividadeSelecionada;

                  return (
                    <button
                      key={atividade.id}
                      type="button"
                      onClick={() => setAtividadeSelecionada(String(atividade.id))}
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        selecionada
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {atividade.titulo}
                          </h3>

                          {atividade.descricao && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {atividade.descricao}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {atividade.notaMaxima != null && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              Nota máxima: {atividade.notaMaxima}
                            </span>
                          )}

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {atividade.status || "Ativa"}
                          </span>
                        </div>
                      </div>

                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                        Prazo: {formatarData(atividade.prazo)}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Enviar atividade
            </h2>

            {!atividadeAtiva ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-semibold text-slate-900">
                  Selecione uma atividade
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Ao selecionar uma atividade disponível, o envio do arquivo será liberado aqui.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {atividadeAtiva.titulo}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Prazo: {formatarData(atividadeAtiva.prazo)}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Arquivo da resposta
                  </label>

                  <input
                    type="file"
                    onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-700"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Envie o arquivo final da atividade. O nome selecionado será registrado na sua resposta.
                  </p>
                </div>

                {arquivo && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                    Arquivo selecionado: <strong>{arquivo.name}</strong>
                  </div>
                )}

                <button
                  type="button"
                  onClick={enviarResposta}
                  disabled={enviando}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? "Enviando..." : "Enviar resposta"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
