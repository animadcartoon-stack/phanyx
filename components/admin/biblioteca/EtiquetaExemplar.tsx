"use client";

import JsBarcode from "jsbarcode";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useTranslations,
} from "next-intl";

type TipoEtiqueta =
  | "LOMBADA"
  | "CODIGO_BARRAS";

type DadosEtiqueta = {
  exemplarId: number;
  itemId: number;

  instituicao: {
    nome: string;
    unidade: string | null;
    logoUrl: string | null;
    logoTipo: string;
  };

  item: {
    titulo: string;

    sistemaClassificacao:
      | "CDD"
      | "CDU"
      | "OUTRO"
      | null;

    cdd: string | null;
    cdu: string | null;
    cutter: string | null;
    codigoChamada: string | null;
  };

  exemplar: {
    tipo: string;

    codigoInterno: string;
    codigoBarras: string | null;
    valorCodigoBarras: string;

    numeroTombo: string | null;
    patrimonio: string | null;

    setor: string | null;
    sala: string | null;
    corredor: string | null;
    estante: string | null;
    prateleira: string | null;
  };
};

type Props = {
  exemplarId: number;
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

function nomeCurtoInstituicao(
  nome: string,
) {
  const parteAntesDoHifen =
    nome
      .split("-")[0]
      ?.trim();

  if (
    parteAntesDoHifen &&
    parteAntesDoHifen.length >= 2 &&
    parteAntesDoHifen.length <= 10
  ) {
    return parteAntesDoHifen;
  }

  const palavras =
    nome
      .replace(
        /[^A-Za-z?-?0-9 ]/g,
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
    nome.slice(0, 10)
  );
}

function linhasChamada(
  dados: DadosEtiqueta,
) {
  const classificacao =
    dados.item.cdd ||
    dados.item.cdu ||
    null;

  const cutter =
    dados.item.cutter;

  if (
    classificacao ||
    cutter
  ) {
    return [
      classificacao,
      cutter,
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
      dados.item
        .codigoChamada,
    ];
  }

  return [];
}

export default function EtiquetaExemplar({
  exemplarId,
}: Props) {
  const t =
    useTranslations(
      "AdminLibraryItemUi",
    );

  const [
    aberto,
    setAberto,
  ] =
    useState(false);

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoEtiqueta>(
      "LOMBADA",
    );

  const [
    dados,
    setDados,
  ] =
    useState<DadosEtiqueta | null>(
      null,
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
    logoFalhou,
    setLogoFalhou,
  ] =
    useState(false);

  const svgRef =
    useRef<SVGSVGElement | null>(
      null,
    );

  async function abrir(
    tipoSolicitado:
      TipoEtiqueta,
  ) {
    setTipo(
      tipoSolicitado,
    );

    setAberto(
      true,
    );

    setErro(
      null,
    );

    if (dados) {
      return;
    }

    setCarregando(
      true,
    );

    try {
      const resposta =
        await fetch(
          "/api/admin/biblioteca/exemplares/" +
            exemplarId +
            "/etiqueta",
          {
            method:
              "GET",
            cache:
              "no-store",
            credentials:
              "include",
          },
        );

      const resultado =
        (await resposta.json()) as {
          ok?: boolean;
          etiqueta?:
            DadosEtiqueta;
          error?: string;
        };

      if (
        !resposta.ok ||
        !resultado.etiqueta
      ) {
        throw new Error(
          resultado.error ||
            t(
              "labelLoadError",
            ),
        );
      }

      setLogoFalhou(
        false,
      );

      setDados(
        resultado.etiqueta,
      );
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : t(
              "labelLoadError",
            ),
      );
    } finally {
      setCarregando(
        false,
      );
    }
  }

  useEffect(() => {
    if (
      !aberto ||
      !dados ||
      tipo !==
        "CODIGO_BARRAS" ||
      !svgRef.current
    ) {
      return;
    }

    try {
      JsBarcode(
        svgRef.current,
        dados.exemplar
          .valorCodigoBarras,
        {
          format:
            "CODE128",

          width:
            1.55,

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
    } catch {
      setErro(
        t(
          "barcodeRenderError",
        ),
      );
    }
  }, [
    aberto,
    dados,
    tipo,
    t,
  ]);

  function imprimir() {
    if (!dados) {
      return;
    }

    const janela =
      window.open(
        "",
        "_blank",
        "width=760,height=720",
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

    const instituicao =
      escaparHtml(
        dados.instituicao
          .nome,
      );

    const instituicaoCurta =
      escaparHtml(
        nomeCurtoInstituicao(
          dados.instituicao
            .nome,
        ),
      );

    const logoInstituicao =
      dados.instituicao
        .logoUrl
        ? escaparHtml(
            dados.instituicao
              .logoUrl,
          )
        : "";

    const marcaLombada =
      logoInstituicao
        ? `<div class="marca marca-lombada">
            <img
              src="${logoInstituicao}"
              alt=""
              class="logo-instituicao"
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
            />
            <div
              class="marca-fallback"
              style="display:none"
            >${instituicaoCurta}</div>
          </div>`
        : `<div class="marca marca-lombada">
            <div class="marca-fallback">${instituicaoCurta}</div>
          </div>`;

    const marcaCodigoBarras =
      logoInstituicao
        ? `<div class="marca marca-barras">
            <img
              src="${logoInstituicao}"
              alt=""
              class="logo-instituicao"
              onerror="this.style.display='none';this.nextElementSibling.style.display='block'"
            />
            <div
              class="marca-fallback"
              style="display:none"
            >${instituicao}</div>
          </div>`
        : `<div class="marca marca-barras">
            <div class="marca-fallback">${instituicao}</div>
          </div>`;

    const codigoInterno =
      escaparHtml(
        dados.exemplar
          .codigoInterno,
      );

    const titulo =
      escaparHtml(
        dados.item.titulo,
      );

    let corpo = "";

    let tamanho =
      "35mm 25mm";

    if (
      tipo ===
      "LOMBADA"
    ) {
      const linhas =
        linhasChamada(
          dados,
        );

      const chamada =
        linhas.length
          ? linhas
              .map(
                (linha) =>
                  `<div class="chamada">${escaparHtml(
                    linha,
                  )}</div>`,
              )
              .join("")
          : `<div class="sem-chamada">${escaparHtml(
              t(
                "noCallNumber",
              ),
            )}</div>`;

      corpo =
        `
        <section class="etiqueta lombada">
          ${marcaLombada}
          <div class="chamada-box">${chamada}</div>
          <div class="codigo">${codigoInterno}</div>
        </section>
        `;

      tamanho =
        "35mm 25mm";
    } else {
      const svg =
        svgRef.current
          ?.outerHTML ||
        "";

      corpo =
        `
        <section class="etiqueta barras">
          ${marcaCodigoBarras}
          <div class="titulo">${titulo}</div>
          <div class="barcode">${svg}</div>
        </section>
        `;

      tamanho =
        "50mm 28mm";
    }

    janela.document.open();

    janela.document.write(
      `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escaparHtml(
        t(
          "printLibraryLabel",
        ),
      )}</title>

<style>
  @page {
    size: ${tamanho};
    margin: 0;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
  }

  .etiqueta {
    box-sizing: border-box;
    overflow: hidden;
    background: #fff;
    color: #000;
  }

  .marca {
    width: 100%;
    min-width: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .logo-instituicao {
    display: block;
    width: auto;
    max-width: 100%;
    object-fit: contain;
  }

  .marca-lombada {
    height: 5.5mm;
  }

  .marca-lombada
    .logo-instituicao {
    max-height: 5mm;
  }

  .marca-barras {
    height: 7mm;
  }

  .marca-barras
    .logo-instituicao {
    max-height: 6.5mm;
  }

  .marca-fallback {
    width: 100%;
    overflow: hidden;
    text-align: center;
    white-space: nowrap;
    font-size: 6.5pt;
    font-weight: 700;
  }

  .lombada {
    width: 35mm;
    height: 25mm;
    padding: 1.5mm;
    border: 0.25mm solid #000;
    display: grid;
    grid-template-rows: auto 1fr auto;
    text-align: center;
  }

  .lombada .instituicao {
    font-size: 6.5pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
  }

  .chamada-box {
    align-self: center;
    display: grid;
    gap: 0.3mm;
  }

  .chamada {
    font-size: 11pt;
    line-height: 1;
    font-weight: 700;
  }

  .sem-chamada {
    font-size: 7pt;
    line-height: 1.1;
  }

  .codigo {
    font-size: 6.5pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
  }

  .barras {
    width: 50mm;
    height: 28mm;
    padding: 1.4mm 2mm;
    border: 0.25mm solid #000;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    text-align: center;
  }

  .barras .instituicao {
    font-size: 6.5pt;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
  }

  .barras .titulo {
    margin-top: 0.5mm;
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
    .etiqueta {
      break-inside: avoid;
    }
  }
</style>
</head>

<body>
${corpo}

<script>
  window.addEventListener(
    "load",
    function () {
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
          void abrir(
            "LOMBADA",
          )
        }
      >
        {t(
          "spineLabel",
        )}
      </button>

      <button
        type="button"
        className="bib-button bib-button-secondary"
        onClick={() =>
          void abrir(
            "CODIGO_BARRAS",
          )
        }
      >
        {t(
          "barcodeLabel",
        )}
      </button>

      {aberto ? (
        <div
          className="bib-label-overlay"
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
            className="bib-label-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={
              "bib-label-title-" +
              exemplarId
            }
          >
            <header className="bib-label-header">
              <div>
                <h2
                  id={
                    "bib-label-title-" +
                    exemplarId
                  }
                >
                  {t(
                    "labelsAndBarcodes",
                  )}
                </h2>

                <p>
                  {t(
                    "labelPreviewDescription",
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

            <div className="bib-label-tabs">
              <button
                type="button"
                className={
                  tipo ===
                  "LOMBADA"
                    ? "bib-button bib-button-primary"
                    : "bib-button bib-button-secondary"
                }
                onClick={() =>
                  setTipo(
                    "LOMBADA",
                  )
                }
              >
                {t(
                  "spineLabel",
                )}
              </button>

              <button
                type="button"
                className={
                  tipo ===
                  "CODIGO_BARRAS"
                    ? "bib-button bib-button-primary"
                    : "bib-button bib-button-secondary"
                }
                onClick={() =>
                  setTipo(
                    "CODIGO_BARRAS",
                  )
                }
              >
                {t(
                  "barcodeLabel",
                )}
              </button>
            </div>

            {carregando ? (
              <div className="bib-compact-empty">
                {t(
                  "loadingLabel",
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
              <>
                <div className="bib-label-preview-area">
                  {tipo ===
                  "LOMBADA" ? (
                    <div className="bib-spine-label-preview">
                      {dados.instituicao.logoUrl &&
                      !logoFalhou ? (
                        <div className="bib-label-brand bib-label-brand-spine">
                          <img
                            src={
                              dados.instituicao
                                .logoUrl
                            }
                            alt={
                              dados.instituicao
                                .nome
                            }
                            className="bib-label-logo bib-label-logo-spine"
                            onError={() =>
                              setLogoFalhou(
                                true,
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="bib-label-institution">
                          {nomeCurtoInstituicao(
                            dados
                              .instituicao
                              .nome,
                          )}
                        </div>
                      )}

                      <div className="bib-label-call">
                        {linhasChamada(
                          dados,
                        ).length ? (
                          linhasChamada(
                            dados,
                          ).map(
                            (
                              linha,
                            ) => (
                              <strong
                                key={
                                  linha
                                }
                              >
                                {
                                  linha
                                }
                              </strong>
                            ),
                          )
                        ) : (
                          <small>
                            {t(
                              "noCallNumber",
                            )}
                          </small>
                        )}
                      </div>

                      <div className="bib-label-copy-code">
                        {
                          dados
                            .exemplar
                            .codigoInterno
                        }
                      </div>
                    </div>
                  ) : (
                    <div className="bib-barcode-label-preview">
                      {dados.instituicao.logoUrl &&
                      !logoFalhou ? (
                        <div className="bib-label-brand bib-label-brand-barcode">
                          <img
                            src={
                              dados.instituicao
                                .logoUrl
                            }
                            alt={
                              dados.instituicao
                                .nome
                            }
                            className="bib-label-logo bib-label-logo-barcode"
                            onError={() =>
                              setLogoFalhou(
                                true,
                              )
                            }
                          />
                        </div>
                      ) : (
                        <div className="bib-label-institution">
                          {
                            dados
                              .instituicao
                              .nome
                          }
                        </div>
                      )}

                      <small className="bib-label-title">
                        {
                          dados
                            .item
                            .titulo
                        }
                      </small>

                      <svg
                        ref={
                          svgRef
                        }
                        className="bib-label-barcode-svg"
                        aria-label={
                          dados
                            .exemplar
                            .valorCodigoBarras
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="bib-label-details">
                  <span>
                    <b>
                      {t(
                        "copyCode",
                      )}
                      :
                    </b>{" "}
                    {
                      dados
                        .exemplar
                        .codigoInterno
                    }
                  </span>

                  <span>
                    <b>
                      {t(
                        "callNumber",
                      )}
                      :
                    </b>{" "}
                    {dados.item
                      .codigoChamada ||
                      "—"}
                  </span>

                  <span>
                    <b>
                      {t(
                        "barcode",
                      )}
                      :
                    </b>{" "}
                    {
                      dados
                        .exemplar
                        .valorCodigoBarras
                    }
                  </span>
                </div>

                <footer className="bib-label-footer">
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
                    onClick={
                      imprimir
                    }
                  >
                    {t(
                      "printLabel",
                    )}
                  </button>
                </footer>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      <style jsx>{`
        .bib-label-overlay {
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

        .bib-label-modal {
          width: min(
            720px,
            100%
          );
          max-height: min(
            760px,
            calc(
              100vh -
              48px
            )
          );
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
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
          padding: 22px;
        }

        .bib-label-header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 16px;
          width: 100%;
          min-width: 0;
        }

        .bib-label-header > div {
          min-width: 0;
        }

        .bib-label-header h2 {
          margin: 0;
          white-space: normal;
          overflow-wrap: normal;
        }

        .bib-label-header > .bib-button {
          width: auto !important;
          min-width: max-content !important;
          flex: 0 0 auto !important;
        }

        .bib-label-header p {
          margin:
            5px 0 0;
          color: #64748b;
        }

        .bib-label-tabs {
          width: 100%;
          min-width: 0;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 20px;
        }

        .bib-label-preview-area {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          display: grid;
          place-items: center;
          min-height: 250px;
          margin-top: 18px;
          padding: 24px;
          border: 1px dashed
            #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
        }

        .bib-spine-label-preview {
          box-sizing: border-box;
          width: 210px;
          height: 150px;
          padding: 10px;
          border: 2px solid
            #111827;
          background: #fff;
          color: #000;
          display: grid;
          grid-template-rows:
            auto
            1fr
            auto;
          text-align: center;
        }

        .bib-barcode-label-preview {
          box-sizing: border-box;
          width: 330px;
          min-height: 180px;
          padding: 12px;
          border: 2px solid
            #111827;
          background: #fff;
          color: #000;
          display: grid;
          justify-items: center;
          align-items: center;
          text-align: center;
        }

        .bib-label-institution {
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 800;
        }

        .bib-label-brand {
          width: 100%;
          min-width: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }

        .bib-label-brand-spine {
          height: 34px;
        }

        .bib-label-brand-barcode {
          height: 44px;
        }

        .bib-label-logo {
          display: block;
          width: auto;
          max-width: 100%;
          object-fit: contain;
        }

        .bib-label-logo-spine {
          max-height: 32px;
        }

        .bib-label-logo-barcode {
          max-height: 42px;
        }

        .bib-label-call {
          align-self: center;
          display: grid;
          gap: 4px;
          font-size: 25px;
          line-height: 1;
        }

        .bib-label-copy-code {
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 800;
        }

        .bib-label-title {
          display: block;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .bib-label-barcode-svg {
          display: block;
          max-width: 100%;
          height: 80px;
        }

        .bib-label-details {
          width: 100%;
          min-width: 0;
          display: flex;
          gap: 10px 20px;
          flex-wrap: wrap;
          margin-top: 16px;
          font-size: 13px;
        }

        .bib-label-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 22px;
        }

        html[data-theme="system"]
          .bib-label-modal,
        html[data-theme="dark"]
          .bib-label-modal {
          background:
            #2d2d2d;
          border-color:
            #505050;
          color:
            #fff;
        }

        html[data-theme="system"]
          .bib-label-header p,
        html[data-theme="dark"]
          .bib-label-header p {
          color:
            #d1d5db;
        }

        html[data-theme="system"]
          .bib-label-preview-area,
        html[data-theme="dark"]
          .bib-label-preview-area {
          background:
            #383838;
          border-color:
            #666;
        }

        @media (
          max-width: 640px
        ) {
          .bib-label-overlay {
            padding: 12px;
          }

          .bib-label-modal {
            padding: 16px;
          }

          .bib-label-header {
            grid-template-columns: 1fr;
          }

          .bib-label-header > .bib-button {
            justify-self: start;
          }

          .bib-barcode-label-preview {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}