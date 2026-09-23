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
  GET as obterRelatorio,
} from "../route";

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
    categoria: "Categoria",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalhe",
    periodo: "Per\u00edodo",
    inicio: "Data inicial",
    fim: "Data final",
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
    total: "Total",
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
    status: "Status",
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
  },

  "pt-PT": {
    categoria: "Categoria",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalhe",
    periodo: "Per\u00edodo",
    inicio: "Data inicial",
    fim: "Data final",
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
    total: "Total",
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
    status: "Estado",
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
  },

  "en-US": {
    categoria: "Category",
    indicador: "Indicator",
    valor: "Value",
    detalhe: "Detail",
    periodo: "Period",
    inicio: "Start date",
    fim: "End date",
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
    total: "Total",
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
    status: "Status",
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
  },

  "es-ES": {
    categoria: "Categor\u00eda",
    indicador: "Indicador",
    valor: "Valor",
    detalhe: "Detalle",
    periodo: "Per\u00edodo",
    inicio: "Fecha inicial",
    fim: "Fecha final",
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
    total: "Total",
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
    status: "Estado",
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
  },

  "fr-FR": {
    categoria: "Cat\u00e9gorie",
    indicador: "Indicateur",
    valor: "Valeur",
    detalhe: "D\u00e9tail",
    periodo: "P\u00e9riode",
    inicio: "Date de d\u00e9but",
    fim: "Date de fin",
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
    total: "Total",
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
    status: "Statut",
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
  },
} as const;

type LocaleCsv =
  keyof typeof ROTULOS;

function obterLocale(
  valor: string | null,
): LocaleCsv {
  if (
    valor &&
    Object.prototype.hasOwnProperty.call(
      ROTULOS,
      valor,
    )
  ) {
    return valor as LocaleCsv;
  }

  return "pt-BR";
}

function campoCsv(
  valor:
    | string
    | number
    | null
    | undefined,
) {
  const texto =
    valor === null ||
    valor === undefined
      ? ""
      : String(valor);

  return `"${texto.replace(
    /"/g,
    '""',
  )}"`;
}

