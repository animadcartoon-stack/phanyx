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

type LeadRelatorio = {
    id: number;
    nome: string;
    email: string | null;
    telefone: string | null;
    origem: string;
    interesse: string | null;
    status: string;
    recebidoEm: string;

    responsavelId:
    | number
    | null;

    responsavelNome:
    | string
    | null;

    convertido: boolean;

    matriculaId:
    | number
    | null;

    convertidoEm:
    | string
    | null;

    cursoId:
    | number
    | null;

    cursoNome:
    | string
    | null;

    poloId:
    | number
    | null;

    poloNome:
    | string
    | null;
};

type MatriculaRelatorio = {
    id: number;
    numero: string;

    alunoId: number;
    alunoNome: string;

    dataMatricula: string;

    status: string;

    cursoId:
    | number
    | null;

    cursoNome:
    | string
    | null;

    poloId:
    | number
    | null;

    poloNome:
    | string
    | null;

    vendedorId:
    | number
    | null;

    vendedorNome:
    | string
    | null;

    leadId:
    | number
    | null;

    origem:
    | string
    | null;

    valorMatricula: number;
    valorMensalidade: number;
    quantidadeMensalidades:
    number;

    contabilizadaComoVenda: boolean;
    valorContratado: number;

    valorVendido: number;
    valorRecebido: number;
};

type CursoRelatorio = {
    cursoId: number | null;
    cursoNome: string;

    matriculas: number;
    leadsConvertidos: number;
    cancelamentos: number;

    valorVendido: number;
    valorRecebido: number;
    ticketMedio: number;

    participacao: number;
};

type OpcaoFiltro = {
    id: number;
    nome: string;
};

