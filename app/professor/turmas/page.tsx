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

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
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
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
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
  if (status.includes("INICIAR") || status.includes("PROXIMO") || status.includes("PRÓXIMO")) return "Próximo semestre";
  return "Semestre atual";
}

function turnoDaTurma(turma: Turma) {
  const texto = `${turma.periodoLetivo || ""} ${turma.semestre || ""} ${turma.nome || ""}`.toLowerCase();

  if (texto.includes("matutino") || texto.includes("manhã") || texto.includes("manha")) return "Matutino";
  if (texto.includes("vespertino") || texto.includes("tarde")) return "Vespertino";
  if (texto.includes("noturno") || texto.includes("noite")) return "Noturno";
  return "EAD / Livre";
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

function CardTurma({
  turma,
  hoje,
  router,
}: {
  turma: Turma;
  hoje: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
        hoje ? "border-green-400 ring-2 ring-green-100" : "border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">Turma: {turma.nome}</h3>
          {hoje && (
            <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
              Aula de hoje
            </span>
          )}
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {turma.statusDisciplina || turma.statusTurma || "Status não informado"}
        </span>
      </div>

      <div className="mt-4 space-y-1 text-sm text-slate-700">
        <p><strong>Curso:</strong> {turma.curso?.nome || "—"}</p>
        <p><strong>Disciplina:</strong> {turma.disciplina?.nome || "—"}</p>
        <p><strong>Horário/período:</strong> {turma.periodoLetivo || "EAD / Livre"}</p>
        <p><strong>Início:</strong> {formatarData(turma.dataInicio)}</p>
        <p><strong>Fim:</strong> {formatarData(turma.dataFim)}</p>
        <p><strong>Alunos:</strong> {turma.alunos}</p>
      </div>

      {hoje && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
          Prepare esta aula para hoje.
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <button
          onClick={() => router.push(`/professor/turmas/${turma.id}`)}
          className="rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Ver alunos
        </button>

        <button
          onClick={() =>
  router.push(
    `/professor/turmas/${turma.id}/aulas?disciplinaId=${turma.disciplina?.id}`
  )
}
          className="rounded-xl border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
        >
          Gerenciar aulas
        </button>

        <button
          onClick={() => router.push(`/professor/turmas/${turma.id}/boletim`)}
          className="rounded-xl border border-green-200 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          Ver boletim
        </button>
      </div>
    </div>
  );
}

export default function TurmasProfessorPage() {
  const router = useRouter();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [abertos, setAbertos] = useState<Record<string, boolean>>({
    "Semestre atual": true,
    "Próximo semestre": true,
    "Turmas concluídas": false,
  });

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

  const grupos = useMemo(() => {
    const base: Record<string, Turma[]> = {
      "Semestre atual": [],
      "Próximo semestre": [],
      "Turmas concluídas": [],
    };

    for (const turma of turmas) {
      base[grupoSemestre(turma)].push(turma);
    }

    return base;
  }, [turmas]);

  if (loading) {
    return <main className="p-8 bg-white text-gray-900 min-h-screen">Carregando turmas...</main>;
  }

  if (erro) {
    return (
      <main className="p-8 bg-white text-gray-900 min-h-screen space-y-4">
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
        ⬅ Voltar
      </button>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Agenda docente
        </p>

        <h1 className="mt-2 text-3xl font-bold">📚 Minhas Turmas</h1>

        <p className="mt-2 text-slate-600">
          Organização por semestre, dia da semana e turno para facilitar a rotina do professor.
        </p>

        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          Hoje é <strong>{hoje}</strong>.
          {feriado ? (
            <span className="block mt-1">
              🎉 Bom feriado! Hoje é <strong>{feriado}</strong>. Verifique se sua instituição mantém aula presencial, EAD, reposição ou atividade gravada.
            </span>
          ) : (
            <span className="block mt-1">
              As turmas do dia ficam destacadas em verde para ajudar no preparo das aulas.
            </span>
          )}
        </div>
      </section>

      {Object.entries(grupos).map(([nomeGrupo, lista]) => (
        <section key={nomeGrupo} className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <button
            type="button"
            onClick={() => setAbertos((prev) => ({ ...prev, [nomeGrupo]: !prev[nomeGrupo] }))}
            className="flex w-full items-center justify-between px-6 py-5 text-left"
          >
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{nomeGrupo}</h2>
              <p className="text-sm text-slate-500">{lista.length} turma(s)</p>
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {abertos[nomeGrupo] ? "▲ Fechar" : "▼ Abrir"}
            </span>
          </button>

          {abertos[nomeGrupo] && (
            <div className="space-y-6 border-t border-slate-100 p-6">
              {DIAS.map((dia) => {
                const turmasDoDia = lista.filter((t) => diaDaTurma(t) === dia);
                const diaAtual = dia === hoje;

                return (
                  <div
                    key={dia}
                    className={`rounded-2xl border p-4 ${
                      diaAtual ? "border-green-300 bg-green-50/60" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <h3 className={`text-lg font-bold ${diaAtual ? "text-green-700" : "text-slate-800"}`}>
                      {dia} {diaAtual ? "• Hoje" : ""}
                    </h3>

                    <div className="mt-4 grid gap-4 xl:grid-cols-4">
                      {TURNOS.map((turno) => {
                        const turmasDoTurno = turmasDoDia.filter((t) => turnoDaTurma(t) === turno);

                        return (
                          <div key={turno} className="rounded-2xl border border-slate-200 bg-white p-4">
                            <h4 className="mb-3 font-bold text-slate-700">{turno}</h4>

                            {turmasDoTurno.length === 0 ? (
                              <p className="text-sm text-slate-400">Nenhuma turma.</p>
                            ) : (
                              <div className="space-y-3">
                                {turmasDoTurno.map((turma) => (
                                  <CardTurma
                                    key={`${turma.turmaDisciplinaId || turma.id}-${turno}`}
                                    turma={turma}
                                    hoje={diaAtual}
                                    router={router}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ))}

      {turmas.length === 0 && (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
          Nenhuma turma encontrada.
        </p>
      )}
    </main>
  );
}