import {
    AcaoAuditoriaBiblioteca,
    Prisma,
    StatusExemplarBiblioteca,
    StatusManutencaoExemplarBiblioteca,
    TipoExemplarBiblioteca,
} from "@prisma/client";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    ErroBiblioteca,
    exigirPermissaoBiblioteca,
    obterContextoBiblioteca,
    respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
    params: {
        itemId: string;
    };
};

type CorpoCadastro = Record<string, unknown>;

const TIPOS_EXEMPLAR =
    new Set<TipoExemplarBiblioteca>(
        Object.values(TipoExemplarBiblioteca)
    );

const EXEMPLAR_SELECT = {
    id: true,
    instituicaoId: true,
    itemId: true,
    licencaId: true,

    tipo: true,
    status: true,

    codigoInterno: true,
    codigoBarras: true,
    numeroTombo: true,
    patrimonio: true,

    poloIdSnapshot: true,
    unidadeSnapshot: true,
    setor: true,
    sala: true,
    estante: true,
    prateleira: true,
    localizacaoCompleta: true,

    dataAquisicao: true,
    formaAquisicao: true,
    fornecedor: true,
    valorAquisicao: true,

    permiteEmprestimo: true,
    observacoes: true,

    criadoPorId: true,
    atualizadoPorId: true,

    criadoEm: true,
    atualizadoEm: true,

    baixadoEm: true,
    motivoBaixa: true,

    manutencoes: {
        where: {
            status:
                StatusManutencaoExemplarBiblioteca.ABERTA,
        },

        orderBy: {
            iniciadaEm: "desc",
        },

        take: 1,

        select: {
            id: true,
            status: true,
            resultado: true,

            motivo: true,
            observacaoEntrada: true,

            fornecedor: true,
            custoEstimado: true,
            custoFinal: true,

            iniciadaEm: true,
            previsaoRetornoEm: true,
            concluidaEm: true,
            canceladaEm: true,

            observacaoConclusao: true,

            iniciadoPorId: true,
            concluidoPorId: true,
            canceladoPorId: true,
        },
    },
} satisfies Prisma.BibliotecaExemplarSelect;

function responder(
    corpo: Record<string, unknown>,
    status = 200
) {
    return NextResponse.json(corpo, {
        status,
        headers: {
            "Cache-Control": "no-store, max-age=0",
        },
    });
}

function falhar(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
): never {
    throw new ErroBiblioteca(
        status,
        mensagem,
        codigo,
        detalhes
    );
}

function obterItemId(
    params: ContextoRota["params"]
) {
    const itemId = Number(params.itemId);

    if (
        !Number.isInteger(itemId) ||
        itemId <= 0
    ) {
        falhar(
            400,
            "Item da biblioteca inválido.",
            "ITEM_INVALIDO"
        );
    }

    return itemId;
}

async function lerCorpo(
    request: NextRequest
): Promise<CorpoCadastro> {
    try {
        const corpo = await request.json();

        if (
            !corpo ||
            typeof corpo !== "object" ||
            Array.isArray(corpo)
        ) {
            falhar(
                400,
                "O corpo da requisição é inválido.",
                "CORPO_INVALIDO"
            );
        }

        return corpo as CorpoCadastro;
    } catch (erro) {
        if (erro instanceof ErroBiblioteca) {
            throw erro;
        }

        falhar(
            400,
            "O corpo da requisição contém um JSON inválido.",
            "JSON_INVALIDO"
        );
    }
}

function textoObrigatorio(
    valor: unknown,
    campo: string,
    limite: number
) {
    if (typeof valor !== "string") {
        falhar(
            400,
            `O campo ${campo} é obrigatório.`,
            "CAMPO_OBRIGATORIO",
            { campo }
        );
    }

    const texto = valor.trim();

    if (!texto) {
        falhar(
            400,
            `O campo ${campo} é obrigatório.`,
            "CAMPO_OBRIGATORIO",
            { campo }
        );
    }

    if (texto.length > limite) {
        falhar(
            400,
            `O campo ${campo} excede o limite permitido.`,
            "CAMPO_MUITO_LONGO",
            {
                campo,
                limite,
            }
        );
    }

    return texto;
}

