import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_USER,
      subject: "Teste PHANYX 🚀",
      html: "<h2>Email funcionando!</h2>",
    });

    return NextResponse.json({ ok: true, info });

  } catch (error: any) {
    console.error("ERRO EMAIL:", error);

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}