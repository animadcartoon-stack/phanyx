import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const STATUS_VISITANTE_VALIDOS = [
  "AGUARDANDO",
  "DENTRO",
  "SAIU",
  "CANCELADO",
  "BLOQUEADO",
];

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function dataOuNull(valor: unknown) {
  const texto = limparTexto(valor);

  if (!texto) return null;

  const data = new Date(texto);

  if (Number.isNaN(data.getTime())) return null;

  return data;
}

async function gerarCodigoVisitante(instituicaoId: number) {
  const ultimo = await prisma.visitante.findFirst({
    where: {
      instituicaoId,
      codigoVisitante: {
        not: "",
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      codigoVisitante: true,
    },
  });

  const numeroAtual = String(ultimo?.codigoVisitante || "")
    .replace(/\D/g, "");

  const proximoNumero = numeroAtual ? Number(numeroAtual) + 1 : 1;

  return String(proximoNumero).padStart(6, "0");
}

function gerarCodigoCrachaVisitante(instituicaoId: number) {
  const sufixo = crypto.randomBytes(5).toString("hex").toUpperCase();

  return `VIS-${instituicaoId}-${Date.now().toString(36).toUpperCase()}-${sufixo}`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);

    const busca = limparTexto(searchParams.get("busca"));
    const status = limparTexto(searchParams.get("status")).toUpperCase();
    const evento = limparTexto(searchParams.get("evento"));

    const pagina = Math.max(1, Number(searchParams.get("pagina") || 1));
    const limite = Math.min(
      100,
      Math.max(10, Number(searchParams.get("limite") || 30))
    );

    const where: any = {
      instituicaoId: user.instituicaoId,
      arquivado: false,
    };

    if (status && STATUS_VISITANTE_VALIDOS.includes(status)) {
      where.status = status;
    }

    if (evento) {
      where.evento = {
        contains: evento,
        mode: "insensitive",
      };
    }

    if (busca) {
      where.OR = [
        {
          nome: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          documentoNumero: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          telefone: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          empresa: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          destino: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          pessoaVisitada: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          setorVisitado: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          evento: {
            contains: busca,
            mode: "insensitive",
          },
        },
        {
          codigoVisitante: {
            contains: busca,
            mode: "insensitive",
          },
        },
      ];
    }

    const [visitantes, total] = await Promise.all([
      prisma.visitante.findMany({
        where,
        orderBy: {
          criadoEm: "desc",
        },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
      prisma.visitante.count({ where }),
    ]);

    return NextResponse.json({
      visitantes,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    });
  } catch (error) {
    console.error("ERRO AO LISTAR VISITANTES:", error);

    return NextResponse.json(
      { error: "Erro ao listar visitantes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const nome = limparTexto(body.nome);

    if (!nome) {
      return NextResponse.json(
        { error: "O nome do visitante é obrigatório." },
        { status: 400 }
      );
    }

    const statusInformado = limparTexto(body.status).toUpperCase();
    const status = STATUS_VISITANTE_VALIDOS.includes(statusInformado)
      ? statusInformado
      : "AGUARDANDO";

    const codigoVisitante =
      limparTexto(body.codigoVisitante) ||
      (await gerarCodigoVisitante(user.instituicaoId));

    const codigoCracha =
      limparTexto(body.codigoCracha) ||
      gerarCodigoCrachaVisitante(user.instituicaoId);

    const visitante = await prisma.visitante.create({
      data: {
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,

        nome,
        documentoTipo: limparTexto(body.documentoTipo) || null,
        documentoNumero: limparTexto(body.documentoNumero) || null,
        telefone: limparTexto(body.telefone) || null,
        email: limparTexto(body.email).toLowerCase() || null,

        empresa: limparTexto(body.empresa) || null,
        destino: limparTexto(body.destino) || null,
        pessoaVisitada: limparTexto(body.pessoaVisitada) || null,
        setorVisitado: limparTexto(body.setorVisitado) || null,
        motivo: limparTexto(body.motivo) || null,
        evento: limparTexto(body.evento) || null,

        fotoPerfil: limparTexto(body.fotoPerfil) || null,

        codigoVisitante,
        codigoCracha,

        status: status as any,

        entradaPrevistaEm: dataOuNull(body.entradaPrevistaEm),
        entradaEm: dataOuNull(body.entradaEm),
        saidaPrevistaEm: dataOuNull(body.saidaPrevistaEm),
        saidaEm: dataOuNull(body.saidaEm),

        crachaValidoAte: dataOuNull(body.crachaValidoAte),

        observacoes: limparTexto(body.observacoes) || null,

        ativo: status !== "CANCELADO" && status !== "BLOQUEADO",
      },
    });

    return NextResponse.json({ visitante }, { status: 201 });
  } catch (error: any) {
    console.error("ERRO AO CRIAR VISITANTE:", error);

    if (String(error?.code) === "P2002") {
      return NextResponse.json(
        { error: "Já existe um visitante com este código." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao criar visitante." },
      { status: 500 }
    );
  }
}