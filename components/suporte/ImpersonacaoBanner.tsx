"use client";

import { useEffect, useState } from "react";

type ImpersonacaoAtual = {
  id: number;
  usuarioNome: string;
  usuarioEmail: string;
  instituicao: string;
  role?: string | null;
  portal: string;
  motivo: string;
  iniciadoEm: string;
  expiraEm: string;
};

export default function ImpersonacaoBanner() {
  const [impersonacao, setImpersonacao] =
    useState<ImpersonacaoAtual | null>(null);

  const [encerrando, setEncerrando] =
    useState(false);

  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarImpersonacao() {
      try {
        const res = await fetch(
          "/api/master/impersonacao/atual",
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => null);

        if (!ativo) return;

        if (res.ok && data?.ativa) {
          setImpersonacao(data.impersonacao);
        } else {
          setImpersonacao(null);
        }
      } catch {
        if (ativo) {
          setImpersonacao(null);
        }
      }
    }

    void carregarImpersonacao();

    return () => {
      ativo = false;
    };
  }, []);

  async function encerrarImpersonacao() {
    try {
      setEncerrando(true);
      setErro("");

      const res = await fetch(
        "/api/master/impersonacao/encerrar",
        {
          method: "POST",
          credentials: "include",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            "Não foi possível encerrar o acesso."
        );
      }

      window.location.assign(
        data?.destino || "/master"
      );
    } catch (error: any) {
      setErro(
        error?.message ||
          "Não foi possível retornar ao Master."
      );
    } finally {
      setEncerrando(false);
    }
  }

  if (!impersonacao) {
    return null;
  }

  const expiraAs = new Date(
    impersonacao.expiraEm
  ).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="sticky top-0 z-[999999] border-b border-amber-300 bg-amber-100 px-4 py-3 text-amber-950 shadow-lg">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="font-extrabold">
            🛠️ Modo suporte ativo
          </p>

          <p className="mt-1 text-sm font-medium">
            Você está acessando como{" "}
            <strong>
              {impersonacao.usuarioNome}
            </strong>{" "}
            — {impersonacao.usuarioEmail}
          </p>

          <p className="mt-1 text-xs text-amber-800">
            Instituição:{" "}
            {impersonacao.instituicao}
            {impersonacao.role
              ? ` • Perfil: ${impersonacao.role}`
              : ""}
            {` • Expira às ${expiraAs}`}
          </p>

          {erro && (
            <p className="mt-2 text-xs font-bold text-red-700">
              {erro}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={encerrarImpersonacao}
          disabled={encerrando}
          className="shrink-0 rounded-xl border border-amber-700 bg-white px-4 py-2 text-sm font-extrabold text-amber-900 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {encerrando
            ? "Retornando..."
            : "Encerrar e voltar ao Master"}
        </button>
      </div>
    </div>
  );
}