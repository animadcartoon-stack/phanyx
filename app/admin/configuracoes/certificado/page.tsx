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
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Configuração de Certificado
        </h1>
        <p className="text-slate-600">Carregando configuração...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
          Configurações • Certificados
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Configuração de Certificado
        </h1>
        <p className="mt-2 text-slate-600">
          Defina o modelo institucional em PDF e os dados que serão usados
          automaticamente na emissão dos certificados dos alunos.
        </p>
      </div>

      <div className="grid gap-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Modelo institucional
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Envie um PDF-base para ser usado como modelo oficial de certificado.
              </p>
            </div>

            {certificadoTemplateUrl && (
              <a
                href={certificadoTemplateUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver modelo atual
              </a>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Upload do modelo em PDF
            </label>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setArquivoModelo(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={fazerUploadModelo}
                disabled={enviandoArquivo}
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {enviandoArquivo ? "Enviando PDF..." : "Enviar modelo PDF"}
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Use um PDF com o fundo, moldura ou identidade visual que a instituição deseja usar no certificado automático.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Dados institucionais do certificado
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Essas informações serão usadas pelo sistema no momento da emissão.
          </p>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                URL do modelo do certificado
              </label>
              <input
                type="text"
                value={certificadoTemplateUrl}
                onChange={(e) => setCertificadoTemplateUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
                placeholder="https://..."
              />
              <p className="mt-2 text-xs text-slate-500">
                Esse campo é preenchido automaticamente após o upload, mas pode ser ajustado manualmente se necessário.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nome do coordenador
              </label>
              <input
                type="text"
                value={certificadoCoordenadorNome}
                onChange={(e) => setCertificadoCoordenadorNome(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
                placeholder="Ex.: Roberto Ramos da Silva"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Cidade do certificado
              </label>
              <input
                type="text"
                value={certificadoCidade}
                onChange={(e) => setCertificadoCidade(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-400"
                placeholder="Ex.: São José"
              />
            </div>

            <div className="pt-2">
              <button
                onClick={salvar}
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}