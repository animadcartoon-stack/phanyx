"use client";

import { useState } from "react";

export default function ConfiguracaoCertificadoPage() {
  const [certificadoTemplateUrl, setCertificadoTemplateUrl] = useState("");
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] = useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    try {
      setSalvando(true);

      const res = await fetch("/api/admin/configuracoes/certificado", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          certificadoTemplateUrl,
          certificadoCoordenadorNome,
          certificadoCidade,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao salvar.");
        return;
      }

      alert("Configuração do certificado salva com sucesso.");
    } catch (error) {
      alert("Erro ao salvar configuração do certificado.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-bold mb-2">Configuração de Certificado</h1>
      <p className="text-slate-600 mb-6">
        Informe a URL do modelo PDF e os dados institucionais usados no certificado automático.
      </p>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium">
            URL do modelo do certificado
          </label>
          <input
            type="text"
            value={certificadoTemplateUrl}
            onChange={(e) => setCertificadoTemplateUrl(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Nome do coordenador
          </label>
          <input
            type="text"
            value={certificadoCoordenadorNome}
            onChange={(e) => setCertificadoCoordenadorNome(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            placeholder="Ex.: Roberto Ramos da Silva"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Cidade do certificado
          </label>
          <input
            type="text"
            value={certificadoCidade}
            onChange={(e) => setCertificadoCidade(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            placeholder="Ex.: São José"
          />
        </div>

        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar configuração"}
        </button>
      </div>
    </div>
  );
}