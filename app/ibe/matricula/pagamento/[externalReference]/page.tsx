"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type FormaPagamento =
  | "PIX"
  | "CREDIT_CARD"
  | "BOLETO"
  | "DEBIT_CARD";

type ModoPagamento =
  | "UNICO"
  | "DUAS_FORMAS";

type PagamentoIbe = {
  ordem: number;
  forma: string;
  billingTypeAsaas?: string | null;
  tipoIntegracao: string;
  valor: number;
  status: string;
  urlPagamento?: string | null;
  expiraEm?: string | null;
  pagoEm?: string | null;
};

type MatriculaIbe = {
  externalReference: string;
  nome: string;
  email: string;
  valorTotal: number;
  valorPago: number;
  saldoRestante: number;
  status: string;
  modoPagamento: string;
  quantidadePartes: number;
  criadaEm: string;
};

type PagamentosResponse = {
  matricula: MatriculaIbe;
  pagamentos: PagamentoIbe[];
};

const FORMAS_PAGAMENTO: Array<{
  id: FormaPagamento;
  titulo: string;
  descricao: string;
}> = [
  {
    id: "PIX",
    titulo: "Pix",
    descricao: "Pagamento à vista e confirmação rápida.",
  },
  {
    id: "CREDIT_CARD",
    titulo: "Cartão de crédito",
    descricao: "Pagamento à vista ou parcelado.",
  },
  {
    id: "BOLETO",
    titulo: "Boleto bancário",
    descricao: "Boleto com vencimento para pagamento.",
  },
  {
    id: "DEBIT_CARD",
    titulo: "Cartão de débito",
    descricao: "Pagamento pela página segura do Asaas.",
  },
];

