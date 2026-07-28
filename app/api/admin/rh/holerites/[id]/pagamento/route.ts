import { createHash, randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  FinalidadeContaBancariaRH,
  FormaPagamentoHoleriteRH,
  OrigemContaPagamentoHoleriteRH,
  StatusPagamentoHoleriteRH,
  TipoChavePixRH,
  TipoContaBancariaRH,
  TipoItemPagamentoHoleriteRH,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const FORMAS_QUE_EXIGEM_TRANSACAO = new Set<FormaPagamentoHoleriteRH>([
  FormaPagamentoHoleriteRH.FOLHA_BANCARIA,
  FormaPagamentoHoleriteRH.PIX,
  FormaPagamentoHoleriteRH.TRANSFERENCIA,
  FormaPagamentoHoleriteRH.CONTA_SALARIO,
  FormaPagamentoHoleriteRH.CHEQUE,
]);

const FORMAS_BANCARIAS = new Set<FormaPagamentoHoleriteRH>([
  FormaPagamentoHoleriteRH.FOLHA_BANCARIA,
  FormaPagamentoHoleriteRH.PIX,
  FormaPagamentoHoleriteRH.TRANSFERENCIA,
  FormaPagamentoHoleriteRH.CONTA_SALARIO,
]);

const FORMAS_QUE_EXIGEM_CONTA_DESTINO = new Set<FormaPagamentoHoleriteRH>([
  FormaPagamentoHoleriteRH.FOLHA_BANCARIA,
  FormaPagamentoHoleriteRH.TRANSFERENCIA,
  FormaPagamentoHoleriteRH.CONTA_SALARIO,
]);

const TIPOS_ITEM_PERMITIDOS = new Set<TipoItemPagamentoHoleriteRH>([
  TipoItemPagamentoHoleriteRH.SALARIO_E_DEMAIS,
  TipoItemPagamentoHoleriteRH.COMISSAO,
  TipoItemPagamentoHoleriteRH.REMUNERACAO_VARIAVEL,
]);

function arredondarCentavos(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

function calcularSha256(valor: string) {
  return createHash("sha256").update(valor).digest("hex");
}

function texto(valor: unknown, limite = 200) {
  return String(valor ?? "").trim().slice(0, limite);
}

function numeroEntrada(valor: unknown) {
  if (typeof valor === "number") return valor;

  const normalizado = String(valor ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");

  return Number(normalizado);
}

function dataValida(valor: unknown) {
  const data = new Date(String(valor ?? ""));
  return Number.isNaN(data.getTime()) ? null : data;
}

function usuarioPodeRegistrarPagamento(user: any) {
  const role = String(user?.role || "").toUpperCase();

  return (
    role === "ADMIN" || role === "SUPER_ADMIN" || user?.isMasterAdmin === true
  );
}

function valorEnum<T extends string>(
  valor: unknown,
  valoresValidos: readonly T[],
): T | null {
  const normalizado = texto(valor).toUpperCase() as T;
  return valoresValidos.includes(normalizado) ? normalizado : null;
}

function mascararFinal(valor: unknown, quantidadeVisivel = 4) {
  const limpo = texto(valor, 300);
  if (!limpo) return null;
  if (limpo.includes("***")) return limpo;

  if (limpo.length <= quantidadeVisivel) {
    return "*".repeat(Math.max(limpo.length, 3));
  }

  return `${"*".repeat(Math.max(limpo.length - quantidadeVisivel, 3))}${limpo.slice(
    -quantidadeVisivel,
  )}`;
}

function mascararDocumento(valor: unknown) {
  const digitos = texto(valor, 40).replace(/\D/g, "");
  if (!digitos) return null;
  return `***.***.***-${digitos.slice(-2).padStart(2, "*")}`;
}

function mascararChavePix(valor: unknown, tipo?: TipoChavePixRH | null) {
  const chave = texto(valor, 300);
  if (!chave) return null;

  if (tipo === TipoChavePixRH.EMAIL || chave.includes("@")) {
    const [usuario, dominio] = chave.split("@");
    if (!dominio) return mascararFinal(chave);

    return `${usuario.slice(0, 1) || "*"}${"*".repeat(
      Math.max(usuario.length - 1, 3),
    )}@${dominio}`;
  }

  if (
    tipo === TipoChavePixRH.CPF ||
    tipo === TipoChavePixRH.CNPJ ||
    tipo === TipoChavePixRH.TELEFONE
  ) {
    const digitos = chave.replace(/\D/g, "");
    return digitos ? `********${digitos.slice(-4)}` : mascararFinal(chave);
  }

  if (tipo === TipoChavePixRH.ALEATORIA && chave.length > 10) {
    return `${chave.slice(0, 4)}****${chave.slice(-4)}`;
  }

  return mascararFinal(chave);
}

function calcularComposicaoHolerite(holerite: any) {
  let comissao = 0;
  let remuneracaoVariavel = 0;

  for (const evento of holerite.eventos || []) {
    const valorEvento = arredondarCentavos(Number(evento.valor || 0));
    const sinal =
      String(evento.tipo || "").toUpperCase() === "DESCONTO" ? -1 : 1;
    const valorComSinal = arredondarCentavos(valorEvento * sinal);

    if ((evento.lancamentosComissaoRH || []).length > 0) {
      comissao = arredondarCentavos(comissao + valorComSinal);
      continue;
    }

    if ((evento.lancamentosRemuneracaoVariavelRH || []).length > 0) {
      remuneracaoVariavel = arredondarCentavos(
        remuneracaoVariavel + valorComSinal,
      );
    }
  }

  const valorLiquido = arredondarCentavos(Number(holerite.valorLiquido || 0));
  const salarioEDemais = arredondarCentavos(
    valorLiquido - comissao - remuneracaoVariavel,
  );

  return {
    valorLiquido,
    salarioEDemais,
    comissao,
    remuneracaoVariavel,
    exigePagamentoDividido: comissao > 0 || remuneracaoVariavel > 0,
  };
}

function serializarConta(conta: any) {
  if (!conta) return null;

  return {
    id: conta.id,
    finalidade: conta.finalidade,
    bancoCodigo: conta.bancoCodigo,
    bancoNome: conta.bancoNome,
    agencia: conta.agencia,
    conta: conta.conta,
    tipoConta: conta.tipoConta,
    tipoChavePix: conta.tipoChavePix,
    chavePix: conta.chavePix,
    titularNome: conta.titularNome,
    titularDocumentoMascarado: mascararDocumento(conta.titularDocumento),
  };
}

function respostaSemCache(dados: unknown, status = 200) {
  return NextResponse.json(dados, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

async function carregarHoleriteParaPagamento(
  holeriteId: number,
  instituicaoId: number,
) {
  return prisma.holeriteRH.findFirst({
    where: {
      id: holeriteId,
      instituicaoId,
    },
    select: {
      id: true,
      funcionarioId: true,
      competenciaMes: true,
      competenciaAno: true,
      salarioBase: true,
      totalVencimentos: true,
      totalDescontos: true,
      valorLiquido: true,
      status: true,
      arquivado: true,
      cancelado: true,
      funcionario: {
        select: {
          id: true,
          nome: true,
          cpf: true,
          contasBancariasRH: {
            where: {
              ativo: true,
              instituicaoId,
            },
            orderBy: {
              finalidade: "asc",
            },
            select: {
              id: true,
              finalidade: true,
              bancoCodigo: true,
              bancoNome: true,
              agencia: true,
              conta: true,
              tipoConta: true,
              tipoChavePix: true,
              chavePix: true,
              titularNome: true,
              titularDocumento: true,
            },
          },
        },
      },
      eventos: {
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
          codigo: true,
          descricao: true,
          referencia: true,
          tipo: true,
          valor: true,
          lancamentosComissaoRH: {
            select: {
              id: true,
            },
          },
          lancamentosRemuneracaoVariavelRH: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });
}

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return respostaSemCache({ error: "Não autorizado." }, 401);
    }

    if (!usuarioPodeRegistrarPagamento(user)) {
      return respostaSemCache(
        {
          error:
            "Você não possui autorização para consultar dados de pagamento de holerites.",
        },
        403,
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const holeriteId = Number(params.id);

    if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
      return respostaSemCache({ error: "Informe um holerite válido." }, 400);
    }

    const holerite = await carregarHoleriteParaPagamento(
      holeriteId,
      instituicaoId,
    );

    if (!holerite) {
      return respostaSemCache(
        { error: "Holerite não encontrado nesta instituição." },
        404,
      );
    }

    if (
      holerite.arquivado ||
      holerite.cancelado ||
      ["ARQUIVADO", "CANCELADO"].includes(
        String(holerite.status || "").toUpperCase(),
      )
    ) {
      return respostaSemCache(
        {
          error:
            "Não é possível preparar o pagamento de um holerite arquivado ou cancelado.",
        },
        400,
      );
    }

    const composicao = calcularComposicaoHolerite(holerite);

    if (composicao.salarioEDemais < -0.009) {
      return respostaSemCache(
        {
          error:
            "A composição do holerite está inconsistente. Revise os eventos de comissão e remuneração variável.",
        },
        409,
      );
    }

    const contaSalario = holerite.funcionario.contasBancariasRH.find(
      (conta) => conta.finalidade === FinalidadeContaBancariaRH.SALARIO,
    );

    const contaComissao = holerite.funcionario.contasBancariasRH.find(
      (conta) =>
        conta.finalidade ===
        FinalidadeContaBancariaRH.COMISSAO_REMUNERACAO_VARIAVEL,
    );

    return respostaSemCache({
      holerite: {
        id: holerite.id,
        funcionarioId: holerite.funcionarioId,
        funcionarioNome: holerite.funcionario.nome,
        competenciaMes: holerite.competenciaMes,
        competenciaAno: holerite.competenciaAno,
        valorLiquido: composicao.valorLiquido,
      },
      composicao: {
        salarioEDemais: Math.max(0, composicao.salarioEDemais),
        comissao: Math.max(0, composicao.comissao),
        remuneracaoVariavel: Math.max(0, composicao.remuneracaoVariavel),
        exigePagamentoDividido: composicao.exigePagamentoDividido,
      },
      contas: {
        salario: serializarConta(contaSalario),
        comissao: serializarConta(contaComissao),
        destinoPreferencialComissao: serializarConta(
          contaComissao || contaSalario,
        ),
        origemPreferencialComissao: contaComissao
          ? OrigemContaPagamentoHoleriteRH.CONTA_COMISSAO
          : contaSalario
            ? OrigemContaPagamentoHoleriteRH.CONTA_SALARIO
            : OrigemContaPagamentoHoleriteRH.MANUAL,
      },
    });
  } catch (error: any) {
    console.error("Erro ao preparar pagamento do holerite:", error);

    return respostaSemCache(
      {
        error: error?.message || "Erro ao preparar o pagamento do holerite.",
      },
      500,
    );
  }
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  try {
    const user = await getUserFromToken();

    if (!user || !user.instituicaoId) {
      return respostaSemCache({ error: "Não autorizado." }, 401);
    }

    if (!usuarioPodeRegistrarPagamento(user)) {
      return respostaSemCache(
        {
          error:
            "Você não possui autorização para registrar pagamentos de holerites.",
        },
        403,
      );
    }

    const instituicaoId = Number(user.instituicaoId);
    const registradoPorId = Number(user.id);
    const holeriteId = Number(params.id);

    if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
      return respostaSemCache({ error: "Informe um holerite válido." }, 400);
    }

    const body = await req.json();

    const holerite = await carregarHoleriteParaPagamento(
      holeriteId,
      instituicaoId,
    );

    if (!holerite) {
      return respostaSemCache(
        { error: "Holerite não encontrado nesta instituição." },
        404,
      );
    }

    if (
      holerite.arquivado ||
      holerite.cancelado ||
      ["ARQUIVADO", "CANCELADO"].includes(
        String(holerite.status || "").toUpperCase(),
      )
    ) {
      return respostaSemCache(
        {
          error:
            "Não é possível registrar pagamento de um holerite arquivado ou cancelado.",
        },
        400,
      );
    }

    const pagamentoExistente = await prisma.pagamentoHoleriteRH.findFirst({
      where: {
        instituicaoId,
        holeriteId,
        status: {
          in: [
            StatusPagamentoHoleriteRH.REGISTRADO,
            StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
            StatusPagamentoHoleriteRH.CONTESTADO,
          ],
        },
      },
      select: {
        id: true,
        reciboNumero: true,
      },
    });

    if (pagamentoExistente) {
      return respostaSemCache(
        {
          error: `Este holerite já possui o recibo ${pagamentoExistente.reciboNumero}.`,
        },
        409,
      );
    }

    const composicao = calcularComposicaoHolerite(holerite);

    if (composicao.valorLiquido <= 0) {
      return respostaSemCache(
        { error: "O holerite não possui valor líquido positivo para pagamento." },
        400,
      );
    }

    if (composicao.salarioEDemais < -0.009) {
      return respostaSemCache(
        {
          error:
            "A composição do holerite está inconsistente. Revise os eventos de comissão e remuneração variável.",
        },
        409,
      );
    }

    type ContaBancariaCarregada =
      (typeof holerite.funcionario.contasBancariasRH)[number];

    const contasPorId = new Map<number, ContaBancariaCarregada>(
      holerite.funcionario.contasBancariasRH.map(
        (conta) => [conta.id, conta] as const,
      ),
    );

    let itensBrutos = Array.isArray(body.itensPagamento)
      ? body.itensPagamento
      : [];

    if (itensBrutos.length === 0) {
      if (composicao.exigePagamentoDividido) {
        return respostaSemCache(
          {
            error:
              "Este holerite possui comissão ou remuneração variável. Informe separadamente os itens do pagamento.",
          },
          400,
        );
      }

      itensBrutos = [
        {
          tipoItem: TipoItemPagamentoHoleriteRH.SALARIO_E_DEMAIS,
          origemConta: OrigemContaPagamentoHoleriteRH.MANUAL,
          formaPagamento: body.formaPagamento,
          valorPago: body.valorPago,
          pagoEm: body.pagoEm,
          identificadorTransacao: body.identificadorTransacao,
          bancoOrigemNome: body.bancoOrigem,
          contaDestinoMascarada: body.contaDestinoMascarada,
          observacoes: body.observacoes,
        },
      ];
    }

    if (itensBrutos.length > 12) {
      return respostaSemCache(
        { error: "O pagamento possui itens demais. Revise a divisão informada." },
        400,
      );
    }

    const formasValidas = Object.values(FormaPagamentoHoleriteRH);
    const origensValidas = Object.values(OrigemContaPagamentoHoleriteRH);
    const tiposItemValidos = Object.values(TipoItemPagamentoHoleriteRH);
    const tiposContaValidos = Object.values(TipoContaBancariaRH);
    const tiposChaveValidos = Object.values(TipoChavePixRH);

    const itensNormalizados: any[] = [];

    for (let indice = 0; indice < itensBrutos.length; indice += 1) {
      const item = itensBrutos[indice] || {};
      const numeroItem = indice + 1;

      const tipoItem = valorEnum(item.tipoItem, tiposItemValidos);
      const origemConta = valorEnum(item.origemConta, origensValidas);
      const formaPagamento = valorEnum(item.formaPagamento, formasValidas);

      if (!tipoItem || !TIPOS_ITEM_PERMITIDOS.has(tipoItem)) {
        return respostaSemCache(
          { error: `Informe um tipo válido para o item ${numeroItem}.` },
          400,
        );
      }

      if (!origemConta) {
        return respostaSemCache(
          { error: `Informe a origem da conta do item ${numeroItem}.` },
          400,
        );
      }

      if (!formaPagamento) {
        return respostaSemCache(
          { error: `Informe uma forma de pagamento válida no item ${numeroItem}.` },
          400,
        );
      }

      const valorPago = arredondarCentavos(numeroEntrada(item.valorPago));

      if (!Number.isFinite(valorPago) || valorPago <= 0) {
        return respostaSemCache(
          { error: `Informe um valor positivo no item ${numeroItem}.` },
          400,
        );
      }

      const pagoEm = dataValida(item.pagoEm);

      if (!pagoEm) {
        return respostaSemCache(
          {
            error: `Informe a data e o horário efetivos do item ${numeroItem}.`,
          },
          400,
        );
      }

      if (pagoEm.getTime() > Date.now() + 5 * 60 * 1000) {
        return respostaSemCache(
          { error: `A data do item ${numeroItem} não pode estar no futuro.` },
          400,
        );
      }

      const identificadorTransacao = texto(item.identificadorTransacao, 200);

      if (
        FORMAS_QUE_EXIGEM_TRANSACAO.has(formaPagamento) &&
        !identificadorTransacao
      ) {
        return respostaSemCache(
          {
            error: `Informe o comprovante ou referência da transação do item ${numeroItem}.`,
          },
          400,
        );
      }

      const contaBancariaFuncionarioId = Number(
        item.contaBancariaFuncionarioId,
      );

      const contaCadastrada = Number.isInteger(contaBancariaFuncionarioId)
        ? contasPorId.get(contaBancariaFuncionarioId)
        : null;

      if (
        origemConta !== OrigemContaPagamentoHoleriteRH.MANUAL &&
        !contaCadastrada
      ) {
        return respostaSemCache(
          {
            error: `A conta selecionada no item ${numeroItem} não pertence ao funcionário ou está inativa.`,
          },
          400,
        );
      }

      if (
        origemConta === OrigemContaPagamentoHoleriteRH.CONTA_SALARIO &&
        contaCadastrada?.finalidade !== FinalidadeContaBancariaRH.SALARIO
      ) {
        return respostaSemCache(
          { error: `Selecione a conta salarial correta no item ${numeroItem}.` },
          400,
        );
      }

      if (
        origemConta === OrigemContaPagamentoHoleriteRH.CONTA_COMISSAO &&
        contaCadastrada?.finalidade !==
        FinalidadeContaBancariaRH.COMISSAO_REMUNERACAO_VARIAVEL
      ) {
        return respostaSemCache(
          {
            error: `Selecione a conta preferencial de comissão no item ${numeroItem}.`,
          },
          400,
        );
      }

      if (
        tipoItem === TipoItemPagamentoHoleriteRH.SALARIO_E_DEMAIS &&
        origemConta === OrigemContaPagamentoHoleriteRH.CONTA_COMISSAO
      ) {
        return respostaSemCache(
          {
            error:
              "A conta preferencial de comissão não pode ser usada automaticamente para a parte salarial. Use a conta salarial ou informe uma conta manual.",
          },
          400,
        );
      }

      const bancoDestinoCodigo = contaCadastrada
        ? texto(contaCadastrada.bancoCodigo, 20)
        : texto(item.bancoDestinoCodigo, 20);

      const bancoDestinoNome = contaCadastrada
        ? texto(contaCadastrada.bancoNome, 200)
        : texto(item.bancoDestinoNome, 200);

      const agenciaDestino = contaCadastrada
        ? texto(contaCadastrada.agencia, 50)
        : texto(item.agenciaDestino, 50);

      const contaDestino = contaCadastrada
        ? texto(contaCadastrada.conta, 100)
        : texto(item.contaDestino, 100) ||
        texto(item.contaDestinoMascarada, 100);

      const tipoContaDestino = contaCadastrada?.tipoConta
        ? contaCadastrada.tipoConta
        : valorEnum(item.tipoContaDestino, tiposContaValidos);

      const tipoChavePixDestino = contaCadastrada?.tipoChavePix
        ? contaCadastrada.tipoChavePix
        : valorEnum(item.tipoChavePixDestino, tiposChaveValidos);

      const chavePixDestino = contaCadastrada
        ? texto(contaCadastrada.chavePix, 300)
        : texto(item.chavePixDestino, 300);

      const titularDestinoSnapshot = contaCadastrada
        ? texto(contaCadastrada.titularNome, 200) ||
        holerite.funcionario.nome
        : texto(item.titularDestino, 200) || holerite.funcionario.nome;

      const titularDocumento = contaCadastrada
        ? texto(contaCadastrada.titularDocumento, 40)
        : texto(item.titularDocumento, 40);

      const bancoOrigemCodigo = texto(item.bancoOrigemCodigo, 20);
      const bancoOrigemNome = texto(
        item.bancoOrigemNome || item.bancoOrigem,
        200,
      );
      const agenciaOrigem = texto(item.agenciaOrigem, 50);
      const contaOrigem = texto(item.contaOrigem, 100);

      if (FORMAS_BANCARIAS.has(formaPagamento) && !bancoOrigemNome) {
        return respostaSemCache(
          {
            error: `Informe o banco pagador/origem no item ${numeroItem}.`,
          },
          400,
        );
      }

      if (formaPagamento === FormaPagamentoHoleriteRH.PIX && !chavePixDestino) {
        return respostaSemCache(
          {
            error: `Informe a chave Pix do destinatário no item ${numeroItem}.`,
          },
          400,
        );
      }

      if (
        FORMAS_QUE_EXIGEM_CONTA_DESTINO.has(formaPagamento) &&
        (!bancoDestinoNome || !contaDestino)
      ) {
        return respostaSemCache(
          {
            error: `Informe o banco e a conta de destino no item ${numeroItem}.`,
          },
          400,
        );
      }

      const salvarComoPreferencialComissao =
        item.salvarComoPreferencialComissao === true;

      if (
        salvarComoPreferencialComissao &&
        tipoItem !== TipoItemPagamentoHoleriteRH.COMISSAO &&
        tipoItem !== TipoItemPagamentoHoleriteRH.REMUNERACAO_VARIAVEL
      ) {
        return respostaSemCache(
          {
            error:
              "A opção de salvar conta preferencial só pode ser usada para comissão ou remuneração variável.",
          },
          400,
        );
      }

      if (
        salvarComoPreferencialComissao &&
        origemConta !== OrigemContaPagamentoHoleriteRH.MANUAL
      ) {
        return respostaSemCache(
          {
            error:
              "Para salvar uma nova conta preferencial, informe a conta manualmente.",
          },
          400,
        );
      }

      itensNormalizados.push({
        tipoItem,
        origemConta,
        formaPagamento,
        valorPago,
        pagoEm,
        identificadorTransacao,
        bancoOrigemCodigo,
        bancoOrigemNome,
        agenciaOrigem,
        contaOrigem,
        bancoDestinoCodigo,
        bancoDestinoNome,
        agenciaDestino,
        contaDestino,
        tipoContaDestino,
        tipoChavePixDestino,
        chavePixDestino,
        titularDestinoSnapshot,
        titularDocumento,
        observacoes: texto(item.observacoes, 3000),
        contaBancariaFuncionarioId: contaCadastrada?.id || null,
        salvarComoPreferencialComissao,
      });
    }

    if (
      itensNormalizados.filter((item) => item.salvarComoPreferencialComissao)
        .length > 1
    ) {
      return respostaSemCache(
        {
          error:
            "Marque apenas uma conta para ser salva como preferencial de comissão.",
        },
        400,
      );
    }

    const somaTotal = arredondarCentavos(
      itensNormalizados.reduce((total, item) => total + item.valorPago, 0),
    );

    if (Math.abs(somaTotal - composicao.valorLiquido) > 0.009) {
      return respostaSemCache(
        {
          error:
            `A soma dos itens deve corresponder ao líquido do holerite: ` +
            `R$ ${composicao.valorLiquido.toFixed(2)}.`,
        },
        400,
      );
    }

    const somaPorTipo = (tipo: TipoItemPagamentoHoleriteRH) =>
      arredondarCentavos(
        itensNormalizados
          .filter((item) => item.tipoItem === tipo)
          .reduce((total, item) => total + item.valorPago, 0),
      );

    const validacoesComposicao = [
      {
        nome: "salário e demais valores",
        informado: somaPorTipo(TipoItemPagamentoHoleriteRH.SALARIO_E_DEMAIS),
        esperado: Math.max(0, composicao.salarioEDemais),
      },
      {
        nome: "comissão",
        informado: somaPorTipo(TipoItemPagamentoHoleriteRH.COMISSAO),
        esperado: Math.max(0, composicao.comissao),
      },
      {
        nome: "remuneração variável",
        informado: somaPorTipo(
          TipoItemPagamentoHoleriteRH.REMUNERACAO_VARIAVEL,
        ),
        esperado: Math.max(0, composicao.remuneracaoVariavel),
      },
    ];

    const composicaoIncorreta = validacoesComposicao.find(
      (item) => Math.abs(item.informado - item.esperado) > 0.009,
    );

    if (composicaoIncorreta) {
      return respostaSemCache(
        {
          error:
            `O valor de ${composicaoIncorreta.nome} deve ser ` +
            `R$ ${composicaoIncorreta.esperado.toFixed(2)}.`,
        },
        400,
      );
    }

    const eventosSnapshot = holerite.eventos.map((evento) => ({
      id: evento.id,
      codigo: evento.codigo,
      descricao: evento.descricao,
      referencia: evento.referencia,
      tipo: evento.tipo,
      valor: Number(evento.valor || 0).toFixed(2),
      possuiComissao: evento.lancamentosComissaoRH.length > 0,
      possuiRemuneracaoVariavel:
        evento.lancamentosRemuneracaoVariavelRH.length > 0,
    }));

    const reciboNumero =
      `REC-${instituicaoId}-${holerite.id}-` +
      randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

    const formasUnicas = Array.from(
      new Set(itensNormalizados.map((item) => item.formaPagamento)),
    );

    const bancosOrigemUnicos = Array.from(
      new Set(
        itensNormalizados
          .map((item) => item.bancoOrigemNome)
          .filter(Boolean),
      ),
    );

    const formaPagamentoResumo =
      formasUnicas.length === 1
        ? formasUnicas[0]
        : FormaPagamentoHoleriteRH.OUTRO;

    const pagoEmResumo = new Date(
      Math.max(...itensNormalizados.map((item) => item.pagoEm.getTime())),
    );

    const identificadorResumo =
      itensNormalizados.length === 1
        ? itensNormalizados[0].identificadorTransacao || null
        : `${itensNormalizados.length} itens de pagamento registrados`;

    const bancoOrigemResumo =
      bancosOrigemUnicos.length === 0
        ? null
        : bancosOrigemUnicos.length === 1
          ? bancosOrigemUnicos[0]
          : "Múltiplos bancos pagadores";

    const contaDestinoResumo =
      itensNormalizados.length === 1
        ? mascararFinal(itensNormalizados[0].contaDestino) ||
        mascararChavePix(
          itensNormalizados[0].chavePixDestino,
          itensNormalizados[0].tipoChavePixDestino,
        )
        : `Pagamento dividido em ${itensNormalizados.length} itens`;

    const itensParaHash = itensNormalizados.map((item) => ({
      tipoItem: item.tipoItem,
      origemConta: item.origemConta,
      formaPagamento: item.formaPagamento,
      valorPago: item.valorPago.toFixed(2),
      pagoEm: item.pagoEm.toISOString(),
      identificadorTransacao: item.identificadorTransacao || null,
      bancoOrigemCodigo: item.bancoOrigemCodigo || null,
      bancoOrigemNome: item.bancoOrigemNome || null,
      bancoDestinoCodigo: item.bancoDestinoCodigo || null,
      bancoDestinoNome: item.bancoDestinoNome || null,
      agenciaDestinoMascarada: mascararFinal(item.agenciaDestino, 2),
      contaDestinoMascarada: mascararFinal(item.contaDestino),
      tipoContaDestino: item.tipoContaDestino || null,
      tipoChavePixDestino: item.tipoChavePixDestino || null,
      chavePixDestinoHash: item.chavePixDestino
        ? calcularSha256(item.chavePixDestino)
        : null,
      titularDestinoSnapshot: item.titularDestinoSnapshot || null,
    }));

    const dadosPagamentoHash = calcularSha256(
      JSON.stringify({
        instituicaoId,
        holeriteId,
        funcionarioId: holerite.funcionarioId,
        funcionarioNome: holerite.funcionario.nome,
        funcionarioCpf: holerite.funcionario.cpf || null,
        competenciaMes: holerite.competenciaMes,
        competenciaAno: holerite.competenciaAno,
        salarioBase: Number(holerite.salarioBase || 0).toFixed(2),
        totalVencimentos: Number(holerite.totalVencimentos || 0).toFixed(2),
        totalDescontos: Number(holerite.totalDescontos || 0).toFixed(2),
        valorLiquido: composicao.valorLiquido.toFixed(2),
        reciboNumero,
        itens: itensParaHash,
        eventos: eventosSnapshot,
        registradoPorId,
      }),
    );

    const observacoesGerais = texto(body.observacoes, 3000);

    const resultado = await prisma.$transaction(
      async (tx) => {
        const concorrente = await tx.pagamentoHoleriteRH.findFirst({
          where: {
            instituicaoId,
            holeriteId,
            status: {
              in: [
                StatusPagamentoHoleriteRH.REGISTRADO,
                StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
                StatusPagamentoHoleriteRH.CONTESTADO,
              ],
            },
          },
          select: {
            id: true,
            reciboNumero: true,
          },
        });

        if (concorrente) {
          const erroConcorrencia: any = new Error(
            `Este holerite já possui o recibo ${concorrente.reciboNumero}.`,
          );
          erroConcorrencia.statusCode = 409;
          throw erroConcorrencia;
        }

        const pagamento = await tx.pagamentoHoleriteRH.create({
          data: {
            instituicaoId,
            funcionarioId: holerite.funcionarioId,
            holeriteId,
            registradoPorId,
            status: StatusPagamentoHoleriteRH.REGISTRADO,
            formaPagamento: formaPagamentoResumo,
            valorPago: composicao.valorLiquido,
            pagoEm: pagoEmResumo,
            identificadorTransacao: identificadorResumo,
            bancoOrigem: bancoOrigemResumo,
            contaDestinoMascarada: contaDestinoResumo,
            observacoes: observacoesGerais || null,
            funcionarioNomeSnapshot: holerite.funcionario.nome,
            funcionarioCpfSnapshot: holerite.funcionario.cpf || null,
            competenciaMesSnapshot: holerite.competenciaMes,
            competenciaAnoSnapshot: holerite.competenciaAno,
            valorLiquidoSnapshot: composicao.valorLiquido,
            eventosSnapshot,
            reciboNumero,
            dadosPagamentoHash,
          },
        });

        for (const item of itensNormalizados) {
          let contaBancariaFuncionarioId =
            item.contaBancariaFuncionarioId || null;

          if (item.salvarComoPreferencialComissao) {
            const contaPreferencial =
              await tx.contaBancariaFuncionarioRH.upsert({
                where: {
                  funcionarioId_finalidade: {
                    funcionarioId: holerite.funcionarioId,
                    finalidade:
                      FinalidadeContaBancariaRH.COMISSAO_REMUNERACAO_VARIAVEL,
                  },
                },
                create: {
                  instituicaoId,
                  funcionarioId: holerite.funcionarioId,
                  finalidade:
                    FinalidadeContaBancariaRH.COMISSAO_REMUNERACAO_VARIAVEL,
                  bancoCodigo: item.bancoDestinoCodigo || null,
                  bancoNome: item.bancoDestinoNome || null,
                  agencia: item.agenciaDestino || null,
                  conta: item.contaDestino || null,
                  tipoConta: item.tipoContaDestino || null,
                  tipoChavePix: item.tipoChavePixDestino || null,
                  chavePix: item.chavePixDestino || null,
                  titularNome: item.titularDestinoSnapshot || null,
                  titularDocumento: item.titularDocumento || null,
                  ativo: true,
                },
                update: {
                  instituicaoId,
                  bancoCodigo: item.bancoDestinoCodigo || null,
                  bancoNome: item.bancoDestinoNome || null,
                  agencia: item.agenciaDestino || null,
                  conta: item.contaDestino || null,
                  tipoConta: item.tipoContaDestino || null,
                  tipoChavePix: item.tipoChavePixDestino || null,
                  chavePix: item.chavePixDestino || null,
                  titularNome: item.titularDestinoSnapshot || null,
                  titularDocumento: item.titularDocumento || null,
                  ativo: true,
                },
                select: {
                  id: true,
                },
              });

            contaBancariaFuncionarioId = contaPreferencial.id;
          }

          await tx.itemPagamentoHoleriteRH.create({
            data: {
              instituicaoId,
              pagamentoHoleriteId: pagamento.id,
              contaBancariaFuncionarioId,
              tipoItem: item.tipoItem,
              origemConta: item.origemConta,
              formaPagamento: item.formaPagamento,
              valorPago: item.valorPago,
              pagoEm: item.pagoEm,
              identificadorTransacao: item.identificadorTransacao || null,
              bancoOrigemCodigo: item.bancoOrigemCodigo || null,
              bancoOrigemNome: item.bancoOrigemNome || null,
              agenciaOrigemMascarada: mascararFinal(item.agenciaOrigem, 2),
              contaOrigemMascarada: mascararFinal(item.contaOrigem),
              bancoDestinoCodigo: item.bancoDestinoCodigo || null,
              bancoDestinoNome: item.bancoDestinoNome || null,
              agenciaDestinoMascarada: mascararFinal(item.agenciaDestino, 2),
              contaDestinoMascarada: mascararFinal(item.contaDestino),
              tipoContaDestino: item.tipoContaDestino || null,
              tipoChavePixDestino: item.tipoChavePixDestino || null,
              chavePixDestinoMascarada: mascararChavePix(
                item.chavePixDestino,
                item.tipoChavePixDestino,
              ),
              chavePixDestinoHash: item.chavePixDestino
                ? calcularSha256(item.chavePixDestino)
                : null,
              titularDestinoSnapshot:
                item.titularDestinoSnapshot || holerite.funcionario.nome,
              titularDocumentoMascarado: mascararDocumento(
                item.titularDocumento,
              ),
              observacoes: item.observacoes || null,
            },
          });
        }

        await tx.holeriteRH.update({
          where: {
            id: holeriteId,
          },
          data: {
            status: "AGUARDANDO_ASSINATURA",
          },
        });

        await tx.historicoRH.create({
          data: {
            funcionarioId: holerite.funcionarioId,
            instituicaoId,
            criadoPorId: registradoPorId,
            tipo: "RECIBO_PAGAMENTO_HOLERITE_GERADO",
            titulo: "Recibo de pagamento aguardando assinatura",
            descricao:
              `Recibo ${reciboNumero} criado para ` +
              `${holerite.funcionario.nome}, competência ` +
              `${String(holerite.competenciaMes).padStart(2, "0")}/` +
              `${holerite.competenciaAno}.`,
            dataEvento: new Date(),
            observacoes: [
              `Pagamento ID: ${pagamento.id}`,
              `Holerite ID: ${holeriteId}`,
              `Valor total declarado: R$ ${composicao.valorLiquido.toFixed(2)}`,
              `Itens de pagamento: ${itensNormalizados.length}`,
              `Parte salarial: R$ ${Math.max(0, composicao.salarioEDemais).toFixed(2)}`,
              `Comissão: R$ ${Math.max(0, composicao.comissao).toFixed(2)}`,
              `Remuneração variável: R$ ${Math.max(0, composicao.remuneracaoVariavel).toFixed(2)}`,
              `Dados SHA-256: ${dadosPagamentoHash}`,
              "O holerite, as comissões e as remunerações variáveis somente serão confirmados como pagos após a assinatura do funcionário.",
            ].join("\n"),
          },
        });

        return pagamento;
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    return respostaSemCache({
      message:
        "Recibo de pagamento criado. Aguardando assinatura do funcionário.",
      pagamentoId: resultado.id,
      reciboNumero: resultado.reciboNumero,
      status: resultado.status,
      quantidadeItens: itensNormalizados.length,
      composicao: {
        salarioEDemais: Math.max(0, composicao.salarioEDemais),
        comissao: Math.max(0, composicao.comissao),
        remuneracaoVariavel: Math.max(0, composicao.remuneracaoVariavel),
      },
      reciboPdfUrl: `/api/admin/rh/holerites/${holeriteId}/recibo-pagamento/pdf`,
    });
  } catch (error: any) {
    console.error("Erro ao registrar recibo de pagamento:", error);

    return respostaSemCache(
      {
        error: error?.message || "Erro ao registrar o recibo de pagamento.",
      },
      Number(error?.statusCode) || 500,
    );
  }
}