import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

function moeda(valor: any) {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(valor: any) {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString("pt-BR");
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

    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const largura = 595.28;
    const altura = 841.89;

    let page = pdfDoc.addPage([largura, altura]);
    let y = altura - 60;

    function novaPagina() {
      page = pdfDoc.addPage([largura, altura]);
      y = altura - 60;
    }

    function texto(
      valor: string,
      x: number,
      tamanho = 9,
      negrito = false
    ) {
      if (y < 60) novaPagina();

      page.drawText(String(valor || "-"), {
        x,
        y,
        size: tamanho,
        font: negrito ? bold : font,
        color: rgb(0, 0, 0),
      });

      y -= tamanho + 5;
    }

    function linha() {
      if (y < 60) novaPagina();

      page.drawLine({
        start: { x: 40, y },
        end: { x: largura - 40, y },
        thickness: 0.8,
        color: rgb(0.75, 0.75, 0.75),
      });

      y -= 14;
    }

    function tituloSecao(titulo: string) {
      y -= 8;
      texto(titulo.toUpperCase(), 40, 11, true);
      linha();
    }

    function linhaTabela(colunas: string[], larguras: number[], negrito = false) {
      if (y < 70) novaPagina();

      let x = 40;

      colunas.forEach((coluna, index) => {
        const textoColuna = String(coluna || "-");
        const limite = larguras[index] || 80;
        const cortado =
          textoColuna.length > 38
            ? `${textoColuna.slice(0, 35)}...`
            : textoColuna;

        page.drawText(cortado, {
          x,
          y,
          size: 7,
          font: negrito ? bold : font,
          color: rgb(0, 0, 0),
        });

        x += limite;
      });

      y -= 12;
    }

    page.drawRectangle({
      x: 0,
      y: altura - 115,
      width: largura,
      height: 115,
      color: rgb(0.05, 0.05, 0.05),
    });

    page.drawText(instituicao?.nome || "Instituição", {
      x: 40,
      y: altura - 55,
      size: 18,
      font: bold,
      color: rgb(1, 1, 1),
    });

    page.drawText(NOMES_RELATORIO[tipo], {
      x: 40,
      y: altura - 80,
      size: 11,
      font,
      color: rgb(1, 1, 1),
    });

    y = altura - 150;

    texto(`Competência: ${String(mes).padStart(2, "0")}/${ano}`, 40, 10, true);
    texto(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, 40, 9);
    texto(`Emitido por: ${usuario.email}`, 40, 9);

    tituloSecao("Resumo da Competência");

    linhaTabela(
      ["Salários base", "Vencimentos", "Descontos", "Líquido"],
      [130, 130, 130, 130],
      true
    );

    linhaTabela(
      [
        moeda(totais.salarios),
        moeda(totais.vencimentos),
        moeda(totais.descontos),
        moeda(totais.liquido),
      ],
      [130, 130, 130, 130]
    );

    tituloSecao("Encargos e Provisões Estimadas");

    linhaTabela(
      ["INSS Patronal", "FGTS", "Provisão Férias", "Provisão 13º", "Total"],
      [100, 100, 110, 110, 100],
      true
    );

    linhaTabela(
      [
        moeda(encargosEstimados.inssPatronal),
        moeda(encargosEstimados.fgts),
        moeda(encargosEstimados.provisaoFerias),
        moeda(encargosEstimados.provisaoDecimo),
        moeda(totalEncargos),
      ],
      [100, 100, 110, 110, 100]
    );

    if (["contabil", "folha", "geral"].includes(tipo)) {
      tituloSecao("Holerites da Competência");

      linhaTabela(
        ["Funcionário", "Cargo", "Salário", "Vencimentos", "Descontos", "Líquido"],
        [150, 90, 75, 85, 80, 80],
        true
      );

      if (holerites.length === 0) {
        texto("Nenhum holerite encontrado nesta competência.", 40, 9);
      } else {
        holerites.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.funcionario?.cargo || "-",
              moeda(item.salarioBase),
              moeda(item.totalVencimentos),
              moeda(item.totalDescontos),
              moeda(item.valorLiquido),
            ],
            [150, 90, 75, 85, 80, 80]
          );
        });
      }
    }

    if (["contabil", "rescisao", "geral"].includes(tipo)) {
      tituloSecao("Rescisões da Competência");

      linhaTabela(
        ["Funcionário", "Tipo", "Desligamento", "Bruto", "Líquido", "Status"],
        [150, 100, 80, 80, 80, 70],
        true
      );

      if (rescisoes.length === 0) {
        texto("Nenhuma rescisão encontrada nesta competência.", 40, 9);
      } else {
        rescisoes.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.tipo || "-",
              dataBR(item.dataDesligamento),
              moeda(item.valorBrutoRescisao || item.valorRescisao),
              moeda(item.valorLiquidoRescisao || item.valorRescisao),
              item.status || "-",
            ],
            [150, 100, 80, 80, 80, 70]
          );
        });

        texto(`Total líquido de rescisões: ${moeda(totalRescisoes)}`, 40, 9, true);
      }
    }

    if (["contabil", "ferias", "geral"].includes(tipo)) {
      tituloSecao("Férias da Competência");

      linhaTabela(
        ["Funcionário", "Início", "Fim", "Pagamento", "Valor", "Status"],
        [150, 80, 80, 80, 85, 70],
        true
      );

      if (ferias.length === 0) {
        texto("Nenhuma férias encontrada nesta competência.", 40, 9);
      } else {
        ferias.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              dataBR(item.dataInicio),
              dataBR(item.dataFim),
              dataBR(item.dataPagamento),
              moeda(item.valorLiquidoFerias || item.valorFerias),
              item.status || "-",
            ],
            [150, 80, 80, 80, 85, 70]
          );
        });

        texto(`Total líquido de férias: ${moeda(totalFerias)}`, 40, 9, true);
      }
    }

    if (["contabil", "beneficios", "geral"].includes(tipo)) {
      tituloSecao("Benefícios");

      linhaTabela(
        ["Funcionário", "Benefício", "Tipo", "Valor"],
        [170, 160, 120, 80],
        true
      );

      if (beneficios.length === 0) {
        texto("Nenhum benefício ativo encontrado.", 40, 9);
      } else {
        beneficios.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.beneficio?.nome || "-",
              item.beneficio?.tipo || "-",
              moeda(item.valor || item.beneficio?.valorPadrao),
            ],
            [170, 160, 120, 80]
          );
        });

        texto(`Total estimado de benefícios: ${moeda(totalBeneficios)}`, 40, 9, true);
      }
    }

    if (["ocorrencias", "geral"].includes(tipo)) {
      tituloSecao("Ocorrências Funcionais");

      linhaTabela(
        ["Funcionário", "Tipo", "Data", "Motivo", "Status"],
        [150, 100, 80, 150, 80],
        true
      );

      if (ocorrencias.length === 0) {
        texto("Nenhuma ocorrência encontrada nesta competência.", 40, 9);
      } else {
        ocorrencias.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.tipo || "-",
              dataBR(item.dataEvento),
              item.motivo || "-",
              item.status || "-",
            ],
            [150, 100, 80, 150, 80]
          );
        });
      }
    }

    if (["exames", "geral"].includes(tipo)) {
      tituloSecao("Exames Médicos / ASO");

      linhaTabela(
        ["Funcionário", "Tipo", "Data", "Resultado", "Validade"],
        [150, 120, 80, 110, 80],
        true
      );

      if (exames.length === 0) {
        texto("Nenhum exame médico encontrado nesta competência.", 40, 9);
      } else {
        exames.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.tipo || "-",
              dataBR(item.dataExame),
              item.resultado || "-",
              dataBR(item.validade),
            ],
            [150, 120, 80, 110, 80]
          );
        });
      }
    }

    if (["historico", "geral"].includes(tipo)) {
      tituloSecao("Histórico Funcional");

      linhaTabela(
        ["Funcionário", "Tipo", "Evento", "Data"],
        [160, 110, 190, 80],
        true
      );

      if (historicos.length === 0) {
        texto("Nenhum evento funcional encontrado nesta competência.", 40, 9);
      } else {
        historicos.forEach((item: any) => {
          linhaTabela(
            [
              item.funcionario?.nome || "-",
              item.tipo || "-",
              item.titulo || "-",
              dataBR(item.dataEvento),
            ],
            [160, 110, 190, 80]
          );
        });
      }
    }

    y -= 15;
    linha();
    texto("Observações para a Contabilidade", 40, 10, true);
    texto(
      "Relatório gerado automaticamente pelo PHANYX com base nos registros de RH da competência selecionada.",
      40,
      8
    );
    texto(
      "Conferir encargos, provisões e eventos variáveis conforme regras contábeis, fiscais e trabalhistas aplicáveis.",
      40,
      8
    );

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="relatorio-rh-${tipo}-${String(
          mes
        ).padStart(2, "0")}-${ano}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF da contabilidade RH:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao gerar PDF da contabilidade RH.",
      },
      { status: 500 }
    );
  }
}