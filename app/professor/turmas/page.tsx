"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Turma = {
  id: number;
  turmaDisciplinaId: number;
  nome: string;
  semestre: string;
  periodoLetivo?: string | null;
  statusTurma?: string | null;
  alunos: number;
  curso?: { id: number; nome: string } | null;
  disciplina?: { id: number; nome: string } | null;
  statusDisciplina?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
};

type TurmaAgrupada = {
  chave: string;
  id: number;
  nome: string;
  semestre: string;
  periodoLetivo?: string | null;
  statusTurma?: string | null;
  alunos: number;
  curso?: { id: number; nome: string } | null;
  statusDisciplina?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  disciplinasPorTurno: Record<string, Turma[]>;
};

const TURNOS = ["Matutino", "Vespertino", "Noturno", "EAD / Livre"];

function formatarData(data?: string | null) {
  if (!data) return "—";
  return new Date(data).toLocaleDateString("pt-BR");
}

function diaSemanaHoje() {
  const dia = new Date().getDay();
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dia];
}

function calcularPascoa(ano: number) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDias(data: Date, dias: number) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

function chaveData(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(
    data.getDate()
  ).padStart(2, "0")}`;
}

function feriadoNacionalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const pascoa = calcularPascoa(ano);

  const feriados: Record<string, string> = {
    [`${ano}-01-01`]: "Confraternização Universal",
    [`${ano}-04-21`]: "Tiradentes",
    [`${ano}-05-01`]: "Dia do Trabalhador",
    [`${ano}-09-07`]: "Independência do Brasil",
    [`${ano}-10-12`]: "Nossa Senhora Aparecida",
    [`${ano}-11-02`]: "Finados",
    [`${ano}-11-15`]: "Proclamação da República",
    [`${ano}-12-25`]: "Natal",
    [chaveData(addDias(pascoa, -48))]: "Carnaval",
    [chaveData(addDias(pascoa, -47))]: "Carnaval",
    [chaveData(addDias(pascoa, -2))]: "Sexta-feira Santa",
    [chaveData(addDias(pascoa, 60))]: "Corpus Christi",
  };

  return feriados[chaveData(hoje)] || null;
}

function statusNormalizado(turma: Turma) {
  return String(turma.statusDisciplina || turma.statusTurma || "").toUpperCase();
}

function grupoSemestre(turma: Turma) {
  const status = statusNormalizado(turma);
  if (status.includes("CONCLUID") || status.includes("ENCERRAD")) return "Turmas concluídas";
  if (status.includes("INICIAR") || status.includes("PROXIMO") || status.includes("PRÓXIMO")) {
    return "Próximo semestre";
  }
  return "Semestre atual";
}

function turnoDaTurma(turma: Turma) {
  const periodo = String(turma.periodoLetivo || "").trim();

  if (periodo) return periodo;

  const texto = `${turma.semestre || ""} ${turma.nome || ""}`.toLowerCase();

  if (texto.includes("matutino") || texto.includes("manhã") || texto.includes("manha")) {
    return "Matutino";
  }

  if (texto.includes("vespertino") || texto.includes("tarde")) {
    return "Vespertino";
  }

  if (texto.includes("noturno") || texto.includes("noite")) {
    return "Noturno";
  }

  return "Período não informado";
}
function diaDaTurma(turma: Turma) {
  const texto = `${turma.periodoLetivo || ""} ${turma.semestre || ""} ${turma.nome || ""}`.toLowerCase();

  if (texto.includes("segunda")) return "Segunda";
  if (texto.includes("terça") || texto.includes("terca")) return "Terça";
  if (texto.includes("quarta")) return "Quarta";
  if (texto.includes("quinta")) return "Quinta";
  if (texto.includes("sexta")) return "Sexta";
  if (texto.includes("sábado") || texto.includes("sabado")) return "Sábado";

  return "Segunda";
}

function normalizarTexto(valor?: string | number | null) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function textoBuscaTurma(turma: Turma) {
  return normalizarTexto(
    [
      turma.nome,
      turma.semestre,
      turma.periodoLetivo,
      turma.statusTurma,
      turma.statusDisciplina,
      turma.curso?.nome,
      turma.disciplina?.nome,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function agruparPorTurma(turmas: Turma[]) {
  const mapa = new Map<string, TurmaAgrupada>();

  for (const item of turmas) {
    const chave = `${item.id}-${item.curso?.id || "sem-curso"}-${item.nome}`;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        chave,
        id: item.id,
        nome: item.nome,
        semestre: item.semestre,
        periodoLetivo: item.periodoLetivo,
        statusTurma: item.statusTurma,
        alunos: item.alunos,
        curso: item.curso,
        statusDisciplina: item.statusDisciplina,
        dataInicio: item.dataInicio,
        dataFim: item.dataFim,
        disciplinasPorTurno: {},
      });
    }

    const grupo = mapa.get(chave)!;
    const turno = turnoDaTurma(item);

    if (!grupo.disciplinasPorTurno[turno]) {
      grupo.disciplinasPorTurno[turno] = [];
    }

    grupo.disciplinasPorTurno[turno].push(item);
  }

  return Array.from(mapa.values());
}

function TurmaAgrupadaCard({
  turma,
  hoje,
  router,
  buscaAtiva,
}: {
  turma: TurmaAgrupada;
  hoje: string;
  router: ReturnType<typeof useRouter>;
  buscaAtiva: boolean;
}) {
  const [aberta, setAberta] = useState(false);
  const [periodosAbertos, setPeriodosAbertos] = useState<Record<string, boolean>>({});

useEffect(() => {
  if (buscaAtiva) {
    setAberta(true);
  }
}, [buscaAtiva]);

  const todasDisciplinas = Object.values(turma.disciplinasPorTurno).flat();
  const temAulaHoje = todasDisciplinas.some((disciplina) => diaDaTurma(disciplina) === hoje);

  return (
    <article
      className={`rounded-3xl border bg-white shadow-sm transition ${
        temAulaHoje ? "border-green-300 ring-2 ring-green-100" : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={() => setAberta((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-black text-slate-900">Turma {turma.nome}</h3>

            {temAulaHoje && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                Aula hoje
              </span>
            )}

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {turma.statusDisciplina || turma.statusTurma || "Status não informado"}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-700">
            <strong>Curso:</strong> {turma.curso?.nome || "—"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {todasDisciplinas.length} disciplina(s) • {turma.alunos} aluno(s)
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Início: {formatarData(turma.dataInicio)} • Fim: {formatarData(turma.dataFim)}
          </p>
        </div>

        <span className="shrink-0 pt-1 text-sm font-bold text-blue-700">
          {aberta ? "▲ Fechar" : "▼ Abrir"}
        </span>
      </button>

      {aberta && (
        <div className="border-t border-slate-100 p-5">
          {temAulaHoje && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              Esta turma possui aula hoje. Prepare os materiais, atividades ou aulas correspondentes.
            </div>
          )}

          <div className="space-y-4">
            {Object.keys(turma.disciplinasPorTurno).map((turno) => {
  const disciplinas = turma.disciplinasPorTurno[turno] || [];

  if (disciplinas.length === 0) return null;

  const periodoAberto = periodosAbertos[turno] ?? false;

  return (
    <section
      key={turno}
      className="rounded-2xl border border-slate-200 bg-slate-50"
    >
      <button
        type="button"
        onClick={() =>
          setPeriodosAbertos((prev) => ({
            ...prev,
            [turno]: !periodoAberto,
          }))
        }
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div>
          <h4 className="font-black text-slate-800">
            Período {turno}
          </h4>

          <p className="text-sm text-slate-500">
            {disciplinas.length} disciplina(s)
          </p>
        </div>

        <span className="text-sm font-black text-blue-700">
          {periodoAberto ? "▲ Fechar" : "▼ Abrir"}
        </span>
      </button>

      {periodoAberto && (
        <div className="space-y-3 border-t border-slate-200 p-4">
                    {disciplinas.map((disciplina) => {
                      const disciplinaHoje = diaDaTurma(disciplina) === hoje;

                      return (
                        <div
                          key={`${disciplina.turmaDisciplinaId || disciplina.id}-${disciplina.disciplina?.id}`}
                          className={`rounded-2xl border bg-white p-4 ${
                            disciplinaHoje ? "border-green-300" : "border-slate-200"
                          }`}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-base font-black text-slate-900">
                                {disciplina.disciplina?.nome || "Disciplina não informada"}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                <strong>Período:</strong> {disciplina.periodoLetivo || "EAD / Livre"}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                <strong>Início:</strong> {formatarData(disciplina.dataInicio)}{" "}
                                <strong className="ml-2">Fim:</strong> {formatarData(disciplina.dataFim)}
                              </p>
                            </div>

                            {disciplinaHoje && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                                Hoje
                              </span>
                            )}
                          </div>

                          <div className="mt-4 grid gap-2 sm:grid-cols-3">
                            <button
                              onClick={() => router.push(`/professor/turmas/${disciplina.id}`)}
                              className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
                            >
                              Ver alunos
                            </button>

                            <button
                              onClick={() =>
                                router.push(
                                  `/professor/turmas/${disciplina.id}/aulas?disciplinaId=${disciplina.disciplina?.id}`
                                )
                              }
                              className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                            >
                              Gerenciar aulas
                            </button>

                            <button
                              onClick={() => router.push(`/professor/turmas/${disciplina.id}/boletim`)}
                              className="rounded-xl border border-green-200 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-50"
                            >
                              Ver boletim
                            </button>
                          </div>
                        </div>
                      );
                    })}
                          </div>
      )}
    </section>
  );
})}
          </div>
        </div>
      )}
    </article>
  );
}

