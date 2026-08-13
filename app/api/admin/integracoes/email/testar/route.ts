import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { descriptografarSenhaEmail } from "@/lib/email-instituicao/crypto";
import { usuarioTemPermissao } from "@/lib/permissoes-server";

export const runtime = "nodejs";

function normalizarTexto(valor: unknown) {
    return String(valor ?? "").trim();
}

function normalizarPorta(valor: unknown) {
    const porta = Number(valor);

    if (
        !Number.isInteger(porta) ||
        porta <= 0 ||
        porta > 65535
    ) {
        return null;
    }

    return porta;
}

function normalizarBooleano(
    valor: unknown,
    padrao = false
) {
    if (typeof valor === "boolean") {
        return valor;
    }

    if (typeof valor === "string") {
        const texto = valor
            .trim()
            .toLowerCase();

        if (texto === "true") {
            return true;
        }

        if (texto === "false") {
            return false;
        }
    }

    if (typeof valor === "number") {
        return valor === 1;
    }

    return padrao;
}

export async function POST(req: Request) {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                {
                    error: "Não autenticado",
                },
                {
                    status: 401,
                }
            );
        }

        const temPermissao =
            await usuarioTemPermissao(
                user,
                "integracoes.email.gerenciar"
            );

        if (!temPermissao) {
            return NextResponse.json(
                {
                    error:
                        "Você não possui permissão para testar o e-mail institucional.",
                },
                {
                    status: 403,
                }
            );
        }

        if (!user.instituicaoId) {
            return NextResponse.json(
                {
                    error:
                        "Instituição não identificada",
                },
                {
                    status: 400,
                }
            );
        }

        const body = await req.json();

        const host = normalizarTexto(
            body?.host
        );

        const port = normalizarPorta(
            body?.port
        );

        const secure =
            normalizarBooleano(
                body?.secure
            );

        const usuario = normalizarTexto(
            body?.usuario
        );

        /*
         * A senha enviada pelo formulário
         * será utilizada apenas para o teste.
         *
         * Ela NÃO será salva aqui.
         */
        let senha = normalizarTexto(
            body?.senha
        );

        if (!host) {
            return NextResponse.json(
                {
                    error:
                        "Informe o servidor SMTP.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!port) {
            return NextResponse.json(
                {
                    error:
                        "Informe uma porta SMTP válida.",
                },
                {
                    status: 400,
                }
            );
        }

        if (!usuario) {
            return NextResponse.json(
                {
                    error:
                        "Informe o usuário SMTP.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Se o usuário estiver editando uma configuração
         * já existente e deixar o campo senha vazio,
         * usamos a senha que já está criptografada no banco.
         *
         * Em nenhum momento essa senha volta para o navegador.
         */
        if (!senha) {
            const configuracaoExistente =
                await prisma.configuracaoEmailInstituicao.findUnique({
                    where: {
                        instituicaoId:
                            user.instituicaoId,
                    },
                    select: {
                        senhaCriptografada: true,
                    },
                });

            if (
                !configuracaoExistente
                    ?.senhaCriptografada
            ) {
                return NextResponse.json(
                    {
                        error:
                            "Informe a senha SMTP para testar a conexão.",
                    },
                    {
                        status: 400,
                    }
                );
            }

            try {
                senha =
                    descriptografarSenhaEmail(
                        configuracaoExistente
                            .senhaCriptografada
                    );
            } catch (error) {
                console.error(
                    "ERRO AO DESCRIPTOGRAFAR SENHA SMTP PARA TESTE:",
                    error
                );

                return NextResponse.json(
                    {
                        error:
                            "Não foi possível acessar a senha SMTP cadastrada. Informe novamente a senha.",
                    },
                    {
                        status: 400,
                    }
                );
            }
        }

        /*
         * Criamos um transporter temporário.
         *
         * Esta rota NÃO grava nada.
         */
        const transporter =
            nodemailer.createTransport({
                host,
                port,
                secure,

                auth: {
                    user: usuario,
                    pass: senha,
                },

                connectionTimeout: 15000,
                greetingTimeout: 15000,
                socketTimeout: 20000,
            });

        /*
         * verify() testa:
         *
         * - conexão com o servidor;
         * - TLS/SSL quando aplicável;
         * - autenticação SMTP.
         *
         * Nenhum e-mail é enviado.
         */
        await transporter.verify();

        return NextResponse.json({
            ok: true,

            message:
                "Conexão SMTP realizada com sucesso.",

            servidor: {
                host,
                port,
                secure,
                usuario,
            },
        });
    } catch (error: any) {
        console.error(
            "ERRO AO TESTAR CONFIGURAÇÃO SMTP:",
            {
                nome:
                    error?.name || null,

                codigo:
                    error?.code || null,

                comando:
                    error?.command || null,

                resposta:
                    error?.response || null,

                mensagem:
                    error?.message || null,
            }
        );

        /*
         * Não devolvemos detalhes internos completos
         * nem credenciais para o navegador.
         */
        let mensagem =
            "Não foi possível conectar ao servidor SMTP.";

        const codigo = String(
            error?.code || ""
        ).toUpperCase();

        if (
            codigo === "EAUTH"
        ) {
            mensagem =
                "Falha na autenticação SMTP. Verifique o usuário e a senha.";
        } else if (
            codigo === "ECONNECTION" ||
            codigo === "ECONNREFUSED"
        ) {
            mensagem =
                "Não foi possível conectar ao servidor SMTP. Verifique o servidor, a porta e o tipo de conexão.";
        } else if (
            codigo === "ETIMEDOUT"
        ) {
            mensagem =
                "O servidor SMTP demorou demais para responder. Verifique o servidor e a porta.";
        } else if (
            String(
                error?.message || ""
            )
                .toLowerCase()
                .includes("certificate")
        ) {
            mensagem =
                "O servidor SMTP apresentou um problema no certificado de segurança.";
        }

        return NextResponse.json(
            {
                ok: false,
                error: mensagem,
            },
            {
                status: 400,
            }
        );
    }
}