import ExcelJS from "exceljs";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import {
  getUserFromToken,
} from "@/lib/server-auth";

import {
  prisma,
} from "@/lib/prisma";

import {
  GET as obterRelatorio,
} from "../route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Relatorio = {
  periodo: {
    inicio: string;
    fim: string;
  };

  circulacao: {
    emprestimos: number;
    devolucoes: number;
    ativos: number;
    atrasados: number;
    devolvidos: number;
    perdidos: number;
    danificados: number;
    cancelados: number;
  };

  renovacoes: {
    total: number;
    solicitadas: number;
    aprovadas: number;
    recusadas: number;
    canceladas: number;
  };

  reservas: {
    total: number;
    aguardando: number;
    disponiveis: number;
    atendidas: number;
    expiradas: number;
    canceladas: number;
  };

  multas: {
    quantidade: number;
    valorGerado: number;
    valorPago: number;
    valorEmAberto: number;
    pendentes: number;
    pagas: number;
    canceladas: number;
  };

  acervo: {
    titulos: number;
    exemplares: number;
    porStatus: Record<string, number>;
  };

  digital: {
    acessos: number;
    usuariosUnicos: number;
    leituras: number;
    visualizacoes: number;
    downloads: number;
    reproducoes: number;
    retomadas: number;
    conclusoesRegistradas: number;
    leiturasConcluidas: number;
  };

  rankings: {
    itensMaisEmprestados: Array<{
      itemId: number;
      titulo: string;
      subtitulo: string | null;
      isbn13: string | null;
      quantidade: number;
    }>;

    usuariosMaisAtivos: Array<{
      usuarioId: number;
      nome: string;
      email: string | null;
      quantidade: number;
    }>;
  };
};

