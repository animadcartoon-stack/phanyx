import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const raiz = process.cwd();

const arquivoGerar = path.join(
  raiz,
  "app",
  "api",
  "admin",
  "documentos",
  "gerar",
  "route.ts"
);

const arquivoTemplates = path.join(
  raiz,
  "app",
  "api",
  "admin",
  "documentos",
  "templates",
  "route.ts"
);

function falhar(mensagem) {
  throw new Error(mensagem);
}

function lerArquivo(arquivo) {
  if (!fs.existsSync(arquivo)) {
    falhar(`Arquivo não encontrado: ${arquivo}`);
  }

  return fs.readFileSync(
    arquivo,
    "utf8"
  );
}

function detectarEol(texto) {
  return texto.includes("\r\n")
    ? "\r\n"
    : "\n";
}

function paraLf(texto) {
  return texto.replace(
    /\r\n/g,
    "\n"
  );
}

function restaurarEol(
  texto,
  eol
) {
  return eol === "\r\n"
    ? texto.replace(
        /\n/g,
        "\r\n"
      )
    : texto;
}

function contar(
  texto,
  trecho
) {
  if (!trecho) {
    return 0;
  }

  let total = 0;
  let inicio = 0;

  while (true) {
    const indice =
      texto.indexOf(
        trecho,
        inicio
      );

    if (indice < 0) {
      break;
    }

    total += 1;
    inicio =
      indice +
      trecho.length;
  }

  return total;
}

function exigirUmaOcorrencia(
  texto,
  trecho,
  descricao
) {
  const total =
    contar(
      texto,
      trecho
    );

  if (total !== 1) {
    falhar(
      `Segurança: esperado exatamente 1 trecho para "${descricao}", mas foram encontrados ${total}. Nenhum arquivo foi alterado.`
    );
  }
}

function inserirAntes(
  texto,
  ancora,
  insercao,
  descricao
) {
  exigirUmaOcorrencia(
    texto,
    ancora,
    descricao
  );

  return texto.replace(
    ancora,
    `${insercao}${ancora}`
  );
}

function extrairBlocoAutomaticas(
  texto
) {
  const inicio =
    texto.indexOf(
      "const TAGS_AUTOMATICAS_DOCUMENTO"
    );

  if (inicio < 0) {
    falhar(
      "Segurança: conjunto TAGS_AUTOMATICAS_DOCUMENTO não encontrado."
    );
  }

  const fim =
    texto.indexOf(
      "]);",
      inicio
    );

  if (fim < 0) {
    falhar(
      "Segurança: fim do conjunto TAGS_AUTOMATICAS_DOCUMENTO não encontrado."
    );
  }

  return texto.slice(
    inicio,
    fim + 3
  );
}

function verificarSintaxe(
  nome,
  conteudo
) {
  const resultado =
    ts.transpileModule(
      conteudo,
      {
        compilerOptions: {
          target:
            ts.ScriptTarget.ES2022,
          module:
            ts.ModuleKind.ESNext,
          jsx:
            ts.JsxEmit.ReactJSX,
        },
        fileName: nome,
        reportDiagnostics: true,
      }
    );

  const erros =
    (resultado.diagnostics || [])
      .filter(
        (diagnostico) =>
          diagnostico.category ===
          ts.DiagnosticCategory.Error
      );

  if (erros.length > 0) {
    const detalhes =
      erros
        .map((diagnostico) =>
          ts.flattenDiagnosticMessageText(
            diagnostico.messageText,
            "\n"
          )
        )
        .join("\n\n");

    falhar(
      `Validação de sintaxe falhou em ${nome}:\n${detalhes}\nNenhum arquivo foi alterado.`
    );
  }
}

const originalGerarRaw =
  lerArquivo(
    arquivoGerar
  );

const originalTemplatesRaw =
  lerArquivo(
    arquivoTemplates
  );

const eolGerar =
  detectarEol(
    originalGerarRaw
  );

const eolTemplates =
  detectarEol(
    originalTemplatesRaw
  );

let gerar =
  paraLf(
    originalGerarRaw
  );

let templates =
  paraLf(
    originalTemplatesRaw
  );

const blocoAutomaticasAtual =
  extrairBlocoAutomaticas(
    templates
  );

