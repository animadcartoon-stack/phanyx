"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocale, useTranslations } from "next-intl";

type Item = {
  id: number;
  codigoConsultado: string;
  valido: boolean;
  ip?: string | null;
  userAgent?: string | null;
  criadoEm: string;
  suspeito?: boolean;
  risco?: number;
  motivoRisco?: string | null;
};

type RespostaAuditoria =
  | Item[]
  | {
      dados?: Item[];
      items?: Item[];
      error?: string;
      message?: string;
    };

function mensagemDaResposta(resposta: unknown) {
  if (!resposta || typeof resposta !== "object") return null;

  const objeto = resposta as Record<string, unknown>;

  if (typeof objeto.error === "string" && objeto.error.trim()) {
    return objeto.error;
  }

  if (typeof objeto.message === "string" && objeto.message.trim()) {
    return objeto.message;
  }

  return null;
}

function listaDaResposta(resposta: RespostaAuditoria): Item[] {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.dados)) return resposta.dados;
  if (Array.isArray(resposta.items)) return resposta.items;
  return [];
}

export default function AuditoriaPage() {
  const locale = useLocale();
  const t = useTranslations("AdminValidationAudit");

  const [dados, setDados] = useState<Item[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [seletorStatusAberto, setSeletorStatusAberto] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const seletorStatusRef = useRef<HTMLDivElement>(null);

  const opcoesStatus = useMemo(
    () => [
      { valor: "", texto: t("filters.all") },
      { valor: "valido", texto: t("filters.valid") },
      { valor: "invalido", texto: t("filters.invalid") },
      { valor: "suspeito", texto: t("filters.suspicious") },
    ],
    [t]
  );

  const textoStatusSelecionado =
    opcoesStatus.find((opcao) => opcao.valor === status)?.texto ||
    t("filters.all");

  const formatadorData = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "medium",
      }),
    [locale]
  );

  const carregar = useCallback(
    async (
      buscaAtual: string,
      statusAtual: string,
      signal?: AbortSignal
    ) => {
      setCarregando(true);
      setErro(null);

      try {
        const params = new URLSearchParams();
        const buscaNormalizada = buscaAtual.trim();

        if (buscaNormalizada) params.set("busca", buscaNormalizada);
        if (statusAtual) params.set("status", statusAtual);

        const query = params.toString();
        const resposta = await fetch(
          `/api/admin/auditoria-validacoes${query ? `?${query}` : ""}`,
          {
            cache: "no-store",
            signal,
          }
        );

        let json: RespostaAuditoria | null = null;

        try {
          json = (await resposta.json()) as RespostaAuditoria;
        } catch {
          json = null;
        }

        if (!resposta.ok) {
          throw new Error(mensagemDaResposta(json) || t("errors.load"));
        }

        setDados(json ? listaDaResposta(json) : []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setDados([]);
        setErro(error instanceof Error ? error.message : t("errors.load"));
      } finally {
        if (!signal?.aborted) setCarregando(false);
      }
    },
    [t]
  );

  useEffect(() => {
    const controller = new AbortController();

    void carregar("", "", controller.signal);

    return () => controller.abort();
  }, [carregar]);

  useEffect(() => {
    if (!seletorStatusAberto) return;

    function fecharAoClicarFora(event: MouseEvent) {
      if (
        seletorStatusRef.current &&
        !seletorStatusRef.current.contains(event.target as Node)
      ) {
        setSeletorStatusAberto(false);
      }
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSeletorStatusAberto(false);
    }

    document.addEventListener("mousedown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.removeEventListener("mousedown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [seletorStatusAberto]);

  function formatarData(valor: string) {
    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) return t("common.notAvailable");

    return formatadorData.format(data);
  }

  function statusDoItem(item: Item) {
    if (item.suspeito) {
      return {
        classe: "audit-status audit-status-suspicious",
        texto: t("statuses.suspicious"),
        simbolo: "⚠",
      };
    }

    if (item.valido) {
      return {
        classe: "audit-status audit-status-valid",
        texto: t("statuses.valid"),
        simbolo: "✓",
      };
    }

    return {
      classe: "audit-status audit-status-invalid",
      texto: t("statuses.invalid"),
      simbolo: "✕",
    };
  }

  function filtrar() {
    void carregar(busca, status);
  }

  return (
    <main className="phanyx-auditoria-validacoes-page min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="audit-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <p className="audit-eyebrow text-xs font-bold uppercase tracking-[0.18em]">
            {t("hero.eyebrow")}
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="audit-title text-2xl font-bold tracking-tight sm:text-3xl">
                🔍 {t("hero.title")}
              </h1>
              <p className="audit-muted mt-2 max-w-3xl text-sm leading-6 sm:text-base">
                {t("hero.description")}
              </p>
            </div>

            <div className="audit-counter rounded-xl border px-4 py-3">
              <span className="audit-muted block text-xs font-semibold uppercase tracking-wide">
                {t("results.label")}
              </span>
              <strong className="audit-title mt-1 block text-2xl">
                {dados.length}
              </strong>
            </div>
          </div>
        </section>

        <section className="audit-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <label className="block">
              <span className="audit-label mb-2 block text-sm font-semibold">
                {t("filters.searchLabel")}
              </span>
              <input
                type="search"
                placeholder={t("filters.searchPlaceholder")}
                className="audit-control h-11 w-full rounded-xl border px-3 text-sm outline-none transition focus:ring-2"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") filtrar();
                }}
              />
            </label>

            <div ref={seletorStatusRef} className="relative block">
              <span className="audit-label mb-2 block text-sm font-semibold">
                {t("filters.statusLabel")}
              </span>

              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={seletorStatusAberto}
                className="audit-control audit-select-trigger flex h-11 w-full items-center justify-between rounded-xl border px-3 text-left text-sm outline-none transition focus:ring-2"
                onClick={() =>
                  setSeletorStatusAberto((estadoAtual) => !estadoAtual)
                }
              >
                <span>{textoStatusSelecionado}</span>
                <span
                  aria-hidden="true"
                  className={`audit-select-arrow transition-transform ${
                    seletorStatusAberto ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>

              {seletorStatusAberto ? (
                <div
                  role="listbox"
                  aria-label={t("filters.statusLabel")}
                  className="audit-select-menu absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border p-1 shadow-xl"
                >
                  {opcoesStatus.map((opcao) => {
                    const selecionada = status === opcao.valor;

                    return (
                      <button
                        key={opcao.valor || "todos"}
                        type="button"
                        role="option"
                        aria-selected={selecionada}
                        className={`audit-select-option w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          selecionada ? "is-selected" : ""
                        }`}
                        onClick={() => {
                          setStatus(opcao.valor);
                          setSeletorStatusAberto(false);
                        }}
                      >
                        {opcao.texto}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={filtrar}
              disabled={carregando}
              className="audit-button h-11 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? t("filters.loading") : t("filters.apply")}
            </button>
          </div>

          {erro ? (
            <div
              role="alert"
              className="audit-error mt-5 rounded-xl border p-4 text-sm font-semibold"
            >
              {erro}
            </div>
          ) : null}
        </section>

        <section className="audit-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="audit-title text-lg font-bold">
                {t("table.title")}
              </h2>
              <p className="audit-muted mt-1 text-sm">
                {t("results.count", { count: dados.length })}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="audit-table-head">
                <tr>
                  <th className="px-5 py-3 font-bold">{t("table.code")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.status")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.risk")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.reason")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.ip")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.userAgent")}</th>
                  <th className="px-5 py-3 font-bold">{t("table.date")}</th>
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="audit-empty px-5 py-14 text-center">
                      <span className="audit-spinner mx-auto mb-3 block h-7 w-7 rounded-full border-2" />
                      <strong className="audit-title block">
                        {t("loading.title")}
                      </strong>
                      <span className="audit-muted mt-1 block text-sm">
                        {t("loading.description")}
                      </span>
                    </td>
                  </tr>
                ) : dados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="audit-empty px-5 py-14 text-center">
                      <strong className="audit-title block text-base">
                        {t("empty.title")}
                      </strong>
                      <span className="audit-muted mt-1 block text-sm">
                        {t("empty.description")}
                      </span>
                    </td>
                  </tr>
                ) : (
                  dados.map((item) => {
                    const statusItem = statusDoItem(item);

                    return (
                      <tr key={item.id} className="audit-row border-b align-top">
                        <td className="audit-code px-5 py-4 font-mono font-semibold">
                          {item.codigoConsultado}
                        </td>
                        <td className="px-5 py-4">
                          <span className={statusItem.classe}>
                            <span aria-hidden="true">{statusItem.simbolo}</span>
                            {statusItem.texto}
                          </span>
                        </td>
                        <td className="audit-title px-5 py-4 font-bold">
                          {item.risco ?? 0}
                        </td>
                        <td className="audit-muted max-w-xs px-5 py-4">
                          {item.motivoRisco || t("risk.noReason")}
                        </td>
                        <td className="audit-title whitespace-nowrap px-5 py-4 font-mono text-xs">
                          {item.ip || t("common.notAvailable")}
                        </td>
                        <td
                          className="audit-muted max-w-sm px-5 py-4 text-xs"
                          title={item.userAgent || undefined}
                        >
                          <span className="line-clamp-2">
                            {item.userAgent || t("common.notAvailable")}
                          </span>
                        </td>
                        <td className="audit-title whitespace-nowrap px-5 py-4">
                          {formatarData(item.criadoEm)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <style>{`
        .phanyx-auditoria-validacoes-page {
          background: #f8fafc;
          color: #0f172a;
        }

        .phanyx-auditoria-validacoes-page .audit-card {
          background: #ffffff;
          border-color: #dbe4f0;
        }

        .phanyx-auditoria-validacoes-page .audit-title,
        .phanyx-auditoria-validacoes-page .audit-label,
        .phanyx-auditoria-validacoes-page .audit-code {
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
          opacity: 1;
        }

        .phanyx-auditoria-validacoes-page .audit-muted {
          color: #475569;
          -webkit-text-fill-color: #475569;
          opacity: 1;
        }

        .phanyx-auditoria-validacoes-page .audit-eyebrow {
          color: #1d4ed8;
          -webkit-text-fill-color: #1d4ed8;
        }

        .phanyx-auditoria-validacoes-page .audit-counter {
          background: #eff6ff;
          border-color: #bfdbfe;
          min-width: 112px;
        }

        .phanyx-auditoria-validacoes-page .audit-control {
          background: #ffffff;
          border-color: #cbd5e1;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }

        .phanyx-auditoria-validacoes-page .audit-control::placeholder {
          color: #64748b;
          -webkit-text-fill-color: #64748b;
          opacity: 1;
        }

        .phanyx-auditoria-validacoes-page .audit-control:focus {
          border-color: #2563eb;
          --tw-ring-color: rgba(37, 99, 235, 0.25);
        }

        .phanyx-auditoria-validacoes-page .audit-select-arrow {
          color: #475569;
          -webkit-text-fill-color: #475569;
        }

        .phanyx-auditoria-validacoes-page .audit-select-menu {
          background: #ffffff;
          border-color: #cbd5e1;
        }

        .phanyx-auditoria-validacoes-page .audit-select-option {
          background: #ffffff;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
        }

        .phanyx-auditoria-validacoes-page .audit-select-option:hover,
        .phanyx-auditoria-validacoes-page .audit-select-option:focus-visible,
        .phanyx-auditoria-validacoes-page .audit-select-option.is-selected {
          background: #e2e8f0;
          color: #0f172a;
          -webkit-text-fill-color: #0f172a;
          outline: none;
        }

        .phanyx-auditoria-validacoes-page .audit-button {
          background: #2563eb;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        .phanyx-auditoria-validacoes-page .audit-button:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .phanyx-auditoria-validacoes-page .audit-error {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
          -webkit-text-fill-color: #991b1b;
        }

        .phanyx-auditoria-validacoes-page .audit-table-head {
          background: #f1f5f9;
          color: #334155;
          -webkit-text-fill-color: #334155;
        }

        .phanyx-auditoria-validacoes-page .audit-row {
          border-color: #e2e8f0;
          background: #ffffff;
        }

        .phanyx-auditoria-validacoes-page .audit-row:hover {
          background: #eff6ff;
        }

        .phanyx-auditoria-validacoes-page .audit-status {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          white-space: nowrap;
          border: 1px solid;
          border-radius: 9999px;
          padding: 0.25rem 0.6rem;
          font-size: 0.75rem;
          font-weight: 800;
          opacity: 1;
        }

        .phanyx-auditoria-validacoes-page .audit-status-valid {
          background: #dcfce7;
          border-color: #86efac;
          color: #166534;
          -webkit-text-fill-color: #166534;
        }

        .phanyx-auditoria-validacoes-page .audit-status-invalid {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
          -webkit-text-fill-color: #991b1b;
        }

        .phanyx-auditoria-validacoes-page .audit-status-suspicious {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #78350f;
          -webkit-text-fill-color: #78350f;
        }

        .phanyx-auditoria-validacoes-page .audit-spinner {
          border-color: #bfdbfe;
          border-top-color: #2563eb;
          animation: audit-spin 0.8s linear infinite;
        }

        @keyframes audit-spin {
          to {
            transform: rotate(360deg);
          }
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page {
          background: #020617;
          color: #f8fafc;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-card {
          background: #0f172a;
          border-color: #334155;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-title,
        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-label,
        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-code {
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-muted {
          color: #cbd5e1;
          -webkit-text-fill-color: #cbd5e1;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-eyebrow {
          color: #93c5fd;
          -webkit-text-fill-color: #93c5fd;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-counter,
        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-control {
          background: #111c30;
          border-color: #475569;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-control {
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-control::placeholder {
          color: #94a3b8;
          -webkit-text-fill-color: #94a3b8;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-arrow {
          color: #cbd5e1;
          -webkit-text-fill-color: #cbd5e1;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-menu {
          background: #111c30;
          border-color: #475569;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-option {
          background: #111c30;
          color: #f8fafc;
          -webkit-text-fill-color: #f8fafc;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-option:hover,
        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-option:focus-visible,
        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-select-option.is-selected {
          background: #334155;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-table-head {
          background: #162033;
          color: #e2e8f0;
          -webkit-text-fill-color: #e2e8f0;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-row {
          background: #0f172a;
          border-color: #334155;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-row:hover {
          background: #172554;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-error {
          background: rgba(127, 29, 29, 0.45);
          border-color: #b91c1c;
          color: #fecaca;
          -webkit-text-fill-color: #fecaca;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-status-valid {
          background: rgba(20, 83, 45, 0.55);
          border-color: #22c55e;
          color: #bbf7d0;
          -webkit-text-fill-color: #bbf7d0;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-status-invalid {
          background: rgba(127, 29, 29, 0.55);
          border-color: #ef4444;
          color: #fecaca;
          -webkit-text-fill-color: #fecaca;
        }

        html[data-theme="dark"] .phanyx-auditoria-validacoes-page .audit-status-suspicious {
          background: rgba(120, 53, 15, 0.55);
          border-color: #f59e0b;
          color: #fef3c7;
          -webkit-text-fill-color: #fef3c7;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page {
          background: #262626;
          color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-card {
          background: #2f2f2f;
          border-color: #555555;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-title,
        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-label,
        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-code {
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-muted {
          color: #e5e7eb;
          -webkit-text-fill-color: #e5e7eb;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-eyebrow {
          color: #93c5fd;
          -webkit-text-fill-color: #93c5fd;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-counter,
        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-control {
          background: #353535;
          border-color: #666666;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-control {
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-control::placeholder {
          color: #d1d5db;
          -webkit-text-fill-color: #d1d5db;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-arrow {
          color: #e5e7eb;
          -webkit-text-fill-color: #e5e7eb;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-menu {
          background: #353535;
          border-color: #666666;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-option {
          background: #353535;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-option:hover,
        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-option:focus-visible,
        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-select-option.is-selected {
          background: #525252;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-table-head {
          background: #383838;
          color: #ffffff;
          -webkit-text-fill-color: #ffffff;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-row {
          background: #2f2f2f;
          border-color: #555555;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-row:hover {
          background: #3b465b;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-error {
          background: #522f2f;
          border-color: #dc6b6b;
          color: #ffe4e6;
          -webkit-text-fill-color: #ffe4e6;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-status-valid {
          background: #244b36;
          border-color: #4ade80;
          color: #dcfce7;
          -webkit-text-fill-color: #dcfce7;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-status-invalid {
          background: #572e2e;
          border-color: #f87171;
          color: #fee2e2;
          -webkit-text-fill-color: #fee2e2;
        }

        html[data-theme="system"] .phanyx-auditoria-validacoes-page .audit-status-suspicious {
          background: #5b451f;
          border-color: #fbbf24;
          color: #fef3c7;
          -webkit-text-fill-color: #fef3c7;
        }
      `}</style>
    </main>
  );
}
