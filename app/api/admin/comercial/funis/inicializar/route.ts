import { NextResponse } from "next/server";

import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";
import { garantirEstruturaComercialPadrao } from "@/lib/services/funil-comercial.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

class ErroHttp extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    mensagem: string,
    codigo: string
  ) {
    super(mensagem);

    this.name = "ErroHttp";
    this.status = status;
    this.codigo = codigo;
  }
}

export async function POST() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      throw new ErroHttp(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const permitido = await usuarioPossuiPermissao(
      user,
      "comercial.funis.gerenciar"
    );

    if (!permitido) {
      throw new ErroHttp(
        403,
        "Você não possui permissão para configurar funis comerciais.",
        "SEM_PERMISSAO"
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const usuarioId = Number(user.id);

    if (
      !Number.isInteger(instituicaoId) ||
      instituicaoId <= 0
    ) {
      throw new ErroHttp(
        403,
        "O usuário não está vinculado a uma instituição válida.",
        "INSTITUICAO_INVALIDA"
      );
    }

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      throw new ErroHttp(
        403,
        "Não foi possível identificar o usuário responsável.",
        "USUARIO_INVALIDO"
      );
    }

    const resultado =
      await garantirEstruturaComercialPadrao(
        instituicaoId,
        usuarioId
      );

    const mensagem = resultado.estruturaCriada
      ? "O funil comercial padrão foi criado com sucesso."
      : resultado.leadsVinculados > 0
        ? "A estrutura comercial já existia e os leads pendentes foram vinculados."
        : "A estrutura comercial já está configurada e atualizada.";

    return NextResponse.json(
      {
        success: true,
        mensagem,
        resultado,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    if (error instanceof ErroHttp) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          codigo: error.codigo,
        },
        {
          status: error.status,
        }
      );
    }

    console.error(
      "Erro ao inicializar o funil comercial:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível inicializar a estrutura comercial.",
        codigo: "ERRO_INTERNO",
      },
      {
        status: 500,
      }
    );
  }
}