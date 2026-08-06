export type FormatoImpressaoDocumento =
  | "A4_INTEIRA"
  | "DUAS_VIAS_A4";

export type CampoVisualDocumento = {
  id: string;
  tipo: "ASSINATURA_DIRETOR";
  x: number;
  y: number;
  largura: number;
  altura: number;
  pagina: number;
};

export type DadosInstituicaoDocumento = {
  nome: string;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  estado?: string | null;

  responsavelNome?: string | null;
  responsavelCargo?: string | null;

  logoUrl?: string | null;
  logoDataUri?: string | null;

  assinaturaDiretorUrl?: string | null;

  papelTimbradoUrl?: string | null;
  usarPapelTimbrado?: boolean;
  estiloPapelTimbrado?: string | null;
};

export type DadosValidacaoDocumento = {
  codigo: string;
  emitidoEm: string;
  qrCodeDataUri?: string | null;
};

export type OpcoesRenderizacaoDocumento = {
  conteudo: string;

  formatoImpressao:
  FormatoImpressaoDocumento;

  instituicao:
  DadosInstituicaoDocumento;

  tituloDocumento?: string | null;

  validacao?:
  DadosValidacaoDocumento | null;

  modoPrevia?: boolean;

  mostrarValidacao?: boolean;

  camposVisuais?:
  CampoVisualDocumento[] | null;
};

export type ResultadoRenderizacaoDocumento = {
  html: string;

  headerTemplate: string;

  footerTemplate: string;

  pdfOptions: {
    format: "A4";
    printBackground: boolean;
    preferCSSPageSize: boolean;
    displayHeaderFooter: boolean;
    headerTemplate: string;
    footerTemplate: string;
    margin: {
      top: string;
      right: string;
      bottom: string;
      left: string;
    };
    scale: number;
  };

  possuiQuebrasDePagina: boolean;

  formatoImpressao:
  FormatoImpressaoDocumento;
};

export const ALTURA_A4_MM = 297;

export const LARGURA_A4_MM = 210;

export const ALTURA_CABECALHO_MM = 42;

export const ALTURA_RODAPE_MM = 28;

export const MARGEM_LATERAL_MM = 18;

const LARGURA_AREA_ASSINATURA_PX =
  480;

const ALTURA_AREA_ASSINATURA_PX =
  150;

const LARGURA_BLOCO_ASSINATURA_MM =
  78;

const ALTURA_BLOCO_ASSINATURA_MM =
  36;

function limitarNumero(
  valor: unknown,
  minimo: number,
  maximo: number,
  padrao: number
) {
  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {
    return padrao;
  }

  return Math.min(
    Math.max(
      numero,
      minimo
    ),
    maximo
  );
}

function obterCampoVisualAssinatura(
  camposVisuais?:
    CampoVisualDocumento[] | null
) {
  if (
    !Array.isArray(
      camposVisuais
    )
  ) {
    return null;
  }

  const campo =
    camposVisuais.find(
      (item) =>
        item?.tipo ===
        "ASSINATURA_DIRETOR"
    );

  if (!campo) {
    return null;
  }

  const x =
    limitarNumero(
      campo.x,
      0,
      LARGURA_AREA_ASSINATURA_PX,
      70
    );

  const y =
    limitarNumero(
      campo.y,
      0,
      ALTURA_AREA_ASSINATURA_PX,
      18
    );

  const larguraMaxima =
    Math.max(
      1,
      LARGURA_AREA_ASSINATURA_PX -
      x
    );

  const alturaMaxima =
    Math.max(
      1,
      ALTURA_AREA_ASSINATURA_PX -
      y
    );

  return {
    ...campo,

    x,

    y,

    largura:
      limitarNumero(
        campo.largura,
        1,
        larguraMaxima,
        180
      ),

    altura:
      limitarNumero(
        campo.altura,
        1,
        alturaMaxima,
        55
      ),
  };
}

function percentual(
  valor: number,
  total: number
) {
  return (
    valor /
    total *
    100
  );
}

function escaparHtml(
  valor: unknown
) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function resolverUrlDocumento(
  valor: unknown,
  origem: string
) {
  const url = String(
    valor ?? ""
  ).trim();

  if (!url) {
    return "";
  }

  try {
    return new URL(
      url,
      `${origem}/`
    ).toString();
  } catch {
    return "";
  }
}

