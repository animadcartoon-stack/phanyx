import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function limparSomenteNumeros(valor: unknown) {
  return String(valor ?? "").replace(/\D/g, "");
}

function parseDataSegura(valor: unknown) {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  const data = new Date(texto);
  if (Number.isNaN(data.getTime())) return null;

  return data;
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    const { id } = context.params;

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId ?? undefined,
      },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(aluno);
  } catch (error) {
    console.error("ERRO AO BUSCAR ALUNO:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { id } = context.params;
    const alunoId = Number(id);

    if (!Number.isFinite(alunoId) || alunoId <= 0) {
      return NextResponse.json(
        { error: "ID do aluno inválido." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: alunoId,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const [
      matriculas,
      contratos,
      documentos,
      documentosGerados,
      certificados,
      lancamentos,
      pagamentos,
      notas,
      presencas,
      progresso,
      tentativas,
      respostas,
      resultadosFinais,
      entregas,
      atestados,
      cobrancas,
      movimentosCaixa,
    ] = await Promise.all([
      prisma.matricula.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          curso: {
            select: {
              nome: true,
            },
          },
        },
      }),
      prisma.contrato.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.documentoAluno.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.documentoGerado.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.certificado.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.lancamentoFinanceiro.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.pagamento.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.nota.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.presencaAula.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.progressoAula.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.tentativaProva.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.respostaProva.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.resultadoFinal.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.entregaAtividade.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.atestadoMedico.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.cobranca.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
      prisma.movimentoCaixa.findMany({
        where: {
          alunoId,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (matriculas.length > 0) {
      const cursos = matriculas
        .map((m) => m.curso?.nome)
        .filter(Boolean)
        .join(", ");

      return NextResponse.json(
        {
          error: cursos
            ? `Aluno não pode ser excluído porque ainda possui matrícula vinculada ao curso: ${cursos}.`
            : "Aluno não pode ser excluído porque ainda possui matrícula vinculada.",
        },
        { status: 400 }
      );
    }

    if (
      contratos.length > 0 ||
      documentos.length > 0 ||
      documentosGerados.length > 0 ||
      certificados.length > 0 ||
      lancamentos.length > 0 ||
      pagamentos.length > 0 ||
      notas.length > 0 ||
      presencas.length > 0 ||
      progresso.length > 0 ||
      tentativas.length > 0 ||
      respostas.length > 0 ||
      resultadosFinais.length > 0 ||
      entregas.length > 0 ||
      atestados.length > 0 ||
      cobrancas.length > 0 ||
      movimentosCaixa.length > 0
    ) {
      return NextResponse.json(
        {
          error:
            "Aluno não pode ser excluído porque ainda possui histórico acadêmico, financeiro ou documental vinculado.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.aluno.delete({
        where: { id: alunoId },
      });

      await tx.user.delete({
        where: { id: aluno.userId },
      });
    });

    return NextResponse.json({
      message: "Aluno deletado com sucesso",
    });
  } catch (error: any) {
    console.error("ERRO AO DELETAR ALUNO:", error);

    if (error?.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "Aluno não pode ser excluído porque ainda possui vínculos no sistema.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Erro ao deletar aluno.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { id } = context.params;
    const body = await request.json();

    const alunoExistente = await prisma.aluno.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!alunoExistente) {
      return NextResponse.json(
        { error: "Aluno não encontrado" },
        { status: 404 }
      );
    }

    const emailNormalizado = limparTexto(body.email).toLowerCase();
    const cpfNormalizado = limparSomenteNumeros(body.cpf);
    const matriculaNormalizada = limparTexto(body.matricula);

    if (!limparTexto(body.nome)) {
      return NextResponse.json(
        { error: "O nome do aluno é obrigatório." },
        { status: 400 }
      );
    }

    if (!emailNormalizado) {
      return NextResponse.json(
        { error: "O email do aluno é obrigatório." },
        { status: 400 }
      );
    }

    const userComMesmoEmail = await prisma.user.findFirst({
      where: {
        email: emailNormalizado,
        id: {
          not: alunoExistente.userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (userComMesmoEmail) {
      return NextResponse.json(
        { error: "Este email já está cadastrado." },
        { status: 400 }
      );
    }

    if (matriculaNormalizada) {
      const alunoComMesmaMatricula = await prisma.aluno.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          matricula: matriculaNormalizada,
          id: {
            not: alunoExistente.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (alunoComMesmaMatricula) {
        return NextResponse.json(
          { error: "Esta matrícula já está cadastrada." },
          { status: 400 }
        );
      }
    }

    if (cpfNormalizado) {
      const alunoComMesmoCpf = await prisma.aluno.findFirst({
        where: {
          instituicaoId: user.instituicaoId,
          cpf: cpfNormalizado,
          id: {
            not: alunoExistente.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (alunoComMesmoCpf) {
        return NextResponse.json(
          { error: "Este CPF já está cadastrado." },
          { status: 400 }
        );
      }
    }

    await prisma.aluno.update({
      where: { id: Number(id) },
      data: {
        nome: limparTexto(body.nome),
        nomeSocial: limparTexto(body.nomeSocial) || null,
        genero: limparTexto(body.genero) || null,
        matricula: matriculaNormalizada || null,
        cpf: cpfNormalizado || null,
        rg: limparTexto(body.rg) || null,
        telefone: limparTexto(body.telefone) || null,
        dataNascimento: parseDataSegura(body.dataNascimento),
        cep: limparTexto(body.cep) || null,
        endereco: limparTexto(body.endereco) || null,
        numero: limparTexto(body.numero) || null,
        complemento: limparTexto(body.complemento) || null,
        bairro: limparTexto(body.bairro) || null,
        cidade: limparTexto(body.cidade) || null,
        estado: limparTexto(body.estado) || null,
        documentoUrl: limparTexto(body.documentoUrl) || null,
        nomeResponsavel: limparTexto(body.nomeResponsavel) || null,
        cpfResponsavel: limparSomenteNumeros(body.cpfResponsavel) || null,
        telefoneResponsavel: limparTexto(body.telefoneResponsavel) || null,
        emailResponsavel: limparTexto(body.emailResponsavel).toLowerCase() || null,
        parentescoResponsavel: limparTexto(body.parentescoResponsavel) || null,
        statusAluno: limparTexto(body.statusAluno) || "ATIVO",
        possuiNecessidadeEspecial: !!body.possuiNecessidadeEspecial,
        descricaoNecessidadeEspecial:
          limparTexto(body.descricaoNecessidadeEspecial) || null,
        observacoesAcessibilidade:
          limparTexto(body.observacoesAcessibilidade) || null,
      },
    });

    await prisma.user.update({
      where: { id: alunoExistente.userId },
      data: {
        nome: limparTexto(body.nome),
        email: emailNormalizado,
      },
    });

    return NextResponse.json({
      message: "Aluno atualizado com sucesso",
    });
  } catch (error: any) {
    console.error("ERRO AO ATUALIZAR ALUNO:", error);

    if (error?.code === "P2002") {
      return NextResponse.json(
        {
          error: "Já existe um cadastro com um dos dados informados.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro ao atualizar aluno" },
      { status: 500 }
    );
  }
}