function linhaCsv(
  ...valores: Array<
    | string
    | number
    | null
    | undefined
  >
) {
  return valores
    .map(campoCsv)
    .join(";");
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

    const formatarNumero =
      new Intl.NumberFormat(
        locale,
        {
          maximumFractionDigits: 2,
        },
      );

    const formatarData = (
      valor: string,
    ) =>
      new Date(
        `${valor}T12:00:00.000Z`,
      ).toLocaleDateString(
        locale,
      );

    const linhas: string[] = [
      linhaCsv(
        r.categoria,
        r.indicador,
        r.valor,
        r.detalhe,
      ),

      linhaCsv(
        r.periodo,
        r.inicio,
        formatarData(
          dados.periodo.inicio,
        ),
        "",
      ),

      linhaCsv(
        r.periodo,
        r.fim,
        formatarData(
          dados.periodo.fim,
        ),
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.emprestimos,
        dados.circulacao.emprestimos,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.devolucoes,
        dados.circulacao.devolucoes,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.ativos,
        dados.circulacao.ativos,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.atrasados,
        dados.circulacao.atrasados,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.devolvidos,
        dados.circulacao.devolvidos,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.perdidos,
        dados.circulacao.perdidos,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.danificados,
        dados.circulacao.danificados,
        "",
      ),

      linhaCsv(
        r.circulacao,
        r.cancelados,
        dados.circulacao.cancelados,
        "",
      ),

      linhaCsv(
        r.renovacoes,
        r.total,
        dados.renovacoes.total,
        "",
      ),

      linhaCsv(
        r.renovacoes,
        r.solicitadas,
        dados.renovacoes.solicitadas,
        "",
      ),

      linhaCsv(
        r.renovacoes,
        r.aprovadas,
        dados.renovacoes.aprovadas,
        "",
      ),

      linhaCsv(
        r.renovacoes,
        r.recusadas,
        dados.renovacoes.recusadas,
        "",
      ),

      linhaCsv(
        r.renovacoes,
        r.cancelados,
        dados.renovacoes.canceladas,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.total,
        dados.reservas.total,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.aguardando,
        dados.reservas.aguardando,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.disponiveis,
        dados.reservas.disponiveis,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.atendidas,
        dados.reservas.atendidas,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.expiradas,
        dados.reservas.expiradas,
        "",
      ),

      linhaCsv(
        r.reservas,
        r.cancelados,
        dados.reservas.canceladas,
        "",
      ),

      linhaCsv(
        r.multas,
        r.quantidade,
        dados.multas.quantidade,
        "",
      ),

      linhaCsv(
        r.multas,
        r.valorGerado,
        formatarNumero.format(
          dados.multas.valorGerado,
        ),
        "BRL",
      ),

      linhaCsv(
        r.multas,
        r.valorPago,
        formatarNumero.format(
          dados.multas.valorPago,
        ),
        "BRL",
      ),

      linhaCsv(
        r.multas,
        r.valorAberto,
        formatarNumero.format(
          dados.multas.valorEmAberto,
        ),
        "BRL",
      ),

      linhaCsv(
        r.multas,
        r.pendentes,
        dados.multas.pendentes,
        "",
      ),

      linhaCsv(
        r.multas,
        r.pagas,
        dados.multas.pagas,
        "",
      ),

      linhaCsv(
        r.multas,
        r.cancelados,
        dados.multas.canceladas,
        "",
      ),

      linhaCsv(
        r.acervo,
        r.titulos,
        dados.acervo.titulos,
        "",
      ),

      linhaCsv(
        r.acervo,
        r.exemplares,
        dados.acervo.exemplares,
        "",
      ),
    ];

    for (
      const [
        status,
        quantidade,
      ] of Object.entries(
        dados.acervo.porStatus,
      )
    ) {
      linhas.push(
        linhaCsv(
          r.acervo,
          `${r.status}: ${status}`,
          quantidade,
          "",
        ),
      );
    }

    linhas.push(
      linhaCsv(
        r.digital,
        r.acessos,
        dados.digital.acessos,
        "",
      ),

      linhaCsv(
        r.digital,
        r.usuariosUnicos,
        dados.digital.usuariosUnicos,
        "",
      ),

      linhaCsv(
        r.digital,
        r.leituras,
        dados.digital.leituras,
        "",
      ),

      linhaCsv(
        r.digital,
        r.visualizacoes,
        dados.digital.visualizacoes,
        "",
      ),

      linhaCsv(
        r.digital,
        r.downloads,
        dados.digital.downloads,
        "",
      ),

      linhaCsv(
        r.digital,
        r.reproducoes,
        dados.digital.reproducoes,
        "",
      ),

      linhaCsv(
        r.digital,
        r.retomadas,
        dados.digital.retomadas,
        "",
      ),

      linhaCsv(
        r.digital,
        r.conclusoes,
        dados.digital.conclusoesRegistradas,
        "",
      ),

      linhaCsv(
        r.digital,
        r.leiturasConcluidas,
        dados.digital.leiturasConcluidas,
        "",
      ),
    );

    dados.rankings.itensMaisEmprestados.forEach(
      (
        item,
        indice,
      ) => {
        linhas.push(
          linhaCsv(
            r.maisEmprestados,
            `${indice + 1}. ${item.titulo}`,
            item.quantidade,
            item.subtitulo ||
              item.isbn13 ||
              "",
          ),
        );
      },
    );

    dados.rankings.usuariosMaisAtivos.forEach(
      (
        item,
        indice,
      ) => {
        linhas.push(
          linhaCsv(
            r.usuariosAtivos,
            `${indice + 1}. ${item.nome}`,
            item.quantidade,
            item.email || "",
          ),
        );
      },
    );

    const nomeArquivo =
      `biblioteca-relatorios-${dados.periodo.inicio}-${dados.periodo.fim}.csv`;

    return new NextResponse(
      "\uFEFF" +
        linhas.join(
          "\r\n",
        ),
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",

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
