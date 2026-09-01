"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PhanyxConfirmModal from "@/components/ui/PhanyxConfirmModal";
import PhanyxFeriadoAviso from "@/components/ui/PhanyxFeriadoAviso";
import InstallPromptPHANYX from "@/components/pwa/InstallPromptPHANYX";
import PhanyxThemeToggle from "@/components/theme/PhanyxThemeToggle";
import SeletorIdioma from "@/components/internacionalizacao/SeletorIdioma";
import ChatGlobalWidget from "@/components/chat/ChatGlobalWidget";
import { useTranslations } from "next-intl";

type UsuarioLogado = {
  id?: number;
  nome?: string;
  email?: string;
  role?: string;
  instituicaoId?: number | null;
  instituicaoContratanteId?: number | null;
  isMasterAdmin?: boolean;
  ehInstituicaoContratante?: boolean;
  permissaoDelegadaPolos?: boolean;
  podeGerenciarPolos?: boolean;
};

export default function AdminShell({
  children,
  usuarioInicial = null,
  permissoesIniciais = [],
}: {
  children: React.ReactNode;
  usuarioInicial?: UsuarioLogado | null;
  permissoesIniciais?: string[];
}) {
  const tNav = useTranslations("AdminNavigation");
  const tCommon = useTranslations("Common");
  const titulosMenuMobile: Record<string, string> = {
    Acadêmico: tNav("academic"),
    Comercial: tNav("commercial"),
    Financeiro: tNav("financial"),
    RH: tNav("humanResources"),
    Documentos: tNav("documents"),
    Comunicação: tNav("communication"),
    Configurações: tNav("settings"),
  };
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
      return "comercial";
    }

    if (pathname.startsWith("/admin/polos")) {
      return "configuracoes";
    }

    if (pathname.startsWith("/admin/biblioteca")) {
      return "biblioteca";
    }

    if (pathname.startsWith("/admin/comercial")) {
      return "comercial";
    }

    if (pathname.startsWith("/admin/rematriculas-semestrais")) {
      return "academico";
    }

    if (pathname.startsWith("/admin/student-success")) {
      return "academico";
    }

    if (pathname.startsWith("/admin/financeiro")) return "financeiro";
    if (pathname.startsWith("/admin/rh")) return "rh";

    if (pathname.startsWith("/admin/contratos")) return "documentos";
    if (pathname.startsWith("/admin/documentos")) return "documentos";
    if (pathname.startsWith("/admin/crachas")) return "documentos";
    if (pathname.startsWith("/admin/auditoria-validacoes")) return "documentos";
    if (pathname.startsWith("/admin/validacoes")) return "documentos";

    if (pathname.startsWith("/admin/visitantes")) return "acesso";

    if (pathname.startsWith("/admin/reunioes")) return "comunicacao";
    if (pathname.startsWith("/admin/ouvidoria")) return "comunicacao";
    if (pathname.startsWith("/admin/aniversariantes")) return "comunicacao";

    if (pathname.startsWith("/admin/configuracoes")) return "configuracoes";
    if (pathname.startsWith("/admin/integracoes")) return "configuracoes";
    if (pathname.startsWith("/master")) return "master";

    return "academico";
  };

  const [notificacoesAberto, setNotificacoesAberto] = useState(false);

  const [notificacoesAdmin, setNotificacoesAdmin] = useState<any[]>([]);
  const [totalNaoLidas, setTotalNaoLidas] = useState(0);
  const [menuAberto, setMenuAberto] = useState<string | null>(
    descobrirMenuInicial()
  );

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(
    usuarioInicial
  );
  const [permissoes, setPermissoes] = useState<string[]>(
    permissoesIniciais
  );
  const [funcionario, setFuncionario] = useState<{
    nome?: string;
    fotoPerfil?: string | null;
  } | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(
    !usuarioInicial
  );
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
    async function carregarFuncionario() {
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
    }

    async function revalidarSessao() {
      /*
       * A fotografia do funcionário é complementar. Ela começa a carregar
       * junto com a sessão, mas não deve atrasar os menus do painel.
       */
      const promessaFuncionario = carregarFuncionario();

      try {
        const [resUsuario, resPermissoes] = await Promise.all([
          fetch("/api/auth/me", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/admin/permissoes/me", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);

        if (!resUsuario.ok) {
          setUsuario(null);
          setPermissoes([]);
          return;
        }

        const dataUsuario = await resUsuario.json();
        setUsuario(dataUsuario.user ?? null);

        if (resPermissoes.ok) {
          const permissoesData = await resPermissoes.json();
          setPermissoes(
            Array.isArray(permissoesData.permissoes)
              ? permissoesData.permissoes
              : []
          );
        } else if (!usuarioInicial) {
          setPermissoes([]);
        }
      } catch {
        /*
         * Se o layout já entregou uma sessão válida, uma falha transitória
         * de rede não deve fazer o menu desaparecer. Sem dados iniciais,
         * mantemos o comportamento seguro anterior.
         */
        if (!usuarioInicial) {
          setUsuario(null);
          setPermissoes([]);
        }
      } finally {
        setCarregandoUsuario(false);
      }

      await promessaFuncionario;
    }

    revalidarSessao();
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

  const ibePolosInstituicaoId = Number(
    process.env.NEXT_PUBLIC_IBE_INSTITUICAO_ID || 0
  );

  const ehIbePolos =
    !carregandoUsuario &&
    ibePolosInstituicaoId > 0 &&
    Number(usuario?.instituicaoId) === ibePolosInstituicaoId;

  const roleUsuario = String(usuario?.role || "").toUpperCase();

  const usuarioAdmin =
    roleUsuario === "ADMIN" ||
    roleUsuario === "GERENCIA" ||
    roleUsuario === "SUPER_ADMIN" ||
    usuario?.isMasterAdmin === true;

  const podeGerenciarPolos =
    usuarioAdmin &&
    usuario?.podeGerenciarPolos === true;

  const rotaPolosBloqueada =
    !carregandoUsuario &&
    Boolean(usuario) &&
    pathname?.startsWith("/admin/polos") &&
    !podeGerenciarPolos;

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

  const podeVerCentralCaptacao = podeAcessar(
    "comercial.captacao.ver",

    "comercial.captacao.canais.ver",
    "comercial.captacao.canais.gerenciar",

    "comercial.captacao.campanhas.ver",
    "comercial.captacao.campanhas.gerenciar",

    "comercial.captacao.formularios.ver",
    "comercial.captacao.formularios.gerenciar",

    "comercial.captacao.submissoes.ver",
    "comercial.captacao.submissoes.reprocessar",

    "comercial.captacao.distribuicao.ver",
    "comercial.captacao.distribuicao.gerenciar",

    "comercial.captacao.integracoes.ver",
    "comercial.captacao.integracoes.gerenciar",

    "comercial.captacao.auditoria.ver"
  );

  const podeVerVisaoGeralComercial =
    podeAcessar(
      "comercial.ver",
      "comercial.dashboard.ver"
    );

  const podeVerComercialInstituicao =
    podeVerCentralCaptacao ||
    podeAcessar(
      "comercial.ver",
      "comercial.dashboard.ver",
      "comercial.funis.ver",
      "comercial.funis.gerenciar",
      "comercial.leads.ver",
      "comercial.leads.criar",
      "comercial.leads.editar",
      "comercial.leads.excluir",
      "comercial.leads.atribuir",
      "comercial.leads.converter",
      "comercial.leads.ver_todos",
      "comercial.leads.movimentar",
      "comercial.leads.registrar_perda",
      "comercial.leads.transferir",
      "comercial.leads.arquivar",
      "comercial.leads.restaurar",
      "comercial.leads.historico.ver",
      "comercial.tarefas.ver",
      "comercial.tarefas.ver_todas",
      "comercial.tarefas.criar",
      "comercial.tarefas.editar",
      "comercial.tarefas.atribuir",
      "comercial.tarefas.concluir",
      "comercial.tarefas.cancelar",
      "comercial.vendedores.ver",
      "comercial.vendedores.gerenciar",
      "comercial.equipes.ver",
      "comercial.equipes.criar",
      "comercial.equipes.editar",
      "comercial.equipes.excluir",
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
      "comercial.configuracoes.gerenciar",
      "comercial.tarefas.ver",
      "comercial.tarefas.ver_todas",
      "comercial.tarefas.criar",
      "comercial.tarefas.editar",
      "comercial.tarefas.atribuir",
      "comercial.tarefas.concluir",
      "comercial.tarefas.cancelar",
    );

  const podeVerFunisComerciais = podeAcessar(
    "comercial.funis.ver",
    "comercial.funis.gerenciar"
  );

  const podeVerLeadsComerciais = podeAcessar(
    "comercial.leads.ver",
    "comercial.leads.criar",
    "comercial.leads.editar",
    "comercial.leads.atribuir",
    "comercial.leads.converter",
    "comercial.leads.ver_todos",
    "comercial.leads.movimentar",
    "comercial.leads.registrar_perda",
    "comercial.leads.transferir",
    "comercial.leads.arquivar",
    "comercial.leads.restaurar",
    "comercial.leads.historico.ver"
  );

  const podeVerAgendaComercial = podeAcessar(
    "comercial.tarefas.ver",
    "comercial.tarefas.ver_todas",
    "comercial.tarefas.criar",
    "comercial.tarefas.editar",
    "comercial.tarefas.atribuir",
    "comercial.tarefas.concluir",
    "comercial.tarefas.cancelar"
  );

  const podeVerEquipesComerciais = podeAcessar(
    "comercial.equipes.ver"
  );

  const podeVerMetasComerciais = podeAcessar(
    "comercial.metas.ver"
  );

  const podeVerRelatoriosComerciais =
    podeAcessar(
      "comercial.relatorios.ver"
    );

  const podeGerenciarConfiguracoesComerciais =
    podeAcessar(
      "comercial.configuracoes.gerenciar"
    );

    const podeVerAtividadesExternas =
  podeAcessar(
    "atividades-externas.ver",
    "atividades-externas.gerenciar"
  );

  const podeVerPublicacoesAcademicas =
    usuarioAdmin || temPermissao("academico.publicacoes.ver");

  const podeVerAssinaturaPhanyx =
    usuarioAdmin || temPermissao("assinatura.ver");

  const podeVerBiblioteca =
    !carregandoUsuario &&
    (
      usuarioAdmin ||
      permissoes.includes("*") ||
      permissoes.some(
        (chave) =>
          chave === "biblioteca.ver" ||
          chave.startsWith("biblioteca.")
      )
    );

  const podeVerAcervoBiblioteca = podeAcessar(
    "biblioteca.catalogo.ver"
  );

  const podeGerenciarEmailInstitucional =
    podeAcessar("integracoes.email.gerenciar");

  const podeGerenciarWhatsappInstitucional =
    podeAcessar("integracoes.whatsapp.gerenciar");

  function isActive(path: string) {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    if (path === "/admin/biblioteca") {
      return pathname === "/admin/biblioteca";
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
    return `flex items-center gap-2 p-2 rounded text-sm transition ${isActive(path)
      ? "bg-blue-500 text-white font-medium"
      : "text-gray-700 hover:bg-gray-100"
      }`;
  }

  const buttonClass =
    "w-full flex items-center justify-between gap-2 p-2 rounded hover:bg-gray-100 font-semibold text-left";
  const sectionTitleClass =
    "text-xs text-gray-500 font-semibold uppercase tracking-wide";

  const emailsAuditoriaValidacoes = [
    "academicophanyx@gmail.com",
    "ibe.polosj@gmail.com",
  ];

  const emailUsuarioNormalizado = String(usuario?.email || "")
    .trim()
    .toLowerCase();

  const podeVerAuditoriaValidacoes =
    !carregandoUsuario &&
    (
      usuario?.isMasterAdmin === true ||
      roleUsuario === "SUPER_ADMIN" ||
      emailsAuditoriaValidacoes.includes(emailUsuarioNormalizado)
    );

  const emailsComercialPhanyx = ["atendimento@institutobatista.com"];

  const podeVerComercialPhanyx =
    !carregandoUsuario &&
    (
      usuario?.isMasterAdmin === true ||
      usuario?.role === "SUPER_ADMIN"
    );

  useEffect(() => {
    if (!pathname?.startsWith("/admin/leads")) return;

    setMenuAberto(
      podeVerComercialPhanyx
        ? "comercial-phanyx"
        : "comercial"
    );
  }, [pathname, podeVerComercialPhanyx]);

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
                    {tNav("adminPanel")}
                  </span>
                </h2>

                <button
                  type="button"
                  onClick={abrirTourAdmin}
                  className="mt-4 w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  ✨ {tNav("openGuidedTutorial")}
                </button>

                <div className="mt-4">
                  <PhanyxThemeToggle />
                </div>

                <div className="mt-3">
                  <SeletorIdioma />
                </div>

              </div>

              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border bg-slate-200">
                    {funcionario?.fotoPerfil ? (
                      <img
                        src={funcionario.fotoPerfil}
                        alt={funcionario.nome || tNav("employee")}
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
                      {tNav("administrative")}
                    </p>

                    <p className="truncate text-sm font-bold text-slate-800">
                      {funcionario?.nome || usuario?.nome || tNav("administrator")}
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
                  📊 {tNav("dashboard")}
                </Link>
                <Link
                  href="/admin/perfil"
                  className={getLinkClass("/admin/perfil")}
                >
                  👤 {tNav("myProfile")}
                </Link>
                {podeVerAssinaturaPhanyx && (
                  <Link
                    href="/admin/assinatura"
                    className={getLinkClass("/admin/assinatura")}
                  >
                    💳 {tNav("subscription")}
                  </Link>
                )}
                {podeVerPainelMaster && (
                  <div className="border-t pt-2 mt-2">
                    <button
                      type="button"
                      onClick={() => toggleMenu("master")}
                      className={buttonClass}
                    >
                      <span className={sectionTitleClass}>🔥 {tNav("master")} </span>
                      <span>{menuAberto === "master" ? "▾" : "▸"}</span>
                    </button>

                    {menuAberto === "master" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">
                        <Link
                          href="/master"
                          className={getLinkClass("/master")}
                        >
                          🚀 {tNav("masterDashboard")}
                        </Link>

                        <Link
                          href="/master#suporte-usuario"
                          className="flex items-center gap-2 rounded p-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50"
                        >
                          🛠️ {tNav("signInAsUser")}
                        </Link>

                        <Link
                          href="/master/plataforma"
                          className={getLinkClass("/master/plataforma")}
                        >
                          🧠 {tNav("phanyxPlatform")}
                        </Link>

                        <Link
                          href="/master/boletos-ibe"
                          className={getLinkClass("/master/boletos-ibe")}
                        >
                          🧾 {tNav("generateIbeInvoice")}
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
                    <span className={sectionTitleClass}>🚪 {tNav("accessControl")} </span>
                    <span>{menuAberto === "acesso" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "acesso" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link
                        href="/admin/visitantes"
                        className={getLinkClass("/admin/visitantes")}
                      >
                        🪪 {tNav("visitors")}
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
                        💼 {tNav("commercialPhanyx")}
                      </span>
                      <span>
                        {menuAberto === "comercial-phanyx" ? "▾" : "▸"}
                      </span>
                    </button>

                    {menuAberto === "comercial-phanyx" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">
                        <Link
                          href="/admin/leads"
                          className={getLinkClass("/admin/leads")}
                        >
                          📈 {tNav("phanyxLeads")}
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
                        📈 {tNav("commercial")}
                      </span>

                      <span>
                        {menuAberto === "comercial" ? "▾" : "▸"}
                      </span>
                    </button>

                    {menuAberto === "comercial" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">
                        {podeVerVisaoGeralComercial && (
                          <Link
                            href="/admin/comercial"
                            className={getLinkClass(
                              "/admin/comercial"
                            )}
                          >
                            📊 {tNav("overview")}
                          </Link>
                        )}

                        {podeVerCentralCaptacao && (
                          <Link
                            href="/admin/comercial/captacao"
                            className={getLinkClass(
                              "/admin/comercial/captacao"
                            )}
                          >
                            🎯 {tNav("leadGenerationCenter")}
                          </Link>
                        )}

                        {podeVerFunisComerciais && (
                          <Link
                            href="/admin/comercial/funis"
                            className={getLinkClass(
                              "/admin/comercial/funis"
                            )}
                          >
                            🧭 {tNav("salesFunnels")}
                          </Link>
                        )}

                        {podeVerLeadsComerciais && (
                          <Link
                            href="/admin/comercial/pipeline"
                            className={getLinkClass(
                              "/admin/comercial/pipeline"
                            )}
                          >
                            🗂️ {tNav("salesPipeline")}
                          </Link>
                        )}

                        {podeVerAgendaComercial && (
                          <Link
                            href="/admin/comercial/agenda"
                            className={getLinkClass("/admin/comercial/agenda")}
                          >
                            📅 {tNav("salesAgenda")}
                          </Link>
                        )}

                        {podeVerLeadsComerciais && (
                          <Link
                            href="/admin/leads"
                            className={getLinkClass("/admin/leads")}
                          >
                            🎯 {tNav("leadsAndOpportunities")}
                          </Link>
                        )}

                        {podeVerEquipesComerciais && (
                          <Link
                            href="/admin/comercial/equipes"
                            className={getLinkClass(
                              "/admin/comercial/equipes"
                            )}
                          >
                            👥 {tNav("salesTeams")}
                          </Link>
                        )}

                        {podeVerMetasComerciais && (
                          <Link
                            href="/admin/comercial/metas"
                            className={getLinkClass(
                              "/admin/comercial/metas"
                            )}
                          >
                            📈 {tNav("salesTargets")}
                          </Link>
                        )}

                        {podeVerRelatoriosComerciais && (
                          <Link
                            href="/admin/comercial/relatorios"
                            className={getLinkClass(
                              "/admin/comercial/relatorios"
                            )}
                          >
                            📈 {tNav("reports")}
                          </Link>
                        )}

                        {podeGerenciarConfiguracoesComerciais && (
                          <Link
                            href="/admin/comercial/configuracoes"
                            className={getLinkClass(
                              "/admin/comercial/configuracoes"
                            )}
                          >
                            ⚙️ {tNav("commissionPlans")}
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
                    <span className={sectionTitleClass}>
                      🎓 {tNav("academic")}
                    </span>
                    <span>{menuAberto === "academico" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "academico" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link
                        href="/admin/alunos"
                        className={getLinkClass("/admin/alunos")}
                        data-tour="menu-alunos"
                      >
                        👨‍🎓 {tNav("students")}
                      </Link>

                      <Link
                        href="/admin/student-success"
                        className={getLinkClass(
                          "/admin/student-success"
                        )}
                      >
                        🧠 {tNav("studentSuccess")}
                      </Link>

                      <Link
                        href="/admin/professores"
                        className={getLinkClass("/admin/professores")}
                        data-tour="menu-professores"
                      >
                        👨‍🏫 {tNav("teachers")}
                      </Link>

                      <Link
                        href="/admin/substituicoes-docentes"
                        className={getLinkClass("/admin/substituicoes-docentes")}
                      >
                        🔁 {tNav("teacherSubstitutions")}
                      </Link>

                      <Link
                        href="/admin/funcionarios"
                        className={getLinkClass("/admin/funcionarios")}
                      >
                        🧑‍💼 {tNav("employees")}
                      </Link>

                      <Link
                        href="/admin/departamentos"
                        className={getLinkClass("/admin/departamentos")}
                        data-tour="menu-departamentos"
                      >
                        🏢 {tNav("departments")}
                      </Link>

                      <Link
                        href="/admin/disciplinas"
                        className={getLinkClass("/admin/disciplinas")}
                      >
                        📚 {tNav("subjects")}
                      </Link>

                      <Link
                        href="/admin/matriculas"
                        className={getLinkClass("/admin/matriculas")}
                        data-tour="menu-matriculas"
                      >
                        📝 {tNav("enrollments")}
                      </Link>

                      {podeGerenciarRematriculasSemestrais && (
                        <Link
                          href="/admin/rematriculas-semestrais"
                          className={getLinkClass(
                            "/admin/rematriculas-semestrais"
                          )}
                        >
                          🔄 {tNav("semesterReenrollments")}
                        </Link>
                      )}

                      <Link
                        href="/admin/turmas"
                        className={getLinkClass("/admin/turmas")}
                      >
                        🏫 {tNav("classes")}
                      </Link>

                      <Link
                        href="/admin/agenda-operacional"
                        className={getLinkClass("/admin/agenda-operacional")}
                      >
                        🗓️ {tNav("operationalSchedule")}
                      </Link>

                      {podeVerAtividadesExternas && (
  <Link
    href="/admin/atividades-externas"
    className={getLinkClass("/admin/atividades-externas")}
  >
    🚌 {tNav("externalActivities")}
  </Link>
)}

                      {podeVerPublicacoesAcademicas && (
                        <Link
                          href="/admin/academico/publicacoes"
                          className={getLinkClass("/admin/academico/publicacoes")}
                        >
                          📤 {tNav("academicPublications")}
                        </Link>
                      )}

                    </div>
                  )}
                </div>

                {podeVerBiblioteca && (
                  <div className="mt-2 border-t pt-2">
                    <button
                      type="button"
                      onClick={() => toggleMenu("biblioteca")}
                      className={buttonClass}
                    >
                      <span className={sectionTitleClass}>
                        📚 {tNav("virtualLibrary")}
                      </span>

                      <span>
                        {menuAberto === "biblioteca" ? "▾" : "▸"}
                      </span>
                    </button>

                    {menuAberto === "biblioteca" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">
                        <Link
                          href="/admin/biblioteca"
                          className={getLinkClass("/admin/biblioteca")}
                        >
                          📊 {tNav("overview")}
                        </Link>

                        {podeVerAcervoBiblioteca && (
                          <Link
                            href="/admin/biblioteca/acervo"
                            className={getLinkClass(
                              "/admin/biblioteca/acervo"
                            )}
                          >
                            📚 {tNav("collection")}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-2 mt-2">
                  <button
                    type="button"
                    onClick={() => toggleMenu("financeiro")}
                    className={buttonClass}
                  >
                    <span className={sectionTitleClass}>💰 {tNav("financial")}</span>
                    <span>{menuAberto === "financeiro" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "financeiro" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      {temPermissao("financeiro.ver") && (
                        <Link href="/admin/financeiro" className={getLinkClass("/admin/financeiro")}>
                          💰 {tNav("overview")}
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

                      {ehIbePolos && (
                        <Link
                          href="/admin/financeiro/boletos-ibe"
                          className={getLinkClass(
                            "/admin/financeiro/boletos-ibe"
                          )}
                        >
                          🧾 Gerar boleto para interessado
                        </Link>
                      )}

                      {temPermissao("financeiro.configuracoes") && (
                        <Link
                          href="/admin/financeiro/configuracoes"
                          className={getLinkClass("/admin/financeiro/configuracoes")}
                        >
                          ⚙️ {tNav("settings")}
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
                      <span className={sectionTitleClass}>👥 {tNav("humanResources")}</span>
                      <span>{menuAberto === "rh" ? "▾" : "▸"}</span>
                    </button>

                    {menuAberto === "rh" && (
                      <div className="ml-3 mt-2 flex flex-col space-y-1">

                        <Link href="/admin/rh" className={getLinkClass("/admin/rh")}>
                          👥 {tNav("overview")}
                        </Link>

                        <Link
                          href="/admin/funcionarios"
                          className={getLinkClass("/admin/funcionarios")}
                        >
                          👤 {tNav("employees")}
                        </Link>

                        {podeVerProfessoresRH && (
                          <Link
                            href="/admin/rh/professores"
                            className={getLinkClass(
                              "/admin/rh/professores"
                            )}
                          >
                            👨‍🏫 {tNav("teachers")}
                          </Link>
                        )}

                        <Link
                          href="/admin/departamentos"
                          className={getLinkClass("/admin/departamentos")}
                        >
                          🏢 {tNav("departments")}
                        </Link>

                        {podeVerRemuneracaoVariavelRH && (
                          <Link
                            href="/admin/rh/remuneracao-variavel"
                            className={getLinkClass(
                              "/admin/rh/remuneracao-variavel"
                            )}
                          >
                            🏢 {tNav("departments")}
                          </Link>
                        )}

                        {podeVerComissoesRH && (
                          <Link
                            href="/admin/rh/comissoes"
                            className={getLinkClass(
                              "/admin/rh/comissoes"
                            )}
                          >
                            💵 {tNav("salesCommissions")}
                          </Link>
                        )}

                        <Link
                          href="/admin/rh/ponto"
                          className={getLinkClass("/admin/rh/ponto")}
                        >
                          ⏱️ {tNav("timeTracking")}
                        </Link>



                        <Link
                          href="/admin/rh/ponto/configuracoes"
                          className={getLinkClass("/admin/rh/ponto/configuracoes")}
                        >
                          ⚙️ {tNav("timeTrackingSettings")}
                        </Link>

                        {podeVerPontoMobile && (
                          <Link
                            href="/admin/rh/ponto/mobile"
                            className={getLinkClass("/admin/rh/ponto/mobile")}
                          >
                            📱 {tNav("mobileTimeTracking")}
                          </Link>
                        )}

                        <Link
                          href="/admin/rh/ponto/importacao-afd"
                          className={getLinkClass("/admin/rh/ponto/importacao-afd")}
                        >
                          📥 {tNav("afdImport")}
                        </Link>

                        <Link
                          href="/admin/rh/banco-horas"
                          className={getLinkClass("/admin/rh/banco-horas")}
                        >
                          📊 {tNav("timeBank")}
                        </Link>

                        <Link
                          href="/admin/rh/holerites"
                          className={getLinkClass("/admin/rh/holerites")}
                        >
                          💵 {tNav("payslips")}
                        </Link>

                        <Link
                          href="/admin/rh/eventos-folha"
                          className={getLinkClass("/admin/rh/eventos-folha")}
                        >
                          🧾 {tNav("payrollEvents")}
                        </Link>

                        <Link
                          href="/admin/rh/beneficios"
                          className={getLinkClass("/admin/rh/beneficios")}
                        >
                          🎁 {tNav("benefits")}
                        </Link>

                        <Link
                          href="/admin/rh/ferias"
                          className={getLinkClass("/admin/rh/ferias")}
                        >
                          🏖️ {tNav("vacation")}
                        </Link>

                        <Link
                          href="/admin/rh/exames"
                          className={getLinkClass("/admin/rh/exames")}
                        >
                          🩺 {tNav("medicalExams")}
                        </Link>

                        <Link
                          href="/admin/rh/rescisoes"
                          className={getLinkClass("/admin/rh/rescisoes")}
                        >
                          🚪 {tNav("terminations")}
                        </Link>

                        <Link
                          href="/admin/rh/historico"
                          className={getLinkClass("/admin/rh/historico")}
                        >
                          🕒 {tNav("employmentHistory")}
                        </Link>

                        <Link
                          href="/admin/rh/arquivados"
                          className={getLinkClass("/admin/rh/arquivados")}
                        >
                          🗄️ {tNav("archivedHR")}
                        </Link>

                        <Link
                          href="/admin/rh/ocorrencias"
                          className={getLinkClass("/admin/rh/ocorrencias")}
                        >
                          ⚠️ {tNav("occurrences")}
                        </Link>

                        <Link
                          href="/admin/rh/contabilidade"
                          className={getLinkClass("/admin/rh/contabilidade")}
                        >
                          📊 {tNav("accountingReports")}
                        </Link>

                        <Link
                          href="/admin/rh/documentos"
                          className={getLinkClass("/admin/rh/documentos")}
                        >
                          📄 {tNav("hrDocuments")}
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
                    <span className={sectionTitleClass}>📄 {tNav("documents")}</span>
                    <span>{menuAberto === "documentos" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "documentos" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link
                        href="/admin/contratos"
                        className={getLinkClass("/admin/contratos")}
                      >
                        📄 {tNav("contracts")}
                      </Link>

                      <Link
                        href="/admin/documentos/gerados"
                        className={getLinkClass("/admin/documentos/gerados")}
                      >
                        📚 {tNav("generatedDocuments")}
                      </Link>

                      <Link
                        href="/admin/documentos/gerar"
                        className={getLinkClass("/admin/documentos/gerar")}
                      >
                        ⚡ {tNav("generateDocument")}
                      </Link>

                      <Link
                        href="/admin/validacoes"
                        className={getLinkClass("/admin/validacoes")}
                      >
                        🔐 {tNav("validation")}
                      </Link>

                      {podeVerAuditoriaValidacoes && (
                        <Link
                          href="/admin/auditoria-validacoes"
                          className={getLinkClass("/admin/auditoria-validacoes")}
                        >
                          🛡️ {tNav("validationAudit")}
                        </Link>
                      )}

                      <Link
                        href="/admin/crachas"
                        className={getLinkClass("/admin/crachas")}
                      >
                        🪪 {tNav("badges")}
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
                    <span className={sectionTitleClass}>💬 {tNav("communication")}</span>
                    <span>{menuAberto === "comunicacao" ? "▾" : "▸"}</span>
                  </button>

                  {menuAberto === "comunicacao" && (
                    <div className="ml-3 mt-2 flex flex-col space-y-1">
                      <Link
                        href="/admin/reunioes"
                        className={getLinkClass("/admin/reunioes")}
                      >
                        📅 {tNav("meetings")}
                      </Link>

                      <Link
                        href="/admin/aniversariantes"
                        className={getLinkClass("/admin/aniversariantes")}
                      >
                        🎂 {tNav("birthdays")}
                      </Link>

                      <Link
                        href="/admin/ouvidoria"
                        className={getLinkClass("/admin/ouvidoria")}
                      >
                        🧠 {tNav("ombudsman")}
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
                    <span className={sectionTitleClass}>⚙️ {tNav("settings")}</span>
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
                        ⚙️ {tNav("institution")}
                      </Link>

                      <Link
                        href="/admin/configuracoes/logos"
                        className={getLinkClass(
                          "/admin/configuracoes/logos"
                        )}
                      >
                        🖼️ {tNav("institutionalLogos")}
                      </Link>

                      {podeGerenciarEmailInstitucional && (
                        <Link
                          href="/admin/integracoes/email"
                          className={getLinkClass(
                            "/admin/integracoes/email"
                          )}
                        >
                          📧 {tNav("institutionalEmail")}
                        </Link>
                      )}

                      {podeGerenciarWhatsappInstitucional && (
                        <Link
                          href="/admin/integracoes/whatsapp"
                          className={getLinkClass("/admin/integracoes/whatsapp")}
                        >
                          💬 {tNav("institutionalWhatsapp")}
                        </Link>
                      )}

                      {podeGerenciarPolos && (
                        <Link
                          href="/admin/polos"
                          className={getLinkClass("/admin/polos")}
                        >
                          🏢 {tNav("campusesAndUnits")}
                        </Link>
                      )}

                      <Link
                        href="/admin/departamentos"
                        className={getLinkClass("/admin/departamentos")}
                      >
                        🔐 {tNav("departmentPermissions")}
                      </Link>

                      <Link
                        href="/admin/configuracoes/documentos"
                        className={getLinkClass("/admin/configuracoes/documentos")}
                      >
                        📄 {tNav("institutionalDocuments")}
                      </Link>

                      <Link
                        href="/admin/configuracoes/portais"
                        className={getLinkClass("/admin/configuracoes/portais")}
                      >
                        👁️ {tNav("portalVisibility")}
                      </Link>

                      <Link
                        href="/admin/certificados"
                        className={getLinkClass("/admin/certificados")}
                      >
                        🏅 {tNav("certificateManagement")}
                      </Link>
                      <Link
                        href="/admin/configuracoes/certificado"
                        className={getLinkClass(
                          "/admin/configuracoes/certificado"
                        )}
                      >
                        🎨 {tNav("certificateEditor")}
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
                  {tNav("logout")}
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
                    {titulosMenuMobile[menuMobileAberto] ?? menuMobileAberto}
                  </p>

                  <button
                    type="button"
                    onClick={() => setMenuMobileAberto(null)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
                  >
                    {tCommon("close")}
                  </button>
                </div>

                {menuMobileAberto === "Acadêmico" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin/alunos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🎓 {tNav("students")}
                    </Link>
                    <Link
                      href="/admin/student-success"
                      className="
    rounded-2xl
    border
    p-3
    text-sm
    font-semibold
    text-slate-700
  "
                    >
                      🧠 {tNav("studentSuccess")}
                    </Link>
                    <Link href="/admin/professores" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      👩‍🏫 {tNav("teachers")}
                    </Link>
                    <Link
                      href="/admin/substituicoes-docentes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      🔄 {tNav("teacherSubstitutions")}
                    </Link>
                    <Link href="/admin/funcionarios" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🧑‍💼 {tNav("employees")}
                    </Link>
                    <Link
                      href="/admin/visitantes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      🪪 {tNav("visitors")}
                    </Link>
                    <Link href="/admin/departamentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🏢 {tNav("departments")}
                    </Link>
                    <Link href="/admin/disciplinas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📚 {tNav("subjects")}
                    </Link>
                    <Link href="/admin/matriculas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📝 {tNav("enrollments")}
                    </Link>
                    {podeGerenciarRematriculasSemestrais && (
                      <Link
                        href="/admin/rematriculas-semestrais"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        🔄 {tNav("semesterReenrollments")}
                      </Link>
                    )}
                    <Link href="/admin/turmas" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🏫 {tNav("classes")}
                    </Link>
                    <Link
                      href="/admin/agenda-operacional"
                      className={getLinkClass("/admin/agenda-operacional")}
                    >
                      🗓️ {tNav("operationalSchedule")}
                    </Link>
                    {podeVerAtividadesExternas && (
  <Link
    href="/admin/atividades-externas"
    className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
  >
    🚌 {tNav("externalActivities")}
  </Link>
)}
                    {podeVerPublicacoesAcademicas && (
                      <Link
                        href="/admin/academico/publicacoes"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        📚 {tNav("academicPublications")}
                      </Link>
                    )}
                    {podeVerBiblioteca && (
                      <Link
                        href="/admin/biblioteca"
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        📚 {tNav("virtualLibrary")}
                      </Link>
                    )}
                  </div>
                )}

                {menuMobileAberto === "Comercial" &&
                  podeVerComercialInstituicao && (
                    <div className="grid grid-cols-2 gap-2">
                      {podeVerVisaoGeralComercial && (
                        <Link
                          href="/admin/comercial"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          📊 {tNav("overview")}
                        </Link>
                      )}

                      {podeVerCentralCaptacao && (
                        <Link
                          href="/admin/comercial/captacao"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          🎯 {tNav("leadGenerationCenter")}
                        </Link>
                      )}

                      {podeVerFunisComerciais && (
                        <Link
                          href="/admin/comercial/funis"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          🧭 {tNav("salesFunnels")}
                        </Link>
                      )}

                      {podeVerLeadsComerciais && (
                        <Link
                          href="/admin/comercial/pipeline"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          🗂️ {tNav("salesPipeline")}
                        </Link>
                      )}

                      {podeVerAgendaComercial && (
                        <Link
                          href="/admin/comercial/agenda"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          📅 {tNav("salesAgenda")}
                        </Link>
                      )}

                      {podeVerLeadsComerciais && (
                        <Link
                          href="/admin/leads"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          🎯 {tNav("leadsAndOpportunities")}
                        </Link>
                      )}

                      {podeVerEquipesComerciais && (
                        <Link
                          href="/admin/comercial/equipes"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          👥 {tNav("salesTeams")}
                        </Link>
                      )}

                      {podeVerMetasComerciais && (
                        <Link
                          href="/admin/comercial/metas"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          📈 {tNav("salesTargets")}
                        </Link>
                      )}

                      {podeVerRelatoriosComerciais && (
                        <Link
                          href="/admin/comercial/relatorios"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          📈 {tNav("reports")}
                        </Link>
                      )}

                      {podeGerenciarConfiguracoesComerciais && (
                        <Link
                          href="/admin/comercial/configuracoes"
                          className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                        >
                          ⚙️ {tNav("commissionPlans")}
                        </Link>
                      )}
                    </div>
                  )}

                {menuMobileAberto === "Financeiro" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin/financeiro" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      💰 {tNav("overview")}
                    </Link>
                    <Link href="/admin/financeiro/recebimentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      💵 {tNav("receipts")}
                    </Link>
                    <Link href="/admin/financeiro/caixa" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🏦 {tNav("cashRegister")}
                    </Link>
                    <Link href="/admin/financeiro/relatorios" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📊 {tNav("reports")}
                    </Link>
                    <Link href="/admin/financeiro/inadimplentes" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🚨 {tNav("overdueAccounts")}
                    </Link>
                    <Link href="/admin/financeiro/fechamento-geral" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📦 {tNav("generalClosing")}
                    </Link>
                    {ehIbePolos && (
                      <Link
                        href="/admin/financeiro/boletos-ibe"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        🧾 {tNav("generateInvoiceForProspect")}
                      </Link>
                    )}
                    <Link
                      href="/admin/financeiro/configuracoes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      ⚙️ {tNav("settings")}
                    </Link>
                  </div>
                )}

                {menuMobileAberto === "RH" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/admin/rh"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      👥 {tNav("overview")}
                    </Link>

                    <Link
                      href="/admin/funcionarios"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      👤 {tNav("employees")}
                    </Link>

                    {podeVerProfessoresRH && (
                      <Link
                        href="/admin/rh/professores"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        👨‍🏫 {tNav("teachers")}
                      </Link>
                    )}

                    {podeVerRemuneracaoVariavelRH && (
                      <Link
                        href="/admin/rh/remuneracao-variavel"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        💰 {tNav("variableCompensation")}
                      </Link>
                    )}

                    {podeVerComissoesRH && (
                      <Link
                        href="/admin/rh/comissoes"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        💵 {tNav("salesCommissions")}
                      </Link>
                    )}

                    <Link
                      href="/admin/rh/ponto"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      ⏱️ {tNav("timeTracking")}
                    </Link>

                    <Link
                      href="/admin/rh/ponto/configuracoes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      ⚙️ {tNav("timeTrackingSettings")}
                    </Link>

                    {podeVerPontoMobile && (
                      <Link
                        href="/admin/rh/ponto/mobile"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        📱 {tNav("mobileTimeTracking")}
                      </Link>
                    )}

                    <Link
                      href="/admin/rh/ponto/importacao-afd"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      📥 {tNav("afdImport")}
                    </Link>

                    <Link
                      href="/admin/rh/banco-horas"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      📊 {tNav("timeBank")}
                    </Link>

                    <Link
                      href="/admin/rh/holerites"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      💵 {tNav("payslips")}
                    </Link>
                  </div>
                )}

                {menuMobileAberto === "Comunicação" && (
                  <div className="grid grid-cols-1 gap-2">
                    <Link
                      href="/admin/reunioes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      📅 {tNav("meetings")}
                    </Link>

                    <Link
                      href="/admin/aniversariantes"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      🎂 {tNav("birthdays")}
                    </Link>

                    <Link
                      href="/admin/ouvidoria"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      🧠 {tNav("ombudsman")}
                    </Link>
                  </div>
                )}

                {menuMobileAberto === "Documentos" && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/admin/contratos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📄 {tNav("contracts")}
                    </Link>
                    <Link href="/admin/documentos/gerados" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📚 {tNav("generatedDocuments")}
                    </Link>
                    <Link href="/admin/documentos/gerar" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      ⚡ {tNav("generateDocument")}
                    </Link>
                    <Link href="/admin/validacoes" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🔐 {tNav("validation")}
                    </Link>
                    {podeVerAuditoriaValidacoes && (
                      <Link
                        href="/admin/auditoria-validacoes"
                        className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                      >
                        🛡️ {tNav("validationAudit")}
                      </Link>
                    )}
                    <Link
                      href="/admin/crachas"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      🪪 {tNav("badges")}
                    </Link>
                  </div>
                )}

                {menuMobileAberto === "Configurações" && (
                  <div className="grid grid-cols-1 gap-2">
                    <Link href="/admin/configuracoes/instituicao" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      ⚙️ {tNav("institution")}
                    </Link>
                    <Link
                      href="/admin/configuracoes/logos"
                      className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      🖼️ {tNav("institutionalLogos")}
                    </Link>
                    {podeGerenciarEmailInstitucional && (
                      <Link
                        href="/admin/integracoes/email"
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        📧 {tNav("institutionalEmail")}
                      </Link>
                    )}
                    {podeGerenciarWhatsappInstitucional && (
                      <Link
                        href="/admin/integracoes/whatsapp"
                        className={getLinkClass("/admin/integracoes/whatsapp")}
                      >
                        💬 {tNav("institutionalWhatsapp")}
                      </Link>
                    )}
                    {podeGerenciarPolos && (
                      <Link
                        href="/admin/polos"
                        className="rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        🏢 {tNav("campusesAndUnits")}
                      </Link>
                    )}
                    <Link
                      href="/admin/assinatura"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      💳 {tNav("subscription")}
                    </Link>
                    <Link href="/admin/configuracoes/documentos" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      📄 {tNav("institutionalDocuments")}
                    </Link>
                    <Link
                      href="/admin/configuracoes/portais"
                      className="rounded-2xl border p-3 text-sm font-semibold text-slate-700"
                    >
                      👁️ {tNav("portalVisibility")}
                    </Link>
                    <Link href="/admin/certificados" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🏅 {tNav("certificateManagement")}
                    </Link>
                    <Link href="/admin/configuracoes/certificado" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🎨 {tNav("certificateEditor")}
                    </Link>
                    <Link href="/admin/ouvidoria" className="rounded-2xl border p-3 text-sm font-semibold text-slate-700">
                      🧠 {tNav("ombudsman")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="fixed right-3 top-20 z-[80] flex w-60 flex-col gap-2 lg:hidden">
              <PhanyxThemeToggle />
              <SeletorIdioma exibirRotulo={false} />
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
                  {tNav("dashboardShort")}
                </Link>

                <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Acadêmico" ? null : "Acadêmico")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                  <span className="text-lg">🎓</span>
                  {tNav("academicShort")}
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
                    {tNav("commercialShort")}
                  </button>
                )}

                <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Financeiro" ? null : "Financeiro")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                  <span className="text-lg">💰</span>
                  {tNav("financialShort")}
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
                  {tNav("hrShort")}
                </button>

                <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Documentos" ? null : "Documentos")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                  <span className="text-lg">📄</span>
                  {tNav("documentsShort")}
                </button>

                <button type="button" onClick={() => setMenuMobileAberto(menuMobileAberto === "Configurações" ? null : "Configurações")} className="flex flex-col items-center justify-center rounded-xl px-1 py-2 hover:bg-blue-50 hover:text-blue-700">
                  <span className="text-lg">⚙️</span>
                  {tNav("settingsShort")}
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
                  {tNav("communicationShort")}
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
                        {tNav("notifications")}
                      </p>

                      <p className="text-xs text-slate-400">
                        {tNav("notificationsDescription")}
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
                        {tNav("viewAllNotifications")} →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {rotaPolosBloqueada ? (
            <div className="mx-auto max-w-3xl rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm dark:border-amber-800 dark:bg-amber-950/30">
              <h1 className="text-xl font-bold text-amber-950 dark:text-amber-100">
                {tNav("campusManagementDisabled")}
              </h1>

              <p className="mt-3 text-sm leading-6 text-amber-900 dark:text-amber-200">
                {tNav("campusManagementDisabledDescription")}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.replace("/admin")
                }
                className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {tNav("backToDashboard")}
              </button>
            </div>
          ) : (
            children
          )}

          <ChatGlobalWidget />
        </main>

        <PhanyxConfirmModal
          aberto={sessaoExpirada}
          titulo={tCommon("sessionExpired")}
          mensagem={tCommon("sessionExpiredDescription")}
          textoConfirmar={tCommon("goToLogin")}
          textoCancelar={tCommon("close")}
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
