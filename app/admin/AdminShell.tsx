"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";

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
  const sidebarDesktopRef = useRef<HTMLElement | null>(null);
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
  if (pathname.startsWith("/admin/leads")) {
  return "comercial-phanyx";
}

if (pathname.startsWith("/admin/comercial")) {
  return "comercial";
}

if (pathname.startsWith("/admin/rematriculas-semestrais")) {
  return "academico";
}

  if (pathname.startsWith("/admin/financeiro")) return "financeiro";
  if (pathname.startsWith("/admin/rh")) return "rh";

  if (pathname.startsWith("/admin/contratos")) return "documentos";
  if (pathname.startsWith("/admin/documentos")) return "documentos";
  if (pathname.startsWith("/admin/crachas")) return "documentos";
  if (pathname.startsWith("/admin/validacoes")) return "documentos";

  if (pathname.startsWith("/admin/visitantes")) return "acesso";

  if (pathname.startsWith("/admin/reunioes")) return "comunicacao";
  if (pathname.startsWith("/admin/ouvidoria")) return "comunicacao";
  if (pathname.startsWith("/admin/aniversariantes")) return "comunicacao";

  if (pathname.startsWith("/admin/configuracoes")) return "configuracoes";
  if (pathname.startsWith("/master")) return "master";

  return "academico";
};

  const [notificacoesAberto, setNotificacoesAberto] = useState(false);

  const [notificacoesAdmin, setNotificacoesAdmin] = useState<any[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [menuAberto, setMenuAberto] = useState<string | null>(
  descobrirMenuInicial()
);

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [permissoes, setPermissoes] = useState<string[]>([]);
  const [funcionario, setFuncionario] = useState<{
  nome?: string;
  fotoPerfil?: string | null;
} | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);
  const [sessaoExpirada, setSessaoExpirada] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState<string | null>(null);

  useEffect(() => {
  setMenuAberto(descobrirMenuInicial());
  setMenuMobileAberto(null);
}, [pathname]);

  useEffect(() => {
  function rolarSidebarAteAlvo(seletor: string) {
    /*
     * O atraso é necessário porque primeiro o React precisa abrir
     * o grupo do menu e renderizar o link que será destacado.
     */
    window.setTimeout(() => {
      const sidebar = sidebarDesktopRef.current;
      const alvo = document.querySelector<HTMLElement>(seletor);

      if (!sidebar || !alvo) return;

      const sidebarRect = sidebar.getBoundingClientRect();
      const alvoRect = alvo.getBoundingClientRect();

      const destino =
        sidebar.scrollTop +
        (alvoRect.top - sidebarRect.top) -
        sidebar.clientHeight / 2 +
        alvoRect.height / 2;

      sidebar.scrollTo({
        top: Math.max(0, destino),
        behavior: "smooth",
      });

      /*
       * Depois da rolagem, avisamos o componente do tour para
       * recalcular a posição do destaque e do balão.
       */
      window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(
          new CustomEvent("phanyx:reposicionar-tour")
        );
      }, 450);
    }, 100);
  }

  function abrirMenuConfiguracoes() {
    setMenuAberto("configuracoes");

    rolarSidebarAteAlvo(
      '[data-tour="menu-configuracoes"]'
    );
  }

  function abrirMenuAcademico(evento: Event) {
    setMenuAberto("academico");

    const detalhe = (
      evento as CustomEvent<{ seletor?: string }>
    ).detail;

    rolarSidebarAteAlvo(
      detalhe?.seletor || '[data-tour="menu-alunos"]'
    );
  }

  function abrirMenuPainel() {
    setMenuAberto(null);

    window.setTimeout(() => {
      sidebarDesktopRef.current?.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
        window.dispatchEvent(new Event("scroll"));
        window.dispatchEvent(
          new CustomEvent("phanyx:reposicionar-tour")
        );
      }, 450);
    }, 80);
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
  const resPermissoes = await fetch("/api/admin/permissoes/me", {
    cache: "no-store",
    credentials: "include",
  });

  if (resPermissoes.ok) {
    const permissoesData = await resPermissoes.json();
    setPermissoes(Array.isArray(permissoesData.permissoes) ? permissoesData.permissoes : []);
  }
} catch {
  setPermissoes([]);
}

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
carregarNotificacoes();

