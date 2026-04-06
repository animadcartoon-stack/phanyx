"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Plano = "ESSENCIAL" | "PROFISSIONAL" | "ENTERPRISE";

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
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [adesaoId, setAdesaoId] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [statusPagamento, setStatusPagamento] = useState("PENDING");
  const [pagamentoConfirmado, setPagamentoConfirmado] = useState(false);

  useEffect(() => {
    setAdesaoId(null);
    setPixCode("");
    setErro("");
    setCopiado(false);
    setStatusPagamento("PENDING");
    setPagamentoConfirmado(false);
  }, [plano]);

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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("ERRO ADESAO FRONT:", data);

        setErro(data?.detalhe || data?.error || "Erro ao criar a adesão.");
        return;
      }

      setAdesaoId(data.adesao.id);
      setPixCode(data.adesao.pixCode || "");
      setStatusPagamento(data.adesao.status || "PENDING");
      setPagamentoConfirmado(data.adesao.status === "PAGO");

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

        const status = json?.adesao?.status || "PENDING";
        setStatusPagamento(status);

        if (status === "PAGO") {
          setPagamentoConfirmado(true);
          clearInterval(interval);

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
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
            Contrate o PHANYX para sua instituição
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Preencha os dados da instituição, gere o pagamento e receba o acesso
            administrativo principal após a confirmação.
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
              {loading ? "⏳ Gerando pagamento..." : "Gerar pagamento da adesão"}
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
              <h2 className="text-2xl font-bold">Pagamento</h2>
              <p className="mt-2 text-sm text-slate-400">
                Após gerar a adesão, o código Pix aparecerá aqui.
              </p>

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

              {pagamentoConfirmado ? (
                <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
                  Pagamento confirmado com sucesso. Sua instituição está sendo
                  ativada automaticamente.
                </div>
              ) : adesaoId ? (
                <div className="mt-4 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-4 text-sm text-blue-200">
                  Aguardando confirmação automática do pagamento...
                  <div className="mt-2 text-xs text-blue-300/80">
                    Status atual: {statusPagamento}
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