const marcadoresGerador = [
  "const ocorrenciaId =",
  "let ferias = null as any;",
  "periodoAquisitivoInicio:",
  "blocoRescisaoAssinaturaCompleto:",
];

const marcadoresAutomaticas = [
  '"periodoAquisitivoInicio"',
  '"tipoAso"',
  '"motivoDemissao"',
  '"motivoAdvertencia"',
  '"tipoAfastamento"',
  '"blocoRescisaoAssinaturaCompleto"',
];

const geradorCompleto =
  marcadoresGerador.every(
    (marcador) =>
      gerar.includes(
        marcador
      )
  );

const automaticasCompletas =
  marcadoresAutomaticas.every(
    (marcador) =>
      blocoAutomaticasAtual.includes(
        marcador
      )
  );

if (
  geradorCompleto &&
  automaticasCompletas
) {
  console.log("");
  console.log(
    "As tags específicas de RH já estão restauradas. Nenhuma alteração foi necessária."
  );
  process.exit(0);
}

const existeEstadoParcial =
  marcadoresGerador.some(
    (marcador) =>
      gerar.includes(
        marcador
      )
  ) ||
  marcadoresAutomaticas.some(
    (marcador) =>
      blocoAutomaticasAtual.includes(
        marcador
      )
  );

if (existeEstadoParcial) {
  falhar(
    "Segurança: foi detectada uma aplicação parcial anterior das tags específicas de RH. O script não continuará para evitar duplicações. Nenhum arquivo foi alterado."
  );
}

const ancoraHelper =
  "function formatarMoeda(valor: number) {";

const inserirHelper =
  "function formatarDataDocumento(\n  data?: Date | string | null\n) {\n  if (!data) {\n    return \"\";\n  }\n\n  const valor =\n    new Date(data);\n\n  if (\n    Number.isNaN(\n      valor.getTime()\n    )\n  ) {\n    return \"\";\n  }\n\n  return valor.toLocaleDateString(\n    \"pt-BR\"\n  );\n}\n\n";

const ancoraIds =
  "    const tituloPersonalizado = body?.titulo";

const inserirIds =
  "    const ocorrenciaId =\n      body?.ocorrenciaId\n        ? Number(body.ocorrenciaId)\n        : null;\n\n    const rescisaoId =\n      body?.rescisaoId\n        ? Number(body.rescisaoId)\n        : null;\n\n";

const ancoraVariaveis =
  "    let cursoNome = \"Curso não informado\";";

const inserirVariaveis =
  "    let ferias = null as any;\n    let exame = null as any;\n    let rescisao = null as any;\n    let ocorrencia = null as any;\n";

const ancoraCarregamento =
  "    if (matriculaId && Number.isFinite(matriculaId) && matriculaId > 0) {";

const inserirCarregamento =
  "    if (\n      ehDocumentoFuncionario &&\n      funcionario\n    ) {\n      ferias =\n        await prisma.feriasRH.findFirst({\n          where: {\n            funcionarioId:\n              funcionario.id,\n            instituicaoId:\n              user.instituicaoId,\n          },\n          orderBy: {\n            criadoEm: \"desc\",\n          },\n        });\n\n      exame =\n        await prisma.exameMedicoRH.findFirst({\n          where: {\n            funcionarioId:\n              funcionario.id,\n            instituicaoId:\n              user.instituicaoId,\n          },\n          orderBy: {\n            criadoEm: \"desc\",\n          },\n        });\n\n      rescisao =\n        rescisaoId\n          ? await prisma.rescisaoRH.findFirst({\n              where: {\n                id: rescisaoId,\n                funcionarioId:\n                  funcionario.id,\n                instituicaoId:\n                  user.instituicaoId,\n              },\n            })\n          : await prisma.rescisaoRH.findFirst({\n              where: {\n                funcionarioId:\n                  funcionario.id,\n                instituicaoId:\n                  user.instituicaoId,\n              },\n              orderBy: {\n                criadoEm: \"desc\",\n              },\n            });\n\n      ocorrencia =\n        ocorrenciaId\n          ? await prisma.ocorrenciaRH.findFirst({\n              where: {\n                id: ocorrenciaId,\n                funcionarioId:\n                  funcionario.id,\n                instituicaoId:\n                  user.instituicaoId,\n              },\n            })\n          : await prisma.ocorrenciaRH.findFirst({\n              where: {\n                funcionarioId:\n                  funcionario.id,\n                instituicaoId:\n                  user.instituicaoId,\n                tipo: {\n                  in:\n                    template.tipo ===\n                    \"ADVERTENCIA\"\n                      ? [\n                          \"ADVERTENCIA\",\n                        ]\n                      : template.tipo ===\n                          \"SUSPENSAO\"\n                        ? [\n                            \"SUSPENSAO\",\n                          ]\n                        : [\n                            \"ADVERTENCIA\",\n                            \"SUSPENSAO\",\n                            \"AFASTAMENTO_MEDICO\",\n                            \"AFASTAMENTO_MATERNIDADE\",\n                            \"AFASTAMENTO_PERICIA\",\n                            \"RETORNO_TRABALHO\",\n                          ],\n                },\n              },\n              orderBy: {\n                criadoEm: \"desc\",\n              },\n            });\n    }\n\n";

