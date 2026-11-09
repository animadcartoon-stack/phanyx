import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { criarContratoPendenteMatricula } from "@/lib/contratos/contrato-matricula";
import { administradorCombos, erroCombos } from "@/lib/matriculas/combos-api";
import { diaFinanceiro } from "@/lib/financeiro/desconto-pontualidade";
import { diferencasEdicao, registrarEdicaoMatricula } from "@/lib/matriculas/auditoria-edicao";
import { vencimentoMensal } from "@/lib/matriculas/combos";
import { calcularValoresRevisao, ErroRevisaoValores, lerValoresRevisao } from "@/lib/matriculas/revisao-valores";
import { prisma } from "@/lib/prisma";

type Contexto = { params: { id: string } };
const moedaEmCentavos = (valor: number | Prisma.Decimal | null) => Math.round(Number(valor ?? 0) * 100);
const objetoJson = (valor: Prisma.JsonValue | undefined): Prisma.JsonObject | null =>
  valor && typeof valor === "object" && !Array.isArray(valor) ? valor : null;

async function revisarValores(request: Request, { params }: Contexto, confirmar: boolean) {
  try {
    const user = await administradorCombos();
    const matriculaId = Number(params.id);
    const body = await request.json().catch(() => null);
    if (!Number.isSafeInteger(matriculaId) || matriculaId <= 0 || !body || typeof body !== "object" || Array.isArray(body)) {
      throw new ErroRevisaoValores("Informe uma matrícula e os valores da revisão.", 400);
    }
    const { instituicaoId } = user;
    const { motivo, ...proposta } = lerValoresRevisao(body);
    const vinculo = { matriculaId, instituicaoId };

    return await prisma.$transaction(async (tx) => {
      if (confirmar) {
        await tx.$queryRaw`SELECT "id" FROM "Matricula" WHERE "id" = ${matriculaId}
          AND "instituicaoId" = ${instituicaoId} FOR UPDATE`;
        await tx.$queryRaw`SELECT "id" FROM "LancamentoFinanceiro" WHERE "matriculaId" = ${matriculaId}
          AND "instituicaoId" = ${instituicaoId} ORDER BY "id" FOR UPDATE`;
      }
      const matricula = await tx.matricula.findFirst({
        where: { id: matriculaId, instituicaoId, excluidaEm: null },
        select: {
          alunoId: true, poloId: true, cursoId: true, status: true, canceladaEm: true, updatedAt: true,
          realizadaPeloAluno: true, organizacaoCurricular: true, curso: { select: { nome: true } }, contratacaoDisciplinas: true,
          contratacaoModalidades: true, planoPagamentoContratado: true, descontoPontualidade: true,
          valorMatricula: true, valorMensalidade: true, bolsaPercentual: true, quantidadeMensalidades: true,
          quantidadeParcelas: true, primeiroVencimento: true, dataPrimeiroVencimento: true,
        },
      });
      if (!matricula) throw new ErroRevisaoValores("Matrícula não encontrada.", 404);
      if (matricula.canceladaEm || !["ATIVA", "A_INICIAR", "AGUARDANDO"].includes(matricula.status)) {
        throw new ErroRevisaoValores("A matrícula precisa estar ativa ou aguardando início.");
      }

      const snapshot = objetoJson(matricula.contratacaoModalidades);
      const plano = objetoJson(matricula.planoPagamentoContratado);
      if (matricula.realizadaPeloAluno || matricula.organizacaoCurricular === "LIVRE" || matricula.contratacaoDisciplinas ||
          (plano && (plano.tipo !== "ANTECIPACAO_COMBO" || !snapshot))) {
        throw new ErroRevisaoValores("Esta matrícula usa um plano ou uma composição de valores que exige revisão própria.");
      }
      const calculo = objetoJson(snapshot?.calculo);
      const adiantamentoTabela = Number(calculo?.antecipacaoCentavos ?? 0);
      const taxaSeparadaOriginal = adiantamentoTabela > 0
        ? Number(calculo?.matriculaCentavos) - adiantamentoTabela : null;
      if (taxaSeparadaOriginal !== null && (!Number.isSafeInteger(taxaSeparadaOriginal) || taxaSeparadaOriginal < 0)) {
        throw new ErroRevisaoValores("A taxa e a antecipação registradas no combo precisam ser conferidas.");
      }
      const quantidade = matricula.quantidadeMensalidades ?? matricula.quantidadeParcelas ?? 0;
      const primeiroVencimento = matricula.primeiroVencimento ?? matricula.dataPrimeiroVencimento;
      const anterior = calcularValoresRevisao({
        taxa: moedaEmCentavos(matricula.valorMatricula),
        mensalidade: moedaEmCentavos(matricula.valorMensalidade),
        bolsa: moedaEmCentavos(matricula.bolsaPercentual),
      }, taxaSeparadaOriginal, matricula.descontoPontualidade);
      const nova = calcularValoresRevisao(proposta, taxaSeparadaOriginal, matricula.descontoPontualidade);
      if (anterior.taxa === nova.taxa && anterior.mensalidade === nova.mensalidade && anterior.bolsa === nova.bolsa) {
        throw new ErroRevisaoValores("Altere pelo menos um valor antes de calcular a prévia.", 400);
      }
      if ((anterior.liquida > 0 || nova.liquida > 0) &&
          (!primeiroVencimento || !Number.isInteger(quantidade) || quantidade < 1 || quantidade > 120)) {
        throw new ErroRevisaoValores("Confira o primeiro vencimento e o número de parcelas da matrícula.");
      }

      const contratos = await tx.contrato.findMany({
        where: { ...vinculo, status: { not: "CANCELADO" } },
        select: {
          id: true, conteudo: true, status: true, dataAssinatura: true,
          assinaturaSecretariaEm: true, assinatura: { select: { id: true } },
        },
        orderBy: { id: "asc" },
      });
      const documentoEmitido = await tx.documentoGerado.findFirst({
        where: { ...vinculo, tipo: "CONTRATO", status: { in: ["GERADO", "ASSINADO"] } },
        select: { id: true },
      });
      if (documentoEmitido || contratos.some(c => c.status !== "PENDENTE" ||
          c.dataAssinatura || c.assinaturaSecretariaEm || c.assinatura)) {
        throw new ErroRevisaoValores("O contrato já foi emitido ou assinado. A mudança de valores exige revisão contratual.");
      }

      const lancamentos = await tx.lancamentoFinanceiro.findMany({
        where: { ...vinculo, tipo: { in: ["MATRICULA", "MENSALIDADE"] } },
        include: { _count: { select: { pagamentos: true, movimentosCaixa: true, cobrancasFinanceiras: true } } },
        orderBy: [{ vencimento: "asc" }, { id: "asc" }],
      });
      if (lancamentos.some(l => l.pagoEm || Number(l.valorPago) > 0 || l.status === "PAGO" ||
          l.status === "PARCIAL" || l._count.pagamentos || l._count.movimentosCaixa || l._count.cobrancasFinanceiras)) {
        throw new ErroRevisaoValores("Há recebimentos ou cobranças emitidas nesta matrícula. A diferença exige revisão financeira.");
      }
      const hoje = diaFinanceiro(new Date());
      const ativos = lancamentos.filter(l => l.status !== "CANCELADO");
      const taxas = ativos.filter(l => l.tipo === "MATRICULA");
      const mensalidades = ativos.filter(l => l.tipo === "MENSALIDADE");
      if (taxas.length !== (anterior.taxa > 0 ? 1 : 0) ||
          mensalidades.length !== (anterior.liquida > 0 ? quantidade : 0) ||
          ativos.some(l => l.status !== "PENDENTE" || l.jurosValor || l.multaValor ||
            (l.vencimento && l.vencimento.toISOString().slice(0, 10) < hoje)) ||
          taxas.some(l => moedaEmCentavos(l.valorFinal) !== anterior.taxa ||
            moedaEmCentavos(l.valorOriginal) !== anterior.taxa || l.descontoValor) ||
          mensalidades.some((l, i) => !l.vencimento || moedaEmCentavos(l.valorOriginal) !== anterior.mensalidade ||
            Math.abs(moedaEmCentavos(l.valorFinal) - (anterior.liquida - (i === 0 ? anterior.antecipacao : 0))) > 1 ||
            moedaEmCentavos(l.valorAntecipacaoAbatida) !== (i === 0 ? anterior.antecipacao : 0))) {
        throw new ErroRevisaoValores("O cronograma tem parcelas vencidas, descontos avulsos ou diferenças que precisam ser conferidas no Financeiro.");
      }

      const montante = (v: typeof anterior) => v.taxa + v.liquida * quantidade - v.antecipacao;
      const resumo = {
        anterior: { ...anterior, total: montante(anterior) },
        nova: { ...nova, total: montante(nova) },
        quantidade,
        primeiroVencimento: (mensalidades[0]?.vencimento ?? primeiroVencimento)?.toISOString().slice(0, 10) ?? null,
        vencimentos: nova.liquida > 0 && primeiroVencimento
          ? Array.from({ length: quantidade }, (_, i) => (
            mensalidades[i]?.vencimento ?? vencimentoMensal(primeiroVencimento.toISOString().slice(0, 10), i)
          )) : [],
      };
      if ((nova.liquida > 0 && resumo.vencimentos.some(data => data.toISOString().slice(0, 10) < hoje)) ||
          (nova.taxa > 0 && snapshot && !taxas.length && primeiroVencimento &&
            primeiroVencimento.toISOString().slice(0, 10) < hoje)) {
        throw new ErroRevisaoValores("O novo cronograma teria parcelas vencidas. Confira os vencimentos no Financeiro.");
      }
      const versao = createHash("sha256").update(JSON.stringify({
        vinculo, motivo, resumo, matricula: matricula.updatedAt, contratos: contratos.map(c => c.id),
        lancamentos: ativos.map(l => [l.id, l.updatedAt]),
      })).digest("hex");

      if (!confirmar) return NextResponse.json({ ...resumo, versao });
      if (body.versao !== versao) {
        throw new ErroRevisaoValores("Os dados mudaram desde a prévia. Calcule novamente antes de salvar.");
      }

      const agora = new Date();
      const idsContratos = contratos.map(c => c.id);
      if (idsContratos.length) {
        const cancelados = await tx.contrato.updateMany({
          where: { ...vinculo, id: { in: idsContratos }, status: "PENDENTE",
            dataAssinatura: null, assinaturaSecretariaEm: null, assinatura: { is: null } },
          data: { status: "CANCELADO", tokenAssinatura: null },
        });
        if (cancelados.count !== idsContratos.length) throw new ErroRevisaoValores("O contrato mudou. Gere outra prévia.");
        await tx.documentoAluno.updateMany({
          where: { ...vinculo, tipo: "CONTRATO", arquivado: false,
            conteudo: { in: contratos.map(c => c.conteudo) } },
          data: { arquivado: true, arquivadoEm: agora, arquivadoPorId: user.id,
            motivoArquivamento: "Contrato substituído após revisão de valores." },
        });
      }

      const planoRevisado = nova.antecipacao > 0 ? {
        versao: 1, tipo: "ANTECIPACAO_COMBO",
        id: `combo-${calculo?.comboId}-antecipacao`, nome: String(snapshot?.nome ?? "Combo"),
        cursoId: matricula.cursoId, quantidadeParcelas: quantidade,
        valorParcela: (nova.liquida / 100).toFixed(2),
        parcelasCentavos: resumo.vencimentos.map(() => nova.liquida),
        parcelasExigiveisCentavos: resumo.vencimentos.map((_, i) => nova.liquida - (i === 0 ? nova.antecipacao : 0)),
        antecipacaoCentavos: nova.antecipacao, taxaSeparadaCentavos: nova.taxaSeparada,
        totalCentavos: nova.liquida * quantidade, precoIncluiPontualidade: false,
        primeiroVencimento: resumo.primeiroVencimento, contratadoEm: agora.toISOString(),
      } : Prisma.DbNull;
      await tx.matricula.update({
        where: { id: matriculaId, instituicaoId },
        data: {
          valorMatricula: nova.taxa / 100, valorMensalidade: nova.mensalidade / 100, bolsaPercentual: nova.bolsa / 100,
          planoPagamentoContratado: planoRevisado,
          ...(snapshot ? { contratacaoModalidades: {
            ...snapshot, revisaoValores: true,
            finais: { matriculaCentavos: nova.taxa, antecipacaoCentavos: nova.antecipacao,
              mensalidadeCentavos: nova.liquida, quantidadeParcelas: quantidade },
          } } : {}),
        },
      });

      const nome = String(snapshot?.nome ?? matricula.curso?.nome ?? "Curso");
      const cobrancas = [
        { tipo: "MATRICULA" as const, atual: taxas[0], nominal: nova.taxa, saldo: nova.taxa, credito: 0,
          descricao: `${nova.antecipacao === 0 ? "Taxa de matrícula" :
            nova.taxaSeparada > 0 ? "Taxas avulsas e antecipação de matrícula" : "Antecipação de matrícula"} - ${nome}`,
          vencimento: taxas[0] ? taxas[0].vencimento : (snapshot ? primeiroVencimento : null) },
        ...resumo.vencimentos.map((vencimento, i) => {
          const credito = i === 0 ? nova.antecipacao : 0;
          return { tipo: "MENSALIDADE" as const, atual: mensalidades[i], nominal: nova.mensalidade,
            saldo: nova.liquida - credito, credito, vencimento, descricao: `Mensalidade ${i + 1}/${quantidade} - ${nome}` };
        }),
      ];
      for (const cobranca of cobrancas) {
        if (!cobranca.saldo) continue;
        const dados = {
          descricao: cobranca.descricao, vencimento: cobranca.vencimento, valorOriginal: cobranca.nominal / 100,
          valorFinal: cobranca.saldo / 100, descontoValor: (cobranca.nominal - cobranca.saldo) / 100,
          valorAntecipacaoAbatida: cobranca.credito / 100,
        };
        if (cobranca.atual) {
          if (moedaEmCentavos(cobranca.atual.valorOriginal) === cobranca.nominal &&
              moedaEmCentavos(cobranca.atual.valorFinal) === cobranca.saldo &&
              moedaEmCentavos(cobranca.atual.valorAntecipacaoAbatida) === cobranca.credito) continue;
          await tx.lancamentoFinanceiro.update({ where: { id: cobranca.atual.id }, data: dados });
        } else {
          await tx.lancamentoFinanceiro.create({
            data: { ...dados, ...vinculo, tipo: cobranca.tipo, alunoId: matricula.alunoId, poloId: matricula.poloId },
          });
        }
      }
      const cancelarIds = [
        ...(nova.taxa === 0 ? taxas : []),
        ...(nova.liquida === 0 ? mensalidades : []),
      ].map(l => l.id);
      if (cancelarIds.length) {
        await tx.lancamentoFinanceiro.updateMany({
          where: { ...vinculo, id: { in: cancelarIds } },
          data: { status: "CANCELADO", observacao: "Cancelado após revisão dos valores da matrícula." },
        });
      }
      const { contrato, conteudo } = await criarContratoPendenteMatricula({ ...vinculo, db: tx });
      await tx.documentoAluno.create({
        data: { ...vinculo, alunoId: matricula.alunoId, tipo: "CONTRATO", titulo: "Contrato de matrícula", conteudo },
      });
      const paraAuditoria = (v: typeof anterior) => ({
        valorMatricula: v.taxa / 100, valorMensalidade: v.mensalidade / 100, bolsaPercentual: v.bolsa / 100,
        antecipacao: v.antecipacao / 100, valorTotal: montante(v) / 100,
      });
      await registrarEdicaoMatricula(tx, vinculo, user, "VALORES", {
        ...diferencasEdicao(paraAuditoria(anterior), paraAuditoria(nova)),
        contrato: { anterior: idsContratos, novo: contrato.id },
      }, motivo);
      return NextResponse.json({ contratoId: contrato.id });
    }, {
      // Após esperar pela trava de um lançamento, a confirmação precisa ver reservas recém-criadas.
      isolationLevel: confirmar ? "ReadCommitted" : "RepeatableRead", maxWait: 5000, timeout: 30000,
    });
  } catch (erro) {
    if (erro instanceof ErroRevisaoValores) {
      return NextResponse.json({ error: erro.message }, { status: erro.status });
    }
    return erroCombos(erro);
  }
}

export function POST(request: Request, contexto: Contexto) {
  return revisarValores(request, contexto, false);
}

export function PATCH(request: Request, contexto: Contexto) {
  return revisarValores(request, contexto, true);
}
