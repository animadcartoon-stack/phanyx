"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ContaFinanceira = {
  id: number;
  nome: string;
  provedor: string;
  tipo: string;
  moeda: string;
  ambienteIntegracao: string;
  contaExternaId: string | null;
  bancoCodigo: string | null;
  agencia: string | null;
  conta: string | null;
  contaDigito: string | null;
  titularNome: string | null;
  titularDocumento: string | null;
  integracaoAtiva: boolean;
  webhookAtivo: boolean;
  suportaBoleto: boolean;
  padraoRecebimentos: boolean;
  ativa: boolean;
  credenciaisConfiguradas: boolean;
  webhookSecretConfigurado: boolean;
};

type Formulario = {
  nome: string;
  provedor: string;
  tipo: string;
  moeda: string;
  ambienteIntegracao: string;
  contaExternaId: string;
  bancoCodigo: string;
  agencia: string;
  conta: string;
  contaDigito: string;
  titularNome: string;
  titularDocumento: string;
  credencial: string;
  webhookSecret: string;
  integracaoAtiva: boolean;
  webhookAtivo: boolean;
  suportaBoleto: boolean;
  padraoRecebimentos: boolean;
  ativa: boolean;
};

const inicial: Formulario = {
  nome: "",
  provedor: "ASAAS",
  tipo: "BANCO",
  moeda: "BRL",
  ambienteIntegracao: "PRODUCAO",
  contaExternaId: "",
  bancoCodigo: "",
  agencia: "",
  conta: "",
  contaDigito: "",
  titularNome: "",
  titularDocumento: "",
  credencial: "",
  webhookSecret: "",
  integracaoAtiva: false,
  webhookAtivo: false,
  suportaBoleto: true,
  padraoRecebimentos: false,
  ativa: true,
};

