"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type BeneficioRH = {
  id: number;
  nome: string;
  tipo: string;
  descricao?: string | null;
  valorPadrao?: string | number | null;
  percentual?: string | number | null;
  descontaFolha: boolean;
  ativo: boolean;
};

const TIPOS = [
  "VALE_TRANSPORTE",
  "VALE_ALIMENTACAO",
  "VALE_REFEICAO",
  "PLANO_SAUDE",
  "PLANO_ODONTOLOGICO",
  "SEGURO_VIDA",
  "AUXILIO_EDUCACAO",
  "AUXILIO_CRECHE",
  "AUXILIO_COMBUSTIVEL",
  "AUXILIO_HOME_OFFICE",
  "OUTRO",
];

export default function BeneficiosRHPage() {
  const t = useTranslations("AdminHRBenefits");
  const locale = useLocale();

  function tipoLabel(value: string) {
    switch (value) {
      case "VALE_TRANSPORTE": return t("transport");
      case "VALE_ALIMENTACAO": return t("foodAllowance");
      case "VALE_REFEICAO": return t("mealAllowance");
      case "PLANO_SAUDE": return t("healthPlan");
      case "PLANO_ODONTOLOGICO": return t("dentalPlan");
      case "SEGURO_VIDA": return t("lifeInsurance");
      case "AUXILIO_EDUCACAO": return t("educationAllowance");
      case "AUXILIO_CRECHE": return t("childcareAllowance");
      case "AUXILIO_COMBUSTIVEL": return t("fuelAllowance");
      case "AUXILIO_HOME_OFFICE": return t("homeOfficeAllowance");
      case "OUTRO": return t("other");
      default: return value;
    }
  }
  const [beneficios, setBeneficios] = useState<BeneficioRH[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    nome: "",
    tipo: "VALE_TRANSPORTE",
    descricao: "",
    valorPadrao: "",
    percentual: "",
    descontaFolha: true,
    ativo: true,
  });

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch("/api/admin/rh/beneficios", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(t("loadError"));
      }

      setBeneficios(data.beneficios || []);
    } catch {
      setErro(t("loadError"));
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch("/api/admin/rh/beneficios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(t("saveError"));
      }

      setSucesso(t("created"));
      setForm({
        nome: "",
        tipo: "VALE_TRANSPORTE",
        descricao: "",
        valorPadrao: "",
        percentual: "",
        descontaFolha: true,
        ativo: true,
      });

      await carregar();
    } catch {
      setErro(t("saveError"));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-rh-page min-h-screen p-6 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
            PHANYX RH
          </p>
          <h1 className="mt-2 text-3xl font-bold">{t("title")}</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 dark:text-slate-400">
            {t("description")}
          </p>
        </div>

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-200">
            {sucesso}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-5 shadow-xl">
          <h2 className="text-lg font-bold">{t("newBenefit")}</h2>

          <form onSubmit={salvar} className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("name")}
              </span>
              <input
                value={form.nome}
                onChange={(e) =>
                  setForm((p) => ({ ...p, nome: e.target.value }))
                }
                placeholder={t("namePlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("type")}
              </span>
              <select
                value={form.tipo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tipo: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              >
                {TIPOS.map((tipoBeneficio) => (
                  <option key={tipoBeneficio} value={tipoBeneficio}>
                    {tipoLabel(tipoBeneficio)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("defaultValue")}
              </span>
              <input
                value={form.valorPadrao}
                onChange={(e) =>
                  setForm((p) => ({ ...p, valorPadrao: e.target.value }))
                }
                placeholder={t("amountPlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("percentage")}
              </span>
              <input
                value={form.percentual}
                onChange={(e) =>
                  setForm((p) => ({ ...p, percentual: e.target.value }))
                }
                placeholder={t("percentagePlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              />
            </label>

            <label className="space-y-1 md:col-span-3">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t("benefitDescription")}
              </span>
              <input
                value={form.descricao}
                onChange={(e) =>
                  setForm((p) => ({ ...p, descricao: e.target.value }))
                }
                placeholder={t("descriptionPlaceholder")}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400"
              />
            </label>

            <div className="flex items-center gap-4 md:col-span-4">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.descontaFolha}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      descontaFolha: e.target.checked,
                    }))
                  }
                />
                {t("payrollDeduction")}
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ativo: e.target.checked }))
                  }
                />
                {t("active")}
              </label>
            </div>

            <div className="md:col-span-4">
              <button
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:opacity-60"
              >
                {salvando ? t("saving") : t("create")}
              </button>
            </div>
          </form>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 shadow-xl">
          <div className="border-b border-slate-200 dark:border-slate-700 p-5">
            <h2 className="text-lg font-bold">{t("registered")}</h2>
          </div>

          {carregando ? (
            <div className="p-5 text-sm text-slate-600 dark:text-slate-400">{t("loading")}</div>
          ) : beneficios.length === 0 ? (
            <div className="p-5 text-sm text-slate-600 dark:text-slate-400">
              {t("empty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
                  <tr>
                    <th className="p-3">{t("name")}</th>
                    <th className="p-3">{t("type")}</th>
                    <th className="p-3">{t("value")}</th>
                    <th className="p-3">{t("percentage")}</th>
                    <th className="p-3">{t("payroll")}</th>
                    <th className="p-3">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {beneficios.map((b) => (
                    <tr key={b.id} className="border-t border-slate-200 dark:border-slate-700">
                      <td className="p-3 font-semibold">{b.nome}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {tipoLabel(b.tipo)}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {b.valorPadrao
                          ? Number(b.valorPadrao).toLocaleString(locale, {
                              style: "currency",
                              currency: "BRL",
                            })
                          : "-"}
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">
                        {b.percentual ? `${b.percentual}%` : "-"}
                      </td>
                      <td className="p-3">
                        {b.descontaFolha ? t("deducts") : t("doesNotDeduct")}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-bold ${
                            b.ativo
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {b.ativo ? t("active") : t("inactive")}
                        </span>
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
