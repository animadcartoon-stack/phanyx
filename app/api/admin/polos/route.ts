import { NextRequest, NextResponse } from "next/server";
import {
  StatusComercialPolo,
  TipoUnidadePolo,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

function textoObrigatorio(valor: unknown) {
  return String(valor ?? "").trim();
}

function textoOpcional(valor: unknown) {
  const texto = String(valor ?? "").trim();
  return texto || null;
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function tipoUnidadeValido(
  valor: string
): valor is TipoUnidadePolo {
  return Object.values(TipoUnidadePolo).includes(
    valor as TipoUnidadePolo
  );
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

    const usuarioId = Number(user.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    const nome = textoObrigatorio(body.nome);
    const codigo = textoOpcional(body.codigo);
    const cnpj = textoOpcional(body.cnpj);
    const descricao = textoOpcional(body.descricao);

    const cep = textoOpcional(body.cep);
    const endereco = textoOpcional(body.endereco);
    const numero = textoOpcional(body.numero);
    const complemento = textoOpcional(body.complemento);
    const bairro = textoOpcional(body.bairro);
    const cidade = textoOpcional(body.cidade);
    const estado =
      textoOpcional(body.estado)?.toUpperCase() ?? null;

    const responsavelNome = textoOpcional(
      body.responsavelNome
    );

    const responsavelEmail =
      textoOpcional(body.responsavelEmail)?.toLowerCase() ??
      null;

    const responsavelTelefone = textoOpcional(
      body.responsavelTelefone
    );

    const responsavelCargo = textoOpcional(
      body.responsavelCargo
    );

    const tipoUnidadeInformado = textoObrigatorio(
      body.tipoUnidade ?? TipoUnidadePolo.POLO
    ).toUpperCase();

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

    if (!cidade) {
      return NextResponse.json(
        { error: "Cidade do polo é obrigatória" },
        { status: 400 }
      );
    }

    if (!estado) {
      return NextResponse.json(
        { error: "Estado do polo é obrigatório" },
        { status: 400 }
      );
    }

    if (estado.length !== 2) {
      return NextResponse.json(
        {
          error:
            "Informe o estado usando a sigla com 2 letras",
        },
        { status: 400 }
      );
    }

    if (!endereco) {
      return NextResponse.json(
        { error: "Endereço do polo é obrigatório" },
        { status: 400 }
      );
    }

    if (
      responsavelEmail &&
      !emailValido(responsavelEmail)
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um e-mail válido para o responsável",
        },
        { status: 400 }
      );
    }

    if (!tipoUnidadeValido(tipoUnidadeInformado)) {
      return NextResponse.json(
        { error: "Tipo de unidade inválido" },
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
      },
    });

    if (poloExistente) {
      const campoConflito =
        codigo && poloExistente.codigo === codigo
          ? "código"
          : "nome";

      return NextResponse.json(
        {
          error: `Já existe um polo com esse ${campoConflito}`,
        },
        { status: 409 }
      );
    }

    const instituicao =
      await prisma.instituicao.findUnique({
        where: {
          id: user.instituicaoId,
        },
        select: {
          id: true,
          isentaPagamento: true,
        },
      });

    if (!instituicao) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    const assinatura =
      await prisma.assinaturaPhanyx.findUnique({
        where: {
          instituicaoId: user.instituicaoId,
        },
        select: {
          polosInclusosContrato: true,
        },
      });

    const unidadesProvisionadasAtivas =
      await prisma.polo.count({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          statusComercial:
            StatusComercialPolo.ATIVO,
          instituicaoGeradaId: {
            not: null,
          },
        },
      });

    const unidadesAtivasCobraveis =
      1 + unidadesProvisionadasAtivas;

    const limitePolosInclusos =
      instituicao.isentaPagamento
        ? null
        : Math.max(
          1,
          Number(
            assinatura?.polosInclusosContrato ?? 1
          )
        );

    const seraUnidadeExcedente =
      limitePolosInclusos !== null &&
      unidadesAtivasCobraveis >=
      limitePolosInclusos;

    const quantidadePolosAtivos =
      await prisma.polo.count({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          statusComercial:
            StatusComercialPolo.ATIVO,
        },
      });

    const agora = new Date();

    const polo = await prisma.polo.create({
      data: {
        nome,
        codigo,
        cnpj,
        descricao,
        tipoUnidade: tipoUnidadeInformado,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        responsavelNome,
        responsavelEmail,
        responsavelTelefone,
        responsavelCargo,
        ativo: true,
        statusComercial:
          StatusComercialPolo.ATIVO,
        criadoPorId: usuarioId,
        ativadoEm: agora,
        ativadoPorId: usuarioId,
        instituicaoId: user.instituicaoId,
      },
    });

    return NextResponse.json(
      {
        polo,
        ativadoAutomaticamente: true,
        limitePolosInclusos,
        quantidadePolosAtivos:
          quantidadePolosAtivos + 1,
        seraUnidadeExcedente,
        aviso: seraUnidadeExcedente
          ? "O polo foi cadastrado como ativo. Ao criar o acesso institucional, esta unidade ficará acima do limite contratado e poderá gerar cobrança adicional."
          : null,
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

    if (
      "ativo" in body ||
      "statusComercial" in body ||
      "ativadoEm" in body ||
      "ativadoPorId" in body ||
      "suspensoEm" in body ||
      "suspensoPorId" in body ||
      "encerradoEm" in body ||
      "encerradoPorId" in body
    ) {
      return NextResponse.json(
        {
          error:
            "O status comercial do polo deve ser alterado pelo fluxo específico de ativação, suspensão ou encerramento.",
        },
        { status: 409 }
      );
    }

    const nome =
      "nome" in body
        ? textoObrigatorio(body.nome)
        : poloAtual.nome;

    const codigo =
      "codigo" in body
        ? textoOpcional(body.codigo)
        : poloAtual.codigo;

    const cnpj =
      "cnpj" in body
        ? textoOpcional(body.cnpj)
        : poloAtual.cnpj;

    const descricao =
      "descricao" in body
        ? textoOpcional(body.descricao)
        : poloAtual.descricao;

    const cep =
      "cep" in body
        ? textoOpcional(body.cep)
        : poloAtual.cep;

    const endereco =
      "endereco" in body
        ? textoOpcional(body.endereco)
        : poloAtual.endereco;

    const numero =
      "numero" in body
        ? textoOpcional(body.numero)
        : poloAtual.numero;

    const complemento =
      "complemento" in body
        ? textoOpcional(body.complemento)
        : poloAtual.complemento;

    const bairro =
      "bairro" in body
        ? textoOpcional(body.bairro)
        : poloAtual.bairro;

    const cidade =
      "cidade" in body
        ? textoOpcional(body.cidade)
        : poloAtual.cidade;

    const estado =
      "estado" in body
        ? textoOpcional(body.estado)?.toUpperCase() ?? null
        : poloAtual.estado;

    const responsavelNome =
      "responsavelNome" in body
        ? textoOpcional(body.responsavelNome)
        : poloAtual.responsavelNome;

    const responsavelEmail =
      "responsavelEmail" in body
        ? textoOpcional(
          body.responsavelEmail
        )?.toLowerCase() ?? null
        : poloAtual.responsavelEmail;

    const responsavelTelefone =
      "responsavelTelefone" in body
        ? textoOpcional(body.responsavelTelefone)
        : poloAtual.responsavelTelefone;

    const responsavelCargo =
      "responsavelCargo" in body
        ? textoOpcional(body.responsavelCargo)
        : poloAtual.responsavelCargo;

    let tipoUnidade = poloAtual.tipoUnidade;

    if ("tipoUnidade" in body) {
      const tipoInformado = textoObrigatorio(
        body.tipoUnidade
      ).toUpperCase();

      if (!tipoUnidadeValido(tipoInformado)) {
        return NextResponse.json(
          { error: "Tipo de unidade inválido" },
          { status: 400 }
        );
      }

      tipoUnidade = tipoInformado;
    }

    if (!nome) {
      return NextResponse.json(
        { error: "Nome do polo é obrigatório" },
        { status: 400 }
      );
    }

    if (estado && estado.length !== 2) {
      return NextResponse.json(
        {
          error:
            "Informe o estado usando a sigla com 2 letras",
        },
        { status: 400 }
      );
    }

    if (
      responsavelEmail &&
      !emailValido(responsavelEmail)
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um e-mail válido para o responsável",
        },
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
      },
    });

    if (poloDuplicado) {
      const campoConflito =
        codigo && poloDuplicado.codigo === codigo
          ? "código"
          : "nome";

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
        descricao,
        tipoUnidade,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        responsavelNome,
        responsavelEmail,
        responsavelTelefone,
        responsavelCargo,
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