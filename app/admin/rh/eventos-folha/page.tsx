"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type EventoFolha = {
  id: number;
  codigo: string;
  descricao: string;
  tipo: string;
  natureza?: string | null;
  incideINSS: boolean;
  incideFGTS: boolean;
  incideIRRF: boolean;
  ativo: boolean;
};

export default function EventosFolhaPage() {
  const t = useTranslations("AdminHRPayrollEvents");
  const [eventos, setEventos] = useState<EventoFolha[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("VENCIMENTO");
  const [natureza, setNatureza] = useState("");
  const [incideINSS, setIncideINSS] = useState(false);
  const [incideFGTS, setIncideFGTS] = useState(false);
  const [incideIRRF, setIncideIRRF] = useState(false);

  async function carregar() {
    try {
      const res = await fetch("/api/admin/rh/eventos-folha");
      const dados = await res.json();
      setEventos(Array.isArray(dados) ? dados : []);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar() {
    const res = await fetch("/api/admin/rh/eventos-folha", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        codigo,
        descricao,
        tipo,
        natureza,
        incideINSS,
        incideFGTS,
        incideIRRF,
      }),
    });

    if (!res.ok) return;

    setCodigo("");
    setDescricao("");
    setNatureza("");
    setIncideINSS(false);
    setIncideFGTS(false);
    setIncideIRRF(false);

    carregar();
  }

  function tipoLabel(value: string) {
    if (value === "VENCIMENTO") return t("earning");
    if (value === "DESCONTO") return t("deduction");
    if (value === "INFORMATIVO") return t("informational");
    return value;
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6 text-slate-900 dark:text-slate-100">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-blue-700 dark:text-cyan-400">
          {t("department")}
        </p>

        <h1 className="mt-3 text-4xl font-black text-slate-950 dark:text-white">{t("title")}</h1>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t("description")}
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            placeholder={t("code")}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
          />

          <input
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={t("eventDescription")}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 md:col-span-2"
          />

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
          >
            <option value="VENCIMENTO">{t("earning")}</option>
            <option value="DESCONTO">{t("deduction")}</option>
            <option value="INFORMATIVO">{t("informational")}</option>
          </select>

          <input
            value={natureza}
            onChange={(e) => setNatureza(e.target.value)}
            placeholder={t("naturePlaceholder")}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 md:col-span-2"
          />

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={incideINSS}
              onChange={(e) => setIncideINSS(e.target.checked)}
            />
            {t("appliesINSS")}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={incideFGTS}
              onChange={(e) => setIncideFGTS(e.target.checked)}
            />
            {t("appliesFGTS")}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={incideIRRF}
              onChange={(e) => setIncideIRRF(e.target.checked)}
            />
            {t("appliesIRRF")}
          </label>

          <button
            type="button"
            onClick={salvar}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
          >
            {t("save")}
          </button>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/rh/eventos-folha/padrao", {
                  method: "POST",
                });
                const json = await res.json();
                if (!res.ok) {
                  console.error(json.error || t("importError"));
                  return;
                }
                console.log(
                  t("importResult", { created: json.criados, skipped: json.ignorados })
                );
                await carregar();
              } catch (error) {
                console.error(t("importError"), error);
              }
            }}
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
          >
            {t("importDefault")}
          </button>

        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold">{t("registered")}</h2>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-sm text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <th className="p-3">{t("code")}</th>
                <th className="p-3">{t("eventDescription")}</th>
                <th className="p-3">{t("type")}</th>
                <th className="p-3">{t("nature")}</th>
                <th className="p-3">INSS</th>
                <th className="p-3">FGTS</th>
                <th className="p-3">IRRF</th>
                <th className="p-3">{t("status")}</th>
              </tr>
            </thead>

            <tbody>
              {carregando ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-600 dark:text-slate-400">
                    {t("loading")}
                  </td>
                </tr>
              ) : eventos.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-600 dark:text-slate-400">
                    {t("empty")}
                  </td>
                </tr>
              ) : (
                eventos.map((evento) => (
                  <tr key={evento.id} className="border-b border-slate-200 dark:border-slate-700">
                    <td className="p-3 font-medium text-slate-900 dark:text-white">{evento.codigo}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.descricao}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{tipoLabel(evento.tipo)}</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.natureza || "-"}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.incideINSS ? t("yes") : t("no")}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.incideFGTS ? t("yes") : t("no")}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.incideIRRF ? t("yes") : t("no")}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">
                      {evento.ativo ? t("active") : t("inactive")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
