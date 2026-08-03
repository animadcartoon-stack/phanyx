import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  type UsuarioLogado,
} from "@/lib/server-auth";

const STATUS_VALIDOS = [
  "NOVO",
  "CONTATO",
  "PROPOSTA",
  "FECHADO",
  "PERDIDO",
] as const;

const PRIORIDADES_VALIDAS = ["BAIXA", "MEDIA", "ALTA"] as const;

const INCLUDE_LEAD = {
  responsavelFuncionario: {
    select: {
      id: true,
      nome: true,
      cargo: true,
      departamentoId: true,
      ativo: true,
      statusFuncionario: true,
    },
  },
  instituicaoInteressada: {
    select: {
      id: true,
      nome: true,
      ativo: true,
    },
  },
} satisfies Prisma.LeadInclude;

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

function obterEscopoLead(
  user: UsuarioLogado
): Prisma.LeadWhereInput {
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

function campoFoiInformado(
  objeto: Record<string, unknown>,
  campo: string
) {
  return Object.prototype.hasOwnProperty.call(objeto, campo);
}

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function normalizarStatus(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return STATUS_VALIDOS.includes(
    texto as (typeof STATUS_VALIDOS)[number]
  )
    ? texto
    : "NOVO";
}

function normalizarPrioridade(valor: unknown) {
  const texto = String(valor || "")
    .trim()
    .toUpperCase();

  return PRIORIDADES_VALIDAS.includes(
    texto as (typeof PRIORIDADES_VALIDAS)[number]
  )
    ? texto
    : "MEDIA";
}

function normalizarOrigem(valor: unknown) {
  const texto = String(valor ?? "")
    .trim()
    .toUpperCase();

  return texto || "ADMIN_MANUAL";
}

function lerIdOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function lerValorMonetarioOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function lerDataOpcional(valor: unknown) {
  if (valor === undefined || valor === null || valor === "") {
    return {
      valido: true,
      valor: null as Date | null,
    };
  }

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return {
      valido: false,
      valor: null as Date | null,
    };
  }

  return {
    valido: true,
    valor: data,
  };
}

