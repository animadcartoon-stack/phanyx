import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

type ProgressoItem = {
  alunoEmail: string;
  disciplinaId: number;
  aulaId: number;
  concluida?: boolean;
  tempoAssistidoSegundos?: number;
  tempoMinimoSegundos?: number;
  updatedAt?: string;
};

function getFilePath() {
  return path.join(process.cwd(), "data", "progresso.json");
}

function garantirArquivo() {
  const filePath = getFilePath();

  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, "[]");
  }

  return filePath;
}

function lerProgresso(): ProgressoItem[] {
  const filePath = garantirArquivo();

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function salvarProgresso(lista: ProgressoItem[]) {
  const filePath = garantirArquivo();
  fs.writeFileSync(filePath, JSON.stringify(lista, null, 2));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const alunoEmail = String(body?.alunoEmail ?? "").trim();
    const disciplinaId = Number(body?.disciplinaId);
    const aulaId = Number(body?.aulaId);

    const tempoAssistidoSegundos = Number(body?.tempoAssistidoSegundos ?? 0);
    const tempoMinimoSegundos = Number(body?.tempoMinimoSegundos ?? 0);
    const concluir = Boolean(body?.concluir);

    if (!alunoEmail || !Number.isFinite(disciplinaId) || !Number.isFinite(aulaId)) {
      return NextResponse.json(
        { error: "Dados obrigatórios inválidos." },
        { status: 400 }
      );
    }

    const progresso = lerProgresso();

    const index = progresso.findIndex(
      (p) =>
        p.alunoEmail === alunoEmail &&
        p.disciplinaId === disciplinaId &&
        p.aulaId === aulaId
    );

    const itemAtual: ProgressoItem =
      index >= 0
        ? progresso[index]
        : {
            alunoEmail,
            disciplinaId,
            aulaId,
            concluida: false,
            tempoAssistidoSegundos: 0,
            tempoMinimoSegundos: 0,
            updatedAt: new Date().toISOString(),
          };

    const novoTempoAssistido = Math.max(
      Number(itemAtual.tempoAssistidoSegundos ?? 0),
      Number.isFinite(tempoAssistidoSegundos) ? tempoAssistidoSegundos : 0
    );

    const novoTempoMinimo = Math.max(
      Number(itemAtual.tempoMinimoSegundos ?? 0),
      Number.isFinite(tempoMinimoSegundos) ? tempoMinimoSegundos : 0
    );

    const atualizado: ProgressoItem = {
      ...itemAtual,
      tempoAssistidoSegundos: novoTempoAssistido,
      tempoMinimoSegundos: novoTempoMinimo,
      updatedAt: new Date().toISOString(),
    };

    if (concluir) {
      if (novoTempoMinimo > 0 && novoTempoAssistido < novoTempoMinimo) {
        return NextResponse.json(
          {
            error: "Tempo mínimo de visualização ainda não atingido.",
            tempoAssistidoSegundos: novoTempoAssistido,
            tempoMinimoSegundos: novoTempoMinimo,
          },
          { status: 400 }
        );
      }

      atualizado.concluida = true;
    }

    if (index >= 0) {
      progresso[index] = atualizado;
    } else {
      progresso.push(atualizado);
    }

    salvarProgresso(progresso);

    return NextResponse.json({
      success: true,
      progresso: atualizado,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao salvar progresso" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ progresso: [] });
    }

    const progresso = lerProgresso();

    const progressoDoAluno = progresso.filter((p) => p.alunoEmail === email);

    return NextResponse.json({
      progresso: progressoDoAluno,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao buscar progresso" },
      { status: 500 }
    );
  }
}