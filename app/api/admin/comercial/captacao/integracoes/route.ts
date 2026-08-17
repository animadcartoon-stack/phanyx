import {
    Prisma,
    StatusIntegracaoCaptacaoLead,
    TipoIntegracaoCaptacaoLead,
} from "@prisma/client";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import {
    createCipheriv,
    createHash,
    randomBytes,
} from "crypto";

import { prisma } from "@/lib/prisma";
import {
    getUserFromToken,
    type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
    status: number;
    codigo: string;
    detalhes?: Record<string, unknown>;

    constructor(
        status: number,
        mensagem: string,
        codigo: string,
        detalhes?: Record<string, unknown>
    ) {
        super(mensagem);

        this.name = "ErroHttp";
        this.status = status;
        this.codigo = codigo;
        this.detalhes = detalhes;
    }
}

function ehMasterReal(
    user: UsuarioLogado
) {
    return (
        user.isMasterAdmin === true &&
        user.impersonacao === false &&
        user.email.trim().toLowerCase() ===
        "academicophanyx@gmail.com"
    );
}

async function autenticarUsuario() {
    const user =
        await getUserFromToken();

    if (!user) {
        throw new ErroHttp(
            401,
            "Usuário não autenticado.",
            "NAO_AUTENTICADO"
        );
    }

    const instituicaoId =
        Number(user.instituicaoId);

    if (
        !Number.isInteger(instituicaoId) ||
        instituicaoId <= 0
    ) {
        throw new ErroHttp(
            403,
            "O usuário não está vinculado a uma instituição válida.",
            "INSTITUICAO_INVALIDA"
        );
    }

    return {
        user,
        instituicaoId,
    };
}

async function obterPermissoes(
    user: UsuarioLogado
) {
    if (ehMasterReal(user)) {
        return {
            podeVer: true,
            podeGerenciar: true,
        };
    }

    const [
        podeVer,
        podeGerenciar,
    ] = await Promise.all([
        usuarioPossuiPermissao(
            user,
            "comercial.captacao.integracoes.ver"
        ),

        usuarioPossuiPermissao(
            user,
            "comercial.captacao.integracoes.gerenciar"
        ),
    ]);

    return {
        podeVer:
            podeVer ||
            podeGerenciar,

        podeGerenciar,
    };
}

function numeroPositivo(
    valor: unknown
) {
    const numero =
        Number(valor);

    return (
        Number.isInteger(numero) &&
        numero > 0
    )
        ? numero
        : null;
}

function textoOuNull(
    valor: unknown,
    limite = 5000
) {
    const texto =
        String(valor ?? "").trim();

    if (!texto) {
        return null;
    }

    return texto.slice(
        0,
        limite
    );
}

function booleano(
    valor: unknown,
    padrao = false
) {
    if (
        typeof valor === "boolean"
    ) {
        return valor;
    }

    if (
        valor === "true" ||
        valor === "1" ||
        valor === 1
    ) {
        return true;
    }

    if (
        valor === "false" ||
        valor === "0" ||
        valor === 0
    ) {
        return false;
    }

    return padrao;
}

function tipoOuNull(
    valor: unknown
): TipoIntegracaoCaptacaoLead | null {
    const normalizado =
        String(valor ?? "")
            .trim()
            .toUpperCase() as
        TipoIntegracaoCaptacaoLead;

    return Object.values(
        TipoIntegracaoCaptacaoLead
    ).includes(normalizado)
        ? normalizado
        : null;
}

function statusOuNull(
    valor: unknown
): StatusIntegracaoCaptacaoLead | null {
    const normalizado =
        String(valor ?? "")
            .trim()
            .toUpperCase() as
        StatusIntegracaoCaptacaoLead;

    return Object.values(
        StatusIntegracaoCaptacaoLead
    ).includes(normalizado)
        ? normalizado
        : null;
}

function jsonOpcional(
    valor: unknown
): Prisma.InputJsonValue | undefined {
    if (
        valor === undefined ||
        valor === null ||
        valor === ""
    ) {
        return undefined;
    }

    if (
        typeof valor === "string"
    ) {
        try {
            return JSON.parse(
                valor
            ) as Prisma.InputJsonValue;
        } catch {
            throw new ErroHttp(
                400,
                "Foi informada uma configuração JSON inválida.",
                "JSON_INVALIDO"
            );
        }
    }

    return valor as
        Prisma.InputJsonValue;
}

