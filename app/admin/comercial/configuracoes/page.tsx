"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import {
  useLocale,
  useTranslations,
} from "next-intl";

import PhanyxToast from "@/components/ui/PhanyxToast";

type PlanoComissao = {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
  inicioVigencia?: string | null;
  fimVigencia?: string | null;
  exigePagamentoConfirmado: boolean;
  permiteCompartilhamento: boolean;

  resumo?: {
    vigente: boolean;
    configurado: boolean;
    quantidadeRegras: number;
    quantidadeRegrasAtivas: number;
    quantidadeVendedoresAtivos: number;
    quantidadeVinculos: number;
    quantidadeLancamentos: number;
  };
};

type PlanoForm = {
  nome: string;
  descricao: string;
  inicioVigencia: string;
  fimVigencia: string;
  ativo: boolean;
  exigePagamentoConfirmado: boolean;
  permiteCompartilhamento: boolean;
};

const FORM_INICIAL: PlanoForm = {
  nome: "",
  descricao: "",
  inicioVigencia: "",
  fimVigencia: "",
  ativo: true,
  exigePagamentoConfirmado: true,
  permiteCompartilhamento: false,
};


const ESTILOS_TEMA_CONFIGURACOES = `
.phanyx-comercial-config-page[data-theme-mode="dark"] {
  color: #eff6ff;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-section,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-plan-card,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-painel-excecao,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-option,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-stat,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comercial-config-empty,
.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-card-opcao-inativa {
  background: #0b1f36 !important;
  border-color: #27496b !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] .phanyx-comissao-card-opcao-ativa {
  background: #12355b !important;
  border-color: #3b82f6 !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] input:not([type="checkbox"]),
.phanyx-comercial-config-page[data-theme-mode="dark"] select,
.phanyx-comercial-config-page[data-theme-mode="dark"] textarea {
  background: #071525 !important;
  border-color: #31506f !important;
  color: #ffffff !important;
  color-scheme: dark;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] select option {
  background: #071525;
  color: #ffffff;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:bg-slate-800"] {
  background: #08192d !important;
}

.phanyx-comercial-config-page[data-theme-mode="dark"] [class*="dark:border-slate-700"] {
  border-color: #31506f !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] {
  color: #f5f5f5;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-section,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-plan-card,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-painel-excecao,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-option,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-stat,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comercial-config-empty,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-card-opcao-inativa {
  background: #1f1f1f !important;
  border-color: #525252 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] .phanyx-comissao-card-opcao-ativa {
  background: #303030 !important;
  border-color: #737373 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] input:not([type="checkbox"]),
.phanyx-comercial-config-page[data-theme-mode="system-dark"] select,
.phanyx-comercial-config-page[data-theme-mode="system-dark"] textarea {
  background: #303030 !important;
  border-color: #5a5a5a !important;
  color: #ffffff !important;
  color-scheme: dark;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] select option {
  background: #303030;
  color: #ffffff;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:bg-slate-800"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="bg-white"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="bg-slate-50"] {
  background: #262626 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:border-slate-700"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="border-slate-200"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="border-slate-300"] {
  border-color: #525252 !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-950"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-900"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-white"] {
  color: #ffffff !important;
}

.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-700"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-600"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="text-slate-500"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-slate-300"],
.phanyx-comercial-config-page[data-theme-mode="system-dark"] [class*="dark:text-slate-400"] {
  color: #d4d4d4 !important;
}
`;

type Tema = "light" | "dark" | "system";

