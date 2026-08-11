"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ResumoComercial = {
  leadsRecebidos: number;
  leadsConvertidos: number;
  taxaConversao: number;
  matriculas: number;
  valorVendido: number;
  valorRecebido: number;
  ticketMedio: number;
  cancelamentos: number;
};

type VendedorRelatorio = {
  funcionarioId: number;
  nome: string;
  cargo: string | null;
  departamento: string | null;
  leads: number;
  conversoes: number;
  matriculas: number;
  taxaConversao: number;
  valorVendido: number;
  valorRecebido: number;
};

type OpcaoFiltro = {
  id: number;
  nome: string;
};

type RelatorioResponse = {
  resumo: ResumoComercial;
  vendedores: VendedorRelatorio[];

  filtros: {
    vendedores: OpcaoFiltro[];
    cursos: OpcaoFiltro[];
    polos: OpcaoFiltro[];
  };
};

type Aba =
  | "visao-geral"
  | "vendedores"
  | "leads"
  | "matriculas"
  | "cursos";

const RESUMO_INICIAL: ResumoComercial = {
  leadsRecebidos: 0,
  leadsConvertidos: 0,
  taxaConversao: 0,
  matriculas: 0,
  valorVendido: 0,
  valorRecebido: 0,
  ticketMedio: 0,
  cancelamentos: 0,
};

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor || 0));
}

function formatarNumero(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(
    Number(valor || 0)
  );
}

function CardIndicador({
  titulo,
  valor,
  descricao,
}: {
  titulo: string;
  valor: string;
  descricao?: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <p
        className="
          text-xs
          font-bold
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {titulo}
      </p>

      <p
        className="
          mt-2
          text-2xl
          font-black
          text-slate-900
          dark:text-white
        "
      >
        {valor}
      </p>

      {descricao && (
        <p
          className="
            mt-2
            text-xs
            text-slate-500
            dark:text-slate-400
          "
        >
          {descricao}
        </p>
      )}
    </div>
  );
}

