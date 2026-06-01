"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";

type UsuarioLogado = {
  id?: number;
  nome?: string;
  email?: string;
  role?: string;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean;
};

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const esconderSidebar = pathname?.includes(
    "/admin/configuracoes/certificado"
  );
useEffect(() => {
  let timeout: NodeJS.Timeout;

  const tempoInatividade = 5 * 60 * 1000; // 5 minutos
  // se quiser testar com 1 minuto:
  // const tempoInatividade = 1 * 60 * 1000;

  const resetTimer = () => {
    clearTimeout(timeout);

    timeout = setTimeout(async () => {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setSessaoExpirada(true);

setTimeout(() => {
  window.location.href = "/login?portal=admin";
}, 2500);
    }, tempoInatividade);
  };

  window.addEventListener("mousemove", resetTimer);
  window.addEventListener("keydown", resetTimer);
  window.addEventListener("click", resetTimer);
  window.addEventListener("scroll", resetTimer);

  resetTimer();

  return () => {
    clearTimeout(timeout);
    window.removeEventListener("mousemove", resetTimer);
    window.removeEventListener("keydown", resetTimer);
    window.removeEventListener("click", resetTimer);
    window.removeEventListener("scroll", resetTimer);
  };
}, []);

  const descobrirMenuInicial = () => {
    if (pathname.startsWith("/admin/leads")) return "comercial";
    if (pathname.startsWith("/admin/financeiro")) return "financeiro";
    if (pathname.startsWith("/admin/contratos")) return "documentos";
    if (pathname.startsWith("/admin/documentos")) return "documentos";
    if (pathname.startsWith("/admin/validacoes")) return "documentos";
    if (pathname.startsWith("/admin/configuracoes")) return "configuracoes";
    if (pathname.startsWith("/master")) return "master";
    return "academico";
  };

  const [menuAberto, setMenuAberto] = useState<string | null>(
  descobrirMenuInicial()
);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [funcionario, setFuncionario] = useState<{
  nome?: string;
  fotoPerfil?: string | null;
} | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState<string | null>(null);

  useEffect(() => {
  setMenuAberto(null);
  setMenuMobileAberto(null);
}, [pathname]);

  useEffect(() => {
    function abrirMenuConfiguracoes() {
      setMenuAberto("configuracoes");
    }

    function abrirMenuAcademico() {
      setMenuAberto("academico");
    }

    function abrirMenuPainel() {
      setMenuAberto(null);
    }

    window.addEventListener(
      "phanyx:abrir-menu-configuracoes",
      abrirMenuConfiguracoes as EventListener
    );
    window.addEventListener(
      "phanyx:abrir-menu-academico",
      abrirMenuAcademico as EventListener
    );
    window.addEventListener(
      "phanyx:resetar-menu-tour",
      abrirMenuPainel as EventListener
    );

    return () => {
      window.removeEventListener(
        "phanyx:abrir-menu-configuracoes",
        abrirMenuConfiguracoes as EventListener
      );
      window.removeEventListener(
        "phanyx:abrir-menu-academico",
        abrirMenuAcademico as EventListener
      );
      window.removeEventListener(
        "phanyx:resetar-menu-tour",
        abrirMenuPainel as EventListener
      );
    };
  }, []);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          setUsuario(null);
          return;
        }

        const data = await res.json();

setUsuario(data.user ?? null);

try {
  const resFuncionario = await fetch("/api/admin/funcionarios/me", {
    cache: "no-store",
    credentials: "include",
  });

  if (resFuncionario.ok) {
    const funcionarioData = await resFuncionario.json();

    setFuncionario({
      nome: funcionarioData?.nome,
      fotoPerfil: funcionarioData?.fotoPerfil,
    });
  }
} catch {
  setFuncionario(null);
}
      } catch {
        setUsuario(null);
      } finally {
        setCarregandoUsuario(false);
      }
    }

    carregarUsuario();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  }

  function toggleMenu(menu: string) {
    setMenuAberto((atual) => (atual === menu ? null : menu));
  }

  function isActive(path: string) {
    if (path === "/admin") return pathname === "/admin";
    return pathname === path || pathname.startsWith(path + "/");
  }

  function getLinkClass(path: string) {
    return `flex items-center gap-2 p-2 rounded text-sm transition ${
      isActive(path)
        ? "bg-blue-500 text-white font-medium"
        : "text-gray-700 hover:bg-gray-100"
    }`;
  }

  const buttonClass =
    "w-full flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-100 font-semibold text-left";
  const sectionTitleClass =
    "text-xs text-gray-500 font-semibold uppercase tracking-wide";

  const emailsComercialPhanyx = ["atendimento@institutobatista.com"];

  const podeVerComercialPhanyx =
  !carregandoUsuario &&
  (
    usuario?.isMasterAdmin === true ||
    usuario?.role === "SUPER_ADMIN"
  );

  const podeVerPainelMaster =
    !carregandoUsuario && Boolean(usuario?.isMasterAdmin);

