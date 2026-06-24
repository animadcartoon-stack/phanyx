import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatarData(data?: Date | string | null) {
  if (!data) return "";
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: any) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function substituirTags(texto: string, valores: Record<string, string>) {
  let resultado = texto || "";

  Object.entries(valores).forEach(([tag, valor]) => {
    resultado = resultado.replaceAll(tag, valor || "");
  });

  return resultado;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();

    const funcionarioId = Number(body.funcionarioId);
    const templateId = Number(body.templateId);
    const ocorrenciaId = body.ocorrenciaId ? Number(body.ocorrenciaId) : null;
    const rescisaoId = body.rescisaoId ? Number(body.rescisaoId) : null;

    if (!funcionarioId || !templateId) {
      return NextResponse.json(
        { error: "Informe o funcionário e o template." },
        { status: 400 }
      );
    }

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id: funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        departamento: true,
        instituicao: {
          include: {
            configuracaoInstituicao: true,
          },
        },
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    const template = await prisma.documentoTemplate.findFirst({
      where: {
        id: templateId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Template não encontrado." },
        { status: 404 }
      );
    }

    const ferias = await prisma.feriasRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      orderBy: { criadoEm: "desc" },
    });

    const exame = await prisma.exameMedicoRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      orderBy: { criadoEm: "desc" },
    });

    const rescisao = rescisaoId
  ? await prisma.rescisaoRH.findFirst({
      where: {
        id: rescisaoId,
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
    })
  : await prisma.rescisaoRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      orderBy: { criadoEm: "desc" },
    });

    const ocorrencia = ocorrenciaId
  ? await prisma.ocorrenciaRH.findFirst({
      where: {
        id: ocorrenciaId,
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
    })
  : await prisma.ocorrenciaRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
        tipo: {
          in:
            template.tipo === "ADVERTENCIA"
              ? ["ADVERTENCIA"]
              : template.tipo === "SUSPENSAO"
              ? ["SUSPENSAO"]
              : [
                  "ADVERTENCIA",
                  "SUSPENSAO",
                  "AFASTAMENTO_MEDICO",
                  "AFASTAMENTO_MATERNIDADE",
                  "AFASTAMENTO_PERICIA",
                  "RETORNO_TRABALHO",
                ],
        },
      },
      orderBy: { criadoEm: "desc" },
    });

    const instituicao = funcionario.instituicao;
    const config = instituicao.configuracaoInstituicao;

    const valores: Record<string, string> = {
      "{{nomeInstituicao}}": config?.nomeFantasia || instituicao.nome || "",
      "{{cnpjInstituicao}}": config?.cnpj || "",
      "{{enderecoInstituicao}}": config?.endereco || "",
      "{{telefoneInstituicao}}": config?.telefone || "",
      "{{emailInstituicao}}": config?.email || "",
      "{{cidadeInstituicao}}": config?.cidade || "",
      "{{estadoInstituicao}}": config?.estado || "",
      "{{cepInstituicao}}": config?.cep || "",
      "{{responsavelLegal}}": config?.responsavelLegal || "",
      "{{cidadeAssinatura}}": config?.cidadeAssinatura || config?.cidade || "",
      "{{dataAtual}}": formatarData(new Date()),

      "{{nomeFuncionario}}": funcionario.nome || "",
      "{{funcionarioNome}}": funcionario.nome || "",
      "{{funcionarioCpf}}": funcionario.cpf || "",
      "{{funcionarioRg}}": funcionario.rg || "",
      "{{funcionarioCargo}}": funcionario.cargo || "",
      "{{funcionarioDepartamento}}": funcionario.departamento?.nome || funcionario.setor || "",
      "{{funcionarioDataAdmissao}}": formatarData(funcionario.dataAdmissao),
      "{{funcionarioDataDesligamento}}": formatarData(
  rescisao?.dataDesligamento || funcionario.dataDesligamento
),
      "{{cpfFuncionario}}": funcionario.cpf || "",
      "{{rgFuncionario}}": funcionario.rg || "",
      "{{pisPasepFuncionario}}": funcionario.pisPasep || "",
      "{{codigoFuncionario}}": funcionario.codigoFuncionario || "",
      "{{cargoFuncionario}}": funcionario.cargo || "",
      "{{departamentoFuncionario}}":
        funcionario.departamento?.nome || funcionario.setor || "",
      "{{salarioBaseFuncionario}}": formatarMoeda(
        funcionario.salarioBase || funcionario.salario
      ),
      "{{tipoContratoFuncionario}}": funcionario.tipoContrato || "",
      "{{cargaHorariaMensalFuncionario}}": String(
        funcionario.cargaHorariaMensal || ""
      ),
      "{{dataAdmissaoFuncionario}}": formatarData(funcionario.dataAdmissao),
      "{{dataDesligamentoFuncionario}}": formatarData(
        funcionario.dataDesligamento
      ),

      "{{periodoAquisitivoInicio}}": formatarData(
        ferias?.periodoAquisitivoInicio
      ),
      "{{periodoAquisitivoFim}}": formatarData(ferias?.periodoAquisitivoFim),
      "{{periodoGozoInicio}}": formatarData(ferias?.dataInicio),
      "{{periodoGozoFim}}": formatarData(ferias?.dataFim),
      "{{diasFerias}}": String(ferias?.dias || ""),
      "{{dataPagamentoFerias}}": formatarData(ferias?.dataPagamento),
      "{{dataRetornoTrabalho}}": formatarData(ferias?.dataRetorno),
      "{{valorFerias}}": formatarMoeda(ferias?.valorFerias),
      "{{valorTercoConstitucional}}": formatarMoeda(
        ferias?.valorTercoConstitucional
      ),
      "{{valorLiquidoFerias}}": formatarMoeda(ferias?.valorLiquidoFerias),

      "{{tipoAso}}": exame?.tipo || "",
      "{{numeroAso}}": exame ? String(exame.id) : "",
      "{{dataAso}}": formatarData(exame?.dataExame),
      "{{medicoResponsavel}}": exame?.medico || "",
      "{{crmMedico}}": exame?.crm || "",
      "{{resultadoAso}}": exame?.resultado || "",
      "{{observacoesAso}}": exame?.observacoes || "",

      "{{motivoDemissao}}": rescisao?.motivo || "",
"{{tipoRescisao}}": rescisao?.tipo || "",
"{{dataAdmissao}}": formatarData(
  rescisao?.dataAdmissaoBase || funcionario.dataAdmissao
),
"{{dataDemissao}}": formatarData(rescisao?.dataDesligamento),

"{{saldoSalario}}": formatarMoeda(rescisao?.saldoSalario),
"{{feriasVencidas}}": formatarMoeda(rescisao?.feriasVencidas),
"{{feriasProporcionais}}": formatarMoeda(rescisao?.feriasProporcionais),
"{{decimoTerceiroProporcional}}": formatarMoeda(
  rescisao?.decimoTerceiroProporcional
),
"{{avisoPrevio}}": formatarMoeda(rescisao?.avisoPrevio),
"{{multaFgts}}": formatarMoeda(rescisao?.multaFgts),

"{{descontoInss}}": formatarMoeda(rescisao?.descontoInss),
"{{descontoIrrf}}": formatarMoeda(rescisao?.descontoIrrf),
"{{outrosDescontos}}": formatarMoeda(rescisao?.outrosDescontos),

"{{valorBrutoRescisao}}": formatarMoeda(rescisao?.valorBrutoRescisao),
"{{valorLiquidoRescisao}}": formatarMoeda(rescisao?.valorLiquidoRescisao),
"{{valorRescisao}}": formatarMoeda(
  rescisao?.valorLiquidoRescisao || rescisao?.valorRescisao
),

      "{{motivoAdvertencia}}":
        ocorrencia?.tipo === "ADVERTENCIA" ? ocorrencia?.motivo || "" : "",
      "{{descricaoAdvertencia}}":
        ocorrencia?.tipo === "ADVERTENCIA" ? ocorrencia?.descricao || "" : "",
      "{{dataAdvertencia}}":
        ocorrencia?.tipo === "ADVERTENCIA"
          ? formatarData(ocorrencia?.dataEvento)
          : "",

      "{{motivoSuspensao}}":
        ocorrencia?.tipo === "SUSPENSAO" ? ocorrencia?.motivo || "" : "",
      "{{descricaoSuspensao}}":
        ocorrencia?.tipo === "SUSPENSAO" ? ocorrencia?.descricao || "" : "",
      "{{dataInicioSuspensao}}":
        ocorrencia?.tipo === "SUSPENSAO"
          ? formatarData(ocorrencia?.dataInicio)
          : "",
      "{{dataFimSuspensao}}":
        ocorrencia?.tipo === "SUSPENSAO"
          ? formatarData(ocorrencia?.dataFim)
          : "",
      "{{diasSuspensao}}":
        ocorrencia?.tipo === "SUSPENSAO" ? String(ocorrencia?.dias || "") : "",

      "{{tipoAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? ocorrencia?.tipo || ""
          : "",
      "{{motivoAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? ocorrencia?.motivo || ""
          : "",
      "{{cidAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? ocorrencia?.cid || ""
          : "",
      "{{dataInicioAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? formatarData(ocorrencia?.dataInicio)
          : "",
      "{{dataFimAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? formatarData(ocorrencia?.dataFim)
          : "",
      "{{diasAfastamento}}":
        ocorrencia?.tipo?.includes("AFASTAMENTO") ||
        ocorrencia?.tipo === "RETORNO_TRABALHO"
          ? String(ocorrencia?.dias || "")
          : "",
      "{{dataPericia}}": formatarData(ocorrencia?.dataPericia),
      "{{resultadoPericia}}": ocorrencia?.resultadoPericia || "",
    };
