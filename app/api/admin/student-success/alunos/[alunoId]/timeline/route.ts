import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    prisma,
} from "@/lib/prisma";

import {
    getUserFromToken,
} from "@/lib/server-auth";

import {
    verificarAcessoStudentSuccess,
} from "@/lib/student-success/verificar-acesso-student-success";

import {
    avaliarEvolucaoIntervencao,
} from "@/lib/student-success/avaliar-evolucao-intervencao";

type ContextoRota = {
    params: {
        alunoId:
        string;
    };
};

type EventoTimeline = {
    id:
    string;

    tipo:
    | "ANALISE_ACADEMICA"
    | "INTERVENCAO_REGISTRADA"
    | "RETORNO_AGENDADO"
    | "INTERVENCAO_ENCERRADA";

    data:
    string;

    /*
     * Eventos acadêmicos não pertencem
     * necessariamente a uma intervenção.
     */
    intervencaoId:
    number | null;

    analiseHistoricoId:
    number | null;

    tipoIntervencao:
    string | null;

    canal:
    string | null;

    status:
    string | null;

    observacao:
    string | null;

    resultado:
    string | null;

    /*
     * Informações exclusivas das
     * fotografias acadêmicas persistidas.
     */
    origemAnalise:
    string | null;

    versaoMotor:
    string | null;

    executadoPor:
    | {
        id:
        number;

        nome:
        string;

        email:
        string | null;
    }
    | null;

    risco: {
        nivel:
        string | null;

        pontuacao:
        number | null;

        pontuacaoBruta:
        number | null;

        maximoDisponivel:
        number | null;

        cobertura:
        number | null;

        confiabilidade:
        string | null;
    } | null;

    indicadores:
    unknown;

    componentes:
    unknown;

    fatoresPrincipais:
    unknown;

    evolucao:
    ReturnType<
        typeof avaliarEvolucaoIntervencao
    > | null;
};

