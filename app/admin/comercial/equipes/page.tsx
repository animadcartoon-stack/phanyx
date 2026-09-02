"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Tema = "light" | "dark" | "system";
type ModoTema = "light" | "dark" | "system-dark";

type FuncionarioComercial = {
  id: number;
  nome: string;
  cargo?: string | null;
  setor?: string | null;
  departamento?: {
    id: number;
    nome: string;
  } | null;
};

type MembroEquipe = {
  id: number;
  funcionarioId: number;
  papel: "LIDER" | "MEMBRO";
  ativo: boolean;
  funcionario: FuncionarioComercial;
};

type EquipeComercial = {
  id: number;
  nome: string;
  descricao?: string | null;
  responsavelFuncionarioId?: number | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  responsavelFuncionario?: FuncionarioComercial | null;
  membros: MembroEquipe[];
  _count?: {
    membros?: number;
    metas?: number;
  };
};

type FormEquipe = {
  nome: string;
  descricao: string;
  responsavelFuncionarioId: string;
  membroIds: number[];
  ativo: boolean;
};

type FiltroStatus = "ATIVAS" | "INATIVAS" | "TODAS";

type UsuarioControleAcesso = {
  role?: string | null;
  isMasterAdmin?: boolean;
};

type OpcaoSelectTema = {
  value: string;
  label: string;
};

const FORM_INICIAL: FormEquipe = {
  nome: "",
  descricao: "",
  responsavelFuncionarioId: "",
  membroIds: [],
  ativo: true,
};

function useModoTema(): ModoTema {
  const [modoTema, setModoTema] =
    useState<ModoTema>("light");

  useEffect(() => {
    const media = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    function atualizarTema() {
      const escolha = (
        localStorage.getItem("phanyx_tema") ||
        document.documentElement.dataset.themeChoice ||
        "system"
      ) as Tema;

      if (escolha === "dark") {
        setModoTema("dark");
        return;
      }

      if (escolha === "system" && media.matches) {
        setModoTema("system-dark");
        return;
      }

      setModoTema("light");
    }

    atualizarTema();

    window.addEventListener("storage", atualizarTema);
    window.addEventListener(
      "phanyx-theme-change",
      atualizarTema as EventListener
    );
    media.addEventListener("change", atualizarTema);

    const observador = new MutationObserver(atualizarTema);
    observador.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-theme",
        "data-theme-choice",
        "class",
      ],
    });

    return () => {
      window.removeEventListener("storage", atualizarTema);
      window.removeEventListener(
        "phanyx-theme-change",
        atualizarTema as EventListener
      );
      media.removeEventListener("change", atualizarTema);
      observador.disconnect();
    };
  }, []);

  return modoTema;
}

function SelectTema({
  value,
  options,
  onChange,
  modoTema,
  disabled = false,
}: {
  value: string;
  options: OpcaoSelectTema[];
  onChange: (value: string) => void;
  modoTema: ModoTema;
  disabled?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fecharAoClicarFora(event: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(event.target as Node)
      ) {
        setAberto(false);
      }
    }

    document.addEventListener(
      "mousedown",
      fecharAoClicarFora
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharAoClicarFora
      );
    };
  }, []);

  const selecionada =
    options.find((option) => option.value === value) ??
    options[0];

  const botao =
    modoTema === "dark"
      ? "border-blue-900 bg-blue-950/70 text-blue-50"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-700 text-white"
        : "border-slate-300 bg-white text-slate-900";

  const menu =
    modoTema === "dark"
      ? "border-blue-900 bg-blue-950"
      : modoTema === "system-dark"
        ? "border-neutral-600 bg-neutral-700"
        : "border-slate-300 bg-white";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setAberto((atual) => !atual)}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 text-left text-sm font-semibold outline-none transition disabled:cursor-not-allowed disabled:opacity-60 ${botao}`}
      >
        <span className="truncate">
          {selecionada?.label}
        </span>
        <span aria-hidden="true" className="text-xs">
          {aberto ? "▲" : "▼"}
        </span>
      </button>

      {aberto && !disabled && (
        <div
          className={`absolute left-0 right-0 top-full z-[160] mt-1 max-h-72 overflow-y-auto rounded-2xl border p-1 shadow-2xl ${menu}`}
        >
          {options.map((option) => {
            const ativa = option.value === value;

            const item =
              modoTema === "dark"
                ? ativa
                  ? "bg-blue-800 text-white"
                  : "text-blue-50 hover:bg-blue-900"
                : modoTema === "system-dark"
                  ? ativa
                    ? "bg-neutral-500 text-white"
                    : "text-neutral-100 hover:bg-neutral-600"
                  : ativa
                    ? "bg-slate-200 text-slate-950"
                    : "text-slate-900 hover:bg-slate-100";

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setAberto(false);
                }}
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm ${item}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function iniciais(nome: string) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) {
    return "EC";
  }

  if (partes.length === 1) {
    return partes[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${partes[0][0]}${
    partes[partes.length - 1][0]
  }`.toUpperCase();
}

