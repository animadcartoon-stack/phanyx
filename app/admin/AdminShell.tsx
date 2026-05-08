"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";

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

  const [menuAberto, setMenuAberto] = useState<string | null>(null);(
    descobrirMenuInicial()
  );
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [funcionario, setFuncionario] = useState<{
  nome?: string;
  fotoPerfil?: string | null;
} | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);

  useEffect(() => {
  setMenuAberto(null);
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
    !!usuario?.email &&
    emailsComercialPhanyx.includes(usuario.email);

  const podeVerPainelMaster =
    !carregandoUsuario && Boolean(usuario?.isMasterAdmin);

  function abrirTourAdmin() {
    window.dispatchEvent(new CustomEvent("phanyx:abrir-tour-admin"));
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {!esconderSidebar && (
        <aside className="w-72 bg-white shadow-lg p-6 flex flex-col h-screen overflow-y-auto">
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
                    >
                      💵 Recebimentos
                    </Link>

                    <Link
                      href="/admin/financeiro/caixa"
                      className={getLinkClass("/admin/financeiro/caixa")}
                    >
                      🏦 Caixa
                    </Link>

                    <Link
                      href="/admin/financeiro/relatorios"
                      className={getLinkClass("/admin/financeiro/relatorios")}
                    >
                      📊 Relatórios
                    </Link>

                    <Link
                      href="/admin/financeiro/inadimplentes"
                      className={getLinkClass("/admin/financeiro/inadimplentes")}
                    >
                      🚨 Inadimplentes
                    </Link>

                    <Link
                      href="/admin/financeiro/fechamento-geral"
                      className={getLinkClass(
                        "/admin/financeiro/fechamento-geral"
                      )}
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
                      href="/admin/documentos/templates"
                      className={getLinkClass("/admin/documentos/templates")}
                    >
                      🗂️ Templates
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

      <main className={esconderSidebar ? "flex-1 p-0" : "flex-1 p-10"}>
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
  );
}