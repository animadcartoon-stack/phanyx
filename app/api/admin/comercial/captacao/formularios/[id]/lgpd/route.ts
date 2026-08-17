import {
    NextRequest,
    NextResponse,
} from "next/server";

import { prisma } from "@/lib/prisma";

import {
    getUserFromToken,
    UsuarioLogado,
} from "@/lib/server-auth";

import {
    usuarioPossuiPermissao,
} from "@/lib/server-permissions";

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

function ehMasterReal(
    user: UsuarioLogado
) {
    return (
        user.isMasterAdmin === true &&
        user.impersonacao === false &&
        user.email
            .trim()
            .toLowerCase() ===
            "academicophanyx@gmail.com"
    );
}

async function temPermissao(
    user: UsuarioLogado,
    chave: string
) {
    if (ehMasterReal(user)) {
        return true;
    }

    return usuarioPossuiPermissao(
        user,
        chave
    );
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
    valor: unknown
) {
    const texto =
        String(
            valor ?? ""
        ).trim();

    return texto || null;
}

function booleanoOuNull(
    valor: unknown
) {
    if (
        typeof valor ===
        "boolean"
    ) {
        return valor;
    }

    const texto =
        String(
            valor ?? ""
        )
            .trim()
            .toLowerCase();

    if (
        ["true", "1", "sim"].includes(
            texto
        )
    ) {
        return true;
    }

    if (
        [
            "false",
            "0",
            "nao",
            "não",
        ].includes(texto)
    ) {
        return false;
    }

    return null;
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
                codigo:
                    error.codigo,
            },
            {
                status:
                    error.status,

                headers: {
                    "Cache-Control":
                        "no-store",
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
                "Não foi possível atualizar a proteção de dados deste formulário.",
            codigo:
                "ERRO_INTERNO",
        },
        {
            status: 500,

            headers: {
                "Cache-Control":
                    "no-store",
            },
        }
    );
}

async function autenticar(
    permissao:
        | "ver"
        | "gerenciar"
) {
    const user =
        await getUserFromToken();

    if (!user) {
        throw new ErroHttp(
            401,
            "Não autenticado.",
            "NAO_AUTENTICADO"
        );
    }

    const instituicaoId =
        numeroPositivo(
            user.instituicaoId
        );

    if (!instituicaoId) {
        throw new ErroHttp(
            400,
            "Instituição inválida.",
            "INSTITUICAO_INVALIDA"
        );
    }

    const podeGerenciar =
        await temPermissao(
            user,
            "comercial.captacao.formularios.gerenciar"
        );

    const podeVer =
        podeGerenciar ||
        await temPermissao(
            user,
            "comercial.captacao.formularios.ver"
        );

    if (
        permissao === "ver" &&
        !podeVer
    ) {
        throw new ErroHttp(
            403,
            "Você não tem permissão para visualizar esta configuração.",
            "SEM_PERMISSAO"
        );
    }

    if (
        permissao ===
            "gerenciar" &&
        !podeGerenciar
    ) {
        throw new ErroHttp(
            403,
            "Você não tem permissão para alterar esta configuração.",
            "SEM_PERMISSAO"
        );
    }

    return {
        user,
        instituicaoId,
        podeGerenciar,
    };
}