export default function TurmasProfessorPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
  "Semestre atual": false,
  "Próximo semestre": false,
  "Turmas concluídas": false,
});

  const [cursosAbertos, setCursosAbertos] = useState<Record<string, boolean>>({});

  const hoje = diaSemanaHoje();
  const feriado = feriadoNacionalHoje();

  useEffect(() => {
    async function carregarTurmas() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/professor/turmas", {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Erro ao carregar turmas");
        }

        const listaTurmas = Array.isArray(data)
          ? data
          : Array.isArray(data?.turmas)
          ? data.turmas
          : [];

        setTurmas(listaTurmas);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar turmas");
        setTurmas([]);
      } finally {
        setLoading(false);
      }
    }

    carregarTurmas();
  }, []);

  const turmasFiltradas = useMemo(() => {
    const termo = normalizarTexto(busca);

    if (!termo) return turmas;

    return turmas.filter((turma) => textoBuscaTurma(turma).includes(termo));
  }, [turmas, busca]);

  const grupos = useMemo(() => {
    const base: Record<string, Turma[]> = {
      "Semestre atual": [],
      "Próximo semestre": [],
      "Turmas concluídas": [],
    };

    for (const turma of turmasFiltradas) {
      base[grupoSemestre(turma)].push(turma);
    }

    return base;
  }, [turmasFiltradas]);

    const buscaAtiva = busca.trim().length > 0;

    const sugestoesBusca = useMemo(() => {
  const termo = normalizarTexto(busca);

  if (!termo) return [];

  return turmasFiltradas.slice(0, 8).map((turma) => ({
    chave: `${turma.turmaDisciplinaId || turma.id}-${turma.disciplina?.id || "sem-disciplina"}`,
    turmaNome: turma.nome,
    cursoNome: turma.curso?.nome || "Curso não informado",
    disciplinaNome: turma.disciplina?.nome || "Disciplina não informada",
    periodo: turma.periodoLetivo || "EAD / Livre",
  }));
}, [busca, turmasFiltradas]);

  const totalTurmasAgrupadas = useMemo(() => {
    return Object.values(grupos).reduce((acc, lista) => acc + agruparPorTurma(lista).length, 0);
  }, [grupos]);