valores["{{blocoEmpregadorColaborador}}"] = `
<table style="width:100%; border-collapse:collapse; margin-top:8px; margin-bottom:8px; line-height:inherit; font-size:inherit;">
  <tr>
    <td style="width:50%; vertical-align:top; padding:6px 10px 6px 0;">
      <strong>EMPREGADOR</strong><br>
      <strong>Nome:</strong> ${config?.nomeFantasia || instituicao.nome || ""}<br>
      <strong>CNPJ:</strong> ${config?.cnpj || ""}<br>
      <strong>Telefone:</strong> ${config?.telefone || ""}<br>
      <strong>E-mail:</strong> ${config?.email || ""}
    </td>

    <td style="width:50%; vertical-align:top; padding:6px 0 6px 10px;">
      <strong>COLABORADOR</strong><br>
      <strong>Nome:</strong> ${funcionario.nome || ""}<br>
      <strong>CPF:</strong> ${funcionario.cpf || ""}<br>
      <strong>Cargo:</strong> ${funcionario.cargo || ""}<br>
      <strong>Departamento:</strong> ${
        funcionario.departamento?.nome || funcionario.setor || ""
      }
    </td>
  </tr>
</table>
`;

valores["{{blocoVerbasRescisorias}}"] = `
<div style="font-size:inherit; line-height:inherit;">
  <strong>VERBAS RESCISÓRIAS</strong><br>
  Saldo de salário: ${formatarMoeda(rescisao?.saldoSalario)}<br>
  Férias vencidas: ${formatarMoeda(rescisao?.feriasVencidas)}<br>
  Férias proporcionais: ${formatarMoeda(rescisao?.feriasProporcionais)}<br>
  Décimo terceiro proporcional: ${formatarMoeda(rescisao?.decimoTerceiroProporcional)}<br>
  Aviso prévio: ${formatarMoeda(rescisao?.avisoPrevio)}<br>
  Multa do FGTS: ${formatarMoeda(rescisao?.multaFgts)}
</div>
`;

