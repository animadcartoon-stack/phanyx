import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { criptografarSenhaEmail } from "@/lib/email-instituicao/crypto";
import { usuarioTemPermissao } from "@/lib/permissoes-server";

function normalizarTexto(valor: unknown) {
    return String(valor ?? "").trim();
}

function normalizarPorta(valor: unknown) {
    const porta = Number(valor);

    if (!Number.isInteger(porta) || porta <= 0 || porta > 65535) {
        return null;
    }

    return porta;
}

export async function GET() {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
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
                        "Você não possui permissão para gerenciar o e-mail institucional.",
                },
                {
                    status: 403,
                }
            );
        }

        if (!user.instituicaoId) {
            return NextResponse.json(
                { error: "Instituição não identificada" },
                { status: 400 }
            );
        }

        const configuracao =
            await prisma.configuracaoEmailInstituicao.findUnique({
                where: {
                    instituicaoId: user.instituicaoId,
                },
                select: {
                    id: true,
                    ativo: true,
                    host: true,
                    port: true,
                    secure: true,
                    usuario: true,
                    remetenteNome: true,
                    remetenteEmail: true,
                    criadoEm: true,
                    atualizadoEm: true,
                    senhaCriptografada: true,
                },
            });

        if (!configuracao) {
            return NextResponse.json({
                configurado: false,
                configuracao: null,
            });
        }

        return NextResponse.json({
            configurado: true,
            configuracao: {
                id: configuracao.id,
                ativo: configuracao.ativo,
                host: configuracao.host,
                port: configuracao.port,
                secure: configuracao.secure,
                usuario: configuracao.usuario,
                remetenteNome: configuracao.remetenteNome,
                remetenteEmail: configuracao.remetenteEmail,
                senhaConfigurada: Boolean(
                    configuracao.senhaCriptografada
                ),
                criadoEm: configuracao.criadoEm,
                atualizadoEm: configuracao.atualizadoEm,
            },
        });
    } catch (error: any) {
        console.error(
            "ERRO AO BUSCAR CONFIGURAÇÃO DE EMAIL:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Erro ao buscar configuração de email",
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado" },
                { status: 401 }
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
                        "Você não possui permissão para gerenciar o e-mail institucional.",
                },
                {
                    status: 403,
                }
            );
        }

        if (!user.instituicaoId) {
            return NextResponse.json(
                { error: "Instituição não identificada" },
                { status: 400 }
            );
        }

        const body = await req.json();

        const ativo = Boolean(body?.ativo);
        const host = normalizarTexto(body?.host);
        const port = normalizarPorta(body?.port);
        const secure = Boolean(body?.secure);
        const usuario = normalizarTexto(body?.usuario);

        const senha = normalizarTexto(body?.senha);

        const remetenteNome =
            normalizarTexto(body?.remetenteNome) || null;

        const remetenteEmail =
            normalizarTexto(body?.remetenteEmail).toLowerCase();

        if (!host) {
            return NextResponse.json(
                { error: "Informe o servidor SMTP." },
                { status: 400 }
            );
        }

        if (!port) {
            return NextResponse.json(
                { error: "Informe uma porta SMTP válida." },
                { status: 400 }
            );
        }

        if (!usuario) {
            return NextResponse.json(
                { error: "Informe o usuário SMTP." },
                { status: 400 }
            );
        }

        if (!remetenteEmail) {
            return NextResponse.json(
                { error: "Informe o e-mail remetente." },
                { status: 400 }
            );
        }

        const configuracaoExistente =
            await prisma.configuracaoEmailInstituicao.findUnique({
                where: {
                    instituicaoId: user.instituicaoId,
                },
                select: {
                    id: true,
                    senhaCriptografada: true,
                },
            });

        if (!configuracaoExistente && !senha) {
            return NextResponse.json(
                {
                    error:
                        "Informe a senha SMTP para concluir a configuração.",
                },
                { status: 400 }
            );
        }

        let senhaCriptografada =
            configuracaoExistente?.senhaCriptografada || "";

        if (senha) {
            senhaCriptografada =
                criptografarSenhaEmail(senha);
        }

        const configuracao =
            await prisma.configuracaoEmailInstituicao.upsert({
                where: {
                    instituicaoId: user.instituicaoId,
                },
                create: {
                    instituicaoId: user.instituicaoId,
                    ativo,
                    host,
                    port,
                    secure,
                    usuario,
                    senhaCriptografada,
                    remetenteNome,
                    remetenteEmail,
                },
                update: {
                    ativo,
                    host,
                    port,
                    secure,
                    usuario,
                    senhaCriptografada,
                    remetenteNome,
                    remetenteEmail,
                },
                select: {
                    id: true,
                    ativo: true,
                    host: true,
                    port: true,
                    secure: true,
                    usuario: true,
                    remetenteNome: true,
                    remetenteEmail: true,
                    criadoEm: true,
                    atualizadoEm: true,
                },
            });

        return NextResponse.json({
            ok: true,
            message:
                "Configuração de e-mail salva com sucesso.",
            configuracao: {
                ...configuracao,
                senhaConfigurada: true,
            },
        });
    } catch (error: any) {
        console.error(
            "ERRO AO SALVAR CONFIGURAÇÃO DE EMAIL:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Erro ao salvar configuração de email",
            },
            { status: 500 }
        );
    }
}