const ancoraValores =
  "            nomePolo:\n              nomeUnidadeDocumento,";

const inserirValores =
  "            funcionarioDataDesligamento:\n              formatarDataDocumento(\n                rescisao?.dataDesligamento ||\n                funcionario?.dataDesligamento\n              ),\n\n            dataDesligamentoFuncionario:\n              formatarDataDocumento(\n                funcionario?.dataDesligamento\n              ),\n\n            periodoAquisitivoInicio:\n              formatarDataDocumento(\n                ferias?.periodoAquisitivoInicio\n              ),\n\n            periodoAquisitivoFim:\n              formatarDataDocumento(\n                ferias?.periodoAquisitivoFim\n              ),\n\n            periodoGozoInicio:\n              formatarDataDocumento(\n                ferias?.dataInicio\n              ),\n\n            periodoGozoFim:\n              formatarDataDocumento(\n                ferias?.dataFim\n              ),\n\n            diasFerias:\n              String(\n                ferias?.dias || \"\"\n              ),\n\n            dataPagamentoFerias:\n              formatarDataDocumento(\n                ferias?.dataPagamento\n              ),\n\n            dataRetornoTrabalho:\n              formatarDataDocumento(\n                ferias?.dataRetorno\n              ),\n\n            valorFerias:\n              formatarMoeda(\n                ferias?.valorFerias\n              ),\n\n            valorTercoConstitucional:\n              formatarMoeda(\n                ferias?.valorTercoConstitucional\n              ),\n\n            valorLiquidoFerias:\n              formatarMoeda(\n                ferias?.valorLiquidoFerias\n              ),\n\n            tipoAso:\n              exame?.tipo || \"\",\n\n            numeroAso:\n              exame\n                ? String(exame.id)\n                : \"\",\n\n            dataAso:\n              formatarDataDocumento(\n                exame?.dataExame\n              ),\n\n            medicoResponsavel:\n              exame?.medico || \"\",\n\n            crmMedico:\n              exame?.crm || \"\",\n\n            resultadoAso:\n              exame?.resultado || \"\",\n\n            observacoesAso:\n              exame?.observacoes || \"\",\n\n            motivoDemissao:\n              rescisao?.motivo || \"\",\n\n            tipoRescisao:\n              rescisao?.tipo || \"\",\n\n            dataAdmissao:\n              formatarDataDocumento(\n                rescisao?.dataAdmissaoBase ||\n                funcionario?.dataAdmissao\n              ),\n\n            dataDemissao:\n              formatarDataDocumento(\n                rescisao?.dataDesligamento\n              ),\n\n            saldoSalario:\n              formatarMoeda(\n                rescisao?.saldoSalario\n              ),\n\n            feriasVencidas:\n              formatarMoeda(\n                rescisao?.feriasVencidas\n              ),\n\n            feriasProporcionais:\n              formatarMoeda(\n                rescisao?.feriasProporcionais\n              ),\n\n            decimoTerceiroProporcional:\n              formatarMoeda(\n                rescisao?.decimoTerceiroProporcional\n              ),\n\n            avisoPrevio:\n              formatarMoeda(\n                rescisao?.avisoPrevio\n              ),\n\n            multaFgts:\n              formatarMoeda(\n                rescisao?.multaFgts\n              ),\n\n            descontoInss:\n              formatarMoeda(\n                rescisao?.descontoInss\n              ),\n\n            descontoIrrf:\n              formatarMoeda(\n                rescisao?.descontoIrrf\n              ),\n\n            outrosDescontos:\n              formatarMoeda(\n                rescisao?.outrosDescontos\n              ),\n\n            valorBrutoRescisao:\n              formatarMoeda(\n                rescisao?.valorBrutoRescisao\n              ),\n\n            valorLiquidoRescisao:\n              formatarMoeda(\n                rescisao?.valorLiquidoRescisao\n              ),\n\n            valorRescisao:\n              formatarMoeda(\n                rescisao?.valorLiquidoRescisao ||\n                rescisao?.valorRescisao\n              ),\n\n            motivoAdvertencia:\n              ocorrencia?.tipo ===\n              \"ADVERTENCIA\"\n                ? ocorrencia?.motivo || \"\"\n                : \"\",\n\n            descricaoAdvertencia:\n              ocorrencia?.tipo ===\n              \"ADVERTENCIA\"\n                ? ocorrencia?.descricao || \"\"\n                : \"\",\n\n            dataAdvertencia:\n              ocorrencia?.tipo ===\n              \"ADVERTENCIA\"\n                ? formatarDataDocumento(\n                    ocorrencia?.dataEvento\n                  )\n                : \"\",\n\n            motivoSuspensao:\n              ocorrencia?.tipo ===\n              \"SUSPENSAO\"\n                ? ocorrencia?.motivo || \"\"\n                : \"\",\n\n            descricaoSuspensao:\n              ocorrencia?.tipo ===\n              \"SUSPENSAO\"\n                ? ocorrencia?.descricao || \"\"\n                : \"\",\n\n            dataInicioSuspensao:\n              ocorrencia?.tipo ===\n              \"SUSPENSAO\"\n                ? formatarDataDocumento(\n                    ocorrencia?.dataInicio\n                  )\n                : \"\",\n\n            dataFimSuspensao:\n              ocorrencia?.tipo ===\n              \"SUSPENSAO\"\n                ? formatarDataDocumento(\n                    ocorrencia?.dataFim\n                  )\n                : \"\",\n\n            diasSuspensao:\n              ocorrencia?.tipo ===\n              \"SUSPENSAO\"\n                ? String(\n                    ocorrencia?.dias || \"\"\n                  )\n                : \"\",\n\n            tipoAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? ocorrencia?.tipo || \"\"\n                : \"\",\n\n            motivoAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? ocorrencia?.motivo || \"\"\n                : \"\",\n\n            cidAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? ocorrencia?.cid || \"\"\n                : \"\",\n\n            dataInicioAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? formatarDataDocumento(\n                    ocorrencia?.dataInicio\n                  )\n                : \"\",\n\n            dataFimAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? formatarDataDocumento(\n                    ocorrencia?.dataFim\n                  )\n                : \"\",\n\n            diasAfastamento:\n              ocorrencia?.tipo?.includes(\n                \"AFASTAMENTO\"\n              ) ||\n              ocorrencia?.tipo ===\n                \"RETORNO_TRABALHO\"\n                ? String(\n                    ocorrencia?.dias || \"\"\n                  )\n                : \"\",\n\n            dataPericia:\n              formatarDataDocumento(\n                ocorrencia?.dataPericia\n              ),\n\n            resultadoPericia:\n              ocorrencia?.resultadoPericia ||\n              \"\",\n\n            blocoEmpregadorColaborador: `\n<table style=\"width:100%; border-collapse:collapse; margin-top:8px; margin-bottom:8px; line-height:inherit; font-size:inherit;\">\n  <tr>\n    <td style=\"width:50%; vertical-align:top; padding:6px 10px 6px 0;\">\n      <strong>EMPREGADOR</strong><br>\n      <strong>Nome:</strong> ${nomeInstituicao}<br>\n      <strong>CNPJ:</strong> ${config?.cnpj || \"\"}<br>\n      <strong>Telefone:</strong> ${config?.telefone || \"\"}<br>\n      <strong>E-mail:</strong> ${config?.email || \"\"}\n    </td>\n\n    <td style=\"width:50%; vertical-align:top; padding:6px 0 6px 10px;\">\n      <strong>COLABORADOR</strong><br>\n      <strong>Nome:</strong> ${funcionario?.nome || \"\"}<br>\n      <strong>CPF:</strong> ${funcionario?.cpf || \"\"}<br>\n      <strong>Cargo:</strong> ${funcionario?.cargo || \"\"}<br>\n      <strong>Departamento:</strong> ${\n        funcionario?.departamento?.nome ||\n        funcionario?.setor ||\n        \"\"\n      }\n    </td>\n  </tr>\n</table>\n`,\n\n            blocoVerbasRescisorias: `\n<div style=\"font-size:inherit; line-height:inherit;\">\n  <strong>VERBAS RESCISÓRIAS</strong><br>\n  Saldo de salário: ${formatarMoeda(rescisao?.saldoSalario)}<br>\n  Férias vencidas: ${formatarMoeda(rescisao?.feriasVencidas)}<br>\n  Férias proporcionais: ${formatarMoeda(rescisao?.feriasProporcionais)}<br>\n  Décimo terceiro proporcional: ${formatarMoeda(\n    rescisao?.decimoTerceiroProporcional\n  )}<br>\n  Aviso prévio: ${formatarMoeda(rescisao?.avisoPrevio)}<br>\n  Multa do FGTS: ${formatarMoeda(rescisao?.multaFgts)}\n</div>\n`,\n\n            blocoValoresRescisao: `\n<div style=\"font-size:inherit; line-height:inherit;\">\n  <strong>VALORES FINAIS</strong><br>\n  Valor bruto da rescisão: ${formatarMoeda(rescisao?.valorBrutoRescisao)}<br>\n  Desconto INSS: ${formatarMoeda(rescisao?.descontoInss)}<br>\n  Desconto IRRF: ${formatarMoeda(rescisao?.descontoIrrf)}<br>\n  Outros descontos: ${formatarMoeda(rescisao?.outrosDescontos)}<br>\n  Valor líquido da rescisão: ${formatarMoeda(\n    rescisao?.valorLiquidoRescisao ||\n    rescisao?.valorRescisao\n  )}\n</div>\n`,\n\n            blocoAssinaturasRescisao: `\n<table style=\"width:100%; border-collapse:collapse; margin-top:10px; page-break-inside:avoid; break-inside:avoid; font-size:inherit; line-height:1;\">\n  <tr>\n    <td style=\"width:50%; text-align:center; vertical-align:top; padding-right:10px;\">\n      <div style=\"width:75%; margin:0 auto; line-height:0.8;\">____________________________</div>\n      <div style=\"margin-top:0; line-height:1;\">${nomeInstituicao}</div>\n      <div style=\"margin-top:0; line-height:1;\">${config?.cnpj || \"\"}</div>\n    </td>\n\n    <td style=\"width:50%; text-align:center; vertical-align:top; padding-left:10px;\">\n      <div style=\"width:75%; margin:0 auto; line-height:0.8;\">____________________________</div>\n      <div style=\"margin-top:0; line-height:1;\">${funcionario?.nome || \"\"}</div>\n      <div style=\"margin-top:0; line-height:1;\">${funcionario?.cpf || \"\"}</div>\n    </td>\n  </tr>\n</table>\n`,\n\n            blocoRescisaoAssinaturaCompleto: `\n<table\n  style=\"\n    width:100%;\n    border-collapse:collapse;\n    margin-top:12px;\n    page-break-inside:avoid;\n    break-inside:avoid;\n    font-size:inherit;\n    line-height:1.2;\n  \"\n>\n  <tr>\n    <td style=\"width:50%; vertical-align:top; padding-right:24px;\">\n      <strong>EMPREGADOR</strong><br><br>\n\n      <strong>Nome:</strong> ${nomeInstituicao}<br>\n      <strong>CNPJ:</strong> ${config?.cnpj || \"\"}<br>\n      <strong>Telefone:</strong> ${config?.telefone || \"\"}\n    </td>\n\n    <td style=\"width:50%; vertical-align:top; padding-left:24px;\">\n      <strong>COLABORADOR</strong><br><br>\n\n      <strong>Nome:</strong> ${funcionario?.nome || \"\"}<br>\n      <strong>CPF:</strong> ${funcionario?.cpf || \"\"}<br>\n      <strong>Cargo:</strong> ${funcionario?.cargo || \"\"}\n    </td>\n  </tr>\n\n  <tr>\n    <td colspan=\"2\" style=\"height:28px;\"></td>\n  </tr>\n\n  <tr>\n    <td\n      style=\"\n        width:50%;\n        text-align:center;\n        vertical-align:top;\n        padding-right:24px;\n      \"\n    >\n      <div\n        style=\"\n          width:70%;\n          margin:0 auto;\n          line-height:0.8;\n        \"\n      >\n        ______________________________\n      </div>\n\n      <div style=\"margin-top:4px; line-height:1.2;\">\n        ${nomeInstituicao}\n      </div>\n\n      <div style=\"line-height:1.2;\">\n        ${config?.cnpj || \"\"}\n      </div>\n    </td>\n\n    <td\n      style=\"\n        width:50%;\n        text-align:center;\n        vertical-align:top;\n        padding-left:24px;\n      \"\n    >\n      <div\n        style=\"\n          width:70%;\n          margin:0 auto;\n          line-height:0.8;\n        \"\n      >\n        ______________________________\n      </div>\n\n      <div style=\"margin-top:4px; line-height:1.2;\">\n        ${funcionario?.nome || \"\"}\n      </div>\n\n      <div style=\"line-height:1.2;\">\n        ${funcionario?.cpf || \"\"}\n      </div>\n    </td>\n  </tr>\n</table>\n`,\n\n            blocoDadosFuncionarioRescisao: `\n<table style=\"width:100%; border-collapse:collapse; margin-bottom:8px; font-size:10pt; line-height:1.2;\">\n  <tr>\n    <td style=\"width:50%; vertical-align:top; padding-right:10px;\">\n      <strong>Funcionário:</strong> ${funcionario?.nome || \"\"}<br>\n      <strong>CPF:</strong> ${funcionario?.cpf || \"\"}<br>\n      <strong>Cargo:</strong> ${funcionario?.cargo || \"\"}\n    </td>\n\n    <td style=\"width:50%; vertical-align:top; padding-left:10px;\">\n      <strong>Departamento:</strong> ${\n        funcionario?.departamento?.nome ||\n        funcionario?.setor ||\n        \"\"\n      }<br>\n      <strong>Data de admissão:</strong> ${formatarDataDocumento(\n        rescisao?.dataAdmissaoBase ||\n        funcionario?.dataAdmissao\n      )}<br>\n      <strong>Data de desligamento:</strong> ${formatarDataDocumento(\n        rescisao?.dataDesligamento ||\n        funcionario?.dataDesligamento\n      )}<br>\n      <strong>Tipo de rescisão:</strong> ${rescisao?.tipo || \"\"}\n    </td>\n  </tr>\n</table>\n`,\n\n";

