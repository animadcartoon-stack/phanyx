import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Arquivo obrigatório" }, { status: 400 });
    }

    // 👉 SIMPLES (por enquanto)
    const buffer = Buffer.from(await file.arrayBuffer());

    const fileName = `certificado-${Date.now()}.pdf`;

    const fs = require("fs");
    const path = require("path");

    const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

    fs.writeFileSync(uploadPath, buffer);

    // 👉 salvar no banco (ajustar depois com auth)
    await prisma.instituicao.update({
      where: { id: 1 }, // depois vamos trocar pelo usuário logado
      data: {
        certificadoTemplateUrl: `/uploads/${fileName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}