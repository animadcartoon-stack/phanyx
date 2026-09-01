import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type UsuarioAutenticado = {
  role?: string;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean;
};

export async function GET(req: Request) {
  try {
    const user = (await getUserFromToken()) as UsuarioAutenticado | null;
    const role = String(user?.role || "").toUpperCase();

    const podeAcessar =
      Boolean(user) &&
      (
        role === "ADMIN" ||
        role === "GERENCIA" ||
        role === "SUPER_ADMIN" ||
        user?.isMasterAdmin === true
      );

    if (!podeAcessar) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const acessoGlobal =
      user?.isMasterAdmin === true || role === "SUPER_ADMIN";

    const instituicaoId = Number(user?.instituicaoId || 0);

    if (!acessoGlobal && instituicaoId <= 0) {
      return NextResponse.json(
        { error: "Instituição não identificada" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const suspeito = searchParams.get("suspeito");
    const status = searchParams.get("status");
    const busca = (searchParams.get("busca") || "").trim();

    const where: Prisma.AuditoriaValidacaoDocumentoWhereInput = {
      ...(!acessoGlobal && { instituicaoId }),
      ...((suspeito === "true" || status === "suspeito") && {
        suspeito: true,
      }),
      ...(status === "valido" && {
        valido: true,
        suspeito: false,
      }),
      ...(status === "invalido" && {
        valido: false,
        suspeito: false,
      }),
      ...(busca && {
        codigoConsultado: {
          contains: busca,
          mode: "insensitive",
        },
      }),
    };

    const dados = await prisma.auditoriaValidacaoDocumento.findMany({
      where,
      orderBy: {
        criadoEm: "desc",
      },
      take: 100,
    });

    return NextResponse.json(dados);
  } catch (error: unknown) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao buscar auditoria";

    return NextResponse.json(
      { error: mensagem },
      { status: 500 }
    );
  }
}
