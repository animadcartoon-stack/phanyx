import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { desenharCabecalhoInstituicao } from "@/lib/pdf/cabecalhoInstituicao";
import { desenharRodapeInstituicao } from "@/lib/pdf/rodapeInstituicao";
import { TIPOS_AGENDA } from "@/lib/agenda/tiposAgenda";
import { obterTemaRelatorio } from "@/lib/relatorios/temaRelatorio";

const COLUNAS_PDF_PADRAO = ["data", "hora", "tipo", "evento", "turma", "professor", "status"];

const NOMES_COLUNAS: Record<string, string> = {
  data: "Data",
  hora: "Hora",
  tipo: "Tipo",
  curso: "Curso",
  turma: "Turma",
  disciplina: "Disciplina",
  evento: "Evento",
  professor: "Professor",
  funcionario: "Funcionário",
  departamento: "Departamento",
  polo: "Polo",
  responsavel: "Responsável",
  status: "Status",
  local: "Local",
  observacoes: "Observações",
};

const LARGURA_COLUNAS: Record<string, number> = {
  data: 60,
  hora: 45,
  tipo: 70,
  curso: 120,
  turma: 90,
  disciplina: 130,
  evento: 160,
  professor: 120,
  funcionario: 120,
  departamento: 100,
  polo: 90,
  responsavel: 110,
  status: 70,
  local: 110,
  observacoes: 180,
};

function textoItem(item: any, coluna: string) {
  if (coluna === "data") {
    return item.data ? new Date(item.data).toLocaleDateString("pt-BR") : "-";
  }

  if (coluna === "evento") {
    return item.titulo || item.evento || "-";
  }

  return item[coluna] || "-";
}

function cortarTexto(texto: string, limite: number) {
  if (!texto) return "-";
  return texto.length > limite ? `${texto.slice(0, limite - 3)}...` : texto;
}

function nomePeriodo(periodo?: string | null) {
  switch (periodo) {
    case "DIA":
      return "Hoje";
    case "SEMANA":
      return "Semana";
    case "MES":
      return "Mês";
    case "SEMESTRE_1":
      return "1º semestre";
    case "SEMESTRE_2":
      return "2º semestre";
    case "ANO":
      return "Ano";
    default:
      return "Semana";
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const usuario = await prisma.user.findUnique({
  where: { id: user.id },
  select: {
    nome: true,
  },
});

const configuracaoInstituicao =
  await prisma.configuracaoInstituicao.findUnique({
    where: {
      instituicaoId: user.instituicaoId,
    },
    select: {
      nomeFantasia: true,
      razaoSocial: true,
      cnpj: true,
      telefone: true,
      email: true,
      cidade: true,
      estado: true,
      logoUrl: true,
      corRelatorio: true,
    },
  });

const instituicao = await prisma.instituicao.findUnique({
  where: {
    id: user.instituicaoId,
  },
  select: {
    nome: true,
  },
});

const nomeInstituicao =
  configuracaoInstituicao?.nomeFantasia ||
  configuracaoInstituicao?.razaoSocial ||
  instituicao?.nome ||
  "Instituição";

  const temaRelatorio = obterTemaRelatorio(
  configuracaoInstituicao?.corRelatorio
);

function corPdf(argb: string) {
  const hex = argb.replace("FF", "");
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  return rgb(r, g, b);
}

    const preferencia = await prisma.preferenciaAgendaOperacional.findUnique({
      where: {
        instituicaoId_userId: {
          instituicaoId: user.instituicaoId,
          userId: user.id,
        },
      },
    });

    const colunasPdf = Array.isArray(preferencia?.colunasPdf)
      ? (preferencia?.colunasPdf as string[])
      : COLUNAS_PDF_PADRAO;

    const agendaUrl = new URL("/api/admin/agenda-operacional", req.nextUrl.origin);
    req.nextUrl.searchParams.forEach((value, key) => {
      agendaUrl.searchParams.set(key, value);
    });

    const agendaRes = await fetch(agendaUrl.toString(), {
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
      cache: "no-store",
    });

    const dadosAgenda = await agendaRes.json();

    if (!agendaRes.ok) {
      return NextResponse.json(
        { error: dadosAgenda?.error || "Erro ao carregar agenda para PDF." },
        { status: agendaRes.status }
      );
    }

    const agenda = dadosAgenda?.agenda || [];

    const resumoAgenda = {
  aulas: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.AULA).length,
  provas: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.PROVA).length,
  atividades: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.ATIVIDADE).length,
  reunioes: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.REUNIAO).length,
  ferias: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.FERIAS_RH).length,
  escalas: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.ESCALA_RH).length,
  semProfessor: agenda.filter((i: any) => i.tipo === TIPOS_AGENDA.SEM_PROFESSOR).length,
};

    const periodoParam = req.nextUrl.searchParams.get("periodo");