export function sanitizarHtmlDocumento(
  valor: string
) {
  return String(valor || "")
    .replace(
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      ""
    )
    .replace(
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      ""
    )
    .replace(
      /<embed[\s\S]*?>/gi,
      ""
    )
    .replace(
      /\son[a-z]+\s*=\s*"[^"]*"/gi,
      ""
    )
    .replace(
      /\son[a-z]+\s*=\s*'[^']*'/gi,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    );
}

function normalizarParagrafosVazios(
  valor: string
) {
  return String(valor || "").replace(
    /<p([^>]*)>([\s\S]*?)<\/p>/gi,

    (
      paragrafoCompleto: string,
      atributos: string,
      conteudoInterno: string
    ) => {
      /*
       * Não considera vazios parágrafos
       * que contenham imagens ou outros
       * elementos visuais reais.
       */
      const possuiElementoVisual =
        /<(?:img|svg|video|audio|table|hr)\b/i.test(
          conteudoInterno
        );

      if (possuiElementoVisual) {
        return paragrafoCompleto;
      }

      /*
       * Remove apenas elementos que
       * representam uma linha vazia:
       * BR, espaços, NBSP e caracteres
       * invisíveis do editor.
       */
      const textoReal =
        String(conteudoInterno || "")
          .replace(
            /<br\b[^>]*\/?>/gi,
            ""
          )
          .replace(
            /<[^>]+>/g,
            ""
          )
          .replace(
            /&nbsp;|&#160;|&#x0*a0;|&#8203;|&#x200b;|&ZeroWidthSpace;/gi,
            ""
          )
          .replace(
            /[\s\u00a0\u200b\ufeff]/g,
            ""
          );

      if (textoReal.length > 0) {
        return paragrafoCompleto;
      }

      const atributosLimpos =
        String(atributos || "").replace(
          /\sdata-phanyx-linha-vazia\s*=\s*(?:"[^"]*"|'[^']*')/gi,
          ""
        );

      /*
       * Cada parágrafo vazio vira um
       * elemento próprio. Duas linhas
       * vazias geram dois elementos,
       * três linhas geram três, etc.
       */
      return (
        `<div${atributosLimpos}` +
        ` data-phanyx-linha-vazia="true">` +
        `&nbsp;` +
        `</div>`
      );
    }
  );
}

function criarImagemAssinatura({
  assinaturaUrl,
  modoPrevia,
  campoVisual,
  dentroDoBloco = false,
}: {
  assinaturaUrl: string;

  modoPrevia: boolean;

  campoVisual?:
    CampoVisualDocumento | null;

  dentroDoBloco?: boolean;
}) {
  const campo =
    campoVisual
      ? obterCampoVisualAssinatura(
          [campoVisual]
        )
      : null;

  if (!assinaturaUrl) {
    if (!modoPrevia) {
      return "";
    }

    return `
      <span
        class="phanyx-assinatura-placeholder"
      >
        Assinatura do diretor
      </span>
    `;
  }

  if (
    dentroDoBloco &&
    campo
  ) {
    const esquerda =
      percentual(
        campo.x,
        LARGURA_AREA_ASSINATURA_PX
      );

    const topo =
      percentual(
        campo.y,
        ALTURA_AREA_ASSINATURA_PX
      );

    const largura =
      percentual(
        campo.largura,
        LARGURA_AREA_ASSINATURA_PX
      );

    const altura =
      percentual(
        campo.altura,
        ALTURA_AREA_ASSINATURA_PX
      );

    return `
      <span
        class="
          phanyx-assinatura-imagem
          phanyx-assinatura-imagem-posicionada
        "
        style="
          left: ${esquerda}%;
          top: ${topo}%;
          width: ${largura}%;
          height: ${altura}%;
        "
      >
        <img
          src="${escaparHtml(
            assinaturaUrl
          )}"
          alt="Assinatura do diretor"
        />
      </span>
    `;
  }

  if (campo) {
    const larguraMm =
      LARGURA_BLOCO_ASSINATURA_MM *
      campo.largura /
      LARGURA_AREA_ASSINATURA_PX;

    const alturaMm =
      ALTURA_BLOCO_ASSINATURA_MM *
      campo.altura /
      ALTURA_AREA_ASSINATURA_PX;

    return `
      <span
        class="
          phanyx-assinatura-imagem
          phanyx-assinatura-somente-configurada
        "
        style="
          width: ${larguraMm}mm;
          min-height: ${alturaMm}mm;
        "
      >
        <img
          src="${escaparHtml(
            assinaturaUrl
          )}"
          alt="Assinatura do diretor"
          style="
            width: ${larguraMm}mm;
            height: ${alturaMm}mm;
          "
        />
      </span>
    `;
  }

  return `
    <span
      class="phanyx-assinatura-imagem"
    >
      <img
        src="${escaparHtml(
          assinaturaUrl
        )}"
        alt="Assinatura do diretor"
      />
    </span>
  `;
}

