import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { assinaturaPermiteUso } from "@/lib/assinatura-acesso";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function carregarImagemPdf(pdfDoc: PDFDocument, url?: string | null) {
  if (!url) return null;

  try {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      console.error("Erro ao baixar imagem:", resposta.status, url);
      return null;
    }

    const contentType = resposta.headers.get("content-type") || "";
    const bytes = await resposta.arrayBuffer();

    if (contentType.includes("png")) {
      return await pdfDoc.embedPng(bytes);
    }

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      return await pdfDoc.embedJpg(bytes);
    }

    try {
      return await pdfDoc.embedPng(bytes);
    } catch {}

    try {
      return await pdfDoc.embedJpg(bytes);
    } catch {}

    console.error("Formato de imagem não suportado para PDF:", contentType, url);
    return null;
  } catch (error) {
    console.error("Erro ao carregar imagem PDF:", error);
    return null;
  }
}

function textoSeguro(valor?: string | null) {
  return valor && valor.trim() ? valor : "-";
}

function dataBR(data?: Date | string | null) {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
}

function substituirTemplate(template: string, valores: Record<string, string>) {
  let texto = template;

  for (const [chave, valor] of Object.entries(valores)) {
    texto = texto.replaceAll(`{{${chave}}}`, valor);
  }

  return texto;
}