const cursoIdParam = req.nextUrl.searchParams.get("cursoId");
const turmaIdParam = req.nextUrl.searchParams.get("turmaId");
const professorIdParam = req.nextUrl.searchParams.get("professorId");
const departamentoIdParam = req.nextUrl.searchParams.get("departamentoId");
const poloIdParam = req.nextUrl.searchParams.get("poloId");

const cursoFiltro = cursoIdParam
  ? await prisma.curso.findFirst({
      where: {
        id: Number(cursoIdParam),
        instituicaoId: user.instituicaoId,
      },
      select: { nome: true },
    })
  : null;

const turmaFiltro = turmaIdParam
  ? await prisma.turma.findFirst({
      where: {
        id: Number(turmaIdParam),
        instituicaoId: user.instituicaoId,
      },
      select: { nome: true },
    })
  : null;

const professorFiltro = professorIdParam
  ? await prisma.professor.findFirst({
      where: {
        id: Number(professorIdParam),
        instituicaoId: user.instituicaoId,
      },
      select: { nome: true },
    })
  : null;

const departamentoFiltro = departamentoIdParam
  ? await prisma.departamento.findFirst({
      where: {
        id: Number(departamentoIdParam),
        instituicaoId: user.instituicaoId,
      },
      select: { nome: true },
    })
  : null;

const poloFiltro = poloIdParam
  ? await prisma.polo.findFirst({
      where: {
        id: Number(poloIdParam),
        instituicaoId: user.instituicaoId,
      },
      select: { nome: true },
    })
  : null;

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setTitle("Agenda Operacional");
    pdfDoc.setAuthor("PHANYX");
    pdfDoc.setSubject("Relatório da Agenda Operacional");
    pdfDoc.setKeywords(["PHANYX", "Agenda Operacional", "Relatório"]);
    pdfDoc.setProducer("PHANYX");
    pdfDoc.setCreator("PHANYX");
    const fonteNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fonteBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const largura = 842;
    const altura = 595;
    const margem = 32;

    let pagina = pdfDoc.addPage([largura, altura]);
    let y = altura - margem;

    function novaPagina() {
      pagina = pdfDoc.addPage([largura, altura]);
      y = altura - margem;
    }

    function escrever(
  texto: string,
  x: number,
  yPos: number,
  tamanho = 9,
  bold = false,
  color = rgb(0.08, 0.12, 0.2)
) {
  pagina.drawText(texto, {
    x,
    y: yPos,
    size: tamanho,
    font: bold ? fonteBold : fonteNormal,
    color,
  });
}

    y = await desenharCabecalhoInstituicao({
  pdfDoc,
  pagina,
  fonteNormal,
  fonteBold,
  margem,
  y,
  dados: {
    nomeInstituicao,
    tituloRelatorio: "Agenda Operacional",
    cnpj: configuracaoInstituicao?.cnpj,
    telefone: configuracaoInstituicao?.telefone,
    email: configuracaoInstituicao?.email,
    cidade: configuracaoInstituicao?.cidade,
    estado: configuracaoInstituicao?.estado,
    logoUrl: configuracaoInstituicao?.logoUrl,
  },
});

escrever(`Emitido em: ${new Date().toLocaleString("pt-BR")}`, margem, y, 9);
escrever(`Usuário: ${usuario?.nome || "-"}`, margem + 260, y, 9);

y -= 26;

const filtrosPdf = [
  `Período: ${nomePeriodo(periodoParam)}`,
  `Curso: ${cursoFiltro?.nome || "Todos"}`,
  `Turma: ${turmaFiltro?.nome || "Todas"}`,
  `Professor: ${professorFiltro?.nome || "Todos"}`,
  `Departamento: ${departamentoFiltro?.nome || "Todos"}`,
  `Polo: ${poloFiltro?.nome || "Todos"}`,
];

escrever(
  `Eventos encontrados (${agenda.length})`,
  margem,
  y,
  10,
  true
);

y -= 16;

pagina.drawRectangle({
  x: margem,
  y: y - 28,
  width: largura - margem * 2,
  height: 34,
  color: rgb(0.96, 0.97, 0.99),
});