function criarBlocoAssinatura({
  assinaturaUrl,
  instituicao,
  modoPrevia,
  campoVisual,
}: {
  assinaturaUrl: string;

  instituicao:
    DadosInstituicaoDocumento;

  modoPrevia: boolean;

  campoVisual?:
    CampoVisualDocumento | null;
}) {
  const possuiCampoVisual =
    Boolean(campoVisual);

  const imagem =
    criarImagemAssinatura({
      assinaturaUrl,

      modoPrevia,

      campoVisual,

      dentroDoBloco:
        possuiCampoVisual,
    });

  return `
    <span
      class="
        phanyx-bloco-assinatura
        ${
          possuiCampoVisual
            ? "phanyx-bloco-assinatura-visual"
            : ""
        }
      "
    >
      ${imagem}

      <span
        class="phanyx-linha-assinatura"
      ></span>

      <span
        class="phanyx-identificacao-assinatura"
      >
        <strong>
          ${escaparHtml(
            instituicao
              .responsavelNome ||
            "Responsável legal"
          )}
        </strong>

        <span>
          ${escaparHtml(
            instituicao
              .responsavelCargo ||
            "Representante legal"
          )}
        </span>

        <span>
          ${escaparHtml(
            instituicao.nome
          )}
        </span>

        ${
          instituicao.cnpj
            ? `
              <span>
                CNPJ:
                ${escaparHtml(
                  instituicao.cnpj
                )}
              </span>
            `
            : ""
        }
      </span>
    </span>
  `;
}

export function aplicarAssinaturasDocumento({
  conteudo,
  instituicao,
  modoPrevia = false,
  camposVisuais,
}: {
  conteudo: string;

  instituicao:
    DadosInstituicaoDocumento;

  modoPrevia?: boolean;

  camposVisuais?:
    CampoVisualDocumento[] | null;
}) {
  const assinaturaUrl =
    String(
      instituicao
        .assinaturaDiretorUrl ||
      ""
    ).trim();

  const campoVisual =
    obterCampoVisualAssinatura(
      camposVisuais
    );

  const imagem =
    criarImagemAssinatura({
      assinaturaUrl,

      modoPrevia,

      campoVisual,
    });

  const bloco =
    criarBlocoAssinatura({
      assinaturaUrl,

      instituicao,

      modoPrevia,

      campoVisual,
    });

  return String(conteudo || "")
    .replaceAll(
      "__PHANYX_ASSINATURA_DIRETOR__",
      imagem
    )
    .replaceAll(
      "__PHANYX_BLOCO_ASSINATURA_DIRETOR__",
      bloco
    )
    .replace(
      /{{\s*assinaturaDiretor\s*}}/gi,
      imagem
    )
    .replace(
      /{{\s*blocoAssinaturaDiretor\s*}}/gi,
      bloco
    );
}

