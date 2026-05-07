"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import PhanyxToast from "@/components/ui/PhanyxToast";

export default function AssinarContratoPage() {
  const params = useParams();
  const contratoId = params.id;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [desenhando, setDesenhando] = useState(false);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [contratoHtml, setContratoHtml] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  function iniciarDesenho(e: any) {
    setDesenhando(true);
    desenhar(e);
  }

  function pararDesenho() {
    setDesenhando(false);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
  }

  function desenhar(e: any) {
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

  async function assinar() {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const assinaturaBase64 = canvas.toDataURL();

    const res = await fetch("/api/contratos/assinar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contratoId,
        nome,
        cpf,
        assinaturaBase64,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.error || "Erro ao assinar.");
      return;
    }

    setSucesso("Contrato assinado com sucesso.");
  }
useEffect(() => {
  async function carregarContrato() {
    const res = await fetch(`/api/contratos/${contratoId}`);
    const data = await res.json();

    if (res.ok) {
      setContratoHtml(data.conteudo);
    }
  }

  if (contratoId) {
    carregarContrato();
  }
}, [contratoId]);
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6 bg-white text-black rounded-xl mt-6 shadow">
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
      <h1 className="text-xl font-bold">Assinatura de Contrato</h1>

      <input
        placeholder="Seu nome completo"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        className="w-full border p-2 rounded"
      />

      <input
        placeholder="CPF"
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        className="w-full border p-2 rounded"
      />

<div className="border p-4 rounded bg-white text-black max-h-[300px] overflow-auto">
  <div
    className="text-black whitespace-pre-wrap leading-7"
    dangerouslySetInnerHTML={{ __html: contratoHtml }}
  />
</div>

      <div>
        <p className="mb-2 text-sm text-gray-600">
          Assine abaixo:
        </p>

        <canvas
          ref={canvasRef}
          width={500}
          height={200}
          className="border rounded bg-white"
          onMouseDown={iniciarDesenho}
          onMouseUp={pararDesenho}
          onMouseMove={desenhar}
          onMouseLeave={pararDesenho}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={limparAssinatura}
          className="bg-gray-500 text-white px-4 py-2 rounded"
        >
          Limpar
        </button>

        <button
          onClick={assinar}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Assinar contrato
        </button>
      </div>
    </div>
  );
}