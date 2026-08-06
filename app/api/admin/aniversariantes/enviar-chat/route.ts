import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";

type Destinatario = {
  chave: string;
  id: number;
  tipo: "ALUNO" | "PROFESSOR" | "FUNCIONARIO";
  userId: number;
  nome: string;
  titulo: string;
  mensagem: string;
};

function prioridadeDestinatario(tipo: Destinatario["tipo"]) {
  if (tipo === "PROFESSOR") return 3;
  if (tipo === "FUNCIONARIO") return 2;
  return 1;
}

function removerDestinatariosDuplicados(
  destinatarios: Destinatario[]
) {
  const usuariosUnicos = new Map<number, Destinatario>();

  for (const item of destinatarios) {
    const userId = Number(item.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      continue;
    }

    const existente = usuariosUnicos.get(userId);

    if (
      !existente ||
      prioridadeDestinatario(item.tipo) >
        prioridadeDestinatario(existente.tipo)
    ) {
      usuariosUnicos.set(userId, item);
    }
  }

  return Array.from(usuariosUnicos.values());
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN" || !user.instituicaoId) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const destinatarios: Destinatario[] = Array.isArray(body.destinatarios)
      ? body.destinatarios
      : [];

    if (destinatarios.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um aniversariante." },
        { status: 400 }
      );
    }

    const alunoIds = destinatarios
      .filter((item) => item.tipo === "ALUNO")
      .map((item) => Number(item.id));

    const professorIds = destinatarios
      .filter((item) => item.tipo === "PROFESSOR")
      .map((item) => Number(item.id));

    const funcionarioIds = destinatarios
      .filter((item) => item.tipo === "FUNCIONARIO")
      .map((item) => Number(item.id));

    const [alunos, professores, funcionarios] = await Promise.all([
      alunoIds.length
        ? prisma.aluno.findMany({
            where: {
              id: { in: alunoIds },
              instituicaoId: user.instituicaoId,
            },
            select: {
              id: true,
              userId: true,
            },
          })
        : Promise.resolve([]),

      professorIds.length
        ? prisma.professor.findMany({
            where: {
              id: { in: professorIds },
              instituicaoId: user.instituicaoId,
            },
            select: {
              id: true,
              userId: true,
            },
          })
        : Promise.resolve([]),

      funcionarioIds.length
        ? prisma.funcionario.findMany({
            where: {
              id: { in: funcionarioIds },
              instituicaoId: user.instituicaoId,
            },
            select: {
              id: true,
              userId: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const autorizados = new Set<string>();

    alunos.forEach((item) => {
      autorizados.add(`ALUNO-${item.id}-${item.userId}`);
    });

    professores.forEach((item) => {
      autorizados.add(`PROFESSOR-${item.id}-${item.userId}`);
    });

    funcionarios.forEach((item) => {
      autorizados.add(`FUNCIONARIO-${item.id}-${item.userId}`);
    });

    const destinatariosAutorizados = destinatarios.filter((item) =>
  autorizados.has(
    `${item.tipo}-${Number(item.id)}-${Number(item.userId)}`
  )
);

const destinatariosUnicos =
  removerDestinatariosDuplicados(destinatariosAutorizados);

const anoAtual = new Date().getFullYear();

const notificacoes = destinatariosUnicos.map((item) => ({
  usuarioId: Number(item.userId),
  instituicaoId: user.instituicaoId,
  tipo: "ANIVERSARIO",
  categoria: "COMUNICACAO",
  titulo: String(
    item.titulo || "Feliz aniversário!"
  ).slice(0, 180),
  descricao: String(item.mensagem || "").slice(0, 2000),
  link: null,
  quantidade: 1,

  /*
   * A chave agora representa a pessoa e o ano,
   * independentemente de ela ser professor ou funcionário.
   */
  chaveAgrupada: `ANIVERSARIO-${item.userId}-${anoAtual}`,
}));

    if (notificacoes.length === 0) {
      return NextResponse.json(
        { error: "Nenhum destinatário válido foi encontrado." },
        { status: 400 }
      );
    }

    await prisma.notificacao.createMany({
      data: notificacoes,
      skipDuplicates: false,
    });

    return NextResponse.json({
      sucesso: true,
      total: notificacoes.length,
    });
  } catch (error) {
    console.error("Erro ao enviar mensagem para aniversariantes:", error);

    return NextResponse.json(
      { error: "Erro ao enviar mensagem para aniversariantes." },
      { status: 500 }
    );
  }
}