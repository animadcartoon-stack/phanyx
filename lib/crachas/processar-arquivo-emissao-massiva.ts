import { prisma } from "@/lib/prisma";
import { gerarCrachaVisualPdfLote } from "@/lib/crachas/gerarCrachaVisualPdfLote";
import { armazenarPdfCrachaLote } from "@/lib/crachas/armazenamento-crachas";
import { enfileirarArquivoCracha } from "@/lib/crachas/fila-emissao-massiva";

type ProcessarArquivoParams = {
    loteId: number;
    arquivoId: number;
    origin: string;
};

type ItemPendenteCracha = {
    id: number;
    pessoaId: number;
};

type AlunoParaCracha = {
    id: number;
    fotoPerfil: string | null;
};

const TEMPO_PROCESSAMENTO_OBSOLETO_MS =
    15 * 60 * 1000;

const QUANTIDADE_TRANSACAO = 50;

function texto(valor: unknown) {
    return String(valor ?? "").trim();
}

function mensagemErro(error: unknown) {
    if (error instanceof Error) {
        return texto(error.message) || "Erro desconhecido.";
    }

    return texto(error) || "Erro desconhecido.";
}

function validarId(
    valor: unknown,
    campo: string
) {
    const numero = Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {
        throw new Error(`${campo} inválido.`);
    }

    return numero;
}

function dividirEmBlocos<T>(
    itens: T[],
    tamanho: number
) {
    const blocos: T[][] = [];

    for (
        let inicio = 0;
        inicio < itens.length;
        inicio += tamanho
    ) {
        blocos.push(
            itens.slice(inicio, inicio + tamanho)
        );
    }

    return blocos;
}

function gerarCodigoCrachaMassivo(params: {
    instituicaoId: number;
    loteId: number;
    itemId: number;
    pessoaId: number;
}) {
    const ano = new Date().getFullYear();

    return [
        "PHX",
        "ALU",
        params.instituicaoId,
        ano,
        params.pessoaId,
        `L${params.loteId}`,
        `I${params.itemId}`,
    ].join("-");
}

async function atualizarResumoEAvancar(
    loteId: number
) {
    const lote =
        await prisma.crachaLoteEmissao.findUnique({
            where: {
                id: loteId,
            },
            select: {
                id: true,
                status: true,
                totalArquivos: true,
                cancelamentoSolicitado: true,
            },
        });

    if (!lote) {
        return;
    }

    const [
        processados,
        erros,
        semFoto,
        arquivosConcluidos,
        arquivosFalhos,
        arquivosCancelados,
    ] = await Promise.all([
        prisma.crachaLoteItem.count({
            where: {
                loteId,
                status: "EMITIDO",
            },
        }),

        prisma.crachaLoteItem.count({
            where: {
                loteId,
                status: "ERRO",
            },
        }),

        prisma.crachaLoteItem.count({
            where: {
                loteId,
                status: "SEM_FOTO",
            },
        }),

        prisma.crachaLoteArquivo.count({
            where: {
                loteId,
                status: "CONCLUIDO",
            },
        }),

        prisma.crachaLoteArquivo.count({
            where: {
                loteId,
                status: "FALHA",
            },
        }),

        prisma.crachaLoteArquivo.count({
            where: {
                loteId,
                status: "CANCELADO",
            },
        }),
    ]);

    const arquivosFinalizados =
        arquivosConcluidos +
        arquivosFalhos +
        arquivosCancelados;

    const loteFinalizado =
        lote.totalArquivos === 0 ||
        arquivosFinalizados >= lote.totalArquivos;

    if (
        lote.cancelamentoSolicitado ||
        lote.status === "CANCELADO"
    ) {
        await prisma.crachaLoteEmissao.update({
            where: {
                id: loteId,
            },
            data: {
                status: "CANCELADO",
                processados,
                erros,
                semFoto,
                arquivosConcluidos,
                finalizadoEm: new Date(),
            },
        });

        return;
    }

    if (loteFinalizado) {
        const possuiPendencias =
            erros > 0 ||
            semFoto > 0 ||
            arquivosFalhos > 0 ||
            arquivosCancelados > 0;

        await prisma.crachaLoteEmissao.update({
            where: {
                id: loteId,
            },
            data: {
                status: possuiPendencias
                    ? "CONCLUIDO_PARCIAL"
                    : "CONCLUIDO",
                processados,
                erros,
                semFoto,
                arquivosConcluidos,
                finalizadoEm: new Date(),
            },
        });

        return;
    }

    await prisma.crachaLoteEmissao.update({
        where: {
            id: loteId,
        },
        data: {
            status: "PROCESSANDO",
            processados,
            erros,
            semFoto,
            arquivosConcluidos,
        },
    });

    const proximoArquivo =
        await prisma.crachaLoteArquivo.findFirst({
            where: {
                loteId,
                status: "PENDENTE",
            },
            orderBy: {
                numero: "asc",
            },
            select: {
                id: true,
            },
        });

    if (proximoArquivo) {
        await enfileirarArquivoCracha({
            loteId,
            arquivoId: proximoArquivo.id,
        });
    }
}

