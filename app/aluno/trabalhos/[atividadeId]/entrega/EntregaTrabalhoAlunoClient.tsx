"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function EntregaTrabalhoAlunoClient({
  atividadeId,
}: {
  atividadeId: string;
}) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [link, setLink] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [atividade, setAtividade] = useState<AtividadeDetalhe | null>(null);
  const [loading, setLoading] = useState(true);

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

    let arquivoUrl = "";

    if (arquivo) {
      if (arquivo.size > 500 * 1024 * 1024) {
        throw new Error("O arquivo excede o limite de 500 MB.");
      }

      const resUploadUrl = await fetch(
        `/api/aluno/atividades/${atividadeId}/upload-url`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
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
        headers: {
          "Content-Type": arquivo.type || "application/octet-stream",
        },
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texto,
          link,
          arquivoUrl,
        }),
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
    <div className="mx-auto max-w-5xl p-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-300">
          Carregando atividade...
        </p>
      </div>
    </div>
  );
}

 const entrega = atividade?.entregas?.[0] || null;
const prazoEncerrado =
  atividade?.prazo && new Date() > new Date(atividade.prazo);

return (
  <div className="mx-auto max-w-5xl p-6">
    <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <a
          href={`/aluno/trabalhos/${atividadeId}`}
          className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-300"
        >
          ← Voltar para detalhes
        </a>

        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
          Enviar atividade
        </h1>
      </div>

      {atividade && (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {atividade.titulo}
          </h2>

          <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Disciplina:</strong> {atividade.disciplina?.nome || "-"}
            </p>

            <p className="text-slate-700 dark:text-slate-300">
              <strong>Turma:</strong> {atividade.turma?.nome || "-"}
            </p>

            <p className="text-slate-700 dark:text-slate-300">
              <strong>Prazo:</strong>{" "}
              {atividade.prazo
                ? new Date(atividade.prazo).toLocaleString("pt-BR")
                : "Sem prazo"}
            </p>

            <p className="text-slate-700 dark:text-slate-300">
              <strong>Nota máxima:</strong> {atividade.notaMaxima}
            </p>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
          Status da entrega
        </p>

        {entrega ? (
          <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/60 dark:bg-green-950/40 dark:text-green-200">
            <p className="font-black">✅ Atividade entregue</p>
            <p className="mt-1">
              Enviada em:{" "}
              {entrega.entregueEm
                ? new Date(entrega.entregueEm).toLocaleString("pt-BR")
                : "-"}
            </p>

            {entrega.nota != null && (
              <p className="mt-3 font-black">
                ⭐ Nota: {entrega.nota} / {atividade?.notaMaxima || 10}
              </p>
            )}

            {entrega.feedback && (
              <div className="mt-3 rounded-xl border border-green-200 bg-white/70 p-3 dark:border-green-900 dark:bg-slate-950/60">
                <p className="font-black">💬 Feedback do professor</p>
                <p className="mt-1 whitespace-pre-line">{entrega.feedback}</p>
              </div>
            )}
          </div>
        ) : prazoEncerrado ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            ❌ Prazo encerrado. Não é possível enviar esta atividade.
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200">
            📤 Ainda não enviada. Você pode enviar texto, link ou arquivo.
          </div>
        )}
      </section>

      {atividade?.descricao && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Orientações
          </h3>

          <div className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700 dark:text-slate-300">
            {atividade.descricao}
          </div>
        </section>
      )}

      {atividade?.anexos && atividade.anexos.length > 0 && (
        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/40">
          <h3 className="font-black text-blue-800 dark:text-blue-200">
            📎 Arquivos da atividade ({atividade.anexos.length})
          </h3>

          <div className="mt-4 space-y-2">
            {atividade.anexos.map((anexo) => (
              <a
                key={anexo.id}
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-300"
              >
                📄 {anexo.arquivoNome || anexo.titulo}
              </a>
            ))}
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
        <h3 className="text-lg font-black text-slate-900 dark:text-white">
          Sua resposta
        </h3>

        <div className="mt-5">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            Texto da resposta
          </label>

          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={8}
            disabled={Boolean(prazoEncerrado)}
            className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            Link externo
          </label>

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            disabled={Boolean(prazoEncerrado)}
            className="w-full rounded-2xl border border-slate-300 bg-white p-3 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
            Arquivo
          </label>

          <input
            type="file"
            disabled={Boolean(prazoEncerrado)}
            onChange={(e) => setArquivo(e.target.files?.[0] || null)}
            className="block w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          />

          {arquivo && (
            <p className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              📎 Arquivo selecionado: {arquivo.name}
            </p>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          Ao enviar esta atividade, você confirma que o conteúdo apresentado é de sua autoria e está ciente das normas acadêmicas da instituição.
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={enviarEntrega}
            disabled={salvando || Boolean(prazoEncerrado)}
            className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? "Enviando..." : "📤 Enviar atividade"}
          </button>
        </div>
      </section>
    </div>
  </div>
);
}