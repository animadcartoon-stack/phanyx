"use client";

import { useEffect, useMemo, useState } from "react";

type TurmaFiltro = {
  id: number;
  nome: string;
  disciplinaNome?: string | null;
};

type AlunoProfessor = {
  itemMatriculaId: number;
  alunoId: number;
  nome: string;
  email?: string | null;
  matricula?: string | null;
  statusAluno?: string | null;
  statusDisciplina?: string | null;
  turma?: {
    id: number;
    nome: string;
    semestre?: string | null;
  } | null;
  disciplina?: {
    id: number | null;
    nome?: string | null;
  } | null;
  notas: number[];
  media: number | null;
  frequencia: {
    total: number;
    presente: number;
    falta: number;
    justificada: number;
    atestado: number;
    percentual: number | null;
  };
};

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

function labelStatusDisciplina(status?: string | null) {
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

function normalizarTexto(valor?: string | number | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const matriz = Array.from({ length: b.length + 1 }, (_, i) =>
    Array(a.length + 1).fill(0)
  );

  for (let i = 0; i <= b.length; i++) matriz[i][0] = i;
  for (let j = 0; j <= a.length; j++) matriz[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const custo = b[i - 1] === a[j - 1] ? 0 : 1;

      matriz[i][j] = Math.min(
        matriz[i - 1][j] + 1,
        matriz[i][j - 1] + 1,
        matriz[i - 1][j - 1] + custo
      );
    }
  }

  return matriz[b.length][a.length];
}

function calcularPontuacaoBusca(texto: string, termo: string) {
  const normalTexto = normalizarTexto(texto);
  const normalTermo = normalizarTexto(termo);

  if (!normalTermo) return 0;

  if (normalTexto.startsWith(normalTermo)) return 1000;

  const palavras = normalTexto.split(/\s+/).filter(Boolean);

  if (palavras.some((palavra) => palavra.startsWith(normalTermo))) {
    return 900;
  }

  if (normalTexto.includes(normalTermo)) return 800;

  let melhorScore = 0;

  for (const palavra of palavras) {
    const pedacoInicial = palavra.slice(0, normalTermo.length);
    const distanciaInicio = distanciaLevenshtein(pedacoInicial, normalTermo);

    if (distanciaInicio <= Math.max(1, Math.floor(normalTermo.length / 3))) {
      melhorScore = Math.max(melhorScore, 700);
    }

    const distanciaPalavraInteira = distanciaLevenshtein(palavra, normalTermo);

    if (
      normalTermo.length >= 4 &&
      distanciaPalavraInteira <= Math.max(1, Math.floor(normalTermo.length / 3))
    ) {
      melhorScore = Math.max(melhorScore, 600);
    }
  }

  return melhorScore;
}

