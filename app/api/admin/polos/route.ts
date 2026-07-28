import { NextRequest, NextResponse } from "next/server";
import {
  StatusComercialPolo,
  TipoUnidadePolo,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  filtroPoloGerenciavel,
  filtroPolosVisiveis,
  obterContextoGestaoPolos,
  obterResumoUnidadesDaRede,
} from "@/lib/polos-rede";

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

function mensagemSemPermissaoPolos() {
  return {
    error:
      "A gestão de polos não está habilitada para esta unidade. Essa permissão é controlada pela instituição contratante.",
  };
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

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        mensagemSemPermissaoPolos(),
        { status: 403 }
      );
    }

    const polos = await prisma.polo.findMany({
      where: filtroPolosVisiveis(contexto),
      orderBy: [
        {
          ativo: "desc",
        },
        {
          nome: "asc",
        },
      ],
    });

    const instituicoesGeradasIds = polos
      .map((polo) => polo.instituicaoGeradaId)
      .filter(
        (id): id is number =>
          typeof id === "number" &&
          Number.isInteger(id) &&
          id > 0
      );

    const instituicoesGeradas =
      instituicoesGeradasIds.length > 0
        ? await prisma.instituicao.findMany({
          where: {
            id: {
              in: instituicoesGeradasIds,
            },
          },
          select: {
            id: true,
            podeCriarGerenciarPolos: true,
          },
        })
        : [];

    const permissaoPorInstituicaoId =
      new Map<number, boolean>(
        instituicoesGeradas.map(
          (instituicao) => [
            instituicao.id,
            instituicao.podeCriarGerenciarPolos,
          ]
        )
      );

    const polosComPermissao = polos.map(
      (polo) => ({
        ...polo,

        podeCriarGerenciarPolos:
          polo.instituicaoGeradaId
            ? permissaoPorInstituicaoId.get(
              polo.instituicaoGeradaId
            ) ?? false
            : null,
      })
    );

    return NextResponse.json({
      polos: polosComPermissao,
      gestao: {
        instituicaoId:
          contexto.instituicaoId,

        instituicaoContratanteId:
          contexto.instituicaoContratanteId,

        ehInstituicaoContratante:
          contexto.ehInstituicaoContratante,

        permissaoDelegada:
          contexto.permissaoDelegada,

        podeGerenciarPolos:
          contexto.podeGerenciarPolos,
      },
    });
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

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        mensagemSemPermissaoPolos(),
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

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
      textoOpcional(body.estado)?.toUpperCase() ??
      null;

    const responsavelNome = textoOpcional(
      body.responsavelNome
    );

    const responsavelEmail =
      textoOpcional(
        body.responsavelEmail
      )?.toLowerCase() ?? null;

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
        {
          error:
            "Informe um nome válido para o polo",
        },
        { status: 400 }
      );
    }

    if (!cidade) {
      return NextResponse.json(
        {
          error:
            "Cidade do polo é obrigatória",
        },
        { status: 400 }
      );
    }

    if (!estado) {
      return NextResponse.json(
        {
          error:
            "Estado do polo é obrigatório",
        },
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
        {
          error:
            "Endereço do polo é obrigatório",
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

    if (
      !tipoUnidadeValido(
        tipoUnidadeInformado
      )
    ) {
      return NextResponse.json(
        {
          error: "Tipo de unidade inválido",
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

    /*
     * A duplicidade é verificada em toda a rede.
     * Assim, dois polos de filiais diferentes não
     * recebem o mesmo nome ou código interno.
     */
    const escopoDaRede =
      contexto.redeId !== null
        ? {
          instituicao: {
            is: {
              redeInstitucionalId:
                contexto.redeId,
            },
          },
        }
        : {
          instituicaoId:
            contexto.instituicaoContratanteId,
        };

    const poloExistente =
      await prisma.polo.findFirst({
        where: {
          AND: [
            escopoDaRede,
            {
              OR: criteriosDuplicidade,
            },
          ],
        },
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      });

    if (poloExistente) {
      const campoConflito =
        codigo &&
          poloExistente.codigo === codigo
          ? "código"
          : "nome";

      return NextResponse.json(
        {
          error: `Já existe um polo com esse ${campoConflito} na rede institucional`,
        },
        { status: 409 }
      );
    }

    /*
     * A assinatura e os limites sempre são
     * consultados na instituição contratante.
     */
    const resumo =
      await obterResumoUnidadesDaRede(
        contexto
      );

    const agora = new Date();

    const polo = await prisma.polo.create({
      data: {
        nome,
        codigo,
        cnpj,
        descricao,
        tipoUnidade:
          tipoUnidadeInformado,
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

        /*
         * Registra qual ID institucional cadastrou
         * e administra operacionalmente esse polo.
         */
        instituicaoId:
          contexto.instituicaoId,
      },
    });

    return NextResponse.json(
      {
        polo,
        ativadoAutomaticamente: true,

        instituicaoContratanteId:
          resumo.instituicaoContratanteId,

        limitePolosInclusos:
          resumo.limiteUnidadesIncluidas,

        quantidadePolosAtivos:
          resumo.unidadesAtivas,

        unidadesExcedentes:
          resumo.unidadesExcedentes,

        seraUnidadeExcedente:
          resumo.proximaUnidadeSeraExcedente,

        aviso:
          resumo.proximaUnidadeSeraExcedente
            ? "O polo foi cadastrado como ativo. Ao criar o acesso institucional, esta unidade ficará acima do limite contratado e poderá gerar cobrança adicional na assinatura da instituição contratante."
            : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar polo:",
      error
    );

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

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        mensagemSemPermissaoPolos(),
        { status: 403 }
      );
    }

    const body = (await req.json()) as Record<
      string,
      unknown
    >;

    const id = Number(body.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    /*
     * A contratante pode gerenciar toda a rede.
     * A unidade delegada gerencia apenas os polos
     * cadastrados pelo próprio ID institucional.
     */
    const poloAtual =
      await prisma.polo.findFirst({
        where: filtroPoloGerenciavel(
          contexto,
          id
        ),
      });

    if (!poloAtual) {
      return NextResponse.json(
        {
          error:
            "Polo não encontrado ou não pertencente ao escopo de gestão desta unidade.",
        },
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
        ? textoOpcional(
          body.estado
        )?.toUpperCase() ?? null
        : poloAtual.estado;

    const responsavelNome =
      "responsavelNome" in body
        ? textoOpcional(
          body.responsavelNome
        )
        : poloAtual.responsavelNome;

    const responsavelEmail =
      "responsavelEmail" in body
        ? textoOpcional(
          body.responsavelEmail
        )?.toLowerCase() ?? null
        : poloAtual.responsavelEmail;

    const responsavelTelefone =
      "responsavelTelefone" in body
        ? textoOpcional(
          body.responsavelTelefone
        )
        : poloAtual.responsavelTelefone;

    const responsavelCargo =
      "responsavelCargo" in body
        ? textoOpcional(
          body.responsavelCargo
        )
        : poloAtual.responsavelCargo;

    let tipoUnidade =
      poloAtual.tipoUnidade;

    if ("tipoUnidade" in body) {
      const tipoInformado =
        textoObrigatorio(
          body.tipoUnidade
        ).toUpperCase();

      if (
        !tipoUnidadeValido(
          tipoInformado
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Tipo de unidade inválido",
          },
          { status: 400 }
        );
      }

      tipoUnidade = tipoInformado;
    }

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Nome do polo é obrigatório",
        },
        { status: 400 }
      );
    }

    if (
      estado &&
      estado.length !== 2
    ) {
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

    const escopoDaRede =
      contexto.redeId !== null
        ? {
          instituicao: {
            is: {
              redeInstitucionalId:
                contexto.redeId,
            },
          },
        }
        : {
          instituicaoId:
            contexto.instituicaoContratanteId,
        };

    const poloDuplicado =
      await prisma.polo.findFirst({
        where: {
          AND: [
            escopoDaRede,
            {
              id: {
                not: id,
              },
            },
            {
              OR: criteriosDuplicidade,
            },
          ],
        },
        select: {
          id: true,
          nome: true,
          codigo: true,
        },
      });

    if (poloDuplicado) {
      const campoConflito =
        codigo &&
          poloDuplicado.codigo === codigo
          ? "código"
          : "nome";

      return NextResponse.json(
        {
          error: `Já existe outro polo com esse ${campoConflito} na rede institucional`,
        },
        { status: 409 }
      );
    }

    const poloAtualizado =
      await prisma.polo.update({
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

    return NextResponse.json(
      poloAtualizado
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar polo:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar polo",
      },
      { status: 500 }
    );
  }
}