function montarValidacao({
  validacao,
  mostrarValidacao,
  compacta,
}: {
  validacao?:
  DadosValidacaoDocumento | null;
  mostrarValidacao: boolean;
  compacta: boolean;
}) {
  if (
    !mostrarValidacao ||
    !validacao
  ) {
    return "";
  }

  return `
    <section
      class="phanyx-validacao ${compacta
      ? "phanyx-validacao-compacta"
      : ""
    }"
    >
      <div
        class="phanyx-validacao-texto"
      >
        <strong>
          VALIDAÇÃO DO DOCUMENTO
        </strong>

        <span>
          Código:
          ${escaparHtml(
      validacao.codigo
    )}
        </span>

        <span>
          Emitido em:
          ${escaparHtml(
      validacao.emitidoEm
    )}
        </span>

        <span>
          Documento gerado pelo PHANYX
        </span>
      </div>

      ${validacao.qrCodeDataUri
      ? `
            <img
              class="phanyx-validacao-qr"
              src="${escaparHtml(
        validacao
          .qrCodeDataUri
      )}"
              alt="QR Code de validação"
            />
          `
      : ""
    }
    </section>
  `;
}

function montarCabecalhoInterno(
  instituicao:
    DadosInstituicaoDocumento,
  rotuloVia: string
) {
  return `
    <header
      class="phanyx-via-cabecalho"
    >
      <div
        class="phanyx-via-identidade"
      >
        ${instituicao.logoUrl
      ? `
              <img
                class="phanyx-via-logo"
                src="${escaparHtml(
        instituicao.logoUrl
      )}"
                alt="Logo da instituição"
              />
            `
      : ""
    }

        <div
          class="phanyx-via-instituicao"
        >
          <strong>
            ${escaparHtml(
      instituicao.nome
    )}
          </strong>

          ${instituicao.cnpj
      ? `
                <span>
                  CNPJ:
                  ${escaparHtml(
        instituicao.cnpj
      )}
                </span>
              `
      : ""
    }
        </div>
      </div>

      <span
        class="phanyx-via-rotulo"
      >
        ${escaparHtml(rotuloVia)}
      </span>
    </header>
  `;
}

function montarPapelTimbrado(
  instituicao:
    DadosInstituicaoDocumento,
  classe: string
) {
  if (
    !instituicao
      .usarPapelTimbrado ||
    !instituicao
      .papelTimbradoUrl
  ) {
    return "";
  }

  return `
    <img
      class="${classe}"
      src="${escaparHtml(
    instituicao
      .papelTimbradoUrl
  )}"
      alt=""
    />
  `;
}

function montarViaCompacta({
  conteudo,
  instituicao,
  validacao,
  mostrarValidacao,
  rotuloVia,
}: {
  conteudo: string;
  instituicao:
  DadosInstituicaoDocumento;
  validacao?:
  DadosValidacaoDocumento | null;
  mostrarValidacao: boolean;
  rotuloVia: string;
}) {
  return `
    <section
      class="phanyx-via"
    >
      ${montarPapelTimbrado(
    instituicao,
    "phanyx-papel-via"
  )}

      ${montarCabecalhoInterno(
    instituicao,
    rotuloVia
  )}

      <div
        class="phanyx-via-conteudo-area"
      >
        <article
          class="phanyx-conteudo phanyx-conteudo-compacto"
        >
          ${conteudo}
        </article>
      </div>

      ${montarValidacao({
    validacao,
    mostrarValidacao,
    compacta: true,
  })}
    </section>
  `;
}

function montarHeaderTemplate(
  instituicao:
    DadosInstituicaoDocumento
) {
  if (
    instituicao
      .usarPapelTimbrado &&
    instituicao
      .estiloPapelTimbrado ===
    "PAPEL_PROPRIO"
  ) {
    return "<div></div>";
  }

  const estiloClassico =
    instituicao
      .estiloPapelTimbrado ===
    "PHANYX_CLASSICO";

  const fundo =
    estiloClassico
      ? "#111111"
      : "#ffffff";

  const cor =
    estiloClassico
      ? "#ffffff"
      : "#0f172a";

  const borda =
    estiloClassico
      ? "none"
      : "0.3mm solid #cbd5e1";

  return `
    <div
      style="
        width: 100%;
        height: 34mm;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 7mm;
        margin: 0;
        padding: 5mm 18mm;
        background: ${fundo};
        color: ${cor};
        border-bottom: ${borda};
        font-family:
          Arial,
          Helvetica,
          sans-serif;
        -webkit-print-color-adjust:
          exact;
        print-color-adjust:
          exact;
      "
    >
      ${instituicao.logoDataUri
      ? `
            <img
              src="${escaparHtml(
        instituicao.logoDataUri
      )}"
              style="
                width: 22mm;
                height: 22mm;
                object-fit: contain;
              "
            />
          `
      : ""
    }

      <div>
        <div
          style="
            font-size: 15pt;
            font-weight: 700;
            line-height: 1.15;
          "
        >
          ${escaparHtml(
      instituicao.nome
    )}
        </div>

        ${instituicao.cnpj
      ? `
              <div
                style="
                  margin-top: 2mm;
                  font-size: 8pt;
                  line-height: 1.15;
                "
              >
                CNPJ:
                ${escaparHtml(
        instituicao.cnpj
      )}
              </div>
            `
      : ""
    }
      </div>
    </div>
  `;
}