function montarEnderecoInstituicao(config: any) {
  return [
    [config?.endereco, config?.numero].filter(Boolean).join(", "),
    [config?.cidade, config?.estado].filter(Boolean).join(" - "),
    config?.cep ? `CEP: ${config.cep}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function montarBlocoInstituicao(config: any) {
  return [
  config?.nomeFantasia || "Instituição",

  config?.cnpj
    ? `CNPJ: ${config.cnpj}`
    : "",

  [
    config?.endereco,
    config?.numero,
    config?.bairro,
    [config?.cidade, config?.estado]
      .filter(Boolean)
      .join("/")
  ]
    .filter(Boolean)
    .join(" - "),

  "",

  config?.telefone
    ? `Telefone: ${config.telefone}`
    : "",

  config?.email
    ? `E-mail: ${config.email}`
    : "",
]
  .filter((linha) => linha !== undefined)
  .join("\n");
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ALUNO") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const instituicao = await prisma.instituicao.findUnique({
      where: { id: user.instituicaoId },
      select: {
        plano: true,
        statusAssinatura: true,
        isentaPagamento: true,
      },
    });

    const podeGerar =
      planoTemRecurso(instituicao?.plano, "DOCUMENTOS_DINAMICOS") &&
      assinaturaPermiteUso(
  instituicao?.statusAssinatura,
  instituicao?.isentaPagamento
);

    if (!podeGerar) {
      return NextResponse.json(
        {
          error:
            "Histórico acadêmico em PDF está disponível a partir do Plano Profissional e exige assinatura ativa.",
        },
        { status: 403 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        userId: user.id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        polo: true,
        matriculas: {
          orderBy: [
            { updatedAt: "desc" },
            { createdAt: "desc" },
          ],
          include: {
            curso: {
              include: {
                semestres: {
                  orderBy: {
                    numero: "asc",
                  },
                  include: {
                    disciplinas: {
                      include: {
                        disciplina: true,
                      },
                    },
                  },
                },
                disciplinas: true,
              },
            },
            cursoSemestre: true,
            itens: {
              include: {
                disciplina: true,
                turma: true,
              },
            },
          },
        },
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const config = await prisma.configuracaoInstituicao.findUnique({
      where: {
        instituicaoId: user.instituicaoId,
      },
    });

    console.log("CONFIG HISTORICO COMPLETA:", config);

    /*
     * Escolhe primeiro uma matrícula realmente atual.
     * A rota anterior usava matriculas[0] sem ordenação,
     * o que podia selecionar uma matrícula antiga.
     */
    const matriculaAtual =
      aluno.matriculas.find((matricula) =>
        ["ATIVA", "A_INICIAR"].includes(
          String(matricula.status || "").toUpperCase()
        )
      ) ||
      aluno.matriculas[0] ||
      null;

    const curso =
      matriculaAtual?.curso || null;

    const itensHistorico =
      matriculaAtual?.itens || [];

    /*
     * ResultadoFinal é a fonte oficial para média,
     * frequência e situação final por turma/disciplina.
     */
    const resultadosFinais =
      await prisma.resultadoFinal.findMany({
        where: {
          alunoId: aluno.id,
          instituicaoId:
            user.instituicaoId,
        },
        orderBy: [
          { updatedAt: "desc" },
          { id: "desc" },
        ],
      });

    const resultadoPorItem =
      new Map<
        string,
        (typeof resultadosFinais)[number]
      >();

    for (const resultado of resultadosFinais) {
      const chave =
        `${resultado.turmaId}:${resultado.disciplinaId}`;

      if (!resultadoPorItem.has(chave)) {
        resultadoPorItem.set(
          chave,
          resultado
        );
      }
    }

    function obterResultadoItem(
      item: {
        turmaId: number;
        disciplinaId: number;
      }
    ) {
      return resultadoPorItem.get(
        `${item.turmaId}:${item.disciplinaId}`
      );
    }

    function statusItemUpper(
      item: {
        status?: unknown;
      }
    ) {
      return String(
        item.status || ""
      ).toUpperCase();
    }

    function itemFoiCursado(
      item: {
        turmaId: number;
        disciplinaId: number;
        status?: unknown;
      }
    ) {
      const resultado =
        obterResultadoItem(item);

      const situacaoResultado =
        String(
          resultado?.situacao || ""
        ).toUpperCase();

      if (
        situacaoResultado &&
        situacaoResultado !==
          "EM_ANDAMENTO"
      ) {
        return true;
      }

      return [
        "CONCLUIDO",
        "CONCLUIDA",
        "APROVADO",
        "APROVADA",
        "REPROVADO",
        "REPROVADA",
      ].includes(
        statusItemUpper(item)
      );
    }

    function itemFoiAprovado(
      item: {
        turmaId: number;
        disciplinaId: number;
        status?: unknown;
      }
    ) {
      const resultado =
        obterResultadoItem(item);

      const situacaoResultado =
        String(
          resultado?.situacao || ""
        ).toUpperCase();

      if (situacaoResultado) {
        return (
          situacaoResultado ===
            "APROVADO" ||
          situacaoResultado ===
            "APROVADA"
        );
      }

      return [
        "CONCLUIDO",
        "CONCLUIDA",
        "APROVADO",
        "APROVADA",
      ].includes(
        statusItemUpper(item)
      );
    }

    function formatarNumeroAcademico(
      valor?: number | null
    ) {
      if (
        valor === null ||
        valor === undefined ||
        !Number.isFinite(
          Number(valor)
        )
      ) {
        return "-";
      }

      return Number(valor).toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      );
    }

    function formatarFrequenciaAcademica(
      valor?: number | null
    ) {
      if (
        valor === null ||
        valor === undefined
      ) {
        return "-";
      }

      const numero =
        Number(valor);

      if (!Number.isFinite(numero)) {
        return "-";
      }

      return `${numero.toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }
      )}%`;
    }

    function situacaoHistoricoItem(
      item: {
        turmaId: number;
        disciplinaId: number;
        status?: unknown;
      }
    ) {
      const resultado =
        obterResultadoItem(item);

      const situacaoResultado =
        String(
          resultado?.situacao || ""
        ).toUpperCase();

      if (
        situacaoResultado ===
          "APROVADO" ||
        situacaoResultado ===
          "APROVADA"
      ) {
        return "Aprovada";
      }

      if (
        situacaoResultado ===
          "REPROVADO" ||
        situacaoResultado ===
          "REPROVADA"
      ) {
        return "Reprovada";
      }

      const status =
        statusItemUpper(item);

      if (
        status === "CONCLUIDA" ||
        status === "CONCLUIDO"
      ) {
        return "Concluída";
      }

      if (
        status === "APROVADO" ||
        status === "APROVADA"
      ) {
        return "Aprovada";
      }

      if (
        status === "REPROVADO" ||
        status === "REPROVADA"
      ) {
        return "Reprovada";
      }

      if (
        status === "CANCELADA" ||
        status === "CANCELADO"
      ) {
        return "Cancelada";
      }

      if (
        status === "DESISTENTE" ||
        status === "DESISTENCIA"
      ) {
        return "Desistência";
      }

      if (
        status === "TRANCADA" ||
        status === "TRANCADO"
      ) {
        return "Trancada";
      }

      if (
        status === "EM_CURSO" ||
        situacaoResultado ===
          "EM_ANDAMENTO"
      ) {
        return "Em curso";
      }

      return "A cursar";
    }

    /*
     * A carga total do curso vem da grade curricular,
     * não do número de itens da matrícula do aluno.
     */
    const componentesGrade =
      curso?.semestres?.length
        ? curso.semestres.flatMap(
            (semestre) =>
              semestre.disciplinas.map(
                (vinculo) =>
                  vinculo.disciplina
              )
          )
        : curso?.disciplinas || [];

    const cargaHorariaCursoCalculada =
      componentesGrade.reduce(
        (total, disciplina) =>
          total +
          Number(
            disciplina?.cargaHoraria ||
              0
          ),
        0
      );

    const cargasMinimasSemestres =
      curso?.semestres?.map(
        (semestre) =>
          semestre.cargaMinima
      ) || [];

    const cargasMaximasSemestres =
      curso?.semestres?.map(
        (semestre) =>
          semestre.cargaMaxima
      ) || [];

    const cargaHorariaMinimaCursoCalculada =
      cargasMinimasSemestres.length > 0 &&
      cargasMinimasSemestres.every(
        (valor) =>
          valor !== null &&
          valor !== undefined
      )
        ? cargasMinimasSemestres.reduce(
            (total, valor) =>
              total + Number(valor || 0),
            0
          )
        : null;

    const cargaHorariaMaximaCursoCalculada =
      cargasMaximasSemestres.length > 0 &&
      cargasMaximasSemestres.every(
        (valor) =>
          valor !== null &&
          valor !== undefined
      )
        ? cargasMaximasSemestres.reduce(
            (total, valor) =>
              total + Number(valor || 0),
            0
          )
        : null;

    const itensCursados =
      itensHistorico.filter(
        (item) =>
          itemFoiCursado(item)
      );

    const itensAprovados =
      itensHistorico.filter(
        (item) =>
          itemFoiAprovado(item)
      );

    const cargaHorariaCursada =
      itensCursados.reduce(
        (total, item) =>
          total +
          Number(
            item.disciplina
              ?.cargaHoraria || 0
          ),
        0
      );

    const cargaHorariaAprovada =
      itensAprovados.reduce(
        (total, item) =>
          total +
          Number(
            item.disciplina
              ?.cargaHoraria || 0
          ),
        0
      );

    const percentualConclusaoCalculado =
      cargaHorariaCursoCalculada > 0
        ? Math.min(
            100,
            Math.round(
              (
                cargaHorariaAprovada /
                cargaHorariaCursoCalculada
              ) * 100
            )
          )
        : null;

    const semestresCursadosCalculado =
      new Set(
        itensCursados
          .map(
            (item) =>
              item.disciplina
                ?.semestre ??
              item.turma?.semestre ??
              null
          )
          .filter(
            (valor) =>
              valor !== null &&
              valor !== undefined &&
              String(valor).trim() !== ""
          )
          .map((valor) =>
            String(valor)
          )
      ).size;

    const observacoesAcademicas =
      Array.from(
        new Set(
          resultadosFinais
            .map((resultado) =>
              String(
                resultado.observacao ||
                  ""
              ).trim()
            )
            .filter(Boolean)
        )
      );

    const numeroMatriculaHistorico =
      matriculaAtual
        ?.numeroMatricula ||
      aluno.matricula ||
      "-";

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

const logoUrlBruta =
  config?.logoUrl ||
  (config as any)?.logotipoUrl ||
  (config as any)?.logo ||
  null;

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000";

const logoUrl =
  logoUrlBruta?.startsWith("http")
    ? logoUrlBruta
    : `${baseUrl}${logoUrlBruta}`;

console.log("LOGO HISTORICO URL FINAL:", logoUrl);

const logo = await carregarImagemPdf(pdfDoc, logoUrl);

console.log("LOGO HISTORICO CARREGADA:", Boolean(logo));

const assinatura = await carregarImagemPdf(
  pdfDoc,
  config?.certificadoAssinaturaUrl
);

    const preto = rgb(0, 0, 0);
    const azul = rgb(0.02, 0.12, 0.35);
    const cinza = rgb(0.35, 0.35, 0.35);
    const cinzaClaro = rgb(0.92, 0.92, 0.92);

    const templateHistorico = await prisma.documentoTemplate.findFirst({
  where: {
    instituicaoId: user.instituicaoId,
    ativo: true,
    OR: [
      { tipo: "HISTORICO" },
      { nome: { contains: "histórico", mode: "insensitive" } },
      { nome: { contains: "historico", mode: "insensitive" } },
    ],
  },
  orderBy: {
    atualizadoEm: "desc",
  },
});

const polo =
  aluno?.polo || null;

const nomePolo =
  polo?.nome?.trim() ||
  config?.nomeUnidadePrincipal?.trim() ||
  (config?.cidade?.trim()
    ? `SEDE - ${config.cidade.trim()}`
    : "SEDE");

const dadosUnidadeDocumento =
  polo || config;

const codigoValidacao = `PHANYX-${Date.now()}-${aluno.id}`;

const valoresTemplate = {
  logoInstituicao: "{{logoInstituicao}}",
  nomeInstituicao: config?.nomeFantasia || "Instituição",
  cnpjInstituicao: config?.cnpj || "-",
  enderecoInstituicao: montarEnderecoInstituicao(config),
  telefoneInstituicao: config?.telefone || "-",
  emailInstituicao: config?.email || "-",
  cidadeInstituicao: config?.cidade || "-",
  estadoInstituicao: config?.estado || "-",
  cepInstituicao: config?.cep || "-",
  blocoInstituicao: montarBlocoInstituicao(config),

  nomePolo,

enderecoPolo:
  montarEnderecoInstituicao(
    dadosUnidadeDocumento
  ) || "-",

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
  nomePolo,
  montarEnderecoInstituicao(
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

  nomeAluno:
    aluno.nome || "-",

  cpfAluno:
    aluno.cpf || "-",

  matriculaAluno:
    numeroMatriculaHistorico,

  numeroMatricula:
    numeroMatriculaHistorico,

  statusAluno:
    aluno.statusAluno || "-",

  rgAluno:
    aluno.rg || "-",

  /*
   * Estes dados ainda não possuem campos próprios
   * com o mesmo significado no schema atual.
   */
  orgaoExpedidorAluno: "-",

  dataNascimentoAluno:
    aluno.dataNascimento
      ? new Date(
          aluno.dataNascimento
        ).toLocaleDateString(
          "pt-BR"
        )
      : "-",

  sexoAluno:
    aluno.genero || "-",

  naturalidadeAluno: "-",

  nacionalidadeAluno:
    aluno.nacionalidade || "-",

  formaIngressoAluno: "-",

  curriculoAluno: "-",

  situacaoAcademicaAluno:
    matriculaAtual?.status ||
    aluno.statusAluno ||
    "-",

  dataMatricula:
    matriculaAtual?.createdAt
      ? new Date(
          matriculaAtual.createdAt
        ).toLocaleDateString(
          "pt-BR"
        )
      : "-",

  observacoesHistorico:
    observacoesAcademicas.length > 0
      ? observacoesAcademicas.join(
          "\n"
        )
      : "-",

  legendaHistorico:
    "A cursar = disciplina ainda não concluída.",

  /*
   * Matricula não possui dataConclusao no schema.
   * Não usamos outra data como se fosse conclusão.
   */
  dataConclusao: "-",

  dataConclusaoAluno: "-",

  semestreAtual:
    matriculaAtual
      ?.cursoSemestre?.numero ??
    matriculaAtual?.semestre ??
    "-",

  cargaHorariaCurso:
    cargaHorariaCursoCalculada > 0
      ? `${cargaHorariaCursoCalculada}h`
      : "-",

  cargaHorariaMinimaCurso:
    cargaHorariaMinimaCursoCalculada !==
      null
      ? `${cargaHorariaMinimaCursoCalculada}h`
      : "-",

  cargaHorariaMaximaCurso:
    cargaHorariaMaximaCursoCalculada !==
      null
      ? `${cargaHorariaMaximaCursoCalculada}h`
      : "-",

  codigoValidacao,

  urlValidacao:
    "https://www.phanyx.com.br/validar-documento",

  curso:
    curso?.nome || "-",

  statusMatricula:
    matriculaAtual?.status || "-",

  dataAtual:
    new Date().toLocaleDateString(
      "pt-BR"
    ),

  assinaturaDiretor:
    "{{assinaturaDiretor}}",

  blocoAssinaturaDiretor:
    "{{blocoAssinaturaDiretor}}",

  disciplinasPorSemestre:
    (() => {
      if (
        itensHistorico.length === 0
      ) {
        return "-";
      }

      const grupos =
        new Map<
          string,
          typeof itensHistorico
        >();

      for (
        const item of itensHistorico
      ) {
        const semestre =
          item.disciplina
            ?.semestre ??
          item.turma?.semestre ??
          "Não informado";

        const chave =
          String(semestre);

        const lista =
          grupos.get(chave) || [];

        lista.push(item);

        grupos.set(
          chave,
          lista
        );
      }

      return Array.from(
        grupos.entries()
      )
        .sort(([a], [b]) => {
          const numeroA =
            Number(a);

          const numeroB =
            Number(b);

          if (
            Number.isFinite(
              numeroA
            ) &&
            Number.isFinite(
              numeroB
            )
          ) {
            return (
              numeroA -
              numeroB
            );
          }

          return a.localeCompare(
            b,
            "pt-BR"
          );
        })
        .map(
          ([semestre, itens]) => {
            const linhas =
              itens.map((item) => {
                const nome =
                  item.disciplina
                    ?.nome ||
                  "Disciplina";

                const carga =
                  item.disciplina
                    ?.cargaHoraria
                    ? `${item.disciplina.cargaHoraria}h`
                    : "-";

                return `- ${nome} | C.H.: ${carga} | Situação: ${situacaoHistoricoItem(
                  item
                )}`;
              });

            return [
              `Semestre ${semestre}`,
              ...linhas,
            ].join("\n");
          }
        )
        .join("\n\n");
    })(),

  haMaximaCurso:
    cargaHorariaMaximaCursoCalculada !==
      null
      ? `${cargaHorariaMaximaCursoCalculada}h`
      : "-",

  haTotalCursada:
    cargaHorariaCursada > 0
      ? `${cargaHorariaCursada}h`
      : "-",

  haTotalAprovada:
    cargaHorariaAprovada > 0
      ? `${cargaHorariaAprovada}h`
      : "-",

  percentualConclusao:
    percentualConclusaoCalculado !==
      null
      ? `${percentualConclusaoCalculado}%`
      : "-",

  semestresCursados:
    semestresCursadosCalculado > 0
      ? String(
          semestresCursadosCalculado
        )
      : "-",

  semestresRevalidados: "-",

  indiceAproveitamentoSemestral:
    "-",

  indiceAproveitamentoAcumulado:
    "-",

  indiceAproveitamentoAprovadas:
    "-",

  prazoIntegralizacao:
    curso?.quantidadeSemestres
      ? `${curso.quantidadeSemestres} semestres`
      : "-",

  provavelSemestreFormatura:
    "-",

  atoLegalCriacao: "-",

  numeroAutorizacaoCurso: "-",

  dataPublicacaoAutorizacao:
    "-",

  diarioOficialAutorizacao:
    "-",

  disciplinasBaseNacionalComum:
    "-",

  disciplinasParteDiversificada:
    "-",

  totalAulasBaseNacionalComum:
    "-",

  totalAulasParteDiversificada:
    "-",

  totalCargaHorariaAnualAulas:
    "-",

  totalCargaHorariaAnualHoras:
    "-",

  certificacaoDeclaracao:
    "-",

  escolaOrigem:
    "-",

  disciplinas:
    itensHistorico.length > 0
      ? itensHistorico
          .map(
            (item) =>
              `- ${item.disciplina?.nome || "Disciplina"}`
          )
          .join("\n")
      : "-",
};

const conteudoTemplate = substituirTemplate(
  templateHistorico?.conteudo ||
    `[CABEÇALHO INSTITUCIONAL]
{{logoInstituicao}}
{{blocoInstituicao}}

