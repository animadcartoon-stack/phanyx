"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type LayoutProfissional =
  | "PHANYX_MODERNO"
  | "PHANYX_ACADEMICO"
  | "PHANYX_CLASSICO"
  | "PERSONALIZADO_CLASSICO"
  | "PERSONALIZADO_MODERNO"
  | "PERSONALIZADO_MARCA";

type ConfigInstituicao = {
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
  telefone?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  responsavelNome?: string;
  responsavelCargo?: string;
  logoUrl?: string;
  cidadeAssinatura?: string;
  contratoTemplate?: string;
  observacoesContrato?: string;
  estiloDocumento?: string;
  numero?: string;
  usarPapelTimbrado?: boolean;
  papelTimbradoUrl?: string;
  estiloPapelTimbrado?: string;
};

function gerarPreviewBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function normalizarLayoutProfissional(estilo?: string): LayoutProfissional {
  switch (estilo) {
    case "PHANYX_MODERNO":
    case "PHANYX_ACADEMICO":
    case "PHANYX_CLASSICO":
    case "PERSONALIZADO_CLASSICO":
    case "PERSONALIZADO_MODERNO":
    case "PERSONALIZADO_MARCA":
      return estilo;
    case "INSTITUCIONAL":
    case "CLASSICO":
      return "PHANYX_CLASSICO";
    case "MINIMALISTA":
      return "PHANYX_ACADEMICO";
    case "SEM_COR":
      return "PERSONALIZADO_CLASSICO";
    case "COLORIDO":
      return "PERSONALIZADO_MODERNO";
    case "MARCA_DAGUA":
      return "PERSONALIZADO_MARCA";
    default:
      return "PERSONALIZADO_MODERNO";
  }
}

