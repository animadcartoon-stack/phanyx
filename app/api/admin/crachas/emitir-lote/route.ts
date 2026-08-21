import crypto from "node:crypto";
import {
    NextRequest,
    NextResponse,
} from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    getUserFromToken,
    isAdminLike,
} from "@/lib/server-auth";
import { obterPlanoInstituicao } from "@/lib/obter-plano-instituicao";
import { planoTemRecurso } from "@/lib/plano-acesso";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS_VALIDOS = [
    "ALUNO",
    "PROFESSOR",
    "FUNCIONARIO",
    "VISITANTE",
];

const LIMITE_LOTE = 1000;

type PessoaParaEmitir = {
    id: number;
    fotoPerfil: string | null;
    validadeEm?: Date | null;
};

function limparTexto(valor: unknown) {
    return String(valor ?? "").trim();
}

function normalizarTipo(valor: unknown) {
    return limparTexto(valor).toUpperCase();
}

function normalizarIds(valor: unknown) {
    if (!Array.isArray(valor)) {
        return [];
    }

    const ids: number[] = [];
    const encontrados = new Set<number>();

    for (const item of valor) {
        const id = Number(item);

        if (
            !Number.isInteger(id) ||
            id <= 0 ||
            encontrados.has(id)
        ) {
            continue;
        }

        encontrados.add(id);
        ids.push(id);
    }

    return ids;
}

function gerarCodigoCracha(
    instituicaoId: number,
    tipoPessoa: string,
    pessoaId: number
) {
    const prefixo =
        tipoPessoa === "ALUNO"
            ? "ALU"
            : tipoPessoa === "PROFESSOR"
                ? "PROF"
                : tipoPessoa === "FUNCIONARIO"
                    ? "FUNC"
                    : tipoPessoa === "VISITANTE"
                        ? "VIS"
                        : "PHX";

    const ano = new Date().getFullYear();

    const identificador = crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 16)
        .toUpperCase();

    return `PHX-${prefixo}-${instituicaoId}-${ano}-${pessoaId}-${identificador}`;
}