escrever("Filtros utilizados", margem + 8, y - 4, 9, true);
escrever(filtrosPdf.slice(0, 3).join("   |   "), margem + 8, y - 18, 8);
escrever(filtrosPdf.slice(3).join("   |   "), margem + 8, y - 30, 8);

y -= 52;

pagina.drawRectangle({
  x: margem,
  y: y - 58,
  width: largura - margem * 2,
  height: 62,
  color: rgb(0.98, 0.99, 1),
});

escrever("Resumo da Agenda", margem + 8, y - 10, 10, true);

escrever(`Aulas: ${resumoAgenda.aulas}`, margem + 12, y - 26, 8);
escrever(`Provas: ${resumoAgenda.provas}`, margem + 150, y - 26, 8);
escrever(`Atividades: ${resumoAgenda.atividades}`, margem + 290, y - 26, 8);
escrever(`Reuniões: ${resumoAgenda.reunioes}`, margem + 450, y - 26, 8);

escrever(`Férias RH: ${resumoAgenda.ferias}`, margem + 12, y - 44, 8);
escrever(`Escalas RH: ${resumoAgenda.escalas}`, margem + 150, y - 44, 8);
escrever(
  `Sem professor: ${resumoAgenda.semProfessor}`,
  margem + 290,
  y - 44,
  8
);

y -= 72;

    const larguraTabela = largura - margem * 2;
    const PESOS_COLUNAS: Record<string, number> = {
  data: 10,
  hora: 8,
  tipo: 10,
  curso: 18,
  turma: 12,
  disciplina: 20,
  evento: 20,
  professor: 18,
  funcionario: 18,
  departamento: 16,
  polo: 14,
  responsavel: 18,
  status: 10,
  local: 16,
  observacoes: 24,
};

const pesoTotal = colunasPdf.reduce(
  (s, c) => s + (PESOS_COLUNAS[c] ?? 12),
  0
);

const largurasColunas = colunasPdf.map((coluna) => {
  const peso = PESOS_COLUNAS[coluna] ?? 12;
  return (peso / pesoTotal) * larguraTabela;
});

    pagina.drawRectangle({
  x: margem,
  y: y - 10,
  width: larguraTabela,
  height: 22,
  color: corPdf(temaRelatorio.fundo),// azul PHANYX
});

    colunasPdf.forEach((coluna, index) => {
  escrever(
    cortarTexto(NOMES_COLUNAS[coluna] || coluna, 16),
    margem +
largurasColunas
  .slice(0, index)
  .reduce((s, l) => s + l, 0) +
4,
    y,
    7,
    true,
    corPdf(temaRelatorio.texto) // texto branco
  );
});

y -= 24;

    agenda.forEach((item: any, linhaIndex: number) => {
      if (y < 50) {
  novaPagina();

  pagina.drawRectangle({
    x: margem,
    y: y - 10,
    width: larguraTabela,
    height: 22,
    color: corPdf(temaRelatorio.fundo),
  });

  colunasPdf.forEach((coluna, index) => {
    escrever(
      cortarTexto(NOMES_COLUNAS[coluna] || coluna, 16),
      margem +
largurasColunas
  .slice(0, index)
  .reduce((s, l) => s + l, 0) +
4,
      y,
      7,
      true,
      corPdf(temaRelatorio.texto)
    );
  });

  y -= 24;
}

      if (linhaIndex % 2 === 0) {
        pagina.drawRectangle({
          x: margem,
          y: y - 6,
          width: larguraTabela,
          height: 18,
          color: rgb(0.98, 0.99, 1),
        });
      }

      colunasPdf.forEach((coluna, index) => {
  const limiteCaracteres = Math.max(
    8,
    Math.floor(largurasColunas[index] / 5)
  );

  escrever(
    cortarTexto(
      String(textoItem(item, coluna)),
      limiteCaracteres
    ),
    margem +
      largurasColunas
        .slice(0, index)
        .reduce((s, l) => s + l, 0) +
      4,
    y - 1,
    7
  );
});

      y -= 18;
    });

    const paginas = pdfDoc.getPages();

    paginas.forEach((p, index) => {
  desenharRodapeInstituicao({
    pagina: p,
    fonteNormal,
    larguraPagina: largura,
    margem,
    numeroPagina: index + 1,
    totalPaginas: paginas.length,
  });
});

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
  status: 200,
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": 'inline; filename="agenda-operacional.pdf"',
  },
});
  } catch (error) {
    console.error("Erro ao gerar PDF da agenda operacional:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF da agenda operacional." },
      { status: 500 }
    );
  }
}