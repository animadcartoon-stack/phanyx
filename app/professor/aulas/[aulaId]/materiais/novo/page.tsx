"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ArquivoUpload = {
  url: string;
  downloadUrl?: string;
  pathname?: string;
  contentType?: string;
};

type MaterialAula = {
  id: number;
  tipo: string;
  titulo: string;
  url?: string | null;
  arquivoNome?: string | null;
  mimeType?: string | null;
  tamanho?: number | null;
  createdAt?: string;
};

export default function NovoMaterialAulaPage() {
  const params = useParams();
  const router = useRouter();
  const inputArquivoRef = useRef<HTMLInputElement | null>(null);

  const aulaId = params?.aulaId ? Number(params.aulaId) : null;

  const [materiais, setMateriais] = useState<MaterialAula[]>([]);
  const [carregandoMateriais, setCarregandoMateriais] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("arquivo");
  const [urlExterna, setUrlExterna] = useState("");

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [arquivoEnviado, setArquivoEnviado] = useState<ArquivoUpload | null>(null);

  const [uploadingArquivo, setUploadingArquivo] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState<number>(0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [materialEditando, setMaterialEditando] = useState<MaterialAula | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [materialExcluir, setMaterialExcluir] = useState<MaterialAula | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const precisaArquivo =
    tipo === "arquivo" || tipo === "pdf" || tipo === "doc" || tipo === "ppt";

    function iconeMaterial(tipoMaterial?: string) {
  const tipo = String(tipoMaterial || "").toUpperCase();

  if (tipo === "PDF") return "📄";
  if (tipo === "VIDEO") return "🎥";
  if (tipo === "LINK") return "🔗";
  if (tipo === "DOC") return "📝";
  if (tipo === "PPT") return "📊";

  return "📁";
}

  async function carregarMateriais() {
    if (!aulaId || !Number.isFinite(aulaId)) return;

    try {
      setCarregandoMateriais(true);
      setErro("");

      const res = await fetch(`/api/professor/aulas/${aulaId}/materiais`, {
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar materiais");
      }

      setMateriais(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar materiais");
      setMateriais([]);
    } finally {
      setCarregandoMateriais(false);
    }
  }

  useEffect(() => {
    carregarMateriais();
  }, [aulaId]);

  async function handleUploadArquivo() {
    if (!arquivo) {
      setErro("Selecione um arquivo para enviar.");
      return;
    }

    if (!aulaId || !Number.isFinite(aulaId)) {
      setErro("Aula inválida.");
      return;
    }

    try {
      setUploadingArquivo(true);
      setProgressoUpload(10);
      setErro("");
      setMensagem("");

      const formData = new FormData();
      formData.append("file", arquivo);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao enviar arquivo.");
      }

      const url = json?.url || json?.arquivo?.url;

      if (!url) {
        throw new Error("Upload concluído, mas nenhuma URL foi retornada.");
      }

      setProgressoUpload(100);

      setArquivoEnviado({
        url,
        downloadUrl: url,
        pathname: arquivo.name,
        contentType: arquivo.type,
      });

      setMensagem("Arquivo enviado com sucesso.");
    } catch (e: any) {
      setErro(e?.message || "Erro ao enviar arquivo");
      setProgressoUpload(0);
    } finally {
      setUploadingArquivo(false);
    }
  }

  async function handleSalvarMaterial(e: React.FormEvent) {
    e.preventDefault();

    if (!aulaId || !Number.isFinite(aulaId)) {
      setErro("Aula inválida.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      let body: any;

      if (tipo === "link") {
        if (!urlExterna.trim()) throw new Error("Informe a URL do link.");
        body = { titulo, tipo: "LINK", url: urlExterna.trim() };
      } else if (tipo === "video") {
        if (!urlExterna.trim()) throw new Error("Informe a URL do vídeo.");
        body = { titulo, tipo: "VIDEO", url: urlExterna.trim() };
      } else {
        if (!arquivo || !arquivoEnviado?.url) {
          throw new Error("Envie o arquivo antes de salvar.");
        }

        body = {
          titulo,
          tipo: "ARQUIVO",
          url: arquivoEnviado.url,
          arquivoNome: arquivo.name,
          mimeType: arquivo.type || arquivoEnviado.contentType || "",
          tamanho: arquivo.size,
        };
      }

      const res = await fetch(`/api/professor/aulas/${aulaId}/materiais`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao salvar material");
      }

      setTitulo("");
      setTipo("arquivo");
      setUrlExterna("");
      setArquivo(null);
      setArquivoEnviado(null);
      setProgressoUpload(0);

      setMensagem("Material criado com sucesso.");
      await carregarMateriais();
    } catch (e: any) {
      setErro(e.message || "Erro ao salvar material");
    } finally {
      setSalvando(false);
    }
  }

  function abrirEdicao(material: MaterialAula) {
    setMaterialEditando(material);
    setEditTitulo(material.titulo || "");
    setEditUrl(material.url || "");
  }

  async function salvarEdicaoMaterial(e: React.FormEvent) {
    e.preventDefault();

    if (!aulaId || !materialEditando) return;

    try {
      setSalvandoEdicao(true);
      setErro("");
      setMensagem("");

      const res = await fetch(`/api/professor/aulas/${aulaId}/materiais`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId: materialEditando.id,
          titulo: editTitulo,
          url: editUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao editar material");
      }

      setMaterialEditando(null);
      setMensagem("Material editado com sucesso.");
      await carregarMateriais();
    } catch (e: any) {
      setErro(e?.message || "Erro ao editar material");
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function excluirMaterialConfirmado() {
    if (!aulaId || !materialExcluir) return;

    try {
      setExcluindo(true);
      setErro("");
      setMensagem("");

      const res = await fetch(`/api/professor/aulas/${aulaId}/materiais`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materialId: materialExcluir.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao excluir material");
      }

      setMaterialExcluir(null);
      setMensagem("Material excluído com sucesso.");
      await carregarMateriais();
    } catch (e: any) {
      setErro(e?.message || "Erro ao excluir material");
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-block text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            ← Voltar
          </button>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Materiais da aula
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Veja, adicione, edite ou exclua os materiais desta aula.
          </p>
        </div>

        {mensagem && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
  <div className="flex items-start justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
        Biblioteca da aula
      </p>
      <h2 className="mt-1 text-xl font-black text-slate-950">
        Materiais salvos
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Arquivos, links, vídeos e documentos de apoio desta aula.
      </p>
    </div>

    <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
      {materiais.length} material(is)
    </span>
  </div>

  {carregandoMateriais ? (
    <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
      Carregando materiais...
    </p>
  ) : materiais.length === 0 ? (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
        📚
      </div>
      <p className="mt-4 font-bold text-slate-800">
        Nenhum material cadastrado ainda
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Adicione apostilas, vídeos, PDFs, links ou documentos para os alunos.
      </p>
    </div>
  ) : (
    <div className="mt-5 grid gap-4">
      {materiais.map((material) => (
        <div
          key={material.id}
          className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                {iconeMaterial(material.tipo)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-base font-black text-slate-950">
                  {material.titulo}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-600">
                    {material.tipo}
                  </span>

                  {material.arquivoNome && (
                    <span className="max-w-[360px] truncate">
                      {material.arquivoNome}
                    </span>
                  )}
                </div>

                {material.url && (
                  <p className="mt-2 max-w-xl truncate text-xs text-slate-400">
                    Material armazenado com segurança no PHANYX
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {material.url && (
                <a
                  href={material.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Abrir
                </a>
              )}

              <button
                type="button"
                onClick={() => abrirEdicao(material)}
                className="rounded-2xl bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600"
              >
                Editar
              </button>

              <button
                type="button"
                onClick={() => setMaterialExcluir(material)}
                className="rounded-2xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

        <form
          onSubmit={handleSalvarMaterial}
          className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-bold text-gray-900">Adicionar novo material</h2>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Ex.: Apostila da aula"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={tipo}
              onChange={(e) => {
                setTipo(e.target.value);
                setErro("");
                setMensagem("");
                setArquivo(null);
                setArquivoEnviado(null);
                setUrlExterna("");
                setProgressoUpload(0);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="arquivo">Arquivo</option>
              <option value="pdf">PDF</option>
              <option value="doc">Documento</option>
              <option value="ppt">Apresentação</option>
              <option value="link">Link</option>
              <option value="video">Vídeo</option>
            </select>
          </div>

          {precisaArquivo ? (
            <div className="space-y-4 rounded-xl border border-gray-200 p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">
                  Upload do arquivo
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  O arquivo será enviado para o storage do PHANYX.
                </p>
              </div>

              <input
                ref={inputArquivoRef}
                type="file"
                accept=".pdf,.ppt,.pptx,.mp4,.mov,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.zip,.rar,.mp3,.wav"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setArquivo(file);
                  setArquivoEnviado(null);
                  setMensagem("");
                  setErro("");
                  setProgressoUpload(0);
                }}
                className="hidden"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => inputArquivoRef.current?.click()}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Selecionar arquivo
                </button>

                <button
                  type="button"
                  onClick={handleUploadArquivo}
                  disabled={!arquivo || uploadingArquivo}
                  className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingArquivo ? "Enviando..." : "Enviar arquivo"}
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                {arquivo ? (
                  <>
                    Arquivo selecionado: <strong>{arquivo.name}</strong>
                  </>
                ) : (
                  "Nenhum arquivo selecionado."
                )}
              </div>

              {uploadingArquivo && (
                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-2 bg-blue-600 transition-all"
                      style={{ width: `${progressoUpload}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Upload: {progressoUpload}%</p>
                </div>
              )}

              {arquivoEnviado && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                  <p>
                    <strong>Arquivo enviado com sucesso.</strong>
                  </p>
                  <p className="mt-1 break-all">{arquivoEnviado.url}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                value={urlExterna}
                onChange={(e) => setUrlExterna(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder={tipo === "video" ? "https://youtube.com/..." : "https://..."}
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={salvando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar material"}
            </button>
          </div>
        </form>
      </div>

      {materialEditando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <form
            onSubmit={salvarEdicaoMaterial}
            className="w-full max-w-xl space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Editar material</h2>
              <button
                type="button"
                onClick={() => setMaterialEditando(null)}
                className="rounded-full px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Título
              </label>
              <input
                value={editTitulo}
                onChange={(e) => setEditTitulo(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full rounded-lg border p-2 text-gray-900"
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMaterialEditando(null)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={salvandoEdicao}
                className="rounded-2xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {salvandoEdicao ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>
      )}

      {materialExcluir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">
              Confirmar exclusão
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tem certeza que deseja excluir o material{" "}
              <strong>"{materialExcluir.titulo}"</strong>?
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Esta ação não pode ser desfeita.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMaterialExcluir(null)}
                disabled={excluindo}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={excluirMaterialConfirmado}
                disabled={excluindo}
                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {excluindo ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}