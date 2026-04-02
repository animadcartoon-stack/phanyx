import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const busca = searchParams.get("busca") || "";
    const status = searchParams.get("status") || "";

    const leads = await prisma.lead.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          busca
            ? {
                OR: [
                  { nome: { contains: busca, mode: "insensitive" } },
                  { email: { contains: busca, mode: "insensitive" } },
                  { instituicao: { contains: busca, mode: "insensitive" } },
                  { telefone: { contains: busca, mode: "insensitive" } },
                  { cidade: { contains: busca, mode: "insensitive" } },
                  { origem: { contains: busca, mode: "insensitive" } },
                  { interessePlano: { contains: busca, mode: "insensitive" } },
                ],
              }
            : {},
        ],
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro ao buscar leads" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "").trim();
    const telefone = body?.telefone ? String(body.telefone).trim() : null;
    const instituicao = body?.instituicao
      ? String(body.instituicao).trim()
      : null;
    const mensagem = body?.mensagem ? String(body.mensagem).trim() : null;
    const origem = body?.origem ? String(body.origem).trim() : "SITE_PLANOS";
    const interessePlano = body?.interessePlano
      ? String(body.interessePlano).trim()
      : null;
    const cidade = body?.cidade ? String(body.cidade).trim() : null;
    const quantidadeAlunos = body?.quantidadeAlunos
      ? Number(body.quantidadeAlunos)
      : null;
    const valorEstimado = body?.valorEstimado
      ? Number(body.valorEstimado)
      : null;

    if (!nome || !email) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        nome,
        email,
        telefone,
        instituicao,
        mensagem,
        origem,
        interessePlano,
        cidade,
        quantidadeAlunos,
        valorEstimado,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro ao criar lead." },
      { status: 500 }
    );
  }
}