import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";

const TIPOS_INTERACAO_VALIDOS = [
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "REUNIAO",
  "OBSERVACAO",
] as const;

function ehMasterReal(user: UsuarioLogado) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() ===
      "academicophanyx@gmail.com"
  );
}

function podeGerenciar(user: UsuarioLogado | null) {
  if (!user) return false;
  if (ehMasterReal(user)) return true;

  return ["ADMIN", "SECRETARIA", "FINANCEIRO"].includes(
    user.role
  );
}

function obterEscopoLead(user: UsuarioLogado) {
  if (ehMasterReal(user)) {
    return {
      instituicaoGestoraId: null,
      tipo: "PHANYX",
    };
  }

  return {
    instituicaoGestoraId: user.instituicaoId!,
    tipo: "INSTITUICAO",
  };
}

function parseId(valor: string) {
  const id = Number(valor);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizarTipoInteracao(valor: unknown) {
  const tipo = String(valor || "OBSERVACAO")
    .trim()
    .toUpperCase();

  if (
    TIPOS_INTERACAO_VALIDOS.includes(
      tipo as (typeof TIPOS_INTERACAO_VALIDOS)[number]
    )
  ) {
    return tipo;
  }

  return null;
}

function serializarInteracao(interacao: {
  id: number;
  leadId: number;
  instituicaoGestoraId: number | null;
  criadoPorId: number | null;
  tipo: string;
  descricao: string;
  usuarioNomeSnapshot: string | null;
  createdAt: Date;
}) {
  return {
    id: interacao.id,
    leadId: interacao.leadId,
    instituicaoGestoraId:
      interacao.instituicaoGestoraId,
    criadoPorId: interacao.criadoPorId,
    tipo: interacao.tipo,
    descricao: interacao.descricao,
    usuario: interacao.usuarioNomeSnapshot,
    createdAt: interacao.createdAt,
  };
}

async function validarUsuario() {
  const user = await getUserFromToken();

  if (!user) {
    return {
      user: null,
      resposta: NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      ),
    };
  }

  if (!podeGerenciar(user)) {
    return {
      user: null,
      resposta: NextResponse.json(
        { error: "Sem permissão." },
        { status: 403 }
      ),
    };
  }

  if (!ehMasterReal(user) && !user.instituicaoId) {
    return {
      user: null,
      resposta: NextResponse.json(
        {
          error:
            "O usuário não está vinculado a uma instituição.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    resposta: null,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;
    const leadId = parseId(params.id);

    if (!leadId) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...obterEscopoLead(user),
      },
      select: {
        id: true,
        instituicaoGestoraId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const interacoes =
      await prisma.leadInteracao.findMany({
        where: {
          leadId: lead.id,
          instituicaoGestoraId:
            lead.instituicaoGestoraId,
        },
        select: {
          id: true,
          leadId: true,
          instituicaoGestoraId: true,
          criadoPorId: true,
          tipo: true,
          descricao: true,
          usuarioNomeSnapshot: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      interacoes.map(serializarInteracao)
    );
  } catch (error) {
    console.error("Erro ao buscar interações:", error);

    return NextResponse.json(
      { error: "Erro ao buscar interações." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;
    const escopo = obterEscopoLead(user);
    const leadId = parseId(params.id);

    if (!leadId) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const descricao = String(
      body?.descricao || ""
    ).trim();

    const tipo = normalizarTipoInteracao(
      body?.tipo
    );

    if (!descricao) {
      return NextResponse.json(
        { error: "Descrição é obrigatória." },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        {
          error:
            "O tipo da interação informado é inválido.",
        },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...escopo,
      },
      select: {
        id: true,
        instituicaoGestoraId: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const agora = new Date();

    const usuarioNomeSnapshot =
      String(user.nome || "").trim() ||
      user.email ||
      user.role ||
      "Sistema";

    const interacao = await prisma.$transaction(
      async (tx) => {
        const novaInteracao =
          await tx.leadInteracao.create({
            data: {
              leadId: lead.id,
              instituicaoGestoraId:
                lead.instituicaoGestoraId,
              criadoPorId: user.id,
              tipo,
              descricao,
              usuarioNomeSnapshot,
            },
            select: {
              id: true,
              leadId: true,
              instituicaoGestoraId: true,
              criadoPorId: true,
              tipo: true,
              descricao: true,
              usuarioNomeSnapshot: true,
              createdAt: true,
            },
          });

        const atualizacaoLead =
          await tx.lead.updateMany({
            where: {
              id: lead.id,
              ...escopo,
            },
            data: {
              ultimoContatoEm: agora,
              atualizadoPorId: user.id,
            },
          });

        if (atualizacaoLead.count !== 1) {
          throw new Error(
            "O lead não pôde ser atualizado após a interação."
          );
        }

        return novaInteracao;
      }
    );

    return NextResponse.json(
      serializarInteracao(interacao),
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar interação:", error);

    return NextResponse.json(
      { error: "Erro ao criar interação." },
      { status: 500 }
    );
  }
}