function abrirTourAdmin() {
  if (pathname?.startsWith("/admin/financeiro")) {
    window.dispatchEvent(new CustomEvent("phanyx:abrir-tour-financeiro"));
    return;
  }

  window.dispatchEvent(new CustomEvent("phanyx:abrir-tour-admin"));
}

  return (
  <>
    <InstallPromptPHANYX />

    <div className="flex min-h-screen bg-gray-100">
      {!esconderSidebar && (
        <aside className="hidden w-72 bg-white shadow-lg p-6 lg:flex flex-col h-screen overflow-y-auto">
          <div>
            <div className="mb-8">
              <h2 className="text-xl font-semibold">
                PHANYX
                <span className="block text-sm text-gray-500 font-normal">
                  Painel Administrativo
                </span>
              </h2>

              <button
                type="button"
                onClick={abrirTourAdmin}
                className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                ✨ Abrir tutorial guiado
              </button>

<div className="mt-4">
  <PhanyxThemeToggle />
</div>

            </div>

<div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
  <div className="flex items-center gap-3">
    <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-200">
      {funcionario?.fotoPerfil ? (
        <img
          src={funcionario.fotoPerfil}
          alt={funcionario.nome || "Funcionário"}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-700">
          {funcionario?.nome?.charAt(0)?.toUpperCase() || "A"}
        </div>
      )}
    </div>

    <div className="min-w-0">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
        Administrativo
      </p>

      <p className="truncate text-sm font-bold text-slate-800">
        {funcionario?.nome || usuario?.nome || "Administrador"}
      </p>
    </div>
  </div>
</div>

            <nav className="flex flex-col space-y-2">
              <Link
                href="/admin"
                className={getLinkClass("/admin")}
                data-tour="menu-painel"
              >
                📊 Painel Administrativo
              </Link>
<Link
  href="/admin/perfil"
  className={getLinkClass("/admin/perfil")}
>
  👤 Meu Perfil
</Link>
              {podeVerPainelMaster && (
                <div className="border-t pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleMenu("master")}
                    className={buttonClass}
                  >
                    <span className={sectionTitleClass}>🔥 Master PHANYX</span>
                    <span>{menuAberto === "master" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "master" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link href="/master" className={getLinkClass("/master")}>
                        🚀 Painel Master
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {podeVerComercialPhanyx && (
                <div className="border-t pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleMenu("comercial")}
                    className={buttonClass}
                  >
                    <span className={sectionTitleClass}>
                      💼 Comercial PHANYX
                    </span>
                    <span>{menuAberto === "comercial" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "comercial" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link
                        href="/admin/leads"
                        className={getLinkClass("/admin/leads")}
                      >
                        📈 Leads PHANYX
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleMenu("academico")}
                  className={buttonClass}
                >
                  <span className={sectionTitleClass}>🎓 Acadêmico</span>
                  <span>{menuAberto === "academico" ? "▾" : "▸"}</span>
                </button>

                {menuAberto === "academico" && (
                  <div className="ml-3 mt-2 flex flex-col space-y-1">
                    <Link
                      href="/admin/alunos"
                      className={getLinkClass("/admin/alunos")}
                      data-tour="menu-alunos"
                    >
                      👨‍🎓 Alunos
                    </Link>

                    <Link
                      href="/admin/professores"
                      className={getLinkClass("/admin/professores")}
                      data-tour="menu-professores"
                    >
                      👨‍🏫 Professores
                    </Link>

                    <Link
                      href="/admin/funcionarios"
                      className={getLinkClass("/admin/funcionarios")}
                    >
                      🧑‍💼 Funcionários
                    </Link>

                    <Link
                      href="/admin/departamentos"
                      className={getLinkClass("/admin/departamentos")}
                      data-tour="menu-departamentos"
                    >
                      🏢 Departamentos
                    </Link>

                    <Link
                      href="/admin/disciplinas"
                      className={getLinkClass("/admin/disciplinas")}
                    >
                      📚 Disciplinas
                    </Link>

                    <Link
                      href="/admin/matriculas"
                      className={getLinkClass("/admin/matriculas")}
                      data-tour="menu-matriculas"
                    >
                      📝 Matrículas
                    </Link>

                    <Link
                      href="/admin/turmas"
                      className={getLinkClass("/admin/turmas")}
                    >
                      🏫 Turmas
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleMenu("financeiro")}
                  className={buttonClass}
                >
                  <span className={sectionTitleClass}>💰 Financeiro</span>
                  <span>{menuAberto === "financeiro" ? "▾" : "▸"}</span>
                </button>

                {menuAberto === "financeiro" && (
                  <div className="ml-3 mt-2 flex flex-col space-y-1">
                    <Link
                      href="/admin/financeiro"
                      className={getLinkClass("/admin/financeiro")}
                    >
                      💰 Visão Geral
                    </Link>

                    <Link
  href="/admin/financeiro/recebimentos"
  className={getLinkClass("/admin/financeiro/recebimentos")}
  data-tour="financeiro-recebimentos"
>
  💵 Recebimentos
</Link>

                    <Link
  href="/admin/financeiro/caixa"
  className={getLinkClass("/admin/financeiro/caixa")}
  data-tour="financeiro-caixa"
>
  🏦 Caixa
</Link>

                    <Link
  href="/admin/financeiro/relatorios"
  className={getLinkClass("/admin/financeiro/relatorios")}
  data-tour="financeiro-relatorios"
>
  📊 Relatórios
</Link>

                    <Link
  href="/admin/financeiro/inadimplentes"
  className={getLinkClass("/admin/financeiro/inadimplentes")}
  data-tour="financeiro-inadimplentes"
>
  🚨 Inadimplentes
</Link>

                    <Link
  href="/admin/financeiro/fechamento-geral"
  className={getLinkClass(
    "/admin/financeiro/fechamento-geral"
  )}
  data-tour="financeiro-fechamento"
>
  📦 Fechamento Geral
</Link>

                  </div>
                )}
              </div>

              <div className="border-t pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleMenu("documentos")}
                  className={buttonClass}
                >
                  <span className={sectionTitleClass}>📄 Documentos</span>
                  <span>{menuAberto === "documentos" ? "▾" : "▸"}</span>
                </button>

                {menuAberto === "documentos" && (
                  <div className="ml-3 mt-2 flex flex-col space-y-1">
                    <Link
                      href="/admin/contratos"
                      className={getLinkClass("/admin/contratos")}
                    >
                      📄 Contratos
                    </Link>

                    <Link
                      href="/admin/documentos/gerados"
                      className={getLinkClass("/admin/documentos/gerados")}
                    >
                      📚 Gerados
                    </Link>

                    <Link
                      href="/admin/documentos/gerar"
                      className={getLinkClass("/admin/documentos/gerar")}
                    >
                      ⚡ Gerar
                    </Link>

                    <Link
                      href="/admin/validacoes"
                      className={getLinkClass("/admin/validacoes")}
                    >
                      🔐 Validação
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-t pt-2 mt-2">
                <button
                  type="button"
                  onClick={() => toggleMenu("configuracoes")}
                  className={buttonClass}
                >
                  <span className={sectionTitleClass}>⚙️ Configurações</span>
                  <span>{menuAberto === "configuracoes" ? "▾" : "▸"}</span>
                </button>

                {menuAberto === "configuracoes" && (
                  <div className="ml-3 mt-2 flex flex-col space-y-1">
                    <Link
                      href="/admin/configuracoes/instituicao"
                      className={getLinkClass(
                        "/admin/configuracoes/instituicao"
                      )}
                      data-tour="menu-configuracoes"
                    >
                      ⚙️ Instituição
                    </Link>

<Link
  href="/admin/configuracoes/documentos"
  className={getLinkClass("/admin/configuracoes/documentos")}
>
  📄 Documentos institucionais
</Link>

<Link
  href="/admin/certificados"
  className={getLinkClass("/admin/certificados")}
>
  🏅 Gestão de Certificados
</Link>
                    <Link
                      href="/admin/configuracoes/certificado"
                      className={getLinkClass(
                        "/admin/configuracoes/certificado"
                      )}
                    >
                      🏅 Certificados
                    </Link>
                    

<Link
  href="/admin/ouvidoria"
  className={getLinkClass("/admin/ouvidoria")}
>
  🧠 Ouvidoria
</Link>

                  </div>
                )}
              </div>
                       </nav>
          </div>

          <div className="mt-auto pt-6">
            <div className="mt-6 sticky bottom-0 bg-white pt-4">
  <button
    onClick={handleLogout}
    className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold hover:bg-red-600 transition"
  >
    Sair
  </button>
</div>
          </div>
        </aside>
      )}

{!esconderSidebar && (
  <>
    {menuMobileAberto && (
      <div className="fixed bottom-[74px] left-3 right-3 z-[75] rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl lg:hidden">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {menuMobileAberto}
          </p>

          <button
            type="button"
            onClick={() => setMenuMobileAberto(null)}
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
          >
            Fechar
          </button>
        </div>

        {menuMobileAberto === "Acadêmico" && (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/alunos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              👨‍🎓 Alunos
            </Link>
            <Link href="/admin/professores" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              👨‍🏫 Professores
            </Link>
            <Link href="/admin/funcionarios" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🧑‍💼 Funcionários
            </Link>
            <Link href="/admin/departamentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🏢 Departamentos
            </Link>
            <Link href="/admin/disciplinas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📚 Disciplinas
            </Link>
            <Link href="/admin/matriculas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📝 Matrículas
            </Link>
            <Link href="/admin/turmas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🏫 Turmas
            </Link>
          </div>
        )}

        {menuMobileAberto === "Financeiro" && (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/financeiro" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              💰 Visão Geral
            </Link>
            <Link href="/admin/financeiro/recebimentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              💵 Recebimentos
            </Link>
            <Link href="/admin/financeiro/caixa" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🏦 Caixa
            </Link>
            <Link href="/admin/financeiro/relatorios" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📊 Relatórios
            </Link>
            <Link href="/admin/financeiro/inadimplentes" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🚨 Inadimplentes
            </Link>
            <Link href="/admin/financeiro/fechamento-geral" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📦 Fechamento
            </Link>
          </div>
        )}

        {menuMobileAberto === "Documentos" && (
          <div className="grid grid-cols-2 gap-2">
            <Link href="/admin/contratos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📄 Contratos
            </Link>
            <Link href="/admin/documentos/gerados" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📚 Gerados
            </Link>
            <Link href="/admin/documentos/gerar" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              ⚡ Gerar
            </Link>
            <Link href="/admin/validacoes" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🔐 Validação
            </Link>
          </div>
        )}

        {menuMobileAberto === "Configurações" && (
          <div className="grid grid-cols-1 gap-2">
            <Link href="/admin/configuracoes/instituicao" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              ⚙️ Instituição
            </Link>
            <Link href="/admin/configuracoes/documentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📄 Documentos institucionais
            </Link>
            <Link href="/admin/certificados" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🏅 Gestão de Certificados
            </Link>
            <Link href="/admin/configuracoes/certificado" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🎨 Editor de Certificado
            </Link>
            <Link href="/admin/ouvidoria" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
  🧠 Ouvidoria 
</Link>
          </div>
        )}
      </div>
    )}

<div className="fixed right-3 top-20 z-[80] lg:hidden">
  <PhanyxThemeToggle />
</div>

    <nav className="fixed bottom-0 left-0 right-0 z-[70] border-t border-slate-200 bg-white/95 px-2 py-2 shadow-[0_-8px_25px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-6 gap-1 text-[9px] font-semibold text-slate-600">
        <Link href="/admin" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">📊</span>
          Painel
        </Link>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Acadêmico" ? null : "Acadêmico")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">🎓</span>
          Acad.
        </button>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Financeiro" ? null : "Financeiro")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">💰</span>
          Financ.
        </button>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Documentos" ? null : "Documentos")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">📄</span>
          Docs
        </button>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Configurações" ? null : "Configurações")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">⚙️</span>
          Config.
        </button>

        <Link href="/admin/perfil" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">👤</span>
          Perfil
        </Link>
      </div>
    </nav>
  </>
)}

     <main
  className={
    esconderSidebar
      ? "flex-1 p-0"
      : "flex-1 w-full px-3 py-4 pb-24 lg:p-10"
  }
>
  {!esconderSidebar && <PhanyxFeriadoAviso />}

  {children}
</main>

                  <PhanyxConfirmModal
        aberto={sessaoExpirada}
        titulo="Sessão encerrada"
        mensagem="Sua sessão foi encerrada por segurança devido à inatividade. Você será redirecionado para o login."
        textoConfirmar="Ir para o login"
        textoCancelar="Fechar"
        onConfirmar={() => {
          window.location.href = "/login?portal=admin";
        }}
        onCancelar={() => {
          window.location.href = "/login?portal=admin";
        }}
      />
    </div>
  </>
);
}