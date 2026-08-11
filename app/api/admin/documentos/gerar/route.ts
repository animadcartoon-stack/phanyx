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

function extrairTagsTemplate(
  conteudo?: string | null
) {
  const tags = Array.from(
    String(conteudo || "").matchAll(
      /{{\s*([^{}]+?)\s*}}/g
    )
  ).map((resultado) =>
    String(resultado[1] || "").trim()
  );

  return Array.from(new Set(tags));
}

function converterMoedaParaNumero(
  valor: unknown
) {
  if (
    typeof valor === "number"
  ) {
    return Number.isFinite(valor)
      ? valor
      : null;
  }

  const texto = String(
    valor ?? ""
  )
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s/g, "");

  if (!texto) {
    return null;
  }

  let normalizado = texto;

  if (
    normalizado.includes(".") &&
    normalizado.includes(",")
  ) {
    normalizado = normalizado
      .replace(/\./g, "")
      .replace(",", ".");
  } else if (
    normalizado.includes(",")
  ) {
    normalizado =
      normalizado.replace(",", ".");
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function formatarDataInformada(
  valor: unknown
) {
  const texto =
    String(valor ?? "").trim();

  if (!texto) {
    return "";
  }

  const data = new Date(
    `${texto.slice(0, 10)}T12:00:00`
  );

  if (
    Number.isNaN(data.getTime())
  ) {
    return texto;
  }

  return data.toLocaleDateString(
    "pt-BR"
  );
}

const UNIDADES_EXTENSO = [
  "",
  "um",
  "dois",
  "três",
  "quatro",
  "cinco",
  "seis",
  "sete",
  "oito",
  "nove",
];

const ESPECIAIS_EXTENSO = [
  "dez",
  "onze",
  "doze",
  "treze",
  "quatorze",
  "quinze",
  "dezesseis",
  "dezessete",
  "dezoito",
  "dezenove",
];

const DEZENAS_EXTENSO = [
  "",
  "",
  "vinte",
  "trinta",
  "quarenta",
  "cinquenta",
  "sessenta",
  "setenta",
  "oitenta",
  "noventa",
];

const CENTENAS_EXTENSO = [
  "",
  "cento",
  "duzentos",
  "trezentos",
  "quatrocentos",
  "quinhentos",
  "seiscentos",
  "setecentos",
  "oitocentos",
  "novecentos",
];

function numeroAte999PorExtenso(
  numero: number
): string {
  const valor =
    Math.trunc(numero);

  if (valor === 0) {
    return "";
  }

  if (valor === 100) {
    return "cem";
  }

  const centenas =
    Math.floor(valor / 100);

  const restoCentenas =
    valor % 100;

  const partes: string[] = [];

  if (centenas > 0) {
    partes.push(
      CENTENAS_EXTENSO[
      centenas
      ]
    );
  }

  if (restoCentenas > 0) {
    if (partes.length > 0) {
      partes.push("e");
    }

    if (
      restoCentenas >= 10 &&
      restoCentenas <= 19
    ) {
      partes.push(
        ESPECIAIS_EXTENSO[
        restoCentenas - 10
        ]
      );
    } else {
      const dezenas =
        Math.floor(
          restoCentenas / 10
        );

      const unidades =
        restoCentenas % 10;

      if (dezenas > 0) {
        partes.push(
          DEZENAS_EXTENSO[
          dezenas
          ]
        );
      }

      if (unidades > 0) {
        if (dezenas > 0) {
          partes.push("e");
        }

        partes.push(
          UNIDADES_EXTENSO[
          unidades
          ]
        );
      }
    }
  }

  return partes.join(" ");
}

function numeroInteiroPorExtenso(
  numero: number
): string {
  let restante =
    Math.max(
      0,
      Math.trunc(numero)
    );

  if (restante === 0) {
    return "zero";
  }

  const partes: string[] = [];

  const escalas = [
    {
      valor: 1_000_000_000,
      singular: "bilhão",
      plural: "bilhões",
    },
    {
      valor: 1_000_000,
      singular: "milhão",
      plural: "milhões",
    },
    {
      valor: 1_000,
      singular: "mil",
      plural: "mil",
    },
  ];

  for (
    const escala of escalas
  ) {
    const quantidade =
      Math.floor(
        restante /
        escala.valor
      );

    if (quantidade <= 0) {
      continue;
    }

    if (
      escala.valor === 1_000 &&
      quantidade === 1
    ) {
      partes.push("mil");
    } else {
      partes.push(
        `${numeroAte999PorExtenso(
          quantidade
        )} ${quantidade === 1
          ? escala.singular
          : escala.plural
        }`
      );
    }

    restante %=
      escala.valor;
  }

  if (restante > 0) {
    const usarConjuncao =
      partes.length > 0 &&
      restante < 100;

    if (usarConjuncao) {
      partes.push("e");
    }

    partes.push(
      numeroAte999PorExtenso(
        restante
      )
    );
  }

  return partes.join(" ");
}

function valorMonetarioPorExtenso(
  valor: number
) {
  const negativo =
    valor < 0;

  const absoluto =
    Math.abs(valor);

  let reais =
    Math.floor(absoluto);

  let centavos =
    Math.round(
      (absoluto - reais) *
      100
    );

  if (centavos === 100) {
    reais += 1;
    centavos = 0;
  }

  const partes: string[] = [];

  partes.push(
    `${reais === 1
      ? "um real"
      : `${numeroInteiroPorExtenso(
        reais
      )} reais`
    }`
  );

  if (centavos > 0) {
    partes.push(
      centavos === 1
        ? "um centavo"
        : `${numeroInteiroPorExtenso(
          centavos
        )} centavos`
    );
  }

  return `${negativo ? "menos " : ""}${partes.join(
    " e "
  )}`;
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

    const funcionarioId =
      body?.funcionarioId
        ? Number(body.funcionarioId)
        : null;

    const professorId =
      body?.professorId
        ? Number(body.professorId)
        : null;

    const tituloPersonalizado = body?.titulo
      ? String(body.titulo).trim()
      : null;

    const dadosPreenchimentoRecebidos =
      body?.dadosPreenchimento &&
        typeof body.dadosPreenchimento ===
        "object" &&
        !Array.isArray(
          body.dadosPreenchimento
        )
        ? body.dadosPreenchimento
        : {};

    const formatoImpressao =
      body?.formatoImpressao ===
        "DUAS_VIAS_A4"
        ? "DUAS_VIAS_A4"
        : "A4_INTEIRA";

    const quantidadeVias =
      formatoImpressao ===
        "DUAS_VIAS_A4"
        ? 2
        : 1;

    const valorEnviadoSeparadamente =
      converterMoedaParaNumero(
        body?.valor
      );

    const valorDosCampos =
      converterMoedaParaNumero(
        dadosPreenchimentoRecebidos
          ?.valorDocumento ??
        dadosPreenchimentoRecebidos
          ?.valorRecebido ??
        dadosPreenchimentoRecebidos
          ?.valor
      );

    const valorInformado =
      valorEnviadoSeparadamente ??
      valorDosCampos;

    if (
      valorInformado !== null &&
      (!Number.isFinite(valorInformado) ||
        valorInformado < 0)
    ) {
      return NextResponse.json(
        {
          error: "O valor informado é inválido.",
        },
        {
          status: 400,
        }
      );
    }

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

    const tagsDoTemplate =
      new Set(
        extrairTagsTemplate(
          template.conteudo
        )
      );

    const dadosPreenchimento:
      Record<string, string> = {};

    for (
      const [chave, valor]
      of Object.entries(
        dadosPreenchimentoRecebidos
      )
    ) {
      /*
       * Só aceita campos que realmente
       * existem como tags no template.
       */
      if (
        !tagsDoTemplate.has(chave)
      ) {
        continue;
      }

      dadosPreenchimento[chave] =
        String(valor ?? "")
          .trim()
          .slice(0, 20000);
    }

    if (
      valorInformado !== null
    ) {
      const valorFormatado =
        formatarMoeda(
          valorInformado
        );

      if (
        tagsDoTemplate.has(
          "valorDocumento"
        )
      ) {
        dadosPreenchimento
          .valorDocumento =
          valorFormatado;
      }

      if (
        tagsDoTemplate.has(
          "valorRecebido"
        )
      ) {
        dadosPreenchimento
          .valorRecebido =
          valorFormatado;
      }

      if (
        tagsDoTemplate.has(
          "valor"
        )
      ) {
        dadosPreenchimento.valor =
          valorFormatado;
      }

      if (
        tagsDoTemplate.has(
          "valorPorExtenso"
        )
      ) {
        dadosPreenchimento
          .valorPorExtenso =
          valorMonetarioPorExtenso(
            valorInformado
          );
      }
    }

    if (
      dadosPreenchimento
        .dataPagamento
    ) {
      dadosPreenchimento
        .dataPagamento =
        formatarDataInformada(
          dadosPreenchimento
            .dataPagamento
        );
    }

    const tipoTemplateNormalizado =
      String(
        template.tipo || ""
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase()
        .trim();

    const contextoTemplateNormalizado =
      String(
        template.contexto || ""
      )
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        )
        .toLowerCase()
        .trim();

    const ehContratoAcademico =
      tipoTemplateNormalizado ===
      "contrato";

    const ehDocumentoFuncionario =
      contextoTemplateNormalizado ===
      "funcionario" ||
      contextoTemplateNormalizado ===
      "professor" ||
      contextoTemplateNormalizado ===
      "rh";

    if (
      ehContratoAcademico &&
      !matriculaId
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione a matrícula correspondente antes de gerar o contrato acadêmico.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ehDocumentoFuncionario &&
      !funcionarioId &&
      !professorId
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione o funcionário ou professor para emitir este documento.",
        },
        {
          status: 400,
        }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    let aluno = null as any;
    let matricula = null as any;
    let funcionario = null as any;
    let professor = null as any;
    let cursoNome = "Curso não informado";
    let disciplinasLista: string[] = [];
    let valorContrato =
      valorInformado ?? 0;

    if (
      ehDocumentoFuncionario
    ) {
      if (
        funcionarioId &&
        Number.isFinite(funcionarioId) &&
        funcionarioId > 0
      ) {
        funcionario =
          await prisma.funcionario.findFirst({
            where: {
              id: funcionarioId,
              instituicaoId:
                user.instituicaoId,
              ativo: true,
            },

            include: {
              departamento: true,

              user: {
                select: {
                  email: true,
                },
              },
            },
          });

        if (!funcionario) {
          return NextResponse.json(
            {
              error:
                "Funcionário não encontrado nesta instituição.",
            },
            {
              status: 404,
            }
          );
        }
      } else if (
        professorId &&
        Number.isFinite(professorId) &&
        professorId > 0
      ) {
        professor =
          await prisma.professor.findFirst({
            where: {
              id: professorId,
              instituicaoId:
                user.instituicaoId,
            },

            include: {
              user: {
                select: {
                  email: true,
                },
              },

              funcionario: {
                include: {
                  departamento: true,

                  user: {
                    select: {
                      email: true,
                    },
                  },
                },
              },
            },
          });

        if (!professor) {
          return NextResponse.json(
            {
              error:
                "Professor não encontrado nesta instituição.",
            },
            {
              status: 404,
            }
          );
        }

        if (!professor.funcionario) {
          return NextResponse.json(
            {
              error:
                "Este professor ainda não possui vínculo com o RH. Vincule-o como funcionário antes de emitir documentos trabalhistas.",
            },
            {
              status: 400,
            }
          );
        }

        funcionario =
          professor.funcionario;
      }
    }

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

      if (valorInformado === null) {
        valorContrato = matricula.lancamentosFinanceiros.reduce(
          (acc, item) => acc + Number(item.valorFinal ?? item.valorOriginal ?? 0),
          0
        );

        if (!valorContrato || valorContrato <= 0) {
          valorContrato = Number(matricula.valorMatricula || 0);
        }
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

    const marcadorAssinaturaDiretor =
      "__PHANYX_ASSINATURA_DIRETOR__";

    const marcadorBlocoAssinaturaDiretor =
      "__PHANYX_BLOCO_ASSINATURA_DIRETOR__";

    const numeroMatriculaDocumento =
      matricula?.numeroMatricula ||
      aluno?.matricula ||
      "-";

    const documento =
      await prisma.$transaction(
        async (tx) => {
          const documentoInicial =
            await tx.documentoGerado.create({
              data: {
                titulo:
                  tituloPersonalizado
                    ? `${template.nome} — ${tituloPersonalizado}`
                    : template.nome,

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

                dadosPreenchimento: {
                  ...dadosPreenchimento,

                  __phanyxCamposVisuais:
                    Array.isArray(
                      template.camposVisuais
                    )
                      ? template.camposVisuais
                      : [],
                } as any,

                formatoImpressao,

                quantidadeVias,
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
            ...dadosPreenchimento,

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

            nomeFuncionario:
              funcionario?.nome || "-",

            funcionarioNome:
              funcionario?.nome || "-",

            cpfFuncionario:
              funcionario?.cpf || "-",

            funcionarioCpf:
              funcionario?.cpf || "-",

            rgFuncionario:
              funcionario?.rg || "-",

            funcionarioRg:
              funcionario?.rg || "-",

            telefoneFuncionario:
              funcionario?.telefone || "-",

            emailFuncionario:
              funcionario?.user?.email ||
              professor?.user?.email ||
              "-",

            codigoFuncionario:
              funcionario?.codigoFuncionario ||
              "-",

            pisPasepFuncionario:
              funcionario?.pisPasep || "-",

            cargoFuncionario:
              funcionario?.cargo || "-",

            funcionarioCargo:
              funcionario?.cargo || "-",

            departamentoFuncionario:
              funcionario?.departamento?.nome ||
              funcionario?.setor ||
              "-",

            funcionarioDepartamento:
              funcionario?.departamento?.nome ||
              funcionario?.setor ||
              "-",

            dataAdmissaoFuncionario:
              funcionario?.dataAdmissao
                ? new Date(
                  funcionario.dataAdmissao
                ).toLocaleDateString(
                  "pt-BR"
                )
                : "-",

            funcionarioDataAdmissao:
              funcionario?.dataAdmissao
                ? new Date(
                  funcionario.dataAdmissao
                ).toLocaleDateString(
                  "pt-BR"
                )
                : "-",

            tipoContratoFuncionario:
              funcionario?.tipoContrato ||
              "-",

            cargaHorariaMensalFuncionario:
              funcionario?.cargaHorariaMensal !==
                null &&
                funcionario?.cargaHorariaMensal !==
                undefined
                ? `${funcionario.cargaHorariaMensal}h`
                : "-",

            salarioBaseFuncionario:
              funcionario?.salarioBase !==
                null &&
                funcionario?.salarioBase !==
                undefined
                ? formatarMoeda(
                  Number(
                    funcionario.salarioBase
                  )
                )
                : "-",

            funcionarioSalario:
              funcionario?.salarioBase !==
                null &&
                funcionario?.salarioBase !==
                undefined
                ? formatarMoeda(
                  Number(
                    funcionario.salarioBase
                  )
                )
                : "-",

            statusFuncionario:
              funcionario?.statusFuncionario ||
              "-",

            jornadaTrabalhoFuncionario:
              funcionario?.jornadaTrabalho ||
              "-",

            nomeProfessor:
              professor?.nome ||
              funcionario?.nome ||
              "-",

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
              numeroMatriculaDocumento,

            numeroMatricula:
              numeroMatriculaDocumento,

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

            valor:
              dadosPreenchimento.valor ||
              formatarMoeda(
                valorContrato
              ),

            valorRecebido:
              dadosPreenchimento
                .valorRecebido ||
              formatarMoeda(
                valorContrato
              ),

            valorDocumento:
              dadosPreenchimento
                .valorDocumento ||
              formatarMoeda(
                valorContrato
              ),

            valorPorExtenso:
              dadosPreenchimento
                .valorPorExtenso ||
              valorMonetarioPorExtenso(
                valorContrato
              ),

            nomeTitularContrato,

            cpfTitularContrato,

            emailTitularContrato,

            telefoneTitularContrato,

            parentescoTitularContrato,

            tipoTitularContrato,

            assinaturaDiretor:
              marcadorAssinaturaDiretor,

            blocoAssinaturaDiretor:
              marcadorBlocoAssinaturaDiretor,

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
              tituloPersonalizado
                ? `${template.nome} — ${tituloPersonalizado}`
                : template.nome,
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

      dadosPreenchimento:
        documento.dadosPreenchimento,

      formatoImpressao:
        documento.formatoImpressao,

      quantidadeVias:
        documento.quantidadeVias,

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