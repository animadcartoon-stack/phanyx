import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

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

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const { id } = context.params;
    const body = await request.json();

    const statusAluno = String(body.statusAluno || "").trim().toUpperCase();

    const statusPermitidos = [
      "ATIVO",
      "TRANCADO",
      "INADIMPLENTE",
      "TRANSFERIDO",
      "DESLIGADO",
      "FORMADO",
      "CANCELADO",
      "SUSPENSO",
      "PAUSA_MEDICA",
      "FALTANTE",
    ];

    if (!statusPermitidos.includes(statusAluno)) {
      return NextResponse.json(
        { error: "Status do aluno inválido." },
        { status: 400 }
      );
    }

    const aluno = await prisma.aluno.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
      select: {
        id: true,
      },
    });

    if (!aluno) {
      return NextResponse.json(
        { error: "Aluno não encontrado." },
        { status: 404 }
      );
    }

    const atualizado = await prisma.aluno.update({
      where: { id: Number(id) },
      data: {
        statusAluno: statusAluno as any,
      },
    });

    return NextResponse.json({
      message: "Status do aluno atualizado com sucesso.",
      aluno: atualizado,
    });
  } catch (error) {
    console.error("ERRO AO ATUALIZAR STATUS DO ALUNO:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do aluno." },
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

    const pendencias: string[] = [];

if (contratos.length > 0) pendencias.push(`${contratos.length} contrato(s)`);
if (documentos.length > 0) pendencias.push(`${documentos.length} documento(s) do aluno`);
if (documentosGerados.length > 0) pendencias.push(`${documentosGerados.length} documento(s) gerado(s)`);
if (certificados.length > 0) pendencias.push(`${certificados.length} certificado(s)`);
if (lancamentos.length > 0) pendencias.push(`${lancamentos.length} lançamento(s) financeiro(s)`);
if (pagamentos.length > 0) pendencias.push(`${pagamentos.length} pagamento(s)`);
if (notas.length > 0) pendencias.push(`${notas.length} nota(s)`);
if (presencas.length > 0) pendencias.push(`${presencas.length} presença(s)`);
if (progresso.length > 0) pendencias.push(`${progresso.length} registro(s) de progresso`);
if (tentativas.length > 0) pendencias.push(`${tentativas.length} tentativa(s) de prova`);
if (respostas.length > 0) pendencias.push(`${respostas.length} resposta(s) de prova`);
if (resultadosFinais.length > 0) pendencias.push(`${resultadosFinais.length} resultado(s) final(is)`);
if (entregas.length > 0) pendencias.push(`${entregas.length} entrega(s) de atividade`);
if (atestados.length > 0) pendencias.push(`${atestados.length} atestado(s) médico(s)`);
if (cobrancas.length > 0) pendencias.push(`${cobrancas.length} cobrança(s)`);
if (movimentosCaixa.length > 0) pendencias.push(`${movimentosCaixa.length} movimento(s) de caixa`);

if (pendencias.length > 0) {
  return NextResponse.json(
    {
      error: `Aluno não pode ser excluído porque ainda possui vínculos: ${pendencias.join(", ")}.`,
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
        fotoPerfil: limparTexto(body.fotoPerfil) || null,
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