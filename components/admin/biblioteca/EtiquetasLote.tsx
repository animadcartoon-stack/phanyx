"use client";

import JsBarcode from "jsbarcode";

import {
  useMemo,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

import {
  capacidadeModeloEtiqueta,
  dimensoesFolhaModeloEtiqueta,
  modelosEtiquetaAtivosPorTipo,
  selecionarModeloEtiqueta,
  type ModeloEtiquetaDisponivel,
  type RespostaModelosEtiqueta,
} from "@/lib/biblioteca/modelos-etiqueta";

type TipoLote =
  | "LOMBADA"
  | "CODIGO_BARRAS"
  | "AMBAS";

const LOMBADA_POR_PAGINA_FALLBACK =
  45;

const BARRAS_POR_PAGINA_FALLBACK =
  21;

type DadosLote = {
  instituicao: {
    nome: string;
    unidade: string | null;
    logoUrl: string | null;
    logoTipo: string;
  };

  item: {
    id: number;
    titulo: string;

    sistemaClassificacao:
      | "CDD"
      | "CDU"
      | "OUTRO"
      | null;

    codigoChamada: string | null;
    cdd: string | null;
    cdu: string | null;
    cutter: string | null;
  };

  exemplares: Array<{
    id: number;
    status: string;

    codigoInterno: string;
    codigoBarras: string | null;
    valorCodigoBarras: string;

    numeroTombo: string | null;
    patrimonio: string | null;

    unidadeSnapshot: string | null;
    setor: string | null;
    sala: string | null;
    corredor: string | null;
    estante: string | null;
    prateleira: string | null;
  }>;
};

type Props = {
  itemId: number;
};

function escaparHtml(
  valor: string,
) {
  return valor
    .replaceAll(
      "&",
      "&amp;",
    )
    .replaceAll(
      "<",
      "&lt;",
    )
    .replaceAll(
      ">",
      "&gt;",
    )
    .replaceAll(
      '"',
      "&quot;",
    )
    .replaceAll(
      "'",
      "&#039;",
    );
}

function mm(
  valor: number,
) {
  return (
    Number(
      valor.toFixed(3),
    ) + "mm"
  );
}


function nomeCurtoInstituicao(
  nome: string,
) {
  const antesHifen =
    nome
      .split("-")[0]
      ?.trim();

  if (
    antesHifen &&
    antesHifen.length >= 2 &&
    antesHifen.length <= 10
  ) {
    return antesHifen;
  }

  const palavras =
    nome
      .replace(
        /[^A-Za-z\u00C0-\u00FF0-9 ]/g,
        " ",
      )
      .split(/\s+/)
      .filter(Boolean);

  const sigla =
    palavras
      .filter(
        (palavra) =>
          ![
            "de",
            "da",
            "do",
            "das",
            "dos",
            "e",
          ].includes(
            palavra.toLowerCase(),
          ),
      )
      .map(
        (palavra) =>
          palavra[0],
      )
      .join("")
      .toUpperCase()
      .slice(0, 8);

  return (
    sigla ||
    nome.slice(
      0,
      10,
    )
  );
}

function linhasChamada(
  dados: DadosLote,
) {
  const classificacao =
    dados.item.cdd ||
    dados.item.cdu;

  if (
    classificacao ||
    dados.item.cutter
  ) {
    return [
      classificacao,
      dados.item.cutter,
    ].filter(
      (
        valor,
      ): valor is string =>
        Boolean(valor),
    );
  }

  if (
    dados.item.codigoChamada
  ) {
    const partes =
      dados.item
        .codigoChamada
        .trim()
        .split(/\s+/);

    if (
      partes.length >= 2
    ) {
      return [
        partes[0],
        partes
          .slice(1)
          .join(" "),
      ];
    }

    return [
      dados.item.codigoChamada,
    ];
  }

  return [];
}

function gerarBarcodeSvg(
  valor: string,
) {
  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );

  JsBarcode(
    svg,
    valor,
    {
      format:
        "CODE128",

      width:
        1.5,

      height:
        42,

      margin:
        0,

      displayValue:
        true,

      fontSize:
        12,

      textMargin:
        4,
    },
  );

  return svg.outerHTML;
}

function dividir<T>(
  itens: T[],
  tamanho: number,
) {
  const paginas:
    T[][] = [];

  for (
    let indice = 0;
    indice < itens.length;
    indice += tamanho
  ) {
    paginas.push(
      itens.slice(
        indice,
        indice +
          tamanho,
      ),
    );
  }

  return paginas;
}

function distribuirComInicio<T>(
  itens: T[],
  capacidade: number,
  posicaoInicial: number,
) {
  const inicio =
    Math.min(
      capacidade,
      Math.max(
        1,
        Math.trunc(
          posicaoInicial,
        ) || 1,
      ),
    );

  const paginas:
    Array<
      Array<T | null>
    > = [];

  let indice = 0;

  const primeira:
    Array<T | null> =
      Array.from(
        {
          length:
            inicio - 1,
        },
        () => null,
      );

  while (
    primeira.length <
      capacidade &&
    indice <
      itens.length
  ) {
    primeira.push(
      itens[indice],
    );

    indice++;
  }

  if (
    primeira.length > 0
  ) {
    paginas.push(
      primeira,
    );
  }

  while (
    indice <
    itens.length
  ) {
    const pagina:
      Array<T | null> =
        [];

    while (
      pagina.length <
        capacidade &&
      indice <
        itens.length
    ) {
      pagina.push(
        itens[indice],
      );

      indice++;
    }

    paginas.push(
      pagina,
    );
  }

  return paginas;
}

