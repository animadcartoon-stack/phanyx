"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const botao = "rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60";

export function InscreverDocente({ ofertaId }: { ofertaId: number }) {
  const t = useTranslations("ProfessorMobility");
  const router = useRouter();
  const [estado, setEstado] = useState<"inicial" | "confirmar" | "enviando" | "enviada">("inicial");
  const [erro, setErro] = useState("");

  async function confirmar() {
    setEstado("enviando");
    setErro("");
    try {
      const resposta = await fetch("/api/professor/mobilidade/candidaturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ofertaId }),
      });
      const dados = await resposta.json();
      if (!resposta.ok && dados.codigo !== "CANDIDATURA_DUPLICADA") {
        throw new Error(dados.codigo);
      }
      setEstado("enviada");
      router.refresh();
    } catch (erro) {
      const codigo = erro instanceof Error ? erro.message : "";
      setErro(codigo === "INSCRICOES_DOCENTES_DESATIVADAS" || codigo === "OFERTA_INDISPONIVEL"
        ? t("unavailable")
        : t("applyError"));
      setEstado("confirmar");
    }
  }

  if (estado === "enviada") return <p role="status" className="text-sm font-semibold">{t("applied")}</p>;
  if (estado === "inicial") {
    return <button type="button" className={botao} onClick={() => setEstado("confirmar")}>{t("apply")}</button>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm">{t("confirm")}</p>
      {erro && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{erro}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" className={botao} disabled={estado === "enviando"} onClick={confirmar}>{t("confirmButton")}</button>
        <button type="button" className="rounded-lg border border-slate-400 px-4 py-2 text-sm font-semibold"
          disabled={estado === "enviando"} onClick={() => { setErro(""); setEstado("inicial"); }}>{t("cancel")}</button>
      </div>
    </div>
  );
}

export function EnviarDocumentoDocente({ candidaturaId, documentoId, exigeValidade }: {
  candidaturaId: number;
  documentoId: number;
  exigeValidade: boolean;
}) {
  const t = useTranslations("StudentMobility.upload");
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ erro: boolean; texto: string } | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const dados = new FormData(form);
    const arquivo = dados.get("arquivo");
    const validadeAte = dados.get("validade") || null;
    if (!(arquivo instanceof File) || !arquivo.size) {
      setMensagem({ erro: true, texto: t("errors.missingFile") });
      return;
    }

    setMensagem(null);
    setEnviando(true);
    const url = `/api/professor/mobilidade/candidaturas/${candidaturaId}/documentos/${documentoId}/upload`;
    try {
      const headers = { "Content-Type": "application/json" };
      const resposta = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ nomeOriginal: arquivo.name, tamanhoBytes: arquivo.size, mimeType: arquivo.type, validadeAte }),
      });
      const dadosUpload = await resposta.json();
      if (!resposta.ok) throw new Error(dadosUpload.codigo);

      const envio = await fetch(dadosUpload.presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": dadosUpload.mimeType },
        body: arquivo,
      });
      if (!envio.ok) throw new Error("TRANSFERENCIA_FALHOU");

      const finalizacao = await fetch(`${url}/finalizar`, {
        method: "POST",
        headers,
        body: JSON.stringify({ pathname: dadosUpload.pathname, nomeOriginal: arquivo.name, validadeAte }),
      });
      if (!finalizacao.ok) throw new Error((await finalizacao.json()).codigo);
      form.reset();
      setMensagem({ erro: false, texto: t("success") });
      router.refresh();
    } catch (erro) {
      const codigo = erro instanceof Error ? erro.message : "";
      const chaves = {
        ARQUIVO_FORMATO_INVALIDO: "format",
        ARQUIVO_MUITO_GRANDE: "size",
        VALIDADE_OBRIGATORIA: "validity",
        VALIDADE_INVALIDA: "validity",
        DOCUMENTO_NAO_EDITAVEL: "locked",
        BLOB_NAO_CONFIGURADO: "unavailable",
        TRANSFERENCIA_FALHOU: "transfer",
      } as const;
      setMensagem({ erro: true, texto: t(`errors.${chaves[codigo as keyof typeof chaves] ?? "generic"}`) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-3 space-y-2">
      <label className="block text-sm">
        {t("selectFile")}
        <input className="mt-1 block max-w-full" name="arquivo" type="file" required disabled={enviando}
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" />
      </label>
      {exigeValidade && (
        <label className="block text-sm">
          {t("validity")}
          <input name="validade" type="date" required disabled={enviando}
            className="mt-1 block rounded-lg border border-slate-400 bg-white px-2 py-1 dark:bg-slate-900" />
        </label>
      )}
      <p className="text-xs text-slate-600 dark:text-slate-300">{t("formats")}</p>
      <button type="submit" disabled={enviando} className={botao}>{t(enviando ? "sending" : "send")}</button>
      {mensagem && <p role={mensagem.erro ? "alert" : "status"}
        className={mensagem.erro ? "text-sm text-red-700 dark:text-red-300" : "text-sm text-emerald-700 dark:text-emerald-300"}>
        {mensagem.texto}
      </p>}
    </form>
  );
}
