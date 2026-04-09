"use client";

import { useEffect, useMemo, useState } from "react";

type Presenca = {
  id: number;
  status: string;
  observacao?: string;
  data?: string;
  aula?: string;
  turma?: string;
};

type RespostaApi = {
  ok: boolean;
  resumo: {
    total: number;
    presentes: number;
    faltas: number;
    justificadas: number;
    atestados: number;
  };
  items: Presenca[];
};

function formatarStatus(status?: string) {
  switch (status) {
    case "PRESENTE":
      return "Presente";
    case "FALTA":
      return "Falta";
    case "JUSTIFICADA":
      return "Justificada";
    case "ATESTADO":
      return "Atestado";
    default:
      return status || "-";
  }
}

function formatarData(data?: string) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return data;
  }
}

function classeStatus(status?: string) {
  switch (status) {
    case "PRESENTE":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "FALTA":
      return "border-red-200 bg-red-50 text-red-700";
    case "JUSTIFICADA":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ATESTADO":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function classeFrequencia(freq: number) {
  if (freq >= 75) return "text-emerald-600";
  if (freq >= 50) return "text-amber-600";
  return "text-red-600";
}

export default function PresencasAlunoPage() {
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        const res = await fetch("/api/aluno/presencas", {
          credentials: "include",
          cache: "no-store",
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json?.error || "Erro ao carregar presenças");
        }

        setDados(json);
      } catch (e: any) {
        setErro(e?.message || "Erro ao carregar presenças");
        setDados(null);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const freq = useMemo(() => {
    if (!dados) return 0;

    const presencasValidas =
      dados.resumo.presentes +
      dados.resumo.justificadas +
      dados.resumo.atestados;

    return dados.resumo.total > 0
      ? Math.round((presencasValidas / dados.resumo.total) * 100)
      : 0;
  }, [dados]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Minha Presença</h1>
          <p className="mt-2 text-sm text-slate-500">
            Carregando seus registros de frequência...
          </p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Minha Presença</h1>
        </div>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {erro}
        </div>
      </div>
    );
  }

  if (!dados) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Minha Presença</h1>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Nenhum dado de presença disponível.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Minha Presença</h1>
        <p className="mt-2 text-sm text-slate-500">
          Acompanhe sua frequência por aula e veja seu resumo de presença.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <CardResumo title="Total" value={dados.resumo.total} />
        <CardResumo title="Presentes" value={dados.resumo.presentes} variant="green" />
        <CardResumo title="Faltas" value={dados.resumo.faltas} variant="red" />
        <CardResumo
          title="Justificadas"
          value={dados.resumo.justificadas}
          variant="yellow"
        />
        <CardResumo title="Atestados" value={dados.resumo.atestados} variant="blue" />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">Frequência</p>
        <p className={`mt-2 text-3xl font-bold ${classeFrequencia(freq)}`}>
          {freq}%
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Considerando presenças, justificadas e atestados como frequência válida.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Histórico de presença
          </h2>

          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {dados.items.length} registro(s)
          </span>
        </div>

        {dados.items.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            Nenhum registro de presença encontrado.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {dados.items.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {p.aula || "Aula não informada"}
                      </h3>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${classeStatus(
                          p.status
                        )}`}
                      >
                        {formatarStatus(p.status)}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-1 text-sm text-slate-600 sm:grid-cols-2">
                      <p>
                        <strong className="font-medium text-slate-800">
                          Turma:
                        </strong>{" "}
                        {p.turma || "-"}
                      </p>

                      <p>
                        <strong className="font-medium text-slate-800">
                          Data:
                        </strong>{" "}
                        {formatarData(p.data)}
                      </p>
                    </div>

                    {p.observacao && (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="mb-1 text-sm font-semibold text-slate-800">
                          Observação
                        </p>
                        <p className="text-sm text-slate-700 whitespace-pre-line">
                          {p.observacao}
                        </p>
                      </div>
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

function CardResumo({
  title,
  value,
  variant = "default",
}: {
  title: string;
  value: number;
  variant?: "default" | "green" | "red" | "yellow" | "blue";
}) {
  const classes = {
    default: "border-slate-200 bg-slate-50 text-slate-900",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${classes[variant]}`}>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}