export default function ConfigInstituicaoPage() {
  const [form, setForm] = useState<ConfigInstituicao>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [enviandoPapelTimbrado, setEnviandoPapelTimbrado] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [nomeArquivoLogo, setNomeArquivoLogo] = useState("");
  const [nomeArquivoPapelTimbrado, setNomeArquivoPapelTimbrado] =
    useState("");
  const [mensagem, setMensagem] = useState("");
  const [previewPapelTimbrado, setPreviewPapelTimbrado] = useState("");
  const [modoLayout, setModoLayout] = useState<
  "PHANYX" | "PERSONALIZADO" | "SIMPLES"
>("SIMPLES");
  const [previewAmpliada, setPreviewAmpliada] = useState(false);

  const inputFileLogoRef = useRef<HTMLInputElement | null>(null);
  const inputFilePapelRef = useRef<HTMLInputElement | null>(null);

  const layoutSelecionado = normalizarLayoutProfissional(
    form.estiloPapelTimbrado || form.estiloDocumento
  );

  async function carregar() {
    try {
      setLoading(true);
      setMensagem("");

      const res = await fetch("/api/admin/configuracoes/instituicao", {
        cache: "no-store",
      });
      const json = await res.json();

      const layout = normalizarLayoutProfissional(
        json?.estiloPapelTimbrado || json?.estiloDocumento
      );

      setForm({
        ...json,
        estiloDocumento: layout,
        estiloPapelTimbrado: layout,
        usarPapelTimbrado: json?.usarPapelTimbrado ?? false,
        papelTimbradoUrl: json?.papelTimbradoUrl || "",
      });

      setPreviewPapelTimbrado(json?.papelTimbradoUrl || "");
    } catch {
      setMensagem("Erro ao carregar configurações da instituição.");
    } finally {
      setLoading(false);
    }
  }

  async function salvar() {
    try {
      setSalvando(true);
      setMensagem("");

      const layout = normalizarLayoutProfissional(
        form.estiloPapelTimbrado || form.estiloDocumento
      );

      const payload = {
        ...form,
        estiloDocumento: layout,
        estiloPapelTimbrado: layout,
        usarPapelTimbrado: Boolean(form.usarPapelTimbrado),
        papelTimbradoUrl: form.papelTimbradoUrl || "",
      };

      const res = await fetch("/api/admin/configuracoes/instituicao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      setForm((prev) => ({
        ...prev,
        estiloDocumento: layout,
        estiloPapelTimbrado: layout,
      }));

      setMensagem("Configurações salvas com sucesso.");
    } catch {
      setMensagem("Erro ao salvar configurações.");
    } finally {
      setSalvando(false);
    }
  }

  async function enviarLogo(file: File) {
    try {
      setEnviandoLogo(true);
      setMensagem("");
      setNomeArquivoLogo(file.name);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload/logo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar logo");
      }

      setForm((prev) => ({
        ...prev,
        logoUrl: data.url,
      }));

      setMensagem("Logo enviada com sucesso.");
    } catch {
      setMensagem("Erro ao enviar logo.");
    } finally {
      setEnviandoLogo(false);
    }
  }

  async function enviarPapelTimbrado(file: File) {
    try {
      setEnviandoPapelTimbrado(true);
      setMensagem("");
      setNomeArquivoPapelTimbrado(file.name);

      const previewBase64 = await gerarPreviewBase64(file);
      setPreviewPapelTimbrado(previewBase64);

      const resUploadUrl = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nomeOriginal: file.name,
          mimeType: file.type,
          tamanho: file.size,
        }),
      });

      const jsonUploadUrl = await resUploadUrl.json();

      if (!resUploadUrl.ok) {
        throw new Error(jsonUploadUrl?.error || "Erro ao gerar upload");
      }

      const resUploadDireto = await fetch(jsonUploadUrl.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!resUploadDireto.ok) {
        throw new Error("Erro ao enviar arquivo para o storage");
      }

      setForm((prev) => ({
        ...prev,
        papelTimbradoUrl: jsonUploadUrl.arquivoUrl,
      }));

      setMensagem("Papel timbrado enviado com sucesso.");
    } catch {
      setMensagem("Erro ao enviar papel timbrado.");
    } finally {
      setEnviandoPapelTimbrado(false);
    }
  }

  async function buscarEnderecoPorCep(cepInformado: string) {
    const cepLimpo = cepInformado.replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);
      setMensagem("");

      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();

      if (data?.erro) {
        setMensagem("CEP não encontrado.");
        return;
      }

      setForm((prev) => ({
        ...prev,
        cep: cepLimpo,
        endereco: data.logradouro || prev.endereco || "",
        cidade: data.localidade || prev.cidade || "",
        estado: data.uf || prev.estado || "",
        cidadeAssinatura: prev.cidadeAssinatura || data.localidade || "",
      }));
    } catch {
      setMensagem("Não foi possível buscar o endereço pelo CEP.");
    } finally {
      setBuscandoCep(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const previewSrc =
    previewPapelTimbrado && previewPapelTimbrado.trim() !== ""
      ? previewPapelTimbrado
      : form.papelTimbradoUrl || "";

  const nomePreview = form.nomeFantasia || form.razaoSocial || "Instituição";
  const contatoPreview = [
    form.cnpj || "CNPJ não informado",
    form.telefone || "Telefone não informado",
    form.email || "E-mail não informado",
  ]
    .filter(Boolean)
    .join(" • ");

  const cidadeEstadoPreview = [form.cidade || "", form.estado || ""]
    .filter(Boolean)
    .join(" - ");

  function renderCabecalhoPreview(claro = false) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border bg-white">
          {form.logoUrl ? (
            <img
              src={form.logoUrl}
              alt="Logo da instituição"
              className="max-h-9 max-w-9 object-contain"
            />
          ) : (
            <span className="text-[8px] text-slate-400">LOGO</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-[10px] font-semibold ${
              claro ? "text-white" : "text-slate-800"
            }`}
          >
            {nomePreview}
          </div>
          <div
            className={`truncate text-[8px] ${
              claro ? "text-slate-200" : "text-slate-400"
            }`}
          >
            {cidadeEstadoPreview || "Cidade / Estado"}
          </div>
        </div>
      </div>
    );
  }

  function renderLinhasTexto() {
    return (
      <div className="space-y-2">
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-5/6 rounded bg-slate-200" />
        <div className="h-1.5 w-full rounded bg-slate-200" />
        <div className="h-1.5 w-2/3 rounded bg-slate-200" />
      </div>
    );
  }

  function renderPreviewPapelTimbrado() {
    if (layoutSelecionado === "PHANYX_MODERNO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-full w-5 bg-slate-900" />
          <div className="absolute left-0 top-0 h-14 w-full bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-0 h-5 w-[60%] bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-[18%] h-3 w-[35%] bg-[#2b6cb0]" />
          <div className="absolute bottom-0 right-[8%] h-2 w-[22%] bg-[#63b3ed]" />

          <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-5 pt-4">
            <div className="ml-4 mt-1">{renderCabecalhoPreview(true)}</div>

            <div className="ml-6 mr-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-sm">
              <div className="mb-4 text-[11px] font-semibold text-slate-800">
                Documento institucional
              </div>
              {renderLinhasTexto()}
            </div>

            <div className="ml-6 text-[7px] text-slate-500">
              {contatoPreview}
            </div>
          </div>
        </div>
      );
    }

    if (layoutSelecionado === "PHANYX_ACADEMICO") {
      return (
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden bg-white px-5 py-4">
          {form.logoUrl && (
            <img
              src={form.logoUrl}
              alt="Marca d'água"
              className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 object-contain opacity-5"
            />
          )}

          <div>
            <div className="border-b border-slate-300 pb-3 text-center">
              <div className="mx-auto mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-white">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo da instituição"
                      className="max-h-10 max-w-10 object-contain"
                    />
                  ) : (
                    <span className="text-[8px] text-slate-400">LOGO</span>
                  )}
                </div>
              </div>
              <div className="text-[11px] font-semibold text-slate-800">
                {nomePreview}
              </div>
              <div className="mt-1 text-[8px] text-slate-500">
                {cidadeEstadoPreview || "Cidade / Estado"}
              </div>
            </div>

            <div className="mt-5">{renderLinhasTexto()}</div>
          </div>

          <div className="border-t border-slate-300 pt-3 text-center text-[7px] text-slate-500">
            {contatoPreview}
          </div>
        </div>
      );
    }

    if (layoutSelecionado === "PHANYX_CLASSICO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-4 w-full bg-[#1b1b1b]" />
          <div className="absolute right-0 top-0 h-4 w-24 bg-[#1693d1]" />
          <div className="absolute bottom-0 left-0 h-14 w-full bg-[#1b1b1b]" />
          <div className="absolute bottom-10 left-0 h-[1px] w-full bg-slate-300" />

          <div className="relative z-10 flex h-full flex-col justify-between px-5 py-5">
            <div>
              <div className="flex items-start justify-between">
                <div className="max-w-[60%]">{renderCabecalhoPreview()}</div>
                <div className="text-right text-[7px] text-slate-500">
                  <div>{form.email || "email@instituicao.com"}</div>
                  <div>{form.telefone || "(00) 00000-0000"}</div>
                </div>
              </div>

              <div className="mt-6 text-[11px] font-semibold text-slate-800">
                Documento institucional premium
              </div>

              <div className="mt-4">{renderLinhasTexto()}</div>
            </div>

            <div className="text-center text-[7px] text-white">
              {contatoPreview}
            </div>
          </div>
        </div>
      );
    }

    if (!previewSrc) {
      return (
        <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-slate-400">
          A prévia do papel timbrado aparecerá ao selecionar uma imagem.
        </div>
      );
    }

    if (layoutSelecionado === "PERSONALIZADO_MARCA") {
      return (
        <div className="relative h-full w-full bg-white">
          <img
            src={previewSrc}
            alt="Prévia do papel timbrado"
            className="absolute inset-0 m-auto max-h-[75%] max-w-[75%] object-contain opacity-15"
          />

          <div className="relative z-10 flex h-full flex-col justify-between p-4">
            <div>{renderCabecalhoPreview()}</div>
            {renderLinhasTexto()}
            <div className="border-t border-slate-200 pt-2 text-center text-[7px] text-slate-500">
              {contatoPreview}
            </div>
          </div>
        </div>
      );
    }

    if (layoutSelecionado === "PERSONALIZADO_MODERNO") {
      return (
        <div className="relative h-full w-full bg-white">
          <div className="absolute left-0 top-0 h-full w-5 bg-slate-800" />
          <img
            src={previewSrc}
            alt="Prévia do papel timbrado"
            className="absolute left-6 top-0 h-full w-[calc(100%-24px)] object-cover"
          />
          <div className="absolute left-8 right-3 top-3 rounded-lg bg-white/85 p-2">
            {renderCabecalhoPreview()}
          </div>
          <div className="absolute bottom-3 left-8 right-3 rounded-lg bg-white/85 p-2 text-center text-[7px] text-slate-600">
            {contatoPreview}
          </div>
        </div>
      );
    }

    return (
      <div className="relative h-full w-full bg-white">
        <div className="absolute top-0 h-4 w-full bg-slate-300" />
        <img
          src={previewSrc}
          alt="Prévia do papel timbrado"
          className="absolute left-0 right-0 top-5 bottom-10 m-auto h-[calc(100%-52px)] w-full object-contain grayscale"
        />
        <div className="absolute left-4 right-4 top-6 rounded-lg bg-white/85 p-2">
          {renderCabecalhoPreview()}
        </div>
        <div className="absolute bottom-3 left-4 right-4 rounded-lg bg-white/85 p-2 text-center text-[7px] text-slate-600">
          {contatoPreview}
        </div>
      </div>
    );
  }

  function LayoutCard({
    value,
    titulo,
    subtitulo,
    bullets,
  }: {
    value: LayoutProfissional;
    titulo: string;
    subtitulo: string;
    bullets: string[];
  }) {
    const ativo = layoutSelecionado === value;

    return (
      <button
        type="button"
        onClick={() =>
          setForm((prev) => ({
            ...prev,
            estiloDocumento: value,
            estiloPapelTimbrado: value,
          }))
        }
        className={`rounded-xl border p-3 text-left transition ${
          ativo
            ? "border-blue-600 bg-blue-50 shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div className="mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-[96px] w-full">{renderMiniatura(value)}</div>
        </div>

        <div className="text-sm font-semibold text-slate-800">{titulo}</div>
        <div className="mt-1 text-[11px] text-slate-500">{subtitulo}</div>

        <div className="mt-2 space-y-0.5 text-[11px] text-slate-700">
          {bullets.map((item) => (
            <div key={item}>✓ {item}</div>
          ))}
        </div>
      </button>
    );
  }

  function renderMiniatura(layout: LayoutProfissional) {
    if (layout === "PHANYX_MODERNO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-full w-3 bg-slate-900" />
          <div className="absolute left-0 top-0 h-7 w-full bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-0 h-3 w-[55%] bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-[18%] h-1.5 w-[32%] bg-[#2b6cb0]" />
          <div className="absolute bottom-0 right-[8%] h-1 w-[20%] bg-[#63b3ed]" />
          <div className="absolute left-4 top-4 right-3 rounded-lg bg-white p-2 shadow-sm">
            <div className="mb-1.5 h-2 w-20 rounded bg-slate-300" />
            <div className="space-y-1">
              <div className="h-1 w-full rounded bg-slate-200" />
              <div className="h-1 w-5/6 rounded bg-slate-200" />
              <div className="h-1 w-full rounded bg-slate-200" />
            </div>
          </div>
        </div>
      );
    }

    if (layout === "PHANYX_ACADEMICO") {
      return (
        <div className="relative h-full w-full bg-white px-3 py-2">
          <div className="mx-auto mb-2 h-6 w-6 rounded-full border bg-white" />
          <div className="border-b border-slate-300 pb-2 text-center">
            <div className="mx-auto h-1.5 w-20 rounded bg-slate-300" />
            <div className="mx-auto mt-1.5 h-1 w-14 rounded bg-slate-200" />
          </div>
          <div className="mt-3 space-y-1">
            <div className="h-1 w-full rounded bg-slate-200" />
            <div className="h-1 w-full rounded bg-slate-200" />
            <div className="h-1 w-4/5 rounded bg-slate-200" />
          </div>
        </div>
      );
    }

    if (layout === "PHANYX_CLASSICO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-2.5 w-full bg-[#1b1b1b]" />
          <div className="absolute right-0 top-0 h-2.5 w-12 bg-[#1693d1]" />
          <div className="absolute bottom-0 left-0 h-8 w-full bg-[#1b1b1b]" />
          <div className="absolute left-3 top-4 h-1.5 w-16 rounded bg-slate-300" />
          <div className="absolute right-3 top-4 h-6 w-14 rounded border border-slate-200" />
          <div className="absolute left-3 right-3 top-8 space-y-1">
            <div className="h-1 w-full rounded bg-slate-200" />
            <div className="h-1 w-5/6 rounded bg-slate-200" />
            <div className="h-1 w-full rounded bg-slate-200" />
          </div>
        </div>
      );
    }

    if (layout === "PERSONALIZADO_MARCA") {
      return (
        <div className="relative h-full w-full bg-white">
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Miniatura"
              className="absolute inset-0 m-auto max-h-[70%] max-w-[70%] object-contain opacity-15"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">
              Sem imagem
            </div>
          )}
          <div className="absolute left-3 right-3 top-3 h-1.5 rounded bg-slate-300" />
          <div className="absolute left-3 right-3 bottom-3 h-1.5 rounded bg-slate-200" />
        </div>
      );
    }

    if (layout === "PERSONALIZADO_MODERNO") {
      return (
        <div className="relative h-full w-full bg-white">
          <div className="absolute left-0 top-0 h-full w-3 bg-slate-800" />
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Miniatura"
              className="absolute left-3 top-0 h-full w-[calc(100%-12px)] object-cover"
            />
          ) : (
            <div className="absolute left-3 right-0 top-0 bottom-0 flex items-center justify-center text-[10px] text-slate-400">
              Sem imagem
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative h-full w-full bg-white">
        <div className="absolute top-0 h-2.5 w-full bg-slate-300" />
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Miniatura"
            className="absolute inset-0 m-auto h-[75%] w-[85%] object-contain grayscale"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">
            Sem imagem
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="p-6">Carregando configurações da instituição...</div>;
  }

  return (
    <>
      {previewAmpliada && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 p-4">
          <div className="mx-auto flex h-full max-w-5xl flex-col justify-center">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewAmpliada(false)}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800"
              >
                Fechar visualização
              </button>
            </div>

            <div className="mx-auto flex max-h-[88vh] w-full items-center justify-center rounded-2xl bg-white p-4 shadow-2xl">
              <div className="h-[80vh] w-[56vh] max-w-full overflow-hidden rounded-lg border bg-white shadow-sm">
                {renderPreviewPapelTimbrado()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            🏢 Configurações da Instituição
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Defina os dados institucionais usados em documentos, relatórios, PDFs e contratos.
          </p>
        </div>

        {mensagem && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm">
            {mensagem}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Dados institucionais
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome fantasia
                </label>
                <input
                  value={form.nomeFantasia || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, nomeFantasia: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Ex.: IBE"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Razão social
                </label>
                <input
                  value={form.razaoSocial || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, razaoSocial: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Ex.: Instituto Batista de Educação"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  CNPJ
                </label>
                <input
                  value={form.cnpj || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cnpj: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Telefone
                </label>
                <input
                  value={form.telefone || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, telefone: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  E-mail
                </label>
                <input
                  value={form.email || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="contato@instituicao.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  CEP
                </label>
                <input
                  value={form.cep || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cep: e.target.value }))
                  }
                  onBlur={(e) => buscarEnderecoPorCep(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="00000-000"
                />
                {buscandoCep && (
                  <p className="mt-1 text-xs text-slate-500">
                    Buscando endereço pelo CEP...
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Estado
                </label>
                <input
                  value={form.estado || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, estado: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="SC"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Endereço
                </label>
                <input
                  value={form.endereco || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, endereco: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Número
                </label>
                <input
                  value={form.numero || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, numero: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Ex.: 398"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cidade
                </label>
                <input
                  value={form.cidade || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, cidade: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="São José"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Responsável legal
                </label>
                <input
                  value={form.responsavelNome || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      responsavelNome: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cargo do responsável
                </label>
                <input
                  value={form.responsavelCargo || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      responsavelCargo: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Diretor(a)"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Cidade de assinatura
                </label>
                <input
                  value={form.cidadeAssinatura || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      cidadeAssinatura: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Ex.: Florianópolis"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Observações contratuais
                </label>
                <textarea
                  value={form.observacoesContrato || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      observacoesContrato: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder="Informações adicionais do contrato"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Modelo de contrato
                </label>
                <textarea
                  value={form.contratoTemplate || ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contratoTemplate: e.target.value,
                    }))
                  }
                  rows={9}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none"
                  placeholder={`Exemplo:
CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

Pelo presente instrumento, a instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

Cidade e data:
{{cidadeAssinatura}}, {{dataAtual}}`}
                />
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={salvar}
                disabled={salvando}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold text-slate-800">Logo</h2>

              <div className="flex h-28 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Logo da instituição"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-slate-500">
                    Nenhuma logo enviada
                  </span>
                )}
              </div>

              <input
                ref={inputFileLogoRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  await enviarLogo(file);
                }}
              />

              <button
                type="button"
                onClick={() => inputFileLogoRef.current?.click()}
                disabled={enviandoLogo}
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {enviandoLogo ? "Enviando logo..." : "Selecionar logo"}
              </button>

              <div className="mt-3 w-full rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                {nomeArquivoLogo
                  ? `Arquivo selecionado: ${nomeArquivoLogo}`
                  : "Formatos aceitos: PNG, JPG, JPEG e WEBP"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-800">
                Papel Timbrado e Layout
              </h3>

              <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">

<button
                  type="button"
                  onClick={() => setModoLayout("SIMPLES")}
                  className={`rounded-xl border p-3 text-left transition ${
                    modoLayout === "SIMPLES"
                      ? "border-slate-800 bg-slate-100"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Sem papel
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Layout simples
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModoLayout("PHANYX")}
                  className={`rounded-xl border p-3 text-left transition ${
                    modoLayout === "PHANYX"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Modelo PHANYX
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Pronto para uso
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModoLayout("PERSONALIZADO")}
                  className={`rounded-xl border p-3 text-left transition ${
                    modoLayout === "PERSONALIZADO"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-800">
                    Papel próprio
                  </div>
                  <p className="mt-1 text-[11px] text-slate-600">
                    Arte institucional
                  </p>
                </button>

              </div>

              {modoLayout === "PHANYX" && (
                <div className="grid gap-3">
                  <LayoutCard
                    value="PHANYX_MODERNO"
                    titulo="PHANYX — Executivo"
                    subtitulo="Moderno"
                    bullets={["Faixa escura", "Barra lateral", "Premium"]}
                  />

                  <LayoutCard
                    value="PHANYX_ACADEMICO"
                    titulo="PHANYX — Acadêmico"
                    subtitulo="Elegante"
                    bullets={["Linhas finas", "Mais limpo", "Formal"]}
                  />

                  <LayoutCard
                    value="PHANYX_CLASSICO"
                    titulo="PHANYX — Clássico"
                    subtitulo="Institucional"
                    bullets={["Cabeçalho forte", "Rodapé forte", "Premium"]}
                  />
                </div>
              )}

              {modoLayout === "PERSONALIZADO" && (
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.usarPapelTimbrado || false}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          usarPapelTimbrado: e.target.checked,
                        }))
                      }
                    />
                    Ativar uso da imagem enviada
                  </label>

                  <div className="grid gap-3">
                    <LayoutCard
                      value="PERSONALIZADO_CLASSICO"
                      titulo="Personalizado — Clássico"
                      subtitulo="Discreto"
                      bullets={["Sóbrio", "Escala neutra"]}
                    />

                    <LayoutCard
                      value="PERSONALIZADO_MODERNO"
                      titulo="Personalizado — Moderno"
                      subtitulo="Mais visual"
                      bullets={["Colorido", "Mais forte"]}
                    />

                    <LayoutCard
                      value="PERSONALIZADO_MARCA"
                      titulo="Personalizado — Marca d'água"
                      subtitulo="Elegante"
                      bullets={["Fundo leve", "Boa leitura"]}
                    />
                  </div>

                  <input
                    ref={inputFilePapelRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await enviarPapelTimbrado(file);
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => inputFilePapelRef.current?.click()}
                    disabled={enviandoPapelTimbrado}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {enviandoPapelTimbrado
                      ? "Enviando papel timbrado..."
                      : "Selecionar papel timbrado"}
                  </button>

                  <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    {nomeArquivoPapelTimbrado
                      ? `Arquivo selecionado: ${nomeArquivoPapelTimbrado}`
                      : "Nenhum arquivo enviado ainda"}
                  </div>
                </div>
              )}

              {modoLayout === "SIMPLES" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  Documento sem papel timbrado e sem identidade visual.
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-700">
                    Pré-visualização
                  </label>

                  <button
                    type="button"
                    onClick={() => setPreviewAmpliada(true)}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ampliar
                  </button>
                </div>

                <div className="flex justify-center">
                  <div className="h-[297px] w-[210px] overflow-hidden rounded-lg border bg-white shadow-sm">
                    {renderPreviewPapelTimbrado()}
                  </div>
                </div>

                <p className="mt-2 text-center text-xs text-slate-500">
                  A prévia muda conforme o modelo selecionado.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-lg font-semibold text-slate-800">
                🏢 Polos / Unidades
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Se sua instituição possui filiais, campi ou unidades, cadastre os
                polos que serão usados depois em turmas e professores.
              </p>
            </div>

            <Link
              href="/admin/polos"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Gerenciar polos
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}