function validarUrl(
    valor: unknown
) {
    const texto =
        textoOuNull(
            valor,
            4000
        );

    if (!texto) {
        return null;
    }

    try {
        const url =
            new URL(texto);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            throw new Error();
        }

        return url.toString();
    } catch {
        throw new ErroHttp(
            400,
            "Informe uma URL de endpoint válida usando HTTP ou HTTPS.",
            "URL_ENDPOINT_INVALIDA"
        );
    }
}

function tipoExigeSegredo(
    tipo: TipoIntegracaoCaptacaoLead
) {
    const tiposComSegredo:
        TipoIntegracaoCaptacaoLead[] = [
            TipoIntegracaoCaptacaoLead.WEBHOOK_ENTRADA,
            TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA,
            TipoIntegracaoCaptacaoLead.API,
        ];

    return tiposComSegredo.includes(
        tipo
    );
}

function obterChaveCriptografia() {
    const segredoBase =
        process.env
            .CAPTACAO_INTEGRACAO_CRYPTO_SECRET ||
        process.env.JWT_SECRET;

    if (!segredoBase) {
        throw new ErroHttp(
            503,
            "A criptografia das integrações ainda não está configurada.",
            "CRIPTOGRAFIA_NAO_CONFIGURADA"
        );
    }

    return createHash(
        "sha256"
    )
        .update(segredoBase)
        .digest();
}

function criptografarSegredo(
    segredo: string
) {
    const chave =
        obterChaveCriptografia();

    const iv =
        randomBytes(12);

    const cipher =
        createCipheriv(
            "aes-256-gcm",
            chave,
            iv
        );

    const criptografado =
        Buffer.concat([
            cipher.update(
                segredo,
                "utf8"
            ),

            cipher.final(),
        ]);

    const tag =
        cipher.getAuthTag();

    return [
        "v1",
        iv.toString("base64url"),
        tag.toString("base64url"),
        criptografado.toString(
            "base64url"
        ),
    ].join(":");
}

function gerarSegredo() {
    return randomBytes(
        32
    ).toString(
        "base64url"
    );
}

function responderErro(
    error: unknown,
    contexto: string
) {
    if (
        error instanceof ErroHttp
    ) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                codigo: error.codigo,
                detalhes:
                    error.detalhes,
            },
            {
                status: error.status,
            }
        );
    }

    if (
        error instanceof
        Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        return NextResponse.json(
            {
                success: false,

                error:
                    "Já existe uma integração com esse nome nesta instituição.",

                codigo:
                    "INTEGRACAO_DUPLICADA",
            },
            {
                status: 409,
            }
        );
    }

    console.error(
        contexto,
        error
    );

    return NextResponse.json(
        {
            success: false,

            error:
                "Não foi possível processar as integrações da Central de Captação.",

            codigo:
                "ERRO_INTERNO",
        },
        {
            status: 500,
        }
    );
}