async function cancelarLote(
    loteId: number
) {
    const agora = new Date();

    await prisma.$transaction([
        prisma.crachaLoteItem.updateMany({
            where: {
                loteId,
                status: {
                    in: [
                        "PENDENTE",
                        "PROCESSANDO",
                    ],
                },
            },
            data: {
                status: "CANCELADO",
                processadoEm: agora,
            },
        }),

        prisma.crachaLoteArquivo.updateMany({
            where: {
                loteId,
                status: {
                    in: [
                        "PENDENTE",
                        "PROCESSANDO",
                        "ERRO",
                    ],
                },
            },
            data: {
                status: "CANCELADO",
                finalizadoEm: agora,
            },
        }),

        prisma.crachaLoteEmissao.update({
            where: {
                id: loteId,
            },
            data: {
                status: "CANCELADO",
                finalizadoEm: agora,
            },
        }),
    ]);

    await atualizarResumoEAvancar(loteId);
}

async function prepararArquivo(
    loteId: number,
    arquivoId: number
) {
    const arquivo =
        await prisma.crachaLoteArquivo.findFirst({
            where: {
                id: arquivoId,
                loteId,
            },
        });

    if (!arquivo) {
        throw new Error(
            "Arquivo do lote de crachás não encontrado."
        );
    }

    if (arquivo.status === "CONCLUIDO") {
        await atualizarResumoEAvancar(loteId);

        return false;
    }

    if (
        arquivo.status === "FALHA" ||
        arquivo.status === "CANCELADO"
    ) {
        await atualizarResumoEAvancar(loteId);

        return false;
    }

    if (arquivo.status === "PROCESSANDO") {
        const atualizadoEm =
            new Date(arquivo.atualizadoEm).getTime();

        const processamentoObsoleto =
            Date.now() - atualizadoEm >
            TEMPO_PROCESSAMENTO_OBSOLETO_MS;

        if (!processamentoObsoleto) {
            throw new Error(
                "Este arquivo já está sendo processado."
            );
        }

        await prisma.$transaction([
            prisma.crachaLoteArquivo.update({
                where: {
                    id: arquivoId,
                },
                data: {
                    status: "PENDENTE",
                    erroMensagem:
                        "Processamento anterior interrompido. Tentando novamente.",
                },
            }),

            prisma.crachaLoteItem.updateMany({
                where: {
                    arquivoId,
                    status: "PROCESSANDO",
                },
                data: {
                    status: "PENDENTE",
                },
            }),
        ]);
    }

    const resultado =
        await prisma.crachaLoteArquivo.updateMany({
            where: {
                id: arquivoId,
                loteId,
                status: {
                    in: ["PENDENTE", "ERRO"],
                },
            },
            data: {
                status: "PROCESSANDO",
                tentativas: {
                    increment: 1,
                },
                erroMensagem: null,
                iniciadoEm: new Date(),
                finalizadoEm: null,
            },
        });

    if (resultado.count === 0) {
        throw new Error(
            "Não foi possível reservar o arquivo para processamento."
        );
    }

    return true;
}

