import { prisma } from "@/lib/prisma";
import { replaceDocumentTags } from "@/lib/documentos/tags-documentos";
import { montarDadosBolsaDocumento } from "@/lib/documentos/bolsa-documento";

type BancoContrato = any;

type ParametrosContratoMatricula = {
  matriculaId: number;
  instituicaoId: number;
  db?: BancoContrato;
};

function formatarMoedaContrato(
  valor: number
) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
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
    .join(" \u2022 ") || "-";
}

function calcularIdadeContrato(
  dataNascimento?:
    | Date
    | string
    | null
) {
  if (!dataNascimento) {
    return null;
  }

  const nascimento =
    new Date(
      dataNascimento
    );

  if (
    Number.isNaN(
      nascimento.getTime()
    )
  ) {
    return null;
  }

  const hoje =
    new Date();

  let idade =
    hoje.getFullYear() -
    nascimento.getFullYear();

  const aindaNaoFezAniversario =
    hoje.getMonth() <
      nascimento.getMonth() ||
    (
      hoje.getMonth() ===
        nascimento.getMonth() &&
      hoje.getDate() <
        nascimento.getDate()
    );

  if (
    aindaNaoFezAniversario
  ) {
    idade -= 1;
  }

  return idade;
}

export function obterTitularContrato(
  aluno: any
) {
  const idade =
    calcularIdadeContrato(
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
        "Respons\u00e1vel legal",

      tipo:
        "Respons\u00e1vel legal",
    };
  }

  return {
    nome:
      aluno?.nome ||
      "-",

    cpf:
      aluno?.cpf ||
      "-",

    email:
      aluno?.user?.email ||
      "-",

    telefone:
      aluno?.telefone ||
      "-",

    parentesco:
      "O pr\u00f3prio aluno",

    tipo:
      "O pr\u00f3prio aluno",
  };
}

