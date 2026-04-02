import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileName = `logo_${Date.now()}.png`;
  const uploadPath = path.join(process.cwd(), "public/uploads", fileName);

  fs.writeFileSync(uploadPath, buffer);

  return NextResponse.json({
    url: `/uploads/${fileName}`,
  });
}