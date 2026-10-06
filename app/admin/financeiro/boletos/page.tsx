"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  useLocale,
  useTranslations,
} from "next-intl";

type LancamentoDisponivel = {
  id: number;
  descricao?: string | null;
  status: string;
  vencimento?: string | null;
  saldoPendente: number;
  aluno: {
    id: number;
    nome: string;
    user?: {
      email?: string | null;
    } | null;
  };
  matricula?: {
    id: number;
    numeroMatricula?: string | null;
    numeroMatriculaLegado?: string | null;
    curso?: {
      id: number;
      nome: string;
    } | null;
  } | null;
  cobranca?: {
    id: number;
    statusBancario: string;
    statusOperacional: string;
    boletoUrl?: string | null;
    invoiceUrl?: string | null;
  } | null;
};

type Cobranca = {
  id: number;
  referenciaInterna: string;
  cobrancaExternaId?: string | null;
  statusBancario: string;
  statusOperacional: string;
  valorCobrado: number;
  valorCompensado?: number | null;
  vencimento: string;
  emitidoEm: string;
  ultimoEnvioEm?: string | null;
  ultimoEnvioCanal?: string | null;
  ultimoEnvioPorNomeSnapshot?: string | null;
  quantidadeEnvios?: number;
  linhaDigitavel?: string | null;
  boletoUrl?: string | null;
  invoiceUrl?: string | null;
  erroIntegracao?: string | null;
  baixadoPorNomeSnapshot?: string | null;
  contaFinanceira: {
    id: number;
    nome: string;
    moeda: string;
  };
  aluno: {
    id: number;
    nome: string;
    telefone?: string | null;
    user?: {
      email?: string | null;
    } | null;
  };
  lancamentoFinanceiro: {
    id: number;
    descricao?: string | null;
    status: string;
  };
};

type Resumo = {
  AGUARDANDO_PAGAMENTO: number;
  AGUARDANDO_BAIXA: number;
  BAIXADO: number;
  DIVERGENCIA: number;
  CANCELADO: number;
};

type Filtro =
  | "TODOS"
  | "PENDENTE"
  | "VENCIDO"
  | "COMPENSADO"
  | "AGUARDANDO_BAIXA"
  | "BAIXADO"
  | "FALHA";

const resumoInicial: Resumo = {
  AGUARDANDO_PAGAMENTO: 0,
  AGUARDANDO_BAIXA: 0,
  BAIXADO: 0,
  DIVERGENCIA: 0,
  CANCELADO: 0,
};

function dataLocal(valor?: string | null) {
  if (!valor) return null;

  const partes =
    valor.slice(0, 10).split("-").map(Number);

  if (
    partes.length !== 3 ||
    partes.some((item) => !item)
  ) {
    return null;
  }

  return new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  );
}

function diasAtraso(valor?: string | null) {
  const vencimento = dataLocal(valor);

  if (!vencimento) return 0;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  return Math.max(
    0,
    Math.floor(
      (hoje.getTime() - vencimento.getTime()) /
        86400000
    )
  );
}

