"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

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

const TIPOS_CAMPOS = [
  "NOME_ALUNO",
  "NOME_CURSO",
  "DISCIPLINAS_CONCLUIDAS",
  "APROVEITAMENTO",
  "FREQUENCIA_TOTAL",
  "DATA_EMISSAO",
  "CIDADE",
  "NOME_DIRETOR",
  "ASSINATURA",
  "QR_CODE",
  "CODIGO_VALIDACAO",
];

const FONTES = ["Helvetica", "Times Roman", "Courier"];
const ORIENTACOES = {
  paisagem: { largura: 1123, altura: 794, label: "Paisagem" },
  retrato: { largura: 794, altura: 1123, label: "Retrato" },
} as const;

type OrientacaoEditor = keyof typeof ORIENTACOES;

export default function ConfiguracaoCertificadoPage() {
  const [certificadoTemplateUrl, setCertificadoTemplateUrl] = useState("");
  const [certificadoCoordenadorNome, setCertificadoCoordenadorNome] =
    useState("");
  const [certificadoCidade, setCertificadoCidade] = useState("");
  const [arquivoModelo, setArquivoModelo] = useState<File | null>(null);

  const [campos, setCampos] = useState<CampoCertificado[]>([]);
  const [campoSelecionadoId, setCampoSelecionadoId] = useState<number | null>(
    null
  );

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoArquivo, setEnviandoArquivo] = useState(false);
  const [salvandoCampo, setSalvandoCampo] = useState(false);

  const [orientacao, setOrientacao] =
    useState<OrientacaoEditor>("paisagem");
  const [zoom, setZoom] = useState(70);
  const [mostrarPainelCampos, setMostrarPainelCampos] = useState(true); 
  const stageRef = useRef<HTMLDivElement | null>(null);
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
          alert(
            dataConfig?.detalhe ||
              dataConfig?.error ||
              "Erro ao buscar configuração."
          );
          return;
        }

        if (!resCampos.ok) {
          alert(
            dataCampos?.detalhe ||
              dataCampos?.error ||
              "Erro ao buscar campos."
          );
          return;
        }

        setCertificadoTemplateUrl(dataConfig?.certificadoTemplateUrl || "");
        setCertificadoCoordenadorNome(
          dataConfig?.certificadoCoordenadorNome || ""
        );
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

  const baseCanvas = ORIENTACOES[orientacao];
  const escala = zoom / 100;
  const canvasWidth = Math.round(baseCanvas.largura * escala);
  const canvasHeight = Math.round(baseCanvas.altura * escala);

  const campoSelecionado = useMemo(
    () => campos.find((campo) => campo.id === campoSelecionadoId) || null,
    [campos, campoSelecionadoId]
  );

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

  async function salvarConfiguracao() {
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
        alert(data?.detalhe || data?.error || "Erro ao salvar.");
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
      const larguraInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS" ? 340 : tipo === "QR_CODE" ? 120 : 220;
      const alturaInicial =
        tipo === "DISCIPLINAS_CONCLUIDAS" ? 110 : tipo === "QR_CODE" ? 120 : 40;

      const res = await fetch("/api/admin/certificado-campos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  tipo,
  x: orientacao === "paisagem" ? 180 : 120,
  y: 140,
          largura: larguraInicial,
          altura: alturaInicial,
          fonte: "Helvetica",
          tamanho: tipo === "DISCIPLINAS_CONCLUIDAS" ? 14 : 18,
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

  async function atualizarCampo(
    id: number,
    payload: Partial<CampoCertificado>
  ) {
    try {
      setSalvandoCampo(true);

      const res = await fetch("/api/admin/certificado-campos", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          ...payload,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detalhe || data?.error || "Erro ao atualizar campo.");
        return;
      }

      setCampos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...data } : c))
      );
    } catch {
      alert("Erro ao atualizar campo.");
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

  function atualizarCampoLocal<K extends keyof CampoCertificado>(
    chave: K,
    valor: CampoCertificado[K]
  ) {
    if (!campoSelecionado) return;

    setCampos((prev) =>
      prev.map((c) =>
        c.id === campoSelecionado.id ? { ...c, [chave]: valor } : c
      )
    );
  }

  function iniciarDrag(
    event: MouseEvent<HTMLDivElement>,
    campo: CampoCertificado
  ) {
    const rect = event.currentTarget.getBoundingClientRect();

    dragRef.current = {
      campoId: campo.id,
      offsetX: (event.clientX - rect.left) / escala,
      offsetY: (event.clientY - rect.top) / escala,
    };

    setCampoSelecionadoId(campo.id);
  }

  function onMouseMoveCanvas(event: MouseEvent<HTMLDivElement>) {
    if (!dragRef.current || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const campo = campos.find((c) => c.id === dragRef.current?.campoId);
    if (!campo) return;

    const largura = campo.largura || 220;
    const altura = campo.altura || 40;

    let novoX =
      (event.clientX - canvasRect.left) / escala - dragRef.current.offsetX;
    let novoY =
      (event.clientY - canvasRect.top) / escala - dragRef.current.offsetY;

    novoX = Math.max(0, Math.min(novoX, baseCanvas.largura - largura));
    novoY = Math.max(0, Math.min(novoY, baseCanvas.altura - altura));

    setCampos((prev) =>
      prev.map((item) =>
        item.id === dragRef.current?.campoId
          ? { ...item, x: Math.round(novoX), y: Math.round(novoY) }
          : item
      )
    );
  }

  function finalizarDrag() {
    if (!dragRef.current) return;

    const campo = campos.find((c) => c.id === dragRef.current?.campoId);

    if (campo) {
      void atualizarCampo(campo.id, {
        x: campo.x,
        y: campo.y,
      });
    }

    dragRef.current = null;
  }

  async function salvarCampoSelecionado() {
    if (!campoSelecionado) return;

    await atualizarCampo(campoSelecionado.id, {
      x: campoSelecionado.x,
      y: campoSelecionado.y,
      largura: campoSelecionado.largura || 220,
      altura: campoSelecionado.altura || 40,
      fonte: campoSelecionado.fonte || "Helvetica",
      tamanho: campoSelecionado.tamanho || 18,
      cor: campoSelecionado.cor || "#1e3a8a",
      alinhamento: campoSelecionado.alinhamento || "left",
    });
  }

  if (carregando) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <h1 className="mb-2 text-3xl font-bold text-slate-900">
          Editor PHANYX de Certificados
        </h1>
        <p className="text-slate-600">Carregando configuração...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] p-6">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            Configurações • Certificados
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Editor PHANYX de Certificados
          </h1>
          <p className="mt-2 text-slate-600">
            Faça upload do modelo, adicione campos dinâmicos e posicione no lugar
            exato onde o sistema deverá escrever as informações do aluno.
          </p>
        </div>

        <div className="flex shrink-0 justify-center">
          <Image
            src="/images/phanyx-editor-pintando.png"
            alt="Mascote do Editor PHANYX"
            width={220}
            height={220}
            className="h-auto w-[160px] md:w-[220px]"
            priority
          />
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
            Depois do upload, o modelo salvo continuará abrindo no editor abaixo,
            mesmo após atualizar a página.
          </p>
        </div>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="mb-3 flex flex-wrap items-center gap-3">

<button
  type="button"
  onClick={() => setMostrarPainelCampos((prev) => !prev)}
  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
>
  {mostrarPainelCampos ? "Ocultar campos" : "Mostrar campos"}
</button>

            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar página
            </button>

            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Redimensionar
            </button>

            <div className="ml-auto flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
              <span className="text-sm text-slate-500">Zoom</span>
              <input
                type="range"
                min={40}
                max={120}
                step={5}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
              <span className="min-w-[44px] text-right text-sm font-medium text-slate-700">
                {zoom}%
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOrientacao("paisagem")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                orientacao === "paisagem"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Modo paisagem
            </button>

            <button
              type="button"
              onClick={() => setOrientacao("retrato")}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                orientacao === "retrato"
                  ? "bg-blue-600 text-white"
                  : "border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              Modo retrato
            </button>
          </div>
        </div>

        <div
  className={`grid min-h-[900px] grid-cols-1 ${
    mostrarPainelCampos
      ? "lg:grid-cols-[260px_1fr_320px]"
      : "lg:grid-cols-[1fr_320px]"
  }`}
>
          {mostrarPainelCampos && (
  <aside className="border-b border-slate-200 bg-slate-50 p-5 lg:border-b-0 lg:border-r">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-slate-900">Campos dinâmicos</h2>
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
        Editor PHANYX
      </span>
    </div>

    <p className="mb-4 text-xs leading-5 text-slate-500">
      Clique em um campo para adicionar ao editor. Depois, arraste o campo
      dentro do certificado com o mouse.
    </p>

    <div className="space-y-2">
      {TIPOS_CAMPOS.map((tipo) => (
        <button
          key={tipo}
          type="button"
          onClick={() => adicionarCampo(tipo)}
          className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          {tipo}
        </button>
      ))}
    </div>
  </aside>
)}

          <main className="flex min-h-[900px] flex-col bg-[#f3f5f9]">
            <div className="border-b border-slate-200 bg-white px-5 py-3 text-sm text-slate-500">
              Área de edição do modelo da instituição
            </div>

            <div
  ref={stageRef}
  className="flex-1 overflow-auto p-6"
>
  <div className="mx-auto flex min-h-full items-start justify-center">
                <div
                  ref={canvasRef}
                  onMouseMove={onMouseMoveCanvas}
                  onMouseUp={finalizarDrag}
                  onMouseLeave={finalizarDrag}
                  className="relative overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                  style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                  }}
                >
                  {certificadoTemplateUrl ? (
                    <>
                      <iframe
                        src={`${certificadoTemplateUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        title="Modelo do certificado"
                        className="absolute inset-0 h-full w-full pointer-events-none"
                      />

                      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 shadow-sm">
                        Modelo carregado • arraste os campos para posicionar
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">
                      Faça upload do modelo acima para começar a edição.
                    </div>
                  )}

                  {campos.map((c) => (
                    <div
                      key={c.id}
                      onMouseDown={(event) => iniciarDrag(event, c)}
                      onClick={() => setCampoSelecionadoId(c.id)}
                      className={`absolute z-20 select-none rounded-lg border px-3 py-2 shadow-sm ${
                        campoSelecionadoId === c.id
                          ? "border-blue-600 bg-blue-600/90 text-white"
                          : "border-slate-300 bg-white/95 text-slate-700"
                      }`}
                      style={{
                        left: `${c.x * escala}px`,
                        top: `${c.y * escala}px`,
                        width: `${(c.largura || 220) * escala}px`,
                        minHeight: `${(c.altura || 40) * escala}px`,
                        textAlign:
                          (c.alinhamento as "left" | "center" | "right") ||
                          "left",
                        fontSize: `${(c.tamanho || 16) * escala}px`,
                        color:
                          campoSelecionadoId === c.id
                            ? "#ffffff"
                            : c.cor || "#1e3a8a",
                        cursor: "move",
                        fontFamily: c.fonte || "Helvetica",
                        lineHeight: 1.3,
                        whiteSpace:
                          c.tipo === "DISCIPLINAS_CONCLUIDAS"
                            ? "pre-wrap"
                            : "nowrap",
                      }}
                    >
                      {c.tipo === "DISCIPLINAS_CONCLUIDAS"
                        ? "DISCIPLINAS CONCLUÍDAS"
                        : c.tipo}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-white px-5 py-3 text-sm text-slate-600">
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                Página 1 de 1
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                {ORIENTACOES[orientacao].label}
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                Zoom {zoom}%
              </span>
              <span className="rounded-lg bg-slate-100 px-3 py-1">
                {canvasWidth} × {canvasHeight}
              </span>
              {salvandoCampo && (
                <span className="rounded-lg bg-blue-50 px-3 py-1 font-medium text-blue-700">
                  Salvando posição/estilo...
                </span>
              )}
            </div>
          </main>

          <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
            <h2 className="mb-4 text-lg font-bold text-slate-900">
              Campo selecionado
            </h2>

            {campoSelecionado ? (
              <div className="space-y-4 text-sm text-slate-700">
                <div>
                  <span className="font-semibold">Tipo:</span>{" "}
                  {campoSelecionado.tipo}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      X
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.x}
                      onChange={(e) =>
                        atualizarCampoLocal("x", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Y
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.y}
                      onChange={(e) =>
                        atualizarCampoLocal("y", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Largura
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.largura || 220}
                      onChange={(e) =>
                        atualizarCampoLocal("largura", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Altura
                    </label>
                    <input
                      type="number"
                      value={campoSelecionado.altura || 40}
                      onChange={(e) =>
                        atualizarCampoLocal("altura", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Fonte
                  </label>
                  <select
                    value={campoSelecionado.fonte || "Helvetica"}
                    onChange={(e) => atualizarCampoLocal("fonte", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    {FONTES.map((fonte) => (
                      <option key={fonte} value={fonte}>
                        {fonte}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Tamanho
                  </label>
                  <input
                    type="number"
                    value={campoSelecionado.tamanho || 18}
                    onChange={(e) =>
                      atualizarCampoLocal("tamanho", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={campoSelecionado.cor || "#1e3a8a"}
                    onChange={(e) => atualizarCampoLocal("cor", e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 px-2 py-2"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Alinhamento
                  </label>
                  <select
                    value={campoSelecionado.alinhamento || "left"}
                    onChange={(e) =>
                      atualizarCampoLocal("alinhamento", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2"
                  >
                    <option value="left">Esquerda</option>
                    <option value="center">Centro</option>
                    <option value="right">Direita</option>
                  </select>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    onClick={salvarCampoSelecionado}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Salvar campo
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirCampo(campoSelecionado.id)}
                    className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
  Primeiro clique em um campo da esquerda para adicionar ao editor.
  Depois clique e arraste o campo sobre o certificado para posicionar.
</p>
            )}
          </aside>
        </div>
      </section>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              onClick={salvarConfiguracao}
              disabled={salvando}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Salvar configuração"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}