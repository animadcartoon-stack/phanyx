"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

type Plano = "ESSENCIAL" | "PROFISSIONAL" | "ENTERPRISE";
type FormaPagamento = "PIX" | "BOLETO" | "CREDIT_CARD" | "RECORRENTE";

function getValorPlano(plano: string) {
  const p = plano.toUpperCase();

  
  if (p === "ESSENCIAL") return "R$ 49,00";
  if (p === "PROFISSIONAL") return "R$ 99,00";
  if (p === "ENTERPRISE") return "R$ 199,00";

  return "R$ 99,00";
}

function AdesaoContent() {
  const searchParams = useSearchParams();
  const planoQuery = searchParams.get("plano") || "PROFISSIONAL";

  const plano = useMemo<Plano>(() => {
    const p = planoQuery.toUpperCase();

    if (p === "ESSENCIAL") return "ESSENCIAL";
    if (p === "ENTERPRISE") return "ENTERPRISE";
    return "PROFISSIONAL";
  }, [planoQuery]);

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [nomeInstituicao, setNomeInstituicao] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>("PIX");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [adesaoId, setAdesaoId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState("PENDING");
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  const [cartao, setCartao] = useState({
    numero: "",
    nomeTitular: "",
    mesExpiracao: "",
    anoExpiracao: "",
    cvv: "",
    cpfCnpjTitular: "",
  });

  useEffect(() => {
    setAdesaoId(null);
    setPixCode("");
    setInvoiceUrl("");
    setErro("");
    setCopiado(false);
    setStatusPagamento("PENDING");
    setPagamentoConfirmado(false);
    setCartao({
      numero: "",
      nomeTitular: "",
      mesExpiracao: "",
      anoExpiracao: "",
      cvv: "",
      cpfCnpjTitular: "",
    });
  }, [plano, formaPagamento]);

  async function criarAdesao() {
    try {
      setLoading(true);
      setErro("");

      if (!nomeResponsavel || !nomeInstituicao || !email || !cpfCnpj) {
        setErro("Preencha todos os campos obrigatórios.");
        return;
      }

      
      const res = await fetch("/api/adesao/criar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeResponsavel,
          nomeInstituicao,
          email,
          telefone,
          cpfCnpj,
          plano,
          formaPagamento,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("ERRO ADESAO FRONT:", data);
        setErro(data?.detalhe || data?.error || "Erro ao criar a adesão.");
        return;
      }

      setAdesaoId(data?.adesao?.id ? String(data.adesao.id) : null);
      setPixCode(data?.pixCode || data?.adesao?.pixCode || "");
      setInvoiceUrl(data?.invoiceUrl || "");
      setStatusPagamento(data?.adesao?.status || "PENDING");
      setPagamentoConfirmado(data?.adesao?.status === "PAGO");

if (formaPagamento === "RECORRENTE" && data?.checkoutUrl) {
  window.open(data.checkoutUrl, "_blank", "noopener,noreferrer");
  return;
}

      if (formaPagamento === "RECORRENTE") {
        setStatusPagamento(data?.adesao?.status || "PROCESSANDO");
      }

      window.scrollTo({
        top: document.body.scrollHeight,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(error);
      setErro("Erro ao criar a adesão.");
    } finally {
      setLoading(false);
    }
  }

  function copiarPix() {
    navigator.clipboard.writeText(pixCode);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  useEffect(() => {
    if (!adesaoId || pagamentoConfirmado) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/adesao/status/${adesaoId}`);
        const json = await res.json();

        if (!res.ok) return;

        const status = json?.adesao?.status || json?.status || "PENDING";

        setStatusPagamento(status);

        if (status === "PAGO") {
          setPagamentoConfirmado(true);
          setStatusPagamento("PAGO");
          clearInterval(interval);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          setTimeout(() => {
            window.location.href = `/sucesso?adesao=${adesaoId}`;
          }, 1200);
        }

        if (
          status === "CANCELADO" ||
          status === "CANCELED" ||
          status === "EXPIRED"
        ) {
          clearInterval(interval);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          setTimeout(() => {
            window.location.href = "/cancelado?motivo=cobranca-expirada";
          }, 800);
        }

        if (status === "ERRO") {
          clearInterval(interval);
          setErro(
            "Ocorreu um erro ao processar sua cobrança. Gere uma nova adesão para continuar."
          );
        }
      } catch (error) {
        console.error("Erro ao consultar status da adesão:", error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [adesaoId, pagamentoConfirmado]);

  const ehPix = formaPagamento === "PIX";
  const ehBoletoOuCartao =
    formaPagamento === "BOLETO" || formaPagamento === "CREDIT_CARD";
  const ehRecorrente = formaPagamento === "RECORRENTE";

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
            Adesão institucional PHANYX
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Contrate o PHANYX para sua instituição
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Preencha os dados da instituição, escolha a forma de pagamento e
            receba o acesso administrativo principal após a confirmação.
          </p>
        </div>

        {pagamentoConfirmado ? (
          <div className="mb-8 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-emerald-200">
            <h3 className="text-xl font-bold">Pagamento confirmado ✅</h3>
            <p className="mt-2 text-sm leading-6">
              Sua instituição foi ativada com sucesso. O acesso administrativo
              será enviado automaticamente para o email informado.
            </p>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-2xl font-bold">Dados da adesão</h2>
            <p className="mt-2 text-sm text-slate-400">
              Plano selecionado: <strong className="text-white">{plano}</strong>{" "}
              • {getValorPlano(plano)} / mês + cobrança por aluno ativo
            </p>

            <div className="mt-8 grid gap-4">
              <input
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                placeholder="Nome do responsável"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <input
                value={nomeInstituicao}
                onChange={(e) => setNomeInstituicao(e.target.value)}
                placeholder="Nome da instituição"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email principal"
                type="email"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Telefone"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="CPF ou CNPJ"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />

              <div className="rounded-2xl border border-slate-700 bg-slate-950 p-4">
                <label className="mb-3 block text-sm font-semibold text-slate-200">
                  Forma de pagamento
                </label>

                <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setFormaPagamento("PIX")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      formaPagamento === "PIX"
                        ? "border-blue-500 bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    Pix
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormaPagamento("BOLETO")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      formaPagamento === "BOLETO"
                        ? "border-blue-500 bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    Boleto
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormaPagamento("CREDIT_CARD")}
                    className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      formaPagamento === "CREDIT_CARD"
                        ? "border-blue-500 bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]"
                        : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                    }`}
                  >
                    Cartão
                  </button>

                  <button
  type="button"
  onClick={() => setFormaPagamento("RECORRENTE")}
  className={`hidden group relative overflow-hidden rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
    formaPagamento === "RECORRENTE"
      ? "border-blue-400 bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-[0_14px_45px_rgba(37,99,235,0.45)]"
      : "border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 hover:border-blue-400/40 hover:shadow-[0_14px_45px_rgba(37,99,235,0.18)]"
  }`}
>
                
                    <span className="flex flex-col items-center justify-center">
                      <span className="text-sm font-semibold leading-tight">
                        Assinatura
                      </span>
                      <span className="text-[10px] text-blue-100/80">
                        mensal automática
                      </span>
                    </span>
                  </button>
                </div>

                {false ? (
                  <div className="mt-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
                    <p className="font-semibold text-white">
                      Cobrança automática mensal no cartão
                    </p>
                    <p className="mt-1 leading-6 text-blue-100/90">
                      Ideal para operação SaaS: a cobrança é renovada
                      automaticamente a cada ciclo mensal.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            {erro && (
              <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {erro}
              </div>
            )}

            <button
              onClick={criarAdesao}
              disabled={loading}
              className="mt-8 w-full rounded-2xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
            >
              {loading
                ? "⏳ Gerando cobrança..."
                : ehRecorrente
                ? "Gerar assinatura mensal"
                : "Gerar cobrança da adesão"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold">Pagamento</h2>
              <p className="mt-2 text-sm text-slate-400">
                Após gerar a adesão, o retorno da cobrança aparecerá aqui.
              </p>

              {ehPix ? (
                <>
                  <div className="mt-6 flex justify-center rounded-2xl bg-white p-4">
                    <div className="flex h-48 w-48 items-center justify-center bg-slate-200 text-sm text-slate-900">
                      {pixCode ? "QR CODE GERADO" : "Aguardando geração"}
                    </div>
                  </div>

                  <div className="mt-6 break-all rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm text-slate-300">
                    {pixCode || "O código Pix aparecerá aqui."}
                  </div>

                  <button
                    onClick={copiarPix}
                    disabled={!pixCode}
                    className="mt-4 w-full rounded-2xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20 disabled:opacity-50"
                  >
                    {copiado ? "Código Pix copiado!" : "Copiar código Pix"}
                  </button>
                </>
              ) : null}

              {ehBoletoOuCartao ? (
                <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
                  <p className="text-sm leading-6 text-slate-300">
                    {formaPagamento === "BOLETO"
                      ? "A cobrança por boleto será aberta no link abaixo."
                      : "O checkout do cartão será aberto no link abaixo."}
                  </p>

                  <a
                    href={invoiceUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold transition ${
                      invoiceUrl
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "cursor-not-allowed bg-slate-800 text-slate-500"
                    }`}
                  >
                    {formaPagamento === "BOLETO"
                      ? "Abrir cobrança em boleto"
                      : "Abrir checkout do cartão"}
                  </a>
                </div>
              ) : null}

              {false ? (
                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-slate-950 p-5">
                  <p className="text-sm leading-6 text-slate-200">
                    A assinatura mensal será criada automaticamente após a validação dos dados do cartão.
                  </p>

                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
                    {adesaoId
                      ? "Assinatura enviada ao Asaas. Estamos aguardando a confirmação automática."
                      : "Aguardando criação da assinatura recorrente."}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      value={cartao.numero}
                      onChange={(e) =>
                        setCartao({ ...cartao, numero: e.target.value })
                      }
                      placeholder="Número do cartão"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <input
                      value={cartao.nomeTitular}
                      onChange={(e) =>
                        setCartao({ ...cartao, nomeTitular: e.target.value })
                      }
                      placeholder="Nome impresso no cartão"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <input
                      value={cartao.mesExpiracao}
                      onChange={(e) =>
                        setCartao({ ...cartao, mesExpiracao: e.target.value })
                      }
                      placeholder="Mês (MM)"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <input
                      value={cartao.anoExpiracao}
                      onChange={(e) =>
                        setCartao({ ...cartao, anoExpiracao: e.target.value })
                      }
                      placeholder="Ano (AAAA)"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <input
                      value={cartao.cvv}
                      onChange={(e) =>
                        setCartao({ ...cartao, cvv: e.target.value })
                      }
                      placeholder="CVV"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />

                    <input
                      value={cartao.cpfCnpjTitular}
                      onChange={(e) =>
                        setCartao({
                          ...cartao,
                          cpfCnpjTitular: e.target.value,
                        })
                      }
                      placeholder="CPF/CNPJ do titular"
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : null}

              {pagamentoConfirmado ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                  Pagamento confirmado com sucesso. Sua instituição está sendo ativada automaticamente.
                </div>
              ) : adesaoId ? (
                <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 text-sm text-blue-200">
                  Estamos acompanhando automaticamente sua cobrança.
                  <div className="mt-2 text-xs text-blue-300/80">
                    Status atual: {statusPagamento}
                  </div>
                  <div className="mt-1 text-xs text-blue-300/70">
                    Assim que o pagamento for aprovado, você será redirecionada automaticamente.
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold">Acesso institucional</h2>

              <p className="mt-3 text-sm leading-7 text-slate-400">
                Depois da confirmação, o sistema criará automaticamente:
                instituição, admin principal, senha inicial temporária e envio
                de email de acesso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdesaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
              Carregando adesão...
            </div>
          </div>
        </div>
      }
    >
      <AdesaoContent />
    </Suspense>
  );
}
