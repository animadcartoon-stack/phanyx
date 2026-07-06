"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

type Plano = "ESSENCIAL" | "PROFISSIONAL" | "ENTERPRISE";
type FormaPagamento = "CREDIT_CARD" | "PIX" | "BOLETO";

const TRIAL_PADRAO_MESES = 6;

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

  const trialQuery = Number(searchParams.get("trial") || TRIAL_PADRAO_MESES);
  const trialMeses =
  Number.isFinite(trialQuery) && trialQuery > 0
    ? trialQuery
    : TRIAL_PADRAO_MESES;

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
  useState<FormaPagamento>("CREDIT_CARD");
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
  trialMeses,
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

      if (data?.trial === true || data?.adesao?.status === "TESTE_GRATIS") {
  setPagamentoConfirmado(true);
  setStatusPagamento("TESTE_GRATIS");

  setTimeout(() => {
    window.location.href = `/sucesso?adesao=${data?.adesao?.id}&trial=1`;
  }, 1000);

  return;
}

if (data?.checkoutUrl) {
  window.location.href = data.checkoutUrl;
  return;
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

        if (status === "PAGO" || status === "TESTE_GRATIS") {
          setPagamentoConfirmado(true);
          setStatusPagamento("PAGO");
          clearInterval(interval);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });

          setTimeout(() => {
  window.location.href =
    status === "TESTE_GRATIS"
      ? `/sucesso?adesao=${adesaoId}&trial=1`
      : `/sucesso?adesao=${adesaoId}`;
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

 
  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-300">
            Adesão institucional PHANYX
          </p>
          <h1 className="mt-3 text-4xl font-bold">
  Comece o PHANYX com {trialMeses} meses grátis
</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
  Preencha os dados da instituição para liberar o ambiente PHANYX em teste gratuito.
  Sua instituição poderá usar a plataforma por {trialMeses} meses sem cobrança inicial.
  Se não houver cancelamento antes do fim do período, a cobrança mensal será iniciada
  conforme o plano escolhido, alunos ativos e polos cadastrados.
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
  • {trialMeses} meses grátis. Depois: {getValorPlano(plano)} / mês + cobrança por aluno ativo.
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

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
  <p className="text-sm font-black uppercase tracking-[0.18em] text-blue-200">
    Forma de cobrança após os {trialMeses} meses grátis
  </p>

  <h3 className="mt-2 text-xl font-black text-white">
    Escolha como a instituição será cobrada depois do período gratuito
  </h3>

  <p className="mt-3 text-sm leading-7 text-blue-100">
    Nenhuma cobrança será feita agora. A forma escolhida será usada somente
    após os {trialMeses} meses gratuitos, caso a instituição não cancele antes
    da primeira cobrança.
  </p>

  <div className="mt-5 grid gap-3">
    <button
      type="button"
      onClick={() => setFormaPagamento("CREDIT_CARD")}
      className={`rounded-2xl border p-4 text-left transition ${
        formaPagamento === "CREDIT_CARD"
          ? "border-emerald-400 bg-emerald-500/20 text-white shadow-[0_10px_30px_rgba(16,185,129,0.25)]"
          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">
            Cartão de crédito
            <span className="ml-2 rounded-full bg-emerald-400 px-2 py-1 text-[10px] font-black uppercase text-slate-950">
              Recomendado
            </span>
          </p>
          <p className="mt-1 text-sm leading-6">
            Você será direcionado ao ambiente seguro do Asaas para cadastrar
            o cartão. Nenhuma cobrança será feita hoje.
          </p>
        </div>
        <span className="text-xl">
          {formaPagamento === "CREDIT_CARD" ? "●" : "○"}
        </span>
      </div>
    </button>

    <button
      type="button"
      onClick={() => setFormaPagamento("PIX")}
      className={`rounded-2xl border p-4 text-left transition ${
        formaPagamento === "PIX"
          ? "border-blue-400 bg-blue-500/20 text-white shadow-[0_10px_30px_rgba(59,130,246,0.25)]"
          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">Pix mensal</p>
          <p className="mt-1 text-sm leading-6">
            Após o período gratuito, o Asaas gerará uma cobrança Pix mensal
            para pagamento manual pela instituição.
          </p>
        </div>
        <span className="text-xl">
          {formaPagamento === "PIX" ? "●" : "○"}
        </span>
      </div>
    </button>

    <button
      type="button"
      onClick={() => setFormaPagamento("BOLETO")}
      className={`rounded-2xl border p-4 text-left transition ${
        formaPagamento === "BOLETO"
          ? "border-amber-400 bg-amber-500/20 text-white shadow-[0_10px_30px_rgba(245,158,11,0.25)]"
          : "border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-black">Boleto mensal</p>
          <p className="mt-1 text-sm leading-6">
            Após o período gratuito, o Asaas gerará um boleto mensal. Essa
            opção depende de pagamento manual pela instituição.
          </p>
        </div>
        <span className="text-xl">
          {formaPagamento === "BOLETO" ? "●" : "○"}
        </span>
      </div>
    </button>
  </div>
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
  ? formaPagamento === "CREDIT_CARD"
    ? "⏳ Preparando checkout seguro..."
    : "⏳ Liberando ambiente..."
  : formaPagamento === "CREDIT_CARD"
    ? `Informar cartão e iniciar ${trialMeses} meses grátis`
    : `Começar ${trialMeses} meses grátis`}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold">Resumo do teste gratuito</h2>
<p className="mt-2 text-sm leading-6 text-slate-400">
  Nenhuma cobrança será gerada agora. O PHANYX liberará o ambiente institucional
  para uso por {trialMeses} meses.
</p>

              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 p-5">
  <p className="text-sm font-bold text-white">
    O que será liberado?
  </p>

  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
    <li>✓ Ambiente administrativo da instituição</li>
    <li>✓ Usuário administrador principal</li>
    <li>✓ Área do professor e área do aluno</li>
    <li>✓ Recursos do plano {plano}</li>
    <li>✓ Período gratuito de {trialMeses} meses</li>
  </ul>
</div>

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
  Ao iniciar o teste gratuito, o sistema criará automaticamente a instituição,
  o administrador principal, uma senha temporária e enviará os dados de acesso
  para o email informado.
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
