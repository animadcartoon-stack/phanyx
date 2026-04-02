import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const certificados = await prisma.certificado.findMany();
  return NextResponse.json(certificados);
}