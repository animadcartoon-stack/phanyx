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

    const rescisao = await prisma.rescisaoRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
      },
      orderBy: { criadoEm: "desc" },
    });

    const ocorrencia = await prisma.ocorrenciaRH.findFirst({
      where: {
        funcionarioId,
        instituicaoId: user.instituicaoId,
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
      "{{dataDemissao}}": formatarData(rescisao?.dataDesligamento),
      "{{saldoSalario}}": formatarMoeda(rescisao?.saldoSalario),
      "{{feriasVencidas}}": formatarMoeda(rescisao?.feriasVencidas),
      "{{feriasProporcionais}}": formatarMoeda(rescisao?.feriasProporcionais),
      "{{decimoTerceiroProporcional}}": formatarMoeda(
        rescisao?.decimoTerceiroProporcional
      ),
      "{{avisoPrevio}}": formatarMoeda(rescisao?.avisoPrevio),
      "{{valorRescisao}}": formatarMoeda(rescisao?.valorRescisao),

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

    const conteudoFinal = substituirTags(template.conteudo, valores);

    const documento = await prisma.documentoRH.create({
      data: {
        funcionarioId,
        instituicaoId: user.instituicaoId!,
        criadoPorId: user.id,
        tipo: template.tipo,
        titulo: template.nome,
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