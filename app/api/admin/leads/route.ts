import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function podeGerenciar(role?: string) {
  return ["ADMIN", "SECRETARIA", "FINANCEIRO"].includes(role || "");
}

const STATUS_VALIDOS = ["NOVO", "CONTATO", "PROPOSTA", "FECHADO", "PERDIDO"] as const;
const PRIORIDADES_VALIDAS = ["BAIXA", "MEDIA", "ALTA"] as const;
const TIPOS_VALIDOS = ["PHANYX", "INSTITUICAO"] as const;

function normalizarStatus(valor: unknown) {
  const texto = String(valor || "").trim().toUpperCase();
  return STATUS_VALIDOS.includes(texto as any) ? texto : "NOVO";
}

function normalizarPrioridade(valor: unknown) {
  const texto = String(valor || "").trim().toUpperCase();
  return PRIORIDADES_VALIDAS.includes(texto as any) ? texto : "MEDIA";
}

function normalizarTipo(valor: unknown) {
  const texto = String(valor || "").trim().toUpperCase();
  return TIPOS_VALIDOS.includes(texto as any) ? texto : "PHANYX";
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const q = String(searchParams.get("q") || "").trim();
    const origem = String(searchParams.get("origem") || "").trim();

    const leads = await prisma.lead.findMany({
      where: {
        AND: [
          q
            ? {
                OR: [
                  { nome: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                  { telefone: { contains: q, mode: "insensitive" } },
                  { instituicaoNome: { contains: q, mode: "insensitive" } },
                  { cargo: { contains: q, mode: "insensitive" } },
                  { origem: { contains: q, mode: "insensitive" } },
                  { tipo: { contains: q, mode: "insensitive" } },
                  { interesse: { contains: q, mode: "insensitive" } },
                  { observacoes: { contains: q, mode: "insensitive" } },
                  { responsavelNome: { contains: q, mode: "insensitive" } },
                ],
              }
            : {},
          origem ? { origem } : {},
        ],
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Erro ao listar leads admin:", error);
    return NextResponse.json(
      { error: "Não foi possível listar os leads." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeGerenciar(user.role)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const email = String(body?.email || "").trim();

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
        telefone: body?.telefone ? String(body.telefone).trim() : null,
        instituicaoNome: body?.instituicaoNome
          ? String(body.instituicaoNome).trim()
          : null,
        instituicaoId:
          body?.instituicaoId !== undefined &&
          body?.instituicaoId !== null &&
          body?.instituicaoId !== ""
            ? Number(body.instituicaoId)
            : null,
        cargo: body?.cargo ? String(body.cargo).trim() : null,
        origem: body?.origem ? String(body.origem).trim() : "ADMIN_MANUAL",
        tipo: normalizarTipo(body?.tipo),
        interesse: body?.interesse ? String(body.interesse).trim() : null,
        observacoes: body?.observacoes
          ? String(body.observacoes).trim()
          : null,
        status: normalizarStatus(body?.status),
        prioridade: normalizarPrioridade(body?.prioridade),
        valorEstimado:
          body?.valorEstimado !== undefined &&
          body?.valorEstimado !== null &&
          body?.valorEstimado !== ""
            ? Number(body.valorEstimado)
            : null,
        proximoContatoEm: body?.proximoContatoEm
          ? new Date(body.proximoContatoEm)
          : null,
        ultimoContatoEm: body?.ultimoContatoEm
          ? new Date(body.ultimoContatoEm)
          : null,
        responsavelNome: body?.responsavelNome
          ? String(body.responsavelNome).trim()
          : null,
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lead admin:", error);
    return NextResponse.json(
      { error: "Não foi possível criar o lead." },
      { status: 500 }
    );
  }
}