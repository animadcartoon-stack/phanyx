"use client";

import { useEffect, useState } from "react";

export default function ConfiguracaoCertificadoPage() {
  const [certificadoTemplateUrl, setCertificadoTemplateUrl] = useState("");
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] = useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [arquivoModelo, setArquivoModelo] = useState<File | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);

  useEffect(() => {
    async function carregarConfiguracao() {
      try {
        const res = await fetch("/api/admin/configuracoes/certificado", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data?.error || "Erro ao buscar configuração");
          return;
        }

        setCertificadoTemplateUrl(data?.certificadoTemplateUrl || "");
        setCertificadoCoordenadorNome(data?.certificadoCoordenadorNome || "");
        setCertificadoCidade(data?.certificadoCidade || "");
      } catch {
        alert("Erro ao carregar configuração do certificado.");
      } finally {
        setCarregando(false);
      }
    }

    carregarConfiguracao();
  }, []);

  async function fazerUploadModelo() {
    if (!arquivoModelo) {
      alert("Selecione um arquivo PDF do modelo.");
      return;
    }

    try {
      setEnviandoArquivo(true);

      const formData = new FormData();
      formData.append("file", arquivoModelo);

      const res = await fetch("/api/admin/configuracoes/certificado/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || "Erro ao enviar arquivo.");
        return;
      }

      setCertificadoTemplateUrl(data.url || "");
      alert("Modelo do certificado enviado com sucesso.");
    } catch {
      alert("Erro ao fazer upload do modelo.");
    } finally {
      setEnviandoArquivo(false);
    }
  }

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
    } catch {
      alert("Erro ao salvar configuração do certificado.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="mb-2 text-2xl font-bold">Configuração de Certificado</h1>
        <p className="text-slate-600">Carregando configuração...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-2xl font-bold">Configuração de Certificado</h1>
      <p className="mb-6 text-slate-600">
        Informe a URL do modelo PDF e os dados institucionais usados no certificado automático.
      </p>

      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label className="mb-2 block text-sm font-medium">
            Upload do modelo em PDF
          </label>

          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArquivoModelo(e.target.files?.[0] || null)}
            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          />

          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fazerUploadModelo}
              disabled={enviandoArquivo}
              className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {enviandoArquivo ? "Enviando PDF..." : "Enviar modelo PDF"}
            </button>

            {certificadoTemplateUrl && (
              <a
                href={certificadoTemplateUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver modelo atual
              </a>
            )}
          </div>
        </div>

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
          <p className="mt-2 text-xs text-slate-500">
            Esse campo será preenchido automaticamente após o upload do PDF.
          </p>
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