function useTemaConfiguracoesComerciais() {
  const [temaAtual, setTemaAtual] = useState<Tema>("light");
  const [sistemaEscuro, setSistemaEscuro] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    function sincronizarTema() {
      const salvo = localStorage.getItem("phanyx_tema");

      const escolha = (
        salvo === "light" ||
          salvo === "dark" ||
          salvo === "system"
          ? salvo
          : document.documentElement.dataset.themeChoice || "system"
      ) as Tema;

      setTemaAtual(escolha);
      setSistemaEscuro(media.matches);
    }

    sincronizarTema();

    window.addEventListener("storage", sincronizarTema);
    window.addEventListener("phanyx-theme-change", sincronizarTema);
    media.addEventListener("change", sincronizarTema);

    const observer = new MutationObserver(sincronizarTema);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-theme-choice"],
    });

    return () => {
      window.removeEventListener("storage", sincronizarTema);
      window.removeEventListener("phanyx-theme-change", sincronizarTema);
      media.removeEventListener("change", sincronizarTema);
      observer.disconnect();
    };
  }, []);

  const modoTema =
    temaAtual === "dark"
      ? "dark"
      : temaAtual === "system" && sistemaEscuro
        ? "system-dark"
        : "light";

  return {
    temaAtual,
    sistemaEscuro,
    modoTema,
  };
}


function formatarData(
  valor: string | null | undefined,
  locale: string,
  semLimite: string,
  dataInvalida: string,
) {
  if (!valor) {
    return semLimite;
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return dataInvalida;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
  }).format(data);
}

