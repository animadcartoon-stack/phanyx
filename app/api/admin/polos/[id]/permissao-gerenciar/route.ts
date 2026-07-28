import { NextRequest, NextResponse } from "next/server";
import { StatusComercialPolo } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  filtroPoloGerenciavel,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para alterar a autorização desta unidade.",
        },
        { status: 403 }
      );
    }

    const usuarioId = Number(user.id);
    const poloId = Number(params.id);

    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(poloId) ||
      poloId <= 0
    ) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const contexto =
      await obterContextoGestaoPolos(
        user.instituicaoId
      );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    /*
     * Somente a contratante pode conceder ou
     * retirar a autorização de gestão de polos.
     */
    if (!contexto.ehInstituicaoContratante) {
      return NextResponse.json(
        {
          error:
            "Somente a instituição contratante pode alterar esta autorização.",
        },
        { status: 403 }
      );
    }

    if (!contexto.redeId) {
      return NextResponse.json(
        {
          error:
            "A instituição contratante ainda não possui uma rede institucional válida.",
        },
        { status: 409 }
      );
    }

    const body = (await req
      .json()
      .catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (typeof body.habilitar !== "boolean") {
      return NextResponse.json(
        {
          error:
            "Informe se a autorização deve ser habilitada ou desabilitada.",
        },
        { status: 400 }
      );
    }

    const habilitar = body.habilitar;
    const motivo = String(
      body.motivo ?? ""
    ).trim();

    if (motivo.length < 5) {
      return NextResponse.json(
        {
          error:
            "Informe um motivo com pelo menos 5 caracteres.",
        },
        { status: 400 }
      );
    }

    const polo =
      await prisma.polo.findFirst({
        where: filtroPoloGerenciavel(
          contexto,
          poloId
        ),
        select: {
          id: true,
          nome: true,
          ativo: true,
          statusComercial: true,
          instituicaoId: true,
          instituicaoGeradaId: true,
        },
      });

    if (!polo) {
      return NextResponse.json(
        {
          error:
            "Polo não encontrado ou fora da rede institucional.",
        },
        { status: 404 }
      );
    }

    if (!polo.instituicaoGeradaId) {
      return NextResponse.json(
        {
          error:
            "Este polo ainda não possui um ID institucional criado.",
        },
        { status: 409 }
      );
    }

    if (
      polo.instituicaoGeradaId ===
      contexto.instituicaoContratanteId
    ) {
      return NextResponse.json(
        {
          error:
            "A autorização da instituição contratante não pode ser alterada por este fluxo.",
        },
        { status: 409 }
      );
    }

    if (
      habilitar &&
      (!polo.ativo ||
        polo.statusComercial !==
          StatusComercialPolo.ATIVO)
    ) {
      return NextResponse.json(
        {
          error:
            "A autorização só pode ser concedida a um polo ativo.",
        },
        { status: 409 }
      );
    }

    const instituicaoDoPolo =
      await prisma.instituicao.findUnique({
        where: {
          id: polo.instituicaoGeradaId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
          redeInstitucionalId: true,
          herdaPlanoContratante: true,
          podeCriarGerenciarPolos: true,
        },
      });

    if (!instituicaoDoPolo) {
      return NextResponse.json(
        {
          error:
            "A instituição vinculada ao polo não foi encontrada.",
        },
        { status: 404 }
      );
    }

    if (
      instituicaoDoPolo.redeInstitucionalId !==
      contexto.redeId
    ) {
      return NextResponse.json(
        {
          error:
            "A instituição vinculada ao polo não pertence à mesma rede da contratante.",
        },
        { status: 409 }
      );
    }

    if (
      instituicaoDoPolo.herdaPlanoContratante !==
      true
    ) {
      return NextResponse.json(
        {
          error:
            "A instituição vinculada não está configurada como unidade dependente da contratante.",
        },
        { status: 409 }
      );
    }

    if (
      habilitar &&
      instituicaoDoPolo.ativo === false
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível conceder a autorização a uma instituição inativa.",
        },
        { status: 409 }
      );
    }

    const agora = new Date();

    const instituicaoAtualizada =
      await prisma.instituicao.update({
        where: {
          id: instituicaoDoPolo.id,
        },
        data: {
          podeCriarGerenciarPolos:
            habilitar,
          updatedAt: agora,
        },
        select: {
          id: true,
          nome: true,
          podeCriarGerenciarPolos: true,
        },
      });

    console.info(
      "Permissão de gestão de polos alterada:",
      {
        poloId: polo.id,
        poloNome: polo.nome,
        instituicaoId:
          instituicaoAtualizada.id,
        instituicaoContratanteId:
          contexto.instituicaoContratanteId,
        habilitada:
          instituicaoAtualizada
            .podeCriarGerenciarPolos,
        motivo,
        alteradaPorId: usuarioId,
        alteradaEm: agora.toISOString(),
      }
    );

    return NextResponse.json({
      sucesso: true,
      mensagem: habilitar
        ? "A unidade agora pode criar e gerenciar outros polos."
        : "A autorização para criar e gerenciar outros polos foi retirada.",
      instituicao: instituicaoAtualizada,
    });
  } catch (error) {
    console.error(
      "Erro ao alterar permissão de gestão de polos:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível alterar a autorização desta unidade.",
      },
      { status: 500 }
    );
  }
}