export async function GET(
    _req: NextRequest,
    ctx: {
        params: {
            id: string;
        };
    }
) {
    try {
        const {
            instituicaoId,
            podeGerenciar,
        } =
            await autenticar(
                "ver"
            );

        const formularioId =
            numeroPositivo(
                ctx.params.id
            );

        if (!formularioId) {
            throw new ErroHttp(
                400,
                "Formulário inválido.",
                "FORMULARIO_INVALIDO"
            );
        }

        const formulario =
            await prisma.formularioCaptacaoLead.findFirst({
                where: {
                    id:
                        formularioId,

                    instituicaoId,
                },

                select: {
                    id: true,
                    titulo: true,
                    status: true,

                    exigeConsentimento:
                        true,

                    textoConsentimento:
                        true,

                    versaoConsentimento:
                        true,

                    politicaPrivacidadeUrl:
                        true,

                    atualizadoEm:
                        true,

                    instituicao: {
                        select: {
                            nome: true,
                        },
                    },
                },
            });

        if (!formulario) {
            throw new ErroHttp(
                404,
                "Formulário não encontrado.",
                "FORMULARIO_NAO_ENCONTRADO"
            );
        }

        const textoSugerido =
            `Autorizo ${formulario.instituicao.nome} a utilizar os dados informados neste formulário para entrar em contato comigo e fornecer informações relacionadas ao meu interesse.`;

        return NextResponse.json(
            {
                success: true,

                permissoes: {
                    podeGerenciar,
                },

                lgpd: {
                    exigeConsentimento:
                        formulario.exigeConsentimento,

                    textoConsentimento:
                        formulario.textoConsentimento,

                    textoSugerido,

                    versaoConsentimento:
                        formulario.versaoConsentimento,

                    politicaPrivacidadeUrl:
                        formulario.politicaPrivacidadeUrl,

                    atualizadoEm:
                        formulario.atualizadoEm,

                    configurado:
                        !formulario.exigeConsentimento ||
                        Boolean(
                            formulario
                                .textoConsentimento
                                ?.trim() &&
                            formulario
                                .versaoConsentimento
                                ?.trim()
                        ),
                },
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
            "Erro ao consultar LGPD do formulário:"
        );
    }
}

export async function PATCH(
    req: NextRequest,
    ctx: {
        params: {
            id: string;
        };
    }
) {
    try {
        const {
            user,
            instituicaoId,
        } =
            await autenticar(
                "gerenciar"
            );

        const formularioId =
            numeroPositivo(
                ctx.params.id
            );

        if (!formularioId) {
            throw new ErroHttp(
                400,
                "Formulário inválido.",
                "FORMULARIO_INVALIDO"
            );
        }

        const body =
            await req
                .json()
                .catch(
                    () => null
                );

        if (
            !body ||
            typeof body !==
                "object" ||
            Array.isArray(body)
        ) {
            throw new ErroHttp(
                400,
                "Dados inválidos.",
                "DADOS_INVALIDOS"
            );
        }

        const atual =
            await prisma.formularioCaptacaoLead.findFirst({
                where: {
                    id:
                        formularioId,

                    instituicaoId,
                },

                select: {
                    id: true,
                    status: true,

                    exigeConsentimento:
                        true,

                    textoConsentimento:
                        true,

                    versaoConsentimento:
                        true,

                    politicaPrivacidadeUrl:
                        true,
                },
            });

        if (!atual) {
            throw new ErroHttp(
                404,
                "Formulário não encontrado.",
                "FORMULARIO_NAO_ENCONTRADO"
            );
        }

        if (
            atual.status ===
            "ARQUIVADO"
        ) {
            throw new ErroHttp(
                409,
                "Um formulário arquivado não pode ser alterado.",
                "FORMULARIO_ARQUIVADO"
            );
        }

        let exigeConsentimento =
            atual.exigeConsentimento;

        if (
            body.exigeConsentimento !==
            undefined
        ) {
            const valor =
                booleanoOuNull(
                    body.exigeConsentimento
                );

            if (valor === null) {
                throw new ErroHttp(
                    400,
                    "Configuração de consentimento inválida.",
                    "CONSENTIMENTO_INVALIDO"
                );
            }

            exigeConsentimento =
                valor;
        }

        const textoConsentimento =
            body.textoConsentimento ===
            undefined
                ? atual.textoConsentimento
                : textoOuNull(
                      body.textoConsentimento
                  );

        const politicaPrivacidadeUrl =
            body.politicaPrivacidadeUrl ===
            undefined
                ? atual.politicaPrivacidadeUrl
                : textoOuNull(
                      body.politicaPrivacidadeUrl
                  );

        if (
            exigeConsentimento &&
            !textoConsentimento
        ) {
            throw new ErroHttp(
                400,
                "Informe a mensagem de autorização que será mostrada ao interessado.",
                "TEXTO_CONSENTIMENTO_OBRIGATORIO"
            );
        }

        if (
            politicaPrivacidadeUrl &&
            !/^https?:\/\//i.test(
                politicaPrivacidadeUrl
            )
        ) {
            throw new ErroHttp(
                400,
                "Informe um link válido para a Política de Privacidade, começando com http:// ou https://.",
                "URL_POLITICA_INVALIDA"
            );
        }

        const alterou =
            exigeConsentimento !==
                atual.exigeConsentimento ||
            textoConsentimento !==
                atual.textoConsentimento ||
            politicaPrivacidadeUrl !==
                atual.politicaPrivacidadeUrl;

        if (!alterou) {
            return NextResponse.json(
                {
                    success: true,
                    message:
                        "Nenhuma alteração foi necessária.",
                },
                {
                    status: 200,

                    headers: {
                        "Cache-Control":
                            "no-store",
                    },
                }
            );
        }

        /*
         * A versão do consentimento
         * é técnica e automática.
         *
         * O administrador não precisa
         * criar ou entender versões.
         */
        const versaoConsentimento =
            exigeConsentimento
                ? new Date()
                      .toISOString()
                : atual
                      .versaoConsentimento;

        const formulario =
            await prisma.formularioCaptacaoLead.update({
                where: {
                    id:
                        atual.id,
                },

                data: {
                    exigeConsentimento,

                    textoConsentimento,

                    politicaPrivacidadeUrl,

                    versaoConsentimento,

                    versao: {
                        increment: 1,
                    },

                    atualizadoPorId:
                        user.id,
                },

                select: {
                    id: true,

                    exigeConsentimento:
                        true,

                    textoConsentimento:
                        true,

                    versaoConsentimento:
                        true,

                    politicaPrivacidadeUrl:
                        true,

                    versao: true,
                    atualizadoEm: true,
                },
            });

        return NextResponse.json(
            {
                success: true,

                message:
                    "Proteção de dados atualizada com sucesso.",

                lgpd: formulario,
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
            "Erro ao atualizar LGPD do formulário:"
        );
    }
}