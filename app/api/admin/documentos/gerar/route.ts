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

function listarTagsNaoResolvidas(
  conteudo: string
) {
  const tags = Array.from(
    String(conteudo || "").matchAll(
      /{{\s*([^{}]+?)\s*}}/g
    )
  ).map((resultado) =>
    String(resultado[1] || "").trim()
  );

  return Array.from(
    new Set(tags)
  );
}

function calcularIdadeAluno(
  dataNascimento?: Date | string | null
) {
  if (!dataNascimento) {
    return null;
  }

  const nascimento =
    new Date(dataNascimento);

  if (
    Number.isNaN(
      nascimento.getTime()
    )
  ) {
    return null;
  }

  const hoje = new Date();

  let idade =
    hoje.getFullYear() -
    nascimento.getFullYear();

  const aniversarioAindaNaoOcorreu =
    hoje.getMonth() <
      nascimento.getMonth() ||
    (hoje.getMonth() ===
      nascimento.getMonth() &&
      hoje.getDate() <
        nascimento.getDate());

  if (aniversarioAindaNaoOcorreu) {
    idade -= 1;
  }

  return idade;
}

function gerarCodigoValidacaoDocumento(
  documentoId: number,
  criadoEm: Date
) {
  const ano =
    criadoEm.getFullYear();

  const mes = String(
    criadoEm.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    criadoEm.getDate()
  ).padStart(2, "0");

  const hora = String(
    criadoEm.getHours()
  ).padStart(2, "0");

  const minuto = String(
    criadoEm.getMinutes()
  ).padStart(2, "0");

  return `PHANYX-${ano}${mes}${dia}-${documentoId}-${hora}${minuto}`;
}

function juntarPartes(partes: Array<string | null | undefined>, separador = " ") {
  return partes.filter((p) => p && String(p).trim()).join(separador);
}

function montarEndereco(dados?: any) {
  const ruaNumero = juntarPartes([dados?.endereco, dados?.numero], ", ");
  const cidadeEstado = juntarPartes([dados?.cidade, dados?.estado], " - ");

  return [
    ruaNumero,
    dados?.bairro,
    cidadeEstado,
    dados?.cep ? `CEP: ${dados.cep}` : "",
  ]
    .filter(Boolean)
    .join("\n") || "-";
}