const ROTULOS = {
  "pt-BR": {
    titulo: "Relat\u00f3rio da Biblioteca",
    periodo: "Per\u00edodo",
    categoria: "Categoria",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalhe",

    circulacao: "Circula\u00e7\u00e3o",
    emprestimos: "Empr\u00e9stimos",
    devolucoes: "Devolu\u00e7\u00f5es",
    ativos: "Ativos",
    atrasados: "Atrasados",
    devolvidos: "Devolvidos",
    perdidos: "Perdidos",
    danificados: "Danificados",
    cancelados: "Cancelados",

    renovacoes: "Renova\u00e7\u00f5es",
    solicitadas: "Solicitadas",
    aprovadas: "Aprovadas",
    recusadas: "Recusadas",

    reservas: "Reservas",
    aguardando: "Aguardando",
    disponiveis: "Dispon\u00edveis",
    atendidas: "Atendidas",
    expiradas: "Expiradas",

    multas: "Multas",
    quantidade: "Quantidade",
    valorGerado: "Valor gerado",
    valorPago: "Valor pago",
    valorAberto: "Valor em aberto",
    pendentes: "Pendentes",
    pagas: "Pagas",

    acervo: "Acervo",
    titulos: "T\u00edtulos",
    exemplares: "Exemplares",

    digital: "Uso digital",
    acessos: "Acessos",
    usuariosUnicos: "Usu\u00e1rios \u00fanicos",
    leituras: "Leituras",
    visualizacoes: "Visualiza\u00e7\u00f5es",
    downloads: "Downloads",
    reproducoes: "Reprodu\u00e7\u00f5es",
    retomadas: "Retomadas",
    conclusoes: "Conclus\u00f5es registradas",
    leiturasConcluidas: "Leituras conclu\u00eddas",

    maisEmprestados: "Itens mais emprestados",
    usuariosAtivos: "Usu\u00e1rios mais ativos",
    posicao: "Posi\u00e7\u00e3o",
    item: "Item",
    usuario: "Usu\u00e1rio",
    email: "E-mail",
    totalEmprestimos: "Empr\u00e9stimos",
  },

  "pt-PT": {
    titulo: "Relat\u00f3rio da Biblioteca",
    periodo: "Per\u00edodo",
    categoria: "Categoria",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalhe",

    circulacao: "Circula\u00e7\u00e3o",
    emprestimos: "Empr\u00e9stimos",
    devolucoes: "Devolu\u00e7\u00f5es",
    ativos: "Ativos",
    atrasados: "Atrasados",
    devolvidos: "Devolvidos",
    perdidos: "Perdidos",
    danificados: "Danificados",
    cancelados: "Cancelados",

    renovacoes: "Renova\u00e7\u00f5es",
    solicitadas: "Solicitadas",
    aprovadas: "Aprovadas",
    recusadas: "Recusadas",

    reservas: "Reservas",
    aguardando: "A aguardar",
    disponiveis: "Dispon\u00edveis",
    atendidas: "Atendidas",
    expiradas: "Expiradas",

    multas: "Multas",
    quantidade: "Quantidade",
    valorGerado: "Valor gerado",
    valorPago: "Valor pago",
    valorAberto: "Valor em aberto",
    pendentes: "Pendentes",
    pagas: "Pagas",

    acervo: "Acervo",
    titulos: "T\u00edtulos",
    exemplares: "Exemplares",

    digital: "Utiliza\u00e7\u00e3o digital",
    acessos: "Acessos",
    usuariosUnicos: "Utilizadores \u00fanicos",
    leituras: "Leituras",
    visualizacoes: "Visualiza\u00e7\u00f5es",
    downloads: "Downloads",
    reproducoes: "Reprodu\u00e7\u00f5es",
    retomadas: "Retomadas",
    conclusoes: "Conclus\u00f5es registadas",
    leiturasConcluidas: "Leituras conclu\u00eddas",

    maisEmprestados: "Itens mais emprestados",
    usuariosAtivos: "Utilizadores mais ativos",
    posicao: "Posi\u00e7\u00e3o",
    item: "Item",
    usuario: "Utilizador",
    email: "E-mail",
    totalEmprestimos: "Empr\u00e9stimos",
  },

  "en-US": {
    titulo: "Library Report",
    periodo: "Period",
    categoria: "Category",
    indicador: "Indicator",
    valor: "Value",
    detalhe: "Detail",

    circulacao: "Circulation",
    emprestimos: "Loans",
    devolucoes: "Returns",
    ativos: "Active",
    atrasados: "Overdue",
    devolvidos: "Returned",
    perdidos: "Lost",
    danificados: "Damaged",
    cancelados: "Cancelled",

    renovacoes: "Renewals",
    solicitadas: "Requested",
    aprovadas: "Approved",
    recusadas: "Rejected",

    reservas: "Reservations",
    aguardando: "Waiting",
    disponiveis: "Available",
    atendidas: "Fulfilled",
    expiradas: "Expired",

    multas: "Fines",
    quantidade: "Count",
    valorGerado: "Amount generated",
    valorPago: "Amount paid",
    valorAberto: "Outstanding amount",
    pendentes: "Pending",
    pagas: "Paid",

    acervo: "Collection",
    titulos: "Titles",
    exemplares: "Copies",

    digital: "Digital usage",
    acessos: "Accesses",
    usuariosUnicos: "Unique users",
    leituras: "Reads",
    visualizacoes: "Views",
    downloads: "Downloads",
    reproducoes: "Plays",
    retomadas: "Resumptions",
    conclusoes: "Recorded completions",
    leiturasConcluidas: "Completed reads",

    maisEmprestados: "Most borrowed items",
    usuariosAtivos: "Most active users",
    posicao: "Position",
    item: "Item",
    usuario: "User",
    email: "Email",
    totalEmprestimos: "Loans",
  },

  "es-ES": {
    titulo: "Informe de la Biblioteca",
    periodo: "Per\u00edodo",
    categoria: "Categor\u00eda",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalle",

    circulacao: "Circulaci\u00f3n",
    emprestimos: "Pr\u00e9stamos",
    devolucoes: "Devoluciones",
    ativos: "Activos",
    atrasados: "Atrasados",
    devolvidos: "Devueltos",
    perdidos: "Perdidos",
    danificados: "Da\u00f1ados",
    cancelados: "Cancelados",

    renovacoes: "Renovaciones",
    solicitadas: "Solicitadas",
    aprovadas: "Aprobadas",
    recusadas: "Rechazadas",

    reservas: "Reservas",
    aguardando: "En espera",
    disponiveis: "Disponibles",
    atendidas: "Atendidas",
    expiradas: "Expiradas",

    multas: "Multas",
    quantidade: "Cantidad",
    valorGerado: "Valor generado",
    valorPago: "Valor pagado",
    valorAberto: "Valor pendiente",
    pendentes: "Pendientes",
    pagas: "Pagadas",

    acervo: "Colecci\u00f3n",
    titulos: "T\u00edtulos",
    exemplares: "Ejemplares",

    digital: "Uso digital",
    acessos: "Accesos",
    usuariosUnicos: "Usuarios \u00fanicos",
    leituras: "Lecturas",
    visualizacoes: "Visualizaciones",
    downloads: "Descargas",
    reproducoes: "Reproducciones",
    retomadas: "Reanudaciones",
    conclusoes: "Finalizaciones registradas",
    leiturasConcluidas: "Lecturas completadas",

    maisEmprestados: "\u00cdtems m\u00e1s prestados",
    usuariosAtivos: "Usuarios m\u00e1s activos",
    posicao: "Posici\u00f3n",
    item: "\u00cdtem",
    usuario: "Usuario",
    email: "Correo electr\u00f3nico",
    totalEmprestimos: "Pr\u00e9stamos",
  },

  "fr-FR": {
    titulo: "Rapport de la biblioth\u00e8que",
    periodo: "P\u00e9riode",
    categoria: "Cat\u00e9gorie",
    indicador: "Indicateur",
    valor: "Valeur",
    detalhe: "D\u00e9tail",

    circulacao: "Circulation",
    emprestimos: "Emprunts",
    devolucoes: "Retours",
    ativos: "Actifs",
    atrasados: "En retard",
    devolvidos: "Retourn\u00e9s",
    perdidos: "Perdus",
    danificados: "Endommag\u00e9s",
    cancelados: "Annul\u00e9s",

    renovacoes: "Renouvellements",
    solicitadas: "Demand\u00e9s",
    aprovadas: "Approuv\u00e9s",
    recusadas: "Refus\u00e9s",

    reservas: "R\u00e9servations",
    aguardando: "En attente",
    disponiveis: "Disponibles",
    atendidas: "Trait\u00e9es",
    expiradas: "Expir\u00e9es",

    multas: "Amendes",
    quantidade: "Quantit\u00e9",
    valorGerado: "Montant g\u00e9n\u00e9r\u00e9",
    valorPago: "Montant pay\u00e9",
    valorAberto: "Montant restant",
    pendentes: "En attente",
    pagas: "Pay\u00e9es",

    acervo: "Collection",
    titulos: "Titres",
    exemplares: "Exemplaires",

    digital: "Usage num\u00e9rique",
    acessos: "Acc\u00e8s",
    usuariosUnicos: "Utilisateurs uniques",
    leituras: "Lectures",
    visualizacoes: "Consultations",
    downloads: "T\u00e9l\u00e9chargements",
    reproducoes: "Lectures multim\u00e9dias",
    retomadas: "Reprises",
    conclusoes: "Ach\u00e8vements enregistr\u00e9s",
    leiturasConcluidas: "Lectures termin\u00e9es",

    maisEmprestados: "Documents les plus emprunt\u00e9s",
    usuariosAtivos: "Utilisateurs les plus actifs",
    posicao: "Position",
    item: "Document",
    usuario: "Utilisateur",
    email: "E-mail",
    totalEmprestimos: "Emprunts",
  },
} as const;

