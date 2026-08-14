import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TIPOS_INTERACAO_VALIDOS = [
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "REUNIAO",
  "OBSERVACAO",
] as const;

const TIPOS_QUE_REGISTRAM_CONTATO = new Set<string>([
  "WHATSAPP",
  "LIGACAO",
  "EMAIL",
  "REUNIAO",
]);

const LIMITE_DESCRICAO = 5000;

type TipoInteracao = (typeof TIPOS_INTERACAO_VALIDOS)[number];

type PermissoesInteracao = {
  podeConsultar: boolean;
  podeRegistrar: boolean;
  podeVerTodos: boolean;
};

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(status: number, mensagem: string, codigo: string) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

function ehMasterReal(user: UsuarioLogado) {
  return (
    user.isMasterAdmin === true &&
    user.impersonacao === false &&
    user.email.trim().toLowerCase() === "academicophanyx@gmail.com"
  );
}

function parseId(valor: string) {
  const id = Number(valor);

  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizarTipoInteracao(valor: unknown): TipoInteracao | null {
  const tipo = String(valor || "OBSERVACAO")
    .trim()
    .toUpperCase();

  if (
    TIPOS_INTERACAO_VALIDOS.includes(
      tipo as TipoInteracao
    )
  ) {
    return tipo as TipoInteracao;
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
    instituicaoGestoraId: interacao.instituicaoGestoraId,
    criadoPorId: interacao.criadoPorId,
    tipo: interacao.tipo,
    descricao: interacao.descricao,
    usuario: interacao.usuarioNomeSnapshot,
    createdAt: interacao.createdAt,
  };
}

async function autenticarUsuario() {
  const user = await getUserFromToken();

  if (!user) {
    throw new ErroHttp(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  if (ehMasterReal(user)) {
    return user;
  }

  const instituicaoId = Number(user.instituicaoId);

  if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
    throw new ErroHttp(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  return user;
}

async function obterPermissoes(
  user: UsuarioLogado
): Promise<PermissoesInteracao> {
  if (ehMasterReal(user)) {
    return {
      podeConsultar: true,
      podeRegistrar: true,
      podeVerTodos: true,
    };
  }

  const [podeVer, podeEditar, podeInteragir, podeVerTodos] =
    await Promise.all([
      usuarioPossuiPermissao(user, "comercial.leads.ver"),
      usuarioPossuiPermissao(user, "comercial.leads.editar"),
      usuarioPossuiPermissao(user, "comercial.leads.interagir"),
      usuarioPossuiPermissao(user, "comercial.leads.ver_todos"),
    ]);

  return {
    podeConsultar: podeVer || podeEditar || podeInteragir,
    podeRegistrar: podeEditar || podeInteragir,
    podeVerTodos,
  };
}

function obterEscopoLead(
  user: UsuarioLogado,
  podeVerTodos: boolean
) {
  if (ehMasterReal(user)) {
    return {
      instituicaoGestoraId: null,
      tipo: "PHANYX",
    };
  }

  const escopoInstitucional = {
    instituicaoGestoraId: Number(user.instituicaoId),
    tipo: "INSTITUICAO",
  };

  if (podeVerTodos) {
    return escopoInstitucional;
  }

  const funcionarioId = Number(user.funcionarioId);

  if (!Number.isInteger(funcionarioId) || funcionarioId <= 0) {
    throw new ErroHttp(
      403,
      "O usuário precisa estar vinculado a um funcionário para acessar seus próprios leads.",
      "FUNCIONARIO_NAO_VINCULADO"
    );
  }

  return {
    ...escopoInstitucional,
    responsavelFuncionarioId: funcionarioId,
  };
}

function responderErro(error: unknown, contexto: string) {
  if (error instanceof ErroHttp) {
    return NextResponse.json(
      {
        error: error.message,
        codigo: error.codigo,
      },
      {
        status: error.status,
      }
    );
  }

  console.error(contexto, error);

  return NextResponse.json(
    {
      error: "Não foi possível processar as interações do lead.",
      codigo: "ERRO_INTERNO",
    },
    {
      status: 500,
    }
  );
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);

    if (!permissoes.podeConsultar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para consultar interações comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const leadId = parseId(params.id);

    if (!leadId) {
      throw new ErroHttp(400, "ID do lead inválido.", "LEAD_INVALIDO");
    }

    const escopo = obterEscopoLead(user, permissoes.podeVerTodos);

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
      throw new ErroHttp(
        404,
        "Lead não encontrado ou indisponível para este usuário.",
        "LEAD_NAO_ENCONTRADO"
      );
    }

    const interacoes = await prisma.leadInteracao.findMany({
      where: {
        leadId: lead.id,
        instituicaoGestoraId: lead.instituicaoGestoraId,
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
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

    return NextResponse.json(
      interacoes.map(serializarInteracao),
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    return responderErro(error, "Erro ao buscar interações do lead:");
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await autenticarUsuario();
    const permissoes = await obterPermissoes(user);

    if (!permissoes.podeRegistrar) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para registrar interações comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const leadId = parseId(params.id);

    if (!leadId) {
      throw new ErroHttp(400, "ID do lead inválido.", "LEAD_INVALIDO");
    }

    let body: Record<string, unknown>;

    try {
      const payload = (await req.json()) as unknown;

      if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      ) {
        throw new Error("FORMATO_INVALIDO");
      }

      body = payload as Record<string, unknown>;
    } catch {
      throw new ErroHttp(
        400,
        "O corpo da solicitação contém JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const descricao = String(body.descricao || "").trim();
    const tipo = normalizarTipoInteracao(body.tipo);

    if (!descricao) {
      throw new ErroHttp(
        400,
        "A descrição da interação é obrigatória.",
        "DESCRICAO_OBRIGATORIA"
      );
    }

    if (descricao.length > LIMITE_DESCRICAO) {
      throw new ErroHttp(
        400,
        `A descrição deve possuir no máximo ${LIMITE_DESCRICAO} caracteres.`,
        "DESCRICAO_MUITO_LONGA"
      );
    }

    if (!tipo) {
      throw new ErroHttp(
        400,
        "O tipo da interação informado é inválido.",
        "TIPO_INVALIDO"
      );
    }

    const escopo = obterEscopoLead(user, permissoes.podeVerTodos);

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...escopo,
      },
      select: {
        id: true,
        instituicaoGestoraId: true,
        primeiroContatoEm: true,
      },
    });

    if (!lead) {
      throw new ErroHttp(
        404,
        "Lead não encontrado ou indisponível para este usuário.",
        "LEAD_NAO_ENCONTRADO"
      );
    }

    const agora = new Date();
    const registraContato = TIPOS_QUE_REGISTRAM_CONTATO.has(tipo);

    const usuarioNomeSnapshot =
      String(user.nome || "").trim() ||
      user.email ||
      user.role ||
      "Sistema";

    const interacao = await prisma.$transaction(async (tx) => {
      const novaInteracao = await tx.leadInteracao.create({
        data: {
          leadId: lead.id,
          instituicaoGestoraId: lead.instituicaoGestoraId,
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

      const atualizacaoLead = await tx.lead.updateMany({
        where: {
          id: lead.id,
          ...escopo,
        },
        data: {
          atualizadoPorId: user.id,
          ...(registraContato
            ? {
                ultimoContatoEm: agora,
                primeiroContatoEm: lead.primeiroContatoEm ?? agora,
              }
            : {}),
        },
      });

      if (atualizacaoLead.count !== 1) {
        throw new ErroHttp(
          409,
          "O lead foi alterado durante o registro da interação. Atualize a página e tente novamente.",
          "CONFLITO_ATUALIZACAO"
        );
      }

      return novaInteracao;
    });

    return NextResponse.json(serializarInteracao(interacao), {
      status: 201,
    });
  } catch (error) {
    return responderErro(error, "Erro ao registrar interação do lead:");
  }
}