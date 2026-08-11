import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    Prisma,
    StatusMatricula,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
    status: number;
    codigo?: string;

    constructor(
        status: number,
        mensagem: string,
        codigo?: string
    ) {
        super(mensagem);

        this.name = "ErroHttp";
        this.status = status;
        this.codigo = codigo;
    }
}

const STATUS_MATRICULAS_VALIDAS:
    StatusMatricula[] = [
        StatusMatricula.ATIVA,
        StatusMatricula.A_INICIAR,
        StatusMatricula.CONCLUIDA,
    ];

function numeroSeguro(
    valor: unknown
) {
    const numero =
        Number(valor ?? 0);

    return Number.isFinite(numero)
        ? numero
        : 0;
}

function arredondar(
    valor: number,
    casas = 2
) {
    const fator =
        10 ** casas;

    return (
        Math.round(
            (valor +
                Number.EPSILON) *
            fator
        ) / fator
    );
}

function inteiroPositivoOuNull(
    valor: string | null
) {
    if (!valor) {
        return null;
    }

    const numero =
        Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {
        return null;
    }

    return numero;
}

function dataInicio(
    valor: string | null
) {
    if (!valor) {
        return null;
    }

    const partes =
        valor.split("-").map(Number);

    if (
        partes.length !== 3 ||
        !partes[0] ||
        !partes[1] ||
        !partes[2]
    ) {
        return null;
    }

    const [
        ano,
        mes,
        dia,
    ] = partes;

    const data =
        new Date(
            Date.UTC(
                ano,
                mes - 1,
                dia,
                0,
                0,
                0,
                0
            )
        );

    return Number.isNaN(
        data.getTime()
    )
        ? null
        : data;
}

function dataFim(
    valor: string | null
) {
    if (!valor) {
        return null;
    }

    const partes =
        valor.split("-").map(Number);

    if (
        partes.length !== 3 ||
        !partes[0] ||
        !partes[1] ||
        !partes[2]
    ) {
        return null;
    }

    const [
        ano,
        mes,
        dia,
    ] = partes;

    const data =
        new Date(
            Date.UTC(
                ano,
                mes - 1,
                dia,
                23,
                59,
                59,
                999
            )
        );

    return Number.isNaN(
        data.getTime()
    )
        ? null
        : data;
}

function calcularValorVenda(
    matricula: {
        valorMatricula:
        | Prisma.Decimal
        | number
        | string
        | null;

        valorMensalidade:
        | Prisma.Decimal
        | number
        | string
        | null;

        quantidadeParcelas:
        | number
        | null;

        quantidadeMensalidades:
        | number
        | null;
    }
) {
    const valorMatricula =
        numeroSeguro(
            matricula.valorMatricula
        );

    const valorMensalidade =
        numeroSeguro(
            matricula.valorMensalidade
        );

    const quantidade =
        Math.max(
            0,
            Math.trunc(
                numeroSeguro(
                    matricula
                        .quantidadeMensalidades ??
                    matricula
                        .quantidadeParcelas ??
                    0
                )
            )
        );

    return arredondar(
        valorMatricula +
        valorMensalidade *
        quantidade
    );
}

function dataComercialMatricula(
    matricula: {
        confirmadaEm: Date | null;
        createdAt: Date;
    }
) {
    return (
        matricula.confirmadaEm ??
        matricula.createdAt
    );
}

function estaNoPeriodo(
    data: Date,
    inicio: Date,
    fim: Date
) {
    const tempo =
        data.getTime();

    return (
        tempo >=
        inicio.getTime() &&
        tempo <=
        fim.getTime()
    );
}

function respostaErro(
    error: unknown
) {
    if (
        error instanceof ErroHttp
    ) {
        return NextResponse.json(
            {
                error:
                    error.message,

                codigo:
                    error.codigo,
            },
            {
                status:
                    error.status,
            }
        );
    }

    console.error(
        "Erro na API de relatórios comerciais:",
        error
    );

    return NextResponse.json(
        {
            error:
                "Não foi possível carregar os relatórios comerciais.",
        },
        {
            status: 500,
        }
    );
}