[TÍTULO]
HISTÓRICO ACADÊMICO ESCOLAR

[DADOS DO ALUNO]
Aluno(a): {{nomeAluno}}
CPF: {{cpfAluno}}
Matrícula: {{matriculaAluno}}
Status: {{statusAluno}}

[DADOS DA MATRÍCULA]
Curso: {{curso}}
Status da matrícula: {{statusMatricula}}

[COMPONENTES CURRICULARES]
{{disciplinas}}

[ASSINATURA INSTITUCIONAL]
{{blocoAssinaturaDiretor}}

[RODAPÉ]
Documento emitido em {{dataAtual}} por {{nomeInstituicao}}.`,
  valoresTemplate
);

const documentoGerado = await prisma.documentoGerado.create({
  data: {
    titulo: "Histórico Acadêmico",
    tipo: "HISTORICO",
    contexto: "MATRICULA",
    conteudo: conteudoTemplate,
    status: "ASSINADO",
    exigeAssinatura: true,
    assinadoEm: new Date(),
    instituicaoId: user.instituicaoId,
    alunoId: aluno.id,
    matriculaId: matriculaAtual?.id || null,
    templateId: templateHistorico?.id || null,
    cursoId: curso?.id || null,
    codigoValidacao,
  },
});

function novaPaginaHistorico() {
  page = pdfDoc.addPage([595.28, 841.89]);
  drawBox(35, 35, 525, 770);
  return 760;
}

    function drawBox(x: number, y: number, w: number, h: number) {
      page.drawRectangle({
        x,
        y,
        width: w,
        height: h,
        borderColor: preto,
        borderWidth: 0.8,
      });
    }

    function drawText(
      texto: string,
      x: number,
      y: number,
      size = 9,
      bold = false,
      color = preto
    ) {
      page.drawText(textoSeguro(texto), {
        x,
        y,
        size,
        font: bold ? fontBold : font,
        color,
      });
    }

    // Moldura geral
drawBox(35, 35, 525, 770);

function pegarSecao(nome: string) {
  const regex = new RegExp(
    `\\[${nome}\\]([\\s\\S]*?)(?=\\n\\[[^\\]]+\\]|$)`,
    "i"
  );

  return conteudoTemplate.match(regex)?.[1]?.trim() || "";
}

function limparTextoSecao(texto: string) {
  return texto
    .replaceAll("{{logoInstituicao}}", "")
    .replaceAll("{{assinaturaDiretor}}", "")
    .replaceAll("{{blocoAssinaturaDiretor}}", "")
    .trim();
}

function quebrarLinhas(texto: string, maxChars = 85) {
  const linhas: string[] = [];

  texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((linha) => {
      if (linha.length <= maxChars) {
        linhas.push(linha);
        return;
      }

      let resto = linha;

      while (resto.length > maxChars) {
        const corte = resto.lastIndexOf(" ", maxChars);
        const fim = corte > 20 ? corte : maxChars;
        linhas.push(resto.slice(0, fim).trim());
        resto = resto.slice(fim).trim();
      }

      if (resto) linhas.push(resto);
    });

  return linhas;
}

function desenharLinhas(
  texto: string,
  x: number,
  yInicial: number,
  size = 8,
  maxChars = 85
) {
  let yTexto = yInicial;
  const linhas = quebrarLinhas(texto, maxChars);

  linhas.forEach((linha) => {
    drawText(linha, x, yTexto, size);
    yTexto -= size + 4;
  });

  return yTexto;
}

function alturaDoTexto(texto: string, size = 8, maxChars = 85) {
  const linhas = quebrarLinhas(texto, maxChars);
  return Math.max(24, linhas.length * (size + 4) + 20);
}

// Layout dinâmico vindo do template
let cursorY = 790;

// Cabeçalho institucional vindo do template
const cabecalho = pegarSecao("CABEÇALHO INSTITUCIONAL");

console.log(cabecalho);


const textoCabecalho = limparTextoSecao(cabecalho);

const temLogoNoCabecalho = Boolean(logo);
const alturaTextoCabecalho = alturaDoTexto(textoCabecalho, 8, 78);
const alturaLogo = 100;
const alturaCabecalho = Math.max(120, alturaTextoCabecalho + 20, alturaLogo + 20);

const cabecalhoY = cursorY - alturaCabecalho;

drawBox(45, cabecalhoY, 505, alturaCabecalho);

// área fixa da logo à esquerda
drawBox(55, cabecalhoY + 10, 100, 100);

if (logo) {
  page.drawImage(logo, {
    x: 65,
    y: cabecalhoY + 20,
    width: 80,
    height: 80,
  });
} else {
  drawText("Logo da", 83, cabecalhoY + 62, 10);
  drawText("Instituição", 75, cabecalhoY + 45, 10);
}

// informações sempre à direita
desenharLinhas(
  textoCabecalho,
  175,
  cabecalhoY + alturaCabecalho - 18,
  7,
  78
);

cursorY = cabecalhoY - 32;

// Título vindo do template
const titulo =
  limparTextoSecao(pegarSecao("TÍTULO")) || "HISTÓRICO ACADÊMICO ESCOLAR";

const tituloFinal =
  titulo.toUpperCase();

/*
 * O título deixa de ser cortado por caracteres.
 * A quebra usa a largura real da fonte.
 */
function quebrarTituloPorLargura(
  texto: string,
  tamanho: number,
  larguraMaxima: number
) {
  const palavras =
    texto
      .split(/\s+/)
      .filter(Boolean);

  const linhas: string[] = [];
  let atual = "";

  for (const palavra of palavras) {
    const candidato =
      atual
        ? `${atual} ${palavra}`
        : palavra;

    const largura =
      fontBold.widthOfTextAtSize(
        candidato,
        tamanho
      );

    if (
      largura <= larguraMaxima ||
      !atual
    ) {
      atual = candidato;
      continue;
    }

    linhas.push(atual);
    atual = palavra;
  }

  if (atual) {
    linhas.push(atual);
  }

  return linhas;
}

let tamanhoTitulo = 13;
let linhasTitulo =
  quebrarTituloPorLargura(
    tituloFinal,
    tamanhoTitulo,
    460
  );

while (
  linhasTitulo.length > 2 &&
  tamanhoTitulo > 9
) {
  tamanhoTitulo -= 0.5;

  linhasTitulo =
    quebrarTituloPorLargura(
      tituloFinal,
      tamanhoTitulo,
      460
    );
}

for (
  let indice = 0;
  indice < linhasTitulo.length;
  indice += 1
) {
  const linha =
    linhasTitulo[indice];

  const larguraLinha =
    fontBold.widthOfTextAtSize(
      linha,
      tamanhoTitulo
    );

  drawText(
    linha,
    Math.max(
      45,
      (595.28 - larguraLinha) /
        2
    ),
    cursorY -
      indice *
        (tamanhoTitulo + 4),
    tamanhoTitulo,
    true,
    preto
  );
}

cursorY -=
  20 +
  linhasTitulo.length *
    (tamanhoTitulo + 4);

// Dados do aluno vindo do template
const dadosAluno = limparTextoSecao(pegarSecao("DADOS DO ALUNO"));
const alturaDadosAluno = alturaDoTexto(dadosAluno, 8, 85) + 20;
const dadosAlunoY = cursorY - alturaDadosAluno;

drawBox(45, dadosAlunoY, 505, alturaDadosAluno);

page.drawRectangle({
  x: 45,
  y: dadosAlunoY + alturaDadosAluno - 20,
  width: 505,
  height: 20,
  color: cinzaClaro,
  borderColor: preto,
  borderWidth: 0.8,
});

drawText("DADOS DO ALUNO", 250, dadosAlunoY + alturaDadosAluno - 14, 9, true);

desenharLinhas(dadosAluno, 55, dadosAlunoY + alturaDadosAluno - 35, 8, 85);

cursorY = dadosAlunoY - 18;

// Dados da matrícula
const dadosMatricula = limparTextoSecao(pegarSecao("DADOS DA MATRÍCULA"));

if (dadosMatricula) {
  const alturaDadosMatricula = alturaDoTexto(dadosMatricula, 8, 85) + 20;
  const dadosMatriculaY = cursorY - alturaDadosMatricula;

  drawBox(45, dadosMatriculaY, 505, alturaDadosMatricula);

  page.drawRectangle({
    x: 45,
    y: dadosMatriculaY + alturaDadosMatricula - 20,
    width: 505,
    height: 20,
    color: cinzaClaro,
    borderColor: preto,
    borderWidth: 0.8,
  });

  drawText(
    "DADOS DA MATRÍCULA",
    235,
    dadosMatriculaY + alturaDadosMatricula - 14,
    9,
    true
  );

  desenharLinhas(
    dadosMatricula,
    55,
    dadosMatriculaY + alturaDadosMatricula - 35,
    8,
    85
  );

  cursorY = dadosMatriculaY - 22;
}

// Tabela de componentes curriculares
const tabelaX = 45;
let y = cursorY - 40;

if (y < 135) {
  y = novaPaginaHistorico();
  // redesenha cabeçalho da tabela
}

drawText(
  "COMPONENTES CURRICULARES",
  190,
  y + 28,
  11,
  true
);

const colunas = [
  { titulo: "DISCIPLINA", x: tabelaX, w: 260 },
  { titulo: "C.H.", x: tabelaX + 260, w: 55 },
  { titulo: "NOTA", x: tabelaX + 315, w: 60 },
  { titulo: "FREQ.", x: tabelaX + 375, w: 60 },
  { titulo: "SITUAÇÃO", x: tabelaX + 435, w: 70 },
];

page.drawRectangle({
  x: tabelaX,
  y,
  width: 505,
  height: 22,
  color: cinzaClaro,
  borderColor: preto,
  borderWidth: 0.8,
});

for (const col of colunas) {
  drawBox(col.x, y, col.w, 22);
  drawText(col.titulo, col.x + 5, y + 8, 8, true);
}

y -= 22;

const itens = matriculaAtual?.itens || [];

for (const item of itens) {

if (y < 135) {
  y = novaPaginaHistorico();

  drawText("COMPONENTES CURRICULARES - CONTINUAÇÃO", 160, y + 28, 11, true);

  page.drawRectangle({
    x: tabelaX,
    y,
    width: 505,
    height: 22,
    color: cinzaClaro,
    borderColor: preto,
    borderWidth: 0.8,
  });

  for (const col of colunas) {
    drawBox(col.x, y, col.w, 22);
    drawText(col.titulo, col.x + 5, y + 8, 8, true);
  }

  y -= 22;
}

  const disciplina =
    item.disciplina;

  const nomeDisciplina =
    textoSeguro(
      disciplina?.nome
    ).slice(0, 45);

  const carga =
    disciplina?.cargaHoraria
      ? `${disciplina.cargaHoraria}h`
      : "-";

  const resultado =
    obterResultadoItem(item);

  const nota =
    formatarNumeroAcademico(
      resultado?.media
    );

  const frequencia =
    formatarFrequenciaAcademica(
      resultado?.frequencia
    );

  const situacao =
    situacaoHistoricoItem(
      item
    );

  for (const col of colunas) {
    drawBox(
      col.x,
      y,
      col.w,
      20
    );
  }

  drawText(
    nomeDisciplina,
    tabelaX + 5,
    y + 7,
    7.5
  );

  drawText(
    carga,
    tabelaX + 270,
    y + 7,
    7.5
  );

  drawText(
    nota,
    tabelaX + 327,
    y + 7,
    7.5
  );

  drawText(
    frequencia,
    tabelaX + 387,
    y + 7,
    7.5
  );

  drawText(
    situacao.slice(
      0,
      13
    ),
    tabelaX + 442,
    y + 7,
    7.2
  );

  y -= 20;
}

// Observações vindas do template
const observacoes = limparTextoSecao(pegarSecao("OBSERVAÇÕES"));

y -= 28;

if (observacoes) {
  if (y < 210) {
    y = novaPaginaHistorico();
  }

  drawText("OBSERVAÇÕES:", 45, y, 8.5, true);

  const yDepoisObs = desenharLinhas(
    observacoes,
    45,
    y - 14,
    6.3,
    118
  );

  y = yDepoisObs - 35;
}

// Assinatura institucional dinâmica
if (y < 155) {
  y = novaPaginaHistorico();
}

const assinaturaY = Math.max(105, y - 80);

if (assinatura) {
  page.drawImage(assinatura, {
    x: 220,
    y: assinaturaY + 45,
    width: 120,
    height: 38,
  });
}

page.drawLine({
  start: { x: 185, y: assinaturaY + 40 },
  end: { x: 410, y: assinaturaY + 40 },
  thickness: 0.8,
  color: preto,
});

drawText(textoSeguro(config?.responsavelNome), 230, assinaturaY + 25, 8.5, true);
drawText(
  textoSeguro(config?.responsavelCargo || "Responsável Institucional"),
  260,
  assinaturaY + 13,
  7.5
);
drawText(textoSeguro(config?.nomeFantasia || "Instituição"), 270, assinaturaY + 2, 7.5);

// Rodapé limpo
drawText(
  `${textoSeguro(config?.nomeFantasia || "PHANYX")} - CNPJ ${textoSeguro(config?.cnpj)}`,
  45,
  65,
  7,
  false,
  cinza
);

drawText(
  `Código de validação: ${documentoGerado.codigoValidacao || codigoValidacao}`,
  45,
  52,
  7,
  true,
  cinza
);

drawText(
  "Valide em: https://www.phanyx.com.br/validar-documento",
  45,
  40,
  7,
  false,
  cinza
);

    const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="historico-academico.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar histórico acadêmico:", error);

    return NextResponse.json(
      {
        error: error?.message || String(error),
        stack: error?.stack || null,
        nomeErro: error?.name || null,
      },
      { status: 500 }
    );
  }
}