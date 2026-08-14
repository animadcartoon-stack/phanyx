import { NextResponse } from "next/server";
import {
  TipoComunicacaoWhatsApp,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioTemPermissao } from "@/lib/permissoes-server";

export const dynamic = "force-dynamic";

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

  if (!user.instituicaoId) {
    return {
      user: null,
      resposta: NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      ),
    };
  }

  const permitido = await usuarioTemPermissao(
    user,
    "integracoes.whatsapp.gerenciar"
  );

  if (!permitido) {
    return {
      user: null,
      resposta: NextResponse.json(
        {
          error:
            "Você não tem permissão para gerenciar os templates do WhatsApp.",
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

export async function GET() {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;

    const templates =
      await prisma.whatsAppTemplate.findMany({
        where: {
          instituicaoId: user.instituicaoId!,
        },

        orderBy: [
          {
            tipoComunicacao: "asc",
          },
          {
            atualizadoEm: "desc",
          },
        ],

        select: {
          id: true,
          whatsappInstituicaoId: true,

          nome: true,
          nomeMeta: true,

          tipoComunicacao: true,
          idioma: true,

          categoriaMeta: true,
          statusMeta: true,

          titulo: true,
          corpo: true,
          rodape: true,

          aprovadoMeta: true,
          ativo: true,

          criadoEm: true,
          atualizadoEm: true,
        },
      });

    return NextResponse.json({
      templates,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar templates do WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar os templates do WhatsApp.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const autenticacao = await validarUsuario();

    if (!autenticacao.user) {
      return autenticacao.resposta!;
    }

    const user = autenticacao.user;

    const body = await req.json().catch(() => ({}));

    const tipoComunicacao = String(
      body?.tipoComunicacao || ""
    )
      .trim()
      .toUpperCase();

    if (
      !Object.values(
        TipoComunicacaoWhatsApp
      ).includes(
        tipoComunicacao as TipoComunicacaoWhatsApp
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Tipo de comunicação do WhatsApp inválido.",
        },
        { status: 400 }
      );
    }

    const nome = String(body?.nome || "").trim();

    const corpo = String(
      body?.corpo || ""
    ).trim();

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome do template.",
        },
        { status: 400 }
      );
    }

    if (!corpo) {
      return NextResponse.json(
        {
          error:
            "Informe o conteúdo do template.",
        },
        { status: 400 }
      );
    }

    const existente =
      await prisma.whatsAppTemplate.findFirst({
        where: {
          instituicaoId:
            user.instituicaoId!,

          tipoComunicacao:
            tipoComunicacao as TipoComunicacaoWhatsApp,

          ativo: true,
        },
        orderBy: {
          atualizadoEm: "desc",
        },
      });

    const dados = {
      nome,

      nomeMeta:
        String(body?.nomeMeta || "").trim() ||
        null,

      tipoComunicacao:
        tipoComunicacao as TipoComunicacaoWhatsApp,

      idioma:
        String(body?.idioma || "pt_BR").trim() ||
        "pt_BR",

      categoriaMeta:
        String(
          body?.categoriaMeta || ""
        ).trim() || null,

      statusMeta:
        String(
          body?.statusMeta || ""
        ).trim() || null,

      titulo:
        String(body?.titulo || "").trim() ||
        null,

      corpo,

      rodape:
        String(body?.rodape || "").trim() ||
        null,

      aprovadoMeta:
        body?.aprovadoMeta === true,

      ativo:
        body?.ativo !== false,
    };

    const template = existente
      ? await prisma.whatsAppTemplate.update({
          where: {
            id: existente.id,
          },
          data: dados,
        })
      : await prisma.whatsAppTemplate.create({
          data: {
            instituicaoId:
              user.instituicaoId!,

            ...dados,
          },
        });

    return NextResponse.json({
      sucesso: true,
      template,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar template do WhatsApp:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível salvar o template do WhatsApp.",
      },
      { status: 500 }
    );
  }
}