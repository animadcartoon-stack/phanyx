import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function texto(valor: unknown) {
  return typeof valor === "string" ? valor : undefined;
}

function booleano(valor: unknown) {
  return typeof valor === "boolean" ? valor : undefined;
}

function montarDadosPermitidos(body: Record<string, unknown>) {
  return {
    nomeFantasia: texto(body.nomeFantasia),
    razaoSocial: texto(body.razaoSocial),
    cnpj: texto(body.cnpj),
    telefone: texto(body.telefone),
    email: texto(body.email),
    cep: texto(body.cep),
    endereco: texto(body.endereco),
    numero: texto(body.numero),
    cidade: texto(body.cidade),
    estado: texto(body.estado),

    responsavelNome: texto(body.responsavelNome),
    responsavelCargo: texto(body.responsavelCargo),
    cidadeAssinatura: texto(body.cidadeAssinatura),

    logoUrl: texto(body.logoUrl),
    certificadoAssinaturaUrl: texto(body.certificadoAssinaturaUrl),

    contratoTemplate: texto(body.contratoTemplate),
    observacoesContrato: texto(body.observacoesContrato),

    estiloDocumento: texto(body.estiloDocumento),
    estiloPapelTimbrado: texto(body.estiloPapelTimbrado),

    usarPapelTimbrado: booleano(body.usarPapelTimbrado),
    papelTimbradoUrl: texto(body.papelTimbradoUrl),

    corRelatorio: texto(body.corRelatorio),
  };
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Entre novamente no PHANYX." },
        { status: 401 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        {
          error:
            "Seu usuário não está vinculado corretamente a uma instituição.",
        },
        { status: 400 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId,
      },
    });

    return NextResponse.json(config || {});
  } catch (error) {
    console.error(
      "ERRO AO CARREGAR CONFIGURAÇÕES DA INSTITUIÇÃO:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao carregar as configurações.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Sessão não encontrada. Entre novamente no PHANYX." },
        { status: 401 }
      );
    }

    const role = String(user.role || "").trim().toUpperCase();

    if (role !== "ADMIN") {
      return NextResponse.json(
        {
          error: `Seu perfil atual é ${
            role || "não identificado"
          }. Somente o administrador da instituição pode alterar estes dados.`,
        },
        { status: 403 }
      );
    }

    const instituicaoId = Number(user.instituicaoId);

    if (!Number.isInteger(instituicaoId) || instituicaoId <= 0) {
      return NextResponse.json(
        {
          error:
            "Seu usuário não está vinculado corretamente a uma instituição.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Os dados enviados são inválidos." },
        { status: 400 }
      );
    }

    const dados = montarDadosPermitidos(
      body as Record<string, unknown>
    );

    const config = await prisma.configuracaoInstituicao.upsert({
      where: {
        instituicaoId,
      },
      update: dados,
      create: {
        ...dados,
        instituicaoId,
      },
    });

    return NextResponse.json({
      ok: true,
      config,
    });
  } catch (error) {
    console.error(
      "ERRO AO SALVAR CONFIGURAÇÕES DA INSTITUIÇÃO:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao salvar as configurações.",
      },
      { status: 500 }
    );
  }
}