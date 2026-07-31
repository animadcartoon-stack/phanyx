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

function montarEnderecoContrato(
  dados?: any
) {
  const ruaNumero = [
    dados?.endereco,
    dados?.numero,
  ]
    .filter(Boolean)
    .join(", ");

  const cidadeEstado = [
    dados?.cidade,
    dados?.estado,
  ]
    .filter(Boolean)
    .join(" - ");

  return [
    ruaNumero,
    dados?.bairro,
    cidadeEstado,
    dados?.cep
      ? `CEP: ${dados.cep}`
      : "",
  ]
    .filter(Boolean)
    .join(" • ") || "-";
}

function escaparRegex(valor: string) {
  return valor.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function substituirTemplate(
  template: string,
  valores: Record<string, string>
) {
  let texto = String(template || "");

  for (const [chave, valor] of Object.entries(valores)) {
    const padrao = new RegExp(
      `{{\\s*${escaparRegex(chave)}\\s*}}`,
      "g"
    );

    texto = texto.replace(
      padrao,
      () => String(valor ?? "")
    );
  }

  return texto;
}

function calcularIdade(dataNascimento?: Date | string | null) {
  if (!dataNascimento) return null;

  const nascimento = new Date(dataNascimento);
  if (Number.isNaN(nascimento.getTime())) return null;

  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();

  const aindaNaoFezAniversario =
    hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() &&
      hoje.getDate() < nascimento.getDate());

  if (aindaNaoFezAniversario) idade--;

  return idade;
}

function obterTitularContrato(aluno: any) {
  const idade =
    calcularIdade(
      aluno?.dataNascimento
    );

  const alunoEhMenor =
    idade !== null &&
    idade < 18;

  if (alunoEhMenor) {
    return {
      nome:
        aluno?.nomeResponsavel ||
        aluno?.nome ||
        "-",

      cpf:
        aluno?.cpfResponsavel ||
        aluno?.cpf ||
        "-",

      email:
        aluno?.emailResponsavel ||
        "-",

      telefone:
        aluno?.telefoneResponsavel ||
        "-",

      parentesco:
        aluno?.parentescoResponsavel ||
        "Responsável legal",

      tipo:
        "Responsável legal",
    };
  }

  return {
    nome:
      aluno?.nome || "-",

    cpf:
      aluno?.cpf || "-",

    email:
      aluno?.user?.email || "-",

    telefone:
      aluno?.telefone || "-",

    parentesco:
      "O próprio aluno",

    tipo:
      "O próprio aluno",
  };
}