const STATUS_EXEMPLAR_ROTULOS = {
  "pt-BR": {
    DISPONIVEL: "Disponível",
    EMPRESTADO: "Emprestado",
    RESERVADO: "Reservado",
    MANUTENCAO: "Manutenção",
    DANIFICADO: "Danificado",
    EXTRAVIADO: "Extraviado",
    INDISPONIVEL: "Indisponível",
    BAIXADO: "Baixado",
  },

  "pt-PT": {
    DISPONIVEL: "Disponível",
    EMPRESTADO: "Emprestado",
    RESERVADO: "Reservado",
    MANUTENCAO: "Manutenção",
    DANIFICADO: "Danificado",
    EXTRAVIADO: "Extraviado",
    INDISPONIVEL: "Indisponível",
    BAIXADO: "Baixado",
  },

  "en-US": {
    DISPONIVEL: "Available",
    EMPRESTADO: "Loaned out",
    RESERVADO: "Reserved",
    MANUTENCAO: "Maintenance",
    DANIFICADO: "Damaged",
    EXTRAVIADO: "Missing",
    INDISPONIVEL: "Unavailable",
    BAIXADO: "Withdrawn",
  },

  "es-ES": {
    DISPONIVEL: "Disponible",
    EMPRESTADO: "Prestado",
    RESERVADO: "Reservado",
    MANUTENCAO: "Mantenimiento",
    DANIFICADO: "Dañado",
    EXTRAVIADO: "Extraviado",
    INDISPONIVEL: "No disponible",
    BAIXADO: "Dado de baja",
  },

  "fr-FR": {
    DISPONIVEL: "Disponible",
    EMPRESTADO: "Emprunté",
    RESERVADO: "Réservé",
    MANUTENCAO: "Maintenance",
    DANIFICADO: "Endommagé",
    EXTRAVIADO: "Égaré",
    INDISPONIVEL: "Indisponible",
    BAIXADO: "Retiré",
  },
} as const;