export default function EtiquetasLote({
  itemId,
}: Props) {
  const t =
    useTranslations(
      "AdminLibraryItemUi",
    );

  const tm =
    useTranslations(
      "AdminLibrarySettings.labelModels",
    );

  const [
    aberto,
    setAberto,
  ] =
    useState(false);

  const [
    carregando,
    setCarregando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState<string | null>(
      null,
    );

  const [
    dados,
    setDados,
  ] =
    useState<DadosLote | null>(
      null,
    );

  const [
    modelosEtiqueta,
    setModelosEtiqueta,
  ] =
    useState<
      ModeloEtiquetaDisponivel[]
    >([]);

  const [
    modeloLombadaId,
    setModeloLombadaId,
  ] =
    useState("");

  const [
    modeloBarrasId,
    setModeloBarrasId,
  ] =
    useState("");

  const [
    selecionados,
    setSelecionados,
  ] =
    useState<Set<number>>(
      new Set(),
    );

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoLote>(
      "LOMBADA",
    );

  const [
    usarFolhaParcial,
    setUsarFolhaParcial,
  ] =
    useState(false);

  const [
    inicioLombada,
    setInicioLombada,
  ] =
    useState(1);

  const [
    inicioBarras,
    setInicioBarras,
  ] =
    useState(1);

  const [
    etapa,
    setEtapa,
  ] =
    useState<
      "SELECAO" |
      "PREVIA"
    >(
      "SELECAO",
    );

  const modelosLombada =
    useMemo(
      () =>
        modelosEtiquetaAtivosPorTipo(
          modelosEtiqueta,
          "LOMBADA",
        ),
      [
        modelosEtiqueta,
      ],
    );

  const modelosBarras =
    useMemo(
      () =>
        modelosEtiquetaAtivosPorTipo(
          modelosEtiqueta,
          "CODIGO_BARRAS",
        ),
      [
        modelosEtiqueta,
      ],
    );

  const modeloLombada =
    useMemo(
      () =>
        selecionarModeloEtiqueta(
          modelosEtiqueta,
          "LOMBADA",
          modeloLombadaId,
        ),
      [
        modelosEtiqueta,
        modeloLombadaId,
      ],
    );

  const modeloBarras =
    useMemo(
      () =>
        selecionarModeloEtiqueta(
          modelosEtiqueta,
          "CODIGO_BARRAS",
          modeloBarrasId,
        ),
      [
        modelosEtiqueta,
        modeloBarrasId,
      ],
    );

  const capacidadeLombada =
    modeloLombada
      ? capacidadeModeloEtiqueta(
          modeloLombada,
        )
      : LOMBADA_POR_PAGINA_FALLBACK;

  const capacidadeBarras =
    modeloBarras
      ? capacidadeModeloEtiqueta(
          modeloBarras,
        )
      : BARRAS_POR_PAGINA_FALLBACK;

  const exemplaresSelecionados =
    useMemo(
      () =>
        dados
          ? dados.exemplares.filter(
              (exemplar) =>
                selecionados.has(
                  exemplar.id,
                ),
            )
          : [],
      [
        dados,
        selecionados,
      ],
    );

  const paginasLombada =
    exemplaresSelecionados.length
      ? Math.ceil(
          (
            inicioLombada -
            1 +
            exemplaresSelecionados.length
          ) /
            capacidadeLombada,
        )
      : 0;

  const paginasBarras =
    exemplaresSelecionados.length
      ? Math.ceil(
          (
            inicioBarras -
            1 +
            exemplaresSelecionados.length
          ) /
            capacidadeBarras,
        )
      : 0;

  const paginasPrevistas =
    tipo === "LOMBADA"
      ? paginasLombada
      : tipo === "CODIGO_BARRAS"
        ? paginasBarras
        : paginasLombada +
          paginasBarras;

  const previewLombada =
    useMemo(
      () => {
        const primeira =
          distribuirComInicio(
            exemplaresSelecionados,
            capacidadeLombada,
            inicioLombada,
          )[0] || [];

        const quantidade =
          usarFolhaParcial
            ? Math.min(
                capacidadeLombada,
                Math.max(
                  primeira.length,
                  inicioLombada -
                    1 +
                    exemplaresSelecionados.length,
                ),
              )
            : Math.min(
                capacidadeLombada,
                modeloLombada
                  ? modeloLombada.colunas *
                    3
                  : 15,
                primeira.length,
              );

        return Array.from(
          {
            length:
              quantidade,
          },
          (
            _,
            indice,
          ) =>
            primeira[
              indice
            ] || null,
        );
      },
      [
        exemplaresSelecionados,
        inicioLombada,
        usarFolhaParcial,
        capacidadeLombada,
        modeloLombada,
      ],
    );

  const previewBarras =
    useMemo(
      () => {
        const primeira =
          distribuirComInicio(
            exemplaresSelecionados,
            capacidadeBarras,
            inicioBarras,
          )[0] || [];

        const quantidade =
          usarFolhaParcial
            ? Math.min(
                capacidadeBarras,
                Math.max(
                  primeira.length,
                  inicioBarras -
                    1 +
                    exemplaresSelecionados.length,
                ),
              )
            : Math.min(
                capacidadeBarras,
                modeloBarras
                  ? modeloBarras.colunas *
                    3
                  : 9,
                primeira.length,
              );

        return Array.from(
          {
            length:
              quantidade,
          },
          (
            _,
            indice,
          ) =>
            primeira[
              indice
            ] || null,
        );
      },
      [
        exemplaresSelecionados,
        inicioBarras,
        usarFolhaParcial,
        capacidadeBarras,
        modeloBarras,
      ],
    );


  async function abrir() {
    setAberto(
      true,
    );

    setEtapa(
      "SELECAO",
    );

    setUsarFolhaParcial(
      false,
    );

    setInicioLombada(
      1,
    );

    setInicioBarras(
      1,
    );

    setErro(
      null,
    );

    setCarregando(
      true,
    );

    try {
      const [
        resposta,
        respostaModelos,
      ] =
        await Promise.all([
          fetch(
            "/api/admin/biblioteca/acervo/" +
              itemId +
              "/etiquetas-lote",
            {
              method:
                "GET",

              cache:
                "no-store",

              credentials:
                "include",
            },
          ),

          fetch(
            "/api/admin/biblioteca/modelos-etiqueta",
            {
              method:
                "GET",

              cache:
                "no-store",

              credentials:
                "include",
            },
          ),
        ]);

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          instituicao?:
            DadosLote["instituicao"];
          item?:
            DadosLote["item"];
          exemplares?:
            DadosLote["exemplares"];
          error?: string;
        };

      const resultadoModelos =
        (await respostaModelos.json()) as
          RespostaModelosEtiqueta;

      if (
        !resposta.ok ||
        !resultado.instituicao ||
        !resultado.item ||
        !Array.isArray(
          resultado.exemplares,
        )
      ) {
        throw new Error(
          resultado.error ||
            t(
              "batchLabelsLoadError",
            ),
        );
      }

      if (
        !respostaModelos.ok ||
        !resultadoModelos.ok ||
        !Array.isArray(
          resultadoModelos.modelos,
        )
      ) {
        throw new Error(
          resultadoModelos.mensagem ||
            resultadoModelos.message ||
            resultadoModelos.error ||
            t(
              "batchLabelsLoadError",
            ),
        );
      }

      const modelosAtivos =
        resultadoModelos.modelos.filter(
          (modelo) =>
            modelo.ativo,
        );

      const padraoLombada =
        selecionarModeloEtiqueta(
          modelosAtivos,
          "LOMBADA",
        );

      const padraoBarras =
        selecionarModeloEtiqueta(
          modelosAtivos,
          "CODIGO_BARRAS",
        );

      if (
        !padraoLombada ||
        !padraoBarras
      ) {
        throw new Error(
          t(
            "batchLabelsLoadError",
          ),
        );
      }

      const recebido:
        DadosLote = {
          instituicao:
            resultado.instituicao,

          item:
            resultado.item,

          exemplares:
            resultado.exemplares,
        };

      setModelosEtiqueta(
        modelosAtivos,
      );

      setModeloLombadaId(
        padraoLombada.id,
      );

      setModeloBarrasId(
        padraoBarras.id,
      );

      setDados(
        recebido,
      );

      setSelecionados(
        new Set(
          recebido.exemplares.map(
            (exemplar) =>
              exemplar.id,
          ),
        ),
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : t(
              "batchLabelsLoadError",
            ),
      );
    } finally {
      setCarregando(
        false,
      );
    }
  }

  function alternar(
    exemplarId: number,
  ) {
    setSelecionados(
      (atual) => {
        const proximo =
          new Set(
            atual,
          );

        if (
          proximo.has(
            exemplarId,
          )
        ) {
          proximo.delete(
            exemplarId,
          );
        } else {
          proximo.add(
            exemplarId,
          );
        }

        return proximo;
      },
    );
  }

  function selecionarTodos() {
    if (!dados) {
      return;
    }

    setSelecionados(
      new Set(
        dados.exemplares.map(
          (exemplar) =>
            exemplar.id,
        ),
      ),
    );
  }

  function limpar() {
    setSelecionados(
      new Set(),
    );
  }

  function imprimirA4() {
    if (
      !dados ||
      exemplaresSelecionados.length ===
        0 ||
      !modeloLombada ||
      !modeloBarras
    ) {
      return;
    }

    setErro(
      null,
    );

    const folhaLombada =
      dimensoesFolhaModeloEtiqueta(
        modeloLombada,
      );

    const folhaBarras =
      dimensoesFolhaModeloEtiqueta(
        modeloBarras,
      );

    const mesmaFolhaFisica =
      Math.abs(
        folhaLombada.larguraMm -
          folhaBarras.larguraMm,
      ) < 0.01 &&
      Math.abs(
        folhaLombada.alturaMm -
          folhaBarras.alturaMm,
      ) < 0.01;

    const usarPaginaCompartilhada =
      tipo !== "AMBAS" ||
      mesmaFolhaFisica;

    const folhaCompartilhada =
      tipo === "CODIGO_BARRAS"
        ? folhaBarras
        : folhaLombada;

    const cssPaginas =
      usarPaginaCompartilhada
        ? `
    @page {
      size:
        ${mm(
          folhaCompartilhada.larguraMm,
        )}
        ${mm(
          folhaCompartilhada.alturaMm,
        )};
      margin: 0;
    }

    .pagina {
      box-sizing: border-box;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .pagina-lombada {
      padding:
        ${mm(
          modeloLombada.margemSuperiorMm,
        )}
        ${mm(
          modeloLombada.margemDireitaMm,
        )}
        ${mm(
          modeloLombada.margemInferiorMm,
        )}
        ${mm(
          modeloLombada.margemEsquerdaMm,
        )};
    }

    .pagina-barras {
      padding:
        ${mm(
          modeloBarras.margemSuperiorMm,
        )}
        ${mm(
          modeloBarras.margemDireitaMm,
        )}
        ${mm(
          modeloBarras.margemInferiorMm,
        )}
        ${mm(
          modeloBarras.margemEsquerdaMm,
        )};
    }`
        : `
    @page pagina-lombada {
      size:
        ${mm(
          folhaLombada.larguraMm,
        )}
        ${mm(
          folhaLombada.alturaMm,
        )};
      margin:
        ${mm(
          modeloLombada.margemSuperiorMm,
        )}
        ${mm(
          modeloLombada.margemDireitaMm,
        )}
        ${mm(
          modeloLombada.margemInferiorMm,
        )}
        ${mm(
          modeloLombada.margemEsquerdaMm,
        )};
    }

    @page pagina-barras {
      size:
        ${mm(
          folhaBarras.larguraMm,
        )}
        ${mm(
          folhaBarras.alturaMm,
        )};
      margin:
        ${mm(
          modeloBarras.margemSuperiorMm,
        )}
        ${mm(
          modeloBarras.margemDireitaMm,
        )}
        ${mm(
          modeloBarras.margemInferiorMm,
        )}
        ${mm(
          modeloBarras.margemEsquerdaMm,
        )};
    }

    .pagina {
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    .pagina-lombada {
      page: pagina-lombada;
    }

    .pagina-barras {
      page: pagina-barras;
    }`;

    let paginasHtml =
      "";

    const logo =
      dados.instituicao
        .logoUrl
        ? escaparHtml(
            dados.instituicao
              .logoUrl,
          )
        : "";

    const nome =
      escaparHtml(
        dados.instituicao
          .nome,
      );

    const nomeCurto =
      escaparHtml(
        nomeCurtoInstituicao(
          dados.instituicao
            .nome,
        ),
      );

    const titulo =
      escaparHtml(
        dados.item.titulo,
      );

    const linhas =
      linhasChamada(
        dados,
      );

    const gerarMarca = (
      classe: string,
      fallback: string,
    ) =>
      logo
        ? `
          <div class="marca ${classe}">
            <img
              src="${logo}"
              alt=""
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
            />
            <div
              class="fallback"
              style="display:none"
            >${fallback}</div>
          </div>
        `
        : `
          <div class="marca ${classe}">
            <div class="fallback">${fallback}</div>
          </div>
        `;

    if (
      tipo ===
        "LOMBADA" ||
      tipo ===
        "AMBAS"
    ) {
      const paginas =
        distribuirComInicio(
          exemplaresSelecionados,
          capacidadeLombada,
          inicioLombada,
        );

      for (
        const pagina
        of paginas
      ) {
        paginasHtml +=
          `<section class="pagina pagina-lombada">
            <div class="grade-lombada">`;

        for (
          const exemplar
          of pagina
        ) {

          if (!exemplar) {
            paginasHtml +=
              '<div class="slot-vazio"></div>';

            continue;
          }
          const chamada =
            linhas.length
              ? linhas
                  .map(
                    (linha) =>
                      `<strong>${escaparHtml(
                        linha,
                      )}</strong>`,
                  )
                  .join("")
              : `<small>${escaparHtml(
                  t(
                    "noCallNumber",
                  ),
                )}</small>`;

          paginasHtml +=
            `<article class="etiqueta lombada">
              ${gerarMarca(
                "marca-lombada",
                nomeCurto,
              )}

              <div class="chamada">
                ${chamada}
              </div>

              <div class="codigo">
                ${escaparHtml(
                  exemplar.codigoInterno,
                )}
              </div>
            </article>`;
        }

        paginasHtml +=
          `</div>
          </section>`;
      }
    }

    if (
      tipo ===
        "CODIGO_BARRAS" ||
      tipo ===
        "AMBAS"
    ) {
      const paginas =
        distribuirComInicio(
          exemplaresSelecionados,
          capacidadeBarras,
          inicioBarras,
        );

      for (
        const pagina
        of paginas
      ) {
        paginasHtml +=
          `<section class="pagina pagina-barras">
            <div class="grade-barras">`;

        for (
          const exemplar
          of pagina
        ) {

          if (!exemplar) {
            paginasHtml +=
              '<div class="slot-vazio"></div>';

            continue;
          }
          let barcode = "";

          try {
            barcode =
              gerarBarcodeSvg(
                exemplar
                  .valorCodigoBarras,
              );
          } catch {
            setErro(
              t(
                "barcodeRenderError",
              ),
            );

            return;
          }

          paginasHtml +=
            `<article class="etiqueta barras">
              ${gerarMarca(
                "marca-barras",
                nome,
              )}

              <div class="titulo">
                ${titulo}
              </div>

              <div class="barcode">
                ${barcode}
              </div>
            </article>`;
        }

        paginasHtml +=
          `</div>
          </section>`;
      }
    }

    const janela =
      window.open(
        "",
        "_blank",
        "width=1100,height=850",
      );

    if (!janela) {
      setErro(
        t(
          "printWindowBlocked",
        ),
      );

      return;
    }

    janela.opener =
      null;

    janela.document.open();

    janela.document.write(
      `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escaparHtml(
        t(
          "batchLabels",
        ),
      )}</title>

<style>
  ${cssPaginas}

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
  }

  .pagina + .pagina {
    page-break-before: always;
    break-before: page;
  }

  .grade-lombada {
    display: grid;
    grid-template-columns:
      repeat(
        ${modeloLombada.colunas},
        ${mm(
          modeloLombada.larguraEtiquetaMm,
        )}
      );
    grid-template-rows:
      repeat(
        ${modeloLombada.linhas},
        ${mm(
          modeloLombada.alturaEtiquetaMm,
        )}
      );
    column-gap:
      ${mm(
        modeloLombada.espacoHorizontalMm,
      )};
    row-gap:
      ${mm(
        modeloLombada.espacoVerticalMm,
      )};
    align-content: start;
    transform:
      translate(
        ${mm(
          modeloLombada.deslocamentoHorizontalMm,
        )},
        ${mm(
          modeloLombada.deslocamentoVerticalMm,
        )}
      );
    transform-origin: top left;
  }

  .grade-barras {
    display: grid;
    grid-template-columns:
      repeat(
        ${modeloBarras.colunas},
        ${mm(
          modeloBarras.larguraEtiquetaMm,
        )}
      );
    grid-template-rows:
      repeat(
        ${modeloBarras.linhas},
        ${mm(
          modeloBarras.alturaEtiquetaMm,
        )}
      );
    column-gap:
      ${mm(
        modeloBarras.espacoHorizontalMm,
      )};
    row-gap:
      ${mm(
        modeloBarras.espacoVerticalMm,
      )};
    align-content: start;
    justify-content: center;
    transform:
      translate(
        ${mm(
          modeloBarras.deslocamentoHorizontalMm,
        )},
        ${mm(
          modeloBarras.deslocamentoVerticalMm,
        )}
      );
    transform-origin: top center;
  }

  .slot-vazio {
  width: 100%;
  height: 100%;
}

.etiqueta {
    overflow: hidden;
    border: 0.25mm solid #000;
    background: #fff;
    color: #000;
    text-align: center;
    break-inside: avoid;
  }

  .lombada {
    width:
      ${mm(
        modeloLombada.larguraEtiquetaMm,
      )};
    height:
      ${mm(
        modeloLombada.alturaEtiquetaMm,
      )};
    padding: 1.5mm;
    display: grid;
    grid-template-rows:
      5.5mm
      1fr
      auto;
  }

  .barras {
    width:
      ${mm(
        modeloBarras.larguraEtiquetaMm,
      )};
    height:
      ${mm(
        modeloBarras.alturaEtiquetaMm,
      )};
    padding: 1.4mm 2mm;
    display: grid;
    grid-template-rows:
      7mm
      auto
      1fr;
  }

  .marca {
    width: 100%;
    min-width: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  .marca img {
    display: block;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  .marca-lombada {
    height: 5.5mm;
  }

  .marca-lombada img {
    max-height: 5mm;
  }

  .marca-barras {
    height: 7mm;
  }

  .marca-barras img {
    max-height: 6.5mm;
  }

  .fallback {
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    font-size: 6.5pt;
    font-weight: 700;
  }

  .chamada {
    align-self: center;
    display: grid;
    gap: 0.3mm;
  }

  .chamada strong {
    font-size: 11pt;
    line-height: 1;
  }

  .chamada small {
    font-size: 7pt;
  }

  .codigo {
    font-size: 6.5pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
  }

  .titulo {
    margin-top: 0.4mm;
    font-size: 5.5pt;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .barcode {
    align-self: center;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }

  .barcode svg {
    max-width: 46mm;
    max-height: 15mm;
  }

  @media print {
    .pagina {
      overflow: hidden;
    }
  }
</style>
</head>

<body>
${paginasHtml}

<script>
  window.addEventListener(
    "load",
    async function () {
      var imagens =
        Array.from(
          document.images || []
        );

      await Promise.all(
        imagens.map(
          function (imagem) {
            if (
              imagem.complete
            ) {
              return Promise.resolve();
            }

            return new Promise(
              function (resolve) {
                imagem.onload =
                  resolve;

                imagem.onerror =
                  resolve;
              }
            );
          }
        )
      );

      window.focus();
      window.print();
    }
  );
</script>
</body>
</html>`,
    );

    janela.document.close();
  }

  return (
    <>
      <button
        type="button"
        className="bib-button bib-button-secondary"
        onClick={() =>
          void abrir()
        }
      >
        {t(
          "batchLabels",
        )}
      </button>

      {aberto ? (
        <div
          className="bib-batch-overlay"
          role="presentation"
          onMouseDown={(
            evento,
          ) => {
            if (
              evento.target ===
              evento.currentTarget
            ) {
              setAberto(
                false,
              );
            }
          }}
        >
          <section
            className="bib-batch-modal"
            role="dialog"
            aria-modal="true"
          >
            <header className="bib-batch-header">
              <div>
                <h2>
                  {t(
                    "batchLabels",
                  )}
                </h2>

                <p>
                  {etapa ===
                  "SELECAO"
                    ? t(
                        "batchLabelsDescription",
                      )
                    : t(
                        "batchLabelsPreviewDescription",
                      )}
                </p>
              </div>

              <button
                type="button"
                className="bib-button bib-button-secondary"
                onClick={() =>
                  setAberto(
                    false,
                  )
                }
              >
                {t(
                  "close",
                )}
              </button>
            </header>

            {carregando ? (
              <div className="bib-compact-empty">
                {t(
                  "loadingBatchLabels",
                )}
              </div>
            ) : erro ? (
              <div
                className="bib-compact-empty"
                role="alert"
              >
                {erro}
              </div>
            ) : dados ? (
              etapa ===
              "SELECAO" ? (
                <>
                  {dados.exemplares.length ? (
                    <>
                      <div className="bib-batch-toolbar">
                        <div>
                          <strong>
                            {t(
                              "selectedCopies",
                              {
                                selected:
                                  selecionados.size,

                                total:
                                  dados.exemplares.length,
                              },
                            )}
                          </strong>

                          <small>
                            {
                              dados.item
                                .titulo
                            }
                          </small>
                        </div>

                        <div className="bib-batch-toolbar-actions">
                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            onClick={
                              selecionarTodos
                            }
                          >
                            {t(
                              "selectAll",
                            )}
                          </button>

                          <button
                            type="button"
                            className="bib-button bib-button-secondary"
                            onClick={
                              limpar
                            }
                          >
                            {t(
                              "clearSelection",
                            )}
                          </button>
                        </div>
                      </div>

                      <fieldset className="bib-batch-type">
                        <legend>
                          {t(
                            "labelType",
                          )}
                        </legend>

                        <label>
                          <input
                            type="radio"
                            name={
                              "tipo-lote-" +
                              itemId
                            }
                            checked={
                              tipo ===
                              "LOMBADA"
                            }
                            onChange={() =>
                              setTipo(
                                "LOMBADA",
                              )
                            }
                          />

                          <span>
                            {t(
                              "batchSpine",
                            )}
                          </span>
                        </label>

                        <label>
                          <input
                            type="radio"
                            name={
                              "tipo-lote-" +
                              itemId
                            }
                            checked={
                              tipo ===
                              "CODIGO_BARRAS"
                            }
                            onChange={() =>
                              setTipo(
                                "CODIGO_BARRAS",
                              )
                            }
                          />

                          <span>
                            {t(
                              "batchBarcode",
                            )}
                          </span>
                        </label>

                        <label>
                          <input
                            type="radio"
                            name={
                              "tipo-lote-" +
                              itemId
                            }
                            checked={
                              tipo ===
                              "AMBAS"
                            }
                            onChange={() =>
                              setTipo(
                                "AMBAS",
                              )
                            }
                          />

                          <span>
                            {t(
                              "batchBoth",
                            )}
                          </span>
                        </label>
                      </fieldset>

                      <div className="bib-batch-models">
                        {(tipo ===
                          "LOMBADA" ||
                          tipo ===
                            "AMBAS") ? (
                          <label>
                            <span>
                              {tm(
                                "types.spine",
                              )}{" "}
                              â€”{" "}
                              {tm(
                                "title",
                              )}
                            </span>

                            <select
                              value={
                                modeloLombada?.id ||
                                ""
                              }
                              onChange={(
                                evento,
                              ) => {
                                setModeloLombadaId(
                                  evento.target.value,
                                );

                                setInicioLombada(
                                  1,
                                );
                              }}
                            >
                              {modelosLombada.map(
                                (
                                  modelo,
                                ) => (
                                  <option
                                    key={
                                      modelo.id
                                    }
                                    value={
                                      modelo.id
                                    }
                                  >
                                    {
                                      modelo.nome
                                    }
                                    {modelo.padrao
                                      ? ` â€” ${tm(
                                          "badges.default",
                                        )}`
                                      : ""}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        ) : null}

                        {(tipo ===
                          "CODIGO_BARRAS" ||
                          tipo ===
                            "AMBAS") ? (
                          <label>
                            <span>
                              {tm(
                                "types.barcode",
                              )}{" "}
                              â€”{" "}
                              {tm(
                                "title",
                              )}
                            </span>

                            <select
                              value={
                                modeloBarras?.id ||
                                ""
                              }
                              onChange={(
                                evento,
                              ) => {
                                setModeloBarrasId(
                                  evento.target.value,
                                );

                                setInicioBarras(
                                  1,
                                );
                              }}
                            >
                              {modelosBarras.map(
                                (
                                  modelo,
                                ) => (
                                  <option
                                    key={
                                      modelo.id
                                    }
                                    value={
                                      modelo.id
                                    }
                                  >
                                    {
                                      modelo.nome
                                    }
                                    {modelo.padrao
                                      ? ` â€” ${tm(
                                          "badges.default",
                                        )}`
                                      : ""}
                                  </option>
                                ),
                              )}
                            </select>
                          </label>
                        ) : null}
                      </div>

                      <section className="bib-batch-partial-sheet">
                  <label className="bib-batch-partial-toggle">
                    <input
                      type="checkbox"
                      checked={
                        usarFolhaParcial
                      }
                      onChange={
                        (evento) => {
                          const ativo =
                            evento.target.checked;

                          setUsarFolhaParcial(
                            ativo,
                          );

                          if (!ativo) {
                            setInicioLombada(
                              1,
                            );

                            setInicioBarras(
                              1,
                            );
                          }
                        }
                      }
                    />

                    <div>
                      <strong>
                        {t(
                          "batchPartialToggle",
                        )}
                      </strong>

                      <span>
                        {t(
                          "batchPartialToggleHelp",
                        )}
                      </span>
                    </div>
                  </label>

                  {usarFolhaParcial ? (
                    <>
                      <div className="bib-batch-start-heading">
                        <strong>
                          {t(
                            "batchStartTitle",
                          )}
                        </strong>

                        <span>
                          {t(
                            "batchStartDescription",
                          )}
                        </span>
                      </div>

                      <div className="bib-batch-start-grids">
                        {tipo ===
                          "LOMBADA" ||
                        tipo ===
                          "AMBAS" ? (
                          <div className="bib-batch-sheet-map">
                            <strong>
                              {t(
                                "batchStartSpine",
                              )}
                            </strong>

                            <small>
                              {modeloLombada?.nome ||
                                ""}
                            </small>

                            <div
                              className="bib-batch-position-grid bib-batch-position-grid-spine"
                              style={{
                                gridTemplateColumns:
                                  `repeat(${modeloLombada?.colunas || 5}, 34px)`,
                              }}
                            >
                              {Array.from(
                                {
                                  length:
                                    capacidadeLombada,
                                },
                                (
                                  _,
                                  indice,
                                ) => {
                                  const posicao =
                                    indice + 1;

                                  const estado =
                                    posicao <
                                    inicioLombada
                                      ? "usada"
                                      : posicao ===
                                          inicioLombada
                                        ? "inicio"
                                        : "livre";

                                  return (
                                    <button
                                      key={
                                        posicao
                                      }
                                      type="button"
                                      className={
                                        "bib-batch-position " +
                                        "bib-batch-position-" +
                                        estado
                                      }
                                      onClick={() =>
                                        setInicioLombada(
                                          posicao,
                                        )
                                      }
                                      aria-label={t(
                                        "batchPositionAria",
                                        {
                                          position:
                                            posicao,
                                        },
                                      )}
                                    >
                                      {
                                        posicao
                                      }
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        ) : null}

                        {tipo ===
                          "CODIGO_BARRAS" ||
                        tipo ===
                          "AMBAS" ? (
                          <div className="bib-batch-sheet-map">
                            <strong>
                              {t(
                                "batchStartBarcode",
                              )}
                            </strong>

                            <small>
                              {modeloBarras?.nome ||
                                ""}
                            </small>

                            <div
                              className="bib-batch-position-grid bib-batch-position-grid-barcode"
                              style={{
                                gridTemplateColumns:
                                  `repeat(${modeloBarras?.colunas || 3}, 44px)`,
                              }}
                            >
                              {Array.from(
                                {
                                  length:
                                    capacidadeBarras,
                                },
                                (
                                  _,
                                  indice,
                                ) => {
                                  const posicao =
                                    indice + 1;

                                  const estado =
                                    posicao <
                                    inicioBarras
                                      ? "usada"
                                      : posicao ===
                                          inicioBarras
                                        ? "inicio"
                                        : "livre";

                                  return (
                                    <button
                                      key={
                                        posicao
                                      }
                                      type="button"
                                      className={
                                        "bib-batch-position " +
                                        "bib-batch-position-" +
                                        estado
                                      }
                                      onClick={() =>
                                        setInicioBarras(
                                          posicao,
                                        )
                                      }
                                      aria-label={t(
                                        "batchPositionAria",
                                        {
                                          position:
                                            posicao,
                                        },
                                      )}
                                    >
                                      {
                                        posicao
                                      }
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="bib-batch-position-legend">
                        <span>
                          <i className="bib-batch-legend-used" />
                          {t(
                            "batchLegendUsed",
                          )}
                        </span>

                        <span>
                          <i className="bib-batch-legend-start" />
                          {t(
                            "batchLegendStart",
                          )}
                        </span>

                        <span>
                          <i className="bib-batch-legend-free" />
                          {t(
                            "batchLegendFree",
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="bib-batch-new-sheet-note">
                      {t(
                        "batchNewSheet",
                      )}
                    </p>
                  )}
                </section>

                <div className="bib-batch-list">
                        {dados.exemplares.map(
                          (
                            exemplar,
                          ) => (
                            <label
                              key={
                                exemplar.id
                              }
                              className="bib-batch-copy"
                            >
                              <input
                                type="checkbox"
                                checked={
                                  selecionados.has(
                                    exemplar.id,
                                  )
                                }
                                onChange={() =>
                                  alternar(
                                    exemplar.id,
                                  )
                                }
                              />

                              <span>
                                <strong>
                                  {
                                    exemplar.codigoInterno
                                  }
                                </strong>

                                <small>
                                  {
                                    exemplar.status
                                  }

                                  {exemplar.numeroTombo
                                    ? " Â· " +
                                      exemplar.numeroTombo
                                    : ""}
                                </small>
                              </span>
                            </label>
                          ),
                        )}
                      </div>

                      <footer className="bib-batch-footer">
                        <button
                          type="button"
                          className="bib-button bib-button-secondary"
                          onClick={() =>
                            setAberto(
                              false,
                            )
                          }
                        >
                          {t(
                            "cancel",
                          )}
                        </button>

                        <button
                          type="button"
                          className="bib-button bib-button-primary"
                          disabled={
                            selecionados.size ===
                            0
                          }
                          onClick={() =>
                            setEtapa(
                              "PREVIA",
                            )
                          }
                        >
                          {t(
                            "previewA4",
                          )}
                        </button>
                      </footer>
                    </>
                  ) : (
                    <div className="bib-compact-empty">
                      {t(
                        "noEligibleCopiesForLabels",
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="bib-batch-preview-summary">
                    <strong>
                      {t(
                        "selectedCopies",
                        {
                          selected:
                            exemplaresSelecionados.length,

                          total:
                            dados.exemplares.length,
                        },
                      )}
                    </strong>

                    <span>
                      {tipo ===
                      "LOMBADA"
                        ? t(
                            "batchSpine",
                          )
                        : tipo ===
                            "CODIGO_BARRAS"
                          ? t(
                              "batchBarcode",
                            )
                          : t(
                              "batchBoth",
                            )}
                    </span>

                    <span>
                      {t(
                        "batchEstimatedPages",
                        {
                          count:
                            paginasPrevistas,
                        },
                      )}
                    </span>
                  </div>

                  {(tipo ===
                    "LOMBADA" ||
                    tipo ===
                      "AMBAS") ? (
                    <div className="bib-a4-preview">
                      <h3>
                        {t(
                          "batchSpine",
                        )}
                      </h3>

                      <div
                        className="bib-a4-mini-grid bib-a4-mini-spine"
                        style={{
                          gridTemplateColumns:
                            `repeat(${modeloLombada?.colunas || 5}, minmax(0, 1fr))`,
                        }}
                      >
                        {previewLombada.map(
                          (
                            exemplar,
                            indice,
                          ) =>
                            exemplar ? (
                              <div
                                key={
                                  "l-" +
                                  exemplar.id
                                }
                                className="bib-a4-mini-label"
                              >
                                {dados.instituicao
                                  .logoUrl ? (
                                  <img
                                    src={
                                      dados.instituicao
                                        .logoUrl
                                    }
                                    alt=""
                                  />
                                ) : (
                                  <b>
                                    {nomeCurtoInstituicao(
                                      dados.instituicao
                                        .nome,
                                    )}
                                  </b>
                                )}

                                {linhasChamada(
                                  dados,
                                ).map(
                                  (
                                    linha,
                                    linhaIndice,
                                  ) => (
                                    <strong
                                      key={
                                        linha +
                                        "-" +
                                        linhaIndice
                                      }
                                    >
                                      {
                                        linha
                                      }
                                    </strong>
                                  ),
                                )}

                                <small>
                                  {
                                    exemplar.codigoInterno
                                  }
                                </small>
                              </div>
                            ) : (
                              <div
                                key={
                                  "lv-" +
                                  indice
                                }
                                className="bib-a4-mini-label bib-a4-mini-slot-vazio"
                                aria-hidden="true"
                              />
                            ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  {(tipo ===
                    "CODIGO_BARRAS" ||
                    tipo ===
                      "AMBAS") ? (
                    <div className="bib-a4-preview">
                      <h3>
                        {t(
                          "batchBarcode",
                        )}
                      </h3>

                      <div
                        className="bib-a4-mini-grid bib-a4-mini-barcode"
                        style={{
                          gridTemplateColumns:
                            `repeat(${modeloBarras?.colunas || 3}, minmax(0, 1fr))`,
                        }}
                      >
                        {previewBarras.map(
                          (
                            exemplar,
                            indice,
                          ) =>
                            exemplar ? (
                              <div
                                key={
                                  "b-" +
                                  exemplar.id
                                }
                                className="bib-a4-mini-label"
                              >
                                {dados.instituicao
                                  .logoUrl ? (
                                  <img
                                    src={
                                      dados.instituicao
                                        .logoUrl
                                    }
                                    alt=""
                                  />
                                ) : (
                                  <b>
                                    {nomeCurtoInstituicao(
                                      dados.instituicao
                                        .nome,
                                    )}
                                  </b>
                                )}

                                <strong>
                                  {
                                    dados.item
                                      .titulo
                                  }
                                </strong>

                                <span
                                  aria-hidden="true"
                                >
                                  |||||||||||||||
                                </span>

                                <small>
                                  {
                                    exemplar.valorCodigoBarras
                                  }
                                </small>
                              </div>
                            ) : (
                              <div
                                key={
                                  "bv-" +
                                  indice
                                }
                                className="bib-a4-mini-label bib-a4-mini-slot-vazio"
                                aria-hidden="true"
                              />
                            ),
                        )}
                      </div>
                    </div>
                  ) : null}

                  <p className="bib-batch-capacity">
                    {[
                      tipo ===
                        "LOMBADA" ||
                      tipo ===
                        "AMBAS"
                        ? `${modeloLombada?.nome || ""}: ${capacidadeLombada} ${tm(
                            "capacity",
                          )}`
                        : null,

                      tipo ===
                        "CODIGO_BARRAS" ||
                      tipo ===
                        "AMBAS"
                        ? `${modeloBarras?.nome || ""}: ${capacidadeBarras} ${tm(
                            "capacity",
                          )}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" Â· ")}
                  </p>

                  <p className="bib-batch-note">
                    {t(
                      "batchA4Note",
                    )}
                  </p>

                  <footer className="bib-batch-footer">
                    <button
                      type="button"
                      className="bib-button bib-button-secondary"
                      onClick={() =>
                        setEtapa(
                          "SELECAO",
                        )
                      }
                    >
                      {t(
                        "backToSelection",
                      )}
                    </button>

                    <button
                      type="button"
                      className="bib-button bib-button-primary"
                      onClick={
                        imprimirA4
                      }
                    >
                      {t(
                        "printA4",
                      )}
                    </button>
                  </footer>
                </>
              )
            ) : null}
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .bib-batch-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(
            0,
            0,
            0,
            0.55
          );
        }

        .bib-batch-modal {
          box-sizing: border-box;
          width: min(
            880px,
            100%
          );
          max-height: calc(
            100vh -
            48px
          );
          overflow-y: auto;
          overflow-x: hidden;
          padding: 22px;
          border: 1px solid
            #dbe3ee;
          border-radius: 18px;
          background: #fff;
          color: #111827;
          box-shadow:
            0 24px 60px
            rgba(
              0,
              0,
              0,
              0.22
            );
        }

        .bib-batch-header {
          display: grid;
          grid-template-columns:
            minmax(0, 1fr)
            auto;
          gap: 16px;
          align-items: start;
        }

        .bib-batch-header h2 {
          margin: 0;
        }

        .bib-batch-header p {
          margin:
            5px 0 0;
          color: #64748b;
        }

        .bib-batch-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin-top: 20px;
          padding: 14px;
          border: 1px solid
            #dbe3ee;
          border-radius: 12px;
        }

        .bib-batch-toolbar
          > div:first-child {
          display: grid;
          gap: 3px;
        }

        .bib-batch-toolbar
          small {
          color: #64748b;
        }

        .bib-batch-toolbar-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .bib-batch-type {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 16px;
          padding: 14px;
          border: 1px solid
            #dbe3ee;
          border-radius: 12px;
        }

        .bib-batch-type legend {
          padding:
            0 6px;
          font-weight: 700;
        }

        .bib-batch-type label {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .bib-batch-models {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap: 12px;
          margin:
            16px 0 14px;
        }

        .bib-batch-models label {
          display: grid;
          gap: 6px;
          min-width: 0;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
        }

        .bib-batch-models select {
          min-height: 40px;
          width: 100%;
          min-width: 0;
          border:
            1px solid
            #cbd5e1;
          border-radius: 10px;
          background: #fff;
          color: #0f172a;
          padding:
            8px 10px;
          font: inherit;
        }

        .bib-batch-partial-sheet {
          margin:
            0 0 14px;
          border:
            1px solid
            #dbe3ef;
          border-radius:
            12px;
          padding:
            12px;
          background:
            #f8fafc;
        }

        .bib-batch-partial-toggle {
          display: flex;
          align-items:
            flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .bib-batch-partial-toggle input {
          margin-top: 3px;
        }

        .bib-batch-partial-toggle div {
          display: grid;
          gap: 3px;
        }

        .bib-batch-partial-toggle strong {
          font-size: 13px;
        }

        .bib-batch-partial-toggle span,
        .bib-batch-start-heading span,
        .bib-batch-new-sheet-note {
          color:
            #64748b;
          font-size:
            12px;
          line-height:
            1.4;
        }

        .bib-batch-start-heading {
          display: grid;
          gap: 3px;
          margin-top:
            12px;
        }

        .bib-batch-start-grids {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap: 12px;
          margin-top:
            12px;
        }

        .bib-batch-sheet-map {
          display: grid;
          gap: 5px;
          border:
            1px solid
            #dbe3ef;
          border-radius:
            12px;
          padding:
            12px;
          background:
            #fff;
        }

        .bib-batch-sheet-map small {
          color:
            #64748b;
          font-size:
            11px;
        }

        .bib-batch-position-grid {
          display: grid;
          gap: 5px;
          justify-content:
            start;
          margin-top: 4px;
        }

        .bib-batch-position-grid-spine {
          grid-template-columns:
            repeat(
              5,
              34px
            );
        }

        .bib-batch-position-grid-barcode {
          grid-template-columns:
            repeat(
              3,
              44px
            );
        }

        .bib-batch-position {
          height: 30px;
          min-width: 0;
          border:
            1px solid
            #cbd5e1;
          border-radius:
            6px;
          background: #fff;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .bib-batch-position:hover {
          border-color:
            #047857;
        }

        .bib-batch-position-usada {
          background:
            #e2e8f0;
          color:
            #94a3b8;
          text-decoration:
            line-through;
        }

        .bib-batch-position-inicio {
          border:
            2px solid
            #047857;
          background:
            #d1fae5;
          color:
            #065f46;
          font-weight: 900;
        }

        .bib-batch-position-livre {
          background:
            #fff;
          color:
            #334155;
        }

        .bib-batch-position-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top:
            12px;
          color:
            #64748b;
          font-size:
            11px;
        }

        .bib-batch-position-legend span {
          display: flex;
          align-items:
            center;
          gap: 5px;
        }

        .bib-batch-position-legend i {
          width: 14px;
          height: 14px;
          display:
            inline-block;
          border-radius:
            4px;
        }

        .bib-batch-legend-used {
          background:
            #e2e8f0;
          border:
            1px solid
            #cbd5e1;
        }

        .bib-batch-legend-start {
          background:
            #d1fae5;
          border:
            2px solid
            #047857;
        }

        .bib-batch-legend-free {
          background:
            #fff;
          border:
            1px solid
            #cbd5e1;
        }

        .bib-batch-list {
          display: grid;
          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );
          gap: 10px;
          margin-top: 16px;
        }

        .bib-batch-copy {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px;
          border: 1px solid
            #dbe3ee;
          border-radius: 12px;
          cursor: pointer;
        }

        .bib-batch-copy span {
          display: grid;
          gap: 3px;
          min-width: 0;
        }

        .bib-batch-copy small {
          color: #64748b;
        }

        .bib-batch-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 20px;
        }

        .bib-batch-preview-summary {
          display: grid;
          grid-template-columns:
            auto
            1fr
            auto;
          align-items: center;
          gap: 12px;
          margin-top: 20px;
          padding: 12px 14px;
          border: 1px solid
            #dbe3ee;
          border-radius: 12px;
        }

        .bib-a4-preview {
          margin-top: 16px;
          padding: 16px;
          border: 1px dashed
            #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
        }

        .bib-a4-preview h3 {
          margin:
            0 0 12px;
        }

        .bib-a4-mini-grid {
          display: grid;
          gap: 7px;
        }

        .bib-a4-mini-spine {
          grid-template-columns:
            repeat(
              5,
              minmax(
                0,
                1fr
              )
            );
        }

        .bib-a4-mini-barcode {
          grid-template-columns:
            repeat(
              3,
              minmax(
                0,
                1fr
              )
            );
        }

        .bib-a4-mini-label.bib-a4-mini-slot-vazio {
          visibility:
            visible;
          pointer-events:
            none;
          border:
            1px dashed
            #cbd5e1;
          background:
            #f8fafc;
          box-shadow:
            none;
          opacity:
            0.72;
        }

        .bib-a4-mini-label {
          min-height: 70px;
          overflow: hidden;
          padding: 6px;
          border: 1px solid
            #111827;
          background: #fff;
          color: #000;
          display: grid;
          place-items: center;
          text-align: center;
          font-size: 9px;
        }

        .bib-a4-mini-label img {
          display: block;
          max-width: 85%;
          max-height: 22px;
          object-fit: contain;
        }

        .bib-a4-mini-label small {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bib-mini-bars {
          font-family: monospace;
          font-size: 10px;
          letter-spacing: -1px;
        }

        .bib-batch-capacity {
          margin:
            12px 0 0;
          font-size: 12px;
          font-weight: 700;
        }

        .bib-batch-note {
          margin:
            12px 0 0;
          color: #64748b;
          font-size: 12px;
        }

        html[data-theme="dark"]
          .bib-a4-mini-label.bib-a4-mini-slot-vazio {
          border-color:
            #475569;
          background:
            #1e293b;
          opacity:
            0.55;
        }

        html[data-theme="dark"]
          .bib-batch-models label,
        html[data-theme="system"]
          .bib-batch-models label {
          color: #e5e7eb;
        }

        html[data-theme="dark"]
          .bib-batch-models select,
        html[data-theme="system"]
          .bib-batch-models select {
          border-color: #52525b;
          background: #18181b;
          color: #fff;
        }

        html[data-theme="dark"]
          .bib-batch-modal,
        html[data-theme="system"]
          .bib-batch-modal {
          background: #2d2d2d;
          border-color: #505050;
          color: #fff;
        }

        html[data-theme="dark"]
          .bib-a4-preview,
        html[data-theme="system"]
          .bib-a4-preview {
          background: #383838;
          border-color: #666;
        }

        html[data-theme="dark"]
          .bib-batch-header p,
        html[data-theme="dark"]
          .bib-batch-toolbar small,
        html[data-theme="dark"]
          .bib-batch-copy small,
        html[data-theme="dark"]
          .bib-batch-note,
        html[data-theme="system"]
          .bib-batch-header p,
        html[data-theme="system"]
          .bib-batch-toolbar small,
        html[data-theme="system"]
          .bib-batch-copy small,
        html[data-theme="system"]
          .bib-batch-note {
          color: #d1d5db;
        }

        @media (
          max-width: 720px
        ) {
          .bib-batch-overlay {
            padding: 10px;
          }

          .bib-batch-modal {
            padding: 16px;
          }

          .bib-batch-header {
            grid-template-columns:
              1fr;
          }

          .bib-batch-list {
            grid-template-columns:
              1fr;
          }

          .bib-batch-models {
            grid-template-columns:
              1fr;
          }

          .bib-batch-start-grids {
            grid-template-columns:
              1fr;
          }

          .bib-batch-preview-summary {
            grid-template-columns:
              1fr;
          }

          .bib-batch-toolbar {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .bib-a4-mini-spine {
            grid-template-columns:
              repeat(
                3,
                minmax(
                  0,
                  1fr
                )
              );
          }
        }
      `}</style>
    </>
  );
}