export async function GET(
    req: NextRequest
) {
    try {
        const {
            user,
            instituicaoId,
        } =
            await autenticarUsuario();

        const permissoes =
            await obterPermissoes(
                user
            );

        if (
            !permissoes.podeVer
        ) {
            throw new ErroHttp(
                403,
                "Você não possui permissão para consultar integrações da Central de Captação.",
                "SEM_PERMISSAO"
            );
        }

        const busca =
            textoOuNull(
                req.nextUrl.searchParams.get(
                    "busca"
                ),
                200
            );

        const tipoParam =
            req.nextUrl.searchParams.get(
                "tipo"
            );

        const tipo =
            tipoParam
                ? tipoOuNull(
                    tipoParam
                )
                : null;

        if (
            tipoParam &&
            !tipo
        ) {
            throw new ErroHttp(
                400,
                "Tipo de integração inválido.",
                "TIPO_INVALIDO"
            );
        }

        const statusParam =
            req.nextUrl.searchParams.get(
                "status"
            );

        const status =
            statusParam
                ? statusOuNull(
                    statusParam
                )
                : null;

        if (
            statusParam &&
            !status
        ) {
            throw new ErroHttp(
                400,
                "Status de integração inválido.",
                "STATUS_INVALIDO"
            );
        }

        const ativoParam =
            req.nextUrl.searchParams.get(
                "ativo"
            );

        const ativo =
            ativoParam === null
                ? null
                : booleano(
                    ativoParam
                );

        const [
            integracoesBanco,
            canais,
            campanhas,
            formularios,
        ] =
            await prisma.$transaction([
                prisma.integracaoCaptacaoLead.findMany({
                    where: {
                        instituicaoId,

                        ...(tipo
                            ? {
                                tipo,
                            }
                            : {}),

                        ...(status
                            ? {
                                status,
                            }
                            : {}),

                        ...(ativo !== null
                            ? {
                                ativo,
                            }
                            : {}),

                        ...(busca
                            ? {
                                OR: [
                                    {
                                        nome: {
                                            contains:
                                                busca,

                                            mode:
                                                "insensitive",
                                        },
                                    },

                                    {
                                        chavePublica: {
                                            contains:
                                                busca,
                                        },
                                    },

                                    {
                                        urlEndpoint: {
                                            contains:
                                                busca,

                                            mode:
                                                "insensitive",
                                        },
                                    },
                                ],
                            }
                            : {}),
                    },

                    select: {
                        id: true,

                        canalId: true,
                        campanhaId: true,
                        formularioId:
                            true,

                        nome: true,
                        tipo: true,
                        status: true,

                        chavePublica:
                            true,

                        segredoCriptografado:
                            true,

                        urlEndpoint:
                            true,

                        configuracao:
                            true,

                        eventosAssinados:
                            true,

                        ativo: true,

                        ultimoSucessoEm:
                            true,

                        ultimoErroEm:
                            true,

                        ultimoErro:
                            true,

                        criadoPorId:
                            true,

                        atualizadoPorId:
                            true,

                        criadoEm: true,
                        atualizadoEm: true,

                        canal: {
                            select: {
                                id: true,
                                nome: true,
                                tipo: true,
                                cor: true,
                                ativo: true,
                            },
                        },

                        campanha: {
                            select: {
                                id: true,
                                nome: true,
                                codigo: true,
                                status: true,
                                ativo: true,
                            },
                        },

                        formulario: {
                            select: {
                                id: true,
                                nome: true,
                                titulo: true,
                                status: true,
                                ativo: true,
                            },
                        },

                        _count: {
                            select: {
                                submissoes:
                                    true,

                                eventos: true,
                            },
                        },
                    },

                    orderBy: [
                        {
                            ativo: "desc",
                        },

                        {
                            atualizadoEm:
                                "desc",
                        },

                        {
                            nome: "asc",
                        },
                    ],
                }),

                prisma.canalCaptacaoLead.findMany({
                    where: {
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        nome: true,
                        tipo: true,
                        cor: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                }),

                prisma.campanhaCaptacaoLead.findMany({
                    where: {
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        canalId: true,
                        nome: true,
                        codigo: true,
                        status: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                }),

                prisma.formularioCaptacaoLead.findMany({
                    where: {
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        canalId: true,
                        campanhaId:
                            true,

                        nome: true,
                        titulo: true,
                        status: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                }),
            ]);

        /*
         * Nunca devolvemos o segredo
         * criptografado para o navegador.
         */
        const integracoes =
            integracoesBanco.map(
                ({
                    segredoCriptografado,
                    ...integracao
                }) => ({
                    ...integracao,

                    possuiSegredo:
                        Boolean(
                            segredoCriptografado
                        ),
                })
            );

        return NextResponse.json(
            {
                success: true,

                permissoes,

                tiposDisponiveis:
                    Object.values(
                        TipoIntegracaoCaptacaoLead
                    ),

                statusDisponiveis:
                    Object.values(
                        StatusIntegracaoCaptacaoLead
                    ),

                resumo: {
                    total:
                        integracoes.length,

                    ativas:
                        integracoes.filter(
                            (item) =>
                                item.ativo &&
                                item.status ===
                                StatusIntegracaoCaptacaoLead.ATIVA
                        ).length,

                    pausadas:
                        integracoes.filter(
                            (item) =>
                                item.status ===
                                StatusIntegracaoCaptacaoLead.PAUSADA
                        ).length,

                    comErro:
                        integracoes.filter(
                            (item) =>
                                item.status ===
                                StatusIntegracaoCaptacaoLead.ERRO
                        ).length,

                    revogadas:
                        integracoes.filter(
                            (item) =>
                                item.status ===
                                StatusIntegracaoCaptacaoLead.REVOGADA
                        ).length,
                },

                referencias: {
                    canais,
                    campanhas,
                    formularios,
                },

                integracoes,
            },
            {
                status: 200,

                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        return responderErro(
            error,
            "Erro ao consultar integrações da Central de Captação:"
        );
    }
}

export async function POST(
    req: NextRequest
) {
    try {
        const {
            user,
            instituicaoId,
        } =
            await autenticarUsuario();

        const permissoes =
            await obterPermissoes(
                user
            );

        if (
            !permissoes.podeGerenciar
        ) {
            throw new ErroHttp(
                403,
                "Você não possui permissão para cadastrar integrações da Central de Captação.",
                "SEM_PERMISSAO"
            );
        }

        const body =
            (await req
                .json()
                .catch(
                    () => null
                )) as
            | Record<
                string,
                unknown
            >
            | null;

        if (!body) {
            throw new ErroHttp(
                400,
                "JSON inválido.",
                "JSON_INVALIDO"
            );
        }

        const nome =
            textoOuNull(
                body.nome,
                180
            );

        if (!nome) {
            throw new ErroHttp(
                400,
                "Informe o nome da integração.",
                "NOME_INVALIDO"
            );
        }

        const existente =
            await prisma.integracaoCaptacaoLead.findFirst({
                where: {
                    instituicaoId,
                    nome,
                },

                select: {
                    id: true,
                },
            });

        if (existente) {
            throw new ErroHttp(
                409,
                "Já existe uma integração com esse nome nesta instituição.",
                "INTEGRACAO_DUPLICADA",
                {
                    integracaoId:
                        existente.id,
                }
            );
        }

        const tipo =
            tipoOuNull(
                body.tipo
            );

        if (!tipo) {
            throw new ErroHttp(
                400,
                "Selecione um tipo válido de integração.",
                "TIPO_INVALIDO"
            );
        }

        let status =
            statusOuNull(
                body.status
            ) ??
            StatusIntegracaoCaptacaoLead.INATIVA;

        let ativo =
            booleano(
                body.ativo,
                true
            );

        if (
            status ===
            StatusIntegracaoCaptacaoLead.REVOGADA
        ) {
            ativo = false;
        }

        if (
            status ===
            StatusIntegracaoCaptacaoLead.ATIVA
        ) {
            ativo = true;
        }

        const urlEndpoint =
            validarUrl(
                body.urlEndpoint
            );

        if (
            tipo ===
            TipoIntegracaoCaptacaoLead.WEBHOOK_SAIDA &&
            !urlEndpoint
        ) {
            throw new ErroHttp(
                400,
                "Webhook de saída exige uma URL de endpoint.",
                "URL_ENDPOINT_OBRIGATORIA"
            );
        }

        const configuracao =
            jsonOpcional(
                body.configuracao
            );

        const eventosAssinados =
            jsonOpcional(
                body.eventosAssinados
            );

        let canalId =
            numeroPositivo(
                body.canalId
            );

        let campanhaId =
            numeroPositivo(
                body.campanhaId
            );

        let formularioId =
            numeroPositivo(
                body.formularioId
            );

        const referenciasRecebidas = [
            {
                campo:
                    "canalId",
                original:
                    body.canalId,
                id:
                    canalId,
            },

            {
                campo:
                    "campanhaId",
                original:
                    body.campanhaId,
                id:
                    campanhaId,
            },

            {
                campo:
                    "formularioId",
                original:
                    body.formularioId,
                id:
                    formularioId,
            },
        ];

        for (
            const referencia of
            referenciasRecebidas
        ) {
            if (
                referencia.original !==
                undefined &&
                referencia.original !==
                null &&
                referencia.original !==
                "" &&
                !referencia.id
            ) {
                throw new ErroHttp(
                    400,
                    `O campo ${referencia.campo} é inválido.`,
                    "REFERENCIA_INVALIDA"
                );
            }
        }

        if (canalId) {
            const canal =
                await prisma.canalCaptacaoLead.findFirst({
                    where: {
                        id: canalId,
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                    },
                });

            if (!canal) {
                throw new ErroHttp(
                    400,
                    "O canal selecionado não existe ou está inativo.",
                    "CANAL_INVALIDO"
                );
            }
        }

        if (campanhaId) {
            const campanha =
                await prisma.campanhaCaptacaoLead.findFirst({
                    where: {
                        id: campanhaId,
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        canalId: true,
                    },
                });

            if (!campanha) {
                throw new ErroHttp(
                    400,
                    "A campanha selecionada não existe ou está inativa.",
                    "CAMPANHA_INVALIDA"
                );
            }

            if (
                canalId &&
                campanha.canalId &&
                campanha.canalId !==
                canalId
            ) {
                throw new ErroHttp(
                    400,
                    "A campanha selecionada pertence a outro canal.",
                    "CAMPANHA_CANAL_DIVERGENTE"
                );
            }

            if (
                !canalId &&
                campanha.canalId
            ) {
                canalId =
                    campanha.canalId;
            }
        }

        if (formularioId) {
            const formulario =
                await prisma.formularioCaptacaoLead.findFirst({
                    where: {
                        id: formularioId,
                        instituicaoId,
                        ativo: true,
                    },

                    select: {
                        id: true,
                        canalId: true,
                        campanhaId: true,
                    },
                });

            if (!formulario) {
                throw new ErroHttp(
                    400,
                    "O formulário selecionado não existe ou está inativo.",
                    "FORMULARIO_INVALIDO"
                );
            }

            if (
                canalId &&
                formulario.canalId &&
                formulario.canalId !==
                canalId
            ) {
                throw new ErroHttp(
                    400,
                    "O formulário selecionado pertence a outro canal.",
                    "FORMULARIO_CANAL_DIVERGENTE"
                );
            }

            if (
                campanhaId &&
                formulario.campanhaId &&
                formulario.campanhaId !==
                campanhaId
            ) {
                throw new ErroHttp(
                    400,
                    "O formulário selecionado pertence a outra campanha.",
                    "FORMULARIO_CAMPANHA_DIVERGENTE"
                );
            }

            if (
                !canalId &&
                formulario.canalId
            ) {
                canalId =
                    formulario.canalId;
            }

            if (
                !campanhaId &&
                formulario.campanhaId
            ) {
                campanhaId =
                    formulario.campanhaId;
            }
        }

        /*
         * Segredo da integração.
         *
         * O navegador envia "segredo"
         * em texto puro somente na
         * criação/troca. O banco recebe
         * apenas a versão criptografada.
         */
        const segredoInformado =
            textoOuNull(
                body.segredo,
                5000
            );

        let segredoAberto:
            string | null =
            segredoInformado;

        if (
            tipoExigeSegredo(
                tipo
            ) &&
            !segredoAberto
        ) {
            segredoAberto =
                gerarSegredo();
        }

        const segredoCriptografado =
            segredoAberto
                ? criptografarSegredo(
                    segredoAberto
                )
                : null;

        const integracaoBanco =
            await prisma.integracaoCaptacaoLead.create({
                data: {
                    instituicaoId,

                    canalId,
                    campanhaId,
                    formularioId,

                    nome,
                    tipo,
                    status,

                    segredoCriptografado,

                    urlEndpoint,

                    ...(configuracao !==
                        undefined
                        ? {
                            configuracao,
                        }
                        : {}),

                    ...(eventosAssinados !==
                        undefined
                        ? {
                            eventosAssinados,
                        }
                        : {}),

                    ativo,

                    criadoPorId:
                        user.id,

                    atualizadoPorId:
                        user.id,
                },

                select: {
                    id: true,

                    canalId: true,
                    campanhaId: true,
                    formularioId:
                        true,

                    nome: true,
                    tipo: true,
                    status: true,

                    chavePublica:
                        true,

                    urlEndpoint:
                        true,

                    configuracao:
                        true,

                    eventosAssinados:
                        true,

                    ativo: true,

                    ultimoSucessoEm:
                        true,

                    ultimoErroEm:
                        true,

                    ultimoErro:
                        true,

                    criadoEm: true,
                    atualizadoEm:
                        true,

                    canal: {
                        select: {
                            id: true,
                            nome: true,
                            tipo: true,
                        },
                    },

                    campanha: {
                        select: {
                            id: true,
                            nome: true,
                            codigo: true,
                        },
                    },

                    formulario: {
                        select: {
                            id: true,
                            nome: true,
                            titulo: true,
                        },
                    },
                },
            });

        /*
         * O segredo gerado pelo PHANYX
         * aparece uma única vez aqui.
         * Depois disso a API nunca
         * devolve o valor criptografado
         * nem tenta recuperá-lo na lista.
         */
        return NextResponse.json(
            {
                success: true,

                message:
                    "Integração de captação criada com sucesso.",

                integracao: {
                    ...integracaoBanco,

                    possuiSegredo:
                        Boolean(
                            segredoCriptografado
                        ),
                },

                credenciais:
                    segredoAberto
                        ? {
                            chavePublica:
                                integracaoBanco
                                    .chavePublica,

                            segredo:
                                segredoAberto,

                            exibirUmaUnicaVez:
                                true,
                        }
                        : {
                            chavePublica:
                                integracaoBanco
                                    .chavePublica,

                            segredo:
                                null,

                            exibirUmaUnicaVez:
                                false,
                        },
            },
            {
                status: 201,

                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        return responderErro(
            error,
            "Erro ao criar integração da Central de Captação:"
        );
    }
}