import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { usuarioPossuiPermissao } from "@/lib/server-permissions";

export const runtime = "nodejs";

function obterInstituicaoId(user: any) {
  const instituicaoId = Number(user?.instituicaoId);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  return instituicaoId;
}

function limitarRaio(valor: unknown) {
  const raio = Number(valor);

  if (!Number.isFinite(raio)) {
    return 150;
  }

  return Math.min(
    5000,
    Math.max(10, Math.round(raio))
  );
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const podeVisualizar =
      await usuarioPossuiPermissao(
        user,
        "rh.ponto.mobile.ver",
        "rh.ponto.mobile.configurar"
      );

    if (!podeVisualizar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para visualizar a configuração do Ponto Mobile.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 }
      );
    }

    const configuracao =
      await prisma.configuracaoPontoMobileRH.upsert({
        where: {
          instituicaoId,
        },
        update: {},
        create: {
          instituicaoId,
          ativo: false,
          exigirFoto: true,
          exigirLocalizacao: true,
          reconhecimentoFacialAtivo: false,
          exigirProvaVida: false,
          permitirForaDoRaio: true,
          exigirFuncionarioLiberado: true,
          raioPadraoMetros: 150,
        },
      });

    const podeConfigurar =
      await usuarioPossuiPermissao(
        user,
        "rh.ponto.mobile.configurar"
      );

    return NextResponse.json({
      ...configuracao,
      permissoes: {
        podeVisualizar: true,
        podeConfigurar,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao carregar configuração do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível carregar a configuração do Ponto Mobile.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const podeConfigurar =
      await usuarioPossuiPermissao(
        user,
        "rh.ponto.mobile.configurar"
      );

    if (!podeConfigurar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para configurar o Ponto Mobile.",
        },
        { status: 403 }
      );
    }

    const instituicaoId = obterInstituicaoId(user);

    if (!instituicaoId) {
      return NextResponse.json(
        { error: "Instituição não identificada." },
        { status: 400 }
      );
    }

    const body = await req.json();

    const dados = {
      ativo: body.ativo === true,

      exigirFoto:
        body.exigirFoto !== false,

      exigirLocalizacao:
        body.exigirLocalizacao !== false,

      reconhecimentoFacialAtivo:
        body.reconhecimentoFacialAtivo === true,

      exigirProvaVida:
        body.exigirProvaVida === true,

      permitirForaDoRaio:
        body.permitirForaDoRaio !== false,

      exigirFuncionarioLiberado: true,

      raioPadraoMetros:
        limitarRaio(body.raioPadraoMetros),
    };

    const configuracao =
      await prisma.configuracaoPontoMobileRH.upsert({
        where: {
          instituicaoId,
        },
        update: dados,
        create: {
          instituicaoId,
          ...dados,
        },
      });

    return NextResponse.json({
      sucesso: true,
      mensagem:
        "Configuração do Ponto Mobile salva com sucesso.",
      configuracao,
    });
  } catch (error) {
    console.error(
      "Erro ao salvar configuração do Ponto Mobile:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível salvar a configuração do Ponto Mobile.",
      },
      { status: 500 }
    );
  }
}