function textoAlunoBusca(aluno: AlunoProfessor) {
  return normalizarTexto(
    [
      aluno.nome,
      aluno.email,
      aluno.matricula,
      aluno.turma?.nome,
      aluno.turma?.semestre,
      aluno.disciplina?.nome,
      aluno.statusAluno,
      aluno.statusDisciplina,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export default function ProfessorAlunosPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [alunos, setAlunos] = useState<AlunoProfessor[]>([]);
  const [turmas, setTurmas] = useState<TurmaFiltro[]>([]);

  async function carregarDados() {
    try {
      setLoading(true);
      setErro("");

      const query = new URLSearchParams();
      
      if (turmaId) query.set("turmaId", turmaId);

      const res = await fetch(`/api/professor/alunos?${query.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar alunos");
      }

      setAlunos(Array.isArray(data?.alunos) ? data.alunos : []);
      setTurmas(Array.isArray(data?.turmas) ? data.turmas : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar alunos");
      setAlunos([]);
      setTurmas([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      carregarDados();
    }, 300);

    return () => clearTimeout(t);
  }, [busca, turmaId]);

  const resumo = useMemo(() => {
    const total = alunos.length;
    const comAtestado = alunos.filter((a) => a.frequencia.atestado > 0).length;
    const comFaltas = alunos.filter((a) => a.frequencia.falta > 0).length;
    const mediaGeral =
      alunos.length > 0
        ? Number(
            (
              alunos.reduce((acc, a) => acc + Number(a.media || 0), 0) /
              alunos.length
            ).toFixed(2)
          )
        : 0;

    return { total, comAtestado, comFaltas, mediaGeral };
  }, [alunos]);

    const alunosFiltrados = useMemo(() => {
  const termo = normalizarTexto(busca);

  if (!termo) return alunos;

  return [...alunos]
    .map((aluno) => ({
      ...aluno,
      scoreBusca: Math.max(
        calcularPontuacaoBusca(aluno.nome || "", busca),
        calcularPontuacaoBusca(aluno.email || "", busca),
        calcularPontuacaoBusca(aluno.matricula || "", busca),
        calcularPontuacaoBusca(aluno.turma?.nome || "", busca),
        calcularPontuacaoBusca(aluno.turma?.semestre || "", busca),
        calcularPontuacaoBusca(aluno.disciplina?.nome || "", busca)
      ),
    }))
    .filter((aluno) => aluno.scoreBusca > 0)
    .sort((a, b) => b.scoreBusca - a.scoreBusca);
}, [alunos, busca]);

  const sugestoesBusca = useMemo(() => {
  const termo = normalizarTexto(busca);

  if (!termo) return [];

  return alunosFiltrados
    .slice(0, 8)
    .map((aluno) => ({
      chave: String(aluno.itemMatriculaId),
      alunoNome: aluno.nome,
      turmaNome: aluno.turma?.nome || "Turma não informada",
      disciplinaNome: aluno.disciplina?.nome || "Disciplina não informada",
      semestre: aluno.turma?.semestre || "Período não informado",
    }));
}, [busca, alunosFiltrados]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">👨‍🎓 Alunos do Professor</h1>
        <p className="text-gray-600 mt-1">
          Acompanhe notas, frequência, faltas, atestados e desempenho acadêmico.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Alunos</p>
          <p className="text-2xl font-bold">{resumo.total}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Com faltas</p>
          <p className="text-2xl font-bold">{resumo.comFaltas}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Com atestado</p>
          <p className="text-2xl font-bold">{resumo.comAtestado}</p>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <p className="text-sm text-gray-500">Média geral</p>
          <p className="text-2xl font-bold">{resumo.mediaGeral}</p>
        </div>
      </div>

     <div className="bg-white border rounded-xl p-4 flex flex-col md:flex-row gap-3">
  <div className="relative flex-1">
    <input
      type="text"
      placeholder="Buscar por aluno, turma, tarefa, período ou disciplina"
      value={busca}
      onChange={(e) => setBusca(e.target.value)}
      className="w-full border rounded-lg p-2"
    />

    {busca.trim() && (
      <div className="absolute left-0 right-0 top-[46px] z-50 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
        {sugestoesBusca.length === 0 ? (
          <p className="px-3 py-3 text-sm text-slate-500">
            Nenhuma sugestão encontrada.
          </p>
        ) : (
          sugestoesBusca.map((item) => (
            <button
              key={item.chave}
              type="button"
              onClick={() => setBusca(item.alunoNome)}
              className="w-full rounded-xl px-3 py-3 text-left hover:bg-blue-50"
            >
              <p className="text-sm font-black text-slate-900">
                {item.alunoNome}
              </p>
              <p className="text-xs text-slate-600">
                Turma {item.turmaNome} • {item.semestre}
              </p>
              <p className="text-xs font-semibold text-blue-700">
                {item.disciplinaNome}
              </p>
            </button>
          ))
        )}
      </div>
    )}
  </div>

  <select
    value={turmaId}
    onChange={(e) => setTurmaId(e.target.value)}
    className="w-full md:w-80 border rounded-lg p-2 bg-white"
  >
    <option value="">Todas as turmas</option>
    {turmas.map((turma) => (
      <option key={turma.id} value={String(turma.id)}>
        {turma.nome}
        {turma.disciplinaNome ? ` — ${turma.disciplinaNome}` : ""}
      </option>
    ))}
  </select>
</div>

      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          Carregando alunos...
        </div>
      ) : alunosFiltrados.length === 0 ? (
        <div className="bg-white border rounded-xl p-6 text-gray-600">
          Nenhum aluno encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {alunosFiltrados.map((aluno) => (
            <div key={aluno.itemMatriculaId} className="bg-white border rounded-xl p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-lg">{aluno.nome}</p>
                  <p className="text-sm text-gray-600">{aluno.email || "-"}</p>
                  <p className="text-sm text-gray-600">
                    Matrícula: {aluno.matricula || "-"}
                  </p>
                </div>

                <div className="text-sm text-gray-700 space-y-1">
                  <p>Status aluno: {labelStatusAluno(aluno.statusAluno)}</p>
                  <p>Status disciplina: {labelStatusDisciplina(aluno.statusDisciplina)}</p>
                  <p>Turma: {aluno.turma?.nome || "-"}</p>
                  <p>Disciplina: {aluno.disciplina?.nome || "-"}</p>
                  <p>Semestre: {aluno.turma?.semestre || "-"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Notas</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Lançadas: {aluno.notas.length}
                  </p>
                  <p className="text-sm text-gray-700">
                    Média: {aluno.media ?? "-"}
                  </p>
                  <p className="text-sm text-gray-700">
                    Valores: {aluno.notas.length > 0 ? aluno.notas.join(", ") : "-"}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Frequência</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Percentual: {aluno.frequencia.percentual ?? "-"}%
                  </p>
                  <p className="text-sm text-gray-700">
                    Presenças: {aluno.frequencia.presente}
                  </p>
                  <p className="text-sm text-gray-700">
                    Faltas: {aluno.frequencia.falta}
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <p className="text-sm text-gray-500">Justificativas</p>
                  <p className="mt-2 text-sm text-gray-700">
                    Justificadas: {aluno.frequencia.justificada}
                  </p>
                  <p className="text-sm text-gray-700">
                    Atestados: {aluno.frequencia.atestado}
                  </p>
                  <p className="text-sm text-gray-700">
                    Total de registros: {aluno.frequencia.total}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}