export async function GET(
    request:
        NextRequest,
    contexto:
        ContextoRota
) {
    try {
        const user =
            await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    error:
                        "Não autenticado",
                },
                {
                    status: 401,
                }
            );
        }

        const acesso =
            await verificarAcessoStudentSuccess(
                user,
                "VER"
            );

        if (
            acesso.permitido ===
            false
        ) {
            return NextResponse.json(
                {
                    error:
                        acesso.motivo,
                },
                {
                    status: 403,
                }
            );
        }

        const instituicaoId =
            acesso.instituicaoId;

        const alunoId =
            Number(
                contexto.params
                    .alunoId
            );

        if (
            !Number.isInteger(
                alunoId
            ) ||
            alunoId <= 0
        ) {
            return NextResponse.json(
                {
                    error:
                        "Aluno inválido",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Confirma que o aluno pertence
         * à instituição autorizada.
         */
        const aluno =
            await prisma.aluno
                .findFirst({
                    where: {
                        id:
                            alunoId,

                        instituicaoId,
                    },

                    select: {
                        id:
                            true,

                        nome:
                            true,

                        matricula:
                            true,
                    },
                });

        if (!aluno) {
            return NextResponse.json(
                {
                    error:
                        "Aluno não encontrado",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * =====================================================
         * 1. INTERVENÇÕES
         * =====================================================
         */

        const intervencoes =
            await prisma
                .studentSuccessIntervencao
                .findMany({
                    where: {
                        instituicaoId,

                        alunoId,
                    },

                    orderBy: {
                        criadoEm:
                            "asc",
                    },

                    select: {
                        id:
                            true,

                        tipo:
                            true,

                        canal:
                            true,

                        status:
                            true,

                        observacao:
                            true,

                        resultado:
                            true,

                        retornoEm:
                            true,

                        criadoEm:
                            true,

                        concluidoEm:
                            true,

                        nivelRiscoNoRegistro:
                            true,

                        pontuacaoNoRegistro:
                            true,

                        coberturaNoRegistro:
                            true,

                        confiabilidadeNoRegistro:
                            true,

                        indicadoresNoRegistro:
                            true,

                        nivelRiscoNoEncerramento:
                            true,

                        pontuacaoNoEncerramento:
                            true,

                        coberturaNoEncerramento:
                            true,

                        confiabilidadeNoEncerramento:
                            true,

                        indicadoresNoEncerramento:
                            true,
                    },
                });

        /*
         * =====================================================
         * 2. FOTOGRAFIAS / REANÁLISES ACADÊMICAS
         * =====================================================
         *
         * Aqui entram somente análises realmente
         * persistidas pelo Student Success.
         *
         * Abrir a página não cria evento.
         */

        const analisesAcademicas =
            await prisma
                .studentSuccessAnaliseHistorico
                .findMany({
                    where: {
                        instituicaoId,

                        alunoId,
                    },

                    orderBy: [
                        {
                            analisadoEm:
                                "asc",
                        },

                        {
                            id:
                                "asc",
                        },
                    ],

                    select: {
                        id:
                            true,

                        origem:
                            true,

                        versaoMotor:
                            true,

                        nivelRisco:
                            true,

                        pontuacaoRisco:
                            true,

                        pontuacaoBruta:
                            true,

                        maximoDisponivel:
                            true,

                        coberturaPercentual:
                            true,

                        confiabilidade:
                            true,

                        componentes:
                            true,

                        fatoresPrincipais:
                            true,

                        indicadores:
                            true,

                        analisadoEm:
                            true,

                        executadoPor: {
                            select: {
                                id:
                                    true,

                                nome:
                                    true,

                                email:
                                    true,
                            },
                        },
                    },
                });

        const eventos:
            EventoTimeline[] =
            [];

        /*
         * =====================================================
         * 3. EVENTOS DAS ANÁLISES ACADÊMICAS
         * =====================================================
         */

        for (
            const analise
            of analisesAcademicas
        ) {
            eventos.push({
                id:
                    `analise-${analise.id}`,

                tipo:
                    "ANALISE_ACADEMICA",

                data:
                    analise
                        .analisadoEm
                        .toISOString(),

                intervencaoId:
                    null,

                analiseHistoricoId:
                    analise.id,

                tipoIntervencao:
                    null,

                canal:
                    null,

                status:
                    null,

                observacao:
                    null,

                resultado:
                    null,

                origemAnalise:
                    analise.origem,

                versaoMotor:
                    analise.versaoMotor,

                executadoPor:
                    analise.executadoPor
                        ? {
                            id:
                                analise
                                    .executadoPor
                                    .id,

                            nome:
                                analise
                                    .executadoPor
                                    .nome,

                            email:
                                analise
                                    .executadoPor
                                    .email ??
                                null,
                        }
                        : null,

                risco: {
                    nivel:
                        analise
                            .nivelRisco,

                    pontuacao:
                        analise
                            .pontuacaoRisco,

                    pontuacaoBruta:
                        analise
                            .pontuacaoBruta,

                    maximoDisponivel:
                        analise
                            .maximoDisponivel,

                    cobertura:
                        analise
                            .coberturaPercentual,

                    confiabilidade:
                        analise
                            .confiabilidade,
                },

                indicadores:
                    analise
                        .indicadores,

                componentes:
                    analise
                        .componentes,

                fatoresPrincipais:
                    analise
                        .fatoresPrincipais,

                evolucao:
                    null,
            });
        }

        /*
         * =====================================================
         * 4. EVENTOS DAS INTERVENÇÕES
         * =====================================================
         */

        for (
            const intervencao
            of intervencoes
        ) {
            /*
             * 4.1 REGISTRO DA INTERVENÇÃO
             *
             * Não usamos o status atual como se
             * ele fosse o status histórico no
             * momento do registro.
             */
            eventos.push({
                id:
                    `intervencao-${intervencao.id}-registro`,

                tipo:
                    "INTERVENCAO_REGISTRADA",

                data:
                    intervencao
                        .criadoEm
                        .toISOString(),

                intervencaoId:
                    intervencao.id,

                analiseHistoricoId:
                    null,

                tipoIntervencao:
                    intervencao.tipo,

                canal:
                    intervencao.canal,

                status:
                    null,

                observacao:
                    intervencao
                        .observacao,

                resultado:
                    null,

                origemAnalise:
                    null,

                versaoMotor:
                    null,

                executadoPor:
                    null,

                risco: {
                    nivel:
                        intervencao
                            .nivelRiscoNoRegistro,

                    pontuacao:
                        intervencao
                            .pontuacaoNoRegistro,

                    pontuacaoBruta:
                        null,

                    maximoDisponivel:
                        null,

                    cobertura:
                        intervencao
                            .coberturaNoRegistro,

                    confiabilidade:
                        intervencao
                            .confiabilidadeNoRegistro,
                },

                indicadores:
                    intervencao
                        .indicadoresNoRegistro,

                componentes:
                    null,

                fatoresPrincipais:
                    null,

                evolucao:
                    null,
            });

            /*
             * 4.2 RETORNO PROGRAMADO
             *
             * Isso representa uma agenda conhecida.
             * Não significa que o contato aconteceu.
             */
            if (
                intervencao.retornoEm
            ) {
                eventos.push({
                    id:
                        `intervencao-${intervencao.id}-retorno`,

                    tipo:
                        "RETORNO_AGENDADO",

                    data:
                        intervencao
                            .retornoEm
                            .toISOString(),

                    intervencaoId:
                        intervencao.id,

                    analiseHistoricoId:
                        null,

                    tipoIntervencao:
                        intervencao.tipo,

                    canal:
                        intervencao.canal,

                    status:
                        null,

                    observacao:
                        intervencao
                            .observacao,

                    resultado:
                        null,

                    origemAnalise:
                        null,

                    versaoMotor:
                        null,

                    executadoPor:
                        null,

                    risco:
                        null,

                    indicadores:
                        null,

                    componentes:
                        null,

                    fatoresPrincipais:
                        null,

                    evolucao:
                        null,
                });
            }

            /*
             * 4.3 ENCERRAMENTO
             */
            if (
                intervencao.concluidoEm
            ) {
                const evolucao =
                    avaliarEvolucaoIntervencao({
                        nivelRiscoNoRegistro:
                            intervencao
                                .nivelRiscoNoRegistro,

                        pontuacaoNoRegistro:
                            intervencao
                                .pontuacaoNoRegistro,

                        indicadoresNoRegistro:
                            intervencao
                                .indicadoresNoRegistro,

                        nivelRiscoNoEncerramento:
                            intervencao
                                .nivelRiscoNoEncerramento,

                        pontuacaoNoEncerramento:
                            intervencao
                                .pontuacaoNoEncerramento,

                        indicadoresNoEncerramento:
                            intervencao
                                .indicadoresNoEncerramento,
                    });

                eventos.push({
                    id:
                        `intervencao-${intervencao.id}-encerramento`,

                    tipo:
                        "INTERVENCAO_ENCERRADA",

                    data:
                        intervencao
                            .concluidoEm
                            .toISOString(),

                    intervencaoId:
                        intervencao.id,

                    analiseHistoricoId:
                        null,

                    tipoIntervencao:
                        intervencao.tipo,

                    canal:
                        intervencao.canal,

                    status:
                        intervencao.status,

                    observacao:
                        intervencao
                            .observacao,

                    resultado:
                        intervencao
                            .resultado,

                    origemAnalise:
                        null,

                    versaoMotor:
                        null,

                    executadoPor:
                        null,

                    risco: {
                        nivel:
                            intervencao
                                .nivelRiscoNoEncerramento,

                        pontuacao:
                            intervencao
                                .pontuacaoNoEncerramento,

                        pontuacaoBruta:
                            null,

                        maximoDisponivel:
                            null,

                        cobertura:
                            intervencao
                                .coberturaNoEncerramento,

                        confiabilidade:
                            intervencao
                                .confiabilidadeNoEncerramento,
                    },

                    indicadores:
                        intervencao
                            .indicadoresNoEncerramento,

                    componentes:
                        null,

                    fatoresPrincipais:
                        null,

                    evolucao,
                });
            }
        }

        /*
         * =====================================================
         * 5. ORDENAÇÃO CRONOLÓGICA
         * =====================================================
         *
         * Mais recente primeiro, mantendo
         * o comportamento atual do drawer.
         */

        eventos.sort(
            (
                a,
                b
            ) => {
                const diferenca =
                    new Date(
                        b.data
                    ).getTime() -
                    new Date(
                        a.data
                    ).getTime();

                if (
                    diferenca !==
                    0
                ) {
                    return diferenca;
                }

                /*
                 * Critério estável para dois
                 * eventos no mesmo milissegundo.
                 */
                return b.id.localeCompare(
                    a.id
                );
            }
        );

        return NextResponse.json({
            ok:
                true,

            aluno,

            resumo: {
                intervencoes:
                    intervencoes.length,

                analisesAcademicas:
                    analisesAcademicas.length,

                eventos:
                    eventos.length,

                abertas:
                    intervencoes.filter(
                        (
                            item
                        ) =>
                            item.status ===
                            "REGISTRADA" ||
                            item.status ===
                            "AGUARDANDO_RETORNO" ||
                            item.status ===
                            "EM_ACOMPANHAMENTO"
                    ).length,

                encerradas:
                    intervencoes.filter(
                        (
                            item
                        ) =>
                            item.status ===
                            "RESOLVIDA" ||
                            item.status ===
                            "CANCELADA"
                    ).length,
            },

            eventos,
        });
    }
    catch (error) {
        console.error(
            "[STUDENT_SUCCESS_ALUNO_TIMELINE]",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Erro ao carregar histórico do aluno",
            },
            {
                status: 500,
            }
        );
    }
}