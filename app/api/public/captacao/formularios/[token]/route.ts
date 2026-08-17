import {
    MapeamentoCampoFormularioCaptacaoLead,
    StatusFormularioCaptacaoLead,
    TipoCampoFormularioCaptacaoLead,
} from "@prisma/client";

import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
    status: number;
    codigo: string;

    constructor(
        status: number,
        mensagem: string,
        codigo: string
    ) {
        super(mensagem);

        this.name = "ErroHttp";
        this.status = status;
        this.codigo = codigo;
    }
}

function textoOuNull(
    valor: unknown
) {
    const texto =
        String(valor ?? "").trim();

    return texto || null;
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
            },
            {
                status: error.status,

                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",

                    "Access-Control-Allow-Origin":
                        "*",
                },
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
                "Não foi possível carregar o formulário de captação.",

            codigo:
                "ERRO_INTERNO",
        },
        {
            status: 500,

            headers: {
                "Cache-Control":
                    "no-store, no-cache, must-revalidate",

                "Access-Control-Allow-Origin":
                    "*",
            },
        }
    );
}

export async function OPTIONS() {
    return new NextResponse(
        null,
        {
            status: 204,

            headers: {
                "Access-Control-Allow-Origin":
                    "*",

                "Access-Control-Allow-Methods":
                    "GET, OPTIONS",

                "Access-Control-Allow-Headers":
                    "Content-Type",

                "Access-Control-Max-Age":
                    "86400",
            },
        }
    );
}

