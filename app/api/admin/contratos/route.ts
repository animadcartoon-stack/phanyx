import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatarDataAtual() {
  return new Date().toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function substituirTemplate(
  template: string,
  valores: Record<string, string>
) {
  let texto = template;

  for (const [chave, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{{${chave}}}`, valor);
  }

  return texto;
}

async function montarContratoDaMatricula(matriculaId: number, instituicaoId: number) {
  const matricula = await prisma.matricula.findFirst({
    where: {
      id: matriculaId,
      instituicaoId,
    },
    include: {
      aluno: {
        include: {
          instituicao: true,
        },
      },
      curso: true,
      itens: {
  include: {
    disciplina: true,
    turma: true,
  },
},
      lancamentosFinanceiros: {
        where: {
          status: {
            in: ["PENDENTE", "PARCIAL", "PAGO", "ATRASADO"] as any,
          },
        },
      },
    },
  });

  if (!matricula) {
    throw new Error("Matrícula não encontrada");
  }

  const config = await prisma.configuracaoInstituicao.findUnique({
    where: {
      instituicaoId,
    },
  });

  const disciplinasLista = Array.from(
    new Set(
      matricula.itens
        .map((item) => item.disciplina?.nome?.trim())
        .filter(Boolean) as string[]
    )
  );

  const turmasLista = Array.from(
    new Set(
      matricula.itens
        .map((item) => item.turma?.nome?.trim())
        .filter(Boolean) as string[]
    )
  );

  const cursoNome =
    matricula.curso?.nome?.trim() ||
    (turmasLista.length > 0 ? turmasLista.join(", ") : "Curso não informado");

  const disciplinasTexto =
    disciplinasLista.length > 0
      ? disciplinasLista.map((d) => `- ${d}`).join("\n")
      : "- Não informado";

  const valorContrato = matricula.lancamentosFinanceiros.reduce(
    (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
    0
  );

  const template =
    config?.contratoTemplate ||
    `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

A instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

E por estarem de pleno acordo, firmam o presente contrato.

{{cidadeAssinatura}}, {{dataAtual}}.`;

  const contratoFinal = substituirTemplate(template, {
    nomeInstituicao:
      config?.nomeFantasia || matricula.aluno?.instituicao?.nome || "Instituição",
    cnpjInstituicao: config?.cnpj || "-",
    responsavelLegal: config?.responsavelNome || "-",
    nomeAluno: matricula.aluno?.nome || "-",
    cpfAluno: matricula.aluno?.cpf || "-",
    matriculaAluno: matricula.aluno?.matricula || "-",
    curso: cursoNome,
    disciplinas: disciplinasTexto,
    valorContrato: formatarMoeda(valorContrato),
    cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
    dataAtual: formatarDataAtual(),
  });

  return {
    matricula,
    config,
    cursoNome,
    disciplinasLista,
    turmasLista,
    valorContrato,
    contratoFinal,
  };
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const matriculaId = Number(searchParams.get("matriculaId"));

    if (!Number.isFinite(matriculaId) || matriculaId <= 0) {
      return NextResponse.json({ error: "Matrícula inválida" }, { status: 400 });
    }

    const contrato = await prisma.contrato.findFirst({
      where: {
        matriculaId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        assinatura: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (!contrato) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      id: contrato.id,
      matriculaId: contrato.matriculaId,
      alunoId: contrato.alunoId,
      status: contrato.status,
      tokenAssinatura: contrato.tokenAssinatura,
      dataCriacao: contrato.dataCriacao,
      dataAssinatura: contrato.dataAssinatura,
      assinatura: contrato.assinatura,
    });
  } catch (error: any) {
    console.error("Erro ao buscar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao buscar contrato" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();
    const matriculaId = Number(body?.matriculaId);

    if (!Number.isFinite(matriculaId) || matriculaId <= 0) {
      return NextResponse.json({ error: "Matrícula inválida" }, { status: 400 });
    }

    const contratoExistente = await prisma.contrato.findFirst({
      where: {
        matriculaId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        assinatura: true,
      },
      orderBy: {
        id: "desc",
      },
    });

    if (contratoExistente) {
      return NextResponse.json({
        id: contratoExistente.id,
        matriculaId: contratoExistente.matriculaId,
        alunoId: contratoExistente.alunoId,
        status: contratoExistente.status,
        tokenAssinatura: contratoExistente.tokenAssinatura,
        dataCriacao: contratoExistente.dataCriacao,
        dataAssinatura: contratoExistente.dataAssinatura,
        assinatura: contratoExistente.assinatura,
        jaExistia: true,
      });
    }

    const dados = await montarContratoDaMatricula(matriculaId, user.instituicaoId);

    const contrato = await prisma.contrato.create({
      data: {
        matriculaId: dados.matricula.id,
        alunoId: dados.matricula.alunoId,
        instituicaoId: user.instituicaoId,
        conteudo: dados.contratoFinal,
        status: "PENDENTE",
      },
    });

    return NextResponse.json({
      id: contrato.id,
      matriculaId: contrato.matriculaId,
      alunoId: contrato.alunoId,
      status: contrato.status,
      tokenAssinatura: contrato.tokenAssinatura,
      dataCriacao: contrato.dataCriacao,
      jaExistia: false,
    });
  } catch (error: any) {
    console.error("Erro ao criar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar contrato" },
      { status: 500 }
    );
  }
}