async function buscarPessoas(
    tipoPessoa: string,
    pessoaIds: number[],
    instituicaoId: number
): Promise<PessoaParaEmitir[]> {
    if (tipoPessoa === "ALUNO") {
        return prisma.aluno.findMany({
            where: {
                instituicaoId,
                ativo: true,
                id: {
                    in: pessoaIds,
                },
            },
            select: {
                id: true,
                fotoPerfil: true,
            },
        });
    }

    if (tipoPessoa === "PROFESSOR") {
        return prisma.professor.findMany({
            where: {
                instituicaoId,
                id: {
                    in: pessoaIds,
                },
            },
            select: {
                id: true,
                fotoPerfil: true,
            },
        });
    }

    if (tipoPessoa === "FUNCIONARIO") {
        return prisma.funcionario.findMany({
            where: {
                instituicaoId,
                ativo: true,
                id: {
                    in: pessoaIds,
                },
            },
            select: {
                id: true,
                fotoPerfil: true,
            },
        });
    }

    if (tipoPessoa === "VISITANTE") {
        const visitantes =
            await prisma.visitante.findMany({
                where: {
                    instituicaoId,
                    arquivado: false,
                    id: {
                        in: pessoaIds,
                    },
                },
                select: {
                    id: true,
                    fotoPerfil: true,
                    crachaValidoAte: true,
                },
            });

        return visitantes.map((visitante) => ({
            id: visitante.id,
            fotoPerfil: visitante.fotoPerfil,
            validadeEm: visitante.crachaValidoAte,
        }));
    }

    return [];
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromToken();

        if (!user) {
            return NextResponse.json(
                { error: "Não autenticado." },
                { status: 401 }
            );
        }

        if (!isAdminLike(user.role)) {
            return NextResponse.json(
                { error: "Sem permissão." },
                { status: 403 }
            );
        }

        if (!user.instituicaoId) {
            return NextResponse.json(
                {
                    error:
                        "Usuário sem instituição vinculada.",
                },
                { status: 400 }
            );
        }

        const planoInstituicao =
            await obterPlanoInstituicao(
                user.instituicaoId
            );

        if (
            !planoTemRecurso(
                planoInstituicao,
                "CRACHAS_EMISSAO"
            )
        ) {
            return NextResponse.json(
                {
                    error:
                        "A emissão de crachás está disponível a partir do Plano Profissional.",
                    codigo:
                        "RECURSO_NAO_DISPONIVEL_NO_PLANO",
                    plano: planoInstituicao,
                    recurso: "CRACHAS_EMISSAO",
                },
                { status: 403 }
            );
        }

        const body = await req.json();

        const tipoPessoa = normalizarTipo(
            body.tipoPessoa
        );

        const modeloIdRecebido = Number(
            body.modeloId || 0
        );

        const pessoaIds = normalizarIds(
            body.pessoaIds
        );

        if (!TIPOS_VALIDOS.includes(tipoPessoa)) {
            return NextResponse.json(
                {
                    error:
                        "Tipo de pessoa inválido para emissão em lote.",
                },
                { status: 400 }
            );
        }

        if (pessoaIds.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "Nenhuma pessoa foi informada para emissão em lote.",
                },
                { status: 400 }
            );
        }

        if (pessoaIds.length > LIMITE_LOTE) {
            return NextResponse.json(
                {
                    error: `O lote pode conter no máximo ${LIMITE_LOTE} pessoas.`,
                },
                { status: 400 }
            );
        }

        const modelo = modeloIdRecebido
            ? await prisma.crachaModelo.findFirst({
                where: {
                    id: modeloIdRecebido,
                    instituicaoId:
                        user.instituicaoId,
                    ativo: true,
                },
            })
            : await prisma.crachaModelo.findFirst({
                where: {
                    instituicaoId:
                        user.instituicaoId,
                    tipoPessoa,
                    padrao: true,
                    ativo: true,
                },
                orderBy: {
                    atualizadoEm: "desc",
                },
            });

        if (!modelo) {
            return NextResponse.json(
                {
                    error:
                        "Nenhum modelo ativo foi encontrado para este lote.",
                },
                { status: 404 }
            );
        }

        if (modelo.tipoPessoa !== tipoPessoa) {
            return NextResponse.json(
                {
                    error:
                        "O modelo selecionado não pertence ao tipo de pessoa escolhido.",
                },
                { status: 400 }
            );
        }

        const pessoasEncontradas =
            await buscarPessoas(
                tipoPessoa,
                pessoaIds,
                user.instituicaoId
            );

        const mapaPessoas =
            new Map<number, PessoaParaEmitir>(
                pessoasEncontradas.map(
                    (pessoa) =>
                        [pessoa.id, pessoa] as const
                )
            );

        const pessoasAptas = pessoaIds
            .map((id) => mapaPessoas.get(id))
            .filter(
                (
                    pessoa
                ): pessoa is PessoaParaEmitir =>
                    Boolean(pessoa?.fotoPerfil)
            );

        if (pessoasAptas.length === 0) {
            return NextResponse.json(
                {
                    error:
                        "Nenhuma pessoa apta foi encontrada. Todos os cadastros estão sem foto ou indisponíveis.",
                },
                { status: 400 }
            );
        }

        const dadosCriacao: Prisma.CrachaEmitidoCreateManyInput[] =
            pessoasAptas.map((pessoa) => ({
                instituicaoId:
                    user.instituicaoId!,
                modeloId: modelo.id,
                codigoCracha: gerarCodigoCracha(
                    user.instituicaoId!,
                    tipoPessoa,
                    pessoa.id
                ),
                tipoPessoa,
                pessoaId: pessoa.id,
                status: "ATIVO",
                validadeEm:
                    pessoa.validadeEm || null,
                emitidoPorId: user.id,
            }));

        await prisma.crachaEmitido.createMany({
            data: dadosCriacao,
        });

        const codigos = dadosCriacao
            .map((item) => item.codigoCracha)
            .filter(
                (codigo): codigo is string =>
                    Boolean(codigo)
            );

        const crachasCriados =
            await prisma.crachaEmitido.findMany({
                where: {
                    instituicaoId:
                        user.instituicaoId,
                    codigoCracha: {
                        in: codigos,
                    },
                },
                select: {
                    id: true,
                    codigoCracha: true,
                    pessoaId: true,
                },
            });

        const mapaCrachas = new Map<
            string | null,
            any
        >(
            crachasCriados.map(
                (cracha) =>
                    [cracha.codigoCracha, cracha] as const
            )
        );

        const crachaIds = dadosCriacao.map(
            (item) => {
                const cracha = mapaCrachas.get(
                    item.codigoCracha || null
                );

                if (!cracha) {
                    throw new Error(
                        "Um dos crachás emitidos não foi localizado após a criação."
                    );
                }

                return cracha.id;
            }
        );

        if (tipoPessoa === "VISITANTE") {
            const agora = new Date();

            await prisma.$transaction(
                dadosCriacao.map((item) =>
                    prisma.visitante.updateMany({
                        where: {
                            id: item.pessoaId,
                            instituicaoId:
                                user.instituicaoId,
                        },
                        data: {
                            crachaEmitidoEm: agora,
                            codigoCracha:
                                item.codigoCracha,
                        },
                    })
                )
            );
        }

        return NextResponse.json({
            sucesso: true,
            crachaIds,
            resumo: {
                totalSolicitado: pessoaIds.length,
                totalEmitido: crachaIds.length,
                totalIgnorado:
                    pessoaIds.length -
                    crachaIds.length,
            },
            modelo: {
                id: modelo.id,
                nome: modelo.nome,
                tipoPessoa: modelo.tipoPessoa,
            },
        });
    } catch (error: any) {
        console.error(
            "ERRO AO EMITIR LOTE DE CRACHÁS:",
            error
        );

        return NextResponse.json(
            {
                error:
                    error?.message ||
                    "Não foi possível emitir o lote de crachás.",
            },
            { status: 500 }
        );
    }
}