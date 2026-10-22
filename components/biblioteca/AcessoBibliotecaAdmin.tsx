"use client";

import { type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import BibliotecaContratacaoPage from "@/app/admin/biblioteca/contratacao/page";
import { CONTRATACAO_BIBLIOTECA, decidirNavegacaoBiblioteca, VISAO_GERAL_BIBLIOTECA } from "@/lib/biblioteca-navegacao-admin";
import { AtualizarAcessoBibliotecaContext, type BibliotecaAcessoMenu } from "./ContextoAcessoBibliotecaAdmin";

type Resultado = ReturnType<typeof decidirNavegacaoBiblioteca>;

export default function AcessoBibliotecaAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("AdminLibraryDashboard");
  const atualizarMenu = useContext(AtualizarAcessoBibliotecaContext);
  const [tentativa, setTentativa] = useState(0);
  // Cada navegação tem sua própria verificação, inclusive ao voltar ao mesmo endereço.
  const rota = useMemo(() => ({ caminho: pathname.replace(/\/$/, "") }), [pathname]);
  const [verificacao, setVerificacao] = useState<{ rota: typeof rota; resultado: Resultado } | null>(null);
  const contratacao = rota.caminho === CONTRATACAO_BIBLIOTECA;

  useEffect(() => {
    let vigente = true;
    const controle = new AbortController();
    async function verificar() {
      try {
        const resposta = await fetch("/api/admin/biblioteca/acesso", {
          credentials: "include", cache: "no-store", signal: controle.signal,
        });
        const corpo: unknown = await resposta.json();
        if (!vigente) return;
        const resultado = decidirNavegacaoBiblioteca(resposta.status, corpo);
        atualizarMenu?.(resultado === "permitido" ? corpo as BibliotecaAcessoMenu : null);
        setVerificacao({ rota, resultado });
        if (!contratacao && resultado === "planos" && rota.caminho !== VISAO_GERAL_BIBLIOTECA) {
          router.replace(VISAO_GERAL_BIBLIOTECA);
        } else if (resultado === "login") {
          router.replace("/login?portal=admin");
        }
      } catch {
        if (vigente) { atualizarMenu?.(null); setVerificacao({ rota, resultado: "erro" }); }
      }
    }
    void verificar();
    return () => { vigente = false; controle.abort(); };
  }, [rota, contratacao, tentativa, router, atualizarMenu]);

  // A contratação tem autenticação e permissões próprias na API e não exige o módulo ativo.
  if (contratacao) return children;
  const resultado = verificacao?.rota === rota ? verificacao.resultado : null;
  if (resultado === "permitido") return children;
  if (resultado === "planos" && rota.caminho === VISAO_GERAL_BIBLIOTECA) return <BibliotecaContratacaoPage />;
  if (resultado === "negado" || resultado === "erro") {
    return (
      <section className="m-4 rounded-2xl border border-slate-300 bg-white p-6 text-slate-950 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:m-6">
        <h1 className="text-xl font-bold">{t("errors.unavailableTitle")}</h1>
        <p className="mt-2 text-sm" role="alert">{t(resultado === "negado" ? "errors.noAccess" : "errors.load")}</p>
        <button type="button" className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800" onClick={() => { setVerificacao(null); setTentativa((valor) => valor + 1); }}>
          {t("retry")}
        </button>
      </section>
    );
  }
  return <div role="status" className="p-6 text-sm text-slate-700 dark:text-slate-200">{t("loadingAria")}</div>;
}