const ancoraAutomaticas =
  "  \"nomeProfessor\",\n]);";

const inserirAutomaticas =
  "  \"nomeProfessor\",\n  \"funcionarioDataDesligamento\",\n  \"dataDesligamentoFuncionario\",\n\n  // RH - férias\n  \"periodoAquisitivoInicio\",\n  \"periodoAquisitivoFim\",\n  \"periodoGozoInicio\",\n  \"periodoGozoFim\",\n  \"diasFerias\",\n  \"dataPagamentoFerias\",\n  \"dataRetornoTrabalho\",\n  \"valorFerias\",\n  \"valorTercoConstitucional\",\n  \"valorLiquidoFerias\",\n\n  // RH - ASO / medicina ocupacional\n  \"tipoAso\",\n  \"numeroAso\",\n  \"dataAso\",\n  \"medicoResponsavel\",\n  \"crmMedico\",\n  \"resultadoAso\",\n  \"observacoesAso\",\n\n  // RH - rescisão / demissão\n  \"motivoDemissao\",\n  \"tipoRescisao\",\n  \"dataAdmissao\",\n  \"dataDemissao\",\n  \"saldoSalario\",\n  \"feriasVencidas\",\n  \"feriasProporcionais\",\n  \"decimoTerceiroProporcional\",\n  \"avisoPrevio\",\n  \"multaFgts\",\n  \"descontoInss\",\n  \"descontoIrrf\",\n  \"outrosDescontos\",\n  \"valorBrutoRescisao\",\n  \"valorLiquidoRescisao\",\n  \"valorRescisao\",\n  \"blocoDadosFuncionarioRescisao\",\n  \"blocoEmpregadorColaborador\",\n  \"blocoVerbasRescisorias\",\n  \"blocoValoresRescisao\",\n  \"blocoAssinaturasRescisao\",\n  \"blocoRescisaoAssinaturaCompleto\",\n\n  // RH - advertência / suspensão\n  \"motivoAdvertencia\",\n  \"descricaoAdvertencia\",\n  \"dataAdvertencia\",\n  \"motivoSuspensao\",\n  \"descricaoSuspensao\",\n  \"dataInicioSuspensao\",\n  \"dataFimSuspensao\",\n  \"diasSuspensao\",\n\n  // RH - afastamentos\n  \"tipoAfastamento\",\n  \"motivoAfastamento\",\n  \"cidAfastamento\",\n  \"dataInicioAfastamento\",\n  \"dataFimAfastamento\",\n  \"diasAfastamento\",\n  \"dataPericia\",\n  \"resultadoPericia\",\n";

