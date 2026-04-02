import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";


export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    console.log("Webhook Eduzz recebido:", data);

    const nome = data?.buyer?.name;
    const email = data?.buyer?.email;
    const produto = data?.product?.name;
    const alunosPath = path.join(process.cwd(), "data", "alunos.json");
    const disciplinasPath = path.join(process.cwd(), "data", "disciplinas.json");
    const matriculasPath = path.join(process.cwd(), "data", "matriculas.json");

    if (!nome || !email || !produto) {
      return NextResponse.json(
        { error: "Dados incompletos" },
        { status: 400 }
      );
    }

    // =========================
    // ALUNOS
    // =========================
   const alunos = JSON.parse(fs.readFileSync(alunosPath, "utf-8"));

    let aluno = alunos.find((a: any) => a.email === email);

    if (!aluno) {
      aluno = { nome, email };
      alunos.push(aluno);

      fs.writeFileSync(alunosPath, JSON.stringify(alunos, null, 2));

      console.log("Aluno criado:", nome, email);
    }

    // =========================
    // DISCIPLINAS
    // =========================
    const disciplinas = JSON.parse(
  fs.readFileSync(disciplinasPath, "utf-8")
);

    const disciplina = disciplinas.find(
      (d: any) => d.nome === produto
    );

    if (!disciplina) {
      console.log("Disciplina não encontrada:", produto);
      return NextResponse.json({
        ok: true,
        aviso: "Aluno criado, mas disciplina não encontrada",
      });
    }

    // =========================
    // MATRÍCULAS
    // =========================
    const matriculas = JSON.parse(
  fs.readFileSync(matriculasPath, "utf-8")
);

    const jaMatriculado = matriculas.find(
      (m: any) =>
        m.alunoEmail === email &&
        m.disciplinaId === disciplina.id
    );

    if (!jaMatriculado) {
  matriculas.push({
    alunoEmail: email,
    disciplinaId: disciplina.id,
  });

  fs.writeFileSync(
    matriculasPath,
    JSON.stringify(matriculas, null, 2)
  );

  console.log("Aluno matriculado:", email, "→", disciplina.nome);
} else {
  console.log("Aluno já matriculado");
}


    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook:", err);

    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 }
    );
  }
}

