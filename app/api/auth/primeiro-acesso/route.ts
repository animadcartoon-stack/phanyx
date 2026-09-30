import {
  NextResponse,
} from "next/server";
import {
  prisma,
} from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  validatePassword,
} from "@/lib/password-policy";

const JWT_SECRET =
  process.env.JWT_SECRET!;

export async function POST(
  req: Request
) {
  try {
    const body =
      await req.json();

    const { senha } = body;

    const validacaoSenha =
      validatePassword(
        String(senha || "")
      );

    if (!validacaoSenha.ok) {
      return NextResponse.json(
        {
          codigo:
            "PASSWORD_POLICY_INVALID",
          error:
            "Password does not meet the security policy.",
        },
        {
          status: 400,
        }
      );
    }

    const cookieHeader =
      req.headers.get(
        "cookie"
      ) || "";

    const tokenMatch =
      cookieHeader.match(
        /token=([^;]+)/
      );

    const token =
      tokenMatch?.[1];

    if (!token) {
      return NextResponse.json(
        {
          codigo:
            "AUTH_TOKEN_MISSING",
          error:
            "Authentication token not found.",
        },
        {
          status: 401,
        }
      );
    }

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as {
        id: number;
        email: string;
        role: string;
      };

    const senhaHash =
      await bcrypt.hash(
        senha,
        10
      );

    await prisma.user.update({
      where: {
        id: decoded.id,
      },
      data: {
        senha: senhaHash,
        precisaTrocarSenha:
          false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "FIRST ACCESS ERROR:",
      error
    );

    return NextResponse.json(
      {
        codigo:
          "PASSWORD_UPDATE_FAILED",
        error:
          "Could not update password.",
      },
      {
        status: 500,
      }
    );
  }
}