export default function ContasFinanceirasPage() {
  const router = useRouter();
  const t = useTranslations("AdminFinanceAccounts");

  const [contas, setContas] = useState<ContaFinanceira[]>([]);
  const [podeEditar, setPodeEditar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modal, setModal] = useState(false);
  const [editando, setEditando] = useState<ContaFinanceira | null>(null);
  const [form, setForm] = useState<Formulario>(inicial);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/contas-financeiras",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data?.error || t("messages.loadError")
        );
      }

      setContas(
        Array.isArray(data?.contas) ? data.contas : []
      );

      setPodeEditar(Boolean(data?.podeEditar));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.loadError")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function alterar<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K]
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function novaConta() {
    setEditando(null);
    setForm(inicial);
    setErro("");
    setSucesso("");
    setModal(true);
  }

  function editarConta(conta: ContaFinanceira) {
    setEditando(conta);

    setForm({
      nome: conta.nome,
      provedor: conta.provedor,
      tipo: conta.tipo,
      moeda: conta.moeda,
      ambienteIntegracao: conta.ambienteIntegracao,
      contaExternaId: conta.contaExternaId || "",
      bancoCodigo: conta.bancoCodigo || "",
      agencia: conta.agencia || "",
      conta: conta.conta || "",
      contaDigito: conta.contaDigito || "",
      titularNome: conta.titularNome || "",
      titularDocumento: conta.titularDocumento || "",
      credencial: "",
      webhookSecret: "",
      integracaoAtiva: conta.integracaoAtiva,
      webhookAtivo: conta.webhookAtivo,
      suportaBoleto: conta.suportaBoleto,
      padraoRecebimentos: conta.padraoRecebimentos,
      ativa: conta.ativa,
    });

    setErro("");
    setSucesso("");
    setModal(true);
  }

  async function salvar(event: FormEvent) {
    event.preventDefault();

    if (!form.nome.trim()) {
      setErro(t("messages.nameRequired"));
      return;
    }

    const temCredencial =
      Boolean(form.credencial.trim()) ||
      Boolean(editando?.credenciaisConfiguradas);

    if (form.integracaoAtiva && !temCredencial) {
      setErro(t("messages.credentialsRequired"));
      return;
    }

    const temWebhook =
      Boolean(form.webhookSecret.trim()) ||
      Boolean(editando?.webhookSecretConfigurado);

    if (form.webhookAtivo && !temWebhook) {
      setErro(t("messages.webhookSecretRequired"));
      return;
    }

    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      provedor: form.provedor.trim().toUpperCase(),
      tipo: form.tipo.trim().toUpperCase(),
      moeda: form.moeda.trim().toUpperCase(),
      ambienteIntegracao: form.ambienteIntegracao,
      contaExternaId: form.contaExternaId.trim() || null,
      bancoCodigo: form.bancoCodigo.trim() || null,
      agencia: form.agencia.trim() || null,
      conta: form.conta.trim() || null,
      contaDigito: form.contaDigito.trim() || null,
      titularNome: form.titularNome.trim() || null,
      titularDocumento: form.titularDocumento.trim() || null,
      integracaoAtiva: form.integracaoAtiva,
      webhookAtivo: form.webhookAtivo,
      suportaBoleto: form.suportaBoleto,
      padraoRecebimentos: form.padraoRecebimentos,
      ativa: form.ativa,
    };

    if (editando) {
      payload.id = editando.id;

      if (form.credencial.trim()) {
        payload.credenciais = form.credencial.trim();
      }

      if (form.webhookSecret.trim()) {
        payload.webhookSecret = form.webhookSecret.trim();
      }
    } else {
      payload.credenciais =
        form.credencial.trim() || null;

      payload.webhookSecret =
        form.webhookSecret.trim() || null;
    }

    try {
      setSalvando(true);
      setErro("");

      const res = await fetch(
        "/api/admin/financeiro/contas-financeiras",
        {
          method: editando ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.error || t("messages.saveError")
        );
      }

      setModal(false);
      setSucesso(
        editando
          ? t("messages.updateSuccess")
          : t("messages.createSuccess")
      );

      await carregar();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.saveError")
      );
    } finally {
      setSalvando(false);
    }
  }

  const input =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  return (
    <>
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/admin/financeiro")}
              className="mb-3 text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
            >
              ← {t("back")}
            </button>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              {t("title")}
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("subtitle")}
            </p>
          </div>

          {podeEditar && (
            <button
              type="button"
              onClick={novaConta}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              + {t("newAccount")}
            </button>
          )}
        </div>

        {erro && !modal && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            {sucesso}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("summary.total")}
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {contas.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("summary.integrated")}
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {contas.filter((conta) => conta.integracaoAtiva).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("summary.default")}
            </p>
            <p className="mt-2 truncate text-lg font-bold text-blue-700 dark:text-blue-300">
              {contas.find((conta) => conta.padraoRecebimentos)?.nome ||
                t("notConfigured")}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {t("loading")}
            </div>
          ) : contas.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {t("emptyTitle")}
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {contas.map((conta) => (
                <div key={conta.id} className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                          {conta.nome}
                        </h2>

                        {conta.padraoRecebimentos && (
                          <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                            {t("badges.default")}
                          </span>
                        )}

                        <span
                          className={
                            conta.ativa
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                          }
                        >
                          {conta.ativa
                            ? t("badges.active")
                            : t("badges.inactive")}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {conta.provedor} · {conta.ambienteIntegracao} ·{" "}
                        {conta.moeda}
                      </p>
                    </div>

                    {podeEditar && (
                      <button
                        type="button"
                        onClick={() => editarConta(conta)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        {t("edit")}
                      </button>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("labels.integration")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {conta.integracaoAtiva
                          ? t("status.enabled")
                          : t("status.disabled")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("labels.credentials")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {conta.credenciaisConfiguradas
                          ? t("status.configured")
                          : t("status.notConfigured")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("labels.webhook")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {conta.webhookAtivo
                          ? t("status.enabled")
                          : t("status.disabled")}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("labels.boleto")}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {conta.suportaBoleto
                          ? t("status.enabled")
                          : t("status.disabled")}
                      </p>
                    </div>
                  </div>

                  {conta.provedor === "ASAAS" && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {t("labels.webhookEndpoint")}
                      </p>

                      <code className="mt-1 block break-all text-xs text-slate-700 dark:text-slate-300">
                        /api/webhooks/financeiro/asaas/{conta.id}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !salvando
            ) {
              setModal(false);
            }
          }}
        >
          <form
            onSubmit={salvar}
            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-950 sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editando
                    ? t("modal.editTitle")
                    : t("modal.newTitle")}
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {t("modal.description")}
                </p>
              </div>

              <button
                type="button"
                disabled={salvando}
                onClick={() => setModal(false)}
                className="rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.name")}
                </span>
                <input
                  className={input}
                  value={form.nome}
                  onChange={(e) => alterar("nome", e.target.value)}
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.provider")}
                </span>
                <input
                  className={input}
                  value={form.provedor}
                  onChange={(e) => alterar("provedor", e.target.value)}
                  placeholder="ASAAS"
                  required
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.type")}
                </span>
                <input
                  className={input}
                  value={form.tipo}
                  onChange={(e) => alterar("tipo", e.target.value)}
                  placeholder="BANCO"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.currency")}
                </span>
                <input
                  className={input}
                  value={form.moeda}
                  onChange={(e) => alterar("moeda", e.target.value)}
                  placeholder="BRL"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.environment")}
                </span>

                <select
                  className={input}
                  value={form.ambienteIntegracao}
                  onChange={(e) =>
                    alterar(
                      "ambienteIntegracao",
                      e.target.value
                    )
                  }
                >
                  <option value="PRODUCAO">
                    {t("environments.production")}
                  </option>
                  <option value="HOMOLOGACAO">
                    {t("environments.staging")}
                  </option>
                  <option value="SANDBOX">
                    {t("environments.sandbox")}
                  </option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.externalAccount")}
                </span>
                <input
                  className={input}
                  value={form.contaExternaId}
                  onChange={(e) =>
                    alterar(
                      "contaExternaId",
                      e.target.value
                    )
                  }
                />
              </label>
            </div>

            <h3 className="mt-7 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("sections.bankData")}
            </h3>

            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.bankCode")}
                </span>
                <input
                  className={input}
                  value={form.bancoCodigo}
                  onChange={(e) =>
                    alterar("bancoCodigo", e.target.value)
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.agency")}
                </span>
                <input
                  className={input}
                  value={form.agencia}
                  onChange={(e) =>
                    alterar("agencia", e.target.value)
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.account")}
                </span>
                <input
                  className={input}
                  value={form.conta}
                  onChange={(e) =>
                    alterar("conta", e.target.value)
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.digit")}
                </span>
                <input
                  className={input}
                  value={form.contaDigito}
                  onChange={(e) =>
                    alterar("contaDigito", e.target.value)
                  }
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.holderName")}
                </span>
                <input
                  className={input}
                  value={form.titularNome}
                  onChange={(e) =>
                    alterar("titularNome", e.target.value)
                  }
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.holderDocument")}
                </span>
                <input
                  className={input}
                  value={form.titularDocumento}
                  onChange={(e) =>
                    alterar(
                      "titularDocumento",
                      e.target.value
                    )
                  }
                />
              </label>
            </div>

            <h3 className="mt-7 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("sections.security")}
            </h3>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.credentials")}
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  className={input}
                  value={form.credencial}
                  onChange={(e) =>
                    alterar("credencial", e.target.value)
                  }
                  placeholder={
                    editando?.credenciaisConfiguradas
                      ? t("placeholders.keepCredential")
                      : t("placeholders.credential")
                  }
                />

                {editando?.credenciaisConfiguradas && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {t("security.credentialConfigured")}
                  </p>
                )}
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("fields.webhookSecret")}
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  className={input}
                  value={form.webhookSecret}
                  onChange={(e) =>
                    alterar(
                      "webhookSecret",
                      e.target.value
                    )
                  }
                  placeholder={
                    editando?.webhookSecretConfigurado
                      ? t("placeholders.keepWebhookSecret")
                      : t("placeholders.webhookSecret")
                  }
                />

                {editando?.webhookSecretConfigurado && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    {t("security.webhookConfigured")}
                  </p>
                )}
              </label>
            </div>

            <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              {t("security.explanation")}
            </p>

            <h3 className="mt-7 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("sections.options")}
            </h3>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Opcao
                label={t("options.integrationActive")}
                checked={form.integracaoAtiva}
                onChange={(v) =>
                  alterar("integracaoAtiva", v)
                }
              />

              <Opcao
                label={t("options.webhookActive")}
                checked={form.webhookAtivo}
                onChange={(v) =>
                  alterar("webhookAtivo", v)
                }
              />

              <Opcao
                label={t("options.supportsBoleto")}
                checked={form.suportaBoleto}
                onChange={(v) =>
                  alterar("suportaBoleto", v)
                }
              />

              <Opcao
                label={t("options.defaultReceipts")}
                checked={form.padraoRecebimentos}
                onChange={(v) =>
                  alterar("padraoRecebimentos", v)
                }
              />

              <Opcao
                label={t("options.accountActive")}
                checked={form.ativa}
                onChange={(v) =>
                  alterar("ativa", v)
                }
              />
            </div>

            {erro && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {erro}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={salvando}
                onClick={() => setModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                {t("cancel")}
              </button>

              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {salvando
                  ? t("saving")
                  : t("save")}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function Opcao({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (valor: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) =>
          onChange(event.target.checked)
        }
        className="h-4 w-4"
      />

      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </span>
    </label>
  );
}