const intervaloNotificacoes = setInterval(carregarNotificacoes, 30000);

return () => clearInterval(intervaloNotificacoes);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
  }

  async function carregarNotificacoes() {
  try {
    const res = await fetch("/api/admin/notificacoes", {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) return;

    const data = await res.json();

    setNotificacoesAdmin(Array.isArray(data.notificacoes) ? data.notificacoes : []);
    setTotalNaoLidas(Number(data.totalNaoLidas || 0));
  } catch {
    setNotificacoesAdmin([]);
    setTotalNaoLidas(0);
  }
}

  function toggleMenu(menu: string) {
    setMenuAberto((atual) => (atual === menu ? null : menu));
  }

  function temPermissao(chave: string) {
  return permissoes.includes("*") || permissoes.includes(chave);
}

const roleUsuario = String(usuario?.role || "").toUpperCase();

const usuarioAdmin =
  roleUsuario === "ADMIN" ||
  roleUsuario === "GERENCIA" ||
  roleUsuario === "SUPER_ADMIN" ||
  usuario?.isMasterAdmin === true;

const podeGerenciarRematriculasSemestrais =
  roleUsuario === "ADMIN" ||
  roleUsuario === "SUPER_ADMIN";

  function podeAcessar(...chaves: string[]) {
  if (usuarioAdmin) return true;
  if (permissoes.includes("*")) return true;

  return chaves.some((chave) =>
    permissoes.includes(chave)
  );
}

const podeVerPontoMobile = podeAcessar(
  "rh.ponto.mobile.ver",
  "rh.ponto.mobile.configurar",
  "rh.ponto.mobile.funcionarios.gerenciar",
  "rh.ponto.mobile.locais.gerenciar",
  "rh.ponto.mobile.marcacoes.ver",
  "rh.ponto.mobile.ocorrencias.gerenciar"
);

const podeVerRemuneracaoVariavelRH = podeAcessar(
  "rh.remuneracaoVariavel.ver",
  "rh.remuneracaoVariavel.comissoes.gerenciar",
  "rh.remuneracaoVariavel.bonus.gerenciar",
  "rh.remuneracaoVariavel.participacao.gerenciar",
  "rh.remuneracaoVariavel.aprovar",
  "rh.remuneracaoVariavel.holerite.enviar",
  "rh.remuneracaoVariavel.relatorios.ver"
);

const podeVerComissoesRH = podeAcessar(
  "rh.remuneracaoVariavel.comissoes.gerenciar",
  "rh.remuneracaoVariavel.aprovar",
  "rh.remuneracaoVariavel.holerite.enviar",
  "comercial.comissoes.ver",
  "comercial.comissoes.aprovar",
  "comercial.comissoes.enviar_rh"
);

const podeVerProfessoresRH = podeAcessar(
  "rh.professores",
  "rh.professores.ver",
  "rh.professores.criar",
  "rh.professores.editar",
  "rh.professores.vinculo.gerenciar",
  "rh.professores.remuneracao.ver",
  "rh.professores.remuneracao.editar"
);

const podeVerComercialInstituicao = podeAcessar(
  "comercial.ver",
  "comercial.dashboard.ver",
  "comercial.leads.ver",
  "comercial.leads.criar",
  "comercial.leads.editar",
  "comercial.leads.excluir",
  "comercial.leads.atribuir",
  "comercial.leads.converter",
  "comercial.vendedores.ver",
  "comercial.vendedores.gerenciar",
  "comercial.metas.ver",
  "comercial.metas.criar",
  "comercial.metas.editar",
  "comercial.metas.excluir",
  "comercial.vendas.ver",
  "comercial.vendas.criar",
  "comercial.vendas.editar",
  "comercial.vendas.cancelar",
  "comercial.vendas.aprovar",
  "comercial.matriculas.vincular_vendedor",
  "comercial.comissoes.ver",
  "comercial.comissoes.calcular",
  "comercial.comissoes.aprovar",
  "comercial.comissoes.enviar_rh",
  "comercial.relatorios.ver",
  "comercial.relatorios.exportar",
  "comercial.configuracoes.gerenciar"
);

const podeGerenciarConfiguracoesComerciais =
  podeAcessar(
    "comercial.configuracoes.gerenciar"
  );

const podeVerPublicacoesAcademicas =
  usuarioAdmin || temPermissao("academico.publicacoes.ver");

  const podeVerAssinaturaPhanyx =
  usuarioAdmin || temPermissao("assinatura.ver");

  function isActive(path: string) {
  if (path === "/admin") {
    return pathname === "/admin";
  }

  if (path === "/admin/rh") {
    return pathname === "/admin/rh";
  }

  if (path === "/admin/comercial") {
  return pathname === "/admin/comercial";
}

  if (path === "/admin/rh/ponto") {
    return pathname === "/admin/rh/ponto";
  }

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
        <aside
  ref={sidebarDesktopRef}
  className="hidden fixed left-0 top-0 z-40 h-screen w-72 overflow-y-auto bg-white p-6 shadow-lg lg:flex lg:flex-col"
>
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
{podeVerAssinaturaPhanyx && (
  <Link
    href="/admin/assinatura"
    className={getLinkClass("/admin/assinatura")}
  >
    💳 Assinatura PHANYX
  </Link>
)}
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
        <Link
  href="/master"
  className={getLinkClass("/master")}
>
  🚀 Painel Master
</Link>

<Link
  href="/master#suporte-usuario"
  className="flex items-center gap-2 rounded p-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
>
  🛠️ Entrar como usuário
</Link>

<Link
  href="/master/plataforma"
  className={getLinkClass("/master/plataforma")}
>
  🧠 Plataforma PHANYX
</Link>
      </div>
    )}
  </div>
)}
<div className="border-t pt-2 mt-2">
  <button
    type="button"
    onClick={() => toggleMenu("acesso")}
    className={buttonClass}
  >
    <span className={sectionTitleClass}>🚪 Controle de Acesso</span>
    <span>{menuAberto === "acesso" ? "▾" : "▸"}</span>
  </button>

  {menuAberto === "acesso" && (
    <div className="ml-3 mt-2 flex flex-col space-y-1">
      <Link
        href="/admin/visitantes"
        className={getLinkClass("/admin/visitantes")}
      >
        🪪 Visitantes
      </Link>
    </div>
  )}
