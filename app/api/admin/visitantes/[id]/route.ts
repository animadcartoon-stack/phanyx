import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

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

async function buscarVisitanteAutorizado(id: number, instituicaoId: number) {
  return prisma.visitante.findFirst({
    where: {
      id,
      instituicaoId,
    },
  });
}

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
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

    const id = Number(context.params.id);

    const visitante = await buscarVisitanteAutorizado(
      id,
      user.instituicaoId
    );

    if (!visitante) {
      return NextResponse.json(
        { error: "Visitante não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ visitante });
  } catch (error) {
    console.error("ERRO AO BUSCAR VISITANTE:", error);

    return NextResponse.json(
      { error: "Erro ao buscar visitante." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
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

    const id = Number(context.params.id);
    const body = await req.json();

    const visitanteExistente = await buscarVisitanteAutorizado(
      id,
      user.instituicaoId
    );

    if (!visitanteExistente) {
      return NextResponse.json(
        { error: "Visitante não encontrado." },
        { status: 404 }
      );
    }

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
      : visitanteExistente.status;

    const visitante = await prisma.visitante.update({
      where: { id },
      data: {
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

    return NextResponse.json({ visitante });
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR VISITANTE:", error);

    if (String(error?.code) === "P2002") {
      return NextResponse.json(
        { error: "Já existe um visitante com este código." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar visitante." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
) {
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

    const id = Number(context.params.id);
    const body = await req.json();

    const acao = limparTexto(body.acao).toUpperCase();
    const motivo = limparTexto(body.motivo);

    const visitanteExistente = await buscarVisitanteAutorizado(
      id,
      user.instituicaoId
    );

    if (!visitanteExistente) {
      return NextResponse.json(
        { error: "Visitante não encontrado." },
        { status: 404 }
      );
    }

    let data: any = {};

    if (acao === "REGISTRAR_ENTRADA") {
      data = {
        entradaEm: dataOuNull(body.entradaEm) || new Date(),
        status: "DENTRO",
        ativo: true,
      };
    } else if (acao === "REGISTRAR_SAIDA") {
      data = {
        saidaEm: dataOuNull(body.saidaEm) || new Date(),
        status: "SAIU",
        ativo: false,
      };
    } else if (acao === "CANCELAR") {
      data = {
        status: "CANCELADO",
        ativo: false,
        observacoes:
          motivo ||
          visitanteExistente.observacoes ||
          "Visitante cancelado pelo administrador.",
      };
    } else if (acao === "BLOQUEAR") {
      data = {
        status: "BLOQUEADO",
        ativo: false,
        observacoes:
          motivo ||
          visitanteExistente.observacoes ||
          "Visitante bloqueado pelo administrador.",
      };
    } else if (acao === "ARQUIVAR") {
      data = {
        arquivado: true,
        arquivadoEm: new Date(),
        arquivadoPorId: user.id,
        motivoArquivo: motivo || "Arquivado pelo administrador.",
      };
    } else if (acao === "RESTAURAR") {
      data = {
        arquivado: false,
        arquivadoEm: null,
        arquivadoPorId: null,
        motivoArquivo: null,
      };
    } else if (acao === "MARCAR_CRACHA_EMITIDO") {
      data = {
        crachaEmitidoEm: new Date(),
        crachaValidoAte: dataOuNull(body.crachaValidoAte),
      };
    } else {
      return NextResponse.json(
        { error: "Ação inválida." },
        { status: 400 }
      );
    }

    const visitante = await prisma.visitante.update({
      where: { id },
      data,
    });

    return NextResponse.json({ visitante });
  } catch (error) {
    console.error("ERRO AO ALTERAR VISITANTE:", error);

    return NextResponse.json(
      { error: "Erro ao alterar visitante." },
      { status: 500 }
    );
  }
}