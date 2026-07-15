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

function normalizarBusca(valor?: string | null) {
  return String(valor || "")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9@.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calcularDistanciaLevenshtein(
  textoA: string,
  textoB: string
) {
  const a = normalizarBusca(textoA);
  const b = normalizarBusca(textoB);

  const matriz = Array.from(
    { length: b.length + 1 },
    () => Array<number>(a.length + 1).fill(0)
  );

  for (let coluna = 0; coluna <= a.length; coluna++) {
    matriz[0][coluna] = coluna;
  }

  for (let linha = 0; linha <= b.length; linha++) {
    matriz[linha][0] = linha;
  }

  for (let linha = 1; linha <= b.length; linha++) {
    for (
      let coluna = 1;
      coluna <= a.length;
      coluna++
    ) {
      const custo =
        b[linha - 1] === a[coluna - 1] ? 0 : 1;

      matriz[linha][coluna] = Math.min(
        matriz[linha - 1][coluna] + 1,
        matriz[linha][coluna - 1] + 1,
        matriz[linha - 1][coluna - 1] + custo
      );
    }
  }

  return matriz[b.length][a.length];
}

function pontuarTexto(
  valor: string | null | undefined,
  termo: string
) {
  const texto = normalizarBusca(valor);
  const buscaNormalizada = normalizarBusca(termo);

  if (!texto) return 9999;
  if (!buscaNormalizada) return 0;

  if (texto === buscaNormalizada) {
    return 0;
  }

  if (texto.startsWith(buscaNormalizada)) {
    return 10;
  }

  const palavras = texto.split(" ").filter(Boolean);

  const palavraIniciaBusca = palavras.some((palavra) =>
    palavra.startsWith(buscaNormalizada)
  );

  if (palavraIniciaBusca) {
    return 20;
  }

  const posicao = texto.indexOf(buscaNormalizada);

  if (posicao >= 0) {
    return 30 + posicao;
  }

  const distancias = [
    calcularDistanciaLevenshtein(
      texto,
      buscaNormalizada
    ),

    ...palavras.map((palavra) =>
      calcularDistanciaLevenshtein(
        palavra,
        buscaNormalizada
      )
    ),
  ];

  const menorDistancia = Math.min(...distancias);

  const limiteErro =
    buscaNormalizada.length <= 4
      ? 1
      : buscaNormalizada.length <= 8
        ? 2
        : 3;

  if (menorDistancia <= limiteErro) {
    return 40 + menorDistancia * 5;
  }

  /*
   * Mesmo sem correspondência direta, mantém uma pontuação
   * para podermos sugerir os nomes mais próximos.
   */
  return 200 + menorDistancia;
}

function pontuarFuncionario(
  funcionario: FuncionarioPontoMobile,
  termo: string
) {
  return Math.min(
    pontuarTexto(funcionario.nome, termo),

    pontuarTexto(funcionario.email, termo) + 20,

    pontuarTexto(funcionario.cargo, termo) + 40
  );
}

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

    const [buscaFocada, setBuscaFocada] =
  useState(false);

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

  const funcionariosOrdenados = useMemo(() => {
  const termo = normalizarBusca(busca);

  return funcionarios
    .filter((funcionario) => {
      if (filtroAcesso === "LIBERADOS") {
        return funcionario.pontoMobileLiberado;
      }

      if (filtroAcesso === "BLOQUEADOS") {
        return !funcionario.pontoMobileLiberado;
      }

      return true;
    })
    .map((funcionario) => ({
      funcionario,
      pontuacao: termo
        ? pontuarFuncionario(funcionario, termo)
        : 0,
    }))
    .sort((itemA, itemB) => {
      if (
        termo &&
        itemA.pontuacao !== itemB.pontuacao
      ) {
        return itemA.pontuacao - itemB.pontuacao;
      }

      return itemA.funcionario.nome.localeCompare(
        itemB.funcionario.nome,
        "pt-BR",
        {
          sensitivity: "base",
        }
      );
    });
}, [funcionarios, busca, filtroAcesso]);

const funcionariosFiltrados = useMemo(() => {
  const termo = normalizarBusca(busca);

  if (!termo) {
    return funcionariosOrdenados.map(
      (item) => item.funcionario
    );
  }

  const correspondenciasDiretas =
    funcionariosOrdenados.filter(
      (item) => item.pontuacao < 200
    );

  /*
   * Se não existir correspondência direta, mostra os dez
   * funcionários com nomes mais próximos.
   */
  const resultados =
    correspondenciasDiretas.length > 0
      ? correspondenciasDiretas
      : funcionariosOrdenados.slice(0, 10);

  return resultados.map((item) => item.funcionario);
}, [funcionariosOrdenados, busca]);

const sugestoesBusca = useMemo(() => {
  if (!normalizarBusca(busca)) {
    return [];
  }

  return funcionariosOrdenados
    .slice(0, 8)
    .map((item) => item.funcionario);
}, [funcionariosOrdenados, busca]);

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

      setFuncionarios(
  Array.isArray(dados.funcionarios)
    ? dados.funcionarios
    : []
);

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
      <main className="phanyx-ponto-mobile-funcionarios-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
    <main className="phanyx-ponto-mobile-funcionarios-page min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
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
          <section className="phanyx-ponto-mobile-inativo-card rounded-3xl border p-5">
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
           <div className="relative">
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
    autoComplete="off"
    aria-autocomplete="list"
    aria-expanded={
      buscaFocada && sugestoesBusca.length > 0
    }
    onFocus={() => setBuscaFocada(true)}
    onBlur={() => {
      window.setTimeout(() => {
        setBuscaFocada(false);
      }, 180);
    }}
    onChange={(evento) => {
      setBusca(evento.target.value);
      setBuscaFocada(true);
    }}
    placeholder="Nome, e-mail ou cargo"
    className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
  />

  {buscaFocada && normalizarBusca(busca) && (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
      {sugestoesBusca.length > 0 ? (
        sugestoesBusca.map((funcionario) => (
          <button
            key={funcionario.id}
            type="button"
            onMouseDown={(evento) => {
              evento.preventDefault();
            }}
            onClick={() => {
              setBusca(funcionario.nome);
              setBuscaFocada(false);
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <FuncionarioAvatar
              nome={funcionario.nome}
              fotoPerfil={funcionario.fotoPerfil}
            />

            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-slate-900 dark:text-slate-100">
                {funcionario.nome}
              </span>

              <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                {[
                  funcionario.cargo,
                  funcionario.email,
                ]
                  .filter(Boolean)
                  .join(" • ") ||
                  "Funcionário"}
              </span>
            </span>
          </button>
        ))
      ) : (
        <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-300">
          Nenhuma sugestão encontrada.
        </div>
      )}
    </div>
  )}
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

        <section className="phanyx-ponto-mobile-seguranca-card rounded-3xl border p-5">
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
    <div className="phanyx-ponto-mobile-resumo-card rounded-3xl border p-5 shadow-sm">
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