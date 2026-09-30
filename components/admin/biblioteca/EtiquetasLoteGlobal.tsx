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

type TipoEtiqueta =
  | "LOMBADA"
  | "CODIGO_BARRAS"
  | "AMBAS";

type ItemExemplar = {
  id: number;
  titulo: string;
  subtitulo: string | null;
  isbn10: string | null;
  isbn13: string | null;
  issn: string | null;
  doi: string | null;
  sistemaClassificacao:
    | "CDD"
    | "CDU"
    | "OUTRO"
    | null;
  codigoChamada: string | null;
  cdd: string | null;
  cdu: string | null;
  codigoCutter: string | null;
};

type ExemplarGlobal = {
  id: number;
  itemId: number;
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
  localizacaoCompleta: string | null;
  item: ItemExemplar;
};

type DadosGlobal = {
  exemplares?: ExemplarGlobal[];
  error?: string;
};

type DadosInstituicao = {
  instituicao?: {
    logoUrl?: string | null;
  };
};

type Props = {
  className?: string;
};

const LOMBADA_POR_PAGINA_FALLBACK =
  45;

const BARRAS_POR_PAGINA_FALLBACK =
  21;

function mm(
  valor: number,
) {
  return (
    Number(
      valor.toFixed(3),
    ) + "mm"
  );
}


function normalizar(
  valor:
    | string
    | null
    | undefined,
) {
  return (
    valor || ""
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase();
}

function distribuirComInicio<T>(
  valores: T[],
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

  const primeiraPagina:
    Array<T | null> =
      Array.from(
        {
          length:
            inicio - 1,
        },
        () => null,
      );

  while (
    primeiraPagina.length <
      capacidade &&
    indice <
      valores.length
  ) {
    primeiraPagina.push(
      valores[indice],
    );

    indice++;
  }

  if (
    primeiraPagina.length >
    0
  ) {
    paginas.push(
      primeiraPagina,
    );
  }

  while (
    indice <
    valores.length
  ) {
    const pagina:
      Array<T | null> =
        [];

    while (
      pagina.length <
        capacidade &&
      indice <
        valores.length
    ) {
      pagina.push(
        valores[indice],
      );

      indice++;
    }

    paginas.push(
      pagina,
    );
  }

  return paginas;
}

function escaparHtml(
  valor:
    | string
    | null
    | undefined,
) {
  return String(
    valor || "",
  )
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

function urlAbsoluta(
  valor:
    | string
    | null
    | undefined,
) {
  if (!valor) {
    return null;
  }

  try {
    return new URL(
      valor,
      window.location.origin,
    ).href;
  } catch {
    return valor;
  }
}

function classificacaoPrincipal(
  item: ItemExemplar,
) {
  if (
    item.sistemaClassificacao ===
      "CDD" &&
    item.cdd
  ) {
    return item.cdd;
  }

  if (
    item.sistemaClassificacao ===
      "CDU" &&
    item.cdu
  ) {
    return item.cdu;
  }

  if (item.cdd) {
    return item.cdd;
  }

  if (item.cdu) {
    return item.cdu;
  }

  const partes =
    item.codigoChamada
      ?.trim()
      .split(/\s+/) ||
    [];

  return (
    partes[0] ||
    ""
  );
}

function cutter(
  item: ItemExemplar,
) {
  if (
    item.codigoCutter
  ) {
    return item.codigoCutter;
  }

  const partes =
    item.codigoChamada
      ?.trim()
      .split(/\s+/) ||
    [];

  if (
    partes.length > 1
  ) {
    return partes
      .slice(1)
      .join(" ");
  }

  return "";
}

function svgCodigoBarras(
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
      displayValue:
        false,
      width:
        1.35,
      height:
        30,
      margin:
        0,
    },
  );

  return svg.outerHTML;
}