function textoOpcional(
    valor: unknown,
    campo: string,
    limite: number
) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    if (typeof valor !== "string") {
        falhar(
            400,
            `O campo ${campo} é inválido.`,
            "CAMPO_INVALIDO",
            { campo }
        );
    }

    const texto = valor.trim();

    if (!texto) {
        return null;
    }

    if (texto.length > limite) {
        falhar(
            400,
            `O campo ${campo} excede o limite permitido.`,
            "CAMPO_MUITO_LONGO",
            {
                campo,
                limite,
            }
        );
    }

    return texto;
}

function inteiroOpcional(
    valor: unknown,
    campo: string
) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    const numero = Number(valor);

    if (
        !Number.isInteger(numero) ||
        numero <= 0
    ) {
        falhar(
            400,
            `O campo ${campo} deve conter um número inteiro positivo.`,
            "CAMPO_INVALIDO",
            { campo }
        );
    }

    return numero;
}

function booleanoOpcional(
    valor: unknown,
    campo: string,
    padrao: boolean
) {
    if (
        valor === undefined ||
        valor === null
    ) {
        return padrao;
    }

    if (typeof valor !== "boolean") {
        falhar(
            400,
            `O campo ${campo} deve ser verdadeiro ou falso.`,
            "CAMPO_INVALIDO",
            { campo }
        );
    }

    return valor;
}

function tipoExemplar(
    valor: unknown
): TipoExemplarBiblioteca {
    if (
        typeof valor !== "string" ||
        !TIPOS_EXEMPLAR.has(
            valor as TipoExemplarBiblioteca
        )
    ) {
        falhar(
            400,
            "O tipo do exemplar é inválido.",
            "TIPO_EXEMPLAR_INVALIDO"
        );
    }

    return valor as TipoExemplarBiblioteca;
}

function dataOpcional(
    valor: unknown,
    campo: string
) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    if (typeof valor !== "string") {
        falhar(
            400,
            `O campo ${campo} possui uma data inválida.`,
            "DATA_INVALIDA",
            { campo }
        );
    }

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        falhar(
            400,
            `O campo ${campo} possui uma data inválida.`,
            "DATA_INVALIDA",
            { campo }
        );
    }

    return data;
}

function decimalOpcional(
    valor: unknown,
    campo: string
) {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return null;
    }

    const normalizado =
        typeof valor === "string"
            ? valor
                .trim()
                .replace(/\./g, "")
                .replace(",", ".")
            : String(valor);

    try {
        const decimal =
            new Prisma.Decimal(normalizado);

        if (decimal.isNegative()) {
            falhar(
                400,
                `O campo ${campo} não pode ser negativo.`,
                "VALOR_INVALIDO",
                { campo }
            );
        }

        return decimal;
    } catch {
        falhar(
            400,
            `O campo ${campo} possui um valor inválido.`,
            "VALOR_INVALIDO",
            { campo }
        );
    }
}

function obterIp(
    request: NextRequest
) {
    const encaminhado =
        request.headers.get("x-forwarded-for");

    return (
        encaminhado
            ?.split(",")[0]
            ?.trim() ||
        request.headers.get("x-real-ip") ||
        null
    );
}

function responderErro(
    erro: unknown
) {
    if (
        erro instanceof
        Prisma.PrismaClientKnownRequestError &&
        erro.code === "P2002"
    ) {
        return responder(
            {
                error:
                    "Já existe um exemplar com um destes identificadores nesta instituição.",
                codigo:
                    "EXEMPLAR_IDENTIFICADOR_DUPLICADO",
            },
            409
        );
    }

    const resposta =
        respostaErroBiblioteca(erro);

    return responder(
        resposta.corpo,
        resposta.status
    );
}