const gruposPorCurso = useMemo(() => {
  const resultado: Record<string, Record<string, Turma[]>> = {};

  for (const [nomeGrupo, lista] of Object.entries(grupos)) {
    resultado[nomeGrupo] = {};

    for (const turma of lista) {
      const nomeCurso = turma.curso?.nome || "Curso não informado";

      if (!resultado[nomeGrupo][nomeCurso]) {
        resultado[nomeGrupo][nomeCurso] = [];
      }

      resultado[nomeGrupo][nomeCurso].push(turma);
    }
  }

  return resultado;
}, [grupos]);

  if (loading) {
    return <main className="min-h-screen bg-white p-8 text-gray-900">Carregando turmas...</main>;
  }

  if (erro) {
    return (
      <main className="min-h-screen space-y-4 bg-white p-8 text-gray-900">
        <p className="font-bold text-red-600">Erro</p>
        <p className="text-gray-700">{erro}</p>
        <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
          Tentar novamente
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-8 text-gray-900">
      <button onClick={() => router.back()} className="text-blue-600 hover:underline">
        ← Voltar
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Agenda docente
        </p>

        <h1 className="mt-2 text-3xl font-bold">📚 Minhas Turmas</h1>

        <p className="mt-2 text-slate-600">
          Organização por turma, turno e disciplina para facilitar a rotina do professor.
        </p>

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Hoje é <strong>{hoje}</strong>.
          {feriado ? (
            <span className="mt-1 block">
              🎉 Bom feriado! Hoje é <strong>{feriado}</strong>. Verifique se sua instituição mantém
              aula presencial, EAD, reposição ou atividade gravada.
            </span>
          ) : (
            <span className="mt-1 block">
              As turmas com aula hoje ficam destacadas em verde para ajudar no preparo das aulas.
            </span>
          )}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
  <input
    value={busca}
    onChange={(e) => {
      const valor = e.target.value;
      setBusca(valor);

      if (valor.trim()) {
        setAbertos({
          "Semestre atual": true,
          "Próximo semestre": true,
          "Turmas concluídas": true,
        });
      }
    }}
    placeholder="Buscar por turma, curso, disciplina, período ou status..."
    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
  />

  {busca.trim() && (
    <div className="absolute left-0 right-0 top-[56px] z-50 max-h-80 overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
      {sugestoesBusca.length === 0 ? (
        <p className="px-3 py-3 text-sm text-slate-500">
          Nenhuma sugestão encontrada.
        </p>
      ) : (
        sugestoesBusca.map((item) => (
          <button
            key={item.chave}
            type="button"
            onClick={() => {
              setBusca(item.disciplinaNome);
              setAbertos({
                "Semestre atual": true,
                "Próximo semestre": true,
                "Turmas concluídas": true,
              });
            }}
            className="w-full rounded-xl px-3 py-3 text-left hover:bg-blue-50"
          >
            <p className="text-sm font-black text-slate-900">
              {item.disciplinaNome}
            </p>

            <p className="text-xs text-slate-600">
              Turma {item.turmaNome} • {item.periodo}
            </p>

            <p className="text-xs font-semibold text-blue-700">
              {item.cursoNome}
            </p>
          </button>
        ))
      )}
    </div>
  )}
</div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
            {totalTurmasAgrupadas} turma(s) • {turmasFiltradas.length} disciplina(s)
          </div>
        </div>
      </section>

            {Object.entries(gruposPorCurso)
        .filter(([nomeGrupo]) => !buscaAtiva || (grupos[nomeGrupo]?.length || 0) > 0)
        .map(([nomeGrupo, cursos]) => {
          const lista = Object.values(cursos).flat();

          return (
            <section
              key={nomeGrupo}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() =>
                  setAbertos((prev) => ({
                    ...prev,
                    [nomeGrupo]: !prev[nomeGrupo],
                  }))
                }
                className="flex w-full items-center justify-between px-6 py-5 text-left"
              >
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {nomeGrupo}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {Object.values(cursos).reduce(
                      (acc, listaCurso) =>
                        acc + agruparPorTurma(listaCurso).length,
                      0
                    )}{" "}
                    turma(s) • {lista.length} disciplina(s)
                  </p>
                </div>

                <span className="text-sm font-semibold text-slate-500">
                  {abertos[nomeGrupo] ? "▲ Fechar" : "▼ Abrir"}
                </span>
              </button>

              {(abertos[nomeGrupo]) && (
                <div className="space-y-4 border-t border-slate-100 p-6">
                  {lista.length === 0 ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Nenhuma turma encontrada neste grupo.
                    </p>
                  ) : (
                    <div className="space-y-5">
                      {Object.entries(cursos).map(([nomeCurso, listaCurso]) => {
                        const turmasAgrupadas = agruparPorTurma(listaCurso);
                        const chaveCurso = `${nomeGrupo}-${nomeCurso}`;
                        const cursoAberto = cursosAbertos[chaveCurso] ?? false;

                        return (
                          <section
                            key={chaveCurso}
                            className="rounded-3xl border border-blue-100 bg-blue-50/40"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setCursosAbertos((prev) => ({
                                  ...prev,
                                  [chaveCurso]: !prev[chaveCurso],
                                }))
                              }
                              className="flex w-full items-center justify-between gap-4 p-4 text-left"
                            >
                              <div>
                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                                  Curso
                                </p>

                                <h3 className="text-xl font-black text-slate-900">
                                  {nomeCurso}
                                </h3>

                                <p className="text-sm text-slate-600">
                                  {turmasAgrupadas.length} turma(s) •{" "}
                                  {listaCurso.length} disciplina(s)
                                </p>
                              </div>

                              <span className="text-sm font-black text-blue-700">
                                {cursoAberto ? "▲ Fechar" : "▼ Abrir"}
                              </span>
                            </button>

                            {cursoAberto && (
                              <div className="space-y-4 border-t border-blue-100 p-4">
                                {turmasAgrupadas.map((turma) => (
                                  <TurmaAgrupadaCard
                                    key={turma.chave}
                                    turma={turma}
                                    hoje={hoje}
                                    router={router}
                                    buscaAtiva={busca.trim().length > 0}
                                  />
                                ))}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}

      {turmas.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Nenhuma turma encontrada.
        </p>
      )}
    </main>
  );
}