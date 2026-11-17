import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const CONFIRMACAO = "CORRIGIR CADASTRO";

function identificadorValido(id: string) {
  const valor = Number(id);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

function autorizado(user: Awaited<ReturnType<typeof getUserFromToken>>) {
  return Boolean(
    user &&
      user.instituicaoId &&
      !user.impersonacao &&
      (user.role === "ADMIN" || user.role === "SUPER_ADMIN")
  );
}

// Nunca transformar um cadastro que contenha trabalho acadêmico em exclusão simples.
// Essas relações podem incluir arquivos, assinaturas e registros que seriam apagados
// por cascata. Em tais casos, exige-se um procedimento de migração específico.
async function verificarVinculosAcademicos(db: Prisma.TransactionClient, professorId: number) {
  const verificacoes = await Promise.all([
    db.turma.count({ where: { professorId } }).then((n) => ["Turmas", n] as const),
    db.turmaDisciplina.count({ where: { professorId } }).then((n) => ["Disciplinas de turmas", n] as const),
    db.disciplina.count({ where: { professorId } }).then((n) => ["Disciplinas", n] as const),
    db.professorDisciplina.count({ where: { professorId } }).then((n) => ["Habilitações docentes", n] as const),
    db.atividade.count({ where: { professorResponsavelId: professorId } }).then((n) => ["Atividades", n] as const),
    db.atividadeExternaEquipe.count({ where: { professorId } }).then((n) => ["Atividades externas", n] as const),
    db.reuniao.count({ where: { professorId } }).then((n) => ["Reuniões", n] as const),
    db.sessaoOptativaAvulsa.count({ where: { professorId } }).then((n) => ["Sessões optativas", n] as const),
    db.substituicaoDocente.count({
      where: { OR: [{ professorTitularId: professorId }, { professorSubstitutoId: professorId }] },
    }).then((n) => ["Substituições docentes", n] as const),
    db.documentoDocente.count({ where: { professorId } }).then((n) => ["Documentos docentes", n] as const),
    db.documentoProfessor.count({ where: { professorId } }).then((n) => ["Documentos do professor", n] as const),
    db.planoRelatorioAula.count({ where: { professorId } }).then((n) => ["Planejamentos e relatórios", n] as const),
    db.registroDesenvolvimento.count({ where: { professorId } }).then((n) => ["Registros de desenvolvimento", n] as const),
    db.historicoRemuneracaoRH.count({ where: { professorId } }).then((n) => ["Histórico de remuneração vinculado ao professor", n] as const),
    db.bibliotecaRecomendacao.count({ where: { professorId } }).then((n) => ["Recomendações da biblioteca", n] as const),
    db.mobilidadeCandidatura.count({ where: { professorId } }).then((n) => ["Candidaturas de mobilidade", n] as const),
  ]);

  return verificacoes
    .filter(([, quantidade]) => quantidade > 0)
    .map(([tipo, quantidade]) => ({ tipo, quantidade }));
}

async function localizarProfessor(db: Prisma.TransactionClient, professorId: number, instituicaoId: number) {
  return db.professor.findFirst({
    where: { id: professorId, instituicaoId },
    select: {
      id: true,
      nome: true,
      userId: true,
      funcionarioId: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true,
          ativo: true,
          isMasterAdmin: true,
          aluno: { select: { id: true } },
          perfilAdministrativo: { select: { userId: true } },
        },
      },
      funcionario: {
        select: { id: true, instituicaoId: true, userId: true, cargo: true, cargoId: true },
      },
    },
  });
}