export default function ConfiguracoesComerciaisPage() {
  const t = useTranslations(
    "AdminCommercialCommissionSettings.overview",
  );

  const locale = useLocale();
  const { modoTema } = useTemaConfiguracoesComerciais();

  const [planos, setPlanos] = useState<PlanoComissao[]>([]);
  const [form, setForm] = useState<PlanoForm>(FORM_INICIAL);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [toast, setToast] = useState<{
    tipo: "sucesso" | "erro";
    mensagem: string;
  } | null>(null);

  async function carregarPlanos() {
    try {
      setCarregando(true);

      const resposta = await fetch(
        "/api/admin/comercial/planos-comissao",
        {
          credentials: "include",
          cache: "no-store",
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("errors.load"),
        );
      }

      setPlanos(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setPlanos([]);

      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          t("errors.load"),
      });
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarPlanos();
  }, []);

  async function criarPlano(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();

    if (!form.nome.trim()) {
      setToast({
        tipo: "erro",
        mensagem: t(
          "errors.nameRequired",
        ),
      });

      return;
    }

    try {
      setSalvando(true);

      const resposta = await fetch(
        "/api/admin/comercial/planos-comissao",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao: form.descricao.trim() || null,
            inicioVigencia: form.inicioVigencia || null,
            fimVigencia: form.fimVigencia || null,
            ativo: form.ativo,
            exigePagamentoConfirmado:
              form.exigePagamentoConfirmado,
            permiteCompartilhamento:
              form.permiteCompartilhamento,
          }),
        },
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
          t("errors.create"),
        );
      }

      setForm(FORM_INICIAL);

      setToast({
        tipo: "sucesso",
        mensagem:
          dados?.message ||
          t("success.created"),
      });

      await carregarPlanos();
    } catch (error: any) {
      setToast({
        tipo: "erro",
        mensagem:
          error?.message ||
          t("errors.create"),
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main
      data-theme-mode={modoTema}
      className="phanyx-comercial-config-page mx-auto min-h-screen w-full max-w-7xl space-y-7 p-6 lg:p-8"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: ESTILOS_TEMA_CONFIGURACOES,
        }}
      />

      {toast && (
        <PhanyxToast
          tipo={toast.tipo}
          mensagem={toast.mensagem}
          onClose={() => setToast(null)}
        />
      )}

      <header>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
          {t("header.section")}
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
          ⚙️ {t("header.title")}
        </h1>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t("header.description")}
        </p>
      </header>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {t("form.title")}
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("form.description")}
          </p>
        </div>

        <form
          onSubmit={criarPlano}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("form.name.label")}
              </label>

              <input
                value={form.nome}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    nome: evento.target.value,
                  }))
                }
                placeholder={t(
                  "form.name.placeholder",
                )}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("form.descriptionField.label")}
              </label>

              <input
                value={form.descricao}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    descricao: evento.target.value,
                  }))
                }
                placeholder={t(
                  "form.descriptionField.placeholder",
                )}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("form.startDate")}
              </label>

              <input
                type="date"
                value={form.inicioVigencia}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    inicioVigencia: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("form.endDate")}
              </label>

              <input
                type="date"
                value={form.fimVigencia}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    fimVigencia: evento.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    ativo: evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  {t("form.active.title")}
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {t("form.active.description")}
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.exigePagamentoConfirmado}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    exigePagamentoConfirmado:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  {t("form.confirmedPayment.title")}
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {t("form.confirmedPayment.description")}
                </span>
              </span>
            </label>

            <label className="phanyx-comercial-config-option flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
              <input
                type="checkbox"
                checked={form.permiteCompartilhamento}
                onChange={(evento) =>
                  setForm((anterior) => ({
                    ...anterior,
                    permiteCompartilhamento:
                      evento.target.checked,
                  }))
                }
                className="mt-1"
              />

              <span>
                <strong className="block text-sm text-slate-950 dark:text-white">
                  {t("form.sharedSale.title")}
                </strong>

                <span className="mt-1 block text-xs leading-5 text-slate-600 dark:text-slate-400">
                  {t("form.sharedSale.description")}
                </span>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando
              ? t("form.creating")
              : t("form.create")}
          </button>
        </form>
      </section>

      <section className="phanyx-comercial-config-section rounded-3xl border p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {t("list.title")}
          </h2>

          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {t("list.description")}
          </p>
        </div>

        {carregando ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
            {t("list.loading")}
          </div>
        ) : planos.length === 0 ? (
          <div className="phanyx-comercial-config-empty mt-6 rounded-2xl border border-dashed p-8 text-center">
            <p className="font-bold text-slate-950 dark:text-white">
              {t("list.emptyTitle")}
            </p>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {t("list.emptyDescription")}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {planos.map((plano) => (
              <article
                key={plano.id}
                className="phanyx-comercial-config-plan-card rounded-3xl border p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-950 dark:text-white">
                      {plano.nome}
                    </h3>

                    <p className="phanyx-comercial-config-plan-description mt-1 text-sm">
                      {plano.descricao ||
                        t("list.noDescription")}
                    </p>
                  </div>

                  <span
                    className={[
                      "phanyx-comercial-config-status rounded-full border px-3 py-1 text-xs font-black",
                      plano.resumo?.configurado
                        ? "phanyx-comercial-config-status-ok"
                        : "phanyx-comercial-config-status-pendente",
                    ].join(" ")}
                  >
                    {plano.resumo?.configurado
                      ? t("list.configured")
                      : t("list.pendingConfiguration")}
                  </span>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("list.validity")}
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {formatarData(
                        plano.inicioVigencia,
                        locale,
                        t("common.noLimit"),
                        t("common.invalidDate"),
                      )}
                      {" "}
                      {t("common.until")}
                      {" "}
                      {formatarData(
                        plano.fimVigencia,
                        locale,
                        t("common.noLimit"),
                        t("common.invalidDate"),
                      )}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("list.activeRules")}
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.resumo?.quantidadeRegrasAtivas ?? 0}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("list.linkedSellers")}
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.resumo?.quantidadeVendedoresAtivos ?? 0}
                    </dd>
                  </div>

                  <div className="phanyx-comercial-config-stat rounded-2xl border p-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {t("list.confirmedPayment")}
                    </dt>

                    <dd className="mt-1 text-sm font-semibold text-slate-950 dark:text-white">
                      {plano.exigePagamentoConfirmado
                        ? t("list.required")
                        : t("list.notRequired")}
                    </dd>
                  </div>
                </dl>

                {!plano.resumo?.configurado && (
                  <div className="phanyx-comercial-config-warning mt-4 rounded-2xl border px-4 py-3 text-sm">
                    {t("list.warning")}
                  </div>
                )}

                <div className="mt-4">
                  <Link
                    href={`/admin/comercial/configuracoes/planos/${plano.id}`}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-700"
                  >
                    ⚙️ {t("list.configureRules")}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
