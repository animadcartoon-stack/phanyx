"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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

  if (
    Number.isNaN(data.getTime())
  ) {
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

  const [erro, setErro] =
    useState("");

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

  /*
   * Enquanto houver pagamento pendente,
   * atualiza automaticamente o status.
   */
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
            disabled={atualizando}
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
                      disponível. Em seguida
                      adicionaremos a opção de
                      gerar um novo link sem criar
                      outra matrícula.
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