function serializarLead(lead: any) {
  return {
    ...lead,

    responsavelNome:
      lead.responsavelFuncionario?.nome ||
      lead.responsavelNomeSnapshot ||
      null,

    instituicaoId:
      lead.instituicaoInteressadaId ?? null,
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
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        ...obterEscopoLead(user),
      },
      include: INCLUDE_LEAD,
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json(serializarLead(lead));
  } catch (error) {
    console.error("Erro ao buscar lead:", error);

    return NextResponse.json(
      { error: "Não foi possível buscar o lead." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;
    const masterReal = ehMasterReal(user);
    const escopo = obterEscopoLead(user);
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const leadExistente = await prisma.lead.findFirst({
      where: {
        id,
        ...escopo,
      },
      select: {
        id: true,
      },
    });

    if (!leadExistente) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const data: Prisma.LeadUncheckedUpdateManyInput = {
      atualizadoPorId: user.id,
    };

    if (campoFoiInformado(body, "nome")) {
      const nome = String(body.nome ?? "").trim();

      if (!nome) {
        return NextResponse.json(
          { error: "O nome é obrigatório." },
          { status: 400 }
        );
      }

      data.nome = nome;
    }

    if (campoFoiInformado(body, "email")) {
      const email = String(body.email ?? "")
        .trim()
        .toLowerCase();

      if (!email || !email.includes("@")) {
        return NextResponse.json(
          { error: "Informe um e-mail válido." },
          { status: 400 }
        );
      }

      data.email = email;
    }

    if (campoFoiInformado(body, "telefone")) {
      data.telefone = textoOuNull(body.telefone);
    }

    if (campoFoiInformado(body, "instituicaoNome")) {
      data.instituicaoNome = textoOuNull(
        body.instituicaoNome
      );
    }

    if (campoFoiInformado(body, "cargo")) {
      data.cargo = textoOuNull(body.cargo);
    }

    if (campoFoiInformado(body, "origem")) {
      data.origem = normalizarOrigem(body.origem);
    }

    if (campoFoiInformado(body, "interesse")) {
      data.interesse = textoOuNull(body.interesse);
    }

    if (campoFoiInformado(body, "observacoes")) {
      data.observacoes = textoOuNull(body.observacoes);
    }

    if (campoFoiInformado(body, "status")) {
      data.status = normalizarStatus(body.status);
    }

    if (campoFoiInformado(body, "prioridade")) {
      data.prioridade = normalizarPrioridade(
        body.prioridade
      );
    }

    if (campoFoiInformado(body, "valorEstimado")) {
      const valorEstimado = lerValorMonetarioOpcional(
        body.valorEstimado
      );

      if (!valorEstimado.valido) {
        return NextResponse.json(
          {
            error:
              "O valor estimado precisa ser um número válido e não negativo.",
          },
          { status: 400 }
        );
      }

      data.valorEstimado = valorEstimado.valor;
    }

    if (campoFoiInformado(body, "proximoContatoEm")) {
      const proximoContatoEm = lerDataOpcional(
        body.proximoContatoEm
      );

      if (!proximoContatoEm.valido) {
        return NextResponse.json(
          {
            error:
              "A data do próximo contato é inválida.",
          },
          { status: 400 }
        );
      }

      data.proximoContatoEm = proximoContatoEm.valor;
    }

    /*
 * ultimoContatoEm é controlado exclusivamente pelo sistema.
 * Ele é atualizado quando uma interação comercial é registrada
 * e não pode ser alterado manualmente pela edição do lead.
 */

    if (
      campoFoiInformado(
        body,
        "responsavelFuncionarioId"
      )
    ) {
      const responsavelInformado = lerIdOpcional(
        body.responsavelFuncionarioId
      );

      if (!responsavelInformado.valido) {
        return NextResponse.json(
          {
            error:
              "O funcionário responsável informado é inválido.",
          },
          { status: 400 }
        );
      }

      if (masterReal && responsavelInformado.valor) {
        return NextResponse.json(
          {
            error:
              "O CRM global da PHANYX não permite vincular um funcionário institucional.",
          },
          { status: 400 }
        );
      }

      if (!responsavelInformado.valor) {
        data.responsavelFuncionarioId = null;
        data.responsavelNomeSnapshot = null;
      } else {
        const responsavelFuncionario =
          await prisma.funcionario.findFirst({
            where: {
              id: responsavelInformado.valor,
              instituicaoId: user.instituicaoId!,
              ativo: true,
              statusFuncionario: "ATIVO",
            },
            select: {
              id: true,
              nome: true,
            },
          });

        if (!responsavelFuncionario) {
          return NextResponse.json(
            {
              error:
                "O funcionário responsável não foi encontrado ou não está ativo nesta instituição.",
            },
            { status: 400 }
          );
        }

        data.responsavelFuncionarioId =
          responsavelFuncionario.id;

        data.responsavelNomeSnapshot =
          responsavelFuncionario.nome;
      }
    } else if (
      masterReal &&
      campoFoiInformado(body, "responsavelNome")
    ) {
      /*
       * Compatibilidade temporária com o CRM global atual.
       * A instituição usa obrigatoriamente funcionario.id.
       */
      data.responsavelNomeSnapshot = textoOuNull(
        body.responsavelNome
      );
    }

    const informouInstituicaoInteressada =
      campoFoiInformado(
        body,
        "instituicaoInteressadaId"
      ) || campoFoiInformado(body, "instituicaoId");

    if (masterReal && informouInstituicaoInteressada) {
      const valorInformado = campoFoiInformado(
        body,
        "instituicaoInteressadaId"
      )
        ? body.instituicaoInteressadaId
        : body.instituicaoId;

      const instituicaoInteressada =
        lerIdOpcional(valorInformado);

      if (!instituicaoInteressada.valido) {
        return NextResponse.json(
          {
            error:
              "A instituição interessada informada é inválida.",
          },
          { status: 400 }
        );
      }

      if (instituicaoInteressada.valor) {
        const instituicaoExiste =
          await prisma.instituicao.findUnique({
            where: {
              id: instituicaoInteressada.valor,
            },
            select: {
              id: true,
            },
          });

        if (!instituicaoExiste) {
          return NextResponse.json(
            {
              error:
                "A instituição interessada informada não foi encontrada.",
            },
            { status: 400 }
          );
        }
      }

      data.instituicaoInteressadaId =
        instituicaoInteressada.valor;
    }

    const leadAtualizado = await prisma.$transaction(
      async (tx) => {
        const resultado = await tx.lead.updateMany({
          where: {
            id,
            ...escopo,
          },
          data,
        });

        if (resultado.count !== 1) {
          return null;
        }

        return tx.lead.findFirst({
          where: {
            id,
            ...escopo,
          },
          include: INCLUDE_LEAD,
        });
      }
    );

    if (!leadAtualizado) {
      return NextResponse.json(
        {
          error:
            "O lead não foi encontrado ou não pôde ser atualizado.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      serializarLead(leadAtualizado)
    );
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);

    return NextResponse.json(
      { error: "Não foi possível atualizar o lead." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;
    const id = parseId(params.id);

    if (!id) {
      return NextResponse.json(
        { error: "ID inválido." },
        { status: 400 }
      );
    }

    const resultado = await prisma.lead.deleteMany({
      where: {
        id,
        ...obterEscopoLead(user),
      },
    });

    if (resultado.count !== 1) {
      return NextResponse.json(
        { error: "Lead não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao excluir lead:", error);

    return NextResponse.json(
      { error: "Não foi possível excluir o lead." },
      { status: 500 }
    );
  }
}