async function emitirCrachasDoArquivo(params: {
    loteId: number;
    arquivoId: number;
    instituicaoId: number;
    modeloId: number;
    emitidoPorId: number | null;
}) {
    await prisma.crachaLoteItem.updateMany({
        where: {
            loteId: params.loteId,
            arquivoId: params.arquivoId,
            status: "PROCESSANDO",
        },
        data: {
            status: "PENDENTE",
        },
    });

    const itensPendentes: ItemPendenteCracha[] =
        await prisma.crachaLoteItem.findMany({
            where: {
                loteId: params.loteId,
                arquivoId: params.arquivoId,
                status: "PENDENTE",
            },
            orderBy: {
                ordem: "asc",
            },
            select: {
                id: true,
                pessoaId: true,
            },
        });

    if (itensPendentes.length === 0) {
        return;
    }

    const alunos: AlunoParaCracha[] =
        await prisma.aluno.findMany({
            where: {
                instituicaoId:
                    params.instituicaoId,
                id: {
                    in: itensPendentes.map(
                        (item) => item.pessoaId
                    ),
                },
                ativo: true,
            },
            select: {
                id: true,
                fotoPerfil: true,
            },
        });

    const alunosPorId = new Map<
        number,
        AlunoParaCracha
    >(
        alunos.map(
            (aluno): [
                number,
                AlunoParaCracha
            ] => [
                    aluno.id,
                    aluno,
                ]
        )
    );

    const validos: ItemPendenteCracha[] = [];
    const inexistentes: number[] = [];
    const semFoto: number[] = [];

    for (const item of itensPendentes) {
        const aluno = alunosPorId.get(
            item.pessoaId
        );

        if (!aluno) {
            inexistentes.push(item.id);
            continue;
        }

        if (!aluno.fotoPerfil) {
            semFoto.push(item.id);
            continue;
        }

        validos.push(item);
    }

    if (inexistentes.length > 0) {
        await prisma.crachaLoteItem.updateMany({
            where: {
                id: {
                    in: inexistentes,
                },
            },
            data: {
                status: "ERRO",
                erroMensagem:
                    "Aluno ativo não encontrado durante o processamento.",
                processadoEm: new Date(),
            },
        });
    }

    if (semFoto.length > 0) {
        await prisma.crachaLoteItem.updateMany({
            where: {
                id: {
                    in: semFoto,
                },
            },
            data: {
                status: "ERRO",
                erroMensagem:
                    "A foto oficial do aluno não está mais disponível.",
                processadoEm: new Date(),
            },
        });
    }

    const blocos =
        dividirEmBlocos<ItemPendenteCracha>(
            validos,
            QUANTIDADE_TRANSACAO
        );

    for (const bloco of blocos) {
        const agora = new Date();

        await prisma.$transaction(
            bloco.map((item) => {
                const codigoCracha =
                    gerarCodigoCrachaMassivo({
                        instituicaoId:
                            params.instituicaoId,
                        loteId: params.loteId,
                        itemId: item.id,
                        pessoaId: item.pessoaId,
                    });

                return prisma.crachaLoteItem.update({
                    where: {
                        id: item.id,
                    },
                    data: {
                        status: "EMITIDO",
                        codigoCracha,
                        erroMensagem: null,
                        processadoEm: agora,
                        crachaEmitido: {
                            create: {
                                instituicaoId:
                                    params.instituicaoId,
                                modeloId: params.modeloId,
                                codigoCracha,
                                tipoPessoa: "ALUNO",
                                pessoaId: item.pessoaId,
                                status: "ATIVO",
                                validadeEm: null,
                                emitidoPorId:
                                    params.emitidoPorId,
                            },
                        },
                    },
                });
            }),
            {
                timeout: 30000,
            }
        );
    }
}

