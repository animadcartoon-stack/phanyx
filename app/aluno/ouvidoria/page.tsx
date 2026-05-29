"use client";

import { useState } from "react";

export default function OuvidoriaAlunoPage() {
  const [tipo, setTipo] = useState("Sugestão");
  const [mensagem, setMensagem] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState("");
  const [erro, setErro] = useState("");

  async function enviarManifestacao() {
  setErro("");
  setSucesso("");

  if (!mensagem.trim()) {
    setErro("Escreva sua mensagem antes de enviar.");
    return;
  }

  try {
    setEnviando(true);

    const res = await fetch("/api/ouvidoria", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        origem: "ALUNO",
        tipo,
        mensagem,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Não foi possível enviar sua manifestação.");
    }

    setMensagem("");
    setTipo("Sugestão");
    setSucesso("Sua manifestação foi enviada com sucesso.");
  } catch (error: any) {
    setErro(error.message || "Erro ao enviar manifestação.");
  } finally {
    setEnviando(false);
  }
}

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold tracking-[0.25em] text-blue-700">
          CANAL DE COMUNICAÇÃO
        </p>

        <h1 className="mt-2 text-3xl font-black text-slate-900">
          Ouvidoria
        </h1>

        <p className="mt-2 max-w-3xl text-slate-600">
          Utilize este espaço para enviar sugestões, elogios, reclamações
ou relatar situações relacionadas às suas aulas, atendimento,
secretaria, financeiro ou qualquer experiência com a instituição.
        </p>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Tipo da manifestação
            </label>

            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-xl border p-3"
            >
              <option>Sugestão</option>
              <option>Reclamação</option>
              <option>Elogio</option>
              <option>Relato</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Mensagem
            </label>

            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={8}
              className="w-full rounded-xl border p-3"
              placeholder="Descreva sua sugestão, elogio, reclamação ou relato..."
            />
          </div>

{sucesso && (
  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
    {sucesso}
  </div>
)}

{erro && (
  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
    {erro}
  </div>
)}

          <div className="flex justify-end">
            <button
  type="button"
  onClick={enviarManifestacao}
  disabled={enviando}
  className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {enviando ? "Enviando..." : "Enviar manifestação"}
</button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <h2 className="text-lg font-black text-slate-900">
          Como funciona?
        </h2>

        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          <li>• Sua manifestação será encaminhada ao setor responsável.</li>
          <li>• Você poderá acompanhar o andamento futuramente nesta área.</li>
          <li>• Sugestões ajudam a melhorar a experiência dos alunos.</li>
          <li>• Reclamações e relatos serão analisados pela instituição.</li>
        </ul>
      </div>
    </div>
  );
}