export async function GET(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const matriculaIdParam = Number(searchParams.get("matriculaId"));
    const alunoIdParam = Number(searchParams.get("alunoId"));

    let matricula = null as any;

    if (Number.isFinite(matriculaIdParam) && matriculaIdParam > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          id: matriculaIdParam,
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: {
            include: {
              instituicao: true,

              polo: true,

              user: {
                select: {
                  email: true,
                },
              },
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
          contratos: {
            where: {
              status: {
                not: "CANCELADO",
              },
            },
            include: {
              assinatura: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
        },
      });
    } else if (Number.isFinite(alunoIdParam) && alunoIdParam > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          alunoId: alunoIdParam,
          instituicaoId: user.instituicaoId,
        },
        include: {
          aluno: {
            include: {
              instituicao: true,

              polo: true,

              user: {
                select: {
                  email: true,
                },
              },
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
          contratos: {
            where: {
              status: {
                not: "CANCELADO",
              },
            },
            include: {
              assinatura: true,
            },
            orderBy: {
              id: "desc",
            },
            take: 1,
          },
        },
        orderBy: {
          id: "desc",
        },
      });
    }

    if (!matricula) {
      return NextResponse.json(
        { error: "Matrícula não encontrada" },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    const templateContrato = await prisma.documentoTemplate.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        tipo: "CONTRATO",
        ativo: true,
        OR: [
          { contexto: "MATRICULA" },
          { contexto: "Matrícula" },
          { contexto: "matricula" },
          { contexto: null },
        ],
      },
      orderBy: {
        atualizadoEm: "desc",
      },
    });

    const logosInstitucionais =
      await prisma.instituicaoLogo.findMany({
        where: {
          instituicaoId:
            user.instituicaoId,
          ativa: true,
        },

        select: {
          id: true,
          tipo: true,
          arquivoUrl: true,
          principal: true,
        },

        orderBy: [
          {
            principal: "desc",
          },
          {
            id: "asc",
          },
        ],
      });

    const modoLogo =
      String(
        templateContrato?.modoLogo ||
        "AUTOMATICA"
      ).toUpperCase();

    const estiloDocumento =
      String(
        config?.estiloDocumento ||
        "INSTITUCIONAL"
      ).toUpperCase();

    const cabecalhoEscuro =
      estiloDocumento ===
      "PHANYX_CLASSICO" ||
      estiloDocumento ===
      "PHANYX_MODERNO";

    const encontrarPorTipo = (
      tipoLogo: string
    ) =>
      logosInstitucionais.find(
        (logo) =>
          String(logo.tipo) ===
          tipoLogo
      ) || null;

    const logoPrincipal =
      logosInstitucionais.find(
        (logo) =>
          logo.principal
      ) ||
      encontrarPorTipo(
        "PRINCIPAL"
      );

    const logoPersonalizada =
      templateContrato
        ?.logoInstituicaoId
        ? logosInstitucionais.find(
          (logo) =>
            logo.id ===
            templateContrato.logoInstituicaoId
        ) || null
        : null;

    let logoDocumentoUrl:
      | string
      | null =
      config?.logoUrl || null;

    if (
      modoLogo ===
      "SEM_LOGO"
    ) {
      logoDocumentoUrl = null;
    } else if (
      modoLogo ===
      "PERSONALIZADA"
    ) {
      logoDocumentoUrl =
        logoPersonalizada
          ?.arquivoUrl ||
        logoPrincipal
          ?.arquivoUrl ||
        config?.logoUrl ||
        null;
    } else if (
      modoLogo ===
      "FUNDO_ESCURO"
    ) {
      logoDocumentoUrl =
        encontrarPorTipo(
          "FUNDO_ESCURO"
        )?.arquivoUrl ||
        logoPrincipal
          ?.arquivoUrl ||
        config?.logoUrl ||
        null;
    } else if (
      modoLogo ===
      "FUNDO_CLARO"
    ) {
      logoDocumentoUrl =
        encontrarPorTipo(
          "FUNDO_CLARO"
        )?.arquivoUrl ||
        logoPrincipal
          ?.arquivoUrl ||
        config?.logoUrl ||
        null;
    } else if (
      modoLogo ===
      "PRINCIPAL"
    ) {
      logoDocumentoUrl =
        logoPrincipal
          ?.arquivoUrl ||
        config?.logoUrl ||
        null;
    } else {
      /*
       * AUTOMÁTICA:
       * cabeçalho escuro procura primeiro
       * a versão FUNDO_ESCURO.
       */
      logoDocumentoUrl =
        (
          cabecalhoEscuro
            ? encontrarPorTipo(
              "FUNDO_ESCURO"
            )
            : encontrarPorTipo(
              "FUNDO_CLARO"
            )
        )?.arquivoUrl ||
        logoPrincipal
          ?.arquivoUrl ||
        config?.logoUrl ||
        null;
    }

    const disciplinasLista = matricula.itens
      .map((item) => {
        const disciplinaNome = item.disciplina?.nome?.trim();
        const turmaNome = item.turma?.nome?.trim();

        if (!disciplinaNome) return null;

        return turmaNome
          ? `${disciplinaNome} — Turma ${turmaNome}`
          : disciplinaNome;
      })
      .filter(Boolean);

    const turmasLista = Array.from(
      new Set(
        matricula.itens
          .map((item: any) => item.turma?.nome?.trim())
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

    const valorLancamentos = matricula.lancamentosFinanceiros.reduce(
      (acc: number, item: any) =>
        acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
      0
    );

    const valorContrato =
      valorLancamentos ||
      Number(matricula.valorMatricula || 0) ||
      Number(matricula.valorMensalidade || 0) ||
      0;

    const template =
      templateContrato?.conteudo ||
      config?.contratoTemplate ||
      `CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS

A instituição {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matrícula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

E por estarem de pleno acordo, firmam o presente contrato.

{{cidadeAssinatura}}, {{dataAtual}}.`;

    let numeroMatriculaOficial =
      matricula.numeroMatricula || matricula.aluno?.matricula || "";

    if (!numeroMatriculaOficial) {
      const novoNumero = String(matricula.id).padStart(8, "0");

      await prisma.matricula.update({
        where: { id: matricula.id },
        data: { numeroMatricula: novoNumero },
      });

      numeroMatriculaOficial = novoNumero;
    }

    const titularContrato = obterTitularContrato(matricula.aluno);

    const agora =
      new Date();

    const polo =
      matricula.aluno?.polo || null;

    const nomeUnidadeDocumento =
      polo?.nome?.trim() ||
      config?.nomeUnidadePrincipal?.trim() ||
      (config?.cidade?.trim()
        ? `SEDE - ${config.cidade.trim()}`
        : "SEDE");

    const dadosUnidadeDocumento =
      polo || config;

    const enderecoInstituicao =
      montarEnderecoContrato(
        config
      );

    const enderecoPolo =
      montarEnderecoContrato(
        dadosUnidadeDocumento
      );

    const cargaHorariaCursoCadastrada =
      Number(
        (matricula.curso as any)
          ?.cargaHoraria || 0
      );

    const cargaHorariaDisciplinas =
      matricula.itens.reduce(
        (
          total: number,
          item: any
        ) =>
          total +
          Number(
            item.disciplina
              ?.cargaHoraria || 0
          ),
        0
      );

    const cargaHorariaCurso =
      cargaHorariaCursoCadastrada ||
      cargaHorariaDisciplinas;

    const numeroDocumento =
      `CONTRATO-${agora.getFullYear()}-${String(
        matricula.id
      ).padStart(6, "0")}`;

    const contratoGerado =
      substituirTemplate(template, {
        logoInstituicao: "",

        nomeInstituicao:
          config?.nomeFantasia ||
          matricula.aluno
            ?.instituicao?.nome ||
          "Instituição",

        cnpjInstituicao:
          config?.cnpj || "-",

        enderecoInstituicao,

        telefoneInstituicao:
          config?.telefone || "-",

        emailInstituicao:
          config?.email || "-",

        cidadeInstituicao:
          config?.cidade || "-",

        estadoInstituicao:
          config?.estado || "-",

        cepInstituicao:
          config?.cep || "-",

        responsavelLegal:
          config?.responsavelNome ||
          "-",

        nomeAluno:
          matricula.aluno?.nome ||
          "-",

        cpfAluno:
          matricula.aluno?.cpf ||
          "-",

        matriculaAluno:
          numeroMatriculaOficial,

        numeroMatricula:
          numeroMatriculaOficial,

        statusAluno:
          matricula.aluno
            ?.statusAluno || "-",

        dataNascimentoAluno:
          matricula.aluno
            ?.dataNascimento
            ? new Date(
              matricula.aluno
                .dataNascimento
            ).toLocaleDateString(
              "pt-BR"
            )
            : "-",

        nomeTitularContrato:
          titularContrato.nome,

        cpfTitularContrato:
          titularContrato.cpf,

        emailTitularContrato:
          titularContrato.email,

        telefoneTitularContrato:
          titularContrato.telefone,

        parentescoTitularContrato:
          titularContrato.parentesco,

        tipoTitularContrato:
          titularContrato.tipo,

        curso:
          cursoNome,

        cursoNome,

        disciplinas:
          disciplinasTexto,

        disciplinasContratadas:
          disciplinasTexto,

        statusMatricula:
          matricula.status || "-",

        dataMatricula:
          matricula.createdAt
            ? new Date(
              matricula.createdAt
            ).toLocaleDateString(
              "pt-BR"
            )
            : "-",

        dataInicioAluno:
          matricula.createdAt
            ? new Date(
              matricula.createdAt
            ).toLocaleDateString(
              "pt-BR"
            )
            : "-",

        semestreAtual:
          matricula.semestre !==
            null &&
            matricula.semestre !==
            undefined
            ? String(
              matricula.semestre
            )
            : "-",

        cargaHorariaCurso:
          cargaHorariaCurso > 0
            ? `${cargaHorariaCurso}h`
            : "-",

        nomePolo:
          nomeUnidadeDocumento,

        enderecoPolo,

        telefonePolo:
          dadosUnidadeDocumento?.telefone || "-",

        emailPolo:
          dadosUnidadeDocumento?.email || "-",

        cidadePolo:
          dadosUnidadeDocumento?.cidade || "-",

        estadoPolo:
          dadosUnidadeDocumento?.estado || "-",

        cepPolo:
          dadosUnidadeDocumento?.cep || "-",

        valorContrato:
          formatarMoeda(
            valorContrato
          ),

        cidadeAssinatura:
          config?.cidadeAssinatura ||
          config?.cidade ||
          "-",

        dataAtual:
          agora.toLocaleDateString(
            "pt-BR"
          ),

        dataEmissao:
          agora.toLocaleDateString(
            "pt-BR"
          ),

        horaEmissao:
          agora.toLocaleTimeString(
            "pt-BR"
          ),

        dataHoraEmissao:
          agora.toLocaleString(
            "pt-BR"
          ),

        numeroDocumento,

        tituloDocumento:
          templateContrato?.nome ||
          "Contrato educacional",

        assinaturaDiretor: "",

        blocoAssinaturaDiretor: "",
      });

    let contratoExistente = matricula.contratos?.[0] || null;

    if (!contratoExistente) {
      contratoExistente = await prisma.contrato.create({
        data: {
          alunoId: matricula.aluno.id,
          instituicaoId: user.instituicaoId,
          matriculaId: matricula.id,
          conteudo: contratoGerado,
          status: "PENDENTE",
        },
        include: {
          assinatura: true,
        },
      });
    }

    const contratoFinal = contratoGerado;
    return NextResponse.json({
      matricula: {
        id: matricula.id,
        status: matricula.status,
        semestre: matricula.semestre,
      },
      contrato: contratoExistente
        ? {
          id: contratoExistente.id,
          status: contratoExistente.status,
          tokenAssinatura: contratoExistente.tokenAssinatura,
          dataCriacao: contratoExistente.dataCriacao,
          dataAssinatura: contratoExistente.dataAssinatura,
          assinatura: contratoExistente.assinatura || null,
          assinaturaSecretariaImagem:
            contratoExistente.assinaturaSecretariaImagem || null,
          assinaturaSecretariaNome:
            contratoExistente.assinaturaSecretariaNome || null,
          assinaturaSecretariaEm:
            contratoExistente.assinaturaSecretariaEm || null,
        }
        : null,
      aluno: {
        id: matricula.aluno.id,
        nome: matricula.aluno.nome,
        cpf: matricula.aluno.cpf,
        matricula: numeroMatriculaOficial,
      },
      instituicao: {
        nomeFantasia:
          config?.nomeFantasia || matricula.aluno?.instituicao?.nome || "Instituição",
        cnpj: config?.cnpj || "-",

        telefone:
          config?.telefone || "-",

        email:
          config?.email || "-",

        endereco:
          config?.endereco || "-",

        numero:
          config?.numero || "-",

        bairro:
          config?.bairro || "-",

        cidade:
          config?.cidade || "-",

        estado:
          config?.estado || "-",

        cep:
          config?.cep || "-",

        responsavelNome: config?.responsavelNome || "-",
        responsavelCargo: config?.responsavelCargo || "-",
        cidadeAssinatura: config?.cidadeAssinatura || config?.cidade || "-",
        logoUrl:
          logoDocumentoUrl,
        modoLogo:
          modoLogo,

        logoInstituicaoId:
          templateContrato
            ?.logoInstituicaoId ||
          null,
        estiloDocumento: config?.estiloDocumento || "INSTITUCIONAL",
        assinaturaDiretorUrl: config?.certificadoAssinaturaUrl || null,
        enderecoCompleto: [
          config?.endereco,
          config?.numero,
          config?.cidade,
          config?.estado,
          config?.cep,
        ]
          .filter(Boolean)
          .join(" • "),
      },
      curso: cursoNome,
      turmas: turmasLista,
      disciplinas: disciplinasLista,
      valorContrato,
      contratoFinal,

      template: templateContrato
        ? {
          id: templateContrato.id,
          nome: templateContrato.nome,
          camposVisuais: templateContrato.camposVisuais || [],
        }
        : null,

      camposVisuais: templateContrato?.camposVisuais || [],

      observacoesContrato: config?.observacoesContrato || "",
    });
  } catch (error: any) {
    console.error("Erro ao gerar contrato:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar contrato" },
      { status: 500 }
    );
  }
}