export default function BoletosPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("AdminFinanceBoletos");

  const [disponiveis, setDisponiveis] = useState<LancamentoDisponivel[]>([]);
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [resumo, setResumo] = useState<Resumo>(resumoInicial);
  const [totalCobrancas, setTotalCobrancas] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [buscaGerar, setBuscaGerar] = useState("");
  const [buscaBoletos, setBuscaBoletos] = useState("");
  const [buscaGerarAplicada, setBuscaGerarAplicada] = useState("");
  const [buscaBoletosAplicada, setBuscaBoletosAplicada] = useState("");
  const [loadingGerar, setLoadingGerar] = useState(true);
  const [loadingBoletos, setLoadingBoletos] = useState(true);
  const [gerandoId, setGerandoId] = useState<number | null>(null);
  const [enviandoId, setEnviandoId] = useState<number | null>(null);
  const [whatsappPendenteId, setWhatsappPendenteId] =
    useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const moeda = useCallback(
    (valor: number, currency = "BRL") => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
        }).format(Number(valor || 0));
      } catch {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: "BRL",
        }).format(Number(valor || 0));
      }
    },
    [locale]
  );

  const data = useCallback(
    (valor?: string | null, comHora = false) => {
      if (!valor) return "-";

      const d = new Date(valor);
      if (Number.isNaN(d.getTime())) return "-";

      return new Intl.DateTimeFormat(
        locale,
        comHora
          ? { dateStyle: "short", timeStyle: "short" }
          : { dateStyle: "short" }
      ).format(d);
    },
    [locale]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBuscaGerarAplicada(buscaGerar.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [buscaGerar]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPagina(1);
      setBuscaBoletosAplicada(buscaBoletos.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [buscaBoletos]);

  const carregarDisponiveis = useCallback(async () => {
    try {
      setLoadingGerar(true);
      const params = new URLSearchParams();
      params.set("limite", "50");

      if (buscaGerarAplicada) {
        params.set("busca", buscaGerarAplicada);
      }

      const resposta = await fetch(
        "/api/admin/financeiro/cobrancas/disponiveis?" +
          params.toString(),
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error || t("messages.loadAvailableError")
        );
      }

      setDisponiveis(
        Array.isArray(dados?.lancamentos)
          ? dados.lancamentos
          : []
      );
    } catch (error) {
      setDisponiveis([]);
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.loadAvailableError")
      );
    } finally {
      setLoadingGerar(false);
    }
  }, [buscaGerarAplicada, t]);

  const carregarBoletos = useCallback(async () => {
    try {
      setLoadingBoletos(true);
      const params = new URLSearchParams();
      params.set("pagina", String(pagina));
      params.set("limite", "30");

      if (buscaBoletosAplicada) {
        params.set("busca", buscaBoletosAplicada);
      }

      if (
        ["PENDENTE", "VENCIDO", "COMPENSADO", "FALHA"].includes(
          filtro
        )
      ) {
        params.set("statusBancario", filtro);
      }

      if (
        ["AGUARDANDO_BAIXA", "BAIXADO"].includes(filtro)
      ) {
        params.set("statusOperacional", filtro);
      }

      const resposta = await fetch(
        "/api/admin/financeiro/cobrancas?" + params.toString(),
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error || t("messages.loadBoletosError")
        );
      }

      setCobrancas(
        Array.isArray(dados?.cobrancas)
          ? dados.cobrancas
          : []
      );

      setResumo({
        ...resumoInicial,
        ...(dados?.resumo || {}),
      });

      setTotalCobrancas(
        Number(dados?.paginacao?.total || 0)
      );

      setTotalPaginas(
        Math.max(
          1,
          Number(dados?.paginacao?.totalPaginas || 1)
        )
      );
    } catch (error) {
      setCobrancas([]);
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.loadBoletosError")
      );
    } finally {
      setLoadingBoletos(false);
    }
  }, [pagina, filtro, buscaBoletosAplicada, t]);

  useEffect(() => {
    void carregarDisponiveis();
  }, [carregarDisponiveis]);

  useEffect(() => {
    void carregarBoletos();
  }, [carregarBoletos]);

  async function gerarBoleto(lancamento: LancamentoDisponivel) {
    try {
      setGerandoId(lancamento.id);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        "/api/admin/financeiro/cobrancas/gerar-boleto",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lancamentoFinanceiroId: lancamento.id,
          }),
        }
      );

      const dados = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.error || t("messages.generateError")
        );
      }

      setSucesso(
        dados?.reutilizada
          ? t("messages.reused")
          : t("messages.generated")
      );

      await Promise.all([
        carregarDisponiveis(),
        carregarBoletos(),
      ]);

      const url =
        dados?.cobranca?.boletoUrl ||
        dados?.cobranca?.invoiceUrl;

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.generateError")
      );
    } finally {
      setGerandoId(null);
    }
  }

  function abrirBoleto(cobranca: {
    boletoUrl?: string | null;
    invoiceUrl?: string | null;
  }) {
    const url = cobranca.boletoUrl || cobranca.invoiceUrl;

    if (!url) {
      setErro(t("messages.noBoletoUrl"));
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function copiarLinha(cobranca: Cobranca) {
    if (!cobranca.linhaDigitavel) {
      setErro(t("messages.noDigitableLine"));
      return;
    }

    try {
      await navigator.clipboard.writeText(
        cobranca.linhaDigitavel
      );
      setErro("");
      setSucesso(t("messages.copied"));
    } catch {
      setErro(t("messages.copyError"));
    }
  }

  async function registrarEnvio(
    cobranca: Cobranca,
    canal: "EMAIL" | "WHATSAPP"
  ) {
    try {
      setEnviandoId(cobranca.id);
      setErro("");
      setSucesso("");

      const resposta = await fetch(
        `/api/admin/financeiro/cobrancas/${cobranca.id}/enviar`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            canal,
            locale,
          }),
        }
      );

      const dados =
        await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(
          dados?.error || t("messages.sendError")
        );
      }

      setWhatsappPendenteId(null);

      setSucesso(
        canal === "EMAIL"
          ? t("messages.emailSent")
          : t("messages.whatsappRegistered")
      );

      await carregarBoletos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : t("messages.sendError")
      );
    } finally {
      setEnviandoId(null);
    }
  }

  function telefoneWhatsapp(
    valor?: string | null
  ) {
    if (!valor) return "";

    const somenteNumeros =
      valor.replace(/\D/g, "");

    if (
      somenteNumeros.length === 10 ||
      somenteNumeros.length === 11
    ) {
      return "55" + somenteNumeros;
    }

    return somenteNumeros;
  }

  function abrirWhatsapp(
    cobranca: Cobranca
  ) {
    const url =
      cobranca.boletoUrl ||
      cobranca.invoiceUrl;

    const mensagem = [
      t("whatsapp.greeting", {
        name: cobranca.aluno.nome,
      }),
      t("whatsapp.message"),
      cobranca.lancamentoFinanceiro
        .descricao || "",
      url
        ? t("whatsapp.link", {
            link: url,
          })
        : "",
      cobranca.linhaDigitavel
        ? t("whatsapp.line", {
            line:
              cobranca.linhaDigitavel,
          })
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const telefone =
      telefoneWhatsapp(
        cobranca.aluno.telefone
      );

    const destino =
      telefone
        ? `https://wa.me/${telefone}?text=`
        : "https://wa.me/?text=";

    window.open(
      destino +
        encodeURIComponent(
          mensagem
        ),
      "_blank",
      "noopener,noreferrer"
    );

    setWhatsappPendenteId(
      cobranca.id
    );

    setErro("");
    setSucesso(
      t("messages.whatsappOpened")
    );
  }

  function statusVisual(cobranca: Cobranca) {
    if (cobranca.statusOperacional === "BAIXADO") {
      return {
        label: t("status.settled"),
        classe:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
      };
    }

    if (cobranca.statusOperacional === "AGUARDANDO_BAIXA") {
      return {
        label: t("status.awaitingSettlement"),
        classe:
          "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
      };
    }

    if (cobranca.statusOperacional === "DIVERGENCIA") {
      return {
        label: t("status.divergence"),
        classe:
          "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
      };
    }

    const mapa: Record<string, string> = {
      EM_PROCESSAMENTO: "processing",
      COMPENSADO: "paid",
      CANCELADO: "cancelled",
      ESTORNADO: "refunded",
      FALHA: "failed",
    };

    if (mapa[cobranca.statusBancario]) {
      return {
        label: t(
          "status." + mapa[cobranca.statusBancario]
        ),
        classe:
          cobranca.statusBancario === "FALHA"
            ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
            : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
      };
    }

    const atraso = diasAtraso(cobranca.vencimento);

    if (atraso > 0) {
      return {
        label: t("status.overdueDays", { count: atraso }),
        classe:
          "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
      };
    }

    const vencimento = dataLocal(cobranca.vencimento);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (vencimento) {
      vencimento.setHours(0, 0, 0, 0);

      if (vencimento.getTime() === hoje.getTime()) {
        return {
          label: t("status.dueToday"),
          classe:
            "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        };
      }
    }

    return {
      label: t("status.pending"),
      classe:
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    };
  }

  const filtros = useMemo(
    () =>
      [
        ["TODOS", t("filters.all")],
        ["PENDENTE", t("filters.pending")],
        ["VENCIDO", t("filters.overdue")],
        ["COMPENSADO", t("filters.paid")],
        [
          "AGUARDANDO_BAIXA",
          t("filters.awaitingSettlement"),
        ],
        ["BAIXADO", t("filters.settled")],
        ["FALHA", t("filters.failed")],
      ] as Array<[Filtro, string]>,
    [t]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 text-slate-900 dark:text-slate-100">
      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <button
          type="button"
          onClick={() => router.push("/admin/financeiro")}
          className="text-sm font-semibold text-blue-700 hover:underline dark:text-blue-300"
        >
          ← {t("page.back")}
        </button>

        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t("page.title")}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              {t("page.subtitle")}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/financeiro/boletos-compensados"
              )
            }
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200"
          >
            {t("page.cleared")}
          </button>
        </div>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {sucesso}
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [t("summary.generated"), totalCobrancas],
          [
            t("summary.awaitingPayment"),
            resumo.AGUARDANDO_PAGAMENTO,
          ],
          [
            t("summary.awaitingSettlement"),
            resumo.AGUARDANDO_BAIXA,
          ],
          [t("summary.settled"), resumo.BAIXADO],
          [t("summary.divergence"), resumo.DIVERGENCIA],
        ].map(([label, valor]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {valor}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-xl font-bold">
          {t("generate.title")}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {t("generate.subtitle")}
        </p>

        <input
          value={buscaGerar}
          onChange={(event) =>
            setBuscaGerar(event.target.value)
          }
          placeholder={t("generate.search")}
          className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3">{t("table.student")}</th>
                <th className="px-3 py-3">{t("table.charge")}</th>
                <th className="px-3 py-3">{t("table.dueDate")}</th>
                <th className="px-3 py-3">{t("table.balance")}</th>
                <th className="px-3 py-3">{t("table.action")}</th>
              </tr>
            </thead>

            <tbody>
              {loadingGerar ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    {t("common.loading")}
                  </td>
                </tr>
              ) : disponiveis.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    {t("generate.empty")}
                  </td>
                </tr>
              ) : (
                disponiveis.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 align-top dark:border-slate-900"
                  >
                    <td className="px-3 py-4">
                      <p className="font-semibold">
                        {item.aluno.nome}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.aluno.user?.email || "-"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-medium">
                        {item.descricao || t("generate.monthlyFee")}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.matricula?.curso?.nome || "-"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      {data(item.vencimento)}
                    </td>
                    <td className="px-3 py-4 font-semibold">
                      {moeda(item.saldoPendente)}
                    </td>
                    <td className="px-3 py-4">
                      {item.cobranca?.boletoUrl ||
                      item.cobranca?.invoiceUrl ? (
                        <button
                          type="button"
                          onClick={() =>
                            abrirBoleto(item.cobranca || {})
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                          {t("actions.open")}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={gerandoId === item.id}
                          onClick={() => void gerarBoleto(item)}
                          className="rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {gerandoId === item.id
                            ? t("actions.generating")
                            : t("actions.generate")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {t("issued.title")}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t("issued.subtitle")}
            </p>
          </div>

          <input
            value={buscaBoletos}
            onChange={(event) =>
              setBuscaBoletos(event.target.value)
            }
            placeholder={t("issued.search")}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 lg:max-w-md"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filtros.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setFiltro(id);
                setPagina(1);
              }}
              className={
                "rounded-full px-3 py-2 text-xs font-semibold transition " +
                (filtro === id
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3">{t("table.student")}</th>
                <th className="px-3 py-3">{t("table.charge")}</th>
                <th className="px-3 py-3">{t("table.value")}</th>
                <th className="px-3 py-3">{t("table.dueDate")}</th>
                <th className="px-3 py-3">{t("table.status")}</th>
                <th className="px-3 py-3">{t("table.delivery")}</th>
                <th className="px-3 py-3">{t("table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {loadingBoletos ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    {t("common.loading")}
                  </td>
                </tr>
              ) : cobrancas.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-8 text-center text-slate-500"
                  >
                    {t("issued.empty")}
                  </td>
                </tr>
              ) : (
                cobrancas.map((cobranca) => {
                  const visual = statusVisual(cobranca);

                  return (
                    <tr
                      key={cobranca.id}
                      className="border-b border-slate-100 align-top dark:border-slate-900"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold">
                          {cobranca.aluno.nome}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {cobranca.aluno.user?.email || "-"}
                        </p>
                      </td>
                      <td className="px-3 py-4">
                        <p>
                          {cobranca.lancamentoFinanceiro.descricao ||
                            t("generate.monthlyFee")}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {cobranca.contaFinanceira.nome}
                        </p>
                      </td>
                      <td className="px-3 py-4 font-semibold">
                        {moeda(
                          cobranca.valorCompensado ??
                            cobranca.valorCobrado,
                          cobranca.contaFinanceira.moeda || "BRL"
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {data(cobranca.vencimento)}
                      </td>
                      <td className="px-3 py-4">
                        <span
                          className={
                            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
                            visual.classe
                          }
                        >
                          {visual.label}
                        </span>

                        {cobranca.baixadoPorNomeSnapshot && (
                          <p className="mt-2 text-xs text-slate-500">
                            {t("status.settledBy", {
                              name: cobranca.baixadoPorNomeSnapshot,
                            })}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {cobranca.ultimoEnvioEm ? (
                          <>
                            <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950 dark:text-violet-200">
                              {t("delivery.sent")}
                            </span>
                            <p className="mt-2 text-xs text-slate-500">
                              {t("delivery.sentDetails", {
                                channel:
                                  cobranca.ultimoEnvioCanal || "-",
                                date: data(
                                  cobranca.ultimoEnvioEm,
                                  true
                                ),
                              })}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {cobranca.ultimoEnvioPorNomeSnapshot || "-"}
                              {" · "}
                              {Number(
                                cobranca.quantidadeEnvios || 0
                              )}
                              ×
                            </p>
                          </>
                        ) : (
                          <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-200">
                            {t("delivery.generated")}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => abrirBoleto(cobranca)}
                            className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                          >
                            {t("actions.openPrint")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void copiarLinha(cobranca)}
                            className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                          >
                            {t("actions.copyLine")}
                          </button>

                          <button
                            type="button"
                            disabled={
                              enviandoId === cobranca.id ||
                              !cobranca.aluno.user?.email
                            }
                            onClick={() =>
                              void registrarEnvio(
                                cobranca,
                                "EMAIL"
                              )
                            }
                            className="rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {enviandoId === cobranca.id
                              ? t("actions.sending")
                              : t("actions.email")}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              abrirWhatsapp(cobranca)
                            }
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                          >
                            {t("actions.whatsapp")}
                          </button>

                          {whatsappPendenteId ===
                            cobranca.id && (
                            <button
                              type="button"
                              disabled={
                                enviandoId ===
                                cobranca.id
                              }
                              onClick={() =>
                                void registrarEnvio(
                                  cobranca,
                                  "WHATSAPP"
                                )
                              }
                              className="rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {t(
                                "actions.confirmWhatsapp"
                              )}
                            </button>
                          )}
                        </div>

                        {cobranca.erroIntegracao && (
                          <p className="mt-2 max-w-[280px] text-xs text-red-600 dark:text-red-300">
                            {cobranca.erroIntegracao}
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {t("pagination.page", {
              page: pagina,
              total: totalPaginas,
            })}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() =>
                setPagina((atual) => Math.max(1, atual - 1))
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              {t("pagination.previous")}
            </button>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() =>
                setPagina((atual) =>
                  Math.min(totalPaginas, atual + 1)
                )
              }
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-700"
            >
              {t("pagination.next")}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