export default function EtiquetasLoteGlobal({
  className,
}: Props) {
  const t =
    useTranslations(
      "AdminLibraryCollection",
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
    etapa,
    setEtapa,
  ] =
    useState<
      "SELECAO" |
      "PREVIA"
    >(
      "SELECAO",
    );

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
    exemplares,
    setExemplares,
  ] =
    useState<
      ExemplarGlobal[]
    >([]);

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
    useState<
      Map<
        number,
        ExemplarGlobal
      >
    >(
      new Map(),
    );

  const [
    pesquisa,
    setPesquisa,
  ] =
    useState("");

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoEtiqueta>(
      "LOMBADA",
    );

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
    usarFolhaParcial,
    setUsarFolhaParcial,
  ] =
    useState(false);

  const [
    logoUrl,
    setLogoUrl,
  ] =
    useState<string | null>(
      null,
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

  const filtrados =
    useMemo(
      () => {
        const termo =
          normalizar(
            pesquisa.trim(),
          );

        if (!termo) {
          return exemplares;
        }

        return exemplares.filter(
          (exemplar) => {
            const item =
              exemplar.item;

            const campos = [
              item.titulo,
              item.subtitulo,
              item.isbn10,
              item.isbn13,
              item.issn,
              item.doi,
              item.codigoChamada,
              item.cdd,
              item.cdu,
              item.codigoCutter,
              exemplar.codigoInterno,
              exemplar.codigoBarras,
              exemplar.numeroTombo,
              exemplar.patrimonio,
              exemplar.localizacaoCompleta,
              exemplar.unidadeSnapshot,
              exemplar.setor,
              exemplar.sala,
              exemplar.corredor,
              exemplar.estante,
              exemplar.prateleira,
            ];

            return campos.some(
              (campo) =>
                normalizar(
                  campo,
                ).includes(
                  termo,
                ),
            );
          },
        );
      },
      [
        exemplares,
        pesquisa,
      ],
    );

  const listaSelecionada =
    useMemo(
      () =>
        Array.from(
          selecionados.values(),
        ).sort(
          (
            a,
            b,
          ) => {
            const titulo =
              a.item.titulo.localeCompare(
                b.item.titulo,
                "pt-BR",
                {
                  sensitivity:
                    "base",
                },
              );

            if (
              titulo !== 0
            ) {
              return titulo;
            }

            return a.codigoInterno.localeCompare(
              b.codigoInterno,
              "pt-BR",
              {
                sensitivity:
                  "base",
              },
            );
          },
        ),
      [
        selecionados,
      ],
    );

  const paginasLombada =
    listaSelecionada.length
      ? Math.ceil(
          (
            inicioLombada -
            1 +
            listaSelecionada.length
          ) /
            capacidadeLombada,
        )
      : 0;

  const paginasBarras =
    listaSelecionada.length
      ? Math.ceil(
          (
            inicioBarras -
            1 +
            listaSelecionada.length
          ) /
            capacidadeBarras,
        )
      : 0;

  const paginasPrevistas =
    tipo === "LOMBADA"
      ? paginasLombada
      : tipo ===
          "CODIGO_BARRAS"
        ? paginasBarras
        : paginasLombada +
          paginasBarras;

  async function carregar() {
    setCarregando(
      true,
    );

    setErro(
      null,
    );

    try {
      const [
        resposta,
        respostaModelos,
      ] =
        await Promise.all([
          fetch(
            "/api/admin/biblioteca/acervo/etiquetas-lote-global",
            {
              cache:
                "no-store",
            },
          ),

          fetch(
            "/api/admin/biblioteca/modelos-etiqueta",
            {
              cache:
                "no-store",

              credentials:
                "include",
            },
          ),
        ]);

      const dados =
        (await resposta.json()) as
          DadosGlobal;

      const dadosModelos =
        (await respostaModelos.json()) as
          RespostaModelosEtiqueta;

      if (
        !resposta.ok
      ) {
        throw new Error(
          dados.error ||
            t(
              "globalBatchLoadError",
            ),
        );
      }

      if (
        !respostaModelos.ok ||
        !dadosModelos.ok ||
        !Array.isArray(
          dadosModelos.modelos,
        )
      ) {
        throw new Error(
          dadosModelos.mensagem ||
            dadosModelos.message ||
            dadosModelos.error ||
            t(
              "globalBatchLoadError",
            ),
        );
      }

      const modelosAtivos =
        dadosModelos.modelos.filter(
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
            "globalBatchLoadError",
          ),
        );
      }

      setModelosEtiqueta(
        modelosAtivos,
      );

      setModeloLombadaId(
        padraoLombada.id,
      );

      setModeloBarrasId(
        padraoBarras.id,
      );

      const registros =
        dados.exemplares ||
        [];

      setExemplares(
        registros,
      );

      /*
       * Reaproveita o endpoint individual
       * apenas para obter a logo institucional,
       * mantendo exatamente a mesma infraestrutura
       * jÃ¡ usada nas etiquetas existentes.
       */
      if (
        registros.length > 0
      ) {
        try {
          const meta =
            await fetch(
              "/api/admin/biblioteca/acervo/" +
                registros[0]
                  .itemId +
                "/etiquetas-lote",
              {
                cache:
                  "no-store",
              },
            );

          if (meta.ok) {
            const dadosMeta =
              (await meta.json()) as
                DadosInstituicao;

            setLogoUrl(
              dadosMeta
                .instituicao
                ?.logoUrl ||
                null,
            );
          }
        } catch {
          setLogoUrl(
            null,
          );
        }
      }
    } catch (
      erroCarregamento
    ) {
      setErro(
        erroCarregamento instanceof
          Error
          ? erroCarregamento.message
          : t(
              "globalBatchLoadError",
            ),
      );
    } finally {
      setCarregando(
        false,
      );
    }
  }

  function abrir() {
    setAberto(true);
    setEtapa(
      "SELECAO",
    );
    setPesquisa("");
    setSelecionados(
      new Map(),
    );

    setInicioLombada(
      1,
    );

    setInicioBarras(
      1,
    );

    setUsarFolhaParcial(
      false,
    );

    void carregar();
  }

  function fechar() {
    setAberto(false);
    setEtapa(
      "SELECAO",
    );
  }

  function alternar(
    exemplar: ExemplarGlobal,
  ) {
    setSelecionados(
      (atual) => {
        const proximo =
          new Map(
            atual,
          );

        if (
          proximo.has(
            exemplar.id,
          )
        ) {
          proximo.delete(
            exemplar.id,
          );
        } else {
          proximo.set(
            exemplar.id,
            exemplar,
          );
        }

        return proximo;
      },
    );
  }

  function selecionarFiltrados() {
    setSelecionados(
      (atual) => {
        const proximo =
          new Map(
            atual,
          );

        for (
          const exemplar
          of filtrados
        ) {
          proximo.set(
            exemplar.id,
            exemplar,
          );
        }

        return proximo;
      },
    );
  }

  function limparSelecao() {
    setSelecionados(
      new Map(),
    );
  }

  function gerarLogo(
    classe: string,
  ) {
    const logo =
      urlAbsoluta(
        logoUrl,
      );

    if (!logo) {
      return `
        <div class="${classe} logo-fallback">
          PHANYX
        </div>
      `;
    }

    return `
      <img
        class="${classe}"
        src="${escaparHtml(
          logo,
        )}"
        alt=""
      />
    `;
  }

  function etiquetaLombada(
    exemplar: ExemplarGlobal,
  ) {
    const principal =
      classificacaoPrincipal(
        exemplar.item,
      );

    const codigoCutter =
      cutter(
        exemplar.item,
      );

    return `
      <div class="etiqueta etiqueta-lombada">
        ${gerarLogo(
          "logo-lombada",
        )}

        ${
          principal
            ? `<strong>${escaparHtml(
                principal,
              )}</strong>`
            : ""
        }

        ${
          codigoCutter
            ? `<strong>${escaparHtml(
                codigoCutter,
              )}</strong>`
            : ""
        }

        <small>
          ${escaparHtml(
            exemplar.codigoInterno,
          )}
        </small>
      </div>
    `;
  }

  function etiquetaBarras(
    exemplar: ExemplarGlobal,
  ) {
    const barras =
      svgCodigoBarras(
        exemplar.valorCodigoBarras,
      );

    return `
      <div class="etiqueta etiqueta-barras">
        ${gerarLogo(
          "logo-barras",
        )}

        <div class="titulo">
          ${escaparHtml(
            exemplar.item.titulo,
          )}
        </div>

        <div class="barcode">
          ${barras}
        </div>

        <div class="codigo">
          ${escaparHtml(
            exemplar.valorCodigoBarras,
          )}
        </div>
      </div>
    `;
  }

  function imprimir() {
    if (
      listaSelecionada.length ===
        0 ||
      !modeloLombada ||
      !modeloBarras
    ) {
      return;
    }

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

    const paginas:
      string[] = [];

    if (
      tipo === "LOMBADA" ||
      tipo === "AMBAS"
    ) {
      const lotes =
        distribuirComInicio(
          listaSelecionada,
          capacidadeLombada,
          inicioLombada,
        );

      for (
        const lote
        of lotes
      ) {
        paginas.push(`
          <section class="pagina pagina-lombada">
            <div class="grade grade-lombada">
              ${lote
                .map(
                  (exemplar) =>
                    exemplar
                      ? etiquetaLombada(
                          exemplar,
                        )
                      : '<div class="slot-vazio"></div>',
                )
                .join("")}
            </div>
          </section>
        `);
      }
    }

    if (
      tipo ===
        "CODIGO_BARRAS" ||
      tipo === "AMBAS"
    ) {
      const lotes =
        distribuirComInicio(
          listaSelecionada,
          capacidadeBarras,
          inicioBarras,
        );

      for (
        const lote
        of lotes
      ) {
        paginas.push(`
          <section class="pagina pagina-barras">
            <div class="grade grade-barras">
              ${lote
                .map(
                  (exemplar) =>
                    exemplar
                      ? etiquetaBarras(
                          exemplar,
                        )
                      : '<div class="slot-vazio"></div>',
                )
                .join("")}
            </div>
          </section>
        `);
      }
    }

    const janela =
      window.open(
        "",
        "_blank",
        "width=1100,height=800",
      );

    if (!janela) {
      return;
    }

    janela.document.open();

    janela.document.write(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />

  <title>
    ${escaparHtml(
      t(
        "globalBatchTitle",
      ),
    )}
  </title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    ${cssPaginas}

    .pagina + .pagina {
      break-before: page;
      page-break-before: always;
    }

    .grade {
      display: grid;
      align-content: start;
      justify-content: start;
    }

    .grade-lombada {
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

      transform:
        translate(
          ${mm(
            modeloLombada.deslocamentoHorizontalMm,
          )},
          ${mm(
            modeloLombada.deslocamentoVerticalMm,
          )}
        );

      transform-origin:
        top left;
    }

    .grade-barras {
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

      transform:
        translate(
          ${mm(
            modeloBarras.deslocamentoHorizontalMm,
          )},
          ${mm(
            modeloBarras.deslocamentoVerticalMm,
          )}
        );

      transform-origin:
        top left;
    }

    .slot-vazio {
      width: 100%;
      height: 100%;
    }

    .etiqueta {
      background: #fff;
      border:
        0.2mm solid #111;
      overflow: hidden;
      color: #111;
    }

    .etiqueta-lombada {
      width:
        ${mm(
          modeloLombada.larguraEtiquetaMm,
        )};
      height:
        ${mm(
          modeloLombada.alturaEtiquetaMm,
        )};
      padding:
        1.6mm 1.2mm;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text-align: center;
      line-height: 1.05;
    }

    .logo-lombada {
      display: block;
      max-width: 13mm;
      max-height: 5mm;
      object-fit: contain;
      margin-bottom: 1mm;
    }

    .etiqueta-lombada strong {
      display: block;
      max-width: 100%;
      font-size: 8pt;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .etiqueta-lombada small {
      display: block;
      margin-top: 1mm;
      max-width: 100%;
      font-size: 5.5pt;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .etiqueta-barras {
      width:
        ${mm(
          modeloBarras.larguraEtiquetaMm,
        )};
      height:
        ${mm(
          modeloBarras.alturaEtiquetaMm,
        )};
      padding:
        1.3mm 1.5mm;

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      text-align: center;
    }

    .logo-barras {
      display: block;
      max-width: 18mm;
      max-height: 5mm;
      object-fit: contain;
      margin-bottom: 0.6mm;
    }

    .titulo {
      width: 100%;
      max-height: 6mm;
      overflow: hidden;
      font-size: 5.5pt;
      font-weight: 700;
      line-height: 1.1;
      margin-bottom: 0.5mm;
    }

    .barcode {
      width: 42mm;
      height: 9mm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .barcode svg {
      width: 100%;
      height: 100%;
    }

    .codigo {
      margin-top: 0.5mm;
      font-size: 5.5pt;
      font-weight: 700;
    }

    .logo-fallback {
      font-size: 5pt;
      font-weight: 800;
    }

    @media screen {
      body {
        padding: 10mm;
      }

      .pagina-lombada {
        min-height:
          ${mm(
            folhaLombada.alturaMm -
              modeloLombada.margemSuperiorMm -
              modeloLombada.margemInferiorMm,
          )};
      }

      .pagina-barras {
        min-height:
          ${mm(
            folhaBarras.alturaMm -
              modeloBarras.margemSuperiorMm -
              modeloBarras.margemInferiorMm,
          )};
      }
    }

    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>

<body>
  ${paginas.join("")}

  <script>
    window.addEventListener(
      "load",
      function () {
        window.setTimeout(
          function () {
            window.focus();
            window.print();
          },
          250
        );
      }
    );
  </script>
</body>
</html>
    `);

    janela.document.close();
  }

  const previewLombada =
    distribuirComInicio(
      listaSelecionada,
      capacidadeLombada,
      inicioLombada,
    )[0] || [];

  const previewBarras =
    distribuirComInicio(
      listaSelecionada,
      capacidadeBarras,
      inicioBarras,
    )[0] || [];

  return (
    <>
      <button
        type="button"
        className={
          className
        }
        onClick={
          abrir
        }
      >
        {t(
          "globalBatchButton",
        )}
      </button>

      {aberto ? (
        <div
          className="bib-global-batch-backdrop"
          role="presentation"
          onMouseDown={
            (evento) => {
              if (
                evento.target ===
                evento.currentTarget
              ) {
                fechar();
              }
            }
          }
        >
          <div
            className="bib-global-batch-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t(
              "globalBatchTitle",
            )}
          >
            <header className="bib-global-batch-header">
              <div>
                <h2>
                  {t(
                    "globalBatchTitle",
                  )}
                </h2>

                <p>
                  {etapa ===
                  "SELECAO"
                    ? t(
                        "globalBatchDescription",
                      )
                    : t(
                        "globalBatchPreviewDescription",
                      )}
                </p>
              </div>

              <button
                type="button"
                className="bib-global-batch-close"
                onClick={
                  fechar
                }
              >
                {t(
                  "globalBatchClose",
                )}
              </button>
            </header>

            {carregando ? (
              <div className="bib-global-batch-state">
                {t(
                  "globalBatchLoading",
                )}
              </div>
            ) : erro ? (
              <div className="bib-global-batch-error">
                {erro}

                <button
                  type="button"
                  onClick={() =>
                    void carregar()
                  }
                >
                  {t(
                    "globalBatchRetry",
                  )}
                </button>
              </div>
            ) : etapa ===
              "SELECAO" ? (
              <>
                <div className="bib-global-batch-toolbar">
                  <div className="bib-global-batch-search">
                    <label
                      htmlFor="bib-global-label-search"
                    >
                      {t(
                        "globalBatchSearchLabel",
                      )}
                    </label>

                    <input
                      id="bib-global-label-search"
                      type="search"
                      value={
                        pesquisa
                      }
                      onChange={
                        (evento) =>
                          setPesquisa(
                            evento
                              .target
                              .value,
                          )
                      }
                      placeholder={t(
                        "globalBatchSearchPlaceholder",
                      )}
                    />
                  </div>

                  <div className="bib-global-batch-count">
                    <strong>
                      {t(
                        "globalBatchEligible",
                        {
                          count:
                            filtrados.length,
                        },
                      )}
                    </strong>

                    <span>
                      {t(
                        "globalBatchSelected",
                        {
                          count:
                            selecionados.size,
                        },
                      )}
                    </span>
                  </div>
                </div>

                <div className="bib-global-batch-actions">
                  <button
                    type="button"
                    onClick={
                      selecionarFiltrados
                    }
                    disabled={
                      filtrados.length ===
                      0
                    }
                  >
                    {t(
                      "globalBatchSelectFiltered",
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={
                      limparSelecao
                    }
                    disabled={
                      selecionados.size ===
                      0
                    }
                  >
                    {t(
                      "globalBatchClear",
                    )}
                  </button>
                </div>

                <fieldset className="bib-global-batch-type">
                  <legend>
                    {t(
                      "globalBatchLabelType",
                    )}
                  </legend>

                  <label>
                    <input
                      type="radio"
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

                    {t(
                      "globalBatchSpine",
                    )}
                  </label>

                  <label>
                    <input
                      type="radio"
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

                    {t(
                      "globalBatchBarcode",
                    )}
                  </label>

                  <label>
                    <input
                      type="radio"
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

                    {t(
                      "globalBatchBoth",
                    )}
                  </label>
                </fieldset>

                <div className="bib-global-batch-models">
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

                <section className="bib-global-batch-start">
                  <label className="bib-global-partial-toggle">
                    <input
                      type="checkbox"
                      checked={
                        usarFolhaParcial
                      }
                      onChange={
                        (evento) => {
                          const ativo =
                            evento
                              .target
                              .checked;

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
                          "globalBatchPartialToggle",
                        )}
                      </strong>

                      <span>
                        {t(
                          "globalBatchPartialToggleHelp",
                        )}
                      </span>
                    </div>
                  </label>

                  {usarFolhaParcial ? (
                    <>
                      <div className="bib-global-batch-start-heading">
                        <strong>
                          {t(
                            "globalBatchStartTitle",
                          )}
                        </strong>

                        <span>
                          {t(
                            "globalBatchStartDescription",
                          )}
                        </span>
                      </div>

                      <div className="bib-global-batch-start-fields">
                        {tipo ===
                          "LOMBADA" ||
                        tipo ===
                          "AMBAS" ? (
                          <div className="bib-global-sheet-selector">
                            <div className="bib-global-sheet-selector-heading">
                              <strong>
                                {t(
                                  "globalBatchStartSpine",
                                )}
                              </strong>

                              <span>
                                {modeloLombada?.nome ||
                                  ""}
                              </span>
                            </div>

                            <div
                              className="bib-global-position-grid bib-global-position-grid-spine"
                              style={{
                                gridTemplateColumns:
                                  `repeat(${modeloLombada?.colunas || 5}, 34px)`,
                              }}
                              aria-label={t(
                                "globalBatchStartSpine",
                              )}
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
                                    indice +
                                    1;

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
                                        "bib-global-position " +
                                        "bib-global-position-" +
                                        estado
                                      }
                                      onClick={() =>
                                        setInicioLombada(
                                          posicao,
                                        )
                                      }
                                      aria-label={t(
                                        "globalBatchPositionAria",
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
                          <div className="bib-global-sheet-selector">
                            <div className="bib-global-sheet-selector-heading">
                              <strong>
                                {t(
                                  "globalBatchStartBarcode",
                                )}
                              </strong>

                              <span>
                                {modeloBarras?.nome ||
                                  ""}
                              </span>
                            </div>

                            <div
                              className="bib-global-position-grid bib-global-position-grid-barcode"
                              style={{
                                gridTemplateColumns:
                                  `repeat(${modeloBarras?.colunas || 3}, 44px)`,
                              }}
                              aria-label={t(
                                "globalBatchStartBarcode",
                              )}
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
                                    indice +
                                    1;

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
                                        "bib-global-position " +
                                        "bib-global-position-" +
                                        estado
                                      }
                                      onClick={() =>
                                        setInicioBarras(
                                          posicao,
                                        )
                                      }
                                      aria-label={t(
                                        "globalBatchPositionAria",
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

                      <div className="bib-global-position-legend">
                        <span>
                          <i className="bib-global-legend-used" />
                          {t(
                            "globalBatchLegendUsed",
                          )}
                        </span>

                        <span>
                          <i className="bib-global-legend-start" />
                          {t(
                            "globalBatchLegendStart",
                          )}
                        </span>

                        <span>
                          <i className="bib-global-legend-free" />
                          {t(
                            "globalBatchLegendFree",
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="bib-global-new-sheet-note">
                      {t(
                        "globalBatchNewSheet",
                      )}
                    </div>
                  )}
                </section>

                <div className="bib-global-batch-list">
                  {filtrados.length ===
                  0 ? (
                    <div className="bib-global-batch-empty">
                      {t(
                        "globalBatchNoCopies",
                      )}
                    </div>
                  ) : (
                    filtrados.map(
                      (
                        exemplar,
                      ) => (
                        <label
                          key={
                            exemplar.id
                          }
                          className="bib-global-batch-copy"
                        >
                          <input
                            type="checkbox"
                            checked={selecionados.has(
                              exemplar.id,
                            )}
                            onChange={() =>
                              alternar(
                                exemplar,
                              )
                            }
                          />

                          <div>
                            <strong>
                              {
                                exemplar
                                  .codigoInterno
                              }
                            </strong>

                            <span className="bib-global-batch-title">
                              {
                                exemplar
                                  .item
                                  .titulo
                              }
                            </span>

                            <small>
                              {
                                exemplar.status
                              }

                              {exemplar.numeroTombo
                                ? ` \u00b7 ${exemplar.numeroTombo}`
                                : ""}

                              {exemplar.item.codigoChamada
                                ? ` \u00b7 ${exemplar.item.codigoChamada}`
                                : ""}
                            </small>
                          </div>
                        </label>
                      ),
                    )
                  )}
                </div>

                <footer className="bib-global-batch-footer">
                  <button
                    type="button"
                    onClick={
                      fechar
                    }
                    className="bib-global-batch-secondary"
                  >
                    {t(
                      "globalBatchCancel",
                    )}
                  </button>

                  <button
                    type="button"
                    className="bib-global-batch-primary"
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
                      "globalBatchPreview",
                    )}
                  </button>
                </footer>
              </>
            ) : (
              <>
                <div className="bib-global-batch-summary">
                  <strong>
                    {t(
                      "globalBatchSelected",
                      {
                        count:
                          listaSelecionada.length,
                      },
                    )}
                  </strong>

                  <span>
                    {t(
                      "globalBatchEstimatedPages",
                      {
                        count:
                          paginasPrevistas,
                      },
                    )}
                  </span>
                </div>

                {tipo ===
                  "LOMBADA" ||
                tipo ===
                  "AMBAS" ? (
                  <section className="bib-global-preview-section">
                    <h3>
                      {t(
                        "globalBatchSpine",
                      )}
                    </h3>

                    
<div
  className="bib-global-preview-spine"
  style={{
    gridTemplateColumns:
      `repeat(${modeloLombada?.colunas || 5}, 123px)`,
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
            "s-" +
            exemplar.id
          }
          className="bib-global-preview-spine-label"
        >
          {logoUrl ? (
            <img
              src={
                logoUrl
              }
              alt=""
            />
          ) : (
            <b>
              PHANYX
            </b>
          )}

          <strong>
            {classificacaoPrincipal(
              exemplar.item,
            )}
          </strong>

          <strong>
            {cutter(
              exemplar.item,
            )}
          </strong>

          <small>
            {
              exemplar.codigoInterno
            }
          </small>
        </div>
      ) : (
        <div
          key={
            "sv-" +
            indice
          }
          className="bib-global-preview-spine-label bib-global-preview-slot-vazio"
          aria-hidden="true"
        />
      ),
  )}
</div>
                  </section>
                ) : null}

                {tipo ===
                  "CODIGO_BARRAS" ||
                tipo ===
                  "AMBAS" ? (
                  <section className="bib-global-preview-section">
                    <h3>
                      {t(
                        "globalBatchBarcode",
                      )}
                    </h3>

                    
<div
  className="bib-global-preview-barcode"
  style={{
    gridTemplateColumns:
      `repeat(${modeloBarras?.colunas || 3}, 176px)`,
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
          className="bib-global-preview-barcode-label"
        >
          {logoUrl ? (
            <img
              src={
                logoUrl
              }
              alt=""
            />
          ) : (
            <b>
              PHANYX
            </b>
          )}

          <strong>
            {
              exemplar
                .item
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
              exemplar
                .valorCodigoBarras
            }
          </small>
        </div>
      ) : (
        <div
          key={
            "bv-" +
            indice
          }
          className="bib-global-preview-barcode-label bib-global-preview-slot-vazio"
          aria-hidden="true"
        />
      ),
  )}
</div>
                  </section>
                ) : null}

                <p className="bib-global-capacity">
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

                <p className="bib-global-print-note">
                  {t(
                    "globalBatchPrintNote",
                  )}
                </p>

                <footer className="bib-global-batch-footer">
                  <button
                    type="button"
                    className="bib-global-batch-secondary"
                    onClick={() =>
                      setEtapa(
                        "SELECAO",
                      )
                    }
                  >
                    {t(
                      "globalBatchBack",
                    )}
                  </button>

                  <button
                    type="button"
                    className="bib-global-batch-primary"
                    onClick={
                      imprimir
                    }
                  >
                    {t(
                      "globalBatchPrint",
                    )}
                  </button>
                </footer>
              </>
            )}
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .bib-global-batch-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            rgba(
              15,
              23,
              42,
              0.62
            );
        }

        .bib-global-batch-modal {
          width:
            min(
              960px,
              96vw
            );
          max-height: 90vh;
          overflow: auto;
          border:
            1px solid
            #dbe3ef;
          border-radius: 18px;
          background:
            #ffffff;
          color:
            #111827;
          box-shadow:
            0 28px 80px
            rgba(
              15,
              23,
              42,
              0.28
            );
          padding: 20px;
        }

        .bib-global-batch-header {
          display: flex;
          align-items:
            flex-start;
          justify-content:
            space-between;
          gap: 20px;
          margin-bottom:
            18px;
        }

        .bib-global-batch-header h2,
        .bib-global-preview-section h3 {
          margin: 0;
          color: inherit;
        }

        .bib-global-batch-header p {
          margin:
            4px 0 0;
          color:
            #64748b;
          font-size:
            13px;
        }

        .bib-global-batch-close,
        .bib-global-batch-actions button,
        .bib-global-batch-secondary,
        .bib-global-batch-primary {
          min-height: 38px;
          border-radius: 10px;
          padding:
            8px 14px;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }

        .bib-global-batch-close,
        .bib-global-batch-actions button,
        .bib-global-batch-secondary {
          border:
            1px solid
            #cbd5e1;
          background:
            #fff;
          color:
            #0f172a;
        }

        .bib-global-batch-primary {
          border:
            1px solid
            #047857;
          background:
            #047857;
          color:
            #fff;
        }

        .bib-global-batch-actions button:disabled,
        .bib-global-batch-primary:disabled {
          opacity: 0.48;
          cursor:
            not-allowed;
        }

        .bib-global-batch-toolbar {
          display: grid;
          grid-template-columns:
            minmax(
              0,
              1fr
            )
            auto;
          gap: 16px;
          align-items: end;
        }

        .bib-global-batch-search {
          display: grid;
          gap: 6px;
        }

        .bib-global-batch-search label {
          font-size:
            12px;
          font-weight:
            800;
        }

        .bib-global-batch-search input {
          width: 100%;
          min-height: 42px;
          border:
            1px solid
            #cbd5e1;
          border-radius:
            10px;
          background:
            #fff;
          color:
            #0f172a;
          padding:
            8px 12px;
        }

        .bib-global-batch-count {
          display: grid;
          gap: 2px;
          text-align: right;
        }

        .bib-global-batch-count span {
          color:
            #64748b;
          font-size:
            12px;
        }

        .bib-global-batch-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin:
            14px 0;
        }

        .bib-global-batch-type {
          display: flex;
          flex-wrap: wrap;
          gap:
            12px 18px;
          margin:
            0 0 16px;
          border:
            1px solid
            #dbe3ef;
          border-radius:
            12px;
          padding:
            12px;
        }

        .bib-global-batch-type legend {
          padding:
            0 6px;
          font-weight:
            800;
        }

        .bib-global-batch-type label {
          display: flex;
          align-items:
            center;
          gap: 6px;
        }

        .bib-global-batch-models {
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
            0 0 16px;
        }

        .bib-global-batch-models label {
          display: grid;
          gap: 6px;
          min-width: 0;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
        }

        .bib-global-batch-models select {
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

        .bib-global-batch-start {
          margin:
            0 0 16px;
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

        .bib-global-batch-start-heading {
          display: grid;
          gap: 3px;
          margin-bottom:
            12px;
        }

        .bib-global-batch-start-heading span {
          color:
            #64748b;
          font-size:
            12px;
          line-height:
            1.4;
        }

        .bib-global-batch-start-fields {
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
        }

        .bib-global-batch-start-fields label {
          display: grid;
          gap: 5px;
          min-width: 0;
        }

        .bib-global-batch-start-fields label > span {
          font-size:
            12px;
          font-weight:
            800;
        }

        .bib-global-batch-start-fields input {
          width: 100%;
          min-height:
            40px;
          border:
            1px solid
            #cbd5e1;
          border-radius:
            9px;
          background:
            #fff;
          color:
            #0f172a;
          padding:
            7px 10px;
          font: inherit;
        }

        .bib-global-batch-start-fields small {
          color:
            #64748b;
          font-size:
            11px;
          line-height:
            1.35;
        }

        .bib-global-partial-toggle {
          display: flex;
          align-items:
            flex-start;
          gap: 10px;
          cursor: pointer;
        }

        .bib-global-partial-toggle input {
          margin-top: 3px;
        }

        .bib-global-partial-toggle div {
          display: grid;
          gap: 3px;
        }

        .bib-global-partial-toggle strong {
          font-size: 13px;
        }

        .bib-global-partial-toggle span {
          color: #64748b;
          font-size: 12px;
          line-height: 1.4;
        }

        .bib-global-new-sheet-note {
          margin-top: 10px;
          color: #64748b;
          font-size: 12px;
        }

        .bib-global-sheet-selector {
          min-width: 0;
          border:
            1px solid
            #dbe3ef;
          border-radius: 12px;
          background: #fff;
          padding: 12px;
        }

        .bib-global-sheet-selector-heading {
          display: grid;
          gap: 2px;
          margin-bottom: 10px;
        }

        .bib-global-sheet-selector-heading strong {
          font-size: 12px;
        }

        .bib-global-sheet-selector-heading span {
          color: #64748b;
          font-size: 11px;
        }

        .bib-global-position-grid {
          display: grid;
          gap: 5px;
          justify-content: start;
        }

        .bib-global-position-grid-spine {
          grid-template-columns:
            repeat(
              5,
              34px
            );
        }

        .bib-global-position-grid-barcode {
          grid-template-columns:
            repeat(
              3,
              44px
            );
        }

        .bib-global-position {
          height: 30px;
          min-width: 0;
          border:
            1px solid
            #cbd5e1;
          border-radius: 6px;
          background: #fff;
          color: #334155;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .bib-global-position:hover {
          border-color: #0f766e;
        }

        .bib-global-position-usada {
          background: #e2e8f0;
          color: #94a3b8;
          text-decoration:
            line-through;
        }

        .bib-global-position-inicio {
          border:
            2px solid
            #047857;
          background: #d1fae5;
          color: #065f46;
          font-weight: 900;
        }

        .bib-global-position-livre {
          background: #fff;
          color: #334155;
        }

        .bib-global-position-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 12px;
          font-size: 11px;
          color: #64748b;
        }

        .bib-global-position-legend span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .bib-global-position-legend i {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          display: inline-block;
        }

        .bib-global-legend-used {
          background: #e2e8f0;
          border:
            1px solid
            #cbd5e1;
        }

        .bib-global-legend-start {
          background: #d1fae5;
          border:
            2px solid
            #047857;
        }

        .bib-global-legend-free {
          background: #fff;
          border:
            1px solid
            #cbd5e1;
        }

        .bib-global-batch-list {
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
          max-height:
            360px;
          overflow: auto;
          padding-right:
            4px;
        }

        .bib-global-batch-copy {
          display: grid;
          grid-template-columns:
            auto
            minmax(
              0,
              1fr
            );
          gap: 10px;
          align-items:
            start;
          min-width: 0;
          border:
            1px solid
            #dbe3ef;
          border-radius:
            12px;
          padding:
            12px;
          background:
            #f8fafc;
          cursor: pointer;
        }

        .bib-global-batch-copy div {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .bib-global-batch-copy strong,
        .bib-global-batch-title,
        .bib-global-batch-copy small {
          overflow: hidden;
          text-overflow:
            ellipsis;
        }

        .bib-global-batch-title {
          white-space:
            normal;
          font-weight:
            700;
        }

        .bib-global-batch-copy small {
          color:
            #64748b;
          white-space:
            normal;
        }

        .bib-global-batch-footer {
          display: flex;
          justify-content:
            flex-end;
          gap: 8px;
          margin-top:
            18px;
        }

        .bib-global-batch-state,
        .bib-global-batch-empty {
          padding:
            30px 12px;
          text-align: center;
          color:
            #64748b;
        }

        .bib-global-batch-error {
          display: flex;
          align-items: center;
          justify-content:
            space-between;
          gap: 12px;
          padding: 14px;
          border-radius:
            12px;
          background:
            #fef2f2;
          color:
            #991b1b;
        }

        .bib-global-batch-summary {
          display: flex;
          justify-content:
            space-between;
          gap: 12px;
          border:
            1px solid
            #dbe3ef;
          border-radius:
            12px;
          padding:
            12px;
          margin-bottom:
            14px;
        }

        .bib-global-preview-section {
          margin-top:
            12px;
          border:
            1px dashed
            #cbd5e1;
          border-radius:
            12px;
          padding:
            14px;
          overflow: hidden;
        }

        .bib-global-preview-section h3 {
          margin-bottom:
            12px;
          font-size:
            14px;
        }

        .bib-global-preview-spine {
          display: grid;
          grid-template-columns:
            repeat(
              5,
              123px
            );
          gap: 10px;
          overflow-x: auto;
        }

        .bib-global-preview-barcode {
          display: grid;
          grid-template-columns:
            repeat(
              3,
              176px
            );
          gap: 10px;
          overflow-x: auto;
        }

        .bib-global-preview-spine-label {
          width: 123px;
          height: 88px;
          display: flex;
          flex-direction:
            column;
          align-items: center;
          justify-content:
            center;
          border:
            1px solid
            #111827;
          padding: 6px;
          text-align:
            center;
          overflow: hidden;
          background:
            #fff;
          color:
            #111;
          font-size:
            10px;
        }

        .bib-global-preview-spine-label img {
          max-width:
            46px;
          max-height:
            18px;
          object-fit:
            contain;
          margin-bottom:
            4px;
        }

        .bib-global-preview-barcode-label {
          width:
            176px;
          height:
            99px;
          display: flex;
          flex-direction:
            column;
          align-items: center;
          justify-content:
            center;
          border:
            1px solid
            #111827;
          padding: 6px;
          text-align:
            center;
          overflow: hidden;
          background:
            #fff;
          color:
            #111;
          font-size:
            9px;
        }

        .bib-global-preview-barcode-label img {
          max-width:
            60px;
          max-height:
            18px;
          object-fit:
            contain;
        }

        .bib-global-preview-barcode-label strong {
          max-width:
            100%;
          white-space:
            nowrap;
          overflow:
            hidden;
          text-overflow:
            ellipsis;
        }

        .bib-global-preview-barcode-label span {
          margin:
            4px 0;
          letter-spacing:
            1px;
        }

        .bib-global-preview-spine-label.bib-global-preview-slot-vazio,
        .bib-global-preview-barcode-label.bib-global-preview-slot-vazio {
          border:
            1px dashed
            #cbd5e1;
          background:
            #f8fafc;
          box-shadow:
            none;
          opacity:
            0.72;
          pointer-events:
            none;
        }

        .bib-global-capacity,
        .bib-global-print-note,
        .bib-global-more {
          margin:
            12px 0 0;
          color:
            #64748b;
          font-size:
            12px;
        }

        .bib-global-capacity {
          color:
            #0f172a;
          font-weight:
            800;
        }

        html[data-theme="dark"]
          .bib-global-preview-spine-label.bib-global-preview-slot-vazio,
        html[data-theme="dark"]
          .bib-global-preview-barcode-label.bib-global-preview-slot-vazio {
          border-color:
            #475569;
          background:
            #1e293b;
          opacity:
            0.55;
        }

        html[data-theme="dark"]
          .bib-global-batch-models label {
          color: #e5e7eb;
        }

        html[data-theme="dark"]
          .bib-global-batch-models select {
          border-color: #475569;
          background: #111827;
          color: #f8fafc;
        }

        html[data-theme="dark"]
          .bib-global-batch-modal {
          background:
            #0f172a;
          color:
            #f8fafc;
          border-color:
            #334155;
        }

        html[data-theme="dark"]
          .bib-global-batch-copy,
        html[data-theme="dark"]
          .bib-global-batch-search input,
        html[data-theme="dark"]
          .bib-global-batch-close,
        html[data-theme="dark"]
          .bib-global-batch-actions button,
        html[data-theme="dark"]
          .bib-global-batch-secondary {
          background:
            #111827;
          color:
            #f8fafc;
          border-color:
            #475569;
        }

        html[data-theme="dark"]
          .bib-global-batch-start,
        html[data-theme="dark"]
          .bib-global-batch-start-fields input {
          background:
            #111827;
          color:
            #f8fafc;
          border-color:
            #475569;
        }

        html[data-theme="dark"]
          .bib-global-sheet-selector,
        html[data-theme="dark"]
          .bib-global-position-livre {
          background:
            #111827;
          color:
            #f8fafc;
          border-color:
            #475569;
        }

        html[data-theme="dark"]
          .bib-global-position-usada {
          background:
            #1e293b;
          color:
            #64748b;
          border-color:
            #475569;
        }

        html[data-theme="dark"]
          .bib-global-position-inicio {
          background:
            #064e3b;
          color:
            #ecfdf5;
          border-color:
            #34d399;
        }

        html[data-theme="dark"]
          .bib-global-batch-type,
        html[data-theme="dark"]
          .bib-global-batch-summary,
        html[data-theme="dark"]
          .bib-global-preview-section {
          border-color:
            #475569;
        }

        html[data-theme="dark"]
          .bib-global-capacity {
          color:
            #f8fafc;
        }

        @media (
          prefers-color-scheme:
            dark
        ) {
          html[data-theme="system"]
            .bib-global-batch-models label {
            color: #e5e7eb;
          }

          html[data-theme="system"]
            .bib-global-batch-models select {
            border-color: #475569;
            background: #111827;
            color: #f8fafc;
          }

          html[data-theme="system"]
            .bib-global-batch-modal {
            background:
              #0f172a;
            color:
              #f8fafc;
            border-color:
              #334155;
          }

          html[data-theme="system"]
            .bib-global-batch-copy,
          html[data-theme="system"]
            .bib-global-batch-search input,
          html[data-theme="system"]
            .bib-global-batch-close,
          html[data-theme="system"]
            .bib-global-batch-actions button,
          html[data-theme="system"]
            .bib-global-batch-secondary {
            background:
              #111827;
            color:
              #f8fafc;
            border-color:
              #475569;
          }

          html[data-theme="system"]
            .bib-global-batch-type,
          html[data-theme="system"]
            .bib-global-batch-summary,
          html[data-theme="system"]
            .bib-global-preview-section {
            border-color:
              #475569;
          }

          html[data-theme="system"]
            .bib-global-capacity {
            color:
              #f8fafc;
          }
        }

        @media (
          max-width:
            760px
        ) {
          .bib-global-batch-backdrop {
            padding: 10px;
          }

          .bib-global-batch-modal {
            padding: 16px;
            max-height:
              95vh;
          }

          .bib-global-batch-toolbar {
            grid-template-columns:
              1fr;
          }

          .bib-global-batch-count {
            text-align:
              left;
          }

          .bib-global-batch-list {
            grid-template-columns:
              1fr;
          }

          .bib-global-batch-models {
            grid-template-columns:
              1fr;
          }

          .bib-global-batch-start-fields {
            grid-template-columns:
              1fr;
          }

          .bib-global-batch-summary {
            flex-direction:
              column;
          }

          .bib-global-batch-footer {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </>
  );
}