export async function processarArquivoEmissaoMassiva({
    loteId,
    arquivoId,
    origin,
}: ProcessarArquivoParams) {
    const loteIdValido = validarId(
        loteId,
        "Lote"
    );

    const arquivoIdValido = validarId(
        arquivoId,
        "Arquivo"
    );

    const originValido = texto(origin);

    if (!originValido) {
        throw new Error(
            "A origem da aplicação não foi informada."
        );
    }

    const lote =
        await prisma.crachaLoteEmissao.findUnique({
            where: {
                id: loteIdValido,
            },
        });

    if (!lote) {
        throw new Error(
            "Lote de emissão não encontrado."
        );
    }

    if (
        lote.cancelamentoSolicitado ||
        lote.status === "CANCELADO"
    ) {
        await cancelarLote(loteIdValido);

        return;
    }

    const deveProcessar =
        await prepararArquivo(
            loteIdValido,
            arquivoIdValido
        );

    if (!deveProcessar) {
        return;
    }

    try {
        const modelo =
            await prisma.crachaModelo.findFirst({
                where: {
                    id: lote.modeloId,
                    instituicaoId:
                        lote.instituicaoId,
                },
            });

        if (!modelo) {
            throw new Error(
                "Modelo do lote de crachás não encontrado."
            );
        }

        const frenteJson = Array.isArray(
            modelo.frenteJson
        )
            ? modelo.frenteJson
            : [];

        const versoJson = Array.isArray(
            modelo.versoJson
        )
            ? modelo.versoJson
            : [];

        if (frenteJson.length === 0) {
            throw new Error(
                "O modelo não possui conteúdo na frente."
            );
        }

        await emitirCrachasDoArquivo({
            loteId: loteIdValido,
            arquivoId: arquivoIdValido,
            instituicaoId:
                lote.instituicaoId,
            modeloId: lote.modeloId,
            emitidoPorId:
                lote.criadoPorId,
        });

        const crachasEmitidos =
            await prisma.crachaLoteItem.findMany({
                where: {
                    loteId: loteIdValido,
                    arquivoId: arquivoIdValido,
                    status: "EMITIDO",
                    crachaEmitidoId: {
                        not: null,
                    },
                },
                orderBy: {
                    ordem: "asc",
                },
                select: {
                    crachaEmitidoId: true,
                },
            });

        const crachaEmitidoIds =
            crachasEmitidos
                .map(
                    (item) =>
                        item.crachaEmitidoId
                )
                .filter(
                    (id): id is number =>
                        typeof id === "number"
                );

        const quantidadeErros =
            await prisma.crachaLoteItem.count({
                where: {
                    loteId: loteIdValido,
                    arquivoId: arquivoIdValido,
                    status: "ERRO",
                },
            });

        if (crachaEmitidoIds.length === 0) {
            await prisma.crachaLoteArquivo.update({
                where: {
                    id: arquivoIdValido,
                },
                data: {
                    status: "CONCLUIDO",
                    processados: 0,
                    erros: quantidadeErros,
                    finalizadoEm: new Date(),
                    erroMensagem:
                        quantidadeErros > 0
                            ? "Nenhum crachá pôde ser gerado neste arquivo."
                            : null,
                },
            });

            await atualizarResumoEAvancar(
                loteIdValido
            );

            return;
        }

        const pdfBuffer =
            await gerarCrachaVisualPdfLote({
                crachaEmitidoIds,
                origin: originValido,
                larguraMm:
                    Number(modelo.larguraMm) > 0
                        ? Number(modelo.larguraMm)
                        : 54,
                alturaMm:
                    Number(modelo.alturaMm) > 0
                        ? Number(modelo.alturaMm)
                        : 86,
                possuiVerso:
                    versoJson.length > 0,
            });

        const arquivo =
            await prisma.crachaLoteArquivo.findUnique({
                where: {
                    id: arquivoIdValido,
                },
                select: {
                    numero: true,
                },
            });

        if (!arquivo) {
            throw new Error(
                "Arquivo não encontrado após a geração do PDF."
            );
        }

        const armazenamento =
            await armazenarPdfCrachaLote({
                instituicaoId:
                    lote.instituicaoId,
                loteId: loteIdValido,
                numeroArquivo:
                    arquivo.numero,
                pdfBuffer,
            });

        await prisma.crachaLoteArquivo.update({
            where: {
                id: arquivoIdValido,
            },
            data: {
                status: "CONCLUIDO",
                processados:
                    crachaEmitidoIds.length,
                erros: quantidadeErros,
                pdfUrl: armazenamento.url,
                pdfPathname:
                    armazenamento.pathname,
                tamanhoBytes:
                    armazenamento.tamanhoBytes,
                erroMensagem: null,
                finalizadoEm: new Date(),
            },
        });

        await atualizarResumoEAvancar(
            loteIdValido
        );
    } catch (error) {
        const erro = mensagemErro(error);

        await prisma.crachaLoteArquivo.updateMany({
            where: {
                id: arquivoIdValido,
                loteId: loteIdValido,
                status: "PROCESSANDO",
            },
            data: {
                status: "ERRO",
                erroMensagem: erro.slice(
                    0,
                    4000
                ),
            },
        });

        throw error;
    }
}

export async function registrarFalhaDefinitivaArquivo(
    loteId: number,
    arquivoId: number,
    error: unknown
) {
    const loteIdValido = validarId(
        loteId,
        "Lote"
    );

    const arquivoIdValido = validarId(
        arquivoId,
        "Arquivo"
    );

    const erro = mensagemErro(error).slice(
        0,
        4000
    );

    const agora = new Date();

    await prisma.$transaction([
        prisma.crachaLoteItem.updateMany({
            where: {
                loteId: loteIdValido,
                arquivoId: arquivoIdValido,
                status: {
                    in: [
                        "PENDENTE",
                        "PROCESSANDO",
                    ],
                },
            },
            data: {
                status: "ERRO",
                erroMensagem: erro,
                processadoEm: agora,
            },
        }),

        prisma.crachaLoteArquivo.update({
            where: {
                id: arquivoIdValido,
            },
            data: {
                status: "FALHA",
                erroMensagem: erro,
                finalizadoEm: agora,
            },
        }),
    ]);

    const quantidadeErros =
        await prisma.crachaLoteItem.count({
            where: {
                loteId: loteIdValido,
                arquivoId: arquivoIdValido,
                status: "ERRO",
            },
        });

    await prisma.crachaLoteArquivo.update({
        where: {
            id: arquivoIdValido,
        },
        data: {
            erros: quantidadeErros,
        },
    });

    await atualizarResumoEAvancar(
        loteIdValido
    );
}