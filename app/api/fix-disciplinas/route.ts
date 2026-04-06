import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  await prisma.disciplina.updateMany({
    where: { professorId: 1 },
    data: { professorId: 2 },
  });

  return NextResponse.json({ message: "Disciplinas corrigidas!" });
}