export async function montarContratoMatricula(
  params: ParametrosContratoMatricula
) {
  const {
    matriculaId,
    instituicaoId,
    db = prisma,
  } = params;

  const matricula =
    await db.matricula.findFirst({
      where: {
        id: matriculaId,
        instituicaoId,
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
              in: [
                "PENDENTE",
                "PARCIAL",
                "PAGO",
                "ATRASADO",
              ] as any,
            },
          },
        },
      },
    });

  if (!matricula) {
    throw new Error(
      "Matr\u00edcula n\u00e3o encontrada para gera\u00e7\u00e3o do contrato."
    );
  }

  const config =
    await db.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId,
      },
    });

  const templateContrato =
    await db.documentoTemplate.findFirst({
      where: {
        instituicaoId,
        tipo: "CONTRATO",
        ativo: true,

        OR: [
          {
            contexto:
              "MATRICULA",
          },
          {
            contexto:
              "Matr\u00edcula",
          },
          {
            contexto:
              "matricula",
          },
          {
            contexto: null,
          },
        ],
      },

      orderBy: {
        atualizadoEm: "desc",
      },
    });

  const disciplinasLista =
    matricula.itens
      .map(
        (item: any) => {
          const disciplinaNome =
            item.disciplina
              ?.nome
              ?.trim();

          const turmaNome =
            item.turma
              ?.nome
              ?.trim();

          if (
            !disciplinaNome
          ) {
            return null;
          }

          return turmaNome
            ? `${disciplinaNome} \u2014 Turma ${turmaNome}`
            : disciplinaNome;
        }
      )
      .filter(Boolean) as string[];

  const turmasLista =
    Array.from(
      new Set(
        matricula.itens
          .map(
            (item: any) =>
              item.turma
                ?.nome
                ?.trim()
          )
          .filter(Boolean) as string[]
      )
    );

  const cursoNome =
    matricula.curso
      ?.nome
      ?.trim() ||
    (
      turmasLista.length > 0
        ? turmasLista.join(", ")
        : "Curso n\u00e3o informado"
    );

  const disciplinasTexto =
    disciplinasLista.length > 0
      ? disciplinasLista
          .map(
            (disciplina) =>
              `- ${disciplina}`
          )
          .join("\n")
      : "- N\u00e3o informado";

  const valorLancamentos =
    matricula.lancamentosFinanceiros.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        Number(
          item.valorFinal ??
          item.valorOriginal ??
          0
        ),
      0
    );

  const valorContrato =
    valorLancamentos ||
    Number(
      matricula.valorMatricula ||
      0
    ) ||
    Number(
      matricula.valorMensalidade ||
      0
    ) ||
    0;

  const template =
    templateContrato?.conteudo ||
    config?.contratoTemplate ||
    `CONTRATO DE PRESTA\u00c7\u00c3O DE SERVI\u00c7OS EDUCACIONAIS

A institui\u00e7\u00e3o {{nomeInstituicao}}, inscrita no CNPJ {{cnpjInstituicao}}, neste ato representada por {{responsavelLegal}}, celebra contrato com o(a) aluno(a) {{nomeAluno}}, CPF {{cpfAluno}}, matr\u00edcula {{matriculaAluno}}, para o curso {{curso}}.

Disciplinas contratadas:
{{disciplinas}}

Valor contratado:
{{valorContrato}}

{{textoBolsaContrato}}

E por estarem de pleno acordo, firmam o presente contrato.

{{cidadeAssinatura}}, {{dataAtual}}.`;

  let numeroMatriculaOficial =
    matricula.numeroMatricula ||
    matricula.aluno?.matricula ||
    "";

  if (
    !numeroMatriculaOficial
  ) {
    numeroMatriculaOficial =
      String(
        matricula.id
      ).padStart(
        8,
        "0"
      );

    await db.matricula.update({
      where: {
        id:
          matricula.id,
      },

      data: {
        numeroMatricula:
          numeroMatriculaOficial,
      },
    });
  }

  const titularContrato =
    obterTitularContrato(
      matricula.aluno
    );

  const agora =
    new Date();

  const polo =
    matricula.aluno
      ?.polo ||
    null;

  const nomeUnidadeDocumento =
    polo?.nome?.trim() ||
    config?.nomeUnidadePrincipal?.trim() ||
    (
      config?.cidade?.trim()
        ? `SEDE - ${config.cidade.trim()}`
        : "SEDE"
    );

  const dadosUnidadeDocumento =
    polo ||
    config;

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
      matricula.curso
        ?.cargaHoraria ||
      0
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
            ?.cargaHoraria ||
          0
        ),
      0
    );

  const cargaHorariaCurso =
    cargaHorariaCursoCadastrada ||
    cargaHorariaDisciplinas;

  const numeroDocumento =
    `CONTRATO-${agora.getFullYear()}-${String(
      matricula.id
    ).padStart(
      6,
      "0"
    )}`;

  const dadosBolsaDocumento =
    montarDadosBolsaDocumento(
      matricula
    );

  const valores = {
    ...dadosBolsaDocumento,

    logoInstituicao: "",

    nomeInstituicao:
      config?.nomeFantasia ||
      matricula.aluno
        ?.instituicao
        ?.nome ||
      "Institui\u00e7\u00e3o",

    cnpjInstituicao:
      config?.cnpj ||
      "-",

    enderecoInstituicao,

    telefoneInstituicao:
      config?.telefone ||
      "-",

    emailInstituicao:
      config?.email ||
      "-",

    cidadeInstituicao:
      config?.cidade ||
      "-",

    estadoInstituicao:
      config?.estado ||
      "-",

    cepInstituicao:
      config?.cep ||
      "-",

    responsavelLegal:
      config?.responsavelNome ||
      "-",

    nomeAluno:
      matricula.aluno
        ?.nome ||
      "-",

    cpfAluno:
      matricula.aluno
        ?.cpf ||
      "-",

    matriculaAluno:
      numeroMatriculaOficial,

    numeroMatricula:
      numeroMatriculaOficial,

    statusAluno:
      matricula.aluno
        ?.statusAluno ||
      "-",

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
      matricula.status ||
      "-",

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
      dadosUnidadeDocumento
        ?.telefone ||
      "-",

    emailPolo:
      dadosUnidadeDocumento
        ?.email ||
      "-",

    cidadePolo:
      dadosUnidadeDocumento
        ?.cidade ||
      "-",

    estadoPolo:
      dadosUnidadeDocumento
        ?.estado ||
      "-",

    cepPolo:
      dadosUnidadeDocumento
        ?.cep ||
      "-",

    valorContrato:
      formatarMoedaContrato(
        valorContrato
      ),

    valorMatricula:
      formatarMoedaContrato(
        Number(
          matricula.valorMatricula ??
          matricula.curso
            ?.valorMatricula ??
          0
        )
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
  };

  const conteudo =
    replaceDocumentTags(
      template,
      valores
    );

  return {
    matricula,
    config,
    templateContrato,
    conteudo,
    valores,
    valorContrato,
    numeroMatriculaOficial,
  };
}

export async function criarContratoPendenteMatricula(
  params: ParametrosContratoMatricula
) {
  const db =
    params.db ||
    prisma;

  const dados =
    await montarContratoMatricula(
      {
        ...params,
        db,
      }
    );

  const contrato =
    await db.contrato.create({
      data: {
        alunoId:
          dados.matricula
            .alunoId,

        matriculaId:
          dados.matricula
            .id,

        instituicaoId:
          params.instituicaoId,

        conteudo:
          dados.conteudo,

        status:
          "PENDENTE",
      },
    });

  return {
    ...dados,
    contrato,
  };
}