function montarFooterTemplate(
  instituicao:
    DadosInstituicaoDocumento
) {
  if (
    instituicao
      .usarPapelTimbrado &&
    instituicao
      .estiloPapelTimbrado ===
    "PAPEL_PROPRIO"
  ) {
    return "<div></div>";
  }

  const estiloClassico =
    instituicao
      .estiloPapelTimbrado ===
    "PHANYX_CLASSICO";

  const fundo =
    estiloClassico
      ? "#111111"
      : "#ffffff";

  const cor =
    estiloClassico
      ? "#ffffff"
      : "#475569";

  return `
    <div
      style="
        width: 100%;
        height: 14mm;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content:
          space-between;
        gap: 5mm;
        padding: 2mm 18mm;
        background: ${fundo};
        color: ${cor};
        font-family:
          Arial,
          Helvetica,
          sans-serif;
        font-size: 6.5pt;
        -webkit-print-color-adjust:
          exact;
        print-color-adjust:
          exact;
      "
    >
      <span>
        ${escaparHtml(
    [
      instituicao.telefone,
      instituicao.email,
      instituicao.cidade,
      instituicao.estado,
    ]
      .filter(Boolean)
      .join(" • ")
  )}
      </span>

      <span>
        Página
        <span
          class="pageNumber"
        ></span>
        de
        <span
          class="totalPages"
        ></span>
      </span>
    </div>
  `;
}

