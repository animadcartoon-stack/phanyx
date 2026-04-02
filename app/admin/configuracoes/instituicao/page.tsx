"use client";

import { useEffect, useRef, useState } from "react";

type LayoutProfissional =
  | "FORMAX_MODERNO"
  | "FORMAX_ACADEMICO"
  | "FORMAX_CLASSICO"
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
      return "PHANYX_MODERNO";
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
      return "PHANYX_MODERNO";
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
>("PHANYX");
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

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Erro ao enviar papel timbrado");
      }

      setForm((prev) => ({
        ...prev,
        papelTimbradoUrl: data.url,
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

    if (layoutSelecionado === "FORMAX_CLASSICO") {
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
        className={`rounded-2xl border p-4 text-left transition ${
          ativo
            ? "border-blue-600 bg-blue-50 shadow-sm"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="h-[180px] w-full">{renderMiniatura(value)}</div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              ativo ? "bg-blue-600" : "bg-slate-300"
            }`}
          />
          <div className="text-sm font-semibold text-slate-800">{titulo}</div>
        </div>

        <div className="mt-1 text-xs text-slate-500">{subtitulo}</div>

        <div className="mt-3 space-y-1 text-xs text-slate-700">
          {bullets.map((item) => (
            <div key={item}>✓ {item}</div>
          ))}
        </div>
      </button>
    );
  }

  function renderMiniatura(layout: LayoutProfissional) {
    const atual = layoutSelecionado;

    setTimeout(() => {
      if (atual !== layoutSelecionado) return;
    }, 0);

    if (layout === "FORMAX_MODERNO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-full w-4 bg-slate-900" />
          <div className="absolute left-0 top-0 h-10 w-full bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-0 h-4 w-[55%] bg-[#0e2f5a]" />
          <div className="absolute bottom-0 right-[18%] h-2 w-[32%] bg-[#2b6cb0]" />
          <div className="absolute bottom-0 right-[8%] h-1.5 w-[20%] bg-[#63b3ed]" />
          <div className="absolute left-6 top-5 right-4 rounded-lg bg-white p-3 shadow-sm">
            <div className="mb-2 h-2 w-28 rounded bg-slate-300" />
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded bg-slate-200" />
              <div className="h-1.5 w-5/6 rounded bg-slate-200" />
              <div className="h-1.5 w-full rounded bg-slate-200" />
            </div>
          </div>
        </div>
      );
    }

    if (layout === "FORMAX_ACADEMICO") {
      return (
        <div className="relative h-full w-full bg-white px-4 py-3">
          <div className="mx-auto mb-2 h-8 w-8 rounded-full border bg-white" />
          <div className="border-b border-slate-300 pb-2 text-center">
            <div className="mx-auto h-2 w-28 rounded bg-slate-300" />
            <div className="mx-auto mt-2 h-1.5 w-20 rounded bg-slate-200" />
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="h-1.5 w-full rounded bg-slate-200" />
            <div className="h-1.5 w-full rounded bg-slate-200" />
            <div className="h-1.5 w-4/5 rounded bg-slate-200" />
            <div className="h-1.5 w-full rounded bg-slate-200" />
          </div>
          <div className="absolute bottom-3 left-4 right-4 h-[1px] bg-slate-300" />
        </div>
      );
    }

    if (layout === "FORMAX_CLASSICO") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-white">
          <div className="absolute left-0 top-0 h-3 w-full bg-[#1b1b1b]" />
          <div className="absolute right-0 top-0 h-3 w-16 bg-[#1693d1]" />
          <div className="absolute bottom-0 left-0 h-10 w-full bg-[#1b1b1b]" />
          <div className="absolute left-4 top-5 h-2 w-24 rounded bg-slate-300" />
          <div className="absolute right-4 top-5 h-8 w-20 rounded border border-slate-200" />
          <div className="absolute left-4 right-4 top-11 space-y-1.5">
            <div className="h-1.5 w-full rounded bg-slate-200" />
            <div className="h-1.5 w-5/6 rounded bg-slate-200" />
            <div className="h-1.5 w-full rounded bg-slate-200" />
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
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Sem imagem
            </div>
          )}
          <div className="absolute left-4 right-4 top-4 h-2 rounded bg-slate-300" />
          <div className="absolute left-4 right-4 bottom-4 h-2 rounded bg-slate-200" />
        </div>
      );
    }

    if (layout === "PERSONALIZADO_MODERNO") {
      return (
        <div className="relative h-full w-full bg-white">
          <div className="absolute left-0 top-0 h-full w-4 bg-slate-800" />
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Miniatura"
              className="absolute left-4 top-0 h-full w-[calc(100%-16px)] object-cover"
            />
          ) : (
            <div className="absolute left-4 right-0 top-0 bottom-0 flex items-center justify-center text-xs text-slate-400">
              Sem imagem
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="relative h-full w-full bg-white">
        <div className="absolute top-0 h-3 w-full bg-slate-300" />
        {previewSrc ? (
          <img
            src={previewSrc}
            alt="Miniatura"
            className="absolute inset-0 m-auto h-[75%] w-[85%] object-contain grayscale"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                rows={12}
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

              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                <p className="mb-1 font-semibold">Variáveis disponíveis:</p>
                <p className="leading-relaxed">
                  {"{{nomeInstituicao}}"}, {"{{cnpjInstituicao}}"}, {"{{responsavelLegal}}"},{" "}
                  {"{{nomeAluno}}"}, {"{{cpfAluno}}"}, {"{{matriculaAluno}}"},{" "}
                  {"{{curso}}"}, {"{{disciplinas}}"}, {"{{valorContrato}}"},{" "}
                  {"{{cidadeAssinatura}}"}, {"{{dataAtual}}"}
                </p>
              </div>
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Logo</h2>

          <div className="flex flex-col gap-4">
            <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Logo da instituição"
                  className="max-h-32 max-w-full object-contain"
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
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {enviandoLogo ? "Enviando logo..." : "Selecionar logo"}
            </button>

            <div className="w-full rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              {nomeArquivoLogo
                ? `Arquivo selecionado: ${nomeArquivoLogo}`
                : "Formatos aceitos: PNG, JPG, JPEG e WEBP"}
            </div>

            <div className="mt-2 border-t pt-4">
                            <h3 className="mb-3 text-lg font-semibold text-slate-800">
                Papel Timbrado e Layout Profissional
              </h3>

              <div className="mb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModoLayout("FORMAX")}
                  className={`rounded-xl border p-4 text-left transition ${
                    modoLayout === "FORMAX"
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-semibold text-slate-800">
                      Modelo pronto FORMAX
                    </div>
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                      RECOMENDADO
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600">
                    Pronto para uso, visual profissional automático.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModoLayout("PERSONALIZADO")}
                  className={`rounded-xl border p-4 text-left transition ${
                    modoLayout === "PERSONALIZADO"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="font-semibold text-slate-800">
                    Usar papel timbrado próprio
                  </div>

                  <p className="mt-2 text-xs text-slate-600">
                    Use sua própria arte institucional.
                  </p>
                </button>

                
                <button
  type="button"
  onClick={() => setModoLayout("SIMPLES")}
  className={`rounded-xl border p-4 text-left transition ${
    modoLayout === "SIMPLES"
      ? "border-slate-800 bg-slate-100"
      : "border-slate-200 bg-white"
  }`}
>
  <div className="font-semibold text-slate-800">
    Sem papel timbrado
  </div>

  <p className="mt-2 text-xs text-slate-600">
    Layout simples, sem identidade visual.
  </p>
</button>

              </div>
              <div className="mt-4 space-y-6">
                              {modoLayout === "SIMPLES" && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h4 className="text-base font-semibold text-slate-800">
                      Layout simples
                    </h4>

                    <p className="mt-1 text-xs text-slate-600">
                      Documento sem papel timbrado, sem identidade visual.
                    </p>
                  </div>
                )}
                {modoLayout === "FORMAX" && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
                    <div className="mb-3">
                      <h4 className="text-base font-semibold text-slate-800">
                        Modelos FORMAX prontos
                      </h4>
                      <p className="mt-1 text-xs text-slate-600">
                        Layouts profissionais do sistema. Funcionam mesmo sem enviar imagem de papel timbrado.
                      </p>
                    </div>

                    <div className="grid gap-4">
                      <LayoutCard
                        value="FORMAX_MODERNO"
                        titulo="FORMAX — Executivo Premium"
                        subtitulo="Visual forte, faixa escura e acabamento moderno"
                        bullets={[
                          "Faixa superior escura",
                          "Barra lateral",
                          "Logo integrado",
                          "Visual premium",
                        ]}
                      />

                      <LayoutCard
                        value="FORMAX_ACADEMICO"
                        titulo="FORMAX — Acadêmico Elegante"
                        subtitulo="Clean, profissional e com cara de instituição tradicional"
                        bullets={[
                          "Linhas finas",
                          "Mais limpo",
                          "Estilo acadêmico",
                          "Excelente para documentos formais",
                        ]}
                      />

                      <LayoutCard
                        value="FORMAX_CLASSICO"
                        titulo="FORMAX — Clássico Institucional"
                        subtitulo="Cabeçalho forte, rodapé marcante e apresentação premium"
                        bullets={[
                          "Cabeçalho marcante",
                          "Rodapé forte",
                          "Assinatura visual elegante",
                          "Visual institucional premium",
                        ]}
                      />
                    </div>
                  </div>
                )}

                {modoLayout === "PERSONALIZADO" && (
                  <>
                    <div className="mt-3">
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
                        Ativar uso da imagem enviada nos modelos personalizados
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        Quando ativado, o sistema usará sua arte institucional no documento.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-3">
                        <h4 className="text-base font-semibold text-slate-800">
                          Modelos personalizados da instituição
                        </h4>
                        <p className="mt-1 text-xs text-slate-600">
                          Esses modelos usam a imagem de papel timbrado enviada pela instituição.
                        </p>
                      </div>

                      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                        Para os modelos personalizados ficarem bonitos, envie uma imagem de papel timbrado antes.
                      </div>

                      <div className="grid gap-4">
                        <LayoutCard
                          value="PERSONALIZADO_CLASSICO"
                          titulo="Personalizado — Clássico"
                          subtitulo="Usa sua arte enviada em versão discreta"
                          bullets={[
                            "Mais sóbrio",
                            "Bom para documentos internos",
                            "Visual em escala neutra",
                            "Depende da sua imagem",
                          ]}
                        />

                        <LayoutCard
                          value="PERSONALIZADO_MODERNO"
                          titulo="Personalizado — Moderno"
                          subtitulo="Usa sua arte enviada com mais presença visual"
                          bullets={[
                            "Mais colorido",
                            "Mais forte visualmente",
                            "Combina com papel timbrado pronto",
                            "Depende da sua imagem",
                          ]}
                        />

                        <LayoutCard
                          value="PERSONALIZADO_MARCA"
                          titulo="Personalizado — Marca d'água"
                          subtitulo="Usa sua arte como fundo leve no centro do documento"
                          bullets={[
                            "Fundo discreto",
                            "Boa leitura",
                            "Estilo elegante",
                            "Depende da sua imagem",
                          ]}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

                            {modoLayout === "PERSONALIZADO" && (
                <div className="mt-5">
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
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {enviandoPapelTimbrado
                    ? "Enviando papel timbrado..."
                    : "Selecionar papel timbrado"}
                </button>

                <p className="mt-2 text-xs text-slate-500">
                  Formatos aceitos: PNG, JPG, JPEG e WEBP. Use preferência em retrato.
                </p>

                                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {nomeArquivoPapelTimbrado
                    ? `Arquivo selecionado: ${nomeArquivoPapelTimbrado}`
                    : "Nenhum arquivo de papel timbrado enviado ainda"}
                </div>
              </div>
              )}

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Pré-visualização
                </label>

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
      </div>
    </div>
  );
}