import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

function textoObrigatorio(valor: unknown) {
  return String(valor ?? "").trim();
}

function textoOpcional(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function normalizarPlano(plano: string | null | undefined) {
  return String(plano ?? "ESSENCIAL")
    .trim()
    .toUpperCase();
}

/**
 * Quantidade de polos incluídos sem cobrança adicional.
 *
 * Enterprise está temporariamente considerando 10 polos,
 * conforme a regra que já vinha sendo usada na calculadora.
 * Depois podemos mover isso para uma configuração comercial
 * centralizada, evitando números fixos espalhados no sistema.
 */
function obterLimitePolosInclusos(plano: string | null | undefined) {
  const planoNormalizado = normalizarPlano(plano);

  switch (planoNormalizado) {
    case "PROFISSIONAL":
      return 3;

    case "ENTERPRISE":
      return 10;

    case "ESSENCIAL":
    default:
      return 1;
  }
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const polos = await prisma.polo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: [
        {
          ativo: "desc",
        },
        {
          nome: "asc",
        },
      ],
    });

    return NextResponse.json(polos);
  } catch (error) {
    console.error("Erro ao buscar polos:", error);

    return NextResponse.json(
      { error: "Erro ao buscar polos" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    const nome = textoObrigatorio(body.nome);
    const codigo = textoOpcional(body.codigo);
    const cnpj = textoOpcional(body.cnpj);
    const descricao = textoOpcional(body.descricao);
    const cidade = textoOpcional(body.cidade);
    const estado = textoOpcional(body.estado)?.toUpperCase() ?? null;
    const endereco = textoOpcional(body.endereco);

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do polo é obrigatório" },
        { status: 400 }
      );
    }

    if (nome.length < 2) {
      return NextResponse.json(
        { error: "Informe um nome válido para o polo" },
        { status: 400 }
      );
    }

    if (estado && estado.length !== 2) {
      return NextResponse.json(
        { error: "Informe o estado usando a sigla com 2 letras" },
        { status: 400 }
      );
    }

    const criteriosDuplicidade = [
      {
        nome,
      },
      ...(codigo
        ? [
            {
              codigo,
            },
          ]
        : []),
      ...(cnpj
        ? [
            {
              cnpj,
            },
          ]
        : []),
    ];

    const poloExistente = await prisma.polo.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        OR: criteriosDuplicidade,
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        cnpj: true,
      },
    });

    if (poloExistente) {
      let campoConflito = "nome";

      if (codigo && poloExistente.codigo === codigo) {
        campoConflito = "código";
      }

      if (cnpj && poloExistente.cnpj === cnpj) {
        campoConflito = "CNPJ";
      }

      return NextResponse.json(
        {
          error: `Já existe um polo com esse ${campoConflito}`,
        },
        { status: 409 }
      );
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: {
        id: user.instituicaoId,
      },
      select: {
        plano: true,
      },
    });

    if (!instituicao) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    const limitePolosInclusos = obterLimitePolosInclusos(
      instituicao.plano
    );

    const quantidadePolosAtivos = await prisma.polo.count({
      where: {
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
    });

    /*
     * O primeiro polo ou os polos ainda dentro do limite do plano
     * podem ser ativados automaticamente.
     *
     * Acima do limite, o polo é cadastrado como inativo.
     * Posteriormente criaremos o status PENDENTE_ATIVACAO
     * e a aprovação comercial.
     */
    const ativadoAutomaticamente =
      quantidadePolosAtivos < limitePolosInclusos;

    const polo = await prisma.polo.create({
      data: {
        nome,
        codigo,
        cnpj,
        descricao,
        cidade,
        estado,
        endereco,
        ativo: ativadoAutomaticamente,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(
      {
        polo,
        ativadoAutomaticamente,
        limitePolosInclusos,
        quantidadePolosAtivos:
          quantidadePolosAtivos + (ativadoAutomaticamente ? 1 : 0),
        aviso: ativadoAutomaticamente
          ? null
          : "O polo foi cadastrado, mas não foi ativado porque a instituição atingiu o limite incluído no plano.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar polo:", error);

    return NextResponse.json(
      { error: "Erro ao criar polo" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    /*
     * Primeiro confirma que o polo realmente pertence
     * à instituição do usuário logado.
     */
    const poloAtual = await prisma.polo.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!poloAtual) {
      return NextResponse.json(
        { error: "Polo não encontrado" },
        { status: 404 }
      );
    }

    /*
     * O status não pode mais ser alterado livremente
     * pela edição normal do polo.
     *
     * Enquanto a página ainda envia ativo, permitimos
     * somente quando o valor permanece igual.
     */
    if ("ativo" in body) {
      if (typeof body.ativo !== "boolean") {
        return NextResponse.json(
          { error: "Status do polo inválido" },
          { status: 400 }
        );
      }

      if (body.ativo !== poloAtual.ativo) {
        return NextResponse.json(
          {
            error:
              "A ativação ou inativação do polo deve ser feita pelo fluxo específico de gestão comercial.",
          },
          { status: 409 }
        );
      }
    }

    const nome = textoObrigatorio(body.nome);
    const codigo = textoOpcional(body.codigo);
    const cnpj = textoOpcional(body.cnpj);
    const descricao = textoOpcional(body.descricao);
    const cidade = textoOpcional(body.cidade);
    const estado = textoOpcional(body.estado)?.toUpperCase() ?? null;
    const endereco = textoOpcional(body.endereco);

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do polo é obrigatório" },
        { status: 400 }
      );
    }

    if (estado && estado.length !== 2) {
      return NextResponse.json(
        { error: "Informe o estado usando a sigla com 2 letras" },
        { status: 400 }
      );
    }

    const criteriosDuplicidade = [
      {
        nome,
      },
      ...(codigo
        ? [
            {
              codigo,
            },
          ]
        : []),
      ...(cnpj
        ? [
            {
              cnpj,
            },
          ]
        : []),
    ];

    const poloDuplicado = await prisma.polo.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        id: {
          not: id,
        },
        OR: criteriosDuplicidade,
      },
      select: {
        id: true,
        nome: true,
        codigo: true,
        cnpj: true,
      },
    });

    if (poloDuplicado) {
      let campoConflito = "nome";

      if (codigo && poloDuplicado.codigo === codigo) {
        campoConflito = "código";
      }

      if (cnpj && poloDuplicado.cnpj === cnpj) {
        campoConflito = "CNPJ";
      }

      return NextResponse.json(
        {
          error: `Já existe outro polo com esse ${campoConflito}`,
        },
        { status: 409 }
      );
    }

    const poloAtualizado = await prisma.polo.update({
      where: {
        id: poloAtual.id,
      },
      data: {
        nome,
        codigo,
        cnpj,
        cidade,
        estado,
        endereco,
        descricao,

        /*
         * Não colocamos ativo aqui.
         * A edição comum nunca poderá alterar o status comercial.
         */
      },
    });

    return NextResponse.json(poloAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar polo:", error);

    return NextResponse.json(
      { error: "Erro ao atualizar polo" },
      { status: 500 }
    );
  }
}