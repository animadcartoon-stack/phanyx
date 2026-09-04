import {
    TipoModalTransporte,
} from "@prisma/client";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
    params: {
        id: string;
    };
};

type ContextoUsuario = {
    id: number;
    instituicaoId: number;
    podeGerenciar: boolean;
    polosPermitidos: number[] | null;
};

function obterIdAtividade(
    contexto: ContextoRota
) {
    const atividadeId = Number(
        contexto.params.id
    );

    if (
        !Number.isInteger(atividadeId) ||
        atividadeId <= 0
    ) {
        return null;
    }

    return atividadeId;
}

async function obterContextoUsuario(): Promise<
    ContextoUsuario | null
> {
    const token =
        await getUserFromToken();

    if (!token) {
        return null;
    }

    const usuario =
        await prisma.user.findFirst({
            where: {
                id: token.id,
                instituicaoId:
                    token.instituicaoId,
                ativo: true,
            },

            select: {
                id: true,
                instituicaoId: true,
                role: true,
                acessoTodosPolos: true,

                funcionario: {
                    select: {
                        ativo: true,
                        statusFuncionario: true,

                        permissoes: {
                            where: {
                                ativo: true,
                            },

                            select: {
                                chave: true,
                            },
                        },

                        departamento: {
                            select: {
                                permissoes: {
                                    where: {
                                        ativo: true,
                                    },

                                    select: {
                                        chave: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

    if (!usuario) {
        return null;
    }

    const role = String(
        usuario.role || ""
    ).toUpperCase();

    const administrador =
        role === "ADMIN" ||
        role === "SUPER_ADMIN";

    let podeVer = administrador;
    let podeGerenciar =
        administrador;

    if (!administrador) {
        const funcionario =
            usuario.funcionario;

        if (
            funcionario &&
            funcionario.ativo &&
            funcionario
                .statusFuncionario ===
            "ATIVO"
        ) {
            const permissoes =
                new Set([
                    ...(funcionario
                        .permissoes || []
                    ).map(
                        (item) =>
                            item.chave
                    ),

                    ...(funcionario
                        .departamento
                        ?.permissoes || []
                    ).map(
                        (item) =>
                            item.chave
                    ),
                ]);

            podeVer =
                permissoes.has(
                    "atividades-externas.ver"
                ) ||
                permissoes.has(
                    "atividades-externas.gerenciar"
                );

            podeGerenciar =
                permissoes.has(
                    "atividades-externas.gerenciar"
                );
        }
    }

    if (!podeVer) {
        return null;
    }

    let polosPermitidos:
        | number[]
        | null = null;

    if (!usuario.acessoTodosPolos) {
        const acessos =
            await prisma.userPolo.findMany({
                where: {
                    userId: usuario.id,
                    instituicaoId:
                        usuario.instituicaoId,
                    ativo: true,
                },

                select: {
                    poloId: true,
                },
            });

        polosPermitidos =
            acessos.map(
                (item) =>
                    item.poloId
            );
    }

    return {
        id: usuario.id,
        instituicaoId:
            usuario.instituicaoId,
        podeGerenciar,
        polosPermitidos,
    };
}

async function obterAtividade(
    atividadeId: number,
    usuario: ContextoUsuario
) {
    return prisma.atividadeExterna.findFirst({
        where: {
            id: atividadeId,

            instituicaoId:
                usuario.instituicaoId,

            ...(usuario
                .polosPermitidos !== null
                ? {
                    OR: [
                        {
                            poloId: null,
                        },
                        {
                            poloId: {
                                in: usuario
                                    .polosPermitidos,
                            },
                        },
                    ],
                }
                : {}),
        },

        select: {
            id: true,
            instituicaoId: true,
            poloId: true,
        },
    });
}

function limparTexto(
    valor: unknown,
    limite: number
) {
    if (
        typeof valor !== "string"
    ) {
        return null;
    }

    const texto = valor.trim();

    if (!texto) {
        return null;
    }

    return texto.slice(
        0,
        limite
    );
}

function converterDataHora(
    valor: unknown
): Date | null | undefined {
    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        return null;
    }

    if (
        typeof valor !== "string"
    ) {
        return undefined;
    }

    const data = new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {
        return undefined;
    }

    return data;
}

export async function GET(
    _request: NextRequest,
    contexto: ContextoRota
) {
    try {
        const atividadeId =
            obterIdAtividade(
                contexto
            );

        if (!atividadeId) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "ID_INVALIDO",
                },
                {
                    status: 400,
                }
            );
        }

        const usuario =
            await obterContextoUsuario();

        if (!usuario) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
                },
                {
                    status: 403,
                }
            );
        }

        const atividade =
            await obterAtividade(
                atividadeId,
                usuario
            );

        if (!atividade) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "ATIVIDADE_NAO_ENCONTRADA",
                },
                {
                    status: 404,
                }
            );
        }

        const [
            trechos,
            prestadores,
            veiculos,
            condutores,
        ] = await Promise.all([
            prisma.atividadeExternaTrecho.findMany({
                where: {
                    instituicaoId:
                        usuario.instituicaoId,

                    atividadeExternaId:
                        atividade.id,
                },

                select: {
                    id: true,
                    ordem: true,
                    titulo: true,

                    modal: true,

                    prestadorTransporteId:
                        true,

                    origemNome: true,
                    origemEndereco: true,
                    origemCidade: true,
                    origemRegiao: true,
                    origemPais: true,

                    destinoNome: true,
                    destinoEndereco: true,
                    destinoCidade: true,
                    destinoRegiao: true,
                    destinoPais: true,

                    partidaPrevista: true,
                    chegadaPrevista: true,

                    partidaReal: true,
                    chegadaReal: true,

                    numeroReferencia: true,

                    observacao: true,

                    status: true,

                    createdAt: true,
                    updatedAt: true,

                    prestadorTransporte: {
                        select: {
                            id: true,
                            nome: true,
                            nomeFantasia: true,
                            tipo: true,

                            telefone: true,
                            email: true,

                            verificacaoTransporteEstudantil:
                                true,
                        },
                    },

                    veiculos: {
                        select: {
                            id: true,

                            veiculoId: true,
                            supervisorEquipeId:
                                true,

                            ordem: true,

                            identificacaoOperacional:
                                true,

                            capacidadePlanejada:
                                true,

                            pontoEmbarque: true,
                            pontoDesembarque: true,

                            embarquePrevisto: true,
                            desembarquePrevisto:
                                true,

                            embarqueReal: true,
                            desembarqueReal: true,

                            status: true,

                            observacao: true,

                            createdAt: true,
                            updatedAt: true,

                            veiculo: {
                                select: {
                                    id: true,

                                    prestadorTransporteId:
                                        true,

                                    nomeIdentificacao:
                                        true,

                                    tipo: true,

                                    marca: true,
                                    modelo: true,
                                    ano: true,

                                    placa: true,

                                    paisRegistro: true,

                                    identificadorExterno:
                                        true,

                                    capacidadePassageiros:
                                        true,

                                    acessivelPcd: true,

                                    tipoConducao: true,

                                    sistemaConducao: true,
                                    versaoSoftware: true,

                                    possuiRastreamento:
                                        true,

                                    possuiTelemetria:
                                        true,

                                    trackingProvider:
                                        true,

                                    externalVehicleId:
                                        true,

                                    autorizadoTransporteEstudantil:
                                        true,

                                    ativo: true,

                                    prestadorTransporte: {
                                        select: {
                                            id: true,
                                            nome: true,
                                            nomeFantasia:
                                                true,
                                        },
                                    },
                                },
                            },

                            supervisorEquipe: {
                                select: {
                                    id: true,
                                    nomeSnapshot: true,
                                    papel: true,
                                    principal: true,
                                },
                            },

                            condutores: {
                                select: {
                                    id: true,

                                    condutorId: true,

                                    papel: true,

                                    observacao: true,

                                    createdAt: true,
                                    updatedAt: true,

                                    condutor: {
                                        select: {
                                            id: true,

                                            prestadorTransporteId:
                                                true,

                                            nome: true,

                                            tipo: true,

                                            telefone: true,
                                            email: true,

                                            numeroLicenca: true,
                                            categoriaLicenca:
                                                true,

                                            licencaValidaAte:
                                                true,

                                            autorizadoTransporteEstudantil:
                                                true,

                                            ativo: true,
                                        },
                                    },
                                },

                                orderBy: {
                                    id: "asc",
                                },
                            },

                            passageiros: {
                                select: {
                                    id: true,

                                    participanteId:
                                        true,

                                    assento: true,

                                    status: true,

                                    embarcadoEm: true,
                                    desembarcadoEm:
                                        true,

                                    observacao: true,
                                },

                                orderBy: {
                                    id: "asc",
                                },
                            },
                        },

                        orderBy: [
                            {
                                ordem: "asc",
                            },
                            {
                                id: "asc",
                            },
                        ],
                    },

                    passageiros: {
                        select: {
                            id: true,

                            trechoVeiculoId: true,

                            participanteId:
                                true,

                            assento: true,

                            status: true,

                            embarcadoEm: true,
                            desembarcadoEm:
                                true,

                            observacao: true,
                        },

                        orderBy: {
                            id: "asc",
                        },
                    },
                },

                orderBy: [
                    {
                        ordem: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            }),

            prisma.prestadorTransporte.findMany({
                where: {
                    instituicaoId:
                        usuario.instituicaoId,

                    ativo: true,
                },

                select: {
                    id: true,

                    nome: true,
                    nomeFantasia: true,

                    tipo: true,

                    pais: true,
                    regiao: true,
                    cidade: true,

                    telefone: true,
                    email: true,
                    site: true,

                    responsavelContato:
                        true,

                    telefoneResponsavelContato:
                        true,

                    emailResponsavelContato:
                        true,

                    tipoDocumento: true,
                    numeroDocumento: true,

                    numeroLicenca: true,
                    licencaValidaAte: true,

                    numeroApolice: true,
                    seguroValidoAte: true,

                    verificacaoTransporteEstudantil:
                        true,

                    permiteSubcontratacao:
                        true,

                    observacao: true,

                    ativo: true,
                },

                orderBy: {
                    nome: "asc",
                },
            }),

            prisma.veiculoTransporte.findMany({
                where: {
                    instituicaoId:
                        usuario.instituicaoId,

                    ativo: true,
                },

                select: {
                    id: true,

                    prestadorTransporteId:
                        true,

                    nomeIdentificacao: true,

                    tipo: true,

                    marca: true,
                    modelo: true,
                    ano: true,

                    placa: true,

                    paisRegistro: true,

                    identificadorExterno:
                        true,

                    capacidadePassageiros:
                        true,

                    acessivelPcd: true,

                    tipoConducao: true,

                    sistemaConducao: true,
                    versaoSoftware: true,

                    possuiRastreamento:
                        true,

                    possuiTelemetria:
                        true,

                    trackingProvider: true,

                    externalVehicleId: true,

                    autorizadoTransporteEstudantil:
                        true,

                    observacao: true,

                    ativo: true,

                    prestadorTransporte: {
                        select: {
                            id: true,
                            nome: true,
                            nomeFantasia: true,
                        },
                    },
                },

                orderBy: [
                    {
                        nomeIdentificacao:
                            "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            }),

            prisma.condutorTransporte.findMany({
                where: {
                    instituicaoId:
                        usuario.instituicaoId,

                    ativo: true,
                },

                select: {
                    id: true,

                    prestadorTransporteId:
                        true,

                    nome: true,

                    tipo: true,

                    telefone: true,
                    email: true,

                    paisDocumento: true,
                    tipoDocumento: true,
                    numeroDocumento: true,

                    numeroLicenca: true,
                    categoriaLicenca:
                        true,

                    licencaValidaAte: true,

                    autorizadoTransporteEstudantil:
                        true,

                    contatoEmergencia:
                        true,

                    telefoneEmergencia:
                        true,

                    observacao: true,

                    ativo: true,

                    prestadorTransporte: {
                        select: {
                            id: true,
                            nome: true,
                            nomeFantasia: true,
                        },
                    },
                },

                orderBy: {
                    nome: "asc",
                },
            }),
        ]);

        const veiculoIds =
            new Set<number>();

        const condutorIds =
            new Set<number>();

        const participanteIds =
            new Set<number>();

        for (const trecho of trechos) {
            for (
                const passageiro
                of trecho.passageiros
            ) {
                participanteIds.add(
                    passageiro.participanteId
                );
            }

            for (
                const trechoVeiculo
                of trecho.veiculos
            ) {
                veiculoIds.add(
                    trechoVeiculo.veiculoId
                );

                for (
                    const atribuicao
                    of trechoVeiculo.condutores
                ) {
                    condutorIds.add(
                        atribuicao.condutorId
                    );
                }

                for (
                    const passageiro
                    of trechoVeiculo.passageiros
                ) {
                    participanteIds.add(
                        passageiro.participanteId
                    );
                }
            }
        }

        const resumo = {
            totalTrechos:
                trechos.length,

            totalVeiculos:
                veiculoIds.size,

            totalCondutores:
                condutorIds.size,

            totalPassageiros:
                participanteIds.size,

            totalPrestadoresDisponiveis:
                prestadores.length,

            totalVeiculosDisponiveis:
                veiculos.length,

            totalCondutoresDisponiveis:
                condutores.length,
        };

        return NextResponse.json({
            ok: true,

            podeGerenciar:
                usuario.podeGerenciar,

            atividade,

            resumo,

            trechos,

            opcoes: {
                prestadores,
                veiculos,
                condutores,
            },
        });
    } catch (error) {
        console.error(
            "[ATIVIDADE_EXTERNA_TRANSPORTE_GET]",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "ERRO_INTERNO",

                ...(process.env
                    .NODE_ENV !==
                    "production"
                    ? {
                        detalhe:
                            error instanceof Error
                                ? error.message
                                : String(
                                    error
                                ),
                    }
                    : {}),
            },
            {
                status: 500,
            }
        );
    }
}

export async function POST(
    request: NextRequest,
    contexto: ContextoRota
) {
    try {
        const atividadeId =
            obterIdAtividade(
                contexto
            );

        if (!atividadeId) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "ID_INVALIDO",
                },
                {
                    status: 400,
                }
            );
        }

        const usuario =
            await obterContextoUsuario();

        if (!usuario) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "NAO_AUTORIZADO_OU_SEM_PERMISSAO",
                },
                {
                    status: 403,
                }
            );
        }

        if (
            !usuario.podeGerenciar
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "SEM_PERMISSAO_GERENCIAR",
                },
                {
                    status: 403,
                }
            );
        }

        const atividade =
            await obterAtividade(
                atividadeId,
                usuario
            );

        if (!atividade) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "ATIVIDADE_NAO_ENCONTRADA",
                },
                {
                    status: 404,
                }
            );
        }

        const corpo =
            await request
                .json()
                .catch(
                    () => null
                );

        if (!corpo) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "CORPO_INVALIDO",
                },
                {
                    status: 400,
                }
            );
        }

                const acao =
            String(
                corpo?.acao || ""
            )
                .trim()
                .toUpperCase();

        if (
            acao ===
            "VINCULAR_VEICULO"
        ) {
            const trechoId =
                Number(
                    corpo?.trechoId
                );

            if (
                !Number.isInteger(
                    trechoId
                ) ||
                trechoId <= 0
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "TRECHO_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const veiculoId =
                Number(
                    corpo?.veiculoId
                );

            if (
                !Number.isInteger(
                    veiculoId
                ) ||
                veiculoId <= 0
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "VEICULO_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const trecho =
                await prisma
                    .atividadeExternaTrecho
                    .findFirst({
                        where: {
                            id:
                                trechoId,

                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            atividadeExternaId:
                                atividade.id,
                        },

                        select: {
                            id: true,
                        },
                    });

            if (!trecho) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "TRECHO_NAO_ENCONTRADO",
                    },
                    {
                        status: 404,
                    }
                );
            }

            const veiculo =
                await prisma
                    .veiculoTransporte
                    .findFirst({
                        where: {
                            id:
                                veiculoId,

                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            ativo: true,
                        },

                        select: {
                            id: true,

                            capacidadePassageiros:
                                true,
                        },
                    });

            if (!veiculo) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "VEICULO_NAO_ENCONTRADO",
                    },
                    {
                        status: 404,
                    }
                );
            }

            const vinculoExistente =
                await prisma
                    .atividadeExternaTrechoVeiculo
                    .findFirst({
                        where: {
                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            atividadeExternaTrechoId:
                                trecho.id,

                            veiculoId:
                                veiculo.id,
                        },

                        select: {
                            id: true,
                        },
                    });

            if (
                vinculoExistente
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "VEICULO_JA_VINCULADO_AO_TRECHO",
                    },
                    {
                        status: 409,
                    }
                );
            }

            const ultimoVeiculo =
                await prisma
                    .atividadeExternaTrechoVeiculo
                    .findFirst({
                        where: {
                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            atividadeExternaTrechoId:
                                trecho.id,
                        },

                        select: {
                            ordem: true,
                        },

                        orderBy: {
                            ordem:
                                "desc",
                        },
                    });

            const ordem =
                (ultimoVeiculo
                    ?.ordem || 0) +
                1;

            const trechoVeiculo =
                await prisma
                    .atividadeExternaTrechoVeiculo
                    .create({
                        data: {
                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            atividadeExternaTrechoId:
                                trecho.id,

                            veiculoId:
                                veiculo.id,

                            ordem,

                            capacidadePlanejada:
                                veiculo
                                    .capacidadePassageiros,

                            criadoPorId:
                                usuario.id,

                            atualizadoPorId:
                                usuario.id,
                        },

                        select: {
                            id: true,

                            atividadeExternaTrechoId:
                                true,

                            veiculoId:
                                true,

                            ordem: true,

                            capacidadePlanejada:
                                true,

                            status: true,

                            createdAt: true,

                            updatedAt: true,

                            veiculo: {
                                select: {
                                    id: true,

                                    nomeIdentificacao:
                                        true,

                                    tipo: true,

                                    placa: true,

                                    paisRegistro:
                                        true,

                                    capacidadePassageiros:
                                        true,

                                    tipoConducao:
                                        true,
                                },
                            },
                        },
                    });

            return NextResponse.json(
                {
                    ok: true,

                    acao:
                        "VINCULAR_VEICULO",

                    trechoVeiculo,
                },
                {
                    status: 201,
                }
            );
        }

                if (
            acao ===
            "VINCULAR_CONDUTOR"
        ) {
            const trechoVeiculoId =
                Number(
                    corpo?.trechoVeiculoId
                );

            if (
                !Number.isInteger(
                    trechoVeiculoId
                ) ||
                trechoVeiculoId <= 0
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "TRECHO_VEICULO_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const condutorId =
                Number(
                    corpo?.condutorId
                );

            if (
                !Number.isInteger(
                    condutorId
                ) ||
                condutorId <= 0
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "CONDUTOR_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const papeisPermitidos = [
                "PRINCIPAL",
                "AUXILIAR",
                "RESERVA",
                "OPERADOR",
                "OPERADOR_REMOTO",
                "SUPERVISOR_AUTONOMO",
                "OUTRO",
            ] as const;

            type PapelCondutor =
                (typeof papeisPermitidos)[number];

            const papelTexto =
                String(
                    corpo?.papel ||
                        "PRINCIPAL"
                )
                    .trim()
                    .toUpperCase();

            if (
                !papeisPermitidos.includes(
                    papelTexto as PapelCondutor
                )
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "PAPEL_CONDUTOR_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const papel =
                papelTexto as PapelCondutor;

            const trechoVeiculo =
                await prisma
                    .atividadeExternaTrechoVeiculo
                    .findFirst({
                        where: {
                            id:
                                trechoVeiculoId,

                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            atividadeExternaTrecho: {
                                atividadeExternaId:
                                    atividade.id,
                            },
                        },

                        select: {
                            id: true,

                            veiculoId: true,

                            atividadeExternaTrechoId:
                                true,
                        },
                    });

            if (!trechoVeiculo) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "VEICULO_DO_TRECHO_NAO_ENCONTRADO",
                    },
                    {
                        status: 404,
                    }
                );
            }

            const condutor =
                await prisma
                    .condutorTransporte
                    .findFirst({
                        where: {
                            id:
                                condutorId,

                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            ativo: true,
                        },

                        select: {
                            id: true,
                            nome: true,
                            tipo: true,
                        },
                    });

            if (!condutor) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "CONDUTOR_NAO_ENCONTRADO",
                    },
                    {
                        status: 404,
                    }
                );
            }

            const vinculoExistente =
                await prisma
                    .atividadeExternaTrechoVeiculoCondutor
                    .findFirst({
                        where: {
                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            trechoVeiculoId:
                                trechoVeiculo.id,

                            condutorId:
                                condutor.id,
                        },

                        select: {
                            id: true,
                        },
                    });

            if (
                vinculoExistente
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "CONDUTOR_JA_VINCULADO_AO_VEICULO",
                    },
                    {
                        status: 409,
                    }
                );
            }

            const atribuicaoCondutor =
                await prisma
                    .atividadeExternaTrechoVeiculoCondutor
                    .create({
                        data: {
                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            trechoVeiculoId:
                                trechoVeiculo.id,

                            condutorId:
                                condutor.id,

                            papel,

                            criadoPorId:
                                usuario.id,

                            atualizadoPorId:
                                usuario.id,
                        },

                        select: {
                            id: true,

                            trechoVeiculoId:
                                true,

                            condutorId:
                                true,

                            papel: true,

                            createdAt: true,

                            updatedAt: true,

                            condutor: {
                                select: {
                                    id: true,
                                    nome: true,
                                    tipo: true,

                                    telefone:
                                        true,

                                    numeroLicenca:
                                        true,

                                    categoriaLicenca:
                                        true,
                                },
                            },
                        },
                    });

            return NextResponse.json(
                {
                    ok: true,

                    acao:
                        "VINCULAR_CONDUTOR",

                    atribuicaoCondutor,
                },
                {
                    status: 201,
                }
            );
        }


        const modalTexto =

            String(
                corpo?.modal || ""
            ).trim();

        if (
            !Object.values(
                TipoModalTransporte
            ).includes(
                modalTexto as TipoModalTransporte
            )
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "MODAL_INVALIDO",
                },
                {
                    status: 400,
                }
            );
        }

        const modal =
            modalTexto as TipoModalTransporte;

        const titulo =
            limparTexto(
                corpo?.titulo,
                200
            );

        const origemNome =
            limparTexto(
                corpo?.origemNome,
                300
            );

        const destinoNome =
            limparTexto(
                corpo?.destinoNome,
                300
            );

        if (!origemNome) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "ORIGEM_OBRIGATORIA",
                },
                {
                    status: 400,
                }
            );
        }

        if (!destinoNome) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "DESTINO_OBRIGATORIO",
                },
                {
                    status: 400,
                }
            );
        }

        const origemEndereco =
            limparTexto(
                corpo?.origemEndereco,
                500
            );

        const origemCidade =
            limparTexto(
                corpo?.origemCidade,
                200
            );

        const origemRegiao =
            limparTexto(
                corpo?.origemRegiao,
                200
            );

        const origemPais =
            limparTexto(
                corpo?.origemPais,
                120
            );

        const destinoEndereco =
            limparTexto(
                corpo?.destinoEndereco,
                500
            );

        const destinoCidade =
            limparTexto(
                corpo?.destinoCidade,
                200
            );

        const destinoRegiao =
            limparTexto(
                corpo?.destinoRegiao,
                200
            );

        const destinoPais =
            limparTexto(
                corpo?.destinoPais,
                120
            );

        const numeroReferencia =
            limparTexto(
                corpo?.numeroReferencia,
                200
            );

        const observacao =
            limparTexto(
                corpo?.observacao,
                5000
            );

        const partidaPrevista =
            converterDataHora(
                corpo?.partidaPrevista
            );

        const chegadaPrevista =
            converterDataHora(
                corpo?.chegadaPrevista
            );

        if (
            partidaPrevista ===
            undefined
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "PARTIDA_PREVISTA_INVALIDA",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            chegadaPrevista ===
            undefined
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "CHEGADA_PREVISTA_INVALIDA",
                },
                {
                    status: 400,
                }
            );
        }

        if (
            partidaPrevista &&
            chegadaPrevista &&
            chegadaPrevista <
            partidaPrevista
        ) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "CHEGADA_ANTES_DA_PARTIDA",
                },
                {
                    status: 400,
                }
            );
        }

        let prestadorTransporteId:
            | number
            | null = null;

        if (
            corpo?.prestadorTransporteId !==
            undefined &&
            corpo?.prestadorTransporteId !==
            null &&
            corpo?.prestadorTransporteId !==
            ""
        ) {
            const idPrestador =
                Number(
                    corpo
                        .prestadorTransporteId
                );

            if (
                !Number.isInteger(
                    idPrestador
                ) ||
                idPrestador <= 0
            ) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "PRESTADOR_INVALIDO",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const prestador =
                await prisma
                    .prestadorTransporte
                    .findFirst({
                        where: {
                            id: idPrestador,

                            instituicaoId:
                                usuario
                                    .instituicaoId,

                            ativo: true,
                        },

                        select: {
                            id: true,
                        },
                    });

            if (!prestador) {
                return NextResponse.json(
                    {
                        ok: false,
                        error:
                            "PRESTADOR_NAO_ENCONTRADO",
                    },
                    {
                        status: 404,
                    }
                );
            }

            prestadorTransporteId =
                prestador.id;
        }

        const ultimoTrecho =
            await prisma
                .atividadeExternaTrecho
                .findFirst({
                    where: {
                        instituicaoId:
                            usuario
                                .instituicaoId,

                        atividadeExternaId:
                            atividade.id,
                    },

                    select: {
                        ordem: true,
                    },

                    orderBy: {
                        ordem: "desc",
                    },
                });

        const ordem =
            (ultimoTrecho?.ordem ||
                0) + 1;

        const trecho =
            await prisma
                .atividadeExternaTrecho
                .create({
                    data: {
                        instituicaoId:
                            usuario
                                .instituicaoId,

                        atividadeExternaId:
                            atividade.id,

                        ordem,

                        titulo,

                        modal,

                        prestadorTransporteId,

                        origemNome,
                        origemEndereco,
                        origemCidade,
                        origemRegiao,
                        origemPais,

                        destinoNome,
                        destinoEndereco,
                        destinoCidade,
                        destinoRegiao,
                        destinoPais,

                        partidaPrevista,
                        chegadaPrevista,

                        numeroReferencia,

                        observacao,

                        criadoPorId:
                            usuario.id,

                        atualizadoPorId:
                            usuario.id,
                    },

                    select: {
                        id: true,
                        ordem: true,
                        titulo: true,

                        modal: true,

                        prestadorTransporteId:
                            true,

                        origemNome: true,
                        origemEndereco: true,
                        origemCidade: true,
                        origemRegiao: true,
                        origemPais: true,

                        destinoNome: true,
                        destinoEndereco: true,
                        destinoCidade: true,
                        destinoRegiao: true,
                        destinoPais: true,

                        partidaPrevista: true,
                        chegadaPrevista: true,

                        partidaReal: true,
                        chegadaReal: true,

                        numeroReferencia: true,

                        observacao: true,

                        status: true,

                        createdAt: true,
                        updatedAt: true,

                        prestadorTransporte: {
                            select: {
                                id: true,
                                nome: true,
                                nomeFantasia: true,
                                tipo: true,
                            },
                        },
                    },
                });

        return NextResponse.json(
            {
                ok: true,
                trecho,
            },
            {
                status: 201,
            }
        );
    } catch (error) {
        console.error(
            "[ATIVIDADE_EXTERNA_TRANSPORTE_POST]",
            error
        );

        return NextResponse.json(
            {
                ok: false,
                error:
                    "ERRO_INTERNO",

                ...(process.env
                    .NODE_ENV !==
                    "production"
                    ? {
                        detalhe:
                            error instanceof
                                Error
                                ? error.message
                                : String(
                                    error
                                ),
                    }
                    : {}),
            },
            {
                status: 500,
            }
        );
    }
}