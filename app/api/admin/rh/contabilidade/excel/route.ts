import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type TokenPayload = {
  id: number;
  role: string;
  email: string;
  instituicaoId: number;
};

const NOMES_RELATORIO: Record<string, string> = {
  contabil: "Relatório Contábil da Competência",
  folha: "Folha / Holerites",
  encargos: "Encargos e Provisões",
  rescisao: "Rescisões",
  ferias: "Férias",
  beneficios: "Benefícios",
  ocorrencias: "Ocorrências Funcionais",
  exames: "Exames Médicos / ASO",
  historico: "Histórico Funcional",
  arquivados: "Arquivados / Auditoria",
  geral: "Relatório Geral RH",
};

function numero(valor: any) {
  return Number(valor || 0);
}

function moedaNumero(valor: any) {
  return numero(valor).toFixed(2).replace(".", ",");
}

function dataBR(valor: any) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString("pt-BR");
}

function limpar(valor: any) {
  return String(valor ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function validarMesAno(mes: number, ano: number) {
  const agora = new Date();

  return {
    mes:
      Number.isFinite(mes) && mes >= 1 && mes <= 12
        ? mes
        : agora.getMonth() + 1,
    ano:
      Number.isFinite(ano) && ano >= 2000 && ano <= 2100
        ? ano
        : agora.getFullYear(),
  };
}

async function obterUsuarioLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as TokenPayload;

  const role = String(decoded.role || "").toUpperCase();

  const podeAcessar = [
    "ADMIN",
    "FUNCIONARIO",
    "SECRETARIA",
    "FINANCEIRO",
    "COORDENADOR",
    "SUPORTE",
    "GERENCIA",
  ].includes(role);

  if (!podeAcessar || !decoded.instituicaoId) return null;

  return decoded;
}

function tabelaHtml(titulo: string, cabecalhos: string[], linhas: any[][]) {
  const cabecalhoHtml = cabecalhos
    .map((item) => `<th>${limpar(item)}</th>`)
    .join("");

  const linhasHtml =
    linhas.length === 0
      ? `<tr><td colspan="${cabecalhos.length}">Nenhum registro encontrado.</td></tr>`
      : linhas
          .map(
            (linha) =>
              `<tr>${linha
                .map((coluna) => `<td>${limpar(coluna)}</td>`)
                .join("")}</tr>`
          )
          .join("");

  return `
    <h2>${limpar(titulo)}</h2>
    <table>
      <thead>
        <tr>${cabecalhoHtml}</tr>
      </thead>
      <tbody>
        ${linhasHtml}
      </tbody>
    </table>
    <br />
  `;
}

export async function GET(req: Request) {
  try {
    const usuario = await obterUsuarioLogado();

    if (!usuario) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    const mesParam = Number(searchParams.get("mes"));
    const anoParam = Number(searchParams.get("ano"));
    const tipoParam = String(searchParams.get("tipo") || "contabil");

    const { mes, ano } = validarMesAno(mesParam, anoParam);
    const tipo = NOMES_RELATORIO[tipoParam] ? tipoParam : "contabil";

    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 1);
    const instituicaoId = Number(usuario.instituicaoId);

    const [
      instituicao,
      holerites,
      rescisoes,
      ferias,
      beneficios,
      ocorrencias,
      exames,
      historicos,
    ] = await Promise.all([
      prisma.instituicao.findUnique({
        where: { id: instituicaoId },
        select: {
          id: true,
          nome: true,
        },
      }),

      prisma.holeriteRH.findMany({
        where: {
          instituicaoId,
          competenciaMes: mes,
          competenciaAno: ano,
          arquivado: false,
          cancelado: false,
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),

      prisma.rescisaoRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          cancelada: false,
          dataDesligamento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataDesligamento: "desc",
        },
      }),

      prisma.feriasRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          cancelada: false,
          OR: [
            {
              dataInicio: {
                gte: inicio,
                lt: fim,
              },
            },
            {
              dataPagamento: {
                gte: inicio,
                lt: fim,
              },
            },
          ],
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataInicio: "desc",
        },
      }),

      prisma.funcionarioBeneficioRH.findMany({
        where: {
          instituicaoId,
          ativo: true,
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
          beneficio: {
            select: {
              id: true,
              nome: true,
              tipo: true,
              valorPadrao: true,
              ativo: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      }),

      prisma.ocorrenciaRH.findMany({
        where: {
          instituicaoId,
          arquivada: false,
          dataEvento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataEvento: "desc",
        },
      }),

      prisma.exameMedicoRH.findMany({
        where: {
          instituicaoId,
          arquivado: false,
          cancelado: false,
          dataExame: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataExame: "desc",
        },
      }),

      prisma.historicoRH.findMany({
        where: {
          instituicaoId,
          dataEvento: {
            gte: inicio,
            lt: fim,
          },
        },
        include: {
          funcionario: {
            select: {
              id: true,
              nome: true,
              cargo: true,
            },
          },
        },
        orderBy: {
          dataEvento: "desc",
        },
      }),
    ]);

    const totais = holerites.reduce(
      (acc, item: any) => {
        acc.salarios += numero(item.salarioBase);
        acc.vencimentos += numero(item.totalVencimentos);
        acc.descontos += numero(item.totalDescontos);
        acc.liquido += numero(item.valorLiquido);
        return acc;
      },
      {
        salarios: 0,
        vencimentos: 0,
        descontos: 0,
        liquido: 0,
      }
    );

    const encargosEstimados = {
      inssPatronal: totais.salarios * 0.2,
      fgts: totais.salarios * 0.08,
      provisaoFerias: totais.salarios / 12,
      provisaoDecimo: totais.salarios / 12,
    };

    const totalEncargos =
      encargosEstimados.inssPatronal +
      encargosEstimados.fgts +
      encargosEstimados.provisaoFerias +
      encargosEstimados.provisaoDecimo;

    const totalRescisoes = rescisoes.reduce((total: number, item: any) => {
      return total + numero(item.valorLiquidoRescisao || item.valorRescisao);
    }, 0);

    const totalFerias = ferias.reduce((total: number, item: any) => {
      return total + numero(item.valorLiquidoFerias || item.valorFerias);
    }, 0);

    const totalBeneficios = beneficios.reduce((total: number, item: any) => {
      return total + numero(item.valor || item.beneficio?.valorPadrao);
    }, 0);

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #111827;
            }

            h1 {
              font-size: 20px;
              margin-bottom: 4px;
            }

            h2 {
              font-size: 15px;
              margin-top: 18px;
              margin-bottom: 8px;
              background: #e5e7eb;
              padding: 6px;
            }

            p {
              margin: 3px 0;
              font-size: 12px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 12px;
            }

            th {
              background: #1f2937;
              color: #ffffff;
              font-weight: bold;
            }

            th, td {
              border: 1px solid #9ca3af;
              padding: 6px;
              font-size: 12px;
              vertical-align: top;
            }
          </style>
        </head>

        <body>
          <h1>${limpar(NOMES_RELATORIO[tipo])}</h1>
          <p><strong>Instituição:</strong> ${limpar(instituicao?.nome || "-")}</p>
          <p><strong>Competência:</strong> ${String(mes).padStart(2, "0")}/${ano}</p>
          <p><strong>Emitido em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
          <p><strong>Emitido por:</strong> ${limpar(usuario.email)}</p>

          ${tabelaHtml(
            "Resumo da Competência",
            ["Salários base", "Vencimentos", "Descontos", "Líquido"],
            [
              [
                moedaNumero(totais.salarios),
                moedaNumero(totais.vencimentos),
                moedaNumero(totais.descontos),
                moedaNumero(totais.liquido),
              ],
            ]
          )}

          ${tabelaHtml(
            "Encargos e Provisões Estimadas",
            [
              "INSS Patronal",
              "FGTS",
              "Provisão Férias",
              "Provisão 13º",
              "Total Estimado",
            ],
            [
              [
                moedaNumero(encargosEstimados.inssPatronal),
                moedaNumero(encargosEstimados.fgts),
                moedaNumero(encargosEstimados.provisaoFerias),
                moedaNumero(encargosEstimados.provisaoDecimo),
                moedaNumero(totalEncargos),
              ],
            ]
          )}

          ${
            ["contabil", "folha", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Holerites da Competência",
                  [
                    "Funcionário",
                    "Cargo",
                    "Salário",
                    "Vencimentos",
                    "Descontos",
                    "Líquido",
                    "Status",
                  ],
                  holerites.map((item: any) => [
                    item.funcionario?.nome || "-",
                    item.funcionario?.cargo || "-",
                    moedaNumero(item.salarioBase),
                    moedaNumero(item.totalVencimentos),
                    moedaNumero(item.totalDescontos),
                    moedaNumero(item.valorLiquido),
                    item.status || "-",
                  ])
                )
              : ""
          }

          ${
            ["contabil", "rescisao", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Rescisões da Competência",
                  [
                    "Funcionário",
                    "Tipo",
                    "Desligamento",
                    "Bruto",
                    "Líquido",
                    "Status",
                  ],
                  [
                    ...rescisoes.map((item: any) => [
                      item.funcionario?.nome || "-",
                      item.tipo || "-",
                      dataBR(item.dataDesligamento),
                      moedaNumero(item.valorBrutoRescisao || item.valorRescisao),
                      moedaNumero(item.valorLiquidoRescisao || item.valorRescisao),
                      item.status || "-",
                    ]),
                    ["TOTAL", "", "", "", moedaNumero(totalRescisoes), ""],
                  ]
                )
              : ""
          }

          ${
            ["contabil", "ferias", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Férias da Competência",
                  [
                    "Funcionário",
                    "Início",
                    "Fim",
                    "Pagamento",
                    "Valor",
                    "Status",
                  ],
                  [
                    ...ferias.map((item: any) => [
                      item.funcionario?.nome || "-",
                      dataBR(item.dataInicio),
                      dataBR(item.dataFim),
                      dataBR(item.dataPagamento),
                      moedaNumero(item.valorLiquidoFerias || item.valorFerias),
                      item.status || "-",
                    ]),
                    ["TOTAL", "", "", "", moedaNumero(totalFerias), ""],
                  ]
                )
              : ""
          }

          ${
            ["contabil", "beneficios", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Benefícios",
                  ["Funcionário", "Benefício", "Tipo", "Valor"],
                  [
                    ...beneficios.map((item: any) => [
                      item.funcionario?.nome || "-",
                      item.beneficio?.nome || "-",
                      item.beneficio?.tipo || "-",
                      moedaNumero(item.valor || item.beneficio?.valorPadrao),
                    ]),
                    ["TOTAL", "", "", moedaNumero(totalBeneficios)],
                  ]
                )
              : ""
          }

          ${
            ["ocorrencias", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Ocorrências Funcionais",
                  ["Funcionário", "Tipo", "Data", "Motivo", "Status"],
                  ocorrencias.map((item: any) => [
                    item.funcionario?.nome || "-",
                    item.tipo || "-",
                    dataBR(item.dataEvento),
                    item.motivo || "-",
                    item.status || "-",
                  ])
                )
              : ""
          }

          ${
            ["exames", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Exames Médicos / ASO",
                  ["Funcionário", "Tipo", "Data", "Resultado", "Validade"],
                  exames.map((item: any) => [
                    item.funcionario?.nome || "-",
                    item.tipo || "-",
                    dataBR(item.dataExame),
                    item.resultado || "-",
                    dataBR(item.validade),
                  ])
                )
              : ""
          }

          ${
            ["historico", "geral"].includes(tipo)
              ? tabelaHtml(
                  "Histórico Funcional",
                  ["Funcionário", "Tipo", "Evento", "Data"],
                  historicos.map((item: any) => [
                    item.funcionario?.nome || "-",
                    item.tipo || "-",
                    item.titulo || "-",
                    dataBR(item.dataEvento),
                  ])
                )
              : ""
          }

          <h2>Observações para a Contabilidade</h2>
          <p>
            Relatório gerado automaticamente pelo PHANYX com base nos registros
            de RH da competência selecionada.
          </p>
          <p>
            Conferir encargos, provisões e eventos variáveis conforme regras
            contábeis, fiscais e trabalhistas aplicáveis.
          </p>
        </body>
      </html>
    `;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-rh-${tipo}-${String(
          mes
        ).padStart(2, "0")}-${ano}.xls"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao exportar Excel da contabilidade RH:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao exportar Excel da contabilidade RH.",
      },
      { status: 500 }
    );
  }
}