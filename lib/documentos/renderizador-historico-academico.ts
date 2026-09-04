import {
  sanitizarHtmlDocumento,
} from "@/lib/documentos/renderizador-template-documento";

export type ComponenteHistoricoAcademico = {
  codigo?: string | null;
  disciplina: string;
  cargaHoraria?: string | number | null;
  nota?: string | number | null;
  frequencia?: string | number | null;
  situacao?: string | null;
  periodo?: string | null;
  turma?: string | null;
  tipo?: string | null;
  horasCursadas?: string | number | null;
  frequenciaMinima?: string | number | null;
  cumpriuFrequencia?: string | boolean | null;
  observacao?: string | null;
};

export type OpcoesHistoricoAcademico = {
  conteudoEstruturado: string;
  componentes?: ComponenteHistoricoAcademico[];
};

const MARCADORES = [
  "CABEÇALHO INSTITUCIONAL",
  "TÍTULO",
  "DADOS DO ALUNO",
  "DADOS DA MATRÍCULA",
  "DADOS DO POLO",
  "COMPONENTES CURRICULARES",
  "OBSERVAÇÕES",
  "ASSINATURA INSTITUCIONAL",
  "RODAPÉ",
] as const;

function escaparRegex(valor: string) {
  return valor.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function escaparHtml(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pareceHtml(valor: string) {
  return /<[a-z][\s\S]*>/i.test(valor);
}

function textoParaHtml(valor: string) {
  const texto = String(valor || "").trim();

  if (!texto) {
    return "";
  }

  if (pareceHtml(texto)) {
    return sanitizarHtmlDocumento(texto);
  }

  return escaparHtml(texto)
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "<br />");
}

function obterSecao(
  conteudo: string,
  marcador: string
) {
  const nome = escaparRegex(marcador);

  const regex = new RegExp(
    `(?:^|\\n)\\s*\\[${nome}\\]\\s*(?:\\n|$)([\\s\\S]*?)(?=\\n\\s*\\[[^\\]\\r\\n]+\\]\\s*(?:\\n|$)|$)`,
    "i"
  );

  return conteudo.match(regex)?.[1]?.trim() || "";
}

function removerMarcadoresDesconhecidos(
  conteudo: string
) {
  let final = String(conteudo || "");

  for (const marcador of MARCADORES) {
    final = final.replace(
      new RegExp(
        `\\[${escaparRegex(marcador)}\\]`,
        "gi"
      ),
      ""
    );
  }

  return final.trim();
}

function formatarValorTabela(
  valor: string | number | null | undefined
) {
  if (
    valor === null ||
    valor === undefined ||
    String(valor).trim() === ""
  ) {
    return "-";
  }

  return String(valor);
}

function montarTabelaComponentes(
  componentes: ComponenteHistoricoAcademico[]
) {
  if (!componentes.length) {
    return `
      <div class="phanyx-historico-sem-componentes">
        Nenhum componente curricular encontrado.
      </div>
    `;
  }

  const linhas = componentes
    .map((item) => {
      return `
        <tr>
          <td class="phanyx-historico-disciplina">
            ${
              item.codigo
                ? `<span class="phanyx-historico-codigo">${escaparHtml(item.codigo)}</span>`
                : ""
            }
            <span>${escaparHtml(item.disciplina)}</span>
          </td>

          <td class="phanyx-historico-numero">
            ${escaparHtml(formatarValorTabela(item.cargaHoraria))}
          </td>

          <td class="phanyx-historico-numero">
            ${escaparHtml(formatarValorTabela(item.nota))}
          </td>

          <td class="phanyx-historico-numero">
            ${escaparHtml(formatarValorTabela(item.frequencia))}
          </td>

          <td>
            ${escaparHtml(formatarValorTabela(item.situacao))}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table class="phanyx-historico-tabela">
      <thead>
        <tr>
          <th>DISCIPLINA</th>
          <th>C.H.</th>
          <th>NOTA</th>
          <th>FREQ.</th>
          <th>SITUAÇÃO</th>
        </tr>
      </thead>

      <tbody>
        ${linhas}
      </tbody>
    </table>
  `;
}

function limparLogoDaSecao(valor: string) {
  return String(valor || "")
    .replaceAll(
      "__PHANYX_LOGO_INSTITUICAO__",
      ""
    )
    .replace(
      /{{\s*logoInstituicao\s*}}/gi,
      ""
    )
    .trim();
}

export function montarConteudoHistoricoAcademico({
  conteudoEstruturado,
  componentes = [],
}: OpcoesHistoricoAcademico) {
  const conteudo = String(
    conteudoEstruturado || ""
  )
    .replace(/\r\n/g, "\n")
    .trim();

  const cabecalho = limparLogoDaSecao(
    obterSecao(
      conteudo,
      "CABEÇALHO INSTITUCIONAL"
    )
  );

  const titulo = obterSecao(
    conteudo,
    "TÍTULO"
  );

  const dadosAluno = obterSecao(
    conteudo,
    "DADOS DO ALUNO"
  );

  const dadosMatricula = obterSecao(
    conteudo,
    "DADOS DA MATRÍCULA"
  );

  const dadosPolo = obterSecao(
    conteudo,
    "DADOS DO POLO"
  );

  const componentesTexto = obterSecao(
    conteudo,
    "COMPONENTES CURRICULARES"
  );

  const observacoes = obterSecao(
    conteudo,
    "OBSERVAÇÕES"
  );

  const assinatura = obterSecao(
    conteudo,
    "ASSINATURA INSTITUCIONAL"
  );

  const rodape = obterSecao(
    conteudo,
    "RODAPÉ"
  );

  const possuiMarcadores = MARCADORES.some(
    (marcador) =>
      conteudo.toUpperCase().includes(
        `[${marcador}]`.toUpperCase()
      )
  );

  if (!possuiMarcadores) {
    return sanitizarHtmlDocumento(
      conteudo
    );
  }

  const tabela = componentes.length
    ? montarTabelaComponentes(componentes)
    : textoParaHtml(componentesTexto);

  const preambulo = removerMarcadoresDesconhecidos(
    conteudo.split(/\n\s*\[[^\]\r\n]+\]\s*(?:\n|$)/)[0] || ""
  );

  return `
    <style>
      .phanyx-historico {
        width: 100%;
        color: #111827;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9pt;
        line-height: 1.28;
      }

      .phanyx-historico * {
        box-sizing: border-box;
      }

      .phanyx-historico-pre {
        margin-bottom: 4mm;
      }

      .phanyx-historico-cabecalho {
        display: grid;
        grid-template-columns: 30mm minmax(0, 1fr);
        align-items: center;
        gap: 5mm;
        min-height: 28mm;
        padding: 3mm;
        border: 0.3mm solid #111827;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-logo {
        display: flex;
        min-height: 22mm;
        align-items: center;
        justify-content: center;
      }

      .phanyx-historico-cabecalho-conteudo {
        min-width: 0;
        font-size: 8.5pt;
        line-height: 1.25;
      }

      .phanyx-historico-titulo {
        margin-top: 3mm;
        padding: 3mm;
        border: 0.3mm solid #111827;
        font-size: 13pt;
        font-weight: 800;
        line-height: 1.15;
        text-align: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-grade-dados {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 3mm;
        margin-top: 3mm;
      }

      .phanyx-historico-bloco {
        border: 0.3mm solid #111827;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-bloco-titulo {
        padding: 2mm 2.5mm;
        border-bottom: 0.3mm solid #111827;
        background: #eef2f7;
        font-size: 8pt;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .phanyx-historico-bloco-conteudo {
        min-height: 12mm;
        padding: 2.5mm;
        font-size: 8pt;
        line-height: 1.35;
      }

      .phanyx-historico-polo {
        margin-top: 3mm;
      }

      .phanyx-historico-componentes {
        margin-top: 4mm;
      }

      .phanyx-historico-secao-titulo {
        padding: 2mm 2.5mm;
        border: 0.3mm solid #111827;
        border-bottom: 0;
        background: #eef2f7;
        font-size: 9pt;
        font-weight: 800;
        text-align: left;
      }

      .phanyx-historico-tabela {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
        font-size: 7.3pt;
      }

      .phanyx-historico-tabela thead {
        display: table-header-group;
      }

      .phanyx-historico-tabela tr {
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-tabela th,
      .phanyx-historico-tabela td {
        border: 0.3mm solid #111827;
        padding: 1.4mm 1.5mm;
        vertical-align: middle;
        overflow-wrap: anywhere;
      }

      .phanyx-historico-tabela th {
        background: #f8fafc;
        font-size: 6.8pt;
        font-weight: 800;
        text-align: center;
      }

      .phanyx-historico-tabela th:nth-child(1),
      .phanyx-historico-tabela td:nth-child(1) {
        width: 47%;
      }

      .phanyx-historico-tabela th:nth-child(2),
      .phanyx-historico-tabela td:nth-child(2) {
        width: 11%;
      }

      .phanyx-historico-tabela th:nth-child(3),
      .phanyx-historico-tabela td:nth-child(3) {
        width: 10%;
      }

      .phanyx-historico-tabela th:nth-child(4),
      .phanyx-historico-tabela td:nth-child(4) {
        width: 12%;
      }

      .phanyx-historico-tabela th:nth-child(5),
      .phanyx-historico-tabela td:nth-child(5) {
        width: 20%;
      }

      .phanyx-historico-disciplina {
        display: table-cell;
      }

      .phanyx-historico-codigo {
        display: block;
        margin-bottom: 0.5mm;
        font-size: 6.5pt;
        font-weight: 800;
      }

      .phanyx-historico-numero {
        text-align: center;
        white-space: nowrap;
      }

      .phanyx-historico-fechamento {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(58mm, 0.75fr);
        gap: 3mm;
        margin-top: 4mm;
        align-items: start;
      }

      .phanyx-historico-observacoes,
      .phanyx-historico-assinatura,
      .phanyx-historico-rodape {
        border: 0.3mm solid #111827;
        padding: 3mm;
      }

      .phanyx-historico-observacoes {
        min-height: 28mm;
      }

      .phanyx-historico-assinatura {
        min-height: 36mm;
        text-align: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-rodape {
        margin-top: 3mm;
        min-height: 10mm;
        font-size: 7pt;
        text-align: center;
        break-inside: avoid;
        page-break-inside: avoid;
      }

      .phanyx-historico-sem-componentes {
        border: 0.3mm solid #111827;
        padding: 4mm;
        color: #64748b;
        font-size: 8pt;
        text-align: center;
      }
    </style>

    <section class="phanyx-historico">
      ${
        preambulo
          ? `<div class="phanyx-historico-pre">${textoParaHtml(preambulo)}</div>`
          : ""
      }

      <header class="phanyx-historico-cabecalho">
        <div class="phanyx-historico-logo">
          __PHANYX_LOGO_INSTITUICAO__
        </div>

        <div class="phanyx-historico-cabecalho-conteudo">
          ${textoParaHtml(cabecalho)}
        </div>
      </header>

      <div class="phanyx-historico-titulo">
        ${textoParaHtml(titulo || "HISTÓRICO ACADÊMICO")}
      </div>

      <div class="phanyx-historico-grade-dados">
        <section class="phanyx-historico-bloco">
          <div class="phanyx-historico-bloco-titulo">
            DADOS DO ALUNO
          </div>

          <div class="phanyx-historico-bloco-conteudo">
            ${textoParaHtml(dadosAluno)}
          </div>
        </section>

        <section class="phanyx-historico-bloco">
          <div class="phanyx-historico-bloco-titulo">
            DADOS DA MATRÍCULA / CURSO
          </div>

          <div class="phanyx-historico-bloco-conteudo">
            ${textoParaHtml(dadosMatricula)}
          </div>
        </section>
      </div>

      ${
        dadosPolo
          ? `
            <section class="phanyx-historico-bloco phanyx-historico-polo">
              <div class="phanyx-historico-bloco-titulo">
                DADOS DO POLO / UNIDADE
              </div>

              <div class="phanyx-historico-bloco-conteudo">
                ${textoParaHtml(dadosPolo)}
              </div>
            </section>
          `
          : ""
      }

      <section class="phanyx-historico-componentes">
        <div class="phanyx-historico-secao-titulo">
          COMPONENTES CURRICULARES
        </div>

        ${tabela}
      </section>

      <div class="phanyx-historico-fechamento">
        <section class="phanyx-historico-observacoes">
          <strong>OBSERVAÇÕES E RESUMO ACADÊMICO</strong>
          <div style="margin-top: 2mm;">
            ${textoParaHtml(observacoes)}
          </div>
        </section>

        <section class="phanyx-historico-assinatura">
          ${textoParaHtml(assinatura)}
        </section>
      </div>

      ${
        rodape
          ? `
            <footer class="phanyx-historico-rodape">
              ${textoParaHtml(rodape)}
            </footer>
          `
          : ""
      }
    </section>
  `;
}
