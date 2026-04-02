"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Disciplina = {
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
  valorMatricula?: number | null;
  valorMensalidade?: number | null;
  quantidadeParcelas?: number | null;
  ativo?: boolean;
};

type CursoSemestreDisciplina = {
  id: number;
  disciplinaId: number;
  disciplina: Disciplina;
};

type CursoSemestre = {
  id: number;
  numero: number;
  titulo?: string | null;
  descricao?: string | null;
  disciplinas: CursoSemestreDisciplina[];
};

export default function CursoDetalhePage() {
  const params = useParams();
  const cursoId = Number(params.id);

  const [curso, setCurso] = useState<Curso | null>(null);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [semestres, setSemestres] = useState<CursoSemestre[]>([]);
  const [loading, setLoading] = useState(true);

  const [editandoCurso, setEditandoCurso] = useState(false);
  const [salvandoCurso, setSalvandoCurso] = useState(false);

  const [formCurso, setFormCurso] = useState({
    nome: "",
    codigo: "",
    descricao: "",
    quantidadeSemestres: "",
    valorMatricula: "",
    valorMensalidade: "",
    quantidadeParcelas: "",
    ativo: true,
  });

  const [novoSemestre, setNovoSemestre] = useState({
    numero: "",
    titulo: "",
    descricao: "",
  });

  const [selecionadas, setSelecionadas] = useState<Record<number, number[]>>(
    {}
  );

  async function carregarCurso() {
    const res = await fetch("/api/admin/cursos", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar cursos");
    }

    const cursos: Curso[] = await res.json();
    const encontrado =
      cursos.find((c) => Number(c.id) === Number(cursoId)) || null;

    setCurso(encontrado);

    if (encontrado) {
      setFormCurso({
        nome: encontrado.nome ?? "",
        codigo: encontrado.codigo ?? "",
        descricao: encontrado.descricao ?? "",
        quantidadeSemestres:
          encontrado.quantidadeSemestres != null
            ? String(encontrado.quantidadeSemestres)
            : "",
        valorMatricula:
          encontrado.valorMatricula != null
            ? String(encontrado.valorMatricula)
            : "",
        valorMensalidade:
          encontrado.valorMensalidade != null
            ? String(encontrado.valorMensalidade)
            : "",
        quantidadeParcelas:
          encontrado.quantidadeParcelas != null
            ? String(encontrado.quantidadeParcelas)
            : "",
        ativo: Boolean(encontrado.ativo),
      });
    }
  }

  async function carregarDisciplinas() {
    const res = await fetch("/api/disciplina", {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar disciplinas");
    }

    const data = await res.json();
    setDisciplinas(Array.isArray(data) ? data : []);
  }

  async function carregarSemestres() {
    const res = await fetch(`/api/admin/curso-semestres?cursoId=${cursoId}`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Erro ao carregar semestres do curso");
    }

    const data: CursoSemestre[] = await res.json();
    setSemestres(Array.isArray(data) ? data : []);

    const mapa: Record<number, number[]> = {};
    (Array.isArray(data) ? data : []).forEach((semestre) => {
      mapa[semestre.id] = semestre.disciplinas.map((d) => d.disciplinaId);
    });
    setSelecionadas(mapa);
  }

  async function carregarTudo() {
    try {
      setLoading(true);
      await Promise.all([carregarCurso(), carregarDisciplinas(), carregarSemestres()]);
    } catch (error) {
      console.error("Erro ao carregar dados do curso:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!cursoId || Number.isNaN(cursoId)) return;
    carregarTudo();
  }, [cursoId]);

  async function salvarEdicaoCurso() {
    if (!curso) return;

    try {
      setSalvandoCurso(true);

      const res = await fetch("/api/admin/cursos", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: curso.id,
          nome: formCurso.nome,
          codigo: formCurso.codigo || null,
          descricao: formCurso.descricao || null,
          quantidadeSemestres: formCurso.quantidadeSemestres
            ? Number(formCurso.quantidadeSemestres)
            : null,
          valorMatricula: formCurso.valorMatricula
            ? Number(formCurso.valorMatricula)
            : null,
          valorMensalidade: formCurso.valorMensalidade
            ? Number(formCurso.valorMensalidade)
            : null,
          quantidadeParcelas: formCurso.quantidadeParcelas
            ? Number(formCurso.quantidadeParcelas)
            : null,
          ativo: formCurso.ativo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao editar curso");
        return;
      }

      await carregarCurso();
      setEditandoCurso(false);
      alert("Curso atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao editar curso:", error);
      alert("Erro ao editar curso");
    } finally {
      setSalvandoCurso(false);
    }
  }

  async function criarSemestre(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await fetch("/api/admin/curso-semestres", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cursoId,
          numero: Number(novoSemestre.numero),
          titulo: novoSemestre.titulo || null,
          descricao: novoSemestre.descricao || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar semestre");
        return;
      }

      setNovoSemestre({
        numero: "",
        titulo: "",
        descricao: "",
      });

      await carregarSemestres();
      alert("Semestre criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar semestre:", error);
      alert("Erro ao criar semestre");
    }
  }

  function toggleDisciplina(cursoSemestreId: number, disciplinaId: number) {
    const atuais = selecionadas[cursoSemestreId] || [];
    const existe = atuais.includes(disciplinaId);

    const atualizadas = existe
      ? atuais.filter((id) => id !== disciplinaId)
      : [...atuais, disciplinaId];

    setSelecionadas((prev) => ({
      ...prev,
      [cursoSemestreId]: atualizadas,
    }));
  }

  async function salvarDisciplinas(cursoSemestreId: number) {
    try {
      const disciplinaIds = selecionadas[cursoSemestreId] || [];

      const res = await fetch("/api/admin/curso-semestre-disciplinas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          cursoSemestreId,
          disciplinaIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao salvar disciplinas");
        return;
      }

      await carregarSemestres();
      alert("Disciplinas do semestre salvas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar disciplinas:", error);
      alert("Erro ao salvar disciplinas");
    }
  }

  const semestresOrdenados = useMemo(() => {
    return [...semestres].sort((a, b) => a.numero - b.numero);
  }, [semestres]);

  if (loading) {
    return <p className="text-gray-500">Carregando curso...</p>;
  }

  if (!curso) {
    return <p className="text-red-600">Curso não encontrado.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🎓 Estrutura do Curso
          </h1>
          <p className="text-gray-600">
            Cadastre os semestres e vincule as disciplinas de cada semestre.
          </p>
        </div>

        <Link
          href="/admin/cursos"
          className="bg-gray-800 text-white px-4 py-2 rounded-lg"
        >
          Voltar para Cursos
        </Link>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editandoCurso ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={formCurso.nome}
                  onChange={(e) =>
                    setFormCurso({ ...formCurso, nome: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2 text-2xl font-semibold"
                  placeholder="Nome do curso"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={formCurso.codigo}
                    onChange={(e) =>
                      setFormCurso({ ...formCurso, codigo: e.target.value })
                    }
                    className="border rounded-lg px-4 py-2"
                    placeholder="Código"
                  />

                  <input
                    type="number"
                    value={formCurso.quantidadeSemestres}
                    onChange={(e) =>
                      setFormCurso({
                        ...formCurso,
                        quantidadeSemestres: e.target.value,
                      })
                    }
                    className="border rounded-lg px-4 py-2"
                    placeholder="Quantidade de semestres"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={formCurso.valorMatricula}
                    onChange={(e) =>
                      setFormCurso({
                        ...formCurso,
                        valorMatricula: e.target.value,
                      })
                    }
                    className="border rounded-lg px-4 py-2"
                    placeholder="Valor da matrícula"
                  />

                  <input
                    type="number"
                    step="0.01"
                    value={formCurso.valorMensalidade}
                    onChange={(e) =>
                      setFormCurso({
                        ...formCurso,
                        valorMensalidade: e.target.value,
                      })
                    }
                    className="border rounded-lg px-4 py-2"
                    placeholder="Valor da mensalidade"
                  />

                  <input
                    type="number"
                    value={formCurso.quantidadeParcelas}
                    onChange={(e) =>
                      setFormCurso({
                        ...formCurso,
                        quantidadeParcelas: e.target.value,
                      })
                    }
                    className="border rounded-lg px-4 py-2"
                    placeholder="Quantidade de parcelas"
                  />

                  <label className="flex items-center gap-2 border rounded-lg px-4 py-2">
                    <input
                      type="checkbox"
                      checked={formCurso.ativo}
                      onChange={(e) =>
                        setFormCurso({
                          ...formCurso,
                          ativo: e.target.checked,
                        })
                      }
                    />
                    Curso ativo
                  </label>
                </div>

                <textarea
                  value={formCurso.descricao}
                  onChange={(e) =>
                    setFormCurso({ ...formCurso, descricao: e.target.value })
                  }
                  className="w-full border rounded-lg px-4 py-2"
                  rows={4}
                  placeholder="Descrição do curso"
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={salvarEdicaoCurso}
                    disabled={salvandoCurso}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  >
                    {salvandoCurso ? "Salvando..." : "Salvar alterações"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditandoCurso(false)}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditandoCurso(true)}
                  className="text-left"
                >
                  <h2 className="text-2xl font-semibold text-gray-900 hover:text-blue-700">
                    {curso.nome}
                  </h2>
                </button>

                <div className="mt-3 space-y-1 text-sm text-gray-700">
                  <p>Código: {curso.codigo || "Não informado"}</p>
                  <p>Descrição: {curso.descricao || "Não informada"}</p>
                  <p>
                    Quantidade prevista de semestres:{" "}
                    {curso.quantidadeSemestres ?? "Não informado"}
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
                  <p>Status: {curso.ativo ? "Ativo" : "Inativo"}</p>
                </div>
              </>
            )}
          </div>

          {!editandoCurso ? (
            <button
              type="button"
              onClick={() => setEditandoCurso(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Editar curso
            </button>
          ) : null}
        </div>
      </div>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4">+ Adicionar semestre</h3>

        <form
          onSubmit={criarSemestre}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            type="number"
            placeholder="Número do semestre"
            className="border rounded-lg px-4 py-2"
            value={novoSemestre.numero}
            onChange={(e) =>
              setNovoSemestre({ ...novoSemestre, numero: e.target.value })
            }
            required
          />

          <input
            type="text"
            placeholder="Título do semestre"
            className="border rounded-lg px-4 py-2"
            value={novoSemestre.titulo}
            onChange={(e) =>
              setNovoSemestre({ ...novoSemestre, titulo: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Descrição do semestre"
            className="border rounded-lg px-4 py-2"
            value={novoSemestre.descricao}
            onChange={(e) =>
              setNovoSemestre({ ...novoSemestre, descricao: e.target.value })
            }
          />

          <div className="md:col-span-3">
            <button
              type="submit"
              className="bg-purple-600 text-white px-5 py-2 rounded-lg"
            >
              Adicionar semestre
            </button>
          </div>
        </form>
      </div>

      {semestresOrdenados.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <p className="text-yellow-800">
            Nenhum semestre cadastrado ainda para este curso.
          </p>
        </div>
      ) : (
        semestresOrdenados.map((semestre) => {
          const idsSelecionados = selecionadas[semestre.id] || [];

          return (
            <div
              key={semestre.id}
              className="bg-white border rounded-xl p-6 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Semestre {semestre.numero}
                  {semestre.titulo ? ` — ${semestre.titulo}` : ""}
                </h3>

                {semestre.descricao ? (
                  <p className="text-sm text-gray-600 mt-1">
                    {semestre.descricao}
                  </p>
                ) : null}
              </div>

              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Disciplinas já vinculadas
                </h4>

                {semestre.disciplinas.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma disciplina vinculada ainda.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {semestre.disciplinas.map((item) => (
                      <span
                        key={item.id}
                        className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                      >
                        {item.disciplina.nome}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {disciplinas.length === 0 ? (
                <p className="text-gray-500">Nenhuma disciplina cadastrada.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {disciplinas.map((disciplina) => {
                      const marcada = idsSelecionados.includes(disciplina.id);

                      return (
                        <button
                          key={disciplina.id}
                          type="button"
                          onClick={() =>
                            toggleDisciplina(semestre.id, disciplina.id)
                          }
                          className={`text-left border rounded-lg p-3 cursor-pointer transition select-none ${
                            marcada
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={marcada}
                              readOnly
                              className="mt-1 pointer-events-none"
                            />

                            <div>
                              <p className="font-medium text-gray-900">
                                {disciplina.nome}
                              </p>
                              <p className="text-sm text-gray-500">
                                Código: {disciplina.codigo || "Não informado"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => salvarDisciplinas(semestre.id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                    >
                      Atualizar disciplinas do semestre {semestre.numero}
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}