"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AtividadeAluno = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  status?: string | null;
  notaMaxima?: number | null;
  disciplinaNome?: string | null;
  turmaNome?: string | null;
  entrega?: {
    texto?: string | null;
    link?: string | null;
    arquivoUrl?: string | null;
    entregueEm?: string | null;
  } | null;
};

type RespostaAtividadesApi = {
  ok: boolean;
  total: number;
  items: AtividadeAluno[];
};

export default function TrabalhosAlunoPage() {
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [atividades, setAtividades] = useState<AtividadeAluno[]>([]);
  const [atividadeId, setAtividadeId] = useState("");
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  async function carregarAtividades() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch("/api/aluno/atividades", {
        credentials: "include",
        cache: "no-store",
      });

      const json: RespostaAtividadesApi = await res.json();

      if (!res.ok || !Array.isArray(json?.items)) {
        throw new Error("Erro ao carregar atividades");
      }

      setAtividades(json.items);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar atividades");
      setAtividades([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtividades();
  }, []);

  const atividadeSelecionada = useMemo(() => {
    return atividades.find((a) => String(a.id) === String(atividadeId)) || null;
  }, [atividades, atividadeId]);

useEffect(() => {
  if (!atividadeSelecionada) {
    setTexto("");
    setLink("");
    setArquivo(null);
    return;
  }

  setTexto(atividadeSelecionada.entrega?.texto || "");
  setLink(atividadeSelecionada.entrega?.link || "");
  setArquivo(null);
}, [atividadeSelecionada]);

const prazoEncerrado = Boolean(
  atividadeSelecionada?.prazo &&
    new Date() > new Date(atividadeSelecionada.prazo)
);

  async function handleEnviar(e: FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      if (!atividadeId) {
        throw new Error("Selecione uma atividade");
      }

      if (!texto.trim() && !link.trim() && !arquivo) {
        throw new Error("Envie pelo menos texto, link ou arquivo");
      }

      const formData = new FormData();
      formData.append("texto", texto);
      formData.append("link", link);

      if (arquivo) {
        formData.append("arquivo", arquivo);
      }

      const res = await fetch(
        `/api/aluno/atividades/${atividadeId}/entregar`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao enviar atividade");
      }

      setMensagem("Trabalho enviado com sucesso!");
      setTexto("");
      setLink("");
      setArquivo(null);
    } catch (e: any) {
      setErro(e?.message || "Erro ao enviar atividade");
    } finally {
      setSalvando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return "Sem prazo";
    try {
      return new Date(data).toLocaleString("pt-BR");
    } catch {
      return data;
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          Trabalhos e atividades
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Consulte as atividades publicadas e envie sua entrega com texto, link
          ou arquivo.
        </p>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Carregando atividades...
        </div>
      )}

      {!loading && erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {!loading && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Atividades publicadas
              </h2>

              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {atividades.length} atividade(s)
              </span>
            </div>

            <div className="mt-5 space-y-4">
              {atividades.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                  Nenhuma atividade publicada no momento.
                </div>
              ) : (
                atividades.map((atividade) => {
                  const selecionada =
                    String(atividade.id) === String(atividadeId);

                  return (
                    <button
                      key={atividade.id}
                      type="button"
                      onClick={() => setAtividadeId(String(atividade.id))}
                      className={`w-full rounded-2xl border p-5 text-left transition ${
                        selecionada
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-300"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-slate-900">
                            {atividade.titulo}
                          </h3>

                          <div className="mt-2 space-y-1 text-sm text-slate-600">
                            <p>
                              <strong className="font-medium text-slate-800">
                                Disciplina:
                              </strong>{" "}
                              {atividade.disciplinaNome || "-"}
                            </p>

                            <p>
                              <strong className="font-medium text-slate-800">
                                Turma:
                              </strong>{" "}
                              {atividade.turmaNome || "-"}
                            </p>

                            <p>
                              <strong className="font-medium text-slate-800">
                                Prazo:
                              </strong>{" "}
                              {formatarData(atividade.prazo)}
                            </p>

                            <p>
                              <strong className="font-medium text-slate-800">
                                Nota máxima:
                              </strong>{" "}
                              {atividade.notaMaxima ?? 10}
                            </p>
                          </div>

                          {atividade.descricao && (
                            <p className="mt-3 text-sm text-slate-500">
                              {atividade.descricao}
                            </p>
                          )}
                        </div>

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            selecionada
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {selecionada ? "Selecionada" : "Selecionar"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <form
            onSubmit={handleEnviar}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Enviar entrega
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Selecione uma atividade e envie sua resposta.
              </p>
            </div>

            {mensagem && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                {mensagem}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Atividade
              </label>
              <select
                value={atividadeId}
                onChange={(e) => setAtividadeId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Selecione uma atividade</option>
                {atividades.map((atividade) => (
                  <option key={atividade.id} value={atividade.id}>
                    {atividade.titulo} — {atividade.disciplinaNome}
                  </option>
                ))}
              </select>
            </div>

            {atividadeSelecionada && (
  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
    <p>
      <strong className="font-medium text-slate-800">
        Disciplina:
      </strong>{" "}
      {atividadeSelecionada.disciplinaNome || "-"}
    </p>

    <p className="mt-1">
      <strong className="font-medium text-slate-800">Prazo:</strong>{" "}
      {formatarData(atividadeSelecionada.prazo)}
    </p>

    {atividadeSelecionada.entrega && (
  <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
    <p className="font-semibold">Você já enviou esta atividade.</p>

    {atividadeSelecionada.entrega.texto && (
      <div className="mt-2">
        <p>
          <strong>Texto enviado:</strong>
        </p>
        <p className="mt-1 whitespace-pre-wrap text-slate-700">
          {atividadeSelecionada.entrega.texto}
        </p>
      </div>
    )}

    {atividadeSelecionada.entrega.link && (
      <p className="mt-2">
        <strong>Link enviado:</strong>{" "}
        <a
          href={atividadeSelecionada.entrega.link}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          {atividadeSelecionada.entrega.link}
        </a>
      </p>
    )}

    {atividadeSelecionada.entrega.arquivoUrl && (
      <p className="mt-2">
        <strong>Arquivo enviado:</strong>{" "}
        <a
          href={atividadeSelecionada.entrega.arquivoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline"
        >
          abrir arquivo atual
        </a>
      </p>
    )}

    {atividadeSelecionada.entrega.entregueEm && (
      <p className="mt-2">
        <strong>Último envio:</strong>{" "}
        {formatarData(atividadeSelecionada.entrega.entregueEm)}
      </p>
    )}
  </div>
)}

    {prazoEncerrado && (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        Prazo encerrado. Não é possível editar esta entrega.
      </div>
    )}
  </div>
)}

<div className="space-y-2">
  <label className="block text-sm font-medium text-slate-700">
    Texto
  </label>
  <textarea
    value={texto}
    onChange={(e) => setTexto(e.target.value)}
    rows={5}
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
    placeholder="Digite aqui sua resposta, observações ou conteúdo complementar"
  />
</div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-slate-700">
    Link
  </label>
  <input
    type="url"
    value={link}
    onChange={(e) => setLink(e.target.value)}
    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
    placeholder="https://"
  />
</div>

<div className="space-y-2">
  <label className="block text-sm font-medium text-slate-700">
    Arquivo
  </label>

  <label className="inline-flex cursor-pointer items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
    Selecionar arquivo
    <input
      type="file"
      className="hidden"
      onChange={(e) => setArquivo(e.target.files?.[0] || null)}
    />
  </label>

  {arquivo && (
    <p className="text-sm text-slate-500">
      Arquivo selecionado: {arquivo.name}
    </p>
  )}
</div>

<div className="flex justify-end">
  <button
    type="submit"
    disabled={salvando || prazoEncerrado}
    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
  >
    {salvando
      ? "Enviando..."
      : atividadeSelecionada?.entrega
      ? "Atualizar entrega"
      : "Enviar trabalho"}
  </button>
</div>
          </form>
        </div>
      )}
    </div>
  );
}