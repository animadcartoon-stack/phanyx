import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

type PayloadImpersonacao = {
  id?: number | string;
  impersonacao?: boolean;
  impersonacaoId?: number | string;
  masterOriginalId?: number | string;
};

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("token")?.value;

    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({
        ativa: false,
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    ) as PayloadImpersonacao;

    if (payload.impersonacao !== true) {
      return NextResponse.json({
        ativa: false,
      });
    }

    const impersonacaoId = Number(
      payload.impersonacaoId
    );

    const usuarioAlvoId = Number(payload.id);

    const masterOriginalId = Number(
      payload.masterOriginalId
    );

    if (
      !Number.isFinite(impersonacaoId) ||
      !Number.isFinite(usuarioAlvoId) ||
      !Number.isFinite(masterOriginalId)
    ) {
      return NextResponse.json(
        {
          ativa: false,
        },
        {
          status: 401,
        }
      );
    }

    const registro =
      await prisma.impersonacaoSuporte.findFirst({
        where: {
          id: impersonacaoId,
          usuarioAlvoId,
          masterUserId: masterOriginalId,
          ativa: true,
          encerradoEm: null,
          expiraEm: {
            gt: new Date(),
          },
        },
        select: {
          id: true,
          motivo: true,
          portal: true,
          iniciadoEm: true,
          expiraEm: true,

          usuarioAlvoNomeSnapshot: true,
          usuarioAlvoEmailSnapshot: true,
          instituicaoNomeSnapshot: true,

          usuarioAlvo: {
            select: {
              role: true,
            },
          },

          masterUser: {
            select: {
              email: true,
              ativo: true,
              isMasterAdmin: true,
            },
          },
        },
      });

    if (
      !registro ||
      !registro.masterUser ||
      registro.masterUser.ativo === false ||
      registro.masterUser.isMasterAdmin !==
        true
    ) {
      return NextResponse.json(
        {
          ativa: false,
        },
        {
          status: 401,
        }
      );
    }

    return NextResponse.json({
      ativa: true,
      impersonacao: {
        id: registro.id,
        usuarioNome:
          registro.usuarioAlvoNomeSnapshot,
        usuarioEmail:
          registro.usuarioAlvoEmailSnapshot,
        instituicao:
          registro.instituicaoNomeSnapshot,
        role:
          registro.usuarioAlvo?.role || null,
        portal: registro.portal,
        motivo: registro.motivo,
        iniciadoEm:
          registro.iniciadoEm.toISOString(),
        expiraEm:
          registro.expiraEm.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({
      ativa: false,
    });
  }
}