exigirUmaOcorrencia(
  gerar,
  ancoraHelper,
  "helper de formatação de data"
);

exigirUmaOcorrencia(
  gerar,
  ancoraIds,
  "IDs opcionais de ocorrência e rescisão"
);

exigirUmaOcorrencia(
  gerar,
  ancoraVariaveis,
  "variáveis de dados específicos de RH"
);

exigirUmaOcorrencia(
  gerar,
  ancoraCarregamento,
  "carregamento de férias, ASO, rescisão e ocorrência"
);

exigirUmaOcorrencia(
  gerar,
  ancoraValores,
  "valores automáticos das tags específicas de RH"
);

exigirUmaOcorrencia(
  templates,
  ancoraAutomaticas,
  "lista de tags automáticas específicas de RH"
);

gerar =
  inserirAntes(
    gerar,
    ancoraHelper,
    inserirHelper,
    "helper de formatação de data"
  );

gerar =
  inserirAntes(
    gerar,
    ancoraIds,
    inserirIds,
    "IDs opcionais de ocorrência e rescisão"
  );

gerar =
  inserirAntes(
    gerar,
    ancoraVariaveis,
    inserirVariaveis,
    "variáveis de dados específicos de RH"
  );

gerar =
  inserirAntes(
    gerar,
    ancoraCarregamento,
    inserirCarregamento,
    "carregamento de férias, ASO, rescisão e ocorrência"
  );