/* =========================================================
   GET
   Lista os exemplares ativos e baixados do item
   ========================================================= */

export async function GET(
    request: NextRequest,
    { params }: ContextoRota
) {
    try {
        const usuario =
            await getUserFromToken();

        const contexto =
            await obterContextoBiblioteca(
                usuario
            );

        if (!usuario) {
            falhar(
                401,
                "Usuário não autenticado.",
                "NAO_AUTENTICADO"
            );
        }

        exigirPermissaoBiblioteca(
            usuario,
            contexto,
            "biblioteca.exemplares.ver"
        );

        const itemId =
            obterItemId(params);

        const item =
            await prisma.bibliotecaItem.findFirst(
                {
                    where: {
                        id: itemId,
                        instituicaoId:
                            contexto.instituicaoId,
                    },
                    select: {
                        id: true,
                        titulo: true,
                    },
                }
            );

        if (!item) {
            falhar(
                404,
                "Item do acervo não encontrado.",
                "ITEM_NAO_ENCONTRADO"
            );
        }

        let podeGerenciar =
            !usuario.impersonacao;

        if (podeGerenciar) {
            try {
                exigirPermissaoBiblioteca(
                    usuario,
                    contexto,
                    "biblioteca.exemplares.gerenciar"
                );
            } catch {
                podeGerenciar = false;
            }
        }

        let podeBaixar =
            !usuario.impersonacao;

        if (podeBaixar) {
            try {
                exigirPermissaoBiblioteca(
                    usuario,
                    contexto,
                    "biblioteca.exemplares.baixar"
                );
            } catch {
                podeBaixar = false;
            }
        }

        let podeGerenciarManutencao =
            !usuario.impersonacao;

        if (podeGerenciarManutencao) {
            try {
                exigirPermissaoBiblioteca(
                    usuario,
                    contexto,
                    "biblioteca.exemplares.manutencao"
                );
            } catch {
                podeGerenciarManutencao = false;
            }
        }

        const exemplares =
            await prisma.bibliotecaExemplar.findMany(
                {
                    where: {
                        instituicaoId:
                            contexto.instituicaoId,
                        itemId,
                    },
                    orderBy: [
                        {
                            baixadoEm: "asc",
                        },
                        {
                            id: "asc",
                        },
                    ],
                    select: EXEMPLAR_SELECT,
                }
            );

        const exemplaresComManutencao =
            exemplares.map(
                ({
                    manutencoes,
                    ...exemplar
                }) => ({
                    ...exemplar,

                    manutencaoAberta:
                        manutencoes[0] ??
                        null,
                })
            );

        return responder({
            ok: true,

            item: {
                id: item.id,
                titulo: item.titulo,
            },

            exemplares:
                exemplaresComManutencao,

            total:
                exemplaresComManutencao.length,

            permissoes: {
                podeGerenciar,
                podeBaixar,
                podeGerenciarManutencao,

                impersonacao:
                    usuario.impersonacao,
            },
        });
    } catch (erro) {
        return responderErro(erro);
    }
}

/* =========================================================
   POST
   Cadastra um novo exemplar
   ========================================================= */