export async function GET(
    request: NextRequest
) {
    try {
        /*
         * AUTENTICAÇÃO
         */

        const user =
            await getUserFromToken();

        if (!user) {
            throw new ErroHttp(
                401,
                "Usuário não autenticado.",
                "NAO_AUTENTICADO"
            );
        }

        /*
         * PERMISSÃO
         */

        const permitido =
            await usuarioPossuiPermissao(
                user,
                "comercial.relatorios.ver"
            );

        if (!permitido) {
            throw new ErroHttp(
                403,
                "Você não possui permissão para visualizar relatórios comerciais.",
                "SEM_PERMISSAO"
            );
        }

        const instituicaoId =
            Number(
                user.instituicaoId
            );

        if (
            !Number.isInteger(
                instituicaoId
            ) ||
            instituicaoId <= 0
        ) {
            throw new ErroHttp(
                403,
                "O usuário não está vinculado a uma instituição válida.",
                "INSTITUICAO_INVALIDA"
            );
        }

        /*
         * FILTROS
         */

        const searchParams =
            request.nextUrl
                .searchParams;

        const dataInicialTexto =
            searchParams.get(
                "dataInicial"
            );

        const dataFinalTexto =
            searchParams.get(
                "dataFinal"
            );

        const inicio =
            dataInicio(
                dataInicialTexto
            );

        const fim =
            dataFim(
                dataFinalTexto
            );

        if (
            !inicio ||
            !fim
        ) {
            throw new ErroHttp(
                400,
                "Informe um período válido para o relatório.",
                "PERIODO_INVALIDO"
            );
        }

        if (
            inicio.getTime() >
            fim.getTime()
        ) {
            throw new ErroHttp(
                400,
                "A data inicial não pode ser posterior à data final.",
                "PERIODO_INVALIDO"
            );
        }

        const vendedorId =
            inteiroPositivoOuNull(
                searchParams.get(
                    "vendedorId"
                )
            );

        const cursoId =
            inteiroPositivoOuNull(
                searchParams.get(
                    "cursoId"
                )
            );

        const poloId =
            inteiroPositivoOuNull(
                searchParams.get(
                    "poloId"
                )
            );

        /*
         * VENDEDORES ELEGÍVEIS
         *
         * A fonte oficial é Cargo.
         * Plano de comissão NÃO é requisito.
         */

        const cargosVendedor =
            await prisma.cargo.findMany({
                where: {
                    instituicaoId,
                    ativo: true,

                    nomeNormalizado:
                        "vendedor",
                },

                select: {
                    id: true,
                },
            });

        const cargoIds =
            cargosVendedor.map(
                (cargo) =>
                    cargo.id
            );

        const vendedores =
            cargoIds.length > 0
                ? await prisma
                    .funcionario
                    .findMany({
                        where: {
                            instituicaoId,
                            ativo: true,

                            statusFuncionario:
                                "ATIVO",

                            cargoId: {
                                in: cargoIds,
                            },

                            ...(vendedorId
                                ? {
                                    id:
                                        vendedorId,
                                }
                                : {}),
                        },

                        select: {
                            id: true,
                            nome: true,
                            cargo: true,

                            departamento: {
                                select: {
                                    nome: true,
                                },
                            },
                        },

                        orderBy: {
                            nome: "asc",
                        },
                    })
                : [];

        /*
         * CURSOS E POLOS
         */

        const [
            cursos,
            polos,
        ] =
            await Promise.all([
                prisma.curso.findMany({
                    where: {
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        nome: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                }),

                prisma.polo.findMany({
                    where: {
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        nome: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                }),
            ]);

        /*
         * MATRÍCULAS DO PERÍODO
         */

        const whereMatriculas:
            Prisma.MatriculaWhereInput =
        {
            instituicaoId,

            ...(vendedorId
                ? {
                    vendedorResponsavelId:
                        vendedorId,
                }
                : {}),

            ...(cursoId
                ? {
                    cursoId,
                }
                : {}),

            ...(poloId
                ? {
                    poloId,
                }
                : {}),

            OR: [
                {
                    confirmadaEm: {
                        gte: inicio,
                        lte: fim,
                    },
                },

                {
                    confirmadaEm:
                        null,

                    createdAt: {
                        gte: inicio,
                        lte: fim,
                    },
                },
            ],
        };

        const matriculasPeriodo =
            await prisma
                .matricula
                .findMany({
                    where:
                        whereMatriculas,

                    select: {
                        id: true,

                        numeroMatricula: true,
                        numeroMatriculaLegado: true,

                        createdAt: true,
                        confirmadaEm: true,

                        cursoId: true,
                        poloId: true,

                        status: true,

                        vendedorResponsavelId:
                            true,

                        vendedorResponsavelNomeSnapshot:
                            true,

                        leadOrigemId: true,

                        origemComercial: true,

                        valorMatricula: true,

                        valorMensalidade: true,

                        quantidadeParcelas: true,

                        quantidadeMensalidades: true,

                        aluno: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },

                        curso: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },

                        polo: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },

                        vendedorResponsavel: {
                            select: {
                                id: true,
                                nome: true,
                            },
                        },

                        leadOrigem: {
                            select: {
                                id: true,
                                origem: true,
                            },
                        },
                    },
                });

        const matriculasValidas =
            matriculasPeriodo.filter(
                (matricula) =>
                    STATUS_MATRICULAS_VALIDAS.includes(
                        matricula.status
                    )
            );

        const matriculasCanceladas =
            matriculasPeriodo.filter(
                (matricula) =>
                    matricula.status ===
                    StatusMatricula.CANCELADA
            );

        /*
         * LEADS RECEBIDOS
         *
         * Curso e polo não existem diretamente
         * no Lead. Por isso, esses dois filtros
         * são aplicados às matrículas/vendas.
         *
         * Vendedor pode ser aplicado ao Lead
         * porque existe responsavelFuncionarioId.
         */

        const leadsPeriodo =
            await prisma.lead.findMany({
                where: {
                    instituicaoGestoraId:
                        instituicaoId,

                    tipo:
                        "INSTITUICAO",

                    createdAt: {
                        gte: inicio,
                        lte: fim,
                    },

                    ...(vendedorId
                        ? {
                            responsavelFuncionarioId:
                                vendedorId,
                        }
                        : {}),
                },

                select: {
                    id: true,
                    nome: true,
                    email: true,
                    telefone: true,
                    origem: true,
                    interesse: true,
                    status: true,
                    createdAt: true,

                    responsavelFuncionarioId:
                        true,

                    responsavelNomeSnapshot:
                        true,

                    responsavelFuncionario: {
                        select: {
                            id: true,
                            nome: true,
                        },
                    },

                    matriculaConvertida: {
                        select: {
                            id: true,
                            status: true,
                            confirmadaEm: true,

                            cursoId: true,
                            poloId: true,

                            vendedorResponsavelId:
                                true,

                            curso: {
                                select: {
                                    id: true,
                                    nome: true,
                                },
                            },

                            polo: {
                                select: {
                                    id: true,
                                    nome: true,
                                },
                            },
                        },
                    },
                },

                orderBy: {
                    createdAt: "desc",
                },
            });

        /*
     * LEADS CONVERTIDOS
     *
     * A taxa considera os leads recebidos
     * dentro do período selecionado.
     *
     * A matrícula vinculada ao próprio lead
     * confirma a conversão.
     */

        const leadEstaConvertidoNoEscopo = (
            lead: (typeof leadsPeriodo)[number]
        ) => {
            const matricula =
                lead.matriculaConvertida;

            if (!matricula) {
                return false;
            }

            if (
                !STATUS_MATRICULAS_VALIDAS.includes(
                    matricula.status
                )
            ) {
                return false;
            }

            if (
                vendedorId &&
                matricula.vendedorResponsavelId !==
                vendedorId
            ) {
                return false;
            }

            if (
                cursoId &&
                matricula.cursoId !==
                cursoId
            ) {
                return false;
            }

            if (
                poloId &&
                matricula.poloId !==
                poloId
            ) {
                return false;
            }

            return true;
        };

        const leadsRecebidos =
            leadsPeriodo.length;

        const leadsConvertidos =
            leadsPeriodo.filter(
                leadEstaConvertidoNoEscopo
            ).length;

        const taxaConversao =
            leadsRecebidos > 0
                ? arredondar(
                    (
                        leadsConvertidos /
                        leadsRecebidos
                    ) * 100,
                    1
                )
                : 0;

        /*
         * VALOR VENDIDO
         */

        const valorVendido =
            arredondar(
                matriculasValidas.reduce(
                    (
                        total,
                        matricula
                    ) =>
                        total +
                        calcularValorVenda(
                            matricula
                        ),
                    0
                )
            );

        /*
         * PAGAMENTOS DE MATRÍCULA
         *
         * Aqui consideramos Pagamento ligado
         * a lançamento do tipo MATRÍCULA.
         *
         * Assim mensalidades pagas posteriormente
         * não entram como "recebido no ato".
         */

        const pagamentosPeriodo =
            await prisma
                .pagamento
                .findMany({
                    where: {
                        instituicaoId,

                        pagoEm: {
                            gte: inicio,
                            lte: fim,
                        },

                        observacao:
                            "Pagamento registrado no ato da matrícula.",
                    },

                    select: {
                        id: true,
                        valorPago: true,
                        pagoEm: true,

                        lancamento: {
                            select: {
                                tipo: true,

                                matricula: {
                                    select: {
                                        id: true,
                                        instituicaoId:
                                            true,

                                        cursoId: true,
                                        poloId: true,

                                        vendedorResponsavelId:
                                            true,

                                        status: true,
                                    },
                                },
                            },
                        },
                    },
                });

        const pagamentosMatricula =
            pagamentosPeriodo.filter(
                (pagamento) => {
                    const lancamento =
                        pagamento.lancamento;

                    const matricula =
                        lancamento
                            ?.matricula;

                    if (
                        lancamento?.tipo !==
                        "MATRICULA"
                    ) {
                        return false;
                    }

                    if (!matricula) {
                        return false;
                    }

                    if (
                        matricula.instituicaoId !==
                        instituicaoId
                    ) {
                        return false;
                    }

                    if (
                        vendedorId &&
                        matricula
                            .vendedorResponsavelId !==
                        vendedorId
                    ) {
                        return false;
                    }

                    if (
                        cursoId &&
                        matricula.cursoId !==
                        cursoId
                    ) {
                        return false;
                    }

                    if (
                        poloId &&
                        matricula.poloId !==
                        poloId
                    ) {
                        return false;
                    }

                    return true;
                }
            );

        const valorRecebido =
            arredondar(
                pagamentosMatricula.reduce(
                    (
                        total,
                        pagamento
                    ) =>
                        total +
                        numeroSeguro(
                            pagamento.valorPago
                        ),
                    0
                )
            );

        /*
         * TICKET MÉDIO
         */

        const quantidadeMatriculas =
            matriculasValidas.length;

        const ticketMedio =
            quantidadeMatriculas > 0
                ? arredondar(
                    valorVendido /
                    quantidadeMatriculas
                )
                : 0;

        /*
         * DESEMPENHO POR VENDEDOR
         */

        const desempenhoVendedores =
            vendedores.map(
                (vendedor) => {
                    const leadsDoVendedor =
                        leadsPeriodo.filter(
                            (lead) =>
                                lead
                                    .responsavelFuncionarioId ===
                                vendedor.id
                        );

                    const matriculasDoVendedor =
                        matriculasValidas.filter(
                            (matricula) =>
                                matricula
                                    .vendedorResponsavelId ===
                                vendedor.id
                        );

                    const pagamentosDoVendedor =
                        pagamentosMatricula.filter(
                            (pagamento) =>
                                pagamento
                                    .lancamento
                                    ?.matricula
                                    ?.vendedorResponsavelId ===
                                vendedor.id
                        );

                    const valorVendidoVendedor =
                        arredondar(
                            matriculasDoVendedor.reduce(
                                (
                                    total,
                                    matricula
                                ) =>
                                    total +
                                    calcularValorVenda(
                                        matricula
                                    ),
                                0
                            )
                        );

                    const valorRecebidoVendedor =
                        arredondar(
                            pagamentosDoVendedor.reduce(
                                (
                                    total,
                                    pagamento
                                ) =>
                                    total +
                                    numeroSeguro(
                                        pagamento
                                            .valorPago
                                    ),
                                0
                            )
                        );

                    const conversoes =
                        leadsDoVendedor.filter(
                            (lead) => {
                                const matricula =
                                    lead.matriculaConvertida;

                                if (!matricula) {
                                    return false;
                                }

                                if (
                                    !STATUS_MATRICULAS_VALIDAS.includes(
                                        matricula.status
                                    )
                                ) {
                                    return false;
                                }

                                if (
                                    matricula.vendedorResponsavelId !==
                                    vendedor.id
                                ) {
                                    return false;
                                }

                                if (
                                    cursoId &&
                                    matricula.cursoId !==
                                    cursoId
                                ) {
                                    return false;
                                }

                                if (
                                    poloId &&
                                    matricula.poloId !==
                                    poloId
                                ) {
                                    return false;
                                }

                                return true;
                            }
                        ).length;

                    const taxa =
                        leadsDoVendedor.length >
                            0
                            ? arredondar(
                                (
                                    conversoes /
                                    leadsDoVendedor
                                        .length
                                ) * 100,
                                1
                            )
                            : 0;

                    return {
                        funcionarioId:
                            vendedor.id,

                        nome:
                            vendedor.nome,

                        cargo:
                            vendedor.cargo,

                        departamento:
                            vendedor
                                .departamento
                                ?.nome ??
                            null,

                        leads:
                            leadsDoVendedor
                                .length,

                        conversoes,

                        matriculas:
                            matriculasDoVendedor
                                .length,

                        taxaConversao:
                            taxa,

                        valorVendido:
                            valorVendidoVendedor,

                        valorRecebido:
                            valorRecebidoVendedor,
                    };
                }
            );

        /*
         * ORDENAÇÃO
         *
         * Quem vendeu mais aparece primeiro.
         * Empate: maior número de matrículas.
         */

        desempenhoVendedores.sort(
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

                if (
                    b.matriculas !==
                    a.matriculas
                ) {
                    return (
                        b.matriculas -
                        a.matriculas
                    );
                }

                return a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                );
            }
        );

        /*
         * RESPOSTA
         */

        return NextResponse.json(
            {
                resumo: {
                    leadsRecebidos,

                    leadsConvertidos,

                    taxaConversao,

                    matriculas:
                        quantidadeMatriculas,

                    valorVendido,

                    valorRecebido,

                    ticketMedio,

                    cancelamentos:
                        matriculasCanceladas
                            .length,
                },

                leads:
                    leadsPeriodo.map(
                        (lead) => {
                            const convertido =
                                leadEstaConvertidoNoEscopo(
                                    lead
                                );

                            const matricula =
                                lead.matriculaConvertida;

                            return {
                                id:
                                    lead.id,

                                nome:
                                    lead.nome,

                                email:
                                    lead.email,

                                telefone:
                                    lead.telefone,

                                origem:
                                    lead.origem,

                                interesse:
                                    lead.interesse,

                                status:
                                    lead.status,

                                recebidoEm:
                                    lead.createdAt,

                                responsavelId:
                                    lead.responsavelFuncionarioId,

                                responsavelNome:
                                    lead
                                        .responsavelFuncionario
                                        ?.nome ??
                                    lead
                                        .responsavelNomeSnapshot ??
                                    null,

                                convertido,

                                matriculaId:
                                    convertido &&
                                        matricula
                                        ? matricula.id
                                        : null,

                                convertidoEm:
                                    convertido &&
                                        matricula
                                        ? matricula
                                            .confirmadaEm
                                        : null,

                                cursoId:
                                    convertido &&
                                        matricula
                                        ? matricula
                                            .cursoId
                                        : null,

                                cursoNome:
                                    convertido &&
                                        matricula
                                        ? matricula
                                            .curso?.nome ??
                                        null
                                        : null,

                                poloId:
                                    convertido &&
                                        matricula
                                        ? matricula
                                            .poloId
                                        : null,

                                poloNome:
                                    convertido &&
                                        matricula
                                        ? matricula
                                            .polo?.nome ??
                                        null
                                        : null,
                            };
                        }
                    ),

                matriculas:
                    matriculasPeriodo.map(
                        (matricula) => {
                            const valorVendidoMatricula =
                                calcularValorVenda(
                                    matricula
                                );

                            const pagamentosDaMatricula =
                                pagamentosMatricula.filter(
                                    (pagamento) =>
                                        pagamento
                                            .lancamento
                                            ?.matricula
                                            ?.id ===
                                        matricula.id
                                );

                            const valorRecebidoMatricula =
                                arredondar(
                                    pagamentosDaMatricula.reduce(
                                        (
                                            total,
                                            pagamento
                                        ) =>
                                            total +
                                            numeroSeguro(
                                                pagamento.valorPago
                                            ),
                                        0
                                    )
                                );

                            return {
                                id:
                                    matricula.id,

                                numero:
                                    matricula
                                        .numeroMatricula ||
                                    matricula
                                        .numeroMatriculaLegado ||
                                    String(
                                        matricula.id
                                    ),

                                alunoId:
                                    matricula.aluno.id,

                                alunoNome:
                                    matricula.aluno.nome,

                                dataMatricula:
                                    dataComercialMatricula(
                                        matricula
                                    ),

                                status:
                                    matricula.status,

                                cursoId:
                                    matricula.cursoId,

                                cursoNome:
                                    matricula.curso
                                        ?.nome ??
                                    null,

                                poloId:
                                    matricula.poloId,

                                poloNome:
                                    matricula.polo
                                        ?.nome ??
                                    null,

                                vendedorId:
                                    matricula
                                        .vendedorResponsavelId,

                                vendedorNome:
                                    matricula
                                        .vendedorResponsavel
                                        ?.nome ??
                                    matricula
                                        .vendedorResponsavelNomeSnapshot ??
                                    null,

                                leadId:
                                    matricula
                                        .leadOrigemId,

                                origem:
                                    matricula
                                        .leadOrigem
                                        ?.origem ??
                                    matricula
                                        .origemComercial ??
                                    null,

                                valorMatricula:
                                    numeroSeguro(
                                        matricula
                                            .valorMatricula
                                    ),

                                valorMensalidade:
                                    numeroSeguro(
                                        matricula
                                            .valorMensalidade
                                    ),

                                quantidadeMensalidades:
                                    Math.max(
                                        0,
                                        Math.trunc(
                                            numeroSeguro(
                                                matricula
                                                    .quantidadeMensalidades ??
                                                matricula
                                                    .quantidadeParcelas ??
                                                0
                                            )
                                        )
                                    ),

                                valorVendido:
                                    valorVendidoMatricula,

                                valorRecebido:
                                    valorRecebidoMatricula,
                            };
                        }
                    ),

                vendedores:
                    desempenhoVendedores,

                filtros: {
                    vendedores:
                        vendedores.map(
                            (vendedor) => ({
                                id:
                                    vendedor.id,

                                nome:
                                    vendedor.nome,
                            })
                        ),

                    cursos:
                        cursos.map(
                            (curso) => ({
                                id:
                                    curso.id,

                                nome:
                                    curso.nome,
                            })
                        ),

                    polos:
                        polos.map(
                            (polo) => ({
                                id:
                                    polo.id,

                                nome:
                                    polo.nome,
                            })
                        ),
                },

                periodo: {
                    dataInicial:
                        dataInicialTexto,

                    dataFinal:
                        dataFinalTexto,
                },
            },
            {
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        return respostaErro(
            error
        );
    }
}