gerar =
  inserirAntes(
    gerar,
    ancoraValores,
    inserirValores,
    "valores automáticos das tags específicas de RH"
  );

templates =
  templates.replace(
    ancoraAutomaticas,
    `${inserirAutomaticas}]);`
  );

const verificacoesGerador = [
  "const ocorrenciaId =",
  "const rescisaoId =",
  "await prisma.feriasRH.findFirst",
  "await prisma.exameMedicoRH.findFirst",
  "await prisma.rescisaoRH.findFirst",
  "await prisma.ocorrenciaRH.findFirst",
  "periodoAquisitivoInicio:",
  "tipoAso:",
  "motivoDemissao:",
  "motivoAdvertencia:",
  "motivoSuspensao:",
  "tipoAfastamento:",
  "blocoDadosFuncionarioRescisao:",
  "blocoRescisaoAssinaturaCompleto:",
];

for (
  const verificacao of
  verificacoesGerador
) {
  if (
    !gerar.includes(
      verificacao
    )
  ) {
    falhar(
      `Validação interna falhou: "${verificacao}" não foi encontrada no gerador transformado. Nenhum arquivo foi alterado.`
    );
  }
}

const protecoesExistentes = [
  "logoInstituicao:\n              marcadorLogoInstituicao,",
  "__PHANYX_ASSINATURA_DIRETOR__",
  "__PHANYX_BLOCO_ASSINATURA_DIRETOR__",
  "valoresTemplate.cursoNome",
  "valoresTemplate.disciplinasContratadas",
];

