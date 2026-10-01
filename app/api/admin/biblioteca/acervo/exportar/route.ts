import {
  AcaoAuditoriaBiblioteca,
} from "@prisma/client";

import * as XLSX from "xlsx";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

function textoPlanilha(
  valor: unknown,
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  let texto =
    String(valor);

  /*
   * Evita formula injection ao abrir
   * planilhas exportadas em Excel/LibreOffice.
   */
  if (
    /^[=+\-@]/.test(
      texto,
    )
  ) {
    texto =
      `'${texto}`;
  }

  return texto;
}

function dataPlanilha(
  valor:
    | Date
    | null
    | undefined,
) {
  if (!valor) {
    return "";
  }

  return valor
    .toISOString()
    .slice(
      0,
      10,
    );
}

export async function GET(
  request: Request,
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    /*
     * Exportação é leitura em massa.
     * Não permitimos durante impersonação.
     */
    if (
      usuario.impersonacao
    ) {
      throw new ErroBiblioteca(
        403,
        "A exportação do acervo não é permitida durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.ver",
    );

    const itens =
      await prisma
        .bibliotecaItem
        .findMany({
          where: {
            instituicaoId:
              contexto.instituicaoId,
          },

          orderBy: [
            {
              titulo:
                "asc",
            },
            {
              id:
                "asc",
            },
          ],

          select: {
            id: true,
            tipo: true,
            status: true,
            modalidade: true,

            titulo: true,
            subtitulo: true,
            tituloAlternativo:
              true,

            isbn10: true,
            isbn13: true,
            issn: true,
            doi: true,

            idioma: true,
            paisPublicacao:
              true,
            anoPublicacao:
              true,
            dataPublicacao:
              true,

            edicao: true,
            volume: true,
            numero: true,
            numeroPaginas:
              true,

            palavrasChave:
              true,

            classificacaoBibliografica:
              true,
            sistemaClassificacao:
              true,
            edicaoClassificacao:
              true,
            codigoCutter:
              true,
            codigoChamada:
              true,
            cdd: true,
            cdu: true,

            capaUrl: true,
            miniaturaUrl:
              true,

            editora: {
              select: {
                nome: true,
              },
            },

            autores: {
              orderBy: {
                ordem:
                  "asc",
              },

              select: {
                funcao:
                  true,
                ordem:
                  true,

                autor: {
                  select: {
                    nome:
                      true,
                  },
                },
              },
            },

            exemplares: {
              orderBy: {
                id:
                  "asc",
              },

              select: {
                id: true,
                tipo: true,
                status: true,

                codigoInterno:
                  true,
                codigoBarras:
                  true,
                numeroTombo:
                  true,
                patrimonio:
                  true,

                poloIdSnapshot:
                  true,
                unidadeSnapshot:
                  true,
                setor: true,
                sala: true,
                corredor: true,
                estante: true,
                prateleira:
                  true,
                localizacaoCompleta:
                  true,

                dataAquisicao:
                  true,
                formaAquisicao:
                  true,
                fornecedor:
                  true,
                valorAquisicao:
                  true,

                permiteEmprestimo:
                  true,
                observacoes:
                  true,
              },
            },
          },
        });

    const linhas:
      Record<
        string,
        string | number
      >[] = [];

    for (
      const item of
      itens
    ) {
      const autores =
        item.autores
          .filter(
            (vinculo) =>
              String(
                vinculo.funcao,
              ) ===
              "AUTOR",
          )
          .map(
            (vinculo) =>
              vinculo.autor
                .nome,
          )
          .join(
            " | ",
          );

      const coautores =
        item.autores
          .filter(
            (vinculo) =>
              String(
                vinculo.funcao,
              ) !==
              "AUTOR",
          )
          .map(
            (vinculo) =>
              `${vinculo.autor.nome} (${vinculo.funcao})`,
          )
          .join(
            " | ",
          );

      const exemplares =
        item.exemplares
          .length
          ? item.exemplares
          : [null];

      for (
        const exemplar of
        exemplares
      ) {
        linhas.push({
          "ID PHANYX":
            item.id,

          "Título":
            textoPlanilha(
              item.titulo,
            ),

          "Subtítulo":
            textoPlanilha(
              item.subtitulo,
            ),

          "Título alternativo":
            textoPlanilha(
              item.tituloAlternativo,
            ),

          "Tipo":
            textoPlanilha(
              item.tipo,
            ),

          "Status da obra":
            textoPlanilha(
              item.status,
            ),

          "Modalidade":
            textoPlanilha(
              item.modalidade,
            ),

          "Autor":
            textoPlanilha(
              autores,
            ),

          "Outras autorias":
            textoPlanilha(
              coautores,
            ),

          "Editora":
            textoPlanilha(
              item.editora
                ?.nome,
            ),

          "ISBN-10":
            textoPlanilha(
              item.isbn10,
            ),

          "ISBN-13":
            textoPlanilha(
              item.isbn13,
            ),

          "ISSN":
            textoPlanilha(
              item.issn,
            ),

          "DOI":
            textoPlanilha(
              item.doi,
            ),

          "Idioma":
            textoPlanilha(
              item.idioma,
            ),

          "País de publicação":
            textoPlanilha(
              item.paisPublicacao,
            ),

          "Ano":
            item.anoPublicacao ??
            "",

          "Data de publicação":
            dataPlanilha(
              item.dataPublicacao,
            ),

          "Edição":
            textoPlanilha(
              item.edicao,
            ),

          "Volume":
            textoPlanilha(
              item.volume,
            ),

          "Número":
            textoPlanilha(
              item.numero,
            ),

          "Número de páginas":
            item.numeroPaginas ??
            "",

          "Palavras-chave":
            textoPlanilha(
              item.palavrasChave
                .join(
                  " | ",
                ),
            ),

          "Sistema de classificação":
            textoPlanilha(
              item.sistemaClassificacao,
            ),

          "Classificação bibliográfica":
            textoPlanilha(
              item.classificacaoBibliografica,
            ),

          "Edição da classificação":
            textoPlanilha(
              item.edicaoClassificacao,
            ),

          "CDD":
            textoPlanilha(
              item.cdd,
            ),

          "CDU":
            textoPlanilha(
              item.cdu,
            ),

          "Cutter":
            textoPlanilha(
              item.codigoCutter,
            ),

          "Número de chamada":
            textoPlanilha(
              item.codigoChamada,
            ),

          "URL da capa":
            textoPlanilha(
              item.capaUrl,
            ),

          "URL da miniatura":
            textoPlanilha(
              item.miniaturaUrl,
            ),

          "ID do exemplar":
            exemplar?.id ??
            "",

          "Tipo do exemplar":
            textoPlanilha(
              exemplar?.tipo,
            ),

          "Status do exemplar":
            textoPlanilha(
              exemplar?.status,
            ),

          "Código interno":
            textoPlanilha(
              exemplar
                ?.codigoInterno,
            ),

          "Código de barras":
            textoPlanilha(
              exemplar
                ?.codigoBarras,
            ),

          "Tombo":
            textoPlanilha(
              exemplar
                ?.numeroTombo,
            ),

          "Patrimônio":
            textoPlanilha(
              exemplar
                ?.patrimonio,
            ),

          "ID do polo":
            exemplar
              ?.poloIdSnapshot ??
            "",

          "Unidade":
            textoPlanilha(
              exemplar
                ?.unidadeSnapshot,
            ),

          "Setor":
            textoPlanilha(
              exemplar
                ?.setor,
            ),

          "Sala":
            textoPlanilha(
              exemplar
                ?.sala,
            ),

          "Corredor":
            textoPlanilha(
              exemplar
                ?.corredor,
            ),

          "Estante":
            textoPlanilha(
              exemplar
                ?.estante,
            ),

          "Prateleira":
            textoPlanilha(
              exemplar
                ?.prateleira,
            ),

          "Localização completa":
            textoPlanilha(
              exemplar
                ?.localizacaoCompleta,
            ),

          "Data de aquisição":
            dataPlanilha(
              exemplar
                ?.dataAquisicao,
            ),

          "Forma de aquisição":
            textoPlanilha(
              exemplar
                ?.formaAquisicao,
            ),

          "Fornecedor":
            textoPlanilha(
              exemplar
                ?.fornecedor,
            ),

          "Valor de aquisição":
            exemplar
              ?.valorAquisicao !==
            null &&
            exemplar
              ?.valorAquisicao !==
            undefined
              ? Number(
                  exemplar
                    .valorAquisicao,
                )
              : "",

          "Permite empréstimo":
            exemplar
              ? exemplar
                  .permiteEmprestimo
                ? "SIM"
                : "NÃO"
              : "",

          "Observações do exemplar":
            textoPlanilha(
              exemplar
                ?.observacoes,
            ),
        });
      }
    }

    const planilha =
      XLSX.utils
        .json_to_sheet(
          linhas,
        );

    /*
     * Larguras razoáveis para
     * abrir o XLSX já legível.
     */
    planilha["!cols"] = [
      { wch: 12 },
      { wch: 42 },
      { wch: 30 },
      { wch: 30 },
      { wch: 20 },
      { wch: 18 },
      { wch: 22 },
      { wch: 32 },
      { wch: 38 },
      { wch: 30 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 28 },
    ];

    const workbook =
      XLSX.utils
        .book_new();

    XLSX.utils
      .book_append_sheet(
        workbook,
        planilha,
        "Acervo",
      );

    const buffer =
      XLSX.write(
        workbook,
        {
          type:
            "buffer",
          bookType:
            "xlsx",
          compression:
            true,
        },
      ) as Buffer;

    const agora =
      new Date();

    const dataArquivo =
      agora
        .toISOString()
        .slice(
          0,
          10,
        );

    const nomeArquivo =
      `phanyx-acervo-${dataArquivo}.xlsx`;

    const userAgent =
      request.headers
        .get(
          "user-agent",
        )
        ?.slice(
          0,
          2_000,
        ) ??
      null;

    const ip =
      request.headers
        .get(
          "x-forwarded-for",
        )
        ?.split(",")[0]
        ?.trim() ??
      null;

    await prisma
      .bibliotecaAuditoria
      .create({
        data: {
          instituicaoId:
            contexto.instituicaoId,

          usuarioId:
            usuario.id,

          entidade:
            "BibliotecaExportacaoAcervo",

          entidadeId:
            dataArquivo,

          acao:
            AcaoAuditoriaBiblioteca.VISUALIZAR,

          descricao:
            "Acervo exportado em XLSX.",

          metadados: {
            formato:
              "XLSX",

            obras:
              itens.length,

            linhas:
              linhas.length,
          },

          ip,
          userAgent,
        },
      });

    return new Response(
      new Uint8Array(
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
    console.error(
      "ERRO_EXPORTAR_ACERVO",
      erro,
    );

    const resposta =
      respostaErroBiblioteca(
        erro,
      );

    return Response.json(
      resposta.corpo,
      {
        status:
          resposta.status,
      },
    );
  }
}