valores["{{blocoValoresRescisao}}"] = `
<div style="font-size:inherit; line-height:inherit;">
  <strong>VALORES FINAIS</strong><br>
  Valor bruto da rescisão: ${formatarMoeda(rescisao?.valorBrutoRescisao)}<br>
  Desconto INSS: ${formatarMoeda(rescisao?.descontoInss)}<br>
  Desconto IRRF: ${formatarMoeda(rescisao?.descontoIrrf)}<br>
  Outros descontos: ${formatarMoeda(rescisao?.outrosDescontos)}<br>
  Valor líquido da rescisão: ${formatarMoeda(
    rescisao?.valorLiquidoRescisao || rescisao?.valorRescisao
  )}
</div>
`;

valores["{{blocoAssinaturasRescisao}}"] = `
<table style="width:100%; border-collapse:collapse; margin-top:10px; page-break-inside:avoid; break-inside:avoid; font-size:inherit; line-height:1;">
  <tr>
    <td style="width:50%; text-align:center; vertical-align:top; padding-right:10px;">
      <div style="width:75%; margin:0 auto; line-height:0.8;">____________________________</div>
      <div style="margin-top:0; line-height:1;">${config?.nomeFantasia || instituicao.nome || ""}</div>
      <div style="margin-top:0; line-height:1;">${config?.cnpj || ""}</div>
    </td>

    <td style="width:50%; text-align:center; vertical-align:top; padding-left:10px;">
      <div style="width:75%; margin:0 auto; line-height:0.8;">____________________________</div>
      <div style="margin-top:0; line-height:1;">${funcionario.nome || ""}</div>
      <div style="margin-top:0; line-height:1;">${funcionario.cpf || ""}</div>
    </td>
  </tr>
</table>
`;