type RelatorioResponse = {
    resumo: ResumoComercial;

    vendedores:
    VendedorRelatorio[];

    leads:
    LeadRelatorio[];

    matriculas:
    MatriculaRelatorio[];

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

function formatarData(
    valor:
        | string
        | null
        | undefined
) {
    if (!valor) {
        return "-";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return "-";
    }

    return data.toLocaleDateString(
        "pt-BR"
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

            leads: [],

            matriculas: [],

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

                    leads:
                        Array.isArray(
                            json?.leads
                        )
                            ? json.leads
                            : [],

                    matriculas:
                        Array.isArray(
                            json?.matriculas
                        )
                            ? json.matriculas
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

    const cursosRelatorio =
        useMemo<CursoRelatorio[]>(() => {
            const mapa =
                new Map<
                    string,
                    CursoRelatorio
                >();

            const statusValidos =
                new Set([
                    "ATIVA",
                    "A_INICIAR",
                    "CONCLUIDA",
                ]);

            const matriculasValidas =
                dados.matriculas.filter(
                    (matricula) =>
                        statusValidos.has(
                            String(
                                matricula.status
                            ).toUpperCase()
                        )
                );

            const totalMatriculasValidas =
                matriculasValidas.length;

            for (
                const matricula of
                dados.matriculas
            ) {
                const chave =
                    matricula.cursoId != null
                        ? String(
                            matricula.cursoId
                        )
                        : "SEM_CURSO";

                if (!mapa.has(chave)) {
                    mapa.set(chave, {
                        cursoId:
                            matricula.cursoId,

                        cursoNome:
                            matricula.cursoNome ||
                            "Sem curso informado",

                        matriculas: 0,

                        leadsConvertidos: 0,

                        cancelamentos: 0,

                        valorVendido: 0,

                        valorRecebido: 0,

                        ticketMedio: 0,

                        participacao: 0,
                    });
                }

                const item =
                    mapa.get(chave)!;

                const status =
                    String(
                        matricula.status
                    ).toUpperCase();

                if (
                    statusValidos.has(status)
                ) {
                    item.matriculas += 1;

                    item.valorVendido +=
                        Number(
                            matricula.valorVendido ||
                            0
                        );

                    item.valorRecebido +=
                        Number(
                            matricula.valorRecebido ||
                            0
                        );

                    if (
                        matricula.leadId != null
                    ) {
                        item.leadsConvertidos +=
                            1;
                    }
                }

                if (
                    status === "CANCELADA"
                ) {
                    item.cancelamentos += 1;
                }
            }

            const resultado =
                Array.from(
                    mapa.values()
                ).map((item) => {
                    const ticketMedio =
                        item.matriculas > 0
                            ? item.valorVendido /
                            item.matriculas
                            : 0;

                    const participacao =
                        totalMatriculasValidas >
                            0
                            ? (
                                item.matriculas /
                                totalMatriculasValidas
                            ) * 100
                            : 0;

                    return {
                        ...item,

                        valorVendido:
                            Number(
                                item.valorVendido.toFixed(
                                    2
                                )
                            ),

                        valorRecebido:
                            Number(
                                item.valorRecebido.toFixed(
                                    2
                                )
                            ),

                        ticketMedio:
                            Number(
                                ticketMedio.toFixed(
                                    2
                                )
                            ),

                        participacao:
                            Number(
                                participacao.toFixed(
                                    1
                                )
                            ),
                    };
                });

            resultado.sort(
                (a, b) => {
                    if (
                        b.valorVendido !==
                        a.valorVendido
                    ) {
                        return (
                            b.valorVendido -
                            a.valorVendido
                        );
                    }

                    return (
                        b.matriculas -
                        a.matriculas
                    );
                }
            );

            return resultado;
        }, [dados.matriculas]);

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
    phanyx-comercial-relatorios-page
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

                            <CardIndicador
                                titulo="Matrículas"
                                valor={formatarNumero(
                                    dados.resumo.matriculas
                                )}
                                descricao="Ativas, a iniciar ou concluídas"
                            />

                            <CardIndicador
                                titulo="Valor vendido"
                                valor={formatarMoeda(
                                    dados.resumo.valorVendido
                                )}
                                descricao="Matrícula e mensalidades das vendas válidas"
                            />

                            <CardIndicador
                                titulo="Recebido no ato"
                                valor={formatarMoeda(
                                    dados.resumo.valorRecebido
                                )}
                                descricao="Pagamentos registrados no ato da matrícula"
                            />

                            <CardIndicador
                                titulo="Ticket médio"
                                valor={formatarMoeda(
                                    dados.resumo.ticketMedio
                                )}
                                descricao="Valor vendido dividido pelas matrículas válidas"
                            />

                            <CardIndicador
                                titulo="Cancelamentos"
                                valor={formatarNumero(
                                    dados.resumo.cancelamentos
                                )}
                                descricao="Matrículas do período atualmente canceladas"
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

                {/* LEADS */}

                {aba === "leads" && (
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
                                Leads recebidos
                            </h2>

                            <p
                                className="
          mt-1
          text-sm
          text-slate-500
          dark:text-slate-400
        "
                            >
                                Leads recebidos no período e
                                sua situação comercial. Ao
                                filtrar por curso ou polo, a
                                conversão considera a matrícula
                                vinculada correspondente.
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
                                            Lead
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Contato
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Origem
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Responsável
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Recebido em
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Conversão
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
                                        dados.leads.length ===
                                        0 && (
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
                                                    Nenhum lead foi
                                                    encontrado neste
                                                    período.
                                                </td>
                                            </tr>
                                        )}

                                    {dados.leads.map(
                                        (lead) => (
                                            <tr
                                                key={lead.id}
                                                className="
                  hover:bg-slate-50
                  dark:hover:bg-slate-800/50
                "
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-bold">
                                                        {lead.nome}
                                                    </p>

                                                    {lead.interesse && (
                                                        <p
                                                            className="
                        mt-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                                                        >
                                                            {lead.interesse}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <p>
                                                        {lead.telefone ||
                                                            "-"}
                                                    </p>

                                                    <p
                                                        className="
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                                                    >
                                                        {lead.email ||
                                                            "-"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {lead.origem ||
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {lead.responsavelNome ||
                                                        "Sem responsável"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className="
                      rounded-full
                      border
                      border-slate-200
                      bg-slate-50
                      px-2.5
                      py-1
                      text-xs
                      font-bold
                      text-slate-700
                      dark:border-slate-700
                      dark:bg-slate-800
                      dark:text-slate-200
                    "
                                                    >
                                                        {lead.status}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {formatarData(
                                                        lead.recebidoEm
                                                    )}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {lead.convertido ? (
                                                        <div>
                                                            <p
                                                                className="
                          font-bold
                          text-emerald-700
                          dark:text-emerald-400
                        "
                                                            >
                                                                Convertido
                                                            </p>

                                                            {(lead.cursoNome ||
                                                                lead.poloNome) && (
                                                                    <p
                                                                        className="
            mt-1
            text-xs
            text-slate-500
            dark:text-slate-400
        "
                                                                    >
                                                                        {[
                                                                            lead.cursoNome,
                                                                            lead.poloNome,
                                                                        ]
                                                                            .filter(Boolean)
                                                                            .join(" • ")}
                                                                    </p>
                                                                )}

                                                            {lead.convertidoEm && (
                                                                <p
                                                                    className="
                            text-xs
                            text-slate-500
                            dark:text-slate-400
                          "
                                                                >
                                                                    {formatarData(
                                                                        lead.convertidoEm
                                                                    )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className="
                        font-semibold
                        text-slate-500
                        dark:text-slate-400
                      "
                                                        >
                                                            Não convertido
                                                        </span>
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

                {/* MATRÍCULAS */}

                {aba === "matriculas" && (
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
                                Matrículas do período
                            </h2>

                            <p
                                className="
          mt-1
          text-sm
          text-slate-500
          dark:text-slate-400
        "
                            >
                                Matrículas realizadas no
                                período selecionado, com
                                vendedor, origem e valores
                                comerciais.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead
                                    className="
            bg-slate-50
            dark:bg-slate-950
          "
                                >
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold">
                                            Matrícula
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Aluno
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Curso / Polo
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Vendedor
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Origem
                                        </th>

                                        <th className="px-4 py-3 text-left font-bold">
                                            Status
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
                                        dados.matriculas
                                            .length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="
                    px-4
                    py-10
                    text-center
                    text-slate-500
                    dark:text-slate-400
                  "
                                                >
                                                    Nenhuma matrícula
                                                    encontrada no período.
                                                </td>
                                            </tr>
                                        )}

                                    {dados.matriculas.map(
                                        (matricula) => (
                                            <tr
                                                key={matricula.id}
                                                className="
                  hover:bg-slate-50
                  dark:hover:bg-slate-800/50
                "
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-bold">
                                                        {
                                                            matricula.numero
                                                        }
                                                    </p>

                                                    <p
                                                        className="
                      mt-1
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                                                    >
                                                        {formatarData(
                                                            matricula
                                                                .dataMatricula
                                                        )}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 font-bold">
                                                    {
                                                        matricula
                                                            .alunoNome
                                                    }
                                                </td>

                                                <td className="px-4 py-3">
                                                    <p className="font-semibold">
                                                        {matricula
                                                            .cursoNome ||
                                                            "Sem curso"}
                                                    </p>

                                                    <p
                                                        className="
                      mt-1
                      text-xs
                      text-slate-500
                      dark:text-slate-400
                    "
                                                    >
                                                        {matricula
                                                            .poloNome ||
                                                            "Sem polo"}
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3">
                                                    {matricula
                                                        .vendedorNome ||
                                                        "Não informado"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    {matricula.origem ||
                                                        "-"}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span
                                                        className="
                      inline-flex
                      rounded-full
                      border
                      border-slate-300
                      bg-slate-50
                      px-2.5
                      py-1
                      text-xs
                      font-bold
                      text-slate-700
                      dark:border-slate-700
                      dark:bg-slate-800
                      dark:text-slate-200
                    "
                                                    >
                                                        {matricula.status}
                                                    </span>
                                                </td>

                                                <td
                                                    className="
        whitespace-nowrap
        px-4
        py-3
        text-right
    "
                                                >
                                                    {matricula.contabilizadaComoVenda ? (
                                                        <span className="font-bold">
                                                            {formatarMoeda(
                                                                matricula.valorVendido
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <div>
                                                            <p
                                                                className="
                    text-xs
                    font-bold
                    text-slate-500
                    dark:text-slate-400
                "
                                                            >
                                                                Não contabilizada
                                                            </p>

                                                            <p
                                                                className="
                    mt-1
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                "
                                                            >
                                                                Previsto:{" "}
                                                                {formatarMoeda(
                                                                    matricula.valorContratado
                                                                )}
                                                            </p>
                                                        </div>
                                                    )}
                                                </td>

                                                <td
                                                    className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-right
                  "
                                                >
                                                    {formatarMoeda(
                                                        matricula
                                                            .valorRecebido
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

                {/* CURSOS */}

                {aba === "cursos" && (
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
                                Desempenho por curso
                            </h2>

                            <p
                                className="
          mt-1
          text-sm
          text-slate-500
          dark:text-slate-400
        "
                            >
                                Resultado comercial dos
                                cursos no período
                                selecionado.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead
                                    className="
            bg-slate-50
            dark:bg-slate-950
          "
                                >
                                    <tr>
                                        <th className="px-4 py-3 text-left font-bold">
                                            Curso
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Matrículas
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Leads convertidos
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Participação
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Vendido
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Recebido
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Ticket médio
                                        </th>

                                        <th className="px-4 py-3 text-right font-bold">
                                            Cancelamentos
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
                                        cursosRelatorio.length ===
                                        0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="
                    px-4
                    py-10
                    text-center
                    text-slate-500
                    dark:text-slate-400
                  "
                                                >
                                                    Nenhum resultado
                                                    encontrado por curso
                                                    neste período.
                                                </td>
                                            </tr>
                                        )}

                                    {cursosRelatorio.map(
                                        (curso) => (
                                            <tr
                                                key={
                                                    curso.cursoId ??
                                                    "sem-curso"
                                                }
                                                className="
                  hover:bg-slate-50
                  dark:hover:bg-slate-800/50
                "
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-bold">
                                                        {
                                                            curso.cursoNome
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-4 py-3 text-right font-bold">
                                                    {formatarNumero(
                                                        curso.matriculas
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {formatarNumero(
                                                        curso
                                                            .leadsConvertidos
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right font-bold">
                                                    {curso.participacao.toFixed(
                                                        1
                                                    )}
                                                    %
                                                </td>

                                                <td
                                                    className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-right
                    font-bold
                  "
                                                >
                                                    {formatarMoeda(
                                                        curso.valorVendido
                                                    )}
                                                </td>

                                                <td
                                                    className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-right
                  "
                                                >
                                                    {formatarMoeda(
                                                        curso.valorRecebido
                                                    )}
                                                </td>

                                                <td
                                                    className="
                    whitespace-nowrap
                    px-4
                    py-3
                    text-right
                  "
                                                >
                                                    {formatarMoeda(
                                                        curso.ticketMedio
                                                    )}
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    {formatarNumero(
                                                        curso.cancelamentos
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

            </div>
        </div>
    );
}