for (
  const protecao of
  protecoesExistentes
) {
  if (
    !gerar.includes(
      protecao
    )
  ) {
    falhar(
      `Segurança: uma correção anterior que deve ser preservada não foi encontrada: "${protecao}". Nenhum arquivo foi alterado.`
    );
  }
}

const blocoAutomaticasNovo =
  extrairBlocoAutomaticas(
    templates
  );

for (
  const marcador of
  marcadoresAutomaticas
) {
  if (
    !blocoAutomaticasNovo.includes(
      marcador
    )
  ) {
    falhar(
      `Validação interna falhou: tag automática ${marcador} não foi adicionada. Nenhum arquivo foi alterado.`
    );
  }
}

const tagsHoleriteNaoAlterar = [
  '"competenciaMes"',
  '"competenciaAno"',
  '"competenciaHolerite"',
  '"eventosHolerite"',
  '"totalVencimentos"',
  '"totalDescontos"',
  '"valorLiquido"',
  '"baseInss"',
  '"baseFgts"',
  '"fgtsMes"',
  '"baseIrrf"',
];

for (
  const tag of
  tagsHoleriteNaoAlterar
) {
  if (
    blocoAutomaticasNovo.includes(
      tag
    )
  ) {
    falhar(
      `Segurança: a tag de holerite ${tag} apareceu no conjunto automático desta etapa. O script foi interrompido para não alterar a regra de competência. Nenhum arquivo foi alterado.`
    );
  }
}

