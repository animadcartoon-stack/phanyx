"use client";

import { useEffect, useMemo, useState } from "react";

type RegistroPonto = {
  id: number;
  data: string;
  horasExtras?: string | number | null;
  horasAtraso?: string | number | null;
  funcionario: {
    id: number;
    nome: string;
    cargo?: string | null;
    departamento?: {
      nome: string;
    } | null;
  };
};

function numero(v: any) {
  return Number(v || 0);
}

function formatarHoras(v: number) {
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  return `${sinal}${Math.abs(v).toFixed(2)}h`;
}

export default function BancoHorasPage() {
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch("/api/admin/rh/ponto", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar banco de horas.");
      }

      setPontos(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setErro(e.message || "Erro ao carregar banco de horas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const mapa = new Map<number, any>();

    pontos.forEach((p) => {
      const funcionarioId = p.funcionario?.id;
      if (!funcionarioId) return;

      const atual =
        mapa.get(funcionarioId) || {
          funcionario: p.funcionario,
          creditos: 0,
          debitos: 0,
          saldo: 0,
          registros: 0,
          ultimaData: p.data,
        };

      const credito = numero(p.horasExtras);
      const debito = numero(p.horasAtraso);

      atual.creditos += credito;
      atual.debitos += debito;
      atual.saldo += credito - debito;
      atual.registros += 1;

      if (new Date(p.data).getTime() > new Date(atual.ultimaData).getTime()) {
        atual.ultimaData = p.data;
      }

      mapa.set(funcionarioId, atual);
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.funcionario.nome.localeCompare(b.funcionario.nome, "pt-BR")
    );
  }, [pontos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return resumo;

    return resumo.filter((r) => {
      const nome = String(r.funcionario?.nome || "").toLowerCase();
      const cargo = String(r.funcionario?.cargo || "").toLowerCase();
      const depto = String(r.funcionario?.departamento?.nome || "").toLowerCase();

      return (
        nome.includes(termo) ||
        cargo.includes(termo) ||
        depto.includes(termo)
      );
    });
  }, [resumo, busca]);

  const totais = useMemo(() => {
    return resumo.reduce(
      (acc, r) => {
        acc.creditos += r.creditos;
        acc.debitos += r.debitos;
        acc.saldo += r.saldo;
        acc.funcionarios += 1;
        return acc;
      },
      { creditos: 0, debitos: 0, saldo: 0, funcionarios: 0 }
    );
  }, [resumo]);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            PHANYX RH
          </p>

          <h1 className="mt-2 text-3xl font-bold">Banco de Horas</h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Acompanhe créditos, débitos e saldo acumulado de horas por
            funcionário com base nos registros de ponto.
          </p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            {erro}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Funcionários</p>
            <p className="mt-2 text-2xl font-bold">{totais.funcionarios}</p>
          </div>

          <div className="rounded-3xl border border-emerald-500/20 bg-emerald-950/20 p-5">
            <p className="text-sm text-emerald-200">Créditos</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">
              {formatarHoras(totais.creditos)}
            </p>
          </div>

          <div className="rounded-3xl border border-red-500/20 bg-red-950/20 p-5">
            <p className="text-sm text-red-200">Débitos</p>
            <p className="mt-2 text-2xl font-bold text-red-300">
              {formatarHoras(-totais.debitos)}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-500/20 bg-blue-950/20 p-5">
            <p className="text-sm text-blue-200">Saldo Geral</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                totais.saldo >= 0 ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {formatarHoras(totais.saldo)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold">Saldo por funcionário</h2>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por funcionário, cargo ou departamento"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:w-[420px]"
            />
          </div>

          {carregando ? (
            <div className="mt-5 text-sm text-slate-400">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-5 text-sm text-slate-400">
              Nenhum saldo de banco de horas encontrado.
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-950/70 text-left text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="p-3">Funcionário</th>
                    <th className="p-3">Cargo / Departamento</th>
                    <th className="p-3">Créditos</th>
                    <th className="p-3">Débitos</th>
                    <th className="p-3">Saldo</th>
                    <th className="p-3">Registros</th>
                    <th className="p-3">Último ponto</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((r) => (
                    <tr
                      key={r.funcionario.id}
                      className="border-t border-slate-800"
                    >
                      <td className="p-3 font-semibold">
                        {r.funcionario.nome}
                      </td>

                      <td className="p-3 text-slate-300">
                        {r.funcionario.cargo || "-"}
                        {r.funcionario.departamento?.nome
                          ? ` • ${r.funcionario.departamento.nome}`
                          : ""}
                      </td>

                      <td className="p-3 font-bold text-emerald-300">
                        {formatarHoras(r.creditos)}
                      </td>

                      <td className="p-3 font-bold text-red-300">
                        {formatarHoras(-r.debitos)}
                      </td>

                      <td
                        className={`p-3 font-bold ${
                          r.saldo >= 0 ? "text-emerald-300" : "text-red-300"
                        }`}
                      >
                        {formatarHoras(r.saldo)}
                      </td>

                      <td className="p-3 text-slate-300">{r.registros}</td>

                      <td className="p-3 text-slate-300">
                        {r.ultimaData
                          ? new Date(r.ultimaData).toLocaleDateString("pt-BR")
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}