import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import {
  assinaturaPermiteUso,
  mensagemBloqueioAssinatura,
} from "@/lib/assinatura-acesso";
import { obterContextoGestaoPolos } from "@/lib/polos-rede";

function respostaComLogout(
  mensagem: string,
  status = 403
) {
  const response = NextResponse.json(
    {
      error: mensagem,
    },
    {
      status,
    }
  );

  response.cookies.delete("token");

  return response;
}

export async function GET() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: number;
    };

    const user =
      await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
          isMasterAdmin: true,
          instituicaoId: true,
        },
      });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    if (
      !user.isMasterAdmin &&
      user.ativo === false
    ) {
      return respostaComLogout(
        "Seu acesso está bloqueado. Procure a administração da instituição."
      );
    }

    let statusAluno: string | null = null;

    let bloqueioFinanceiroAtivo =
      false;

    let plano: string | null = null;

    let instituicaoContratanteId:
      | number
      | null = null;

    let ehInstituicaoContratante =
      false;

    let permissaoDelegadaPolos =
      false;

    let podeGerenciarPolos = false;

    if (user.instituicaoId) {
      const contextoPolos =
        await obterContextoGestaoPolos(
          user.instituicaoId
        );

      if (
        !contextoPolos &&
        !user.isMasterAdmin
      ) {
        return respostaComLogout(
          "A instituição vinculada a este usuário não foi encontrada."
        );
      }

      if (contextoPolos) {
        instituicaoContratanteId =
          contextoPolos
            .instituicaoContratanteId;

        ehInstituicaoContratante =
          contextoPolos
            .ehInstituicaoContratante;

        permissaoDelegadaPolos =
          contextoPolos
            .permissaoDelegada;

        podeGerenciarPolos =
          contextoPolos
            .podeGerenciarPolos;
      }

      const instituicaoAtual =
        await prisma.instituicao.findUnique({
          where: {
            id: user.instituicaoId,
          },
          select: {
            id: true,
            ativo: true,
            plano: true,
            statusAssinatura: true,
            isentaPagamento: true,
          },
        });

      if (
        !user.isMasterAdmin &&
        (!instituicaoAtual ||
          instituicaoAtual.ativo === false)
      ) {
        return respostaComLogout(
          "O acesso desta unidade está inativo. Procure a administração da instituição contratante."
        );
      }

      const contratanteId =
        contextoPolos
          ?.instituicaoContratanteId ??
        user.instituicaoId;

      const instituicaoContratante =
        await prisma.instituicao.findUnique({
          where: {
            id: contratanteId,
          },
          select: {
            id: true,
            ativo: true,
            plano: true,
            statusAssinatura: true,
            isentaPagamento: true,
          },
        });

      if (
        !user.isMasterAdmin &&
        (!instituicaoContratante ||
          instituicaoContratante.ativo ===
            false)
      ) {
        return respostaComLogout(
          "A instituição contratante da rede está inativa."
        );
      }

      plano =
        instituicaoContratante?.plano ??
        instituicaoAtual?.plano ??
        null;

      if (!user.isMasterAdmin) {
        const assinatura =
          await prisma.assinaturaPhanyx.findUnique({
            where: {
              instituicaoId: contratanteId,
            },
            select: {
              status: true,
              testeGratisFimEm: true,
            },
          });

        const statusParaValidar =
          assinatura?.status ||
          instituicaoContratante
            ?.statusAssinatura ||
          instituicaoAtual
            ?.statusAssinatura;

        const isentaPagamento =
          instituicaoContratante
            ?.isentaPagamento ??
          instituicaoAtual
            ?.isentaPagamento;

        const podeUsarPhanyx =
          assinaturaPermiteUso(
            statusParaValidar,
            isentaPagamento,
            assinatura?.testeGratisFimEm
          );

        if (!podeUsarPhanyx) {
          return respostaComLogout(
            mensagemBloqueioAssinatura(
              statusParaValidar,
              isentaPagamento,
              assinatura?.testeGratisFimEm
            ) ||
              "O acesso da instituição ao PHANYX está bloqueado. Reative a assinatura para continuar."
          );
        }
      }
    }

    if (
      String(user.role).toUpperCase() ===
      "ALUNO"
    ) {
      const aluno =
        await prisma.aluno.findFirst({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
            statusAluno: true,
            instituicaoId: true,
          },
        });

      statusAluno =
        aluno?.statusAluno ?? null;

      if (aluno?.instituicaoId) {
        const config =
          await prisma.configuracaoFinanceiraInstituicao.findUnique(
            {
              where: {
                instituicaoId:
                  aluno.instituicaoId,
              },
              select: {
                bloquearAlunoInadimplente:
                  true,
              },
            }
          );

        bloqueioFinanceiroAtivo =
          Boolean(
            config
              ?.bloquearAlunoInadimplente
          );
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        instituicaoId:
          user.instituicaoId,
        instituicaoContratanteId,
        plano,
        isMasterAdmin:
          user.isMasterAdmin,
        statusAluno,
        bloqueioFinanceiroAtivo,
        ehInstituicaoContratante,
        permissaoDelegadaPolos,
        podeGerenciarPolos,
      },
    });
  } catch {
    return respostaComLogout(
      "Token inválido",
      401
    );
  }
}