function situacaoPermiteCorrecao(
  professor: Awaited<ReturnType<typeof localizarProfessor>>,
  usuarioOperadorId: number
) {
  if (!professor || !professor.funcionarioId || !professor.funcionario) {
    return "Este professor não possui cadastro de funcionário no RH para preservar.";
  }
  if (
    professor.user.id === usuarioOperadorId ||
    professor.user.role !== "PROFESSOR" ||
    professor.user.isMasterAdmin ||
    professor.user.aluno ||
    professor.user.perfilAdministrativo
  ) {
    return "O usuário possui outro perfil ou vínculo; a correção automática não é permitida.";
  }
  if (professor.funcionario.userId !== professor.userId) {
    return "O funcionário e o professor não compartilham o mesmo login. É necessária análise manual.";
  }
  return null;
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  const operador = await getUserFromToken();
  if (!autorizado(operador)) {
    return NextResponse.json({ error: "Acesso restrito à administração da instituição." }, { status: 403 });
  }

  const professorId = identificadorValido(context.params.id);
  if (!professorId) {
    return NextResponse.json({ error: "ID de professor inválido." }, { status: 400 });
  }

  const professor = await localizarProfessor(prisma, professorId, operador!.instituicaoId!);
  if (!professor) {
    return NextResponse.json({ error: "Professor não encontrado nesta instituição." }, { status: 404 });
  }

  const problema = situacaoPermiteCorrecao(professor, operador!.id);
  const pendencias = await verificarVinculosAcademicos(prisma, professorId);
  const [permissoes, historicos] = await Promise.all([
    prisma.professorPaginaPortal.count({ where: { professorId } }),
    prisma.historicoPermissaoProfessor.count({ where: { professorId } }),
  ]);

  return NextResponse.json(
    {
      professorId,
      funcionarioId: professor.funcionarioId,
      nome: professor.nome,
      perfilAtual: professor.user.role,
      perfilNovo: "ADMIN",
      cargoNovo: "Coordenadora",
      email: professor.user.email,
      historicosPermissoes: historicos,
      permissoes,
      pendencias,
      podeCorrigir: !problema && pendencias.length === 0,
      motivoBloqueio: problema,
    },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const operador = await getUserFromToken();
  if (!autorizado(operador)) {
    return NextResponse.json({ error: "Acesso restrito à administração da instituição." }, { status: 403 });
  }

  const professorId = identificadorValido(context.params.id);
  if (!professorId) {
    return NextResponse.json({ error: "ID de professor inválido." }, { status: 400 });
  }

  let body: { confirmacao?: unknown; funcionarioId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 });
  }

  if (
    body?.confirmacao !== CONFIRMACAO ||
    !Number.isSafeInteger(Number(body.funcionarioId)) ||
    Number(body.funcionarioId) <= 0
  ) {
    return NextResponse.json({ error: "Confirme a operação e o ID do funcionário." }, { status: 400 });
  }

  const senhaAleatoria = crypto.randomBytes(48).toString("hex");
  const senhaHash = await bcrypt.hash(senhaAleatoria, 12);
  const senhaArquivo = await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 12);

  try {
    const resultado = await prisma.$transaction(
      async (tx) => {
        const professor = await localizarProfessor(tx, professorId, operador!.instituicaoId!);
        if (!professor) throw new Error("CADASTRO_NAO_ENCONTRADO");

        const problema = situacaoPermiteCorrecao(professor, operador!.id);
        if (problema) throw new Error(problema);
        if (professor.funcionario!.instituicaoId !== operador!.instituicaoId) {
          throw new Error("O funcionário pertence a outra instituição.");
        }
        if (professor.funcionarioId !== Number(body.funcionarioId)) {
          throw new Error("O ID do funcionário mudou. Atualize a tela antes de prosseguir.");
        }

        const pendencias = await verificarVinculosAcademicos(tx, professorId);
        if (pendencias.length > 0) throw new Error("VÍNCULOS_ACADÊMICOS: " + pendencias.map((p) => p.tipo).join(", "));

        const [permissoes, historicos] = await Promise.all([
          tx.professorPaginaPortal.findMany({ where: { professorId } }),
          tx.historicoPermissaoProfessor.findMany({ where: { professorId } }),
        ]);

        // O registro de login antigo permanece inativo para preservar
        // notificações, autorias e FKs históricas. Somente o ID de Professor
        // é excluído; o novo login administrativo recebe outro ID de User.
        const emailOriginal = professor.user.email;
        const emailArquivo = `ex-professor-${professor.id}-usuario-${professor.userId}@contas-inativas.phanyx.invalid`;
        await tx.user.update({
          where: { id: professor.userId },
          data: {
            ativo: false,
            email: emailArquivo,
            senha: senhaArquivo,
            precisaTrocarSenha: false,
            resetToken: null,
            resetTokenExpira: null,
          },
        });

        const novoUsuario = await tx.user.create({
          data: {
            nome: professor.nome,
            email: emailOriginal,
            senha: senhaHash,
            role: "ADMIN",
            instituicaoId: operador!.instituicaoId!,
            ativo: true,
            precisaTrocarSenha: true,
            isMasterAdmin: false,
          },
          select: { id: true },
        });

        await tx.funcionario.update({
          where: { id: professor.funcionarioId! },
          data: {
            userId: novoUsuario.id,
            cargo: "Coordenadora",
            cargoId: null,
          },
        });

        // O banco remove os registros de permissão vinculados ao Professor
        // por CASCADE. Preservamos cópia íntegra no histórico de RH.
        await tx.historicoRH.create({
          data: {
            instituicaoId: operador!.instituicaoId!,
            funcionarioId: professor.funcionarioId!,
            criadoPorId: operador!.id,
            tipo: "CORRECAO_CADASTRAL",
            titulo: "Cadastro de professora corrigido para administradora",
            descricao: `Professor #${professor.id} removido; usuário docente #${professor.userId} inativado; novo usuário administrativo #${novoUsuario.id}. Funcionário #${professor.funcionarioId} preservado.`,
            observacoes: JSON.stringify({
              versao: 1,
              motivo: "Professor cadastrado indevidamente; cargo correto: Coordenadora, perfil administrativo",
              professorIdAntigo: professor.id,
              usuarioProfessorIdAntigo: professor.userId,
              usuarioAdministrativoIdNovo: novoUsuario.id,
              funcionarioIdPreservado: professor.funcionarioId,
              emailDoNovoUsuario: emailOriginal,
              cargoAnterior: professor.funcionario!.cargo,
              cargoIdAnterior: professor.funcionario!.cargoId,
              permissoesDocentesAnteriores: permissoes,
              historicoPermissoesDocentes: historicos,
            }),
          },
        });

        await tx.professor.delete({ where: { id: professor.id } });

        return {
          professorIdExcluido: professor.id,
          usuarioProfessorIdInativado: professor.userId,
          funcionarioIdPreservado: professor.funcionarioId,
          usuarioAdministrativoIdCriado: novoUsuario.id,
          email: emailOriginal,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 }
    );

    return NextResponse.json({
      message: "Cadastro corrigido: ID docente excluído, RH preservado e novo usuário ADMIN criado.",
      ...resultado,
      proximoPasso: "No portal administrativo, use Esqueci minha senha com o e-mail cadastrado para definir a nova senha.",
    });
  } catch (error) {
    console.error("CORRECAO_PROFESSOR_ADMIN:", error);
    return NextResponse.json(
      {
        error: error instanceof Error &&
          (error.message.startsWith("VÍNCULOS_ACADÊMICOS") ||
            error.message === "CADASTRO_NAO_ENCONTRADO" ||
            error.message.includes("funcionário") ||
            error.message.includes("usuário") ||
            error.message.includes("vínculo") ||
            error.message.includes("ID do funcionário"))
          ? error.message
          : "Não foi possível corrigir o cadastro com segurança. Nenhuma alteração foi confirmada.",
      },
      { status: 409 }
    );
  }
}
