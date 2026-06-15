import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

function isAdmin(role: unknown) {
  const r = String(role || "").toUpperCase();
  return r === "ADMIN" || r === "SUPER_ADMIN";
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const [professores, turmas, disciplinas] = await Promise.all([
      prisma.professor.findMany({
        where: { instituicaoId: user.instituicaoId },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),

      prisma.turma.findMany({
        where: { instituicaoId: user.instituicaoId },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),

      prisma.disciplina.findMany({
        where: { instituicaoId: user.instituicaoId },
        select: { id: true, nome: true },
        orderBy: { nome: "asc" },
      }),
    ]);

    return NextResponse.json({
      ok: true,
      professores,
      turmas,
      disciplinas,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao carregar dados" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !isAdmin(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const titulo = String(body?.titulo || "").trim();
    const descricao = body?.descricao ? String(body.descricao).trim() : null;
    const professorResponsavelId = Number(body?.professorResponsavelId);
    const turmaId = Number(body?.turmaId);
    const disciplinaId = body?.disciplinaId ? Number(body.disciplinaId) : null;
    const notaMaxima =
      body?.notaMaxima !== undefined && body?.notaMaxima !== ""
        ? Number(body.notaMaxima)
        : 10;
    const prazo =
      body?.prazo && String(body.prazo).trim() ? new Date(body.prazo) : null;

    const publicarAgora = Boolean(body?.publicarAgora);
    const anexo = body?.anexo ?? null;
    const linkExterno = body?.linkExterno ? String(body.linkExterno).trim() : "";

    if (!titulo) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    if (!Number.isFinite(professorResponsavelId) || professorResponsavelId <= 0) {
      return NextResponse.json(
        { error: "Professor responsável é obrigatório" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(turmaId) || turmaId <= 0) {
      return NextResponse.json({ error: "Turma é obrigatória" }, { status: 400 });
    }

    if (!Number.isFinite(notaMaxima) || notaMaxima <= 0) {
      return NextResponse.json({ error: "Nota máxima inválida" }, { status: 400 });
    }

    const professor = await prisma.professor.findFirst({
      where: {
        id: professorResponsavelId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor responsável inválido" },
        { status: 403 }
      );
    }

    const turma = await prisma.turma.findFirst({
      where: {
        id: turmaId,
        instituicaoId: user.instituicaoId,
      },
      select: { id: true },
    });

    if (!turma) {
      return NextResponse.json({ error: "Turma inválida" }, { status: 403 });
    }

    if (disciplinaId) {
      const disciplina = await prisma.disciplina.findFirst({
        where: {
          id: disciplinaId,
          instituicaoId: user.instituicaoId,
        },
        select: { id: true },
      });

      if (!disciplina) {
        return NextResponse.json(
          { error: "Disciplina inválida" },
          { status: 403 }
        );
      }
    }

    const status = publicarAgora ? "PUBLICADA" : "AGUARDANDO_PUBLICACAO";
    const agora = new Date();

    const anexosCreate: any[] = [];

    if (anexo?.url) {
      anexosCreate.push({
        titulo: anexo.nomeOriginal || "Arquivo da atividade",
        url: anexo.url,
        arquivoNome: anexo.nomeOriginal || "arquivo",
        mimeType: anexo.mimeType || null,
        tamanho:
          anexo.tamanho !== undefined && anexo.tamanho !== null
            ? Number(anexo.tamanho)
            : null,
        instituicaoId: user.instituicaoId,
      });
    }

    if (linkExterno) {
      anexosCreate.push({
        titulo: "Link externo",
        url: linkExterno,
        arquivoNome: null,
        mimeType: "text/uri-list",
        tamanho: null,
        instituicaoId: user.instituicaoId,
      });
    }

    const atividade = await prisma.atividade.create({
      data: {
        titulo,
        descricao,
        prazo,
        notaMaxima,
        status,
        turmaId,
        disciplinaId,
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        professorResponsavelId,
        enviadoParaApoioDocenteEm: publicarAgora ? null : agora,
        publicadaAt: publicarAgora ? agora : null,
        publicadoPorId: publicarAgora ? user.id : null,
        publicadoPeloApoioDocenteEm: publicarAgora ? agora : null,
        anexos:
          anexosCreate.length > 0
            ? {
                create: anexosCreate,
              }
            : undefined,
      },
      select: {
        id: true,
        titulo: true,
        status: true,
      },
    });

    return NextResponse.json({ ok: true, atividade }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao criar publicação" },
      { status: 500 }
    );
  }
}