import { NextRequest, NextResponse } from "next/server";
import { TipoComunicacaoWhatsApp } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function usuarioPodeAdministrarWhatsapp(role?: string | null) {
    const papel = String(role || "").toUpperCase();

    return papel === "ADMIN" || papel === "SUPER_ADMIN";
}

const TIPOS_COMUNICACAO = Object.values(
    TipoComunicacaoWhatsApp
);

//
// GET
// Consulta a configuração atual do WhatsApp da instituição.
//
export async function GET() {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Não autenticado.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!usuarioPodeAdministrarWhatsapp(user.role)) {
            return NextResponse.json(
                {
                    error:
                        "Você não possui permissão para administrar a integração do WhatsApp.",
                },
                {
                    status: 403,
                }
            );
        }

        const instituicaoId = Number(user.instituicaoId);

        if (
            !Number.isFinite(instituicaoId) ||
            instituicaoId <= 0
        ) {
            return NextResponse.json(
                {
                    error: "Instituição inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        const [
            integracao,
            configuracoes,
            quantidadeTemplates,
            quantidadeMensagens,
        ] = await Promise.all([
            prisma.whatsAppInstituicao.findUnique({
                where: {
                    instituicaoId,
                },

                select: {
                    id: true,

                    ativo: true,
                    conectado: true,

                    numeroTelefone: true,
                    numeroExibicao: true,
                    nomeExibicao: true,

                    phoneNumberId: true,
                    whatsappBusinessId: true,
                    metaBusinessId: true,

                    tokenExpiraEm: true,

                    webhookAtivo: true,

                    conectadoEm: true,
                    desconectadoEm: true,

                    ultimaSincronizacaoEm: true,
                    ultimaFalhaEm: true,
                    ultimaFalhaMensagem: true,

                    criadoEm: true,
                    atualizadoEm: true,

                    //
                    // IMPORTANTE:
                    // tokenAcessoCriptografado propositalmente NÃO é retornado.
                    //
                },
            }),

            prisma.whatsAppConfiguracaoComunicacao.findMany({
                where: {
                    instituicaoId,
                },

                select: {
                    id: true,
                    tipoComunicacao: true,
                    ativo: true,
                    criadoEm: true,
                    atualizadoEm: true,
                },

                orderBy: {
                    tipoComunicacao: "asc",
                },
            }),

            prisma.whatsAppTemplate.count({
                where: {
                    instituicaoId,
                },
            }),

            prisma.whatsAppMensagem.count({
                where: {
                    instituicaoId,
                },
            }),
        ]);

        const mapaConfiguracoes = new Map<
            TipoComunicacaoWhatsApp,
            (typeof configuracoes)[number]
        >(
            configuracoes.map((configuracao) => [
                configuracao.tipoComunicacao,
                configuracao,
            ])
        );

        //
        // Retornamos todos os tipos do enum.
        // Se ainda não houver registro no banco, aparece como desativado.
        //
        const comunicacoes = TIPOS_COMUNICACAO.map(
            (tipoComunicacao) => {
                const existente =
                    mapaConfiguracoes.get(tipoComunicacao);

                return {
                    tipoComunicacao,
                    ativo: existente?.ativo ?? false,
                    configuracaoId: existente?.id ?? null,
                };
            }
        );

        return NextResponse.json({
            integracao: integracao
                ? {
                    ...integracao,

                    configurada: true,

                    //
                    // Apenas informa se existe uma credencial salva.
                    // Nunca devolvemos o token.
                    //
                    credencialConfigurada: Boolean(
                        integracao.phoneNumberId
                    ),
                }
                : {
                    configurada: false,

                    ativo: false,
                    conectado: false,

                    numeroTelefone: null,
                    numeroExibicao: null,
                    nomeExibicao: null,

                    webhookAtivo: false,

                    credencialConfigurada: false,
                },

            comunicacoes,

            resumo: {
                quantidadeTemplates,
                quantidadeMensagens,
            },
        });
    } catch (error) {
        console.error(
            "Erro ao consultar integração WhatsApp:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Não foi possível consultar a configuração do WhatsApp.",
            },
            {
                status: 500,
            }
        );
    }
}

//
// PATCH
// Atualiza ativação da integração e/ou dos tipos de comunicação.
//
export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Não autenticado.",
                },
                {
                    status: 401,
                }
            );
        }

        if (!usuarioPodeAdministrarWhatsapp(user.role)) {
            return NextResponse.json(
                {
                    error:
                        "Você não possui permissão para administrar a integração do WhatsApp.",
                },
                {
                    status: 403,
                }
            );
        }

        const instituicaoId = Number(user.instituicaoId);

        if (
            !Number.isFinite(instituicaoId) ||
            instituicaoId <= 0
        ) {
            return NextResponse.json(
                {
                    error: "Instituição inválida.",
                },
                {
                    status: 400,
                }
            );
        }

        let body: {
            ativo?: boolean;

            comunicacao?: {
                tipoComunicacao?: string;
                ativo?: boolean;
            };
        };

        try {
            body = await req.json();
        } catch {
            return NextResponse.json(
                {
                    error: "Dados inválidos.",
                },
                {
                    status: 400,
                }
            );
        }

        //
        // Alteração do status geral da integração.
        //
        if (typeof body.ativo === "boolean") {
            const integracao =
                await prisma.whatsAppInstituicao.findUnique({
                    where: {
                        instituicaoId,
                    },

                    select: {
                        id: true,
                        conectado: true,
                    },
                });

            if (!integracao) {
                return NextResponse.json(
                    {
                        error:
                            "O WhatsApp ainda não foi configurado para esta instituição.",
                    },
                    {
                        status: 409,
                    }
                );
            }

            //
            // Não permitimos ativar uma integração que sequer esteja conectada.
            //
            if (body.ativo && !integracao.conectado) {
                return NextResponse.json(
                    {
                        error:
                            "Conecte o WhatsApp Business antes de ativar os envios.",
                    },
                    {
                        status: 409,
                    }
                );
            }

            await prisma.whatsAppInstituicao.update({
                where: {
                    instituicaoId,
                },

                data: {
                    ativo: body.ativo,
                },
            });
        }

        //
        // Alteração de um tipo específico de comunicação.
        //
        if (body.comunicacao) {
            const tipoRecebido =
                body.comunicacao.tipoComunicacao;

            if (!tipoRecebido) {
                return NextResponse.json(
                    {
                        error:
                            "O tipo de comunicação é obrigatório.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                !TIPOS_COMUNICACAO.includes(
                    tipoRecebido as TipoComunicacaoWhatsApp
                )
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Tipo de comunicação WhatsApp inválido.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            if (
                typeof body.comunicacao.ativo !== "boolean"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Informe se a comunicação deve ficar ativa ou desativada.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            const tipoComunicacao =
                tipoRecebido as TipoComunicacaoWhatsApp;

            await prisma.whatsAppConfiguracaoComunicacao.upsert({
                where: {
                    instituicaoId_tipoComunicacao: {
                        instituicaoId,
                        tipoComunicacao,
                    },
                },

                create: {
                    instituicaoId,
                    tipoComunicacao,
                    ativo: body.comunicacao.ativo,
                },

                update: {
                    ativo: body.comunicacao.ativo,
                },
            });
        }

        return NextResponse.json({
            ok: true,
            message:
                "Configuração do WhatsApp atualizada com sucesso.",
        });
    } catch (error) {
        console.error(
            "Erro ao atualizar integração WhatsApp:",
            error
        );

        return NextResponse.json(
            {
                error:
                    "Não foi possível atualizar a configuração do WhatsApp.",
            },
            {
                status: 500,
            }
        );
    }
}