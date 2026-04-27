import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { criarTransporter } from "@/lib/email"; // 👈 vamos usar seu email
// OBS: vamos usar o transporter direto

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 🔒 Segurança: não revelar se existe ou não
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expira = new Date();
    expira.setHours(expira.getHours() + 1);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpira: expira,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const link = `${baseUrl}/redefinir-senha?token=${token}`;

    const transporter = criarTransporter();

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "🔐 Redefinição de senha - PHANYX",
      html: `
        <div style="font-family: Arial; padding:20px;">
          <h2>Redefinição de senha</h2>
          <p>Olá, ${user.nome}</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>

          <a href="${link}" style="display:inline-block;padding:12px 20px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">
            Redefinir senha
          </a>

          <p style="margin-top:20px;font-size:12px;">
            Este link expira em 1 hora.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Erro ao enviar email" },
      { status: 500 }
    );
  }
}