function cssCompartilhado(
  formatoImpressao:
    FormatoImpressaoDocumento
) {
  const duasVias =
    formatoImpressao ===
    "DUAS_VIAS_A4";

  return `
    
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
      font-size: 11pt;
      line-height: normal;
      -webkit-print-color-adjust:
        exact;
      print-color-adjust:
        exact;
    }

    body {
  width: ${duasVias
      ? "210mm"
      : "auto"
    };
}

    .phanyx-papel-a4 {
      position: fixed;
      inset: 0;
      z-index: 0;
      width: 210mm;
      height: 297mm;
      object-fit: cover;
      pointer-events: none;
    }

    .phanyx-conteudo {
      position: relative;
      z-index: 1;
      width: 100%;
      overflow-wrap: anywhere;
    }

    .phanyx-conteudo div,
.phanyx-conteudo h1,
.phanyx-conteudo h2,
.phanyx-conteudo h3,
.phanyx-conteudo h4,
.phanyx-conteudo h5,
.phanyx-conteudo h6,
.phanyx-conteudo p {
  margin-top: 0;
  margin-bottom: 0;
}

.phanyx-conteudo p {
  min-height: 1lh;

  /*
   * Preserva os espaços digitados no
   * início do parágrafo no editor.
   */
  white-space: pre-wrap;
}

.phanyx-conteudo
  [data-phanyx-linha-vazia="true"] {
  display: block;
  width: 100%;
  height: 1lh;
  min-height: 1lh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  white-space: nowrap;
}

.phanyx-conteudo p:empty {
  min-height: 1.2em;
  line-height: 1.2em;
}

    .phanyx-conteudo img {
      max-width: 100%;
      height: auto;
    }

    .phanyx-conteudo table {
      width: 100%;
      border-collapse: collapse;
    }

    .phanyx-conteudo th,
    .phanyx-conteudo td {
      padding: 1.5mm;
      vertical-align: top;
    }

    .phanyx-conteudo ul,
    .phanyx-conteudo ol {
      margin-top: 0;
      margin-bottom: 0;
      padding-left: 1.5em;
    }

    .phanyx-conteudo
      .phanyx-page-break {
      display: block !important;
      width: 100%;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: hidden !important;
      font-size: 0 !important;
      line-height: 0 !important;
      break-before: page;
      page-break-before: always;
    }

    .phanyx-conteudo
      .phanyx-page-break
      > * {
      display: none !important;
    }

    .phanyx-conteudo
      > .phanyx-page-break:first-child,
    .phanyx-conteudo
      > .phanyx-page-break:last-child {
      display: none !important;
      break-before: auto !important;
      page-break-before: auto !important;
    }

    .phanyx-assinatura-imagem {
  display: inline-block;
  width: 58mm;
  min-height: 16mm;
  margin: 3mm 0 0;
  vertical-align: top;
  break-inside: avoid;
  page-break-inside: avoid;
}

    .phanyx-assinatura-imagem img {
  display: block;
  width: 48mm;
  height: 16mm;
  object-fit: contain;
  object-position: left center;
  filter:
    grayscale(1)
    contrast(1.35);
}

    .phanyx-assinatura-placeholder {
      display: flex;
      width: 48mm;
      height: 16mm;
      margin: 3mm auto 0;
      align-items: center;
      justify-content: center;
      border: 0.3mm dashed #64748b;
      color: #64748b;
      font-size: 8pt;
      text-align: center;
    }

    .phanyx-bloco-assinatura {
  display: inline-flex;
  width: 78mm;
  margin: 5mm 0 0;
  flex-direction: column;
  align-items: center;
  text-align: center;
  vertical-align: top;
  font-size: 9pt;
  line-height: 1.25;
  break-inside: avoid;
  page-break-inside: avoid;
}

    .phanyx-bloco-assinatura
      .phanyx-assinatura-imagem {
      margin-top: 0;
    }

    .phanyx-linha-assinatura {
      display: block;
      width: 72mm;
      margin-top: -1mm;
      margin-bottom: 1.5mm;
      border-top:
        0.3mm solid #111827;
    }

    .phanyx-bloco-assinatura
      strong,
    .phanyx-bloco-assinatura
      span {
      display: block;
    }

    .phanyx-identificacao-assinatura {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.phanyx-bloco-assinatura-visual {
  position: relative;
  display: inline-block;
  width: 78mm;
  height: 36mm;
  min-height: 36mm;
  margin-top: 5mm;
  overflow: visible;
  text-align: center;
}

.phanyx-bloco-assinatura-visual
  .phanyx-assinatura-imagem-posicionada {
  position: absolute;
  z-index: 2;
  display: block;
  min-height: 0;
  margin: 0;
  overflow: hidden;
}

.phanyx-bloco-assinatura-visual
  .phanyx-assinatura-imagem-posicionada
  img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.phanyx-bloco-assinatura-visual
  .phanyx-linha-assinatura {
  position: absolute;
  top: 61.3333%;
  left: 8.3333%;
  right: 8.3333%;
  width: auto;
  margin: 0;
}

.phanyx-bloco-assinatura-visual
  .phanyx-identificacao-assinatura {
  position: absolute;
  top: 66.6667%;
  left: 8.3333%;
  right: 8.3333%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

    /*
 * Assinatura compacta apenas para
 * documentos com duas vias na mesma A4.
 */
.phanyx-conteudo-compacto
  .phanyx-bloco-assinatura {
  width: 64mm;
  margin-top: 2mm;
  font-size: 7pt;
  line-height: 1.15;
}

.phanyx-conteudo-compacto
  .phanyx-assinatura-imagem {
  width: 42mm;
  min-height: 12mm;
  margin-top: 0;
}

.phanyx-conteudo-compacto
  .phanyx-assinatura-imagem img {
  width: 42mm;
  height: 12mm;
}

.phanyx-conteudo-compacto
  .phanyx-linha-assinatura {
  width: 60mm;
  margin-top: -0.5mm;
  margin-bottom: 1mm;
}

.phanyx-conteudo-compacto
  .phanyx-bloco-assinatura-visual {
  width: 64mm;
  height: 29.54mm;
  min-height: 29.54mm;
}

.phanyx-conteudo-compacto
  .phanyx-bloco-assinatura-visual
  .phanyx-assinatura-imagem-posicionada {
  min-height: 0;
  margin: 0;
}

.phanyx-conteudo-compacto
  .phanyx-bloco-assinatura-visual
  .phanyx-assinatura-imagem-posicionada
  img {
  width: 100%;
  height: 100%;
}

.phanyx-conteudo-compacto
  .phanyx-bloco-assinatura-visual
  .phanyx-linha-assinatura {
  left: 8.3333%;
  right: 8.3333%;
  width: auto;
  margin: 0;
}

    .phanyx-validacao {
      display: flex;
      width: 100%;
      margin-top: 7mm;
      padding: 3mm;
      align-items: center;
      justify-content:
        space-between;
      gap: 4mm;
      border:
        0.3mm solid #cbd5e1;
      border-radius: 2mm;
      background: #f8fafc;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .phanyx-validacao-texto {
      display: flex;
      min-width: 0;
      flex-direction: column;
      gap: 1mm;
      color: #475569;
      font-size: 7pt;
    }

    .phanyx-validacao-texto
      strong {
      color: #1e3a5f;
      font-size: 7.5pt;
    }

    .phanyx-validacao-qr {
      width: 19mm;
      height: 19mm;
      flex-shrink: 0;
    }

    .phanyx-folha-duas {
      position: relative;
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      background: #ffffff;
    }

    .phanyx-via {
  position: relative;
  display: grid;
  width: 210mm;
  height: 148.5mm;
  padding: 0;
  grid-template-rows:
    17mm
    111.5mm
    20mm;
  gap: 0;
  overflow: hidden;
  background: #ffffff;
}

    .phanyx-papel-via {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 210mm;
      height: 148.5mm;
      object-fit: cover;
      opacity: 1;
      pointer-events: none;
    }

    .phanyx-via-cabecalho,
    .phanyx-via-conteudo-area,
    .phanyx-via
      .phanyx-validacao {
      position: relative;
      z-index: 1;
    }

    .phanyx-via-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4mm;
  min-width: 0;
  height: 17mm;
  padding: 0 18mm;
  border-bottom: 0.3mm solid #cbd5e1;
}
    .phanyx-via-identidade {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 3mm;
    }

    .phanyx-via-logo {
      width: 11mm;
      height: 11mm;
      flex-shrink: 0;
      object-fit: contain;
    }

    .phanyx-via-instituicao {
      display: flex;
      min-width: 0;
      flex-direction: column;
    }

    .phanyx-via-instituicao
      strong {
      font-size: 8.5pt;
      line-height: 1.1;
    }

    .phanyx-via-instituicao
      span {
      margin-top: 0.8mm;
      color: #475569;
      font-size: 6.5pt;
    }

    .phanyx-via-rotulo {
      flex-shrink: 0;
      color: #1e3a5f;
      font-size: 6.5pt;
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .phanyx-via-conteudo-area {
  box-sizing: border-box;
  width: 100%;
  height: 111.5mm;
  min-height: 0;
  padding: 0 18mm;
  overflow: hidden;
}

    .phanyx-conteudo-compacto {
  width: 100%;
  zoom: 1;
  transform: none;
}

    .phanyx-conteudo-compacto
      .phanyx-page-break {
      display: none !important;
      break-before: auto !important;
      page-break-before: auto !important;
    }

    .phanyx-validacao-compacta {
  box-sizing: border-box;
  width: calc(100% - 36mm);
  height: 18mm;
  margin: 1mm 18mm;
  padding: 2mm;
  align-self: center;
}

    .phanyx-validacao-compacta
      .phanyx-validacao-texto {
      gap: 0.5mm;
      font-size: 5.5pt;
    }

    .phanyx-validacao-compacta
      .phanyx-validacao-texto
      strong {
      font-size: 6pt;
    }

    .phanyx-validacao-compacta
      .phanyx-validacao-qr {
      width: 13mm;
      height: 13mm;
    }

    .phanyx-linha-corte {
      position: absolute;
      z-index: 20;
      top: 148.5mm;
      left: 5mm;
      right: 5mm;
      height: 0;
      border-top:
        0.3mm dashed #64748b;
      text-align: center;
    }

    .phanyx-linha-corte span {
      position: relative;
      top: -2.3mm;
      padding:
        0
        2mm;
      background: #ffffff;
      color: #64748b;
      font-size: 5.5pt;
      letter-spacing: 0.08em;
    }
  `;
}

