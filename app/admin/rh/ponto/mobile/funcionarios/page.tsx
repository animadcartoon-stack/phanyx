"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FuncionarioPontoMobile = {
  id: number;
  nome: string;
  email?: string | null;
  cargo?: string | null;
  fotoPerfil?: string | null;

  pontoMobileLiberado: boolean;
  pontoMobileLiberadoEm?: string | null;
  pontoMobileLiberadoPorId?: number | null;
  pontoMobileValidoAte?: string | null;
};

type RespostaFuncionarios = {
  configuracao?: {
    pontoMobileAtivo: boolean;
    exigirFuncionarioLiberado: boolean;
  };

  funcionarios?: FuncionarioPontoMobile[];
  error?: string;
};

type ToastState = {
  tipo: "sucesso" | "erro";
  mensagem: string;
} | null;

type FiltroAcesso = "TODOS" | "LIBERADOS" | "BLOQUEADOS";

export default function FuncionariosPontoMobilePage() {
  const [funcionarios, setFuncionarios] = useState<
    FuncionarioPontoMobile[]
  >([]);

  const [selecionados, setSelecionados] = useState<number[]>(
    []
  );

  const [busca, setBusca] = useState("");
  const [filtroAcesso, setFiltroAcesso] =
    useState<FiltroAcesso>("TODOS");

  const [pontoMobileAtivo, setPontoMobileAtivo] =
    useState(false);

  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const funcionariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return funcionarios.filter((funcionario) => {
      const correspondeBusca =
        !termo ||
        funcionario.nome
          .toLocaleLowerCase("pt-BR")
          .includes(termo) ||
        funcionario.email
          ?.toLocaleLowerCase("pt-BR")
          .includes(termo) ||
        funcionario.cargo
          ?.toLocaleLowerCase("pt-BR")
          .includes(termo);

      const correspondeAcesso =
        filtroAcesso === "TODOS" ||
        (filtroAcesso === "LIBERADOS" &&
          funcionario.pontoMobileLiberado) ||
        (filtroAcesso === "BLOQUEADOS" &&
          !funcionario.pontoMobileLiberado);

      return correspondeBusca && correspondeAcesso;
    });
  }, [funcionarios, busca, filtroAcesso]);

  const totalLiberados = useMemo(
    () =>
      funcionarios.filter(
        (funcionario) =>
          funcionario.pontoMobileLiberado
      ).length,
    [funcionarios]
  );

  const totalBloqueados =
    funcionarios.length - totalLiberados;

  const todosFiltradosSelecionados =
    funcionariosFiltrados.length > 0 &&
    funcionariosFiltrados.every((funcionario) =>
      selecionados.includes(funcionario.id)
    );

  function mostrarToast(
    tipo: "sucesso" | "erro",
    mensagem: string
  ) {
    setToast({
      tipo,
      mensagem,
    });
  }

  async function carregarFuncionarios() {
    try {
      setCarregando(true);

      const resposta = await fetch(
        "/api/admin/rh/ponto/mobile/funcionarios",
        {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        }
      );

      const dados: RespostaFuncionarios =
        await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados.error ||
            "Não foi possível carregar os funcionários."
        );
      }

      setFuncionarios(dados.funcionarios || []);

      setPontoMobileAtivo(
        dados.configuracao?.pontoMobileAtivo === true
      );
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os funcionários."
      );
    } finally {
      setCarregando(false);
    }
  }

  function alternarSelecionado(funcionarioId: number) {
    setSelecionados((anteriores) => {
      if (anteriores.includes(funcionarioId)) {
        return anteriores.filter(
          (id) => id !== funcionarioId
        );
      }

      return [...anteriores, funcionarioId];
    });
  }

  function alternarTodosFiltrados() {
    const idsFiltrados = funcionariosFiltrados.map(
      (funcionario) => funcionario.id
    );

    if (todosFiltradosSelecionados) {
      setSelecionados((anteriores) =>
        anteriores.filter(
          (id) => !idsFiltrados.includes(id)
        )
      );

      return;
    }

    setSelecionados((anteriores) =>
      Array.from(
        new Set([...anteriores, ...idsFiltrados])
      )
    );
  }

  async function atualizarAcesso(
    funcionarioIds: number[],
    liberado: boolean
  ) {
    if (funcionarioIds.length === 0) {
      mostrarToast(
        "erro",
        "Selecione pelo menos um funcionário."
      );

      return;
    }

    try {
      setProcessando(true);

      const resposta = await fetch(
        "/api/admin/rh/ponto/mobile/funcionarios",
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funcionarioIds,
            liberado,
          }),
        }
      );

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(
          dados?.error ||
            "Não foi possível atualizar o acesso."
        );
      }

      const atualizados: FuncionarioPontoMobile[] =
        dados.funcionarios || [];

      const atualizadosPorId = new Map(
        atualizados.map((funcionario) => [
          funcionario.id,
          funcionario,
        ])
      );

      setFuncionarios((anteriores) =>
        anteriores.map(
          (funcionario) =>
            atualizadosPorId.get(funcionario.id) ||
            funcionario
        )
      );

      setSelecionados([]);

      mostrarToast(
        "sucesso",
        dados?.mensagem ||
          "Acesso ao Ponto Mobile atualizado."
      );
    } catch (error) {
      mostrarToast(
        "erro",
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o acesso."
      );
    } finally {
      setProcessando(false);
    }
  }

  function formatarData(data?: string | null) {
    if (!data) return null;

    const valor = new Date(data);

    if (Number.isNaN(valor.getTime())) {
      return null;
    }

    return valor.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Carregando funcionários...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-[100] max-w-md rounded-2xl border px-5 py-4 shadow-xl ${
            toast.tipo === "sucesso"
              ? "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-100"
              : "border-red-300 bg-red-50 text-red-950 dark:border-red-700 dark:bg-red-950 dark:text-red-100"
          }`}
        >
          <p className="text-sm font-bold">
            {toast.mensagem}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">
              RH PHANYX
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Funcionários do Ponto Mobile
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Libere somente os funcionários autorizados a
              registrar ponto pelo celular.
            </p>
          </div>

          <Link
            href="/admin/rh/ponto/mobile"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Voltar para configurações
          </Link>
        </header>

        {!pontoMobileAtivo && (
          <section className="rounded-3xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40">
            <p className="font-black text-amber-950 dark:text-amber-100">
              O Ponto Mobile está desativado
            </p>

            <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-amber-200">
              Você pode organizar as liberações agora, mas
              nenhum funcionário conseguirá registrar ponto
              pelo celular enquanto a instituição não ativar
              o recurso.
            </p>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <ResumoCard
            titulo="Funcionários"
            valor={funcionarios.length}
            descricao="Total encontrado"
          />

          <ResumoCard
            titulo="Liberados"
            valor={totalLiberados}
            descricao="Podem usar o celular"
          />

          <ResumoCard
            titulo="Bloqueados"
            valor={totalBloqueados}
            descricao="Sem acesso mobile"
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
            <div>
              <label
                htmlFor="buscaFuncionarios"
                className="mb-2 block text-sm font-black"
              >
                Buscar funcionário
              </label>

              <input
                id="buscaFuncionarios"
                type="search"
                value={busca}
                onChange={(evento) =>
                  setBusca(evento.target.value)
                }
                placeholder="Nome, e-mail ou cargo"
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            <div>
              <label
                htmlFor="filtroAcesso"
                className="mb-2 block text-sm font-black"
              >
                Situação
              </label>

              <select
                id="filtroAcesso"
                value={filtroAcesso}
                onChange={(evento) =>
                  setFiltroAcesso(
                    evento.target.value as FiltroAcesso
                  )
                }
                className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="LIBERADOS">
                  Liberados
                </option>

                <option value="BLOQUEADOS">
                  Bloqueados
                </option>
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-black">
                Lista de funcionários
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {funcionariosFiltrados.length} resultado(s) •{" "}
                {selecionados.length} selecionado(s)
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={
                  processando ||
                  selecionados.length === 0
                }
                onClick={() =>
                  atualizarAcesso(selecionados, true)
                }
                className="min-h-11 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processando
                  ? "Processando..."
                  : "Liberar selecionados"}
              </button>

              <button
                type="button"
                disabled={
                  processando ||
                  selecionados.length === 0
                }
                onClick={() =>
                  atualizarAcesso(selecionados, false)
                }
                className="min-h-11 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Bloquear selecionados
              </button>
            </div>
          </div>

          {funcionariosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-black">
                Nenhum funcionário encontrado
              </p>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Altere a busca ou o filtro selecionado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-100 dark:bg-slate-950/70">
                  <tr>
                    <th className="w-14 px-5 py-4 text-left">
                      <input
                        type="checkbox"
                        checked={
                          todosFiltradosSelecionados
                        }
                        onChange={alternarTodosFiltrados}
                        className="h-5 w-5 accent-blue-600"
                        aria-label="Selecionar funcionários exibidos"
                      />
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Funcionário
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Cargo
                    </th>

                    <th className="px-3 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Situação
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-black uppercase tracking-wide text-slate-600 dark:text-slate-300">
                      Ação
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {funcionariosFiltrados.map(
                    (funcionario) => {
                      const dataLiberacao =
                        formatarData(
                          funcionario.pontoMobileLiberadoEm
                        );

                      const validoAte =
                        formatarData(
                          funcionario.pontoMobileValidoAte
                        );

                      return (
                        <tr
                          key={funcionario.id}
                          className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50"
                        >
                          <td className="px-5 py-4">
                            <input
                              type="checkbox"
                              checked={selecionados.includes(
                                funcionario.id
                              )}
                              onChange={() =>
                                alternarSelecionado(
                                  funcionario.id
                                )
                              }
                              className="h-5 w-5 accent-blue-600"
                              aria-label={`Selecionar ${funcionario.nome}`}
                            />
                          </td>

                          <td className="px-3 py-4">
                            <div className="flex min-w-[240px] items-center gap-3">
                              <FuncionarioAvatar
                                nome={funcionario.nome}
                                fotoPerfil={
                                  funcionario.fotoPerfil
                                }
                              />

                              <div>
                                <p className="font-black text-slate-950 dark:text-slate-100">
                                  {funcionario.nome}
                                </p>

                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                  {funcionario.email ||
                                    "E-mail não informado"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {funcionario.cargo ||
                              "Cargo não informado"}
                          </td>

                          <td className="px-3 py-4">
                            {funcionario.pontoMobileLiberado ? (
                              <div>
                                <span className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                                  Liberado
                                </span>

                                {dataLiberacao && (
                                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                    Desde {dataLiberacao}
                                  </p>
                                )}

                                {validoAte && (
                                  <p className="mt-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                                    Válido até {validoAte}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                                Bloqueado
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              disabled={processando}
                              onClick={() =>
                                atualizarAcesso(
                                  [funcionario.id],
                                  !funcionario.pontoMobileLiberado
                                )
                              }
                              className={`min-h-10 rounded-xl px-4 py-2 text-xs font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                funcionario.pontoMobileLiberado
                                  ? "bg-red-700 hover:bg-red-800"
                                  : "bg-blue-700 hover:bg-blue-800"
                              }`}
                            >
                              {funcionario.pontoMobileLiberado
                                ? "Bloquear"
                                : "Liberar"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <p className="font-black text-blue-950 dark:text-blue-100">
            Regra de segurança
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-900 dark:text-blue-200">
            Instalar o PHANYX RH não libera o funcionário
            automaticamente. A API verificará esta
            autorização novamente em cada tentativa de
            registro.
          </p>
        </section>
      </div>
    </main>
  );
}

type ResumoCardProps = {
  titulo: string;
  valor: number;
  descricao: string;
};

function ResumoCard({
  titulo,
  valor,
  descricao,
}: ResumoCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
        {titulo}
      </p>

      <p className="mt-2 text-3xl font-black">
        {valor}
      </p>

      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {descricao}
      </p>
    </div>
  );
}

type FuncionarioAvatarProps = {
  nome: string;
  fotoPerfil?: string | null;
};

function FuncionarioAvatar({
  nome,
  fotoPerfil,
}: FuncionarioAvatarProps) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join("");

  if (fotoPerfil) {
    return (
      <img
        src={fotoPerfil}
        alt={`Foto de ${nome}`}
        className="h-11 w-11 shrink-0 rounded-full border border-slate-300 object-cover dark:border-slate-700"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-300 bg-blue-100 text-xs font-black text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      {iniciais || "FN"}
    </div>
  );
}