"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

  responsavelFuncionario?:
  | FuncionarioComercial
  | null;

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

type FiltroStatus =
  | "ATIVAS"
  | "INATIVAS"
  | "TODAS";

type UsuarioControleAcesso = {
  role?: string | null;
  isMasterAdmin?: boolean;
};

const FORM_INICIAL: FormEquipe = {
  nome: "",
  descricao: "",
  responsavelFuncionarioId: "",
  membroIds: [],
  ativo: true,
};

function nomeDepartamento(
  funcionario?: FuncionarioComercial | null
) {
  return (
    funcionario?.departamento?.nome ||
    funcionario?.setor ||
    "Sem departamento"
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

  return `${partes[0][0]}${partes[partes.length - 1][0]
    }`.toUpperCase();
}

export default function EquipesComerciaisPage() {
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

  const [erro, setErro] =
    useState("");

  const [sucesso, setSucesso] =
    useState("");

  const [busca, setBusca] =
    useState("");

  const [
    buscaFuncionarios,
    setBuscaFuncionarios,
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState<FiltroStatus>(
      "ATIVAS"
    );

  const [modalAberto, setModalAberto] =
    useState(false);

  const [editandoId, setEditandoId] =
    useState<number | null>(null);

  const [
    equipeParaDesativar,
    setEquipeParaDesativar,
  ] =
    useState<EquipeComercial | null>(
      null
    );

  const [form, setForm] =
    useState<FormEquipe>(
      FORM_INICIAL
    );

  const roleUsuario = String(
    usuarioAtual?.role || ""
  ).toUpperCase();

  const usuarioAdmin =
    roleUsuario === "ADMIN" ||
    roleUsuario === "GERENCIA" ||
    roleUsuario === "SUPER_ADMIN" ||
    usuarioAtual?.isMasterAdmin === true;

  function possuiPermissao(
    chave: string
  ) {
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

    let permissoesRecebidas:
      string[] = [];

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

      setUsuarioAtual(
        usuarioRecebido
      );

      setPermissoes(
        permissoesRecebidas
      );

      const role = String(
        usuarioRecebido?.role || ""
      ).toUpperCase();

      const ehAdmin =
        role === "ADMIN" ||
        role === "GERENCIA" ||
        role === "SUPER_ADMIN" ||
        usuarioRecebido
          ?.isMasterAdmin === true;

      const possuiAcessoFormulario =
        ehAdmin ||
        permissoesRecebidas.includes(
          "*"
        ) ||
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
      setCarregandoPermissoes(
        false
      );
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
          "Não foi possível carregar as equipes comerciais."
        );
      }

      setEquipes(
        Array.isArray(data?.equipes)
          ? data.equipes
          : []
      );
    } catch (error: any) {
      setEquipes([]);

      setErro(
        error?.message ||
        "Erro ao carregar equipes comerciais."
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
          "Não foi possível carregar os funcionários comerciais."
        );
      }

      const lista =
        Array.isArray(data)
          ? data
          : Array.isArray(
            data?.funcionarios
          )
            ? data.funcionarios
            : [];

      setFuncionarios(
        lista
          .map(
            (
              funcionario: any
            ): FuncionarioComercial => ({
              id: Number(
                funcionario.id
              ),

              nome: String(
                funcionario.nome ||
                "Funcionário"
              ),

              cargo:
                funcionario.cargo ||
                null,

              setor:
                funcionario.setor ||
                null,

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
              "pt-BR"
            )
          )
      );
    } catch (error: any) {
      setFuncionarios([]);

      setErro(
        error?.message ||
        "Erro ao carregar funcionários comerciais."
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
        controle
          .possuiAcessoFormulario
      ) {
        await carregarFuncionarios();
      } else {
        setCarregandoFuncionarios(
          false
        );
      }
    })();
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

  const equipesFiltradas =
    useMemo(() => {
      const termo = busca
        .trim()
        .toLowerCase();

      return equipes.filter(
        (equipe) => {
          const bateStatus =
            filtroStatus ===
            "TODAS" ||
            (filtroStatus ===
              "ATIVAS" &&
              equipe.ativo) ||
            (filtroStatus ===
              "INATIVAS" &&
              !equipe.ativo);

          if (!bateStatus) {
            return false;
          }

          if (!termo) {
            return true;
          }

          const membros =
            equipe.membros
              .map(
                (membro) =>
                  membro.funcionario
                    ?.nome || ""
              )
              .join(" ")
              .toLowerCase();

          const texto = [
            equipe.nome,
            equipe.descricao,
            equipe
              .responsavelFuncionario
              ?.nome,
            membros,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texto.includes(
            termo
          );
        }
      );
    }, [
      equipes,
      busca,
      filtroStatus,
    ]);

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
            nomeDepartamento(
              funcionario
            ),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return texto.includes(
            termo
          );
        }
      );
    }, [
      funcionarios,
      buscaFuncionarios,
    ]);

  const metricas = useMemo(() => {
    const ativas =
      equipes.filter(
        (equipe) =>
          equipe.ativo
      ).length;

    const inativas =
      equipes.length - ativas;

    const membrosAtivos =
      equipes
        .filter(
          (equipe) =>
            equipe.ativo
        )
        .reduce(
          (
            total,
            equipe
          ) =>
            total +
            Number(
              equipe._count
                ?.membros ??
              equipe.membros
                .length ??
              0
            ),
          0
        );

    const metas =
      equipes.reduce(
        (
          total,
          equipe
        ) =>
          total +
          Number(
            equipe._count
              ?.metas || 0
          ),
        0
      );

    return {
      total:
        equipes.length,
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
      nome:
        equipe.nome || "",

      descricao:
        equipe.descricao || "",

      responsavelFuncionarioId:
        equipe
          .responsavelFuncionarioId
          ? String(
            equipe
              .responsavelFuncionarioId
          )
          : equipe
            .responsavelFuncionario
            ?.id
            ? String(
              equipe
                .responsavelFuncionario
                .id
            )
            : "",

      membroIds:
        equipe.membros
          .filter(
            (membro) =>
              membro.ativo !==
              false
          )
          .map(
            (membro) =>
              Number(
                membro.funcionarioId ||
                membro
                  .funcionario
                  ?.id
              )
          )
          .filter(
            (id) =>
              Number.isInteger(
                id
              ) &&
              id > 0
          ),

      ativo:
        equipe.ativo,
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
    const responsavelId =
      valor
        ? Number(valor)
        : null;

    setForm((atual) => ({
      ...atual,

      responsavelFuncionarioId:
        valor,

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
      responsavelId ===
      funcionarioId
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
              id !==
              funcionarioId
          )
          : [
            ...atual.membroIds,
            funcionarioId,
          ],
    }));
  }

  async function salvarEquipe() {
    if (
      form.nome.trim().length <
      2
    ) {
      setErro(
        "Informe o nome da equipe comercial."
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");

      const endpoint =
        editandoId
          ? `/api/admin/comercial/equipes/${editandoId}`
          : "/api/admin/comercial/equipes";

      const res = await fetch(
        endpoint,
        {
          method:
            editandoId
              ? "PATCH"
              : "POST",

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            {
              nome:
                form.nome.trim(),

              descricao:
                form.descricao.trim() ||
                null,

              responsavelFuncionarioId:
                form.responsavelFuncionarioId
                  ? Number(
                    form.responsavelFuncionarioId
                  )
                  : null,

              membroIds:
                form.membroIds,

              ativo:
                form.ativo,
            }
          ),
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível salvar a equipe comercial."
        );
      }

      fecharModal();

      setSucesso(
        data?.mensagem ||
        (editandoId
          ? "Equipe atualizada com sucesso."
          : "Equipe criada com sucesso.")
      );

      await carregarEquipes();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao salvar equipe comercial."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarDesativacao() {
    if (
      !equipeParaDesativar
    ) {
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
          credentials:
            "include",
        }
      );

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.error ||
          "Não foi possível desativar a equipe."
        );
      }

      setEquipeParaDesativar(
        null
      );

      setSucesso(
        data?.mensagem ||
        "Equipe desativada com sucesso."
      );

      await carregarEquipes();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao desativar equipe."
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
          credentials:
            "include",

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
          "Não foi possível reativar a equipe."
        );
      }

      setSucesso(
        data?.mensagem ||
        "Equipe reativada com sucesso."
      );

      await carregarEquipes();
    } catch (error: any) {
      setErro(
        error?.message ||
        "Erro ao reativar equipe."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="phanyx-equipes-comerciais-page mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="phanyx-equipes-cabecalho rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="phanyx-equipes-kicker text-xs font-black uppercase tracking-[0.22em] text-blue-700 dark:text-blue-300">
              Comercial
            </p>

            <h1 className="phanyx-equipes-titulo mt-2 text-3xl font-black text-slate-950 dark:text-white">
              Equipes comerciais
            </h1>

            <p className="phanyx-equipes-descricao mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Organize vendedores em equipes,
              defina lideranças e prepare a
              estrutura para metas coletivas e
              individuais.
            </p>
          </div>

          {!carregandoPermissoes &&
            podeCriarEquipe && (
              <button
                type="button"
                onClick={abrirNovaEquipe}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-blue-700 px-6 text-sm font-black text-white shadow-sm transition hover:bg-blue-800"
              >
                + Nova equipe
              </button>
            )}
        </div>
      </header>

      {erro && (
        <div className="rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-bold text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100">
          {sucesso}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            titulo: "Total de equipes",
            valor: metricas.total,
          },
          {
            titulo: "Equipes ativas",
            valor: metricas.ativas,
          },
          {
            titulo: "Equipes inativas",
            valor: metricas.inativas,
          },
          {
            titulo: "Membros ativos",
            valor:
              metricas.membrosAtivos,
          },
          {
            titulo: "Metas vinculadas",
            valor: metricas.metas,
          },
        ].map((item) => (
          <article
            key={item.titulo}
            className="phanyx-equipes-metrica rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <p className="phanyx-equipes-metrica-label text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {item.titulo}
            </p>

            <p className="phanyx-equipes-metrica-valor mt-3 text-3xl font-black text-slate-950 dark:text-white">
              {item.valor}
            </p>
          </article>
        ))}
      </section>

      <section className="phanyx-equipes-filtros rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <input
            type="search"
            value={busca}
            onChange={(event) =>
              setBusca(
                event.target.value
              )
            }
            placeholder="Buscar por equipe, líder ou membro"
            className="phanyx-equipes-busca min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-950 outline-none transition placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />

          <select
            value={filtroStatus}
            onChange={(event) =>
              setFiltroStatus(
                event.target
                  .value as FiltroStatus
              )
            }
            className="min-h-12 rounded-2xl border border-slate-300 bg-white px-4 font-semibold text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="ATIVAS">
              Equipes ativas
            </option>

            <option value="INATIVAS">
              Equipes inativas
            </option>

            <option value="TODAS">
              Todas as equipes
            </option>
          </select>
        </div>
      </section>

      {carregando ? (
        <div className="phanyx-equipes-carregamento rounded-3xl border border-slate-200 bg-white p-10 text-center font-semibold text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Carregando equipes comerciais...
        </div>
      ) : equipesFiltradas.length ===
        0 ? (
        <div className="phanyx-equipes-vazio rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <p className="phanyx-equipes-vazio-titulo text-lg font-black text-slate-900 dark:text-white">
            Nenhuma equipe encontrada
          </p>

          <p className="phanyx-equipes-vazio-descricao mt-2 text-sm text-slate-600 dark:text-slate-300">
            Cadastre uma equipe ou ajuste os
            filtros da listagem.
          </p>
        </div>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {equipesFiltradas.map(
            (equipe) => (
              <article
                key={equipe.id}
                className="phanyx-equipe-card flex min-h-[300px] flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="phanyx-equipe-card-titulo text-xl font-black text-slate-950 dark:text-white">
                        {equipe.nome}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black ${equipe.ativo
                          ? "border-emerald-600 bg-emerald-100 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-100"
                          : "border-slate-400 bg-slate-200 text-slate-950 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          }`}
                      >
                        {equipe.ativo
                          ? "Ativa"
                          : "Inativa"}
                      </span>
                    </div>

                    <p className="phanyx-equipe-card-descricao mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {equipe.descricao ||
                        "Sem descrição cadastrada."}
                    </p>
                  </div>

                  <div className="phanyx-equipe-card-iniciais flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-sm font-black text-slate-700 dark:bg-blue-950/60 dark:text-blue-100">
                    {iniciais(
                      equipe.nome
                    )}
                  </div>
                </div>

                <div className="phanyx-equipe-card-lider mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                  <p className="phanyx-equipe-card-lider-label text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Líder da equipe
                  </p>

                  <p className="phanyx-equipe-card-lider-nome mt-2 font-black text-slate-900 dark:text-white">
                    {equipe
                      .responsavelFuncionario
                      ?.nome ||
                      "Liderança não definida"}
                  </p>

                  {equipe
                    .responsavelFuncionario && (
                      <p className="phanyx-equipe-card-lider-detalhes mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {equipe
                          .responsavelFuncionario
                          .cargo ||
                          "Cargo não informado"}
                        {" · "}
                        {nomeDepartamento(
                          equipe.responsavelFuncionario
                        )}
                      </p>
                    )}
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="phanyx-equipe-card-membros-titulo text-sm font-black text-slate-900 dark:text-white">
                      Membros
                    </p>

                    <span className="phanyx-equipe-card-contador rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {equipe._count
                        ?.membros ??
                        equipe.membros
                          .length}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {equipe.membros.length ===
                      0 ? (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Nenhum membro ativo.
                      </span>
                    ) : (
                      equipe.membros
                        .slice(0, 5)
                        .map(
                          (membro) => (
                            <span
                              key={
                                membro.id
                              }
                              className="phanyx-equipe-card-membro rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            >
                              {
                                membro
                                  .funcionario
                                  .nome
                              }
                            </span>
                          )
                        )
                    )}

                    {equipe.membros
                      .length > 5 && (
                        <span className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
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
            abrirEdicao(
              equipe
            )
          }
          className="phanyx-equipe-card-editar rounded-2xl border border-slate-400 bg-white px-5 py-2.5 text-sm font-black text-slate-800 transition hover:bg-slate-100 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-100"
        >
          Editar equipe
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
              className="phanyx-equipe-card-desativar rounded-2xl border border-red-600 bg-red-50 px-5 py-2.5 text-sm font-black text-red-900 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
            >
              Desativar
            </button>
          )
        : podeEditarEquipe && (
            <button
              type="button"
              onClick={() =>
                reativarEquipe(
                  equipe
                )
              }
              disabled={salvando}
              className="rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:opacity-60"
            >
              Reativar
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="phanyx-equipes-modal max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="phanyx-equipes-modal-cabecalho flex items-start justify-between gap-4 border-b border-slate-200 p-6 dark:border-slate-700">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  Comercial
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
                  {editandoId
                    ? "Editar equipe comercial"
                    : "Nova equipe comercial"}
                </h2>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="phanyx-equipes-modal-fechar rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Fechar
              </button>
            </div>

            <div className="phanyx-equipes-modal-corpo space-y-6 p-6">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">
                  Nome da equipe
                </label>

                <input
                  value={form.nome}
                  onChange={(event) =>
                    setForm(
                      (
                        atual
                      ) => ({
                        ...atual,
                        nome:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Ex.: Equipe Comercial Centro"
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">
                  Descrição
                </label>

                <textarea
                  value={
                    form.descricao
                  }
                  onChange={(event) =>
                    setForm(
                      (
                        atual
                      ) => ({
                        ...atual,
                        descricao:
                          event.target
                            .value,
                      })
                    )
                  }
                  rows={3}
                  placeholder="Descreva a atuação desta equipe."
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-800 dark:text-slate-100">
                  Líder da equipe
                </label>

                <select
                  value={
                    form.responsavelFuncionarioId
                  }
                  onChange={(event) =>
                    selecionarResponsavel(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    carregandoFuncionarios
                  }
                  className="min-h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 font-semibold text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">
                    Sem liderança definida
                  </option>

                  {funcionarios.map(
                    (
                      funcionario
                    ) => (
                      <option
                        key={
                          funcionario.id
                        }
                        value={
                          funcionario.id
                        }
                      >
                        {
                          funcionario.nome
                        }
                        {funcionario.cargo
                          ? ` — ${funcionario.cargo}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  O líder será incluído
                  automaticamente como membro
                  da equipe.
                </p>
              </div>

              <div className="phanyx-equipes-modal-membros rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">
                      Membros da equipe
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Selecione os funcionários
                      que participarão da equipe.
                    </p>
                  </div>

                  <span className="phanyx-equipes-modal-contador rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-black text-slate-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100">
                    {
                      form.membroIds
                        .length
                    }{" "}
                    selecionados
                  </span>
                </div>

                <input
                  type="search"
                  value={
                    buscaFuncionarios
                  }
                  onChange={(event) =>
                    setBuscaFuncionarios(
                      event.target
                        .value
                    )
                  }
                  placeholder="Buscar funcionário, cargo ou departamento"
                  className="phanyx-equipes-modal-busca mt-4 min-h-11 w-full rounded-2xl border border-slate-300 bg-white px-4 text-slate-950 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />

                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {carregandoFuncionarios ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Carregando funcionários...
                    </p>
                  ) : funcionariosFiltrados.length ===
                    0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">
                      Nenhum funcionário encontrado.
                    </p>
                  ) : (
                    funcionariosFiltrados.map(
                      (
                        funcionario
                      ) => {
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
                            className={`phanyx-equipes-modal-membro flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${marcado
                              ? "phanyx-equipes-modal-membro-selecionado border-emerald-500 bg-emerald-50 dark:border-blue-700 dark:bg-blue-950/40"
                              : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900"
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={
                                marcado
                              }
                              disabled={
                                ehLider
                              }
                              onChange={() =>
                                alternarMembro(
                                  funcionario.id
                                )
                              }
                              className="mt-1 h-4 w-4"
                            />

                            <span className="min-w-0 flex-1">
                              <span className="block font-black text-slate-900 dark:text-white">
                                {
                                  funcionario.nome
                                }
                              </span>

                              <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                                {funcionario.cargo ||
                                  "Cargo não informado"}
                                {" · "}
                                {nomeDepartamento(
                                  funcionario
                                )}
                              </span>

                              {ehLider && (
                                <span className="phanyx-equipes-modal-lider-badge rounded-full bg-amber-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                                  Líder
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
                <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={
                      form.ativo
                    }
                    onChange={(event) =>
                      setForm(
                        (
                          atual
                        ) => ({
                          ...atual,
                          ativo:
                            event
                              .target
                              .checked,
                        })
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span>
                    <strong className="block text-sm text-slate-900 dark:text-white">
                      Equipe ativa
                    </strong>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Equipes inativas não devem
                      receber novas metas.
                    </span>
                  </span>
                </label>
              )}
            </div>

            <div className="phanyx-equipes-modal-rodape flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvando}
                className="phanyx-equipes-modal-cancelar rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={salvarEquipe}
                disabled={salvando}
                className="rounded-2xl bg-blue-700 px-6 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando
                  ? "Salvando..."
                  : editandoId
                    ? "Salvar alterações"
                    : "Criar equipe"}
              </button>
            </div>
          </div>
        </div>
      )}

      {equipeParaDesativar && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4">
          <div className="phanyx-equipes-desativar-modal w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="phanyx-equipes-desativar-corpo p-6">
              <h2 className="phanyx-equipes-desativar-titulo text-xl font-black text-slate-950 dark:text-white">
                Desativar equipe comercial
              </h2>

              <p className="phanyx-equipes-desativar-texto mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                A equipe{" "}
                <strong className="phanyx-equipes-desativar-nome text-slate-950 dark:text-white">
                  {
                    equipeParaDesativar.nome
                  }
                </strong>{" "}
                será desativada. O histórico e as
                metas já vinculadas serão
                preservados.
              </p>
            </div>

            <div className="phanyx-equipes-desativar-rodape flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setEquipeParaDesativar(
                    null
                  )
                }
                disabled={salvando}
                className="phanyx-equipes-desativar-cancelar rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                Manter equipe
              </button>

              <button
                type="button"
                onClick={
                  confirmarDesativacao
                }
                disabled={salvando}
                className="phanyx-equipes-desativar-confirmar rounded-2xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:opacity-60"
              >
                {salvando
                  ? "Desativando..."
                  : "Desativar equipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}