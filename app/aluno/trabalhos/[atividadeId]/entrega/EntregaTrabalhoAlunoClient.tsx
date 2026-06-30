"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type AtividadeDetalhe = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazo?: string | null;
  notaMaxima?: number | null;
  disciplina?: { nome?: string | null } | null;
  turma?: { nome?: string | null } | null;
  anexos?: {
    id: number;
    titulo: string;
    url: string;
    arquivoNome?: string | null;
    mimeType?: string | null;
    tamanho?: number | null;
  }[];
  entregas?: {
    id: number;
    texto?: string | null;
    link?: string | null;
    arquivoUrl?: string | null;
    entregueEm?: string | null;
    nota?: number | null;
    feedback?: string | null;
  }[];
};

function formatarData(data?: string | null) {
  if (!data) return "Sem prazo";
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatarBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function calcularPrazo(prazo?: string | null) {
  if (!prazo) return { encerrado: false, texto: "Sem prazo definido", classe: "text-slate-600 dark:text-slate-300" };

  const agora = new Date();
  const fim = new Date(prazo);
  const diff = fim.getTime() - agora.getTime();

  if (diff < 0) {
    return { encerrado: true, texto: "❌ Prazo encerrado", classe: "text-red-700 dark:text-red-300" };
  }

  const horas = Math.floor(diff / 1000 / 60 / 60);
  const dias = Math.floor(horas / 24);

  if (dias >= 1) {
    return {
      encerrado: false,
      texto: `🟢 Restam ${dias} dia${dias > 1 ? "s" : ""}`,
      classe: "text-green-700 dark:text-green-300",
    };
  }

  if (horas >= 1) {
    return {
      encerrado: false,
      texto: `🟠 Restam ${horas} hora${horas > 1 ? "s" : ""}`,
      classe: "text-amber-700 dark:text-amber-300",
    };
  }

  return {
    encerrado: false,
    texto: "⚠️ Vence em menos de 1 hora",
    classe: "text-amber-700 dark:text-amber-300",
  };
}

function nomeArquivoUrl(url?: string | null) {
  if (!url) return "Arquivo enviado";
  try {
    const limpa = decodeURIComponent(url.split("?")[0]);
    return limpa.split("/").pop() || "Arquivo enviado";
  } catch {
    return "Arquivo enviado";
  }
}

export default function EntregaTrabalhoAlunoClient({
  atividadeId,
}: {
  atividadeId: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

  const entrega = atividade?.entregas?.[0] || null;
  const prazoInfo = useMemo(() => calcularPrazo(atividade?.prazo), [atividade?.prazo]);
  const prazoEncerrado = prazoInfo.encerrado;

  async function carregarAtividade() {
    try {
      setLoading(true);
      setErro("");

      const res = await fetch(`/api/aluno/atividades/${atividadeId}`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.error || "Erro ao carregar atividade.");
      }

      setAtividade(json);
      setTexto(json?.entregas?.[0]?.texto || "");
      setLink(json?.entregas?.[0]?.link || "");
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar atividade.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarAtividade();
  }, [atividadeId]);

  async function enviarEntrega() {
    try {
      setMensagem("");
      setErro("");
      setSalvando(true);

      let arquivoUrl = entrega?.arquivoUrl || "";

      if (arquivo) {
        if (arquivo.size > 500 * 1024 * 1024) {
          throw new Error("O arquivo excede o limite de 500 MB.");
        }

        const resUploadUrl = await fetch(
          `/api/aluno/atividades/${atividadeId}/upload-url`,
          {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              nomeOriginal: arquivo.name,
              mimeType: arquivo.type || "application/octet-stream",
              tamanho: arquivo.size,
            }),
          }
        );

        const jsonUploadUrl = await resUploadUrl.json();

        if (!resUploadUrl.ok || !jsonUploadUrl?.uploadUrl) {
          throw new Error(jsonUploadUrl?.error || "Erro ao preparar upload.");
        }

        const resUploadDireto = await fetch(jsonUploadUrl.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": arquivo.type || "application/octet-stream" },
          body: arquivo,
        });

        if (!resUploadDireto.ok) {
          throw new Error("Erro ao enviar arquivo.");
        }

        arquivoUrl = jsonUploadUrl.arquivoUrl;
      }

      const response = await fetch(
        `/api/aluno/atividades/${atividadeId}/entregar`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto, link, arquivoUrl }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao enviar atividade.");
      }

      setMensagem("Atividade enviada com sucesso.");
      setTexto("");
      setLink("");
      setArquivo(null);

      router.push(`/aluno/trabalhos/${atividadeId}?entrega=sucesso`);
    } catch (error: any) {
      setErro(error.message || "Erro ao enviar atividade.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-slate-600 dark:text-slate-300">
            Carregando atividade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <a
            href={`/aluno/trabalhos/${atividadeId}`}
            className="text-sm font-black text-blue-700 hover:text-blue-800 dark:text-blue-300"
          >
            ← Voltar para detalhes
          </a>

          <h1 className="mt-4 text-3xl font-black text-slate-900 dark:text-white">
            Enviar atividade
          </h1>
        </div>

        {atividade && (
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  Atividade
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
                  📚 {atividade.titulo}
                </h2>

                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                  {atividade.disciplina?.nome || "Disciplina não informada"} • Turma{" "}
                  {atividade.turma?.nome || "-"}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Prazo
                  </p>
                  <p className="mt-1 font-black text-slate-900 dark:text-white">
                    {formatarData(atividade.prazo)}
                  </p>
                  <p className={`mt-1 text-sm font-black ${prazoInfo.classe}`}>
                    {prazoInfo.texto}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Valor
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                    {atividade.notaMaxima || 10}
                  </p>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    pontos
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
            Status da entrega
          </p>

          {entrega ? (
            <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
              <p className="text-xl font-black">
                {entrega.nota != null ? "⭐ Corrigida" : "✅ Entregue"}
              </p>

              <p className="mt-2 font-bold">
                Enviada em:{" "}
                {entrega.entregueEm ? formatarData(entrega.entregueEm) : "-"}
              </p>

              <p className="mt-1">
                {entrega.nota != null
                  ? "O professor já avaliou esta atividade."
                  : "Sua resposta foi enviada e está aguardando correção."}
              </p>

              {entrega.nota != null && (
                <div className="mt-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-900/60 dark:bg-yellow-950/30 dark:text-yellow-200">
                  <p className="text-xs font-black uppercase tracking-[0.2em]">
                    Avaliação
                  </p>
                  <p className="mt-2 text-3xl font-black">
                    ⭐ {entrega.nota} / {atividade?.notaMaxima || 10}
                  </p>
                </div>
              )}

              {entrega.feedback && (
                <div className="mt-4 rounded-2xl border border-green-200 bg-white/70 p-4 dark:border-green-900 dark:bg-slate-950/60">
                  <p className="font-black">💬 Feedback do professor</p>
                  <p className="mt-2 whitespace-pre-line leading-7">
                    {entrega.feedback}
                  </p>
                </div>
              )}
            </div>
          ) : prazoEncerrado ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
              ❌ Prazo encerrado. Não é possível enviar esta atividade.
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
              📤 Ainda não enviada. Você pode enviar texto, link ou arquivo.
            </div>
          )}
        </section>

        {atividade?.descricao && (
          <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Orientações
            </h3>

            <div className="mt-4 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              {atividade.descricao}
            </div>
          </section>
        )}

        {atividade?.anexos && atividade.anexos.length > 0 && (
          <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/40">
            <h3 className="text-xl font-black text-blue-800 dark:text-blue-200">
              📎 Arquivos da atividade ({atividade.anexos.length})
            </h3>

            <div className="mt-4 grid gap-3">
              {atividade.anexos.map((anexo) => (
                <a
                  key={anexo.id}
                  href={anexo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-1 rounded-2xl border border-blue-200 bg-white px-5 py-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
                >
                  <span>📄 {anexo.arquivoNome || anexo.titulo}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {anexo.mimeType || "Arquivo"}{" "}
                    {anexo.tamanho ? `• ${formatarBytes(anexo.tamanho)}` : ""}
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        {entrega && (
          <section className="rounded-3xl border border-green-200 bg-green-50 p-5 dark:border-green-900/60 dark:bg-green-950/30">
            <h3 className="text-xl font-black text-green-800 dark:text-green-200">
              Minha última entrega
            </h3>

            <div className="mt-4 space-y-3 text-sm text-green-900 dark:text-green-100">
              {entrega.texto && (
                <div className="rounded-2xl border border-green-200 bg-white/70 p-4 dark:border-green-900 dark:bg-slate-950/50">
                  <p className="font-black">Texto enviado</p>
                  <p className="mt-2 whitespace-pre-line leading-7">
                    {entrega.texto}
                  </p>
                </div>
              )}

              {entrega.link && (
                <div className="rounded-2xl border border-green-200 bg-white/70 p-4 dark:border-green-900 dark:bg-slate-950/50">
                  <p className="font-black">Link enviado</p>
                  <a
                    href={entrega.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 block break-all underline"
                  >
                    {entrega.link}
                  </a>
                </div>
              )}

              {entrega.arquivoUrl && (
                <div className="rounded-2xl border border-green-200 bg-white/70 p-4 dark:border-green-900 dark:bg-slate-950/50">
                  <p className="font-black">Arquivo enviado</p>
                  <a
                    href={entrega.arquivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex rounded-xl bg-green-700 px-4 py-2 font-black text-white hover:bg-green-800"
                  >
                    📎 Abrir {nomeArquivoUrl(entrega.arquivoUrl)}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}

        {mensagem && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            {mensagem}
          </div>
        )}

        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {erro}
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Sua resposta
          </h3>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Texto da resposta
            </label>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={9}
              disabled={Boolean(prazoEncerrado)}
              placeholder="Escreva aqui sua resposta ao professor..."
              className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Link externo
            </label>

            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="Cole aqui um link do Google Drive, OneDrive, YouTube ou outro material online."
              disabled={Boolean(prazoEncerrado)}
              className="w-full rounded-2xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Arquivo
            </label>

            <input
              ref={fileInputRef}
              type="file"
              disabled={Boolean(prazoEncerrado)}
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="hidden"
            />

            <button
              type="button"
              disabled={Boolean(prazoEncerrado)}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <span className="block text-lg font-black text-slate-900 dark:text-white">
                📎 Selecionar arquivo
              </span>
              <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
                Envie PDF, imagem, documento, planilha, vídeo ou arquivo compactado.
              </span>
            </button>

            {arquivo && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span>
                  ✅ {arquivo.name}{" "}
                  <span className="text-slate-500 dark:text-slate-400">
                    ({formatarBytes(arquivo.size)})
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setArquivo(null)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Remover
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Ao enviar esta atividade, você confirma que o conteúdo apresentado é de sua autoria e está ciente das normas acadêmicas da instituição.
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={enviarEntrega}
              disabled={salvando || Boolean(prazoEncerrado)}
              className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando
                ? "Enviando..."
                : entrega
                ? "📤 Atualizar entrega"
                : "📤 Enviar atividade"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}