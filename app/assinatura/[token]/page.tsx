"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";

type ContratoApi = {
  id: number;
  tokenAssinatura?: string | null;
  status: string;
  conteudo: string;
  dataCriacao?: string;
  dataAssinatura?: string | null;
  aluno?: {
    id: number;
    nome: string;
    cpf?: string | null;
    matricula?: string | null;
  } | null;
  matricula?: {
    id: number;
    status?: string | null;
    semestre?: number | null;
    curso?: {
      id: number;
      nome: string;
    } | null;
  } | null;
  assinatura?: {
    id: number;
    nome: string;
    cpf: string;
    data: string;
  } | null;
};

export default function AssinaturaPorTokenPage() {
  const params = useParams();
  const token = String(params.token || "");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [desenhando, setDesenhando] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [contrato, setContrato] = useState<ContratoApi | null>(null);

  function iniciarDesenho(e: React.MouseEvent<HTMLCanvasElement>) {
    setDesenhando(true);
    desenhar(e);
  }

  function pararDesenho() {
    setDesenhando(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
  }

  function desenhar(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!desenhando) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }

  function limparAssinatura() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  async function carregarContrato() {
    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch(`/api/assinatura/${token}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao carregar contrato");
      }

      setContrato(data);
      setNome(data?.aluno?.nome || "");
      setCpf(data?.aluno?.cpf || "");
    } catch (error: any) {
      console.error(error);
      setMensagem(error?.message || "Erro ao carregar contrato");
      setContrato(null);
    } finally {
      setLoading(false);
    }
  }

  async function assinar() {
    try {
      if (!contrato) return;

      if (contrato.status === "ASSINADO") {
        setErro("Este contrato já foi assinado.");
        return;
      }

      const canvas = canvasRef.current;

      if (!canvas) {
  setErro("Canvas de assinatura não encontrado.");
  return;
}

      const assinaturaBase64 = canvas.toDataURL("image/png");
console.log("ASSINATURA GERADA");

      if (!nome.trim()) {
        setErro("Informe o nome completo antes de assinar.");
        return;
      }

      if (!cpf.trim()) {
        setErro("Informe o CPF antes de assinar.");
        return;
      }

      setSaving(true);
      setMensagem("");

      const res = await fetch("/api/assinatura/assinar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          nome,
          cpf,
          assinaturaBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao assinar");
      }

      setSucesso("Contrato assinado com sucesso.");
      await carregarContrato();
    } catch (error: any) {
  console.error("ERRO ASSINATURA:", error);
  setErro(error?.message || "Erro ao assinar contrato");
} finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (token) {
      carregarContrato();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-black px-4 py-8">
      {erro && (
  <PhanyxToast
    tipo="erro"
    titulo="Não foi possível assinar"
    mensagem={erro}
    onClose={() => setErro("")}
  />
)}

{sucesso && (
  <PhanyxToast
    tipo="sucesso"
    titulo="Tudo certo"
    mensagem={sucesso}
    onClose={() => setSucesso("")}
  />
)}
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-gray-900">
          Assinatura de Contrato
        </h1>

        {mensagem ? (
          <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-gray-700">
            {mensagem}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 text-sm text-gray-600">Carregando contrato...</div>
        ) : !contrato ? (
          <div className="mt-6 text-sm text-red-600">
            Contrato não encontrado.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Nome completo
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="Seu nome completo"
                  disabled={contrato.status === "ASSINADO"}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <input
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2"
                  placeholder="CPF"
                  disabled={contrato.status === "ASSINADO"}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-sm">
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium text-gray-800">{contrato.status}</p>
              </div>

              <div>
                <p className="text-gray-500">Aluno</p>
                <p className="font-medium text-gray-800">
                  {contrato.aluno?.nome || "-"}
                </p>
              </div>

              <div>
                <p className="text-gray-500">Matrícula</p>
                <p className="font-medium text-gray-800">
                  {contrato.aluno?.matricula || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <p className="mb-2 text-sm font-medium text-gray-700">Contrato</p>
              <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border bg-gray-50 p-4 text-sm leading-7 text-gray-800">
                {contrato.conteudo}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm text-gray-600">Assine abaixo:</p>

              <canvas
                ref={canvasRef}
                width={700}
                height={220}
                className="w-full rounded-xl border bg-white"
                onMouseDown={iniciarDesenho}
                onMouseUp={pararDesenho}
                onMouseMove={desenhar}
                onMouseLeave={pararDesenho}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={limparAssinatura}
                className="rounded-xl bg-gray-500 px-4 py-2 text-white"
                disabled={contrato.status === "ASSINADO" || saving}
              >
                Limpar
              </button>

              <button
                onClick={assinar}
                className="rounded-xl bg-green-600 px-4 py-2 text-white"
                disabled={contrato.status === "ASSINADO" || saving}
              >
                {contrato.status === "ASSINADO"
                  ? "Contrato já assinado"
                  : saving
                  ? "Assinando..."
                  : "Assinar contrato"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}