verificarSintaxe(
  "app/api/admin/documentos/gerar/route.ts",
  gerar
);

verificarSintaxe(
  "app/api/admin/documentos/templates/route.ts",
  templates
);

const agora =
  new Date();

const carimbo =
  agora
    .toISOString()
    .replace(
      /[-:]/g,
      ""
    )
    .replace(
      /\.\d{3}Z$/,
      "Z"
    );

const backupGerar =
  `${arquivoGerar}.antes-tags-rh-especificas-${carimbo}.bak`;

const backupTemplates =
  `${arquivoTemplates}.antes-tags-rh-especificas-${carimbo}.bak`;

fs.copyFileSync(
  arquivoGerar,
  backupGerar
);

fs.copyFileSync(
  arquivoTemplates,
  backupTemplates
);

try {
  fs.writeFileSync(
    arquivoGerar,
    restaurarEol(
      gerar,
      eolGerar
    ),
    "utf8"
  );

  fs.writeFileSync(
    arquivoTemplates,
    restaurarEol(
      templates,
      eolTemplates
    ),
    "utf8"
  );
} catch (erro) {
  fs.copyFileSync(
    backupGerar,
    arquivoGerar
  );

  fs.copyFileSync(
    backupTemplates,
    arquivoTemplates
  );

  throw erro;
}

console.log("");
console.log(
  "=== TAGS ESPECÍFICAS DE RH RESTAURADAS ==="
);
console.log("");
console.log(
  "OK: férias usam o registro mais recente do funcionário"
);
console.log(
  "OK: ASO usa o exame médico mais recente do funcionário"
);
console.log(
  "OK: rescisão respeita rescisaoId e, sem ID, usa a mais recente"
);
console.log(
  "OK: advertência, suspensão e afastamento respeitam ocorrenciaId e mantêm a seleção histórica por tipo"
);
console.log(
  "OK: blocos de rescisão voltaram a usar dados reais"
);
console.log(
  "OK: tags restauradas foram marcadas como automáticas"
);
console.log(
  "OK: logo, assinatura do diretor e aliases acadêmicos anteriores foram preservados"
);
console.log(
  "OK: tags de holerite NÃO foram alteradas nesta etapa"
);
console.log("");
console.log(
  `Backup: ${path.relative(raiz, backupGerar)}`
);
console.log(
  `Backup: ${path.relative(raiz, backupTemplates)}`
);
console.log("");
console.log(
  "Próximo passo: execute npx tsc --noEmit"
);