export async function POST(
    request: NextRequest,
    { params }: ContextoRota
) {
    try {
        const usuario =
            await getUserFromToken();

        const contexto =
            await obterContextoBiblioteca(
                usuario
            );

        if (!usuario) {
            falhar(
                401,
                "Usuário não autenticado.",
                "NAO_AUTENTICADO"
            );
        }

        if (usuario.impersonacao) {
            falhar(
                403,
                "Não é permitido cadastrar exemplares durante uma sessão de suporte.",
                "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
            );
        }

        exigirPermissaoBiblioteca(
            usuario,
            contexto,
            "biblioteca.exemplares.gerenciar"
        );

        const itemId =
            obterItemId(params);

        const corpo =
            await lerCorpo(request);

        const tipo =
            tipoExemplar(corpo.tipo);

        const codigoInterno =
            textoObrigatorio(
                corpo.codigoInterno,
                "codigoInterno",
                120
            );

        const codigoBarras =
            textoOpcional(
                corpo.codigoBarras,
                "codigoBarras",
                120
            );

        const numeroTombo =
            textoOpcional(
                corpo.numeroTombo,
                "numeroTombo",
                120
            );

        const patrimonio =
            textoOpcional(
                corpo.patrimonio,
                "patrimonio",
                120
            );

        const licencaId =
            inteiroOpcional(
                corpo.licencaId,
                "licencaId"
            );

        const poloIdSnapshot =
            inteiroOpcional(
                corpo.poloIdSnapshot,
                "poloIdSnapshot"
            );

        const unidadeSnapshot =
            textoOpcional(
                corpo.unidadeSnapshot,
                "unidadeSnapshot",
                200
            );

        const setor =
            textoOpcional(
                corpo.setor,
                "setor",
                160
            );

        const sala =
            textoOpcional(
                corpo.sala,
                "sala",
                120
            );

        const estante =
            textoOpcional(
                corpo.estante,
                "estante",
                120
            );

        const prateleira =
            textoOpcional(
                corpo.prateleira,
                "prateleira",
                120
            );

        const localizacaoCompleta =
            textoOpcional(
                corpo.localizacaoCompleta,
                "localizacaoCompleta",
                500
            );

        const dataAquisicao =
            dataOpcional(
                corpo.dataAquisicao,
                "dataAquisicao"
            );

        const formaAquisicao =
            textoOpcional(
                corpo.formaAquisicao,
                "formaAquisicao",
                160
            );

        const fornecedor =
            textoOpcional(
                corpo.fornecedor,
                "fornecedor",
                240
            );

        const valorAquisicao =
            decimalOpcional(
                corpo.valorAquisicao,
                "valorAquisicao"
            );

        const permiteEmprestimo =
            booleanoOpcional(
                corpo.permiteEmprestimo,
                "permiteEmprestimo",
                true
            );

        const observacoes =
            textoOpcional(
                corpo.observacoes,
                "observacoes",
                10_000
            );

        const item =
            await prisma.bibliotecaItem.findFirst(
                {
                    where: {
                        id: itemId,
                        instituicaoId:
                            contexto.instituicaoId,
                    },
                    select: {
                        id: true,
                        titulo: true,
                        arquivadoEm: true,
                    },
                }
            );

        if (!item) {
            falhar(
                404,
                "Item do acervo não encontrado.",
                "ITEM_NAO_ENCONTRADO"
            );
        }

        if (item.arquivadoEm) {
            falhar(
                409,
                "Não é possível cadastrar exemplares em um item arquivado.",
                "ITEM_ARQUIVADO"
            );
        }

        if (licencaId) {
            const licenca =
                await prisma.bibliotecaLicenca.findFirst(
                    {
                        where: {
                            id: licencaId,
                            instituicaoId:
                                contexto.instituicaoId,
                            itemId,
                            ativo: true,
                        },
                        select: {
                            id: true,
                        },
                    }
                );

            if (!licenca) {
                falhar(
                    400,
                    "A licença informada não pertence a este item ou não está ativa.",
                    "LICENCA_INVALIDA"
                );
            }
        }

        const filtrosDuplicidade:
            Prisma.BibliotecaExemplarWhereInput[] =
            [
                {
                    codigoInterno,
                },
            ];

        if (codigoBarras) {
            filtrosDuplicidade.push({
                codigoBarras,
            });
        }

        if (numeroTombo) {
            filtrosDuplicidade.push({
                numeroTombo,
            });
        }

        const duplicado =
            await prisma.bibliotecaExemplar.findFirst(
                {
                    where: {
                        instituicaoId:
                            contexto.instituicaoId,
                        OR: filtrosDuplicidade,
                    },
                    select: {
                        id: true,
                        codigoInterno: true,
                        codigoBarras: true,
                        numeroTombo: true,
                    },
                }
            );

        if (duplicado) {
            if (
                duplicado.codigoInterno ===
                codigoInterno
            ) {
                falhar(
                    409,
                    "Já existe um exemplar com este código interno nesta instituição.",
                    "CODIGO_INTERNO_DUPLICADO"
                );
            }

            if (
                codigoBarras &&
                duplicado.codigoBarras ===
                codigoBarras
            ) {
                falhar(
                    409,
                    "Já existe um exemplar com este código de barras nesta instituição.",
                    "CODIGO_BARRAS_DUPLICADO"
                );
            }

            if (
                numeroTombo &&
                duplicado.numeroTombo ===
                numeroTombo
            ) {
                falhar(
                    409,
                    "Já existe um exemplar com este número de tombo nesta instituição.",
                    "NUMERO_TOMBO_DUPLICADO"
                );
            }

            falhar(
                409,
                "Já existe um exemplar com estes identificadores nesta instituição.",
                "EXEMPLAR_DUPLICADO"
            );
        }

        const ip = obterIp(request);

        const userAgent =
            request.headers.get("user-agent");

        const exemplar =
            await prisma.$transaction(
                async (transacao) => {
                    const criado =
                        await transacao
                            .bibliotecaExemplar
                            .create({
                                data: {
                                    instituicaoId:
                                        contexto.instituicaoId,

                                    itemId,
                                    licencaId,

                                    tipo,

                                    status:
                                        StatusExemplarBiblioteca.DISPONIVEL,

                                    codigoInterno,
                                    codigoBarras,
                                    numeroTombo,
                                    patrimonio,

                                    poloIdSnapshot,
                                    unidadeSnapshot,
                                    setor,
                                    sala,
                                    estante,
                                    prateleira,
                                    localizacaoCompleta,

                                    dataAquisicao,
                                    formaAquisicao,
                                    fornecedor,
                                    valorAquisicao,

                                    permiteEmprestimo,
                                    observacoes,

                                    criadoPorId:
                                        usuario.id,

                                    atualizadoPorId:
                                        usuario.id,
                                },

                                select:
                                    EXEMPLAR_SELECT,
                            });

                    await transacao
                        .bibliotecaAuditoria
                        .create({
                            data: {
                                instituicaoId:
                                    contexto.instituicaoId,

                                usuarioId:
                                    usuario.id,

                                entidade:
                                    "BibliotecaExemplar",

                                entidadeId:
                                    String(criado.id),

                                acao:
                                    AcaoAuditoriaBiblioteca.CRIAR,

                                descricao:
                                    "Exemplar cadastrado no acervo da Biblioteca Virtual.",

                                dadosPosteriores: {
                                    itemId,
                                    exemplarId:
                                        criado.id,

                                    tipo:
                                        criado.tipo,

                                    status:
                                        criado.status,

                                    codigoInterno:
                                        criado.codigoInterno,

                                    codigoBarras:
                                        criado.codigoBarras,

                                    numeroTombo:
                                        criado.numeroTombo,

                                    patrimonio:
                                        criado.patrimonio,

                                    localizacaoCompleta:
                                        criado.localizacaoCompleta,

                                    permiteEmprestimo:
                                        criado.permiteEmprestimo,
                                },

                                metadados: {
                                    origem:
                                        "api_admin_biblioteca_exemplares",

                                    itemTitulo:
                                        item.titulo,
                                },

                                ip,
                                userAgent,
                            },
                        });

                    return criado;
                },
                {
                    maxWait: 5_000,
                    timeout: 10_000,
                }
            );

        return responder(
            {
                ok: true,
                mensagem:
                    "Exemplar cadastrado com sucesso.",
                exemplar,
            },
            201
        );
    } catch (erro) {
        return responderErro(erro);
    }
}