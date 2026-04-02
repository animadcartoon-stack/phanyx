import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const contrato = await prisma.contrato.create({
    data: {
      alunoId: 1,
      instituicaoId: 1,
      conteudo: `
        <h2>Contrato Educacional</h2>
        <p>Este contrato formaliza a matrícula do aluno na instituição.</p>
        <p>O aluno declara estar ciente das regras acadêmicas.</p>
      `,
      status: "PENDENTE",
    },
  });

  return NextResponse.json(contrato);
}