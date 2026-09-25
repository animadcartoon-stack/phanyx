"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

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

function formatarHoras(v: number, locale: string) {
  const sinal = v > 0 ? "+" : v < 0 ? "-" : "";
  const horas = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(v));
  return `${sinal}${horas}h`;
}

export default function BancoHorasPage() {
  const t = useTranslations("AdminHRTimeBank");
  const locale = useLocale();
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  async function carregar() {
    try {
      setCarregando(true);
      setErro(false);

      const res = await fetch("/api/admin/rh/ponto", {
        cache: "no-store",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error();

      setPontos(Array.isArray(data) ? data : []);
    } catch {
      setErro(true);
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
      a.funcionario.nome.localeCompare(b.funcionario.nome, locale)
    );
  }, [pontos, locale]);

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
    <main className="phanyx-rh-page min-h-screen p-6 text-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            {t("eyebrow")}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{t("title")}</h1>

          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            {t("description")}
          </p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
            {t("loadError")}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-sm text-slate-600 dark:text-slate-400">{t("employees")}</p>
            <p className="mt-2 text-2xl font-bold">{totais.funcionarios}</p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-500/20 dark:bg-emerald-950/20">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">{t("credits")}</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800 dark:text-emerald-300">
              {formatarHoras(totais.creditos, locale)}
            </p>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-950/20">
            <p className="text-sm text-red-800 dark:text-red-200">{t("debits")}</p>
            <p className="mt-2 text-2xl font-bold text-red-800 dark:text-red-300">
              {formatarHoras(-totais.debitos, locale)}
            </p>
          </div>

          <div className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-950/20">
            <p className="text-sm text-blue-800 dark:text-blue-200">{t("overallBalance")}</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                totais.saldo >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"
              }`}
            >
              {formatarHoras(totais.saldo, locale)}
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-bold">{t("balanceByEmployee")}</h2>

            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white md:w-[420px]"
            />
          </div>

          {carregando ? (
            <div className="mt-5 text-sm text-slate-600 dark:text-slate-400">{t("loading")}</div>
          ) : filtrados.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {t("empty")}
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-950/70 dark:text-slate-400">
                  <tr>
                    <th className="p-3">{t("employee")}</th>
                    <th className="p-3">{t("roleDepartment")}</th>
                    <th className="p-3">{t("credits")}</th>
                    <th className="p-3">{t("debits")}</th>
                    <th className="p-3">{t("balance")}</th>
                    <th className="p-3">{t("records")}</th>
                    <th className="p-3">{t("lastClockIn")}</th>
                  </tr>
                </thead>

                <tbody>
                  {filtrados.map((r) => (
                    <tr
                      key={r.funcionario.id}
                      className="border-t border-slate-200 dark:border-slate-800"
                    >
                      <td className="p-3 font-semibold">
                        {r.funcionario.nome}
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {r.funcionario.cargo || "-"}
                        {r.funcionario.departamento?.nome
                          ? ` • ${r.funcionario.departamento.nome}`
                          : ""}
                      </td>

                      <td className="p-3 font-bold text-emerald-800 dark:text-emerald-300">
                        {formatarHoras(r.creditos, locale)}
                      </td>

                      <td className="p-3 font-bold text-red-800 dark:text-red-300">
                        {formatarHoras(-r.debitos, locale)}
                      </td>

                      <td
                        className={`p-3 font-bold ${
                          r.saldo >= 0 ? "text-emerald-800 dark:text-emerald-300" : "text-red-800 dark:text-red-300"
                        }`}
                      >
                        {formatarHoras(r.saldo, locale)}
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-300">{r.registros}</td>

                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {r.ultimaData
                          ? new Date(r.ultimaData).toLocaleDateString(locale)
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
