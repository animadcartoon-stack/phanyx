"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Curso = {
  id: number;
  nome: string;
  codigo?: string | null;
  descricao?: string | null;
  quantidadeSemestres?: number | null;
  ativo: boolean;
  valorMatricula?: number | null;
  valorMensalidade?: number | null;
  quantidadeParcelas?: number | null;
};

type FeedbackTipo = "sucesso" | "erro" | "";

export default function AdminCursosPage() {
  const searchParams = useSearchParams();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    quantidadeSemestres: "",
    valorMatricula: "",
    valorMensalidade: "",
    quantidadeParcelas: "",
  });

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (!feedback) return;

    const timer = setTimeout(() => {
      setFeedback("");
      setFeedbackTipo("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [feedback]);

  function mostrarFeedback(tipo: Exclude<FeedbackTipo, "">, mensagem: string) {
    setFeedbackTipo(tipo);
    setFeedback(mensagem);
  }

  async function carregarCursos() {
    try {
      const res = await fetch("/api/admin/cursos", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar cursos");
      }

      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar cursos:", error);
      setCursos([]);
    } finally {
      setLoading(false);
    }
  }

  async function criarCurso(e: React.FormEvent) {
    e.preventDefault();

    try {
      setCriando(true);
      setFeedback("");
      setFeedbackTipo("");

      const res = await fetch("/api/admin/cursos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nome: form.nome,
          codigo: form.codigo || null,
          descricao: form.descricao || null,
          quantidadeSemestres: form.quantidadeSemestres
            ? Number(form.quantidadeSemestres)
            : null,
          valorMatricula: form.valorMatricula
            ? Number(form.valorMatricula)
            : null,
          valorMensalidade: form.valorMensalidade
            ? Number(form.valorMensalidade)
            : null,
          quantidadeParcelas: form.quantidadeParcelas
            ? Number(form.quantidadeParcelas)
            : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar curso");
      }

      setForm({
        nome: "",
        codigo: "",
        descricao: "",
        quantidadeSemestres: "",
        valorMatricula: "",
        valorMensalidade: "",
        quantidadeParcelas: "",
      });

      await carregarCursos();
      mostrarFeedback("sucesso", "Curso criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar curso:", error);
      mostrarFeedback("erro", error?.message || "Erro ao criar curso");
    } finally {
      setCriando(false);
    }
  }

  useEffect(() => {
    carregarCursos();
  }, []);

  useEffect(() => {
    const buscaUrl = searchParams.get("busca");
    if (buscaUrl) {
      setBusca(buscaUrl);
    }
  }, [searchParams]);

  const cursosFiltrados = useMemo(() => {
    const termoTexto = busca.trim().toLowerCase();
    const termoNumerico = busca.replace(/\D/g, "");

    if (!termoTexto) return cursos;

    return cursos.filter((curso) => {
      const nome = String(curso.nome || "").toLowerCase().trim();
      const codigo = String(curso.codigo || "").toLowerCase().trim();
      const descricao = String(curso.descricao || "").toLowerCase().trim();
      const quantidadeSemestres = String(curso.quantidadeSemestres ?? "")
        .toLowerCase()
        .trim();
      const valorMatricula = String(curso.valorMatricula ?? "")
        .toLowerCase()
        .trim();
      const valorMensalidade = String(curso.valorMensalidade ?? "")
        .toLowerCase()
        .trim();
      const quantidadeParcelas = String(curso.quantidadeParcelas ?? "")
        .toLowerCase()
        .trim();
      const ativo = curso.ativo ? "ativo" : "inativo";

      const quantidadeSemestresNumerico =
        quantidadeSemestres.replace(/\D/g, "");
      const valorMatriculaNumerico = valorMatricula.replace(/\D/g, "");
      const valorMensalidadeNumerico = valorMensalidade.replace(/\D/g, "");
      const quantidadeParcelasNumerico =
        quantidadeParcelas.replace(/\D/g, "");

      return (
        nome.includes(termoTexto) ||
        codigo.includes(termoTexto) ||
        descricao.includes(termoTexto) ||
        quantidadeSemestres.includes(termoTexto) ||
        valorMatricula.includes(termoTexto) ||
        valorMensalidade.includes(termoTexto) ||
        quantidadeParcelas.includes(termoTexto) ||
        ativo.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (quantidadeSemestresNumerico.includes(termoNumerico) ||
            valorMatriculaNumerico.includes(termoNumerico) ||
            valorMensalidadeNumerico.includes(termoNumerico) ||
            quantidadeParcelasNumerico.includes(termoNumerico)))
      );
    });
  }, [cursos, busca]);

  return (
    <div className="space-y-8">
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

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">🎓 Cursos</h1>
          <p className="text-gray-600">
            Cadastre e gerencie os cursos da instituição
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-lg bg-gray-800 px-4 py-2 text-white"
        >
          Voltar ao Painel
        </Link>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Novo Curso</h2>

        <form
          onSubmit={criarCurso}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <input
            type="text"
            placeholder="Nome do curso"
            className="rounded-lg border px-4 py-2"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            required
          />

          <input
            type="text"
            placeholder="Código do curso"
            className="rounded-lg border px-4 py-2"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
          />

          <textarea
            placeholder="Descrição"
            className="rounded-lg border px-4 py-2 md:col-span-2"
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            rows={4}
          />

          <input
            type="number"
            placeholder="Quantidade de semestres"
            className="rounded-lg border px-4 py-2"
            value={form.quantidadeSemestres}
            onChange={(e) =>
              setForm({ ...form, quantidadeSemestres: e.target.value })
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="Valor da matrícula"
            className="rounded-lg border px-4 py-2"
            value={form.valorMatricula}
            onChange={(e) =>
              setForm({ ...form, valorMatricula: e.target.value })
            }
          />

          <input
            type="number"
            step="0.01"
            placeholder="Valor da mensalidade"
            className="rounded-lg border px-4 py-2"
            value={form.valorMensalidade}
            onChange={(e) =>
              setForm({ ...form, valorMensalidade: e.target.value })
            }
          />

          <input
            type="number"
            placeholder="Quantidade de parcelas"
            className="rounded-lg border px-4 py-2"
            value={form.quantidadeParcelas}
            onChange={(e) =>
              setForm({ ...form, quantidadeParcelas: e.target.value })
            }
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={criando}
              className="rounded-lg bg-purple-600 px-5 py-2 text-white disabled:opacity-50"
            >
              {criando ? "Salvando..." : "Salvar Curso"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Cursos cadastrados</h2>

          <input
            type="text"
            placeholder="Buscar por nome, código, descrição, valores ou parcelas"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border p-2 md:w-[460px]"
          />
        </div>

        {loading ? (
          <p className="text-gray-500">Carregando cursos...</p>
        ) : cursosFiltrados.length === 0 ? (
          <p className="text-gray-500">Nenhum curso encontrado para essa busca.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cursosFiltrados.map((curso) => (
              <div
                key={curso.id}
                className="rounded-xl border p-4 transition hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {curso.nome}
                    </h3>

                    {curso.codigo ? (
                      <p className="text-sm text-gray-500">
                        Código: {curso.codigo}
                      </p>
                    ) : null}

                    {curso.descricao ? (
                      <p className="mt-2 text-sm text-gray-600">
                        {curso.descricao}
                      </p>
                    ) : null}

                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>
                        Semestres:{" "}
                        {curso.quantidadeSemestres != null
                          ? curso.quantidadeSemestres
                          : "Não informado"}
                      </p>
                      <p>
                        Matrícula:{" "}
                        {curso.valorMatricula != null
                          ? `R$ ${curso.valorMatricula.toFixed(2)}`
                          : "Não informado"}
                      </p>
                      <p>
                        Mensalidade:{" "}
                        {curso.valorMensalidade != null
                          ? `R$ ${curso.valorMensalidade.toFixed(2)}`
                          : "Não informado"}
                      </p>
                      <p>
                        Parcelas:{" "}
                        {curso.quantidadeParcelas != null
                          ? curso.quantidadeParcelas
                          : "Não informado"}
                      </p>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/admin/cursos/${curso.id}`}
                        className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
                      >
                        Montar grade curricular
                      </Link>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      curso.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {curso.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}