function montarBlocoInstituicao(config?: any) {
  return [
    config?.nomeFantasia || "Instituição",
    config?.cnpj ? `CNPJ: ${config.cnpj}` : "",
    montarEndereco(config),
    config?.telefone ? `Telefone: ${config.telefone}` : "",
    config?.email ? `E-mail: ${config.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function montarBlocoPolo(polo?: any) {
  if (!polo) return "-";

  return [
    polo?.nome || "Polo",
    montarEndereco(polo),
    polo?.telefone ? `Telefone: ${polo.telefone}` : "",
    polo?.email ? `E-mail: ${polo.email}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const templateId = Number(body?.templateId);
    const alunoId = body?.alunoId ? Number(body.alunoId) : null;
    const matriculaId = body?.matriculaId ? Number(body.matriculaId) : null;
    const tituloPersonalizado = body?.titulo
      ? String(body.titulo).trim()
      : null;

    if (!Number.isFinite(templateId) || templateId <= 0) {
      return NextResponse.json(
        { error: "Template inválido" },
        { status: 400 }
      );
    }

    const template = await prisma.documentoTemplate.findFirst({
      where: {
        id: templateId,
        instituicaoId: user.instituicaoId,
        ativo: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado" },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    let aluno = null as any;
    let matricula = null as any;
    let cursoNome = "Curso não informado";
    let disciplinasLista: string[] = [];
    let valorContrato = 0;

    if (matriculaId && Number.isFinite(matriculaId) && matriculaId > 0) {
      matricula = await prisma.matricula.findFirst({
        where: {
          id: matriculaId,
          instituicaoId: user.instituicaoId,
        },
        include: {
  aluno: {
  include: {
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
          lancamentosFinanceiros: true,
        },
      });

      if (!matricula) {
        return NextResponse.json(
          { error: "Matrícula não encontrada" },
          { status: 404 }
        );
      }

      aluno = matricula.aluno;

      cursoNome =
        matricula.curso?.nome?.trim() || "Curso não informado";

      disciplinasLista = Array.from(
  new Set(
    matricula.itens
      .map((item) => item.disciplina?.nome?.trim())
      .filter(Boolean) as string[]
  )
);

      valorContrato = matricula.lancamentosFinanceiros.reduce(
  (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
  0
);

if (!valorContrato || valorContrato <= 0) {
  valorContrato = Number(matricula.valorMatricula || 0);
}
    } else if (alunoId && Number.isFinite(alunoId) && alunoId > 0) {
      aluno = await prisma.aluno.findFirst({
  where: {
    id: alunoId,
    instituicaoId: user.instituicaoId,
  },
  include: {
  polo: true,

  user: {
    select: {
      email: true,
    },
  },
},
});

      if (!aluno) {
        return NextResponse.json(
          { error: "Aluno não encontrado" },
          { status: 404 }
        );
      }
    }

    const polo =
  aluno?.polo || null;

const nomeUnidadeDocumento =
  polo?.nome?.trim() ||
  config?.nomeUnidadePrincipal?.trim() ||
  (config?.cidade?.trim()
    ? `SEDE - ${config.cidade.trim()}`
    : "SEDE");

const dadosUnidadeDocumento =
  polo || config;

const agora =
  new Date();

const idadeAluno =
  calcularIdadeAluno(
    aluno?.dataNascimento
  );

const alunoMenor =
  idadeAluno !== null &&
  idadeAluno < 18;

const nomeTitularContrato =
  alunoMenor
    ? aluno?.nomeResponsavel || "-"
    : aluno?.nome || "-";

const cpfTitularContrato =
  alunoMenor
    ? aluno?.cpfResponsavel || "-"
    : aluno?.cpf || "-";

const emailTitularContrato =
  alunoMenor
    ? aluno?.emailResponsavel || "-"
    : aluno?.user?.email || "-";

const telefoneTitularContrato =
  alunoMenor
    ? aluno?.telefoneResponsavel || "-"
    : aluno?.telefone || "-";

const parentescoTitularContrato =
  alunoMenor
    ? aluno?.parentescoResponsavel ||
      "Responsável legal"
    : "O próprio aluno";

const tipoTitularContrato =
  alunoMenor
    ? "Responsável legal"
    : "O próprio aluno";

const nomeInstituicao =
  config?.nomeFantasia ||
  "Instituição";

const nomeDiretor =
  config?.responsavelNome ||
  "-";

const cargoDiretor =
  config?.responsavelCargo ||
  "Responsável legal";

const blocoAssinaturaDiretor = [
  "____________________________________________",
  nomeDiretor,
  `${cargoDiretor} • ${nomeInstituicao}`,
  config?.cnpj
    ? `CNPJ: ${config.cnpj}`
    : "",
]
  .filter(Boolean)
  .join("\n");

const documento =
  await prisma.$transaction(
    async (tx) => {
      const documentoInicial =
        await tx.documentoGerado.create({
          data: {
            titulo:
              tituloPersonalizado ||
              template.nome,

            tipo:
              template.tipo,

            contexto:
              template.contexto,

            conteudo: "",

            status:
              "GERADO",

            exigeAssinatura:
              template.exigeAssinatura,

            instituicaoId:
              user.instituicaoId,

            alunoId:
              aluno?.id || null,

            matriculaId:
              matricula?.id || null,

            templateId:
              template.id,
          },
        });

      const codigoValidacao =
        gerarCodigoValidacaoDocumento(
          documentoInicial.id,
          documentoInicial.criadoEm
        );

      const urlAtual =
        new URL(req.url);

      const origem =
        `${urlAtual.protocol}//${urlAtual.host}`;

      const urlValidacao =
        `${origem}/validar-documento?codigo=${encodeURIComponent(
          codigoValidacao
        )}`;

      const numeroDocumento =
        `DOC-${agora.getFullYear()}-${String(
          documentoInicial.id
        ).padStart(6, "0")}`;

      const valoresTemplate: Record<
        string,
        string
      > = {
        logoInstituicao: "",

        nomeInstituicao,

        cnpjInstituicao:
          config?.cnpj || "-",

        enderecoInstituicao:
          montarEndereco(config),

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

        blocoInstituicao:
          montarBlocoInstituicao(
            config
          ),

        nomePolo:
  nomeUnidadeDocumento,

enderecoPolo:
  montarEndereco(
    dadosUnidadeDocumento
  ),

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

blocoPolo: [
  nomeUnidadeDocumento,
  montarEndereco(
    dadosUnidadeDocumento
  ),
  dadosUnidadeDocumento?.telefone
    ? `Telefone: ${dadosUnidadeDocumento.telefone}`
    : "",
  dadosUnidadeDocumento?.email
    ? `E-mail: ${dadosUnidadeDocumento.email}`
    : "",
]
  .filter(Boolean)
  .join("\n"),
  
        responsavelLegal:
          nomeDiretor,

        nomeAluno:
          aluno?.nome || "-",

        cpfAluno:
          aluno?.cpf || "-",

        matriculaAluno:
          aluno?.matricula || "-",

        numeroMatricula:
          aluno?.matricula || "-",

        statusAluno:
          aluno?.statusAluno || "-",

        curso:
          cursoNome,

        statusMatricula:
          matricula?.status || "-",

        dataInicioAluno:
          matricula?.createdAt
            ? new Date(
                matricula.createdAt
              ).toLocaleDateString(
                "pt-BR"
              )
            : "-",

        dataMatricula:
          matricula?.createdAt
            ? new Date(
                matricula.createdAt
              ).toLocaleDateString(
                "pt-BR"
              )
            : "-",

        dataConclusao:
          (matricula as any)
            ?.dataConclusao
            ? new Date(
                (matricula as any)
                  .dataConclusao
              ).toLocaleDateString(
                "pt-BR"
              )
            : "-",

        dataConclusaoAluno:
          (matricula as any)
            ?.dataConclusao
            ? new Date(
                (matricula as any)
                  .dataConclusao
              ).toLocaleDateString(
                "pt-BR"
              )
            : "-",

        semestreAtual:
          matricula?.semestre !==
            null &&
          matricula?.semestre !==
            undefined
            ? String(
                matricula.semestre
              )
            : "-",

        cargaHorariaCurso:
          (matricula?.curso as any)
            ?.cargaHoraria
            ? `${(matricula?.curso as any).cargaHoraria}h`
            : "-",

        cargaHorariaMinimaCurso:
          (matricula?.curso as any)
            ?.cargaHorariaMinima
            ? `${(matricula?.curso as any).cargaHorariaMinima}h`
            : "-",

        cargaHorariaMaximaCurso:
          (matricula?.curso as any)
            ?.cargaHorariaMaxima
            ? `${(matricula?.curso as any).cargaHorariaMaxima}h`
            : "-",

        percentualConclusao:
          (matricula as any)
            ?.percentualConclusao !==
            null &&
          (matricula as any)
            ?.percentualConclusao !==
            undefined
            ? `${(matricula as any).percentualConclusao}%`
            : "-",

        disciplinas:
          disciplinasLista.length > 0
            ? disciplinasLista
                .map(
                  (disciplina) =>
                    `- ${disciplina}`
                )
                .join("\n")
            : "- Não informado",

        valorContrato:
          formatarMoeda(
            valorContrato
          ),

        nomeTitularContrato,

        cpfTitularContrato,

        emailTitularContrato,

        telefoneTitularContrato,

        parentescoTitularContrato,

        tipoTitularContrato,

        assinaturaDiretor: "",

        blocoAssinaturaDiretor,

        cidadeAssinatura:
          config?.cidadeAssinatura ||
          config?.cidade ||
          "-",

        dataAtual:
          agora.toLocaleDateString(
            "pt-BR"
          ),

        referenciaFinanceira:
          "Pagamento institucional",

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

        codigoValidacao,

        urlValidacao,

        tituloDocumento:
          tituloPersonalizado ||
          template.nome,
      };

      const conteudoFinal =
        substituirTemplate(
          template.conteudo,
          valoresTemplate
        );

      const tagsNaoResolvidas =
        listarTagsNaoResolvidas(
          conteudoFinal
        );

      if (
        tagsNaoResolvidas.length > 0
      ) {
        throw new Error(
          `Variáveis sem valor no template: ${tagsNaoResolvidas
            .map(
              (tag) =>
                `{{${tag}}}`
            )
            .join(", ")}`
        );
      }

      return tx.documentoGerado.update({
        where: {
          id: documentoInicial.id,
        },

        data: {
          conteudo:
            conteudoFinal,

          codigoValidacao,
        },
      });
    }
  );

    return NextResponse.json({
      id: documento.id,
      titulo: documento.titulo,
      tipo: documento.tipo,
      contexto: documento.contexto,
      status: documento.status,
      exigeAssinatura: documento.exigeAssinatura,
      aluno: aluno
        ? {
            id: aluno.id,
            nome: aluno.nome,
            matricula: aluno.matricula,
          }
        : null,
      matricula: matricula
        ? {
            id: matricula.id,
            status: matricula.status,
            semestre: matricula.semestre,
          }
        : null,
      conteudo: documento.conteudo,
    });
    } catch (error: any) {
    console.error(
      "Erro ao gerar documento:",
      error
    );

    const mensagem =
      String(
        error?.message || ""
      );

    if (
      mensagem.startsWith(
        "Variáveis sem valor no template:"
      )
    ) {
      return NextResponse.json(
        {
          error: mensagem,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error:
          mensagem ||
          "Erro ao gerar documento",
      },
      {
        status: 500,
      }
    );
  }
}