export function montarRenderizacaoDocumento(
  opcoes:
    OpcoesRenderizacaoDocumento
): ResultadoRenderizacaoDocumento {
  const formatoImpressao =
    opcoes.formatoImpressao ===
      "DUAS_VIAS_A4"
      ? "DUAS_VIAS_A4"
      : "A4_INTEIRA";

  const modoPrevia =
    Boolean(opcoes.modoPrevia);

  const mostrarValidacao =
    opcoes.mostrarValidacao !==
    false;

  let conteudo =
    sanitizarHtmlDocumento(
      opcoes.conteudo
    );

  conteudo =
    normalizarParagrafosVazios(
      conteudo
    );

  conteudo =
  aplicarAssinaturasDocumento({
    conteudo,

    instituicao:
      opcoes.instituicao,

    modoPrevia,

    camposVisuais:
      opcoes.camposVisuais,
  });

  const possuiQuebrasDePagina =
    /data-phanyx-page-break\s*=\s*["']true["']/i.test(
      conteudo
    ) ||
    /class\s*=\s*["'][^"']*phanyx-page-break/i.test(
      conteudo
    );

  const headerTemplate =
    montarHeaderTemplate(
      opcoes.instituicao
    );

  const footerTemplate =
    montarFooterTemplate(
      opcoes.instituicao
    );

  const papelA4 =
    montarPapelTimbrado(
      opcoes.instituicao,
      "phanyx-papel-a4"
    );

  const corpo =
    formatoImpressao ===
      "DUAS_VIAS_A4"
      ? `
        <main
          class="phanyx-folha-duas"
          data-phanyx-duas-vias="true"
        >
          ${montarViaCompacta({
        conteudo,
        instituicao:
          opcoes.instituicao,
        validacao:
          opcoes.validacao,
        mostrarValidacao,
        rotuloVia:
          "VIA DO INTERESSADO",
      })}

          ${montarViaCompacta({
        conteudo,
        instituicao:
          opcoes.instituicao,
        validacao:
          opcoes.validacao,
        mostrarValidacao,
        rotuloVia:
          "VIA DA INSTITUIÇÃO",
      })}

          <div
            class="phanyx-linha-corte"
          >
            <span>
              LINHA DE CORTE
            </span>
          </div>
        </main>
      `
      : `
        ${papelA4}

        <main
          class="phanyx-conteudo"
        >
          ${conteudo}

          ${montarValidacao({
        validacao:
          opcoes.validacao,
        mostrarValidacao,
        compacta: false,
      })}
        </main>
      `;

  const html = `
    <!doctype html>

    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />

        <style>
          ${cssCompartilhado(
    formatoImpressao
  )}
        </style>
      </head>

      <body>
        ${corpo}
      </body>
    </html>
  `;

  const duasVias =
    formatoImpressao ===
    "DUAS_VIAS_A4";

  const papelProprio =
    Boolean(
      opcoes.instituicao
        .usarPapelTimbrado
    ) &&
    opcoes.instituicao
      .estiloPapelTimbrado ===
    "PAPEL_PROPRIO";

  return {
    html,

    headerTemplate,

    footerTemplate,

    possuiQuebrasDePagina,

    formatoImpressao,

    pdfOptions: {
      format: "A4",

      printBackground: true,

      preferCSSPageSize:
        duasVias,

      displayHeaderFooter:
        !duasVias &&
        !papelProprio,

      headerTemplate:
        duasVias ||
          papelProprio
          ? "<div></div>"
          : headerTemplate,

      footerTemplate:
        duasVias ||
          papelProprio
          ? "<div></div>"
          : footerTemplate,

      margin:
        duasVias
          ? {
            top: "0",
            right: "0",
            bottom: "0",
            left: "0",
          }
          : {
            top: `${ALTURA_CABECALHO_MM}mm`,
            right: `${MARGEM_LATERAL_MM}mm`,
            bottom: `${ALTURA_RODAPE_MM}mm`,
            left: `${MARGEM_LATERAL_MM}mm`,
          },

      scale: 1,
    },
  };
}