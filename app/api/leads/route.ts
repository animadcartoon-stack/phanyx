import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function textoOuNull(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function normalizarEmail(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

function normalizarOrigem(valor: unknown) {
  const origem = String(valor ?? "")
    .trim()
    .toUpperCase();

  return origem || "SITE_PLANOS";
}

function lerValorOpcional(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero < 0) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function lerQuantidadeOpcional(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return {
      valido: true,
      valor: null as number | null,
    };
  }

  const numero = Number(valor);

  if (
    !Number.isInteger(numero) ||
    numero < 0
  ) {
    return {
      valido: false,
      valor: null as number | null,
    };
  }

  return {
    valido: true,
    valor: numero,
  };
}

function montarObservacoes(params: {
  mensagem: string | null;
  observacoes: string | null;
  cidade: string | null;
  quantidadeAlunos: number | null;
}) {
  const partes: string[] = [];

  if (params.mensagem) {
    partes.push(`Mensagem enviada:\n${params.mensagem}`);
  }

  if (
    params.observacoes &&
    params.observacoes !== params.mensagem
  ) {
    partes.push(`Observações:\n${params.observacoes}`);
  }

  if (params.cidade) {
    partes.push(`Cidade informada: ${params.cidade}`);
  }

  if (params.quantidadeAlunos !== null) {
    partes.push(
      `Quantidade estimada de alunos: ${params.quantidadeAlunos}`
    );
  }

  return partes.length > 0
    ? partes.join("\n\n")
    : null;
}

/*
 * Esta rota é pública e serve somente para captação.
 * A listagem administrativa está em /api/admin/leads.
 */
export async function GET() {
  return NextResponse.json(
    {
      error:
        "A listagem de leads não está disponível nesta rota.",
    },
    {
      status: 405,
      headers: {
        Allow: "POST",
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body?.nome || "").trim();
    const email = normalizarEmail(body?.email);

    if (!nome || !email) {
      return NextResponse.json(
        {
          error: "Nome e e-mail são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (
      !email.includes("@") ||
      email.startsWith("@") ||
      email.endsWith("@")
    ) {
      return NextResponse.json(
        {
          error: "Informe um e-mail válido.",
        },
        { status: 400 }
      );
    }

    const valorEstimado = lerValorOpcional(
      body?.valorEstimado
    );

    if (!valorEstimado.valido) {
      return NextResponse.json(
        {
          error:
            "O valor estimado precisa ser válido e não negativo.",
        },
        { status: 400 }
      );
    }

    const quantidadeAlunos =
      lerQuantidadeOpcional(
        body?.quantidadeAlunos
      );

    if (!quantidadeAlunos.valido) {
      return NextResponse.json(
        {
          error:
            "A quantidade de alunos precisa ser um número inteiro não negativo.",
        },
        { status: 400 }
      );
    }

    const instituicaoNome = textoOuNull(
      body?.instituicaoNome ??
        body?.instituicao
    );

    const interesse = textoOuNull(
      body?.interesse ??
        body?.interessePlano
    );

    const mensagem = textoOuNull(
      body?.mensagem
    );

    const observacoesInformadas =
      textoOuNull(body?.observacoes);

    const cidade = textoOuNull(body?.cidade);

    const observacoes = montarObservacoes({
      mensagem,
      observacoes: observacoesInformadas,
      cidade,
      quantidadeAlunos:
        quantidadeAlunos.valor,
    });

    const lead = await prisma.lead.create({
      data: {
        /*
         * null identifica o CRM comercial global da PHANYX.
         * Leads institucionais são criados pelas APIs autenticadas.
         */
        instituicaoGestoraId: null,
        instituicaoInteressadaId: null,

        responsavelFuncionarioId: null,
        responsavelNomeSnapshot: null,

        criadoPorId: null,
        atualizadoPorId: null,

        nome,
        email,

        telefone: textoOuNull(
          body?.telefone
        ),

        instituicaoNome,
        cargo: textoOuNull(body?.cargo),

        origem: normalizarOrigem(
          body?.origem
        ),

        tipo: "PHANYX",
        interesse,
        observacoes,

        status: "NOVO",
        prioridade: "MEDIA",

        valorEstimado:
          valorEstimado.valor,

        proximoContatoEm: null,
        ultimoContatoEm: null,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        origem: true,
        tipo: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        mensagem:
          "Recebemos seus dados. Nossa equipe entrará em contato.",
        lead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar lead público:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar seus dados.",
      },
      { status: 500 }
    );
  }
}