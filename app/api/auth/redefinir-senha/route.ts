import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  validatePassword,
} from "@/lib/password-policy";

function linkInvalidoOuExpirado() {
  return NextResponse.json(
    {
      codigo: "RESET_LINK_INVALID_OR_EXPIRED",
      error: "Reset link is invalid or expired.",
    },
    { status: 400 }
  );
}

export async function POST(
  req: Request
) {
  try {
    const {
      token,
      senha,
    } = await req.json();

    if (typeof token !== "string" || !token) {
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
        select: { id: true, role: true },
      });

    if (!user) {
      return linkInvalidoOuExpirado();
    }

    const senhaHash =
      await bcrypt.hash(
        String(senha),
        10
      );

    const { count } = await prisma.user.updateMany({
      where: {
        id: user.id,
        resetToken: token,
        resetTokenExpira: { gt: new Date() },
      },
      data: {
        senha: senhaHash,
        resetToken: null,
        resetTokenExpira: null,
        precisaTrocarSenha: false,
      },
    });

    if (count === 0) {
      return linkInvalidoOuExpirado();
    }

    const portal =
      user.role === "PROFESSOR" ? "professor" :
      user.role === "ALUNO" ? "aluno" : "admin";

    return NextResponse.json({
      success: true,
      portal,
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
