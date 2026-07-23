import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { MASTER_SUPORTE_EMAIL } from "@/lib/impersonacao-suporte";

type PayloadToken = {
  id?: number | string;
  impersonacao?: boolean;
  impersonacaoId?: number | string;
  masterOriginalId?: number | string;
};

export async function POST() {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "JWT_SECRET não definido."
      );
    }

    const cookieStore = await cookies();

    const tokenAtual =
      cookieStore.get("token")?.value;

    const tokenMaster =
      cookieStore.get(
        "phanyx_master_token"
      )?.value;

    if (!tokenMaster) {
      return NextResponse.json(
        {
          error:
            "A sessão original do Master não foi localizada.",
        },
        {
          status: 401,
        }
      );
    }

    const payloadMaster = jwt.verify(
      tokenMaster,
      process.env.JWT_SECRET
    ) as PayloadToken;

    const masterId = Number(
      payloadMaster.id
    );

    if (
      !Number.isFinite(masterId) ||
      masterId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "A sessão Master é inválida.",
        },
        {
          status: 401,
        }
      );
    }

    const master =
      await prisma.user.findUnique({
        where: {
          id: masterId,
        },
        select: {
          id: true,
          email: true,
          ativo: true,
          isMasterAdmin: true,
        },
      });

    if (
      !master ||
      master.ativo === false ||
      master.isMasterAdmin !== true ||
      master.email.trim().toLowerCase() !==
        MASTER_SUPORTE_EMAIL
    ) {
      return NextResponse.json(
        {
          error:
            "A conta Master não foi validada.",
        },
        {
          status: 403,
        }
      );
    }

    let impersonacaoId: number | null =
      null;

    if (tokenAtual) {
      try {
        const payloadAtual = jwt.verify(
          tokenAtual,
          process.env.JWT_SECRET,
          {
            ignoreExpiration: true,
          }
        ) as PayloadToken;

        if (
          payloadAtual.impersonacao === true &&
          Number(
            payloadAtual.masterOriginalId
          ) === master.id
        ) {
          const id = Number(
            payloadAtual.impersonacaoId
          );

          if (
            Number.isFinite(id) &&
            id > 0
          ) {
            impersonacaoId = id;
          }
        }
      } catch {
        impersonacaoId = null;
      }
    }

    if (impersonacaoId) {
      await prisma.impersonacaoSuporte.updateMany({
        where: {
          id: impersonacaoId,
          masterUserId: master.id,
          ativa: true,
        },
        data: {
          ativa: false,
          encerradoEm: new Date(),
        },
      });
    } else {
      await prisma.impersonacaoSuporte.updateMany({
        where: {
          masterUserId: master.id,
          ativa: true,
          encerradoEm: null,
        },
        data: {
          ativa: false,
          encerradoEm: new Date(),
        },
      });
    }

    const response = NextResponse.json({
      sucesso: true,
      destino: "/master",
    });

    response.cookies.set(
      "token",
      tokenMaster,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 24 * 60 * 60,
      }
    );

    response.cookies.set(
      "phanyx_master_token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "Erro ao encerrar impersonação:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível retornar à conta Master.",
      },
      {
        status: 500,
      }
    );
  }
}