type LocaleRelatorio =
  keyof typeof ROTULOS;

function obterLocale(
  valor: string | null,
): LocaleRelatorio {
  if (
    valor &&
    Object.prototype.hasOwnProperty.call(
      ROTULOS,
      valor,
    )
  ) {
    return valor as LocaleRelatorio;
  }

  return "pt-BR";
}

function traduzirStatusExemplar(
  status: string,
  locale: LocaleRelatorio,
) {
  const mapa =
    STATUS_EXEMPLAR_ROTULOS[
      locale
    ] as Record<
      string,
      string
    >;

  return mapa[status] || status;
}

function dataLocal(
  valor: string,
  locale: string,
) {
  return new Date(
    `${valor}T12:00:00.000Z`,
  ).toLocaleDateString(
    locale,
  );
}

function estilizarCabecalho(
  linha: ExcelJS.Row,
) {
  linha.height = 22;

  linha.eachCell(
    (cell) => {
      cell.font = {
        bold: true,
        color: {
          argb: "FFFFFFFF",
        },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: "FF2563EB",
        },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
      };

      cell.border = {
        bottom: {
          style: "thin",
          color: {
            argb: "FFCBD5E1",
          },
        },
      };
    },
  );
}

export async function GET(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuario nao autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.relatorios.ver",
    );

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.relatorios.exportar",
    );

    const resposta =
      await obterRelatorio(
        request,
      );

    if (!resposta.ok) {
      return resposta;
    }

    const dados =
      (await resposta.json()) as Relatorio;

    const locale =
      obterLocale(
        request.nextUrl.searchParams.get(
          "locale",
        ),
      );

    const r =
      ROTULOS[locale];

    const [
      instituicao,
      configuracao,
    ] =
      await Promise.all([
        prisma.instituicao.findUnique({
          where: {
            id:
              contexto.instituicaoId,
          },
          select: {
            nome: true,
          },
        }),

        prisma.configuracaoInstituicao.findUnique({
          where: {
            instituicaoId:
              contexto.instituicaoId,
          },
          select: {
            nomeFantasia: true,
            razaoSocial: true,
          },
        }),
      ]);

    const nomeInstituicao =
      configuracao?.nomeFantasia ||
      configuracao?.razaoSocial ||
      instituicao?.nome ||
      "PHANYX";

    const workbook =
      new ExcelJS.Workbook();

    workbook.creator =
      "PHANYX";

    workbook.created =
      new Date();

    workbook.modified =
      new Date();

    const resumo =
      workbook.addWorksheet(
        r.titulo,
        {
          views: [
            {
              state: "frozen",
              ySplit: 6,
            },
          ],
          pageSetup: {
            orientation:
              "landscape",
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
          },
        },
      );

    resumo.columns = [
      {
        key: "categoria",
        width: 25,
      },
      {
        key: "indicador",
        width: 32,
      },
      {
        key: "valor",
        width: 18,
      },
      {
        key: "detalhe",
        width: 38,
      },
    ];

    resumo.mergeCells(
      "A1:D1",
    );

    resumo.getCell(
      "A1",
    ).value =
      nomeInstituicao;

    resumo.getCell(
      "A1",
    ).font = {
      bold: true,
      size: 18,
      color: {
        argb: "FF0F172A",
      },
    };

    resumo.mergeCells(
      "A2:D2",
    );

    resumo.getCell(
      "A2",
    ).value =
      r.titulo;

    resumo.getCell(
      "A2",
    ).font = {
      bold: true,
      size: 14,
      color: {
        argb: "FF1E3A8A",
      },
    };

    resumo.mergeCells(
      "A3:D3",
    );

    resumo.getCell(
      "A3",
    ).value =
      `${r.periodo}: ${dataLocal(
        dados.periodo.inicio,
        locale,
      )} - ${dataLocal(
        dados.periodo.fim,
        locale,
      )}`;

    resumo.getCell(
      "A3",
    ).font = {
      size: 10,
      color: {
        argb: "FF475569",
      },
    };

    resumo.addRow([]);

    const cabecalho =
      resumo.addRow([
        r.categoria,
        r.indicador,
        r.valor,
        r.detalhe,
      ]);

    estilizarCabecalho(
      cabecalho,
    );

    function adicionar(
      categoria: string,
      indicador: string,
      valor:
        | number
        | string,
      detalhe = "",
    ) {
      const linha =
        resumo.addRow([
          categoria,
          indicador,
          valor,
          detalhe,
        ]);

      linha.eachCell(
        (cell) => {
          cell.alignment = {
            vertical:
              "middle",
          };

          cell.border = {
            bottom: {
              style:
                "hair",
              color: {
                argb:
                  "FFE2E8F0",
              },
            },
          };
        },
      );

      return linha;
    }

    adicionar(
      r.circulacao,
      r.emprestimos,
      dados.circulacao.emprestimos,
    );

    adicionar(
      r.circulacao,
      r.devolucoes,
      dados.circulacao.devolucoes,
    );

    adicionar(
      r.circulacao,
      r.ativos,
      dados.circulacao.ativos,
    );

    adicionar(
      r.circulacao,
      r.atrasados,
      dados.circulacao.atrasados,
    );

    adicionar(
      r.circulacao,
      r.devolvidos,
      dados.circulacao.devolvidos,
    );

    adicionar(
      r.circulacao,
      r.perdidos,
      dados.circulacao.perdidos,
    );

    adicionar(
      r.circulacao,
      r.danificados,
      dados.circulacao.danificados,
    );

    adicionar(
      r.circulacao,
      r.cancelados,
      dados.circulacao.cancelados,
    );

    adicionar(
      r.renovacoes,
      r.renovacoes,
      dados.renovacoes.total,
    );

    adicionar(
      r.renovacoes,
      r.solicitadas,
      dados.renovacoes.solicitadas,
    );

    adicionar(
      r.renovacoes,
      r.aprovadas,
      dados.renovacoes.aprovadas,
    );

    adicionar(
      r.renovacoes,
      r.recusadas,
      dados.renovacoes.recusadas,
    );

    adicionar(
      r.renovacoes,
      r.cancelados,
      dados.renovacoes.canceladas,
    );

    adicionar(
      r.reservas,
      r.reservas,
      dados.reservas.total,
    );

    adicionar(
      r.reservas,
      r.aguardando,
      dados.reservas.aguardando,
    );

    adicionar(
      r.reservas,
      r.disponiveis,
      dados.reservas.disponiveis,
    );

    adicionar(
      r.reservas,
      r.atendidas,
      dados.reservas.atendidas,
    );

    adicionar(
      r.reservas,
      r.expiradas,
      dados.reservas.expiradas,
    );

    adicionar(
      r.reservas,
      r.cancelados,
      dados.reservas.canceladas,
    );

    const linhaGerado =
      adicionar(
        r.multas,
        r.valorGerado,
        dados.multas.valorGerado,
      );

    const linhaPago =
      adicionar(
        r.multas,
        r.valorPago,
        dados.multas.valorPago,
      );

    const linhaAberto =
      adicionar(
        r.multas,
        r.valorAberto,
        dados.multas.valorEmAberto,
      );

    for (
      const linha
      of [
        linhaGerado,
        linhaPago,
        linhaAberto,
      ]
    ) {
      linha.getCell(
        3,
      ).numFmt =
        '"R$" #,##0.00';
    }

    adicionar(
      r.multas,
      r.quantidade,
      dados.multas.quantidade,
    );

    adicionar(
      r.multas,
      r.pendentes,
      dados.multas.pendentes,
    );

    adicionar(
      r.multas,
      r.pagas,
      dados.multas.pagas,
    );

    adicionar(
      r.multas,
      r.cancelados,
      dados.multas.canceladas,
    );

    adicionar(
      r.acervo,
      r.titulos,
      dados.acervo.titulos,
    );

    adicionar(
      r.acervo,
      r.exemplares,
      dados.acervo.exemplares,
    );

    for (
      const [
        status,
        quantidade,
      ] of Object.entries(
        dados.acervo.porStatus,
      )
    ) {
      adicionar(
        r.acervo,
        traduzirStatusExemplar(
          status,
          locale,
        ),
        quantidade,
      );
    }

    adicionar(
      r.digital,
      r.acessos,
      dados.digital.acessos,
    );

    adicionar(
      r.digital,
      r.usuariosUnicos,
      dados.digital.usuariosUnicos,
    );

    adicionar(
      r.digital,
      r.leituras,
      dados.digital.leituras,
    );

    adicionar(
      r.digital,
      r.visualizacoes,
      dados.digital.visualizacoes,
    );

    adicionar(
      r.digital,
      r.downloads,
      dados.digital.downloads,
    );

    adicionar(
      r.digital,
      r.reproducoes,
      dados.digital.reproducoes,
    );

    adicionar(
      r.digital,
      r.retomadas,
      dados.digital.retomadas,
    );

    adicionar(
      r.digital,
      r.conclusoes,
      dados.digital.conclusoesRegistradas,
    );

    adicionar(
      r.digital,
      r.leiturasConcluidas,
      dados.digital.leiturasConcluidas,
    );

    resumo.autoFilter = {
      from: "A5",
      to: "D5",
    };

    const rankingItens =
      workbook.addWorksheet(
        r.maisEmprestados,
      );

    rankingItens.columns = [
      {
        width: 12,
      },
      {
        width: 50,
      },
      {
        width: 35,
      },
      {
        width: 18,
      },
    ];

    const cabecalhoItens =
      rankingItens.addRow([
        r.posicao,
        r.item,
        r.detalhe,
        r.totalEmprestimos,
      ]);

    estilizarCabecalho(
      cabecalhoItens,
    );

    dados.rankings.itensMaisEmprestados.forEach(
      (
        item,
        indice,
      ) => {
        rankingItens.addRow([
          indice + 1,
          item.titulo,
          item.subtitulo ||
            item.isbn13 ||
            "",
          item.quantidade,
        ]);
      },
    );

    const rankingUsuarios =
      workbook.addWorksheet(
        r.usuariosAtivos,
      );

    rankingUsuarios.columns = [
      {
        width: 12,
      },
      {
        width: 40,
      },
      {
        width: 42,
      },
      {
        width: 18,
      },
    ];

    const cabecalhoUsuarios =
      rankingUsuarios.addRow([
        r.posicao,
        r.usuario,
        r.email,
        r.totalEmprestimos,
      ]);

    estilizarCabecalho(
      cabecalhoUsuarios,
    );

    dados.rankings.usuariosMaisAtivos.forEach(
      (
        item,
        indice,
      ) => {
        rankingUsuarios.addRow([
          indice + 1,
          item.nome,
          item.email || "",
          item.quantidade,
        ]);
      },
    );

    const buffer =
      await workbook.xlsx.writeBuffer();

    const nomeArquivo =
      `biblioteca-relatorio-${dados.periodo.inicio}-${dados.periodo.fim}.xlsx`;

    return new NextResponse(
      Buffer.from(
        buffer,
      ),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

          "Content-Disposition":
            `attachment; filename="${nomeArquivo}"`,

          "Cache-Control":
            "no-store",
        },
      },
    );
  } catch (erro) {
    const resposta =
      respostaErroBiblioteca(
        erro,
      );

    return NextResponse.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      },
    );
  }
}