valores["{{blocoRescisaoAssinaturaCompleto}}"] = `
<table
  style="
    width:100%;
    border-collapse:collapse;
    margin-top:12px;
    page-break-inside:avoid;
    break-inside:avoid;
    font-size:inherit;
    line-height:1.2;
  "
>
  <tr>
    <td style="width:50%; vertical-align:top; padding-right:24px;">
      <strong>EMPREGADOR</strong><br><br>

      <strong>Nome:</strong> ${config?.nomeFantasia || instituicao.nome || ""}<br>
      <strong>CNPJ:</strong> ${config?.cnpj || ""}<br>
      <strong>Telefone:</strong> ${config?.telefone || ""}
    </td>

    <td style="width:50%; vertical-align:top; padding-left:24px;">
      <strong>COLABORADOR</strong><br><br>

      <strong>Nome:</strong> ${funcionario.nome || ""}<br>
      <strong>CPF:</strong> ${funcionario.cpf || ""}<br>
      <strong>Cargo:</strong> ${funcionario.cargo || ""}
    </td>
  </tr>

  <tr>
    <td colspan="2" style="height:28px;"></td>
  </tr>

  <tr>
    <td
      style="
        width:50%;
        text-align:center;
        vertical-align:top;
        padding-right:24px;
      "
    >
      <div
        style="
          width:70%;
          margin:0 auto;
          line-height:0.8;
        "
      >
        ______________________________
      </div>

      <div style="margin-top:4px; line-height:1.2;">
        ${config?.nomeFantasia || instituicao.nome || ""}
      </div>

      <div style="line-height:1.2;">
        ${config?.cnpj || ""}
      </div>
    </td>

    <td
      style="
        width:50%;
        text-align:center;
        vertical-align:top;
        padding-left:24px;
      "
    >
      <div
        style="
          width:70%;
          margin:0 auto;
          line-height:0.8;
        "
      >
        ______________________________
      </div>

      <div style="margin-top:4px; line-height:1.2;">
        ${funcionario.nome || ""}
      </div>

      <div style="line-height:1.2;">
        ${funcionario.cpf || ""}
      </div>
    </td>
  </tr>
</table>
`;

valores["{{blocoDadosFuncionarioRescisao}}"] = `
<table style="width:100%; border-collapse:collapse; margin-bottom:8px; font-size:10pt; line-height:1.2;">
  <tr>
    <td style="width:50%; vertical-align:top; padding-right:10px;">
      <strong>Funcionário:</strong> ${funcionario.nome || ""}<br>
      <strong>CPF:</strong> ${funcionario.cpf || ""}<br>
      <strong>Cargo:</strong> ${funcionario.cargo || ""}
    </td>

    <td style="width:50%; vertical-align:top; padding-left:10px;">
      <strong>Departamento:</strong> ${
        funcionario.departamento?.nome || funcionario.setor || ""
      }<br>
      <strong>Data de admissão:</strong> ${formatarData(
        rescisao?.dataAdmissaoBase || funcionario.dataAdmissao
      )}<br>
      <strong>Data de desligamento:</strong> ${formatarData(
        rescisao?.dataDesligamento || funcionario.dataDesligamento
      )}<br>
      <strong>Tipo de rescisão:</strong> ${rescisao?.tipo || ""}
    </td>
  </tr>
</table>
`;

    const conteudoFinal = substituirTags(template.conteudo, valores);

    const documento = await prisma.documentoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: template.tipo,
        titulo: rescisao
          ? `Rescisão - ${funcionario.nome}`
          : template.nome,
        templateId: template.id,
        conteudo: conteudoFinal,
        status: "GERADO",
      },
    });

    return NextResponse.json(documento);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Erro ao gerar documento RH." },
      { status: 500 }
    );
  }
}