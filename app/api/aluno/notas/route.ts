import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/* ============================
   POST — Salvar nota
============================ */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alunoEmail, disciplinaId, nota, aprovado } = body;

    const filePath = path.join(
      process.cwd(),
      "data",
      "notas.json"
    );

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "[]");
    }

    const notas = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    // remove nota antiga da mesma disciplina
    const notasFiltradas = notas.filter(
      (n: any) =>
        !(n.alunoEmail === alunoEmail &&
          n.disciplinaId === disciplinaId)
    );

    notasFiltradas.push({
      alunoEmail,
      disciplinaId,
      nota,
      aprovado,
    });

    fs.writeFileSync(
      filePath,
      JSON.stringify(notasFiltradas, null, 2)
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao salvar nota" },
      { status: 500 }
    );
  }
}

/* ============================
   GET — Buscar notas
============================ */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    const filePath = path.join(
      process.cwd(),
      "data",
      "notas.json"
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ notas: [] });
    }

    const notas = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    const notasDoAluno = notas.filter(
      (n: any) => n.alunoEmail === email
    );

    return NextResponse.json({ notas: notasDoAluno });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Erro ao buscar notas" },
      { status: 500 }
    );
  }
}