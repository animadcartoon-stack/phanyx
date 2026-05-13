import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA" &&
        user.role !== "SUPER_ADMIN")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const caixaManual = await prisma.caixa.findFirst({
      where: {
        instituicaoId: user.instituicaoId,
        status: "ABERTO",
        abertoPorId: user.id,
        origem: "MANUAL",
      },
      include: {
        movimentos: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        dataAbertura: "desc",
      },
    });

    const podeVerCaixaOnlineIbe =
      user.instituicaoId === 1 ||
      user.role === "SUPER_ADMIN" ||
      Boolean((user as any).isMasterAdmin);

    const caixaOnlineIbe = podeVerCaixaOnlineIbe
      ? await prisma.caixa.findFirst({
          where: {
            instituicaoId: 1,
            origem: "ONLINE_ASAAS_IBE",
            status: "ABERTO",
          },
          include: {
            movimentos: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            dataAbertura: "desc",
          },
        })
      : null;

    return NextResponse.json({
      caixaManual,
      caixaOnlineIbe,
      podeVerCaixaOnlineIbe,
    });
  } catch (e: any) {
    console.error("ERRO GET CAIXA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao carregar caixa" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (
      !user ||
      (user.role !== "ADMIN" &&
        user.role !== "FINANCEIRO" &&
        user.role !== "SECRETARIA")
    ) {
      return NextResponse.json({ error: "NAO_AUTORIZADO" }, { status: 401 });
    }

    const body = await req.json();
    const acao = String(body?.acao || "").trim();

    if (acao === "ABRIR") {
      const saldoInicial = Number(body?.saldoInicial || 0);
      const observacaoAbertura =
        body?.observacaoAbertura !== undefined && body?.observacaoAbertura !== null
          ? String(body.observacaoAbertura).trim() || null
          : null;

      const jaExisteCaixaAbertoDoMesmoUsuario = await prisma.caixa.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          status: "ABERTO",
          abertoPorId: user.id,
        },
      });

      if (jaExisteCaixaAbertoDoMesmoUsuario) {
        return NextResponse.json(
          { error: "Você já possui um caixa aberto" },
          { status: 400 }
        );
      }

      const caixa = await prisma.caixa.create({
        data: {
          instituicaoId: user.instituicaoId,
          abertoPorId: user.id,
          origem: "MANUAL",
          saldoInicial,
          saldoSistema: saldoInicial,
          observacaoAbertura,
          status: "ABERTO",
        },
        include: {
          movimentos: true,
        },
      });

      return NextResponse.json(caixa, { status: 201 });
    }

    if (acao === "MOVIMENTO") {
      const caixaId = Number(body?.caixaId);
      const tipo = String(body?.tipo || "").trim();
      const descricao =
        body?.descricao !== undefined && body?.descricao !== null
          ? String(body.descricao).trim() || null
          : null;
      const valor = Number(body?.valor || 0);
      const formaPagamento =
        body?.formaPagamento !== undefined && body?.formaPagamento !== null
          ? String(body.formaPagamento).trim() || null
          : null;

      if (!Number.isFinite(caixaId) || caixaId <= 0) {
        return NextResponse.json({ error: "Caixa inválido" }, { status: 400 });
      }

      if (!["ENTRADA", "SAIDA"].includes(tipo)) {
        return NextResponse.json(
          { error: "Tipo de movimento inválido" },
          { status: 400 }
        );
      }

      if (!Number.isFinite(valor) || valor <= 0) {
        return NextResponse.json({ error: "Valor inválido" }, { status: 400 });
      }

      const caixa = await prisma.caixa.findFirst({
        where: {
          id: caixaId,
          instituicaoId: user.instituicaoId,
          status: "ABERTO",
          abertoPorId: user.id,
        },
      });

      if (!caixa) {
        return NextResponse.json(
          { error: "Caixa aberto não encontrado para este usuário" },
          { status: 404 }
        );
      }

      const novoSaldo =
        tipo === "ENTRADA"
          ? Number(caixa.saldoSistema) + valor
          : Number(caixa.saldoSistema) - valor;

      await prisma.$transaction([
        prisma.movimentoCaixa.create({
          data: {
            instituicaoId: user.instituicaoId,
            caixaId: caixa.id,
            tipo: tipo as any,
            descricao,
            valor,
            formaPagamento: formaPagamento as any,
          },
        }),
        prisma.caixa.update({
          where: { id: caixa.id },
          data: {
            saldoSistema: novoSaldo,
          },
        }),
      ]);

      const atualizado = await prisma.caixa.findUnique({
        where: { id: caixa.id },
        include: {
          movimentos: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      return NextResponse.json(atualizado);
    }

    if (acao === "FECHAR") {
      const caixaId = Number(body?.caixaId);
      const saldoInformado = Number(body?.saldoInformado || 0);
      const observacaoFechamento =
        body?.observacaoFechamento !== undefined && body?.observacaoFechamento !== null
          ? String(body.observacaoFechamento).trim() || null
          : null;

      if (!Number.isFinite(caixaId) || caixaId <= 0) {
        return NextResponse.json({ error: "Caixa inválido" }, { status: 400 });
      }

      const caixa = await prisma.caixa.findFirst({
        where: {
          id: caixaId,
          instituicaoId: user.instituicaoId,
          status: "ABERTO",
          abertoPorId: user.id,
        },
      });

      if (!caixa) {
        return NextResponse.json(
          { error: "Caixa aberto não encontrado para este usuário" },
          { status: 404 }
        );
      }

      const diferenca = Number(
        (saldoInformado - Number(caixa.saldoSistema)).toFixed(2)
      );

      const fechado = await prisma.caixa.update({
        where: { id: caixa.id },
        data: {
          status: "FECHADO",
          dataFechamento: new Date(),
          fechadoPorId: user.id,
          saldoInformado,
          diferenca,
          observacaoFechamento,
        },
        include: {
          movimentos: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      return NextResponse.json(fechado);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e: any) {
    console.error("ERRO POST CAIXA:", e);
    return NextResponse.json(
      { error: e?.message || "Erro ao operar caixa" },
      { status: 500 }
    );
  }
}