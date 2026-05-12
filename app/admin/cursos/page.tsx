"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Polo = {
  id: number;
  nome: string;
  codigo?: string | null;
};

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
  cursosPolos?: {
    id: number;
    poloId: number;
    polo?: Polo | null;
  }[];
};

type FeedbackTipo = "sucesso" | "erro" | "";

export default function AdminCursosPage() {
  const searchParams = useSearchParams();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [polos, setPolos] = useState<Polo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"ATIVOS" | "EXCLUIDOS" | "TODOS">("ATIVOS");
  const [polosAbertos, setPolosAbertos] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    quantidadeSemestres: "",
    valorMatricula: "",
    valorMensalidade: "",
    quantidadeParcelas: "",
  });

  const [polosSelecionados, setPolosSelecionados] = useState<number[]>([]);

  const [feedback, setFeedback] = useState("");
  const [feedbackTipo, setFeedbackTipo] = useState<FeedbackTipo>("");
  const [criando, setCriando] = useState(false);
  const [cursoParaExcluir, setCursoParaExcluir] = useState<Curso | null>(null);
  const [excluindoCurso, setExcluindoCurso] = useState(false);

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

  async function carregarPolos() {
    try {
      const res = await fetch("/api/admin/polos", {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar polos");
      }

      const data = await res.json();
      setPolos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao carregar polos:", error);
      setPolos([]);
    }
  }

  function alternarPolo(id: number) {
    setPolosSelecionados((atual) =>
      atual.includes(id)
        ? atual.filter((item) => item !== id)
        : [...atual, id]
    );
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
          poloIds: polosSelecionados,
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
      setPolosSelecionados([]);
      setPolosAbertos(false);

      await carregarCursos();
      mostrarFeedback("sucesso", "Curso criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar curso:", error);
      mostrarFeedback("erro", error?.message || "Erro ao criar curso");
    } finally {
      setCriando(false);
    }
  }

async function confirmarExclusaoCurso() {
  if (!cursoParaExcluir) return;

  try {
    setExcluindoCurso(true);

    const res = await fetch("/api/admin/cursos", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        id: cursoParaExcluir.id,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao excluir curso.");
    }

    await carregarCursos();

    mostrarFeedback(
      "sucesso",
      "Curso excluído com sucesso. Ele pode ser restaurado depois."
    );

    setCursoParaExcluir(null);
  } catch (error: any) {
    mostrarFeedback(
      "erro",
      error?.message || "Erro ao excluir curso."
    );
  } finally {
    setExcluindoCurso(false);
  }
}

async function restaurarCurso(id: number) {
  try {
    const res = await fetch("/api/admin/cursos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, ativo: true }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Erro ao restaurar curso.");
    }

    await carregarCursos();
    mostrarFeedback("sucesso", "Curso restaurado com sucesso.");
  } catch (error: any) {
    mostrarFeedback("erro", error?.message || "Erro ao restaurar curso.");
  }
}

  useEffect(() => {
    carregarCursos();
    carregarPolos();
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

    const cursosPorStatus = cursos.filter((curso) => {
  if (filtroStatus === "ATIVOS") return curso.ativo;
  if (filtroStatus === "EXCLUIDOS") return !curso.ativo;
  return true;
});

if (!termoTexto) return cursosPorStatus;

    return cursosPorStatus.filter((curso) => {
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
      const polosTexto = String(
        curso.cursosPolos?.map((item) => item.polo?.nome || "").join(" | ") || ""
      )
        .toLowerCase()
        .trim();

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
        polosTexto.includes(termoTexto) ||
        (termoNumerico !== "" &&
          (quantidadeSemestresNumerico.includes(termoNumerico) ||
            valorMatriculaNumerico.includes(termoNumerico) ||
            valorMensalidadeNumerico.includes(termoNumerico) ||
            quantidadeParcelasNumerico.includes(termoNumerico)))
      );
    });
  }, [cursos, busca, filtroStatus]);

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
              type="button"
              onClick={() => setPolosAbertos((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left"
            >
              <span className="font-medium text-gray-800">
                Polos onde este curso será ofertado
                {polosSelecionados.length > 0
                  ? ` (${polosSelecionados.length} selecionado(s))`
                  : ""}
              </span>
              <span className="text-sm text-gray-500">
                {polosAbertos ? "▲ Fechar" : "▼ Abrir"}
              </span>
            </button>

            {polosAbertos && (
              <div className="mt-2 max-h-52 overflow-auto rounded-lg border p-3">
                {polos.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhum polo cadastrado. Se a instituição não trabalhar com polos,
                    você pode deixar sem seleção por enquanto.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {polos.map((polo) => (
                      <label
                        key={polo.id}
                        className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={polosSelecionados.includes(polo.id)}
                          onChange={() => alternarPolo(polo.id)}
                        />
                        <span>
                          {polo.nome}
                          {polo.codigo ? ` — ${polo.codigo}` : ""}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="mt-1 text-xs text-slate-500">
              O curso continua sendo da instituição, mas pode ser ofertado em quantos polos desejar.
            </p>
          </div>

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
            placeholder="Buscar por nome, código, descrição, valores, parcelas ou polos"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border p-2 md:w-[460px]"
          />

<select
  value={filtroStatus}
  onChange={(e) =>
    setFiltroStatus(e.target.value as "ATIVOS" | "EXCLUIDOS" | "TODOS")
  }
  className="w-full rounded-lg border p-2 md:w-[180px]"
>
  <option value="ATIVOS">Ativos</option>
  <option value="EXCLUIDOS">Excluídos</option>
  <option value="TODOS">Todos</option>
</select>

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
                      <p>
                        Polos:{" "}
                        {curso.cursosPolos && curso.cursosPolos.length > 0
                          ? curso.cursosPolos
                              .map((item) => item.polo?.nome)
                              .filter(Boolean)
                              .join(", ")
                          : "Sem polos vinculados"}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
  <Link
    href={`/admin/cursos/${curso.id}`}
    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-white"
  >
    Montar grade curricular
  </Link>

  {curso.ativo ? (
    <button
      type="button"
      onClick={() => setCursoParaExcluir(curso)}
      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Excluir
    </button>
  ) : (
    <button
      type="button"
      onClick={() => restaurarCurso(curso.id)}
      className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
    >
      Restaurar
    </button>
  )}
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
      {cursoParaExcluir && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-900">
          Excluir curso
        </h3>

        <p className="mt-2 text-sm text-slate-600">
          Deseja realmente excluir o curso{" "}
          <span className="font-semibold">
            {cursoParaExcluir.nome}
          </span>
          ?
        </p>

        <p className="mt-2 text-xs text-slate-500">
          O curso será apenas arquivado e poderá ser restaurado depois.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setCursoParaExcluir(null)}
          disabled={excluindoCurso}
          className="rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={confirmarExclusaoCurso}
          disabled={excluindoCurso}
          className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {excluindoCurso ? "Excluindo..." : "Excluir curso"}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}