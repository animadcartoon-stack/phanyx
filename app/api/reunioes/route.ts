import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

import { TipoComunicacaoWhatsApp } from "@prisma/client";

import { enviarComunicacaoWhatsapp } from "@/lib/whatsapp/enviar-comunicacao";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function podeCriarReuniao(role?: string) {
  return ["ADMIN", "FINANCEIRO", "SECRETARIA", "PROFESSOR"].includes(role || "");
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const reunioes = await prisma.reuniao.findMany({
      where: {
        instituicaoId: user.instituicaoId,
        OR: [
          { criadoPorId: user.id },
          {
            participantes: {
              some: {
                userId: user.id,
              },
            },
          },
          ...(user.role === "ALUNO"
            ? [
              {
                participantes: {
                  some: {
                    userId: user.id,
                  },
                },
              },
            ]
            : []),
        ],
      },
      include: {
        participantes: true,
        turma: true,
        curso: true,
        professor: true,
      },
      orderBy: {
        dataHora: "asc",
      },
    });

    return NextResponse.json(reunioes);
  } catch (error: any) {
    console.error("Erro ao listar reuniões:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao listar reuniões" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || !podeCriarReuniao(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = await req.json();

    const titulo = String(body.titulo || "").trim();
    const descricao = String(body.descricao || "").trim();
    const link = String(body.link || "").trim();
    const dataHora = body.dataHora ? new Date(body.dataHora) : null;
    const publicoTipo = String(body.publicoTipo || "").trim();

    const setor = body.setor ? String(body.setor).trim() : null;
    const turmaId = body.turmaId ? Number(body.turmaId) : null;
    const cursoId = body.cursoId ? Number(body.cursoId) : null;
    const participantesUserIds = Array.isArray(body.participantesUserIds)
      ? body.participantesUserIds.map(Number).filter(Boolean)
      : [];
    const participantesAlunoIds = Array.isArray(body.participantesAlunoIds)
      ? body.participantesAlunoIds.map(Number).filter(Boolean)
      : [];

    if (!titulo) {
      return NextResponse.json({ error: "Informe o título da reunião." }, { status: 400 });
    }

    if (!link) {
      return NextResponse.json({ error: "Informe o link da reunião." }, { status: 400 });
    }

    if (!dataHora || Number.isNaN(dataHora.getTime())) {
      return NextResponse.json({ error: "Informe data e hora válidas." }, { status: 400 });
    }
    if (dataHora.getTime() <= Date.now()) {
      return NextResponse.json({ error: "A reunião precisa ter data e horário futuros." }, { status: 400 });
    }

    if (!publicoTipo) {
      return NextResponse.json({ error: "Escolha o público da reunião." }, { status: 400 });
    }

    let professorId: number | null = null;

    if (user.role === "PROFESSOR") {
      const professor = await prisma.professor.findFirst({
        where: {
          userId: user.id,
          instituicaoId: user.instituicaoId,
        },
        select: {
          id: true,
        },
      });

      professorId = professor?.id || null;
    }

    const participantesMap = new Map<
      string,
      {
        userId?: number | null;
        alunoId?: number | null;
        tipo: string;
        nome: string;
        email?: string | null;
        telefone?: string | null;
      }
    >();

    function adicionarParticipante(p: {
      userId?: number | null;
      alunoId?: number | null;
      tipo: string;
      nome: string;
      email?: string | null;
      telefone?: string | null;
    }) {
      const chave = `${p.userId || "sem-user"}-${p.alunoId || "sem-aluno"}-${p.email || p.nome}`;
      participantesMap.set(chave, p);
    }

    if (publicoTipo === "INDIVIDUAL") {
      if (participantesUserIds.length > 0) {
        const usuarios = await prisma.user.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            id: { in: participantesUserIds },
            ativo: true,
          },
        });

        usuarios.forEach((u) =>
          adicionarParticipante({
            userId: u.id,
            tipo: u.role,
            nome: u.nome,
            email: u.email,
          })
        );
      }

      if (participantesAlunoIds.length > 0) {
        const alunos = await prisma.aluno.findMany({
          where: {
            instituicaoId: user.instituicaoId,
            id: { in: participantesAlunoIds },
            ativo: true,
          },
          include: {
            user: true,
          },
        });

        alunos.forEach((aluno) =>
          adicionarParticipante({
            userId: aluno.userId,
            alunoId: aluno.id,
            tipo: "ALUNO",
            nome: aluno.nome,
            email: aluno.user?.email || null,
            telefone: aluno.telefone || null,
          })
        );
      }
    }

    if (publicoTipo === "SETOR") {
      if (!setor) {
        return NextResponse.json(
          { error: "Escolha o setor da reunião." },
          { status: 400 }
        );
      }

      const funcionarios = await prisma.funcionario.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          OR: [
            { setor },
            {
              departamento: {
                nome: setor,
              },
            },
          ],
          user: {
            ativo: true,
          },
        },
        include: {
          user: true,
          permissoes: true,
          departamento: {
            include: {
              permissoes: true,
            },
          },
        },
      });

      function funcionarioTemPermissaoReuniaoSetor(funcionario: any) {
        const setorNormalizado = String(setor || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        let permissaoObrigatoria: string | null = null;

        if (setorNormalizado.includes("financeiro")) {
          permissaoObrigatoria = "financeiro.ver";
        }

        if (setorNormalizado.includes("rh")) {
          permissaoObrigatoria = "funcionarios.ver";
        }

        if (setorNormalizado.includes("secretaria")) {
          permissaoObrigatoria = "matriculas.ver";
        }

        if (setorNormalizado.includes("comercial")) {
          permissaoObrigatoria = "leads.ver";
        }

        if (!permissaoObrigatoria) return true;

        const temPermissaoIndividual = funcionario.permissoes?.some(
          (p: any) => p.chave === permissaoObrigatoria && p.ativo
        );

        const temPermissaoDepartamento = funcionario.departamento?.permissoes?.some(
          (p: any) => p.chave === permissaoObrigatoria && p.ativo
        );

        return Boolean(temPermissaoIndividual || temPermissaoDepartamento);
      }

      funcionarios
        .filter(funcionarioTemPermissaoReuniaoSetor)
        .forEach((funcionario) =>
          adicionarParticipante({
            userId: funcionario.userId,
            tipo: funcionario.user.role,
            nome: funcionario.nome,
            email: funcionario.user?.email || null,
            telefone: funcionario.telefone || null,
          })
        );

    }

    if (publicoTipo === "TURMA") {
      if (!turmaId) {
        return NextResponse.json(
          { error: "Escolha uma turma para a reunião." },
          { status: 400 }
        );
      }

      const itens = await prisma.itemMatricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          turmaId,
          matricula: {
            status: "ATIVA",
            aluno: {
              ativo: true,
            },
          },
        },
        include: {
          matricula: {
            include: {
              aluno: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      itens.forEach((item) => {
        const aluno = item.matricula.aluno;

        adicionarParticipante({
          userId: aluno.userId,
          alunoId: aluno.id,
          tipo: "ALUNO",
          nome: aluno.nome,
          email: aluno.user?.email || null,
          telefone: aluno.telefone || null,
        });
      });
    }

    if (publicoTipo === "CURSO") {
      if (!cursoId) {
        return NextResponse.json(
          { error: "Escolha um curso para a reunião." },
          { status: 400 }
        );
      }

      const matriculas = await prisma.matricula.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          cursoId,
          status: "ATIVA",
          aluno: {
            ativo: true,
          },
        },
        include: {
          aluno: {
            include: {
              user: true,
            },
          },
        },
      });

      matriculas.forEach((matricula) => {
        const aluno = matricula.aluno;

        adicionarParticipante({
          userId: aluno.userId,
          alunoId: aluno.id,
          tipo: "ALUNO",
          nome: aluno.nome,
          email: aluno.user?.email || null,
          telefone: aluno.telefone || null,
        });
      });
    }

    if (publicoTipo === "TODA_EQUIPE") {
      const usuariosEquipe = await prisma.user.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
          role: {
            in: ["ADMIN", "FINANCEIRO", "SECRETARIA"],
          },
        },
      });

      usuariosEquipe.forEach((u) =>
        adicionarParticipante({
          userId: u.id,
          tipo: u.role,
          nome: u.nome,
          email: u.email,
        })
      );
    }

    if (publicoTipo === "TODOS_ALUNOS") {
      const alunos = await prisma.aluno.findMany({
        where: {
          instituicaoId: user.instituicaoId,
          ativo: true,
        },
        include: {
          user: true,
        },
      });

      alunos.forEach((aluno) =>
        adicionarParticipante({
          userId: aluno.userId,
          alunoId: aluno.id,
          tipo: "ALUNO",
          nome: aluno.nome,
          email: aluno.user?.email || null,
          telefone: aluno.telefone || null,
        })
      );
    }

    if (participantesMap.size === 0) {
      return NextResponse.json(
        { error: "Nenhum participante encontrado para essa reunião." },
        { status: 400 }
      );
    }

    const reuniao = await prisma.reuniao.create({
      data: {
        instituicaoId: user.instituicaoId,
        criadoPorId: user.id,
        professorId,
        titulo,
        descricao: descricao || null,
        link,
        dataHora,
        publicoTipo,
        setor,
        turmaId,
        cursoId,
        enviarChat: true,
        enviarWhatsApp: false,
        participantes: {
          create: Array.from(participantesMap.values()),
        },
      },
      include: {
        participantes: true,
        turma: true,
        curso: true,
        professor: true,
      },
    });

    const configuracaoHorario = await prisma.configuracaoInstituicao.findFirst({
      where: { instituicaoId: user.instituicaoId }, select: { fusoHorario: true },
    });
    let fusoAgendamento = configuracaoHorario?.fusoHorario || "America/Sao_Paulo";
    try { new Intl.DateTimeFormat("pt-BR", { timeZone: fusoAgendamento }); }
    catch { fusoAgendamento = "America/Sao_Paulo"; }
    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: fusoAgendamento, dateStyle: "short", timeStyle: "short",
    }).format(reuniao.dataHora);

    function linkReuniaoPorTipo(tipo: string) {
      if (tipo === "ALUNO") return "/aluno/reunioes";
      if (tipo === "PROFESSOR") return "/professor/reunioes";
      return "/admin/reunioes";
    }

    const participantesParaNotificar = Array.from(new Map<number, (typeof reuniao.participantes)[number]>(
      reuniao.participantes
        .filter((participante) => participante.userId)
        .map((participante) => [participante.userId!, participante] as const)
    ).values());
    const notificacoes = participantesParaNotificar.map((participante) => ({
        usuarioId: participante.userId!,
        tipo: "REUNIAO",
        titulo: "📅 Nova reunião agendada",
        descricao: `${reuniao.titulo} • ${dataFormatada}`,
        link: linkReuniaoPorTipo(participante.tipo),
        chaveAgrupada: `REUNIAO:${reuniao.id}:CONVITE:USUARIO:${participante.userId!}`,
      }));

    if (notificacoes.length > 0) {
      await prisma.notificacao.createMany({
        data: notificacoes,
        skipDuplicates: true,
      });
    }

    /**
     * WhatsApp é um canal complementar.
     *
     * A reunião já foi criada e as notificações internas já foram
     * registradas. Qualquer problema no WhatsApp não pode desfazer
     * ou impedir a criação da reunião.
     */
    try {
      const enviosWhatsapp = reuniao.participantes.map(
        async (participante) => {
          return enviarComunicacaoWhatsapp({
            instituicaoId: user.instituicaoId!,

            usuarioId: participante.userId ?? null,

            tipoComunicacao:
              TipoComunicacaoWhatsApp.REUNIAO_CRIADA,

            telefone: participante.telefone ?? null,

            nomeDestinatario:
              participante.nome ?? null,

            parametros: {
              reuniaoId: reuniao.id,
              titulo: reuniao.titulo,
              dataHora: reuniao.dataHora.toISOString(),
              dataFormatada,
              link: reuniao.link ?? null,
              participanteTipo: participante.tipo,
            },

            componentes: [
              {
                type: "body",
                parameters: [
                  {
                    type: "text",
                    text:
                      participante.nome?.trim() ||
                      "Participante",
                  },
                  {
                    type: "text",
                    text: reuniao.titulo,
                  },
                  {
                    type: "text",
                    text: dataFormatada,
                  },
                  {
                    type: "text",
                    text:
                      reuniao.link?.trim() ||
                      "Acesse o PHANYX para mais informações.",
                  },
                ],
              },
            ],
          });
        }
      );

      const resultadosWhatsapp =
        await Promise.allSettled(enviosWhatsapp);

      const falhasInesperadas =
        resultadosWhatsapp.filter(
          (resultado) =>
            resultado.status === "rejected"
        );

      if (falhasInesperadas.length > 0) {
        console.error(
          "Falhas inesperadas ao processar WhatsApp da reunião:",
          falhasInesperadas.length
        );
      }
    } catch (errorWhatsapp) {
      console.error(
        "Erro ao iniciar comunicações WhatsApp da reunião:",
        errorWhatsapp
      );
    }

    return NextResponse.json(reuniao);
  } catch (error: any) {
    console.error("Erro ao criar reunião:", error);
    return NextResponse.json(
      { error: error?.message || "Erro ao criar reunião" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromToken();
    if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Reunião inválida." }, { status: 400 });
    }
    const reuniao = await prisma.reuniao.findFirst({
      where: { id, instituicaoId: user.instituicaoId },
      include: { participantes: true },
    });
    if (!reuniao) return NextResponse.json({ error: "Reunião não encontrada." }, { status: 404 });
    if (user.role !== "ADMIN" && reuniao.criadoPorId !== user.id) {
      return NextResponse.json({ error: "Sem permissão para cancelar esta reunião." }, { status: 403 });
    }
    if (reuniao.status === "CANCELADA") {
      return NextResponse.json({ sucesso: true, jaCancelada: true, mensagem: "Reunião já cancelada." });
    }
    if (reuniao.status !== "AGENDADA") {
      return NextResponse.json({ error: "Esta reunião não está agendada." }, { status: 409 });
    }

    const configuracao = await prisma.configuracaoInstituicao.findFirst({
      where: { instituicaoId: user.instituicaoId }, select: { fusoHorario: true },
    });
    let fuso = configuracao?.fusoHorario || "America/Sao_Paulo";
    try { new Intl.DateTimeFormat("pt-BR", { timeZone: fuso }); }
    catch { fuso = "America/Sao_Paulo"; }
    const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
      timeZone: fuso, dateStyle: "short", timeStyle: "short",
    }).format(reuniao.dataHora);

    const usuariosPorId = new Map<number, (typeof reuniao.participantes)[number]>(
      reuniao.participantes.filter(p => p.userId != null).map(p => [p.userId!, p] as const)
    );
    const usuariosIds = Array.from(usuariosPorId.keys());
    const feita = await prisma.$transaction(async (tx) => {
      // updateMany com filtro de status impede dois cancelamentos simultâneos.
      const atualizada = await tx.reuniao.updateMany({
        where: { id, instituicaoId: user.instituicaoId, status: "AGENDADA" },
        data: { status: "CANCELADA" },
      });
      if (atualizada.count !== 1) return false;

      // Remove lembretes e convites ativos. O histórico da reunião é preservado.
      await tx.notificacao.deleteMany({
        where: { chaveAgrupada: { startsWith: `REUNIAO:${id}:` } },
      });

      const avisos = Array.from(usuariosPorId.values()).map((pessoa) => ({
        instituicaoId: user.instituicaoId,
        usuarioId: pessoa.userId!,
        tipo: "REUNIAO_CANCELADA",
        titulo: "❌ Reunião cancelada",
        descricao: `${reuniao.titulo} • ${dataFormatada}`,
        link: pessoa.tipo === "ALUNO" ? "/aluno/reunioes" :
          pessoa.tipo === "PROFESSOR" ? "/professor/reunioes" : "/admin/reunioes",
        chaveAgrupada: `REUNIAO:${id}:CANCELAMENTO:USUARIO:${pessoa.userId}`,
      }));
      if (avisos.length) await tx.notificacao.createMany({ data: avisos, skipDuplicates: true });
      return true;
    });
    if (!feita) {
      return NextResponse.json({ erro: "A reunião já foi alterada ou cancelada." }, { status: 409 });
    }

    // Canal complementar; falha ou ausência de template não desfaz o aviso interno.
    try {
      const resultados = await Promise.allSettled(reuniao.participantes.map((p) =>
        enviarComunicacaoWhatsapp({
          instituicaoId: user.instituicaoId!,
          usuarioId: p.userId ?? null,
          tipoComunicacao: TipoComunicacaoWhatsApp.REUNIAO_CANCELADA,
          chaveIdempotencia: `instituicao:${user.instituicaoId}:reuniao:${id}:cancelamento:participante:${p.id}`,
          telefone: p.telefone ?? null,
          nomeDestinatario: p.nome ?? null,
          parametros: {
            reuniaoId: id, titulo: reuniao.titulo,
            dataHora: reuniao.dataHora.toISOString(), dataFormatada,
            participanteId: p.id,
          },
          componentes: [{ type: "body", parameters: [
            { type: "text", text: p.nome?.trim() || "Participante" },
            { type: "text", text: reuniao.titulo },
            { type: "text", text: dataFormatada },
          ] }],
        })
      ));
      const falhas = resultados.filter(item => item.status === "rejected").length;
      if (falhas) console.error("Falhas ao processar WhatsApp de cancelamento:", falhas);
    } catch (erroWhatsapp) {
      console.error("WhatsApp de cancelamento não concluído:", erroWhatsapp);
    }

    return NextResponse.json({ sucesso: true, mensagem: "Reunião cancelada; participantes avisados no PHANYX.", avisos: usuariosIds.length });
  } catch (error: unknown) {
    console.error("Erro ao cancelar reunião:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro ao cancelar reunião." }, { status: 500 });
  }
}