export default function EquipesComerciaisPage() {
  const t = useTranslations("AdminCommercialTeams");
  const locale = useLocale();
  const modoTema = useModoTema();

  const [equipes, setEquipes] =
    useState<EquipeComercial[]>([]);

  const [funcionarios, setFuncionarios] =
    useState<FuncionarioComercial[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [
    carregandoFuncionarios,
    setCarregandoFuncionarios,
  ] = useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [
    carregandoPermissoes,
    setCarregandoPermissoes,
  ] = useState(true);

  const [permissoes, setPermissoes] =
    useState<string[]>([]);

  const [usuarioAtual, setUsuarioAtual] =
    useState<UsuarioControleAcesso | null>(
      null
    );

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [
    buscaFuncionarios,
    setBuscaFuncionarios,
  ] = useState("");

  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>("ATIVAS");

  const [modalAberto, setModalAberto] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [
    equipeParaDesativar,
    setEquipeParaDesativar,
  ] = useState<EquipeComercial | null>(
    null
  );

  const [form, setForm] =
    useState<FormEquipe>(FORM_INICIAL);

  const c = useMemo(() => {
    if (modoTema === "dark") {
      return {
        pagina: "text-blue-50",
        card: "border-blue-900 bg-blue-950/55",
        soft: "border-blue-900 bg-blue-950/35",
        input:
          "border-blue-900 bg-blue-950/70 text-blue-50 placeholder:text-blue-200/50",
        titulo: "text-white",
        texto: "text-blue-100/80",
        muted: "text-blue-200/60",
        kicker: "text-blue-300",
        secondary:
          "border-blue-800 bg-blue-950/50 text-blue-100 hover:bg-blue-900",
        modalFooter:
          "border-blue-900 bg-blue-950/55",
        selected:
          "border-blue-600 bg-blue-950/60",
      };
    }

    if (modoTema === "system-dark") {
      return {
        pagina: "text-neutral-100",
        card: "border-neutral-700 bg-neutral-900",
        soft: "border-neutral-700 bg-neutral-800/70",
        input:
          "border-neutral-600 bg-neutral-700 text-white placeholder:text-neutral-400",
        titulo: "text-white",
        texto: "text-neutral-300",
        muted: "text-neutral-400",
        kicker: "text-neutral-300",
        secondary:
          "border-neutral-600 bg-neutral-800 text-neutral-100 hover:bg-neutral-700",
        modalFooter:
          "border-neutral-700 bg-neutral-900",
        selected:
          "border-neutral-500 bg-neutral-700",
      };
    }

    return {
      pagina: "text-slate-900",
      card: "border-slate-200 bg-white",
      soft: "border-slate-200 bg-slate-50",
      input:
        "border-slate-300 bg-white text-slate-950 placeholder:text-slate-500",
      titulo: "text-slate-950",
      texto: "text-slate-600",
      muted: "text-slate-500",
      kicker: "text-blue-700",
      secondary:
        "border-slate-300 bg-white text-slate-800 hover:bg-slate-100",
      modalFooter:
        "border-slate-200 bg-slate-50",
      selected:
        "border-emerald-500 bg-emerald-50",
    };
  }, [modoTema]);

  function nomeDepartamento(
    funcionario?: FuncionarioComercial | null
  ) {
    return (
      funcionario?.departamento?.nome ||
      funcionario?.setor ||
      t("common.noDepartment")
    );
  }

  const roleUsuario = String(
    usuarioAtual?.role || ""
  ).toUpperCase();

  const usuarioAdmin =
    roleUsuario === "ADMIN" ||
    roleUsuario === "GERENCIA" ||
    roleUsuario === "SUPER_ADMIN" ||
    usuarioAtual?.isMasterAdmin === true;

  function possuiPermissao(chave: string) {
    return (
      usuarioAdmin ||
      permissoes.includes("*") ||
      permissoes.includes(chave)
    );
  }

  const podeCriarEquipe =
    possuiPermissao(
      "comercial.equipes.criar"
    );

  const podeEditarEquipe =
    possuiPermissao(
      "comercial.equipes.editar"
    );

  const podeExcluirEquipe =
    possuiPermissao(
      "comercial.equipes.excluir"
    );

  async function carregarControleAcesso() {
    let usuarioRecebido:
      | UsuarioControleAcesso
      | null = null;

    let permissoesRecebidas: string[] = [];

    try {
      const [
        respostaUsuario,
        respostaPermissoes,
      ] = await Promise.all([
        fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(
          "/api/admin/permissoes/me",
          {
            cache: "no-store",
            credentials: "include",
          }
        ),
      ]);

      if (respostaUsuario.ok) {
        const dadosUsuario =
          await respostaUsuario
            .json()
            .catch(() => null);

        usuarioRecebido =
          dadosUsuario?.user || null;
      }

      if (respostaPermissoes.ok) {
        const dadosPermissoes =
          await respostaPermissoes
            .json()
            .catch(() => null);

        permissoesRecebidas =
          Array.isArray(
            dadosPermissoes?.permissoes
          )
            ? dadosPermissoes.permissoes
            : [];
      }

      setUsuarioAtual(usuarioRecebido);
      setPermissoes(permissoesRecebidas);

      const role = String(
        usuarioRecebido?.role || ""
      ).toUpperCase();

      const ehAdmin =
        role === "ADMIN" ||
        role === "GERENCIA" ||
        role === "SUPER_ADMIN" ||
        usuarioRecebido?.isMasterAdmin ===
          true;

      const possuiAcessoFormulario =
        ehAdmin ||
        permissoesRecebidas.includes("*") ||
        permissoesRecebidas.includes(
          "comercial.equipes.criar"
        ) ||
        permissoesRecebidas.includes(
          "comercial.equipes.editar"
        );

      return {
        possuiAcessoFormulario,
      };
    } finally {
      setCarregandoPermissoes(false);
    }
  }

  async function carregarEquipes() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch(
        "/api/admin/comercial/equipes",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("errors.loadTeams")
        );
      }

      setEquipes(
        Array.isArray(data?.equipes)
          ? data.equipes
          : []
      );
    } catch (error: unknown) {
      setEquipes([]);
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.loadTeams")
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarFuncionarios() {
    try {
      setCarregandoFuncionarios(true);

      const res = await fetch(
        "/api/admin/comercial/responsaveis-leads",
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("errors.loadEmployees")
        );
      }

      const lista = Array.isArray(data)
        ? data
        : Array.isArray(data?.funcionarios)
          ? data.funcionarios
          : [];

      setFuncionarios(
        lista
          .map(
            (
              funcionario: any
            ): FuncionarioComercial => ({
              id: Number(funcionario.id),
              nome: String(
                funcionario.nome ||
                  t("common.employee")
              ),
              cargo:
                funcionario.cargo || null,
              setor:
                funcionario.setor || null,
              departamento:
                funcionario.departamento ||
                null,
            })
          )
          .filter(
            (
              funcionario: FuncionarioComercial
            ) =>
              Number.isInteger(
                funcionario.id
              ) &&
              funcionario.id > 0
          )
          .sort((a, b) =>
            a.nome.localeCompare(
              b.nome,
              locale
            )
          )
      );
    } catch (error: unknown) {
      setFuncionarios([]);
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.loadEmployees")
      );
    } finally {
      setCarregandoFuncionarios(false);
    }
  }

  useEffect(() => {
    void (async () => {
      const controle =
        await carregarControleAcesso();

      await carregarEquipes();

      if (
        controle.possuiAcessoFormulario
      ) {
        await carregarFuncionarios();
      } else {
        setCarregandoFuncionarios(false);
      }
    })();
    // Intencional: carga inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sucesso) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSucesso("");
      }, 3500);

    return () =>
      window.clearTimeout(timer);
  }, [sucesso]);

  const equipesFiltradas = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    return equipes.filter((equipe) => {
      const bateStatus =
        filtroStatus === "TODAS" ||
        (filtroStatus === "ATIVAS" &&
          equipe.ativo) ||
        (filtroStatus === "INATIVAS" &&
          !equipe.ativo);

      if (!bateStatus) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const membros = equipe.membros
        .map(
          (membro) =>
            membro.funcionario?.nome || ""
        )
        .join(" ")
        .toLowerCase();

      const texto = [
        equipe.nome,
        equipe.descricao,
        equipe.responsavelFuncionario
          ?.nome,
        membros,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [equipes, busca, filtroStatus]);

  const funcionariosFiltrados =
    useMemo(() => {
      const termo =
        buscaFuncionarios
          .trim()
          .toLowerCase();

      if (!termo) {
        return funcionarios;
      }

      return funcionarios.filter(
        (funcionario) => {
          const texto = [
            funcionario.nome,
            funcionario.cargo,
            nomeDepartamento(funcionario),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texto.includes(termo);
        }
      );
    }, [
      funcionarios,
      buscaFuncionarios,
      t,
    ]);

  const metricas = useMemo(() => {
    const ativas =
      equipes.filter(
        (equipe) => equipe.ativo
      ).length;

    const inativas =
      equipes.length - ativas;

    const membrosAtivos = equipes
      .filter((equipe) => equipe.ativo)
      .reduce(
        (total, equipe) =>
          total +
          Number(
            equipe._count?.membros ??
              equipe.membros.length ??
              0
          ),
        0
      );

    const metas = equipes.reduce(
      (total, equipe) =>
        total +
        Number(
          equipe._count?.metas || 0
        ),
      0
    );

    return {
      total: equipes.length,
      ativas,
      inativas,
      membrosAtivos,
      metas,
    };
  }, [equipes]);

  function abrirNovaEquipe() {
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setBuscaFuncionarios("");
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(
    equipe: EquipeComercial
  ) {
    setEditandoId(equipe.id);

    setForm({
      nome: equipe.nome || "",
      descricao:
        equipe.descricao || "",
      responsavelFuncionarioId:
        equipe.responsavelFuncionarioId
          ? String(
              equipe.responsavelFuncionarioId
            )
          : equipe
                .responsavelFuncionario?.id
            ? String(
                equipe
                  .responsavelFuncionario
                  .id
              )
            : "",
      membroIds: equipe.membros
        .filter(
          (membro) =>
            membro.ativo !== false
        )
        .map((membro) =>
          Number(
            membro.funcionarioId ||
              membro.funcionario?.id
          )
        )
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        ),
      ativo: equipe.ativo,
    });

    setBuscaFuncionarios("");
    setErro("");
    setModalAberto(true);
  }

  function fecharModal() {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setEditandoId(null);
    setForm(FORM_INICIAL);
    setBuscaFuncionarios("");
  }

  function selecionarResponsavel(
    valor: string
  ) {
    const responsavelId = valor
      ? Number(valor)
      : null;

    setForm((atual) => ({
      ...atual,
      responsavelFuncionarioId: valor,
      membroIds:
        responsavelId &&
        !atual.membroIds.includes(
          responsavelId
        )
          ? [
              ...atual.membroIds,
              responsavelId,
            ]
          : atual.membroIds,
    }));
  }

  function alternarMembro(
    funcionarioId: number
  ) {
    const responsavelId =
      form.responsavelFuncionarioId
        ? Number(
            form.responsavelFuncionarioId
          )
        : null;

    if (
      responsavelId === funcionarioId
    ) {
      return;
    }

    setForm((atual) => ({
      ...atual,
      membroIds:
        atual.membroIds.includes(
          funcionarioId
        )
          ? atual.membroIds.filter(
              (id) =>
                id !== funcionarioId
            )
          : [
              ...atual.membroIds,
              funcionarioId,
            ],
    }));
  }

  async function salvarEquipe() {
    if (
      form.nome.trim().length < 2
    ) {
      setErro(
        t("validation.teamName")
      );
      return;
    }

    const idEmEdicao = editandoId;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const endpoint = idEmEdicao
        ? `/api/admin/comercial/equipes/${idEmEdicao}`
        : "/api/admin/comercial/equipes";

      const res = await fetch(
        endpoint,
        {
          method: idEmEdicao
            ? "PATCH"
            : "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
            descricao:
              form.descricao.trim() ||
              null,
            responsavelFuncionarioId:
              form.responsavelFuncionarioId
                ? Number(
                    form.responsavelFuncionarioId
                  )
                : null,
            membroIds: form.membroIds,
            ativo: form.ativo,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("errors.saveTeam")
        );
      }

      fecharModal();

      setSucesso(
        data?.mensagem ||
          (idEmEdicao
            ? t("success.updated")
            : t("success.created"))
      );

      await carregarEquipes();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.saveTeam")
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesativacao() {
    if (!equipeParaDesativar) {
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/comercial/equipes/${equipeParaDesativar.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("errors.deactivate")
        );
      }

      setEquipeParaDesativar(null);
      setSucesso(
        data?.mensagem ||
          t("success.deactivated")
      );

      await carregarEquipes();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.deactivate")
      );
    } finally {
      setSalvando(false);
    }
  }

  async function reativarEquipe(
    equipe: EquipeComercial
  ) {
    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const res = await fetch(
        `/api/admin/comercial/equipes/${equipe.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            ativo: true,
          }),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
            t("errors.reactivate")
        );
      }

      setSucesso(
        data?.mensagem ||
          t("success.reactivated")
      );

      await carregarEquipes();
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : t("errors.reactivate")
      );
    } finally {
      setSalvando(false);
    }
  }

  const metricasUi = [
    {
      titulo: t("metrics.total"),
      valor: metricas.total,
    },
    {
      titulo: t("metrics.active"),
      valor: metricas.ativas,
    },
    {
      titulo: t("metrics.inactive"),
      valor: metricas.inativas,
    },
    {
      titulo: t("metrics.activeMembers"),
      valor: metricas.membrosAtivos,
    },
    {
      titulo: t("metrics.linkedGoals"),
      valor: metricas.metas,
    },
  ];

  const opcoesFiltro: OpcaoSelectTema[] = [
    {
      value: "ATIVAS",
      label: t("filters.active"),
    },
    {
      value: "INATIVAS",
      label: t("filters.inactive"),
    },
    {
      value: "TODAS",
      label: t("filters.all"),
    },
  ];

  const opcoesLider: OpcaoSelectTema[] = [
    {
      value: "",
      label: t("modal.noLeader"),
    },
    ...funcionarios.map(
      (funcionario) => ({
        value: String(funcionario.id),
        label: `${funcionario.nome}${
          funcionario.cargo
            ? ` — ${funcionario.cargo}`
            : ""
        }`,
      })
    ),
  ];

  return (
    <main
      className={`phanyx-equipes-comerciais-page mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8 ${c.pagina}`}
    >
      <header
        className={`rounded-3xl border p-6 shadow-sm ${c.card}`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p
              className={`text-xs font-black uppercase tracking-[0.22em] ${c.kicker}`}
            >
              {t("header.kicker")}
            </p>

            <h1
              className={`mt-2 text-3xl font-black ${c.titulo}`}
            >
              {t("header.title")}
            </h1>

            <p
              className={`mt-2 max-w-3xl text-sm leading-6 ${c.texto}`}
            >
              {t("header.description")}
            </p>
          </div>

          {!carregandoPermissoes &&
            podeCriarEquipe && (
              <button
                type="button"
                onClick={abrirNovaEquipe}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-700 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
              >
                {t("actions.newTeam")}
              </button>
            )}
        </div>
      </header>

      {erro && (
        <div
          className={
            modoTema === "light"
              ? "rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900"
              : "rounded-2xl border border-red-800 bg-red-950/35 px-4 py-3 text-sm font-bold text-red-100"
          }
        >
          {erro}
        </div>
      )}

      {sucesso && (
        <div
          className={
            modoTema === "light"
              ? "rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950"
              : "rounded-2xl border border-emerald-800 bg-emerald-950/35 px-4 py-3 text-sm font-bold text-emerald-100"
          }
        >
          {sucesso}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metricasUi.map((item) => (
          <article
            key={item.titulo}
            className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
          >
            <p
              className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
            >
              {item.titulo}
            </p>

            <p
              className={`mt-3 text-3xl font-black ${c.titulo}`}
            >
              {item.valor}
            </p>
          </article>
        ))}
      </section>

      <section
        className={`rounded-3xl border p-5 shadow-sm ${c.card}`}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(event.target.value)
            }
            placeholder={t(
              "filters.searchPlaceholder"
            )}
            className={`min-h-12 w-full rounded-2xl border px-4 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 ${c.input}`}
          />

          <SelectTema
            value={filtroStatus}
            onChange={(valor) =>
              setFiltroStatus(
                valor as FiltroStatus
              )
            }
            options={opcoesFiltro}
            modoTema={modoTema}
          />
        </div>
      </section>

      {carregando ? (
        <div
          className={`rounded-3xl border p-10 text-center font-semibold shadow-sm ${c.card} ${c.texto}`}
        >
          {t("states.loading")}
        </div>
      ) : equipesFiltradas.length === 0 ? (
        <div
          className={`rounded-3xl border border-dashed p-12 text-center shadow-sm ${c.card}`}
        >
          <p
            className={`text-lg font-black ${c.titulo}`}
          >
            {t("states.emptyTitle")}
          </p>

          <p
            className={`mt-2 text-sm ${c.texto}`}
          >
            {t("states.emptyDescription")}
          </p>
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {equipesFiltradas.map(
            (equipe) => (
              <article
                key={equipe.id}
                className={`flex min-h-[300px] flex-col rounded-3xl border p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${c.card}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        className={`text-xl font-black ${c.titulo}`}
                      >
                        {equipe.nome}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${
                          equipe.ativo
                            ? modoTema ===
                              "light"
                              ? "border-emerald-600 bg-emerald-100 text-emerald-950"
                              : "border-emerald-700 bg-emerald-950/50 text-emerald-100"
                            : modoTema ===
                              "light"
                              ? "border-slate-400 bg-slate-200 text-slate-950"
                              : "border-neutral-600 bg-neutral-800 text-neutral-200"
                        }`}
                      >
                        {equipe.ativo
                          ? t("status.active")
                          : t("status.inactive")}
                      </span>
                    </div>

                    <p
                      className={`mt-2 text-sm leading-6 ${c.texto}`}
                    >
                      {equipe.descricao ||
                        t("common.noDescription")}
                    </p>
                  </div>

                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-black ${c.soft} ${c.titulo}`}
                  >
                    {iniciais(equipe.nome)}
                  </div>
                </div>

                <div
                  className={`mt-5 rounded-2xl border p-4 ${c.soft}`}
                >
                  <p
                    className={`text-xs font-bold uppercase tracking-wide ${c.muted}`}
                  >
                    {t("card.teamLeader")}
                  </p>

                  <p
                    className={`mt-2 font-black ${c.titulo}`}
                  >
                    {equipe
                      .responsavelFuncionario
                      ?.nome ||
                      t("card.noLeader")}
                  </p>

                  {equipe
                    .responsavelFuncionario && (
                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      {equipe
                        .responsavelFuncionario
                        .cargo ||
                        t("common.noRole")}
                      {" · "}
                      {nomeDepartamento(
                        equipe.responsavelFuncionario
                      )}
                    </p>
                  )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-sm font-black ${c.titulo}`}
                    >
                      {t("card.members")}
                    </p>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${c.soft} ${c.titulo}`}
                    >
                      {equipe._count?.membros ??
                        equipe.membros.length}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {equipe.membros.length ===
                    0 ? (
                      <span
                        className={`text-sm ${c.muted}`}
                      >
                        {t("card.noMembers")}
                      </span>
                    ) : (
                      equipe.membros
                        .slice(0, 5)
                        .map((membro) => (
                          <span
                            key={membro.id}
                            className={`rounded-full border px-3 py-1.5 text-xs font-bold ${c.soft} ${c.titulo}`}
                          >
                            {
                              membro
                                .funcionario.nome
                            }
                          </span>
                        ))
                    )}

                    {equipe.membros.length >
                      5 && (
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold ${c.soft} ${c.titulo}`}
                      >
                        +
                        {equipe.membros
                          .length - 5}
                      </span>
                    )}
                  </div>
                </div>

                {!carregandoPermissoes &&
                  (podeEditarEquipe ||
                    podeExcluirEquipe) && (
                    <div className="mt-auto flex flex-wrap gap-3 pt-6">
                      {podeEditarEquipe && (
                        <button
                          type="button"
                          onClick={() =>
                            abrirEdicao(equipe)
                          }
                          className={`rounded-2xl border px-5 py-2.5 text-sm font-black transition ${c.secondary}`}
                        >
                          {t("actions.edit")}
                        </button>
                      )}

                      {equipe.ativo
                        ? podeExcluirEquipe && (
                            <button
                              type="button"
                              onClick={() =>
                                setEquipeParaDesativar(
                                  equipe
                                )
                              }
                              className={
                                modoTema ===
                                "light"
                                  ? "rounded-2xl border border-red-600 bg-red-50 px-5 py-2.5 text-sm font-black text-red-900 transition hover:bg-red-100"
                                  : "rounded-2xl border border-red-800 bg-red-950/35 px-5 py-2.5 text-sm font-black text-red-100 transition hover:bg-red-950/60"
                              }
                            >
                              {t(
                                "actions.deactivate"
                              )}
                            </button>
                          )
                        : podeEditarEquipe && (
                            <button
                              type="button"
                              onClick={() =>
                                void reativarEquipe(
                                  equipe
                                )
                              }
                              disabled={
                                salvando
                              }
                              className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
                            >
                              {t(
                                "actions.reactivate"
                              )}
                            </button>
                          )}
                    </div>
                  )}
              </article>
            )
          )}
        </section>
      )}

      {modalAberto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4">
          <div
            className={`max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border shadow-2xl ${c.card}`}
          >
            <div
              className={`flex items-start justify-between gap-4 border-b p-6 ${
                modoTema === "dark"
                  ? "border-blue-900"
                  : modoTema ===
                      "system-dark"
                    ? "border-neutral-700"
                    : "border-slate-200"
              }`}
            >
              <div>
                <p
                  className={`text-xs font-black uppercase tracking-[0.2em] ${c.kicker}`}
                >
                  {t("header.kicker")}
                </p>

                <h2
                  className={`mt-2 text-2xl font-black ${c.titulo}`}
                >
                  {editandoId
                    ? t("modal.editTitle")
                    : t("modal.newTitle")}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className={`rounded-2xl border px-4 py-2 text-sm font-bold ${c.secondary}`}
              >
                {t("actions.close")}
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div>
                <label
                  className={`mb-2 block text-sm font-black ${c.titulo}`}
                >
                  {t("modal.teamName")}
                </label>

                <input
                  value={form.nome}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      nome:
                        event.target.value,
                    }))
                  }
                  placeholder={t(
                    "modal.teamNamePlaceholder"
                  )}
                  className={`min-h-12 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm font-black ${c.titulo}`}
                >
                  {t("modal.description")}
                </label>

                <textarea
                  value={form.descricao}
                  onChange={(event) =>
                    setForm((atual) => ({
                      ...atual,
                      descricao:
                        event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder={t(
                    "modal.descriptionPlaceholder"
                  )}
                  className={`w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600 ${c.input}`}
                />
              </div>

              <div>
                <label
                  className={`mb-2 block text-sm font-black ${c.titulo}`}
                >
                  {t("modal.teamLeader")}
                </label>

                <SelectTema
                  value={
                    form.responsavelFuncionarioId
                  }
                  onChange={
                    selecionarResponsavel
                  }
                  disabled={
                    carregandoFuncionarios
                  }
                  options={opcoesLider}
                  modoTema={modoTema}
                />

                <p
                  className={`mt-2 text-xs ${c.muted}`}
                >
                  {t("modal.leaderHelp")}
                </p>
              </div>

              <div
                className={`rounded-3xl border p-5 ${c.soft}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3
                      className={`font-black ${c.titulo}`}
                    >
                      {t("modal.members")}
                    </h3>

                    <p
                      className={`mt-1 text-xs ${c.muted}`}
                    >
                      {t(
                        "modal.membersDescription"
                      )}
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-black ${c.card} ${c.titulo}`}
                  >
                    {t("modal.selectedCount", {
                      count:
                        form.membroIds
                          .length,
                    })}
                  </span>
                </div>

                <input
                  type="search"
                  value={buscaFuncionarios}
                  onChange={(event) =>
                    setBuscaFuncionarios(
                      event.target.value
                    )
                  }
                  placeholder={t(
                    "modal.searchEmployees"
                  )}
                  className={`mt-4 min-h-11 w-full rounded-2xl border px-4 outline-none focus:border-blue-600 ${c.input}`}
                />

                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {carregandoFuncionarios ? (
                    <p
                      className={`py-6 text-center text-sm ${c.muted}`}
                    >
                      {t(
                        "states.loadingEmployees"
                      )}
                    </p>
                  ) : funcionariosFiltrados.length ===
                    0 ? (
                    <p
                      className={`py-6 text-center text-sm ${c.muted}`}
                    >
                      {t(
                        "states.noEmployees"
                      )}
                    </p>
                  ) : (
                    funcionariosFiltrados.map(
                      (funcionario) => {
                        const marcado =
                          form.membroIds.includes(
                            funcionario.id
                          );

                        const ehLider =
                          Number(
                            form.responsavelFuncionarioId
                          ) ===
                          funcionario.id;

                        return (
                          <label
                            key={
                              funcionario.id
                            }
                            className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                              marcado
                                ? c.selected
                                : c.card
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={marcado}
                              disabled={ehLider}
                              onChange={() =>
                                alternarMembro(
                                  funcionario.id
                                )
                              }
                              className="mt-1 h-4 w-4"
                            />

                            <span className="min-w-0 flex-1">
                              <span
                                className={`block font-black ${c.titulo}`}
                              >
                                {
                                  funcionario.nome
                                }
                              </span>

                              <span
                                className={`mt-1 block text-xs ${c.muted}`}
                              >
                                {funcionario.cargo ||
                                  t(
                                    "common.noRole"
                                  )}
                                {" · "}
                                {nomeDepartamento(
                                  funcionario
                                )}
                              </span>

                              {ehLider && (
                                <span className="mt-2 inline-flex rounded-full bg-amber-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                  {t(
                                    "modal.leaderBadge"
                                  )}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      }
                    )
                  )}
                </div>
              </div>

              {editandoId && (
                <label
                  className={`flex items-center gap-3 rounded-2xl border p-4 ${c.soft}`}
                >
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        ativo:
                          event.target
                            .checked,
                      }))
                    }
                    className="h-4 w-4"
                  />

                  <span>
                    <strong
                      className={`block text-sm ${c.titulo}`}
                    >
                      {t(
                        "modal.activeTeam"
                      )}
                    </strong>

                    <span
                      className={`text-xs ${c.muted}`}
                    >
                      {t(
                        "modal.activeTeamHelp"
                      )}
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div
              className={`flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end ${c.modalFooter}`}
            >
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className={`rounded-2xl border px-6 py-3 text-sm font-black ${c.secondary}`}
              >
                {t("actions.cancel")}
              </button>

              <button
                type="button"
                onClick={() =>
                  void salvarEquipe()
                }
                disabled={salvando}
                className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? t("actions.saving")
                  : editandoId
                    ? t(
                        "actions.saveChanges"
                      )
                    : t(
                        "actions.createTeam"
                      )}
              </button>
            </div>
          </div>
        </div>
      )}

      {equipeParaDesativar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl ${c.card}`}
          >
            <div className="p-6">
              <h2
                className={`text-xl font-black ${c.titulo}`}
              >
                {t(
                  "deactivateModal.title"
                )}
              </h2>

              <p
                className={`mt-3 text-sm leading-6 ${c.texto}`}
              >
                {t.rich(
                  "deactivateModal.description",
                  {
                    team: () => (
                      <strong
                        className={
                          c.titulo
                        }
                      >
                        {
                          equipeParaDesativar.nome
                        }
                      </strong>
                    ),
                  }
                )}
              </p>
            </div>

            <div
              className={`flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end ${c.modalFooter}`}
            >
              <button
                type="button"
                onClick={() =>
                  setEquipeParaDesativar(
                    null
                  )
                }
                disabled={salvando}
                className={`rounded-2xl border px-5 py-3 text-sm font-black ${c.secondary}`}
              >
                {t("actions.keepTeam")}
              </button>

              <button
                type="button"
                onClick={() =>
                  void confirmarDesativacao()
                }
                disabled={salvando}
                className="rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {salvando
                  ? t(
                      "actions.deactivating"
                    )
                  : t(
                      "actions.deactivateTeam"
                    )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}