function formatarMoeda(valor: number) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarData(
  valor?: string | null
) {
  if (!valor) return null;

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function obterNomeForma(
  forma: string
) {
  const valor = String(
    forma || ""
  ).toUpperCase();

  if (valor === "PIX") {
    return "Pix";
  }

  if (valor === "CREDIT_CARD") {
    return "Cartão de crédito";
  }

  if (valor === "BOLETO") {
    return "Boleto bancário";
  }

  if (valor === "DEBIT_CARD") {
    return "Cartão de débito";
  }

  return "Pagamento";
}

function obterStatusPagamento(
  status: string
) {
  const valor = String(
    status || ""
  ).toUpperCase();

  if (valor === "PAGO") {
    return {
      texto: "Pagamento confirmado",
      classe:
        "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  if (valor === "EXPIRADO") {
    return {
      texto: "Link expirado",
      classe:
        "border-amber-200 bg-amber-50 text-amber-800",
    };
  }

  if (valor === "CANCELADO") {
    return {
      texto: "Cancelado",
      classe:
        "border-red-200 bg-red-50 text-red-800",
    };
  }

  if (valor === "ERRO") {
    return {
      texto: "Erro no pagamento",
      classe:
        "border-red-200 bg-red-50 text-red-800",
    };
  }

  return {
    texto: "Aguardando pagamento",
    classe:
      "border-blue-200 bg-blue-50 text-blue-800",
  };
}

function converterValorDigitado(
  texto: string
) {
  const somenteNumeros = String(
    texto || ""
  ).replace(/\D/g, "");

  if (!somenteNumeros) {
    return 0;
  }

  return Number(somenteNumeros) / 100;
}

function formatarValorDigitado(
  valor: number
) {
  return Number(valor || 0)
    .toFixed(2)
    .replace(".", ",");
}

export default function PagamentoMatriculaIbePage() {
  const params = useParams<{
    externalReference: string;
  }>();

  const externalReference = String(
    params?.externalReference || ""
  );

  const [dados, setDados] =
    useState<PagamentosResponse | null>(
      null
    );

  const [carregando, setCarregando] =
    useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    preparandoPagamento,
    setPreparandoPagamento,
  ] = useState(false);

  const [erro, setErro] =
    useState("");

  const [
    modoPagamento,
    setModoPagamento,
  ] = useState<ModoPagamento>("UNICO");

  const [
    formaPagamento1,
    setFormaPagamento1,
  ] = useState<FormaPagamento>("PIX");

  const [
    formaPagamento2,
    setFormaPagamento2,
  ] = useState<FormaPagamento>(
    "CREDIT_CARD"
  );

  const [
    valorPrimeiraParteTexto,
    setValorPrimeiraParteTexto,
  ] = useState("");

  const carregarPagamentos =
    useCallback(
      async (
        mostrarCarregamento = false
      ) => {
        if (!externalReference) {
          return;
        }

        if (mostrarCarregamento) {
          setAtualizando(true);
        }

        try {
          const resposta = await fetch(
            `/api/ibe/matricula/pagamento/${encodeURIComponent(
              externalReference
            )}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          const resultado =
            await resposta
              .json()
              .catch(() => ({}));

          if (!resposta.ok) {
            setErro(
              resultado?.error ||
                "Não foi possível consultar os pagamentos."
            );

            return;
          }

          setDados(resultado);
          setErro("");
        } catch (error) {
          console.error(
            "Erro ao consultar pagamentos:",
            error
          );

          setErro(
            "Não foi possível comunicar com o servidor."
          );
        } finally {
          setCarregando(false);
          setAtualizando(false);
        }
      },
      [externalReference]
    );

  useEffect(() => {
    carregarPagamentos();
  }, [carregarPagamentos]);

  useEffect(() => {
    if (!dados) return;

    const possuiPendente =
      dados.pagamentos.some(
        (pagamento) =>
          pagamento.status ===
          "AGUARDANDO_PAGAMENTO"
      );

    if (!possuiPendente) return;

    const intervalo = window.setInterval(
      () => {
        carregarPagamentos();
      },
      10000
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, [
    dados,
    carregarPagamentos,
  ]);

  const valorTotal =
    dados?.matricula.valorTotal || 0;

  const valorPrimeiraParte =
    modoPagamento === "DUAS_FORMAS"
      ? Number(
          converterValorDigitado(
            valorPrimeiraParteTexto
          ).toFixed(2)
        )
      : Number(valorTotal.toFixed(2));

  const valorSegundaParte =
    modoPagamento === "DUAS_FORMAS"
      ? Number(
          Math.max(
            0,
            valorTotal -
              valorPrimeiraParte
          ).toFixed(2)
        )
      : 0;

  const divisaoValida =
    modoPagamento === "UNICO" ||
    (
      valorPrimeiraParte >= 1 &&
      valorSegundaParte >= 1 &&
      Math.abs(
        valorPrimeiraParte +
          valorSegundaParte -
          valorTotal
      ) < 0.01
    );

  const pagamentosJaPreparados =
    Boolean(
      dados &&
      (
        dados.pagamentos.length > 0 ||
        dados.matricula.quantidadePartes >
          0
      )
    );

  const mostrarEscolhaPagamento =
    Boolean(
      dados &&
      !pagamentosJaPreparados &&
      dados.matricula.status !==
        "PAGO"
    );

  const formasComCobranca = useMemo(
    () =>
      [
        formaPagamento1,
        modoPagamento ===
        "DUAS_FORMAS"
          ? formaPagamento2
          : null,
      ].some(
        (forma) =>
          forma === "BOLETO" ||
          forma === "DEBIT_CARD"
      ),
    [
      formaPagamento1,
      formaPagamento2,
      modoPagamento,
    ]
  );

  function selecionarModo(
    modo: ModoPagamento
  ) {
    setModoPagamento(modo);
    setErro("");

    if (
      modo === "DUAS_FORMAS"
    ) {
      const metade = Number(
        (valorTotal / 2).toFixed(2)
      );

      setValorPrimeiraParteTexto(
        formatarValorDigitado(metade)
      );
    } else {
      setValorPrimeiraParteTexto("");
    }
  }

  async function prepararPagamentos() {
    if (
      preparandoPagamento ||
      !dados
    ) {
      return;
    }

    if (
      modoPagamento ===
        "DUAS_FORMAS" &&
      !divisaoValida
    ) {
      setErro(
        "Informe um valor válido. Cada parte precisa ter pelo menos R$ 1,00."
      );
      return;
    }

    const partesPagamento =
      modoPagamento === "UNICO"
        ? [
            {
              ordem: 1,
              forma:
                formaPagamento1,
              valor:
                dados.matricula
                  .valorTotal,
            },
          ]
        : [
            {
              ordem: 1,
              forma:
                formaPagamento1,
              valor:
                valorPrimeiraParte,
            },
            {
              ordem: 2,
              forma:
                formaPagamento2,
              valor:
                valorSegundaParte,
            },
          ];

    setPreparandoPagamento(true);
    setErro("");

    try {
      const resposta = await fetch(
        `/api/ibe/matricula/pagamento/${encodeURIComponent(
          externalReference
        )}`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            modoPagamento,
            partesPagamento,
          }),
        }
      );

      const resultado =
        await resposta
          .json()
          .catch(() => ({}));

      if (!resposta.ok) {
        if (
          resultado?.jaPreparado
        ) {
          await carregarPagamentos(
            true
          );
          return;
        }

        setErro(
          resultado?.error ||
            "Não foi possível preparar os pagamentos."
        );
        return;
      }

      await carregarPagamentos(true);
    } catch (error) {
      console.error(
        "Erro ao preparar pagamentos:",
        error
      );

      setErro(
        "Não foi possível comunicar com o servidor."
      );
    } finally {
      setPreparandoPagamento(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg font-bold text-slate-900">
            Consultando pagamentos...
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Aguarde alguns segundos.
          </p>
        </div>
      </main>
    );
  }

  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-xl font-bold text-red-700">
            Pagamento não encontrado
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            {erro ||
              "Não foi possível localizar esta matrícula."}
          </p>

          <a
            href="/ibe/matricula/checkout"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
          >
            Voltar para a matrícula
          </a>
        </div>
      </main>
    );
  }

  const {
    matricula,
    pagamentos,
  } = dados;

  const matriculaPaga =
    matricula.status === "PAGO";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 px-5 py-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl bg-slate-900 p-7 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/ibe/logo-branca.png"
              alt="Logo IBE"
              width={130}
              height={70}
              className="h-auto w-28"
            />

            <div>
              <p className="text-sm font-semibold text-emerald-300">
                Matrícula online IBE
              </p>

              <h1 className="text-2xl font-black">
                Pagamento da matrícula
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                {matricula.nome}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              carregarPagamentos(true)
            }
            disabled={
              atualizando ||
              preparandoPagamento
            }
            className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {atualizando
              ? "Atualizando..."
              : "Atualizar situação"}
          </button>
        </header>

        {erro && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {erro}
          </div>
        )}

        {matriculaPaga && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="font-bold text-emerald-900">
              Pagamento concluído
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              O valor total da matrícula foi
              confirmado. O acesso e os documentos
              serão processados pelo PHANYX.
            </p>
          </div>
        )}

        {matricula.status ===
          "PAGAMENTO_PARCIAL" && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
            <h2 className="font-bold text-blue-900">
              Pagamento parcial confirmado
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-blue-800">
              Uma das partes já foi paga. Conclua
              a parte restante para liberar a
              matrícula.
            </p>
          </div>
        )}

        <section className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total
            </p>

            <p className="mt-2 text-2xl font-black text-slate-900">
              {formatarMoeda(
                matricula.valorTotal
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confirmado
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-700">
              {formatarMoeda(
                matricula.valorPago
              )}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Restante
            </p>

            <p className="mt-2 text-2xl font-black text-blue-700">
              {formatarMoeda(
                matricula.saldoRestante
              )}
            </p>
          </div>
        </section>

        {mostrarEscolhaPagamento && (
          <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Etapa de pagamento
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Como deseja pagar?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Escolha uma forma para o valor total
                ou divida a matrícula em duas formas
                de pagamento.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  selecionarModo("UNICO")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  modoPagamento === "UNICO"
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                }`}
              >
                <span className="block font-bold text-slate-900">
                  Uma forma de pagamento
                </span>

                <span className="mt-1 block text-sm text-slate-600">
                  Pague o valor total com uma única
                  opção.
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  selecionarModo(
                    "DUAS_FORMAS"
                  )
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  modoPagamento ===
                  "DUAS_FORMAS"
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                }`}
              >
                <span className="block font-bold text-slate-900">
                  Dividir em duas formas
                </span>

                <span className="mt-1 block text-sm text-slate-600">
                  Escolha duas opções e defina o
                  valor da primeira parte.
                </span>
              </button>
            </div>

            <div className="mt-7">
              <h3 className="font-bold text-slate-900">
                {modoPagamento ===
                "DUAS_FORMAS"
                  ? "Forma da primeira parte"
                  : "Forma de pagamento"}
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {FORMAS_PAGAMENTO.map(
                  (forma) => (
                    <button
                      key={`p1-${forma.id}`}
                      type="button"
                      onClick={() =>
                        setFormaPagamento1(
                          forma.id
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        formaPagamento1 ===
                        forma.id
                          ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                      }`}
                    >
                      <span className="block font-bold text-slate-900">
                        {forma.titulo}
                      </span>

                      <span className="mt-1 block text-sm text-slate-600">
                        {forma.descricao}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {modoPagamento ===
              "DUAS_FORMAS" && (
              <>
                <div className="mt-7">
                  <label className="font-bold text-slate-900">
                    Valor da primeira parte
                  </label>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_180px_180px]">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        valorPrimeiraParteTexto
                      }
                      onChange={(event) =>
                        setValorPrimeiraParteTexto(
                          event.target.value
                        )
                      }
                      placeholder="Ex.: 1.500,00"
                      className="rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />

                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Parte 1
                      </span>

                      <strong className="mt-1 block text-slate-900">
                        {formatarMoeda(
                          valorPrimeiraParte
                        )}
                      </strong>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-3">
                      <span className="block text-xs font-semibold uppercase text-slate-500">
                        Parte 2
                      </span>

                      <strong className="mt-1 block text-slate-900">
                        {formatarMoeda(
                          valorSegundaParte
                        )}
                      </strong>
                    </div>
                  </div>

                  {!divisaoValida && (
                    <p className="mt-2 text-sm font-semibold text-red-600">
                      Cada parte precisa ter pelo
                      menos R$ 1,00.
                    </p>
                  )}
                </div>

                <div className="mt-7">
                  <h3 className="font-bold text-slate-900">
                    Forma da segunda parte
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {FORMAS_PAGAMENTO.map(
                      (forma) => (
                        <button
                          key={`p2-${forma.id}`}
                          type="button"
                          onClick={() =>
                            setFormaPagamento2(
                              forma.id
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            formaPagamento2 ===
                            forma.id
                              ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100"
                              : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40"
                          }`}
                        >
                          <span className="block font-bold text-slate-900">
                            {forma.titulo}
                          </span>

                          <span className="mt-1 block text-sm text-slate-600">
                            {forma.descricao}
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </>
            )}

            {formasComCobranca && (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
                Boleto e cartão de débito criam uma
                cobrança real no Asaas somente
                depois da confirmação abaixo.
              </div>
            )}

            {modoPagamento ===
              "DUAS_FORMAS" && (
              <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-relaxed text-blue-800">
                A matrícula será liberada somente
                depois da confirmação das duas
                partes.
              </div>
            )}

            <button
              type="button"
              onClick={
                prepararPagamentos
              }
              disabled={
                preparandoPagamento ||
                !divisaoValida
              }
              className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {preparandoPagamento
                ? "Preparando pagamentos..."
                : modoPagamento ===
                    "DUAS_FORMAS"
                ? "Confirmar divisão e continuar"
                : formaPagamento1 ===
                    "BOLETO"
                ? "Gerar boleto"
                : "Continuar para pagamento"}
            </button>
          </section>
        )}

        <section className="space-y-5">
          {pagamentos.map(
            (pagamento) => {
              const status =
                obterStatusPagamento(
                  pagamento.status
                );

              const pagamentoConfirmado =
                pagamento.status ===
                "PAGO";

              const pagamentoDisponivel =
                !pagamentoConfirmado &&
                pagamento.status !==
                  "EXPIRADO" &&
                pagamento.status !==
                  "CANCELADO" &&
                Boolean(
                  pagamento.urlPagamento
                );

              return (
                <article
                  key={pagamento.ordem}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        Parte{" "}
                        {pagamento.ordem}
                      </p>

                      <h2 className="mt-1 text-xl font-black text-slate-900">
                        {obterNomeForma(
                          pagamento.forma
                        )}
                      </h2>

                      <p className="mt-2 text-3xl font-black text-slate-900">
                        {formatarMoeda(
                          pagamento.valor
                        )}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${status.classe}`}
                    >
                      {status.texto}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    {pagamento.expiraEm && (
                      <div className="rounded-xl bg-slate-50 p-3">
                        <span className="block text-xs text-slate-500">
                          Validade do link
                        </span>

                        <strong className="mt-1 block text-slate-800">
                          {formatarData(
                            pagamento.expiraEm
                          ) ||
                            "Não informada"}
                        </strong>
                      </div>
                    )}

                    {pagamento.pagoEm && (
                      <div className="rounded-xl bg-emerald-50 p-3">
                        <span className="block text-xs text-emerald-700">
                          Confirmado em
                        </span>

                        <strong className="mt-1 block text-emerald-900">
                          {formatarData(
                            pagamento.pagoEm
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  {pagamentoDisponivel && (
                    <a
                      href={
                        pagamento.urlPagamento ||
                        "#"
                      }
                      className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-4 font-bold text-white transition hover:bg-emerald-700 sm:w-auto"
                    >
                      Pagar parte{" "}
                      {pagamento.ordem} com{" "}
                      {obterNomeForma(
                        pagamento.forma
                      )}
                    </a>
                  )}

                  {pagamentoConfirmado && (
                    <p className="mt-6 text-sm font-semibold text-emerald-700">
                      Esta parte já foi
                      confirmada.
                    </p>
                  )}

                  {(pagamento.status ===
                    "EXPIRADO" ||
                    pagamento.status ===
                      "CANCELADO") && (
                    <p className="mt-6 text-sm font-semibold text-amber-700">
                      Este link não está mais
                      disponível.
                    </p>
                  )}
                </article>
              );
            }
          )}
        </section>

        <footer className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-600">
          <p>
            A matrícula somente será liberada
            depois que o valor total for
            confirmado pelo Asaas.
          </p>

          <p className="mt-2 text-xs text-slate-400">
            Referência:{" "}
            {matricula.externalReference}
          </p>
        </footer>
      </div>
    </main>
  );
}