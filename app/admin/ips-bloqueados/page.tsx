"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useLocale,
  useTranslations,
} from "next-intl";

type Bloqueio = {
  id: number;
  ip: string;
  motivo?: string | null;
  ativo: boolean;
  bloqueadoAte?: string | null;
  criadoEm: string;
};

export default function IpsBloqueadosPage() {
  const t =
    useTranslations("AdminBlockedIps");

  const locale =
    useLocale();

  const [
    dados,
    setDados,
  ] = useState<Bloqueio[]>([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    desbloqueandoId,
    setDesbloqueandoId,
  ] = useState<number | null>(null);

  async function carregar() {
    try {
      setCarregando(true);

      const res = await fetch(
        "/api/admin/ips-bloqueados",
        {
          cache: "no-store",
        }
      );

      if (!res.ok) {
        setDados([]);
        return;
      }

      const json =
        await res.json();

      setDados(
        Array.isArray(json)
          ? json
          : []
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  function formatarData(
    valor: string
  ) {
    const data =
      new Date(valor);

    if (
      Number.isNaN(
        data.getTime()
      )
    ) {
      return "-";
    }

    return new Intl.DateTimeFormat(
      locale,
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    ).format(data);
  }

  async function desbloquear(
    id: number
  ) {
    if (desbloqueandoId !== null) {
      return;
    }

    try {
      setDesbloqueandoId(id);

      const response =
        await fetch(
          "/api/admin/ips-bloqueados",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              id,
            }),
          }
        );

      if (response.ok) {
        await carregar();
      }
    } finally {
      setDesbloqueandoId(null);
    }
  }

  return (
    <main className="space-y-6 text-slate-900 dark:text-slate-100">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-5">
          <h1 className="text-xl font-bold">
            {t("header.title")}
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t(
              "header.description"
            )}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <th className="px-3 py-3">
                  {t("table.ip")}
                </th>

                <th className="px-3 py-3">
                  {t("table.reason")}
                </th>

                <th className="px-3 py-3">
                  {t(
                    "table.blockedUntil"
                  )}
                </th>

                <th className="px-3 py-3">
                  {t("table.date")}
                </th>

                <th className="px-3 py-3">
                  {t("table.actions")}
                </th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    {t(
                      "states.loading"
                    )}
                  </td>
                </tr>
              ) : dados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500 dark:text-slate-400"
                  >
                    {t(
                      "states.empty"
                    )}
                  </td>
                </tr>
              ) : (
                dados.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-200 last:border-b-0 dark:border-slate-700"
                    >
                      <td className="px-3 py-3 font-mono">
                        {item.ip}
                      </td>

                      <td className="px-3 py-3">
                        {item.motivo ||
                          "-"}
                      </td>

                      <td className="px-3 py-3">
                        {item.bloqueadoAte
                          ? formatarData(
                              item.bloqueadoAte
                            )
                          : t(
                              "values.indefinite"
                            )}
                      </td>

                      <td className="px-3 py-3">
                        {formatarData(
                          item.criadoEm
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            void desbloquear(
                              item.id
                            )
                          }
                          disabled={
                            desbloqueandoId !==
                            null
                          }
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {desbloqueandoId ===
                          item.id
                            ? t(
                                "actions.unlocking"
                              )
                            : t(
                                "actions.unlock"
                              )}
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