export default function RelatoriosComerciaisPage() {
  const hoje = useMemo(() => {
    const data = new Date();

    return data.toISOString().slice(0, 10);
  }, []);

  const primeiroDiaMes = useMemo(() => {
    const data = new Date();

    data.setDate(1);

    return data.toISOString().slice(0, 10);
  }, []);

  const [aba, setAba] =
    useState<Aba>("visao-geral");

  const [dataInicial, setDataInicial] =
    useState(primeiroDiaMes);

  const [dataFinal, setDataFinal] =
    useState(hoje);

  const [vendedorId, setVendedorId] =
    useState("");

  const [cursoId, setCursoId] =
    useState("");

  const [poloId, setPoloId] =
    useState("");

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [dados, setDados] =
    useState<RelatorioResponse>({
      resumo: RESUMO_INICIAL,

      vendedores: [],

      filtros: {
        vendedores: [],
        cursos: [],
        polos: [],
      },
    });

  const carregarRelatorio =
    useCallback(async () => {
      setCarregando(true);
      setErro("");

      try {
        const params =
          new URLSearchParams();

        if (dataInicial) {
          params.set(
            "dataInicial",
            dataInicial
          );
        }

        if (dataFinal) {
          params.set(
            "dataFinal",
            dataFinal
          );
        }

        if (vendedorId) {
          params.set(
            "vendedorId",
            vendedorId
          );
        }

        if (cursoId) {
          params.set(
            "cursoId",
            cursoId
          );
        }

        if (poloId) {
          params.set(
            "poloId",
            poloId
          );
        }

        const resposta =
          await fetch(
            `/api/admin/comercial/relatorios?${params.toString()}`,
            {
              cache: "no-store",
            }
          );

        const json =
          await resposta.json();

        if (!resposta.ok) {
          throw new Error(
            json?.error ||
              "Não foi possível carregar o relatório comercial."
          );
        }

        setDados({
          resumo: {
            ...RESUMO_INICIAL,
            ...(json?.resumo || {}),
          },

          vendedores:
            Array.isArray(
              json?.vendedores
            )
              ? json.vendedores
              : [],

          filtros: {
            vendedores:
              Array.isArray(
                json?.filtros
                  ?.vendedores
              )
                ? json.filtros
                    .vendedores
                : [],

            cursos:
              Array.isArray(
                json?.filtros?.cursos
              )
                ? json.filtros.cursos
                : [],

            polos:
              Array.isArray(
                json?.filtros?.polos
              )
                ? json.filtros.polos
                : [],
          },
        });
      } catch (error: any) {
        setErro(
          error?.message ||
            "Erro ao carregar relatório comercial."
        );
      } finally {
        setCarregando(false);
      }
    }, [
      dataInicial,
      dataFinal,
      vendedorId,
      cursoId,
      poloId,
    ]);

  useEffect(() => {
    carregarRelatorio();
  }, [carregarRelatorio]);

  function limparFiltros() {
    setDataInicial(
      primeiroDiaMes
    );

    setDataFinal(hoje);

    setVendedorId("");
    setCursoId("");
    setPoloId("");
  }

  const abas: Array<{
    id: Aba;
    nome: string;
  }> = [
    {
      id: "visao-geral",
      nome: "Visão geral",
    },
    {
      id: "vendedores",
      nome: "Vendedores",
    },
    {
      id: "leads",
      nome: "Leads",
    },
    {
      id: "matriculas",
      nome: "Matrículas",
    },
    {
      id: "cursos",
      nome: "Cursos",
    },
  ];

  return (
    <div
      className="
        min-h-screen
        bg-slate-50
        p-4
        text-slate-900
        dark:bg-slate-950
        dark:text-slate-100
        md:p-6
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          space-y-6
        "
      >
        {/* CABEÇALHO */}

        <div
          className="
            flex
            flex-col
            gap-4
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-700
            dark:bg-slate-900
            md:flex-row
            md:items-center
            md:justify-between
          "
        >
          <div>
            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                text-slate-500
                dark:text-slate-400
              "
            >
              Comercial
            </p>

            <h1
              className="
                mt-1
                text-2xl
                font-black
                text-slate-950
                dark:text-white
                md:text-3xl
              "
            >
              Relatórios comerciais
            </h1>

            <p
              className="
                mt-2
                max-w-3xl
                text-sm
                text-slate-600
                dark:text-slate-300
              "
            >
              Acompanhe leads,
              conversões, matrículas,
              vendas e desempenho da
              equipe comercial.
            </p>
          </div>

          <button
            type="button"
            onClick={
              carregarRelatorio
            }
            disabled={carregando}
            className="
              rounded-xl
              bg-slate-900
              px-4
              py-2.5
              text-sm
              font-bold
              text-white
              transition
              hover:bg-slate-700
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-white
              dark:text-slate-950
              dark:hover:bg-slate-200
            "
          >
            {carregando
              ? "Atualizando..."
              : "Atualizar relatório"}
          </button>
        </div>

        {/* FILTROS */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  font-black
                  text-slate-900
                  dark:text-white
                "
              >
                Filtros
              </h2>

              <p
                className="
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Os indicadores abaixo
                respeitam os filtros
                selecionados.
              </p>
            </div>

            <button
              type="button"
              onClick={limparFiltros}
              className="
                text-sm
                font-bold
                text-slate-600
                hover:text-slate-950
                dark:text-slate-300
                dark:hover:text-white
              "
            >
              Limpar
            </button>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-5
            "
          >
            <label className="space-y-1">
              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Data inicial
              </span>

              <input
                type="date"
                value={dataInicial}
                onChange={(e) =>
                  setDataInicial(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-slate-900
                  outline-none
                  focus:border-slate-500
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />
            </label>

            <label className="space-y-1">
              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Data final
              </span>

              <input
                type="date"
                value={dataFinal}
                onChange={(e) =>
                  setDataFinal(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-slate-900
                  outline-none
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              />
            </label>

            <label className="space-y-1">
              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Vendedor
              </span>

              <select
                value={vendedorId}
                onChange={(e) =>
                  setVendedorId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-slate-900
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              >
                <option value="">
                  Todos
                </option>

                {dados.filtros
                  .vendedores.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.nome}
                      </option>
                    )
                  )}
              </select>
            </label>

            <label className="space-y-1">
              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Curso
              </span>

              <select
                value={cursoId}
                onChange={(e) =>
                  setCursoId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-slate-900
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              >
                <option value="">
                  Todos
                </option>

                {dados.filtros.cursos.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nome}
                    </option>
                  )
                )}
              </select>
            </label>

            <label className="space-y-1">
              <span
                className="
                  text-xs
                  font-bold
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Polo
              </span>

              <select
                value={poloId}
                onChange={(e) =>
                  setPoloId(
                    e.target.value
                  )
                }
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                  text-slate-900
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-white
                "
              >
                <option value="">
                  Todos
                </option>

                {dados.filtros.polos.map(
                  (item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nome}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>
        </div>

        {/* ERRO */}

        {erro && (
          <div
            className="
              rounded-2xl
              border
              border-red-200
              bg-red-50
              p-4
              text-sm
              font-semibold
              text-red-800
              dark:border-red-900
              dark:bg-red-950/40
              dark:text-red-200
            "
          >
            {erro}
          </div>
        )}

        {/* ABAS */}

        <div
          className="
            overflow-x-auto
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-2
            shadow-sm
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          <div
            className="
              flex
              min-w-max
              gap-2
            "
          >
            {abas.map((item) => {
              const ativa =
                aba === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setAba(item.id)
                  }
                  className={[
                    "rounded-xl px-4 py-2 text-sm font-bold transition",

                    ativa
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                  ].join(" ")}
                >
                  {item.nome}
                </button>
              );
            })}
          </div>
        </div>

        {/* INDICADORES */}

        {(aba === "visao-geral" ||
          aba === "leads" ||
          aba === "matriculas") && (
          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <CardIndicador
              titulo="Leads recebidos"
              valor={formatarNumero(
                dados.resumo
                  .leadsRecebidos
              )}
            />

            <CardIndicador
              titulo="Leads convertidos"
              valor={formatarNumero(
                dados.resumo
                  .leadsConvertidos
              )}
            />

            <CardIndicador
              titulo="Taxa de conversão"
              valor={`${Number(
                dados.resumo
                  .taxaConversao || 0
              ).toFixed(1)}%`}
            />

            <CardIndicador
              titulo="Matrículas"
              valor={formatarNumero(
                dados.resumo.matriculas
              )}
            />

            <CardIndicador
              titulo="Valor vendido"
              valor={formatarMoeda(
                dados.resumo.valorVendido
              )}
            />

            <CardIndicador
              titulo="Recebido no ato"
              valor={formatarMoeda(
                dados.resumo
                  .valorRecebido
              )}
            />

            <CardIndicador
              titulo="Ticket médio"
              valor={formatarMoeda(
                dados.resumo.ticketMedio
              )}
            />

            <CardIndicador
              titulo="Cancelamentos"
              valor={formatarNumero(
                dados.resumo
                  .cancelamentos
              )}
            />
          </div>
        )}

        {/* VENDEDORES */}

        {(aba === "visao-geral" ||
          aba === "vendedores") && (
          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-sm
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <div
              className="
                border-b
                border-slate-200
                p-5
                dark:border-slate-700
              "
            >
              <h2
                className="
                  text-lg
                  font-black
                  text-slate-950
                  dark:text-white
                "
              >
                Desempenho por vendedor
              </h2>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Resultado comercial
                individual no período
                selecionado.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table
                className="
                  min-w-full
                  text-sm
                "
              >
                <thead
                  className="
                    bg-slate-50
                    dark:bg-slate-950
                  "
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">
                      Vendedor
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Leads
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Conversões
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Matrículas
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Conversão
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Vendido
                    </th>

                    <th className="px-4 py-3 text-right font-bold">
                      Recebido
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-100
                    dark:divide-slate-800
                  "
                >
                  {!carregando &&
                    dados.vendedores
                      .length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="
                            px-4
                            py-10
                            text-center
                            text-slate-500
                            dark:text-slate-400
                          "
                        >
                          Nenhum resultado
                          encontrado para
                          este período.
                        </td>
                      </tr>
                    )}

                  {dados.vendedores.map(
                    (item) => (
                      <tr
                        key={
                          item.funcionarioId
                        }
                        className="
                          hover:bg-slate-50
                          dark:hover:bg-slate-800/50
                        "
                      >
                        <td className="px-4 py-3">
                          <p className="font-bold">
                            {item.nome}
                          </p>

                          {(item.cargo ||
                            item.departamento) && (
                            <p
                              className="
                                text-xs
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {[
                                item.cargo,
                                item.departamento,
                              ]
                                .filter(Boolean)
                                .join(" • ")}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatarNumero(
                            item.leads
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatarNumero(
                            item.conversoes
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatarNumero(
                            item.matriculas
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-bold">
                          {Number(
                            item.taxaConversao ||
                              0
                          ).toFixed(1)}
                          %
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatarMoeda(
                            item.valorVendido
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {formatarMoeda(
                            item.valorRecebido
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABAS QUE SERÃO DETALHADAS */}

        {(aba === "cursos" ||
          aba === "matriculas" ||
          aba === "leads") && (
          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-8
              text-center
              shadow-sm
              dark:border-slate-700
              dark:bg-slate-900
            "
          >
            <h2
              className="
                font-black
                text-slate-900
                dark:text-white
              "
            >
              Relatório de{" "}
              {aba === "cursos"
                ? "cursos"
                : aba === "leads"
                  ? "leads"
                  : "matrículas"}
            </h2>

            <p
              className="
                mt-2
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              O detalhamento desta visão
              será alimentado pela mesma
              base de dados do relatório
              comercial.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}