export async function GET(
    _req: NextRequest,
    ctx: {
        params: {
            token: string;
        };
    }
) {
    try {
        const token =
            textoOuNull(
                ctx.params.token
            );

        if (
            !token ||
            token.length > 250
        ) {
            throw new ErroHttp(
                400,
                "Formulário inválido.",
                "FORMULARIO_INVALIDO"
            );
        }

        /*
         * Só formulários efetivamente
         * publicados podem sair pela
         * API pública.
         */
        const formulario =
            await prisma.formularioCaptacaoLead.findFirst({
                where: {
                    tokenPublico:
                        token,

                    status:
                        StatusFormularioCaptacaoLead.PUBLICADO,

                    publico: true,
                    ativo: true,

                    arquivadoEm:
                        null,
                },

                select: {
                    instituicaoId:
                        true,
                    tokenPublico:
                        true,

                    titulo: true,
                    descricao: true,

                    mensagemSucesso:
                        true,

                    urlRedirecionamento:
                        true,

                    versao: true,

                    exigeConsentimento:
                        true,

                    textoConsentimento:
                        true,

                    versaoConsentimento:
                        true,

                    politicaPrivacidadeUrl:
                        true,

                    configuracaoVisual:
                        true,

                    recaptchaAtivo:
                        true,

                    honeypotAtivo:
                        true,

                    campos: {
                        where: {
                            ativo: true,
                        },

                        select: {
                            chave: true,
                            rotulo: true,
                            tipo: true,
                            mapeamento: true,

                            placeholder:
                                true,

                            textoAjuda:
                                true,

                            valorPadrao:
                                true,

                            mascara:
                                true,

                            obrigatorio:
                                true,

                            ordem: true,
                            largura: true,

                            opcoes: true,
                            validacoes:
                                true,
                        },

                        orderBy: {
                            ordem:
                                "asc",
                        },
                    },
                },
            });

        if (!formulario) {
            /*
             * Não diferenciamos entre
             * inexistente, pausado,
             * privado ou arquivado.
             *
             * Para o público externo,
             * todos simplesmente não
             * estão disponíveis.
             */
            throw new ErroHttp(
                404,
                "Formulário de captação não encontrado ou indisponível.",
                "FORMULARIO_INDISPONIVEL"
            );
        }

        const precisaCursos =
            formulario.campos.some(
                (campo) =>
                    campo.mapeamento ===
                    MapeamentoCampoFormularioCaptacaoLead.CURSO_INTERESSE_ID
            );

        const precisaPolos =
            formulario.campos.some(
                (campo) =>
                    campo.mapeamento ===
                    MapeamentoCampoFormularioCaptacaoLead.POLO_INTERESSE_ID
            );

        const [
            cursos,
            polos,
        ] = await Promise.all([
            precisaCursos
                ? prisma.curso.findMany({
                    where: {
                        instituicaoId:
                            formulario.instituicaoId,

                        ativo: true,
                        excluidoEm: null,
                    },

                    select: {
                        id: true,
                        nome: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                })
                : Promise.resolve([]),

            precisaPolos
                ? prisma.polo.findMany({
                    where: {
                        instituicaoId:
                            formulario.instituicaoId,

                        ativo: true,
                    },

                    select: {
                        id: true,
                        nome: true,
                    },

                    orderBy: {
                        nome: "asc",
                    },
                })
                : Promise.resolve([]),
        ]);

        const camposPublicos =
            formulario.campos.map(
                (campo) => {
                    if (
                        campo.mapeamento ===
                        MapeamentoCampoFormularioCaptacaoLead.CURSO_INTERESSE_ID
                    ) {
                        return {
                            ...campo,

                            opcoes:
                                cursos.map(
                                    (curso) => ({
                                        value:
                                            String(
                                                curso.id
                                            ),

                                        label:
                                            curso.nome,
                                    })
                                ),
                        };
                    }

                    if (
                        campo.mapeamento ===
                        MapeamentoCampoFormularioCaptacaoLead.POLO_INTERESSE_ID
                    ) {
                        /*
                         * Se existe somente uma unidade,
                         * não faz sentido perguntar ao
                         * interessado qual unidade deseja.
                         *
                         * O PHANYX envia o polo
                         * automaticamente como campo oculto.
                         */
                        if (
                            polos.length === 1
                        ) {
                            return {
                                ...campo,

                                tipo:
                                    TipoCampoFormularioCaptacaoLead.OCULTO,

                                valorPadrao:
                                    String(
                                        polos[0].id
                                    ),

                                opcoes: [
                                    {
                                        value:
                                            String(
                                                polos[0].id
                                            ),

                                        label:
                                            polos[0].nome,
                                    },
                                ],
                            };
                        }

                        /*
                         * Com várias unidades,
                         * o interessado escolhe
                         * normalmente.
                         */
                        return {
                            ...campo,

                            tipo:
                                TipoCampoFormularioCaptacaoLead.SELECAO_UNICA,

                            valorPadrao:
                                null,

                            placeholder:
                                "Selecione uma unidade",

                            opcoes:
                                polos.map(
                                    (polo) => ({
                                        value:
                                            String(
                                                polo.id
                                            ),

                                        label:
                                            polo.nome,
                                    })
                                ),
                        };
                    }

                    return campo;
                }
            );

        return NextResponse.json(
            {
                success: true,

                formulario: {
                    token:
                        formulario.tokenPublico,

                    titulo:
                        formulario.titulo,

                    descricao:
                        formulario.descricao,

                    mensagemSucesso:
                        formulario.mensagemSucesso,

                    urlRedirecionamento:
                        formulario.urlRedirecionamento,

                    versao:
                        formulario.versao,

                    consentimento: {
                        exigido:
                            formulario.exigeConsentimento,

                        texto:
                            formulario.textoConsentimento,

                        versao:
                            formulario.versaoConsentimento,

                        politicaPrivacidadeUrl:
                            formulario.politicaPrivacidadeUrl,
                    },

                    visual:
                        formulario.configuracaoVisual,

                    antiSpam: {
                        honeypot: {
                            ativo:
                                formulario.honeypotAtivo,

                            campo:
                                formulario.honeypotAtivo
                                    ? "_phanyx_hp"
                                    : null,
                        },

                        recaptcha: {
                            ativo:
                                formulario.recaptchaAtivo,

                            siteKey:
                                formulario.recaptchaAtivo
                                    ? (
                                        process.env
                                            .NEXT_PUBLIC_RECAPTCHA_SITE_KEY ??
                                        null
                                    )
                                    : null,
                        },
                    },

                    campos:
                        camposPublicos,
                },
            },
            {
                status: 200,

                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",

                    "Access-Control-Allow-Origin":
                        "*",
                },
            }
        );
    } catch (error) {
        return responderErro(
            error,
            "Erro ao consultar formulário público de captação:"
        );
    }
}