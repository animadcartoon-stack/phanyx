"use client";

import { useEffect, useRef, useState } from "react";

type CampoCertificado = {
  id: number;
  tipo: string;
  x: number;
  y: number;
  largura?: number | null;
  altura?: number | null;
  fonte?: string | null;
  tamanho?: number | null;
  cor?: string | null;
  alinhamento?: string | null;
  pagina?: number | null;
};

export default function ConfiguracaoCertificadoPage() {
  const [certificadoTemplateUrl, setCertificadoTemplateUrl] = useState("");
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] = useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [arquivoModelo, setArquivoModelo] = useState<File | null>(null);

  const [campos, setCampos] = useState<CampoCertificado[]>([]);
  const [campoSelecionadoId, setCampoSelecionadoId] = useState<number | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    campoId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  useEffect(() => {
    async function carregarConfiguracao() {
      try {
        const [resConfig, resCampos] = await Promise.all([
          fetch("/api/admin/configuracoes/certificado", {
            cache: "no-store",
          }),
          fetch("/api/admin/certificado-campos", {
            cache: "no-store",
          }),
        ]);

        const dataConfig = await resConfig.json();
        const dataCampos = await resCampos.json();

        if (!resConfig.ok) {
          alert(dataConfig?.error || "Erro ao buscar configuração");
          return;
        }

        if (!resCampos.ok) {
          alert(dataCampos?.error || "Erro ao buscar campos do certificado");
          return;
        }

        setCertificadoTemplateUrl(dataConfig?.certificadoTemplateUrl || "");
        setCertificadoCoordenadorNome(dataConfig?.certificadoCoordenadorNome || "");
        setCertificadoCidade(dataConfig?.certificadoCidade || "");
        setCampos(Array.isArray(dataCampos?.campos) ? dataCampos.campos : []);
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
        alert(data?.detalhe || data?.error || "Erro ao enviar arquivo.");
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

  async function adicionarCampo(tipo: string) {
    try {
      const res = await fetch("/api/admin/certificado-campos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          x: 100,
          y: 100,
          largura: 220,
          altura: 40,
          fonte: "Helvetica",
          tamanho: 18,
          cor: "#1e3a8a",
          alinhamento: "left",
          pagina: 1,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detalhe || data?.error || "Erro ao adicionar campo.");
        return;
      }

      setCampos((prev) => [...prev, data]);
      setCampoSelecionadoId(data.id);
    } catch {
      alert("Erro ao adicionar campo.");
    }
  }

  async function salvarPosicaoCampo(id: number, x: number, y: number) {
    try {
      setSalvandoCampo(true);

      const res = await fetch("/api/admin/certificado-campos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, x, y }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detalhe || data?.error || "Erro ao salvar posição do campo.");
        return;
      }

      setCampos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, x: data.x, y: data.y } : c))
      );
    } catch {
      alert("Erro ao salvar posição do campo.");
    } finally {
      setSalvandoCampo(false);
    }
  }

  async function excluirCampo(id: number) {
    try {
      const res = await fetch(`/api/admin/certificado-campos?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detalhe || data?.error || "Erro ao excluir campo.");
        return;
      }

      setCampos((prev) => prev.filter((c) => c.id !== id));
      if (campoSelecionadoId === id) {
        setCampoSelecionadoId(null);
      }
    } catch {
      alert("Erro ao excluir campo.");
    }
  }

  function iniciarDrag(
    event: React.MouseEvent<HTMLDivElement>,
    campo: CampoCertificado
  ) {
    const elemento = event.currentTarget;
    const rect = elemento.getBoundingClientRect();

    dragRef.current = {
      campoId: campo.id,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    setCampoSelecionadoId(campo.id);
  }

  function onMouseMoveCanvas(event: React.MouseEvent<HTMLDivElement>) {
    if (!dragRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    const novoX = event.clientX - canvasRect.left - dragRef.current.offsetX;
    const novoY = event.clientY - canvasRect.top - dragRef.current.offsetY;

    setCampos((prev) =>
      prev.map((campo) =>
        campo.id === dragRef.current?.campoId
          ? {
              ...campo,
              x: Math.max(0, Math.round(novoX)),
              y: Math.max(0, Math.round(novoY)),
            }
          : campo
      )
    );
  }

  function finalizarDrag() {
    if (!dragRef.current) return;

    const campo = campos.find((c) => c.id === dragRef.current?.campoId);

    if (campo) {
      void salvarPosicaoCampo(campo.id, campo.x, campo.y);
    }

    dragRef.current = null;
  }

  const campoSelecionado =
    campos.find((campo) => campo.id === campoSelecionadoId) || null;

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
    <div className="mx-auto max-w-6xl p-6">
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
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">Editor PHANYX</h2>
            <p className="mt-1 text-sm text-slate-500">
              Clique em um campo, arraste no canvas e o sistema salva a posição.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[240px_1fr_260px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 font-semibold text-slate-900">Campos</p>

              <div className="space-y-2">
                {["NOME_ALUNO", "CURSO", "DATA", "DISCIPLINAS", "ASSINATURA"].map(
                  (tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => adicionarCampo(tipo)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
                    >
                      {tipo}
                    </button>
                  )
                )}
              </div>
            </div>

            <div
              ref={canvasRef}
              onMouseMove={onMouseMoveCanvas}
              onMouseUp={finalizarDrag}
              onMouseLeave={finalizarDrag}
              className="relative min-h-[560px] rounded-2xl border border-slate-300 bg-[linear-gradient(180deg,#f8fafc,#eef2ff)]"
            >
              <div className="absolute left-4 top-4 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                Canvas do certificado
              </div>

              {campos.map((c) => (
                <div
                  key={c.id}
                  onMouseDown={(event) => iniciarDrag(event, c)}
                  onClick={() => setCampoSelecionadoId(c.id)}
                  className={`absolute select-none rounded-lg border px-3 py-2 text-sm font-semibold shadow-sm ${
                    campoSelecionadoId === c.id
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                  style={{
                    left: c.x,
                    top: c.y,
                    minWidth: c.largura || 180,
                    textAlign: (c.alinhamento as "left" | "center" | "right") || "left",
                    fontSize: c.tamanho || 16,
                    color: campoSelecionadoId === c.id ? "#ffffff" : c.cor || "#1e3a8a",
                    cursor: "move",
                  }}
                >
                  {c.tipo}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 font-semibold text-slate-900">Campo selecionado</p>

              {campoSelecionado ? (
                <div className="space-y-3 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold">Tipo:</span> {campoSelecionado.tipo}
                  </div>
                  <div>
                    <span className="font-semibold">X:</span> {campoSelecionado.x}
                  </div>
                  <div>
                    <span className="font-semibold">Y:</span> {campoSelecionado.y}
                  </div>
                  <div>
                    <span className="font-semibold">Fonte:</span>{" "}
                    {campoSelecionado.fonte || "Helvetica"}
                  </div>
                  <div>
                    <span className="font-semibold">Tamanho:</span>{" "}
                    {campoSelecionado.tamanho || 18}
                  </div>

                  <button
                    type="button"
                    onClick={() => excluirCampo(campoSelecionado.id)}
                    className="mt-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    Excluir campo
                  </button>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Selecione um campo no canvas para ver os detalhes.
                </p>
              )}

              {salvandoCampo && (
                <p className="mt-4 text-xs font-medium text-blue-600">
                  Salvando posição...
                </p>
              )}
            </div>
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