</div>
              {podeVerComercialPhanyx && (
                <div className="border-t pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() =>
  toggleMenu("comercial-phanyx")
}
                    className={buttonClass}
                  >
                    <span className={sectionTitleClass}>
                      💼 Comercial PHANYX
                    </span>
                    <span>{menuAberto === "comercial" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "comercial-phanyx" && (
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

              {podeVerComercialInstituicao && (
  <div className="mt-2 border-t pt-2">
    <button
      type="button"
      onClick={() => toggleMenu("comercial")}
      className={buttonClass}
    >
      <span className={sectionTitleClass}>
        📈 Comercial
      </span>

      <span>
        {menuAberto === "comercial" ? "▾" : "▸"}
      </span>
    </button>

    {menuAberto === "comercial" && (
  <div className="ml-3 mt-2 flex flex-col space-y-1">
    <Link
      href="/admin/comercial"
      className={getLinkClass(
        "/admin/comercial"
      )}
    >
      📊 Visão Geral
    </Link>

    {podeGerenciarConfiguracoesComerciais && (
      <Link
        href="/admin/comercial/configuracoes"
        className={getLinkClass(
          "/admin/comercial/configuracoes"
        )}
      >
        ⚙️ Planos de comissão
      </Link>
    )}
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
  href="/admin/substituicoes-docentes"
  className={getLinkClass("/admin/substituicoes-docentes")}
>
  🔁 Substituições Docentes
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

                    {podeGerenciarRematriculasSemestrais && (
  <Link
    href="/admin/rematriculas-semestrais"
    className={getLinkClass(
      "/admin/rematriculas-semestrais"
    )}
  >
    🔄 Rematrículas semestrais
  </Link>
)}

                    <Link
                      href="/admin/turmas"
                      className={getLinkClass("/admin/turmas")}
                    >
                      🏫 Turmas
                    </Link>

                    <Link
  href="/admin/agenda-operacional"
  className={getLinkClass("/admin/agenda-operacional")}
>
  🗓️ Agenda / Escala
</Link>
                    
  {podeVerPublicacoesAcademicas && (
  <Link
    href="/admin/academico/publicacoes"
    className={getLinkClass("/admin/academico/publicacoes")}
  >
    📤 Publicações Acadêmicas
  </Link>
)}

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
      {temPermissao("financeiro.ver") && (
        <Link href="/admin/financeiro" className={getLinkClass("/admin/financeiro")}>
          💰 Visão Geral
        </Link>
      )}

      {temPermissao("financeiro.recebimentos") && (
        <Link href="/admin/financeiro/recebimentos" className={getLinkClass("/admin/financeiro/recebimentos")}>
          💵 Recebimentos
        </Link>
      )}

      {temPermissao("caixa.ver") && (
        <Link href="/admin/financeiro/caixa" className={getLinkClass("/admin/financeiro/caixa")}>
          🏦 Caixa
        </Link>
      )}

      {temPermissao("financeiro.relatorios") && (
        <Link href="/admin/financeiro/relatorios" className={getLinkClass("/admin/financeiro/relatorios")}>
          📊 Relatórios
        </Link>
      )}

      {temPermissao("financeiro.inadimplentes") && (
        <Link href="/admin/financeiro/inadimplentes" className={getLinkClass("/admin/financeiro/inadimplentes")}>
          🚨 Inadimplentes
        </Link>
      )}

      {temPermissao("financeiro.fechamento") && (
        <Link href="/admin/financeiro/fechamento-geral" className={getLinkClass("/admin/financeiro/fechamento-geral")}>
          📦 Fechamento Geral
        </Link>
      )}
      {temPermissao("financeiro.configuracoes") && (
  <Link
    href="/admin/financeiro/configuracoes"
    className={getLinkClass("/admin/financeiro/configuracoes")}
  >
    ⚙️ Configurações
  </Link>
)}
    </div>
  )}

<div className="border-t pt-2 mt-2">
  <button
    type="button"
    onClick={() => toggleMenu("rh")}
    className={buttonClass}
  >
    <span className={sectionTitleClass}>👥 PESSOAL / RH</span>
    <span>{menuAberto === "rh" ? "▾" : "▸"}</span>
  </button>

  {menuAberto === "rh" && (
  <div className="ml-3 mt-2 flex flex-col space-y-1">

    <Link href="/admin/rh" className={getLinkClass("/admin/rh")}>
      👥 Visão Geral
    </Link>

    <Link
      href="/admin/funcionarios"
      className={getLinkClass("/admin/funcionarios")}
    >
      👤 Funcionários
    </Link>

    {podeVerProfessoresRH && (
  <Link
    href="/admin/rh/professores"
    className={getLinkClass(
      "/admin/rh/professores"
    )}
  >
    👨‍🏫 Professores
  </Link>
)}

    <Link
  href="/admin/departamentos"
  className={getLinkClass("/admin/departamentos")}
>
  🏢 Departamentos
</Link>

{podeVerRemuneracaoVariavelRH && (
  <Link
  href="/admin/rh/remuneracao-variavel"
  className={getLinkClass(
    "/admin/rh/remuneracao-variavel"
  )}
>
  💰 Remuneração Variável
</Link>
)}

{podeVerComissoesRH && (
  <Link
    href="/admin/rh/comissoes"
    className={getLinkClass(
      "/admin/rh/comissoes"
    )}
  >
    💵 Comissões comerciais
  </Link>
)}

<Link
  href="/admin/rh/ponto"
  className={getLinkClass("/admin/rh/ponto")}
>
  ⏱️ Ponto
</Link>



<Link
  href="/admin/rh/ponto/configuracoes"
  className={getLinkClass("/admin/rh/ponto/configuracoes")}
>
  ⚙️ Configurações de Ponto
</Link>

{podeVerPontoMobile && (
  <Link
    href="/admin/rh/ponto/mobile"
    className={getLinkClass("/admin/rh/ponto/mobile")}
  >
    📱 Ponto Mobile
  </Link>
)}

<Link
  href="/admin/rh/ponto/importacao-afd"
  className={getLinkClass("/admin/rh/ponto/importacao-afd")}
>
  📥 Importação AFD
</Link>

<Link
  href="/admin/rh/banco-horas"
  className={getLinkClass("/admin/rh/banco-horas")}
>
  📊 Banco de Horas
</Link>

    <Link
      href="/admin/rh/holerites"
      className={getLinkClass("/admin/rh/holerites")}
    >
      💵 Holerites
    </Link>

    <Link
  href="/admin/rh/eventos-folha"
  className={getLinkClass("/admin/rh/eventos-folha")}
>
  🧾 Eventos da Folha
</Link>

<Link
  href="/admin/rh/beneficios"
  className={getLinkClass("/admin/rh/beneficios")}
>
  🎁 Benefícios
</Link>

    <Link
      href="/admin/rh/ferias"
      className={getLinkClass("/admin/rh/ferias")}
    >
      🏖️ Férias
    </Link>

    <Link
      href="/admin/rh/exames"
      className={getLinkClass("/admin/rh/exames")}
    >
      🩺 Exames Médicos
    </Link>

    <Link
      href="/admin/rh/rescisoes"
      className={getLinkClass("/admin/rh/rescisoes")}
    >
      🚪 Rescisões
    </Link>

    <Link
      href="/admin/rh/historico"
      className={getLinkClass("/admin/rh/historico")}
    >
      🕒 Histórico Funcional
    </Link>

<Link
  href="/admin/rh/arquivados"
  className={getLinkClass("/admin/rh/arquivados")}
>
  🗄️ Arquivados RH
</Link>

<Link
  href="/admin/rh/ocorrencias"
  className={getLinkClass("/admin/rh/ocorrencias")}
>
  ⚠️ Ocorrências
</Link>

    <Link
      href="/admin/rh/contabilidade"
      className={getLinkClass("/admin/rh/contabilidade")}
    >
      📊 Relatórios Contábeis
    </Link>

    <Link
      href="/admin/rh/documentos"
      className={getLinkClass("/admin/rh/documentos")}
    >
      📄 Documentos RH
    </Link>

  </div>
)}
</div>

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

                    <Link
  href="/admin/crachas"
  className={getLinkClass("/admin/crachas")}
>
  🪪 Crachás
</Link>
                  </div>
                )}
              </div>
<div className="border-t pt-2 mt-2">
  <button
    type="button"
    onClick={() => toggleMenu("comunicacao")}
    className={buttonClass}
  >
    <span className={sectionTitleClass}>💬 Comunicação</span>
    <span>{menuAberto === "comunicacao" ? "▾" : "▸"}</span>
  </button>

  {menuAberto === "comunicacao" && (
  <div className="ml-3 mt-2 flex flex-col space-y-1">
    <Link
  href="/admin/reunioes"
  className={getLinkClass("/admin/reunioes")}
>
  📅 Reuniões
</Link>

<Link
  href="/admin/aniversariantes"
  className={getLinkClass("/admin/aniversariantes")}
>
  🎂 Aniversariantes
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
  href="/admin/departamentos"
  className={getLinkClass("/admin/departamentos")}
>
  🔐 Permissões por setor
</Link>

<Link
  href="/admin/configuracoes/documentos"
  className={getLinkClass("/admin/configuracoes/documentos")}
>
  📄 Documentos institucionais
</Link>

<Link
  href="/admin/configuracoes/portais"
  className={getLinkClass("/admin/configuracoes/portais")}
>
  👁️ Visibilidade dos Portais
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
            <Link
  href="/admin/substituicoes-docentes"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  🔁 Substituições Docentes
</Link>
            <Link href="/admin/funcionarios" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🧑‍💼 Funcionários
            </Link>
            <Link
  href="/admin/visitantes"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  🪪 Visitantes
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
            {podeGerenciarRematriculasSemestrais && (
  <Link
    href="/admin/rematriculas-semestrais"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    🔄 Rematrículas
  </Link>
)}
            <Link href="/admin/turmas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              🏫 Turmas
            </Link>
            <Link
  href="/admin/agenda-operacional"
  className={getLinkClass("/admin/agenda-operacional")}
>
  🗓️ Agenda / Escala
</Link>
            {podeVerPublicacoesAcademicas && (
  <Link
    href="/admin/academico/publicacoes"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    📤 Publicações Acadêmicas
  </Link>
)}
          </div>
        )}

        {menuMobileAberto === "Comercial" &&
  podeVerComercialInstituicao && (
    <div className="grid grid-cols-2 gap-2">
      <Link
        href="/admin/comercial"
        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
      >
        📊 Visão Geral
      </Link>

      {podeGerenciarConfiguracoesComerciais && (
        <Link
          href="/admin/comercial/configuracoes"
          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
        >
          ⚙️ Planos de comissão
        </Link>
      )}
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
            <Link
  href="/admin/financeiro/configuracoes"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  ⚙️ Configurações
</Link>
          </div>
        )}

        {menuMobileAberto === "RH" && (
  <div className="grid grid-cols-2 gap-2">
    <Link
      href="/admin/rh"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      👥 Visão Geral
    </Link>

    <Link
      href="/admin/funcionarios"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      👤 Funcionários
    </Link>

    {podeVerProfessoresRH && (
  <Link
    href="/admin/rh/professores"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    👨‍🏫 Professores
  </Link>
)}

{podeVerRemuneracaoVariavelRH && (
  <Link
    href="/admin/rh/remuneracao-variavel"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    💰 Remuneração Variável
  </Link>
)}

{podeVerComissoesRH && (
  <Link
    href="/admin/rh/comissoes"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    💵 Comissões comerciais
  </Link>
)}

    <Link
      href="/admin/rh/ponto"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      ⏱️ Ponto
    </Link>

    <Link
      href="/admin/rh/ponto/configuracoes"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      ⚙️ Configurações de Ponto
    </Link>

    {podeVerPontoMobile && (
  <Link
    href="/admin/rh/ponto/mobile"
    className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
  >
    📱 Ponto Mobile
  </Link>
)}

    <Link
      href="/admin/rh/ponto/importacao-afd"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      📥 Importação AFD
    </Link>

    <Link
      href="/admin/rh/banco-horas"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      📊 Banco de Horas
    </Link>

    <Link
      href="/admin/rh/holerites"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      💵 Holerites
    </Link>
  </div>
)}

        {menuMobileAberto === "Comunicação" && (
  <div className="grid grid-cols-1 gap-2">
    <Link
      href="/admin/reunioes"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      📅 Reuniões
    </Link>

    <Link
      href="/admin/aniversariantes"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      🎂 Aniversariantes
    </Link>

    <Link
      href="/admin/ouvidoria"
      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
    >
      🧠 Ouvidoria
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
            <Link
  href="/admin/crachas"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  🪪 Crachás
</Link>
          </div>
        )}

        {menuMobileAberto === "Configurações" && (
          <div className="grid grid-cols-1 gap-2">
            <Link href="/admin/configuracoes/instituicao" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              ⚙️ Instituição
            </Link>
            <Link
  href="/admin/assinatura"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  💳 Assinatura PHANYX
</Link>
            <Link href="/admin/configuracoes/documentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
              📄 Documentos institucionais
            </Link>
            <Link
  href="/admin/configuracoes/portais"
  className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
>
  👁️ Visibilidade dos Portais
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
      <div
  className={[
    "grid gap-1 text-[8px] font-semibold text-slate-600",
    podeVerComercialInstituicao
      ? "grid-cols-8"
      : "grid-cols-7",
  ].join(" ")}
>

        <Link href="/admin" className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">📊</span>
          Painel
        </Link>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Acadêmico" ? null : "Acadêmico")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">🎓</span>
          Acad.
        </button>

        {podeVerComercialInstituicao && (
  <button
    type="button"
    onClick={() =>
      setMenuMobileAberto(
        menuMobileAberto === "Comercial"
          ? null
          : "Comercial"
      )
    }
    className={[
      "flex flex-col items-center justify-center rounded-xl px-1 py-2 transition",
      menuMobileAberto === "Comercial"
        ? "bg-blue-50 text-blue-700"
        : "hover:bg-blue-50 hover:text-blue-700",
    ].join(" ")}
  >
    <span className="text-lg">📈</span>
    Comerc.
  </button>
)}

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Financeiro" ? null : "Financeiro")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">💰</span>
          Financ.
        </button>

        <button
  type="button"
  onClick={() =>
    setMenuMobileAberto(
      menuMobileAberto === "RH" ? null : "RH"
    )
  }
  className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700"
>
  <span className="text-lg">👥</span>
  RH
</button>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Documentos" ? null : "Documentos")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">📄</span>
          Docs
        </button>

        <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Configurações" ? null : "Configurações")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
          <span className="text-lg">⚙️</span>
          Config.
        </button>

        <button
  type="button"
  onClick={() =>
    setMenuMobileAberto(
      menuMobileAberto === "Comunicação" ? null : "Comunicação"
    )
  }
  className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700"
>
  <span className="text-lg">💬</span>
  Comun.
</button>
      </div>
    </nav>
  </>
)}

     <main
  className={
    esconderSidebar
      ? "flex-1 p-0"
      : "flex-1 w-full px-3 py-4 pb-24 lg:ml-72 lg:p-10"
  }
>
  {!esconderSidebar && <PhanyxFeriadoAviso />}

  {!esconderSidebar && (
    <div className="mb-4 flex justify-end">
      <div className="relative">
        <button
          type="button"
          onClick={() => setNotificacoesAberto((v) => !v)}
          className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-xl shadow-lg transition hover:scale-105"
        >
          🔔

          {totalNaoLidas > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[11px] font-black text-white">
              {totalNaoLidas}
            </span>
          )}
        </button>

        {notificacoesAberto && (
          <div className="absolute right-0 z-[9999] mt-3 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="border-b border-white/10 px-4 py-3">
              <p className="text-sm font-black text-white">
                Notificações
              </p>

              <p className="text-xs text-slate-400">
                Atualizações importantes do PHANYX
              </p>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificacoesAdmin.map((item) => (
                <a
                  key={item.titulo}
                  href={item.link}
                  className="flex gap-3 border-b border-white/5 px-4 py-3 transition hover:bg-white/10"
                >
                  <span className="text-xl">
                    {item.emoji}
                  </span>

                  <div>
                    <div className="text-sm font-bold text-white">
                      {item.titulo}
                    </div>

                    <div className="text-xs text-slate-400">
                      {item.descricao}
                    </div>
                  </div>
                </a>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-800 pt-3">
  <button
    type="button"
    onClick={() => {
      window.location.href = "/admin/notificacoes";
    }}
    className="w-full rounded-xl border border-blue-500 bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Ver todas as notificações →
  </button>
</div>
          </div>
        )}
      </div>
    </div>
  )}

  {children}
  <ChatGlobalWidget />
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