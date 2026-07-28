import { NextRequest, NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

type BancoBrasilApi = {
    ispb?: string | null;
    name?: string | null;
    code?: number | null;
    fullName?: string | null;
};

type BancoCatalogo = {
    codigo: string;
    nome: string;
    nomeCurto: string;
    ispb: string;
    apelidos: string[];
    termosBusca: string;
};

const APELIDOS_POR_CODIGO: Record<string, string[]> = {
    "001": ["bb"],
    "033": ["santander"],
    "077": ["inter", "banco inter"],
    "104": ["caixa", "cef"],
    "208": ["btg", "btg pactual"],
    "237": ["bradesco"],
    "260": ["nubank", "nu pagamentos", "nu"],
    "290": ["pagbank", "pagseguro"],
    "323": ["mercado pago", "mercadopago"],
    "336": ["c6", "c6 bank"],
    "341": ["itau", "itaú"],
    "380": ["picpay"],
    "422": ["safra"],
    "655": ["bv", "banco bv", "votorantim"],
    "748": ["sicredi"],
    "756": ["sicoob"],
};

function texto(valor: unknown) {
    return String(valor ?? "").trim();
}

function normalizar(valor: unknown) {
    return texto(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

function montarBanco(item: BancoBrasilApi): BancoCatalogo | null {
    const codigoNumerico = Number(item.code);

    if (!Number.isInteger(codigoNumerico) || codigoNumerico < 0) {
        return null;
    }

    const codigo = String(codigoNumerico).padStart(3, "0");
    const nomeCurto = texto(item.name);
    const nome = texto(item.fullName) || nomeCurto;
    const ispb = texto(item.ispb);
    const apelidos = APELIDOS_POR_CODIGO[codigo] || [];

    if (!nome) {
        return null;
    }

    return {
        codigo,
        nome,
        nomeCurto,
        ispb,
        apelidos,

        termosBusca: normalizar(
            [
                codigo,
                String(codigoNumerico),
                nome,
                nomeCurto,
                ispb,
                ...apelidos,
            ].join(" "),
        ),
    };
}

async function carregarBancos() {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 10_000);

    try {
        const resposta = await fetch(
            "https://brasilapi.com.br/api/banks/v1",
            {
                method: "GET",

                headers: {
                    Accept: "application/json",
                },

                signal: controller.signal,

                next: {
                    revalidate: 86_400,
                },
            },
        );

        if (!resposta.ok) {
            throw new Error(
                `O catálogo bancário respondeu com status ${resposta.status}.`,
            );
        }

        const dados = (await resposta.json()) as BancoBrasilApi[];

        if (!Array.isArray(dados)) {
            throw new Error("O catálogo bancário retornou um formato inválido.");
        }

        const bancosPorCodigo = new Map<string, BancoCatalogo>();

        for (const item of dados) {
            const banco = montarBanco(item);

            if (!banco) continue;

            bancosPorCodigo.set(banco.codigo, banco);
        }

        return Array.from(bancosPorCodigo.values()).sort((a, b) =>
            a.nome.localeCompare(b.nome, "pt-BR", {
                sensitivity: "base",
            }),
        );
    } finally {
        clearTimeout(timeout);
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromToken();

        if (!user || !user.instituicaoId) {
            return NextResponse.json(
                {
                    error: "Não autorizado.",
                },
                {
                    status: 401,
                },
            );
        }

        const termoOriginal = req.nextUrl.searchParams.get("q") || "";
        const termo = normalizar(termoOriginal);

        const limiteInformado = Number(
            req.nextUrl.searchParams.get("limite") || 50,
        );

        const limite =
            Number.isInteger(limiteInformado) && limiteInformado > 0
                ? Math.min(limiteInformado, 100)
                : 50;

        const bancos = await carregarBancos();

        const bancosFiltrados = termo
            ? bancos.filter((banco) => banco.termosBusca.includes(termo))
            : bancos;

        const resultado = bancosFiltrados.slice(0, limite).map((banco) => ({
            codigo: banco.codigo,
            nome: banco.nome,
            nomeCurto: banco.nomeCurto,
            ispb: banco.ispb,
            apelidos: banco.apelidos,
            label: `${banco.codigo} — ${banco.nome}`,
        }));

        return NextResponse.json(
            {
                bancos: resultado,
                totalEncontrado: bancosFiltrados.length,
                totalExibido: resultado.length,
                termo: termoOriginal,
                fonte: "BACEN via BrasilAPI",
                atualizadoEm: new Date().toISOString(),
            },
            {
                headers: {
                    "Cache-Control": "private, max-age=300",
                },
            },
        );
    } catch (error: any) {
        console.error("Erro ao consultar catálogo de bancos:", error);

        return NextResponse.json(
            {
                error:
                    "Não foi possível consultar o catálogo de bancos neste momento.",
            },
            {
                status: 503,
            },
        );
    }
}