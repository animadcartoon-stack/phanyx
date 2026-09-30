import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  validatePassword,
} from "@/lib/password-policy";

export async function POST(
  req: Request
) {
  try {
    const {
      token,
      senha,
    } = await req.json();

    if (!token) {
      return NextResponse.json(
        {
          codigo:
            "RESET_TOKEN_INVALID",
          error:
            "Invalid reset token.",
        },
        {
          status: 400,
        }
      );
    }

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

    const user =
      await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpira: {
            gt: new Date(),
          },
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          codigo:
            "RESET_LINK_INVALID_OR_EXPIRED",
          error:
            "Reset link is invalid or expired.",
        },
        {
          status: 400,
        }
      );
    }

    const senhaHash =
      await bcrypt.hash(
        String(senha),
        10
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetTokenExpira: null,
        precisaTrocarSenha: false,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    return NextResponse.json(
      {
        codigo: "RESET_FAILED",
        error:
          "Could not reset password.",
      },
      {
        status: 500,
      }
    );
  }
}
