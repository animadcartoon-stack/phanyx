import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const PERFIS_PERMITIDOS = ["ADMIN", "PROFESSOR", "SECRETARIA", "COORDENADOR", "FINANCEIRO"] as const;
type PerfilPermitido = (typeof PERFIS_PERMITIDOS)[number];

function idValido(valor: string) {
  const id = Number(valor);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function operadorAutorizado() {
  const usuario = await getUserFromToken();
  if (!usuario || !usuario.instituicaoId || usuario.impersonacao ||
    (usuario.role !== "ADMIN" && usuario.role !== "SUPER_ADMIN")) return null;
  return usuario;
}

const selecao = {
  id: true, nome: true, instituicaoId: true, departamentoId: true,
  cargoId: true, cargo: true, userId: true,
  departamento: { select: { nome: true } },
  user: { select: { id: true, role: true, ativo: true, isMasterAdmin: true } },
  professor: { select: { id: true, userId: true, ativo: true, statusProfessor: true } },
} as const;

async function vinculosDocentes(db: Prisma.TransactionClient, professorId: number) {
  const [turmas, disciplinasTurmas, sessoesOptativas] = await Promise.all([
    db.turma.count({ where: { professorId, ativa: true } }),
    db.turmaDisciplina.count({ where: { professorId, turma: { ativa: true } } }),
    db.sessaoOptativaAvulsa.count({ where: { professorId, ativa: true } }),
  ]);
  return { turmas, disciplinasTurmas, sessoesOptativas };
}

export async function GET(_request: Request, context: { params: { id: string } }) {
  const operador = await operadorAutorizado();
  if (!operador) return NextResponse.json({ error: "Somente a administração real da instituição pode realizar movimentações funcionais." }, { status: 403 });
  const id = idValido(context.params.id);
  if (!id) return NextResponse.json({ error: "Funcionário inválido." }, { status: 400 });
  const funcionario = await prisma.funcionario.findFirst({
    where: { id, instituicaoId: operador.instituicaoId }, select: selecao,
  });
  if (!funcionario) return NextResponse.json({ error: "Funcionário não encontrado nesta instituição." }, { status: 404 });
  const pendencias = funcionario.professor ? await vinculosDocentes(prisma, funcionario.professor.id) : null;
  return NextResponse.json({
    id: funcionario.id, nome: funcionario.nome,
    departamentoId: funcionario.departamentoId, departamentoNome: funcionario.departamento?.nome || null,
    cargoId: funcionario.cargoId, cargo: funcionario.cargo,
    perfil: funcionario.user?.role || null, temAcesso: Boolean(funcionario.userId && funcionario.user),
    possuiVinculoDocente: Boolean(funcionario.professor), pendencias,
    perfisPermitidos: PERFIS_PERMITIDOS,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const operador = await operadorAutorizado();
  if (!operador) return NextResponse.json({ error: "Operação restrita à administração da instituição." }, { status: 403 });
  const id = idValido(context.params.id);
  if (!id) return NextResponse.json({ error: "Funcionário inválido." }, { status: 400 });

  let dados: Record<string, unknown>;
  try { dados = await request.json(); }
  catch { return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 }); }
  const departamentoId = Number(dados.departamentoId);
  const cargoId = Number(dados.cargoId);
  const perfil = String(dados.perfil || "MANTER").trim().toUpperCase();
  const motivo = String(dados.motivo || "").trim();
  const dataVigencia = String(dados.vigenciaEm || "");
  if (!Number.isSafeInteger(departamentoId) || departamentoId <= 0 ||
      !Number.isSafeInteger(cargoId) || cargoId <= 0) {
    return NextResponse.json({ error: "Selecione um departamento e um cargo cadastrados." }, { status: 400 });
  }
  if (perfil !== "MANTER" && !(PERFIS_PERMITIDOS as readonly string[]).includes(perfil)) {
    return NextResponse.json({ error: "Perfil de acesso não permitido." }, { status: 400 });
  }
  if (motivo.length < 5 || motivo.length > 2000) {
    return NextResponse.json({ error: "Informe o motivo da movimentação (5 a 2000 caracteres)." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataVigencia)) {
    return NextResponse.json({ error: "Informe a data de vigência." }, { status: 400 });
  }
  const vigencia = new Date(`${dataVigencia}T12:00:00.000Z`);
  if (Number.isNaN(vigencia.getTime()) || vigencia.toISOString().slice(0, 10) !== dataVigencia ||
      dataVigencia > new Date().toISOString().slice(0, 10)) {
    return NextResponse.json({ error: "A vigência deve ser uma data válida, de hoje ou anterior. Movimentações futuras exigem agendamento específico." }, { status: 400 });
  }

  try {
    const resultado = await prisma.$transaction(async tx => {
      const funcionario = await tx.funcionario.findFirst({
        where: { id, instituicaoId: operador.instituicaoId! }, select: selecao,
      });
      if (!funcionario) throw new Error("FUNCIONARIO_NAO_ENCONTRADO");
      if (funcionario.user?.isMasterAdmin || funcionario.user?.role === "SUPER_ADMIN" || funcionario.user?.role === "SUPORTE") throw new Error("Esta conta de nível especial não pode ser movimentada por esta função.");
      const novoPerfil = perfil === "MANTER" ? funcionario.user?.role || null : perfil as PerfilPermitido;
      if (!funcionario.user && perfil !== "MANTER") throw new Error("O funcionário não tem login. Crie o acesso separadamente em Funcionários.");
      if (funcionario.userId === operador.id && novoPerfil !== funcionario.user?.role) {
        throw new Error("Não é permitido modificar o próprio perfil de acesso.");
      }
      const [departamento, cargo] = await Promise.all([
        tx.departamento.findFirst({ where: { id: departamentoId, instituicaoId: operador.instituicaoId!, ativo: true }, select: { nome: true } }),
        tx.cargo.findFirst({ where: { id: cargoId, instituicaoId: operador.instituicaoId!, departamentoId, ativo: true }, select: { nome: true } }),
      ]);
      if (!departamento || !cargo) throw new Error("Departamento ou cargo inválido/inativo para esta instituição.");
      const mudouLotacao = funcionario.departamentoId !== departamentoId || funcionario.cargoId !== cargoId;
      const mudouPerfil = Boolean(funcionario.user && novoPerfil !== funcionario.user.role);
      if (!mudouLotacao && !mudouPerfil) throw new Error("Nenhuma mudança foi selecionada.");
      if (funcionario.professor && funcionario.professor.userId !== funcionario.userId && mudouPerfil) {
        throw new Error("O cadastro docente possui outro login. Solicite uma análise do vínculo antes de alterar o perfil.");
      }
      if (mudouPerfil && funcionario.professor && novoPerfil !== "PROFESSOR") {
        const pendencias = await vinculosDocentes(tx, funcionario.professor.id);
        if (Object.values(pendencias).some(quantidade => quantidade > 0)) {
          throw new Error("Há turmas, disciplinas ou sessões vinculadas ao professor. Reatribua as responsabilidades antes de retirar o perfil docente.");
        }
      }
      if (mudouPerfil && novoPerfil === "PROFESSOR") {
        const conflito = await tx.professor.findFirst({ where: { userId: funcionario.userId! }, select: { id: true, funcionarioId: true } });
        if (conflito && conflito.funcionarioId !== funcionario.id) throw new Error("Existe outro vínculo docente para o mesmo login.");
      }
      await tx.funcionario.update({ where: { id: funcionario.id }, data: {
        departamentoId, cargoId, cargo: cargo.nome,
      }});
      if (mudouPerfil && funcionario.userId) {
        await tx.user.update({ where: { id: funcionario.userId }, data: { role: novoPerfil as PerfilPermitido } });
        if (novoPerfil === "PROFESSOR") {
          if (funcionario.professor) {
            await tx.professor.update({ where: { id: funcionario.professor.id }, data: {
              ativo: true, statusProfessor: "ATIVO", departamentoId,
            }});
          } else {
            await tx.professor.create({ data: {
              nome: funcionario.nome, userId: funcionario.userId,
              instituicaoId: operador.instituicaoId!, funcionarioId: funcionario.id,
              departamentoId, ativo: true, statusProfessor: "ATIVO",
            }});
          }
        } else if (funcionario.professor) {
          // Mantém o ID docente e todos os históricos. Não faz DELETE.
          await tx.professor.update({ where: { id: funcionario.professor.id }, data: {
            ativo: false, statusProfessor: "INATIVO",
          }});
        }
      }
      // Se a pessoa continua professora, a transferência de departamento
      // deve ser refletida também no cadastro docente, dentro da mesma transação.
      if (!mudouPerfil && funcionario.professor && funcionario.user?.role === "PROFESSOR" &&
          funcionario.departamentoId !== departamentoId) {
        await tx.professor.update({
          where: { id: funcionario.professor.id },
          data: { departamentoId },
        });
      }
      await tx.historicoRH.create({ data: {
        funcionarioId: funcionario.id, instituicaoId: operador.instituicaoId!,
        criadoPorId: operador.id, tipo: "MOVIMENTACAO_FUNCIONAL",
        titulo: "Movimentação funcional do funcionário",
        descricao: `${funcionario.nome}: ${funcionario.cargo || "sem cargo"} → ${cargo.nome}; ${funcionario.departamento?.nome || "sem departamento"} → ${departamento.nome}.`,
        dataEvento: vigencia,
        observacoes: JSON.stringify({ versao: 1, motivo, vigenciaEm: dataVigencia,
          anterior: { departamentoId: funcionario.departamentoId, departamento: funcionario.departamento?.nome || null,
            cargoId: funcionario.cargoId, cargo: funcionario.cargo, perfil: funcionario.user?.role || null },
          novo: { departamentoId, departamento: departamento.nome, cargoId, cargo: cargo.nome, perfil: novoPerfil },
          docenteIdPreservado: funcionario.professor?.id || null,
        }),
      }});
      return { funcionarioId: funcionario.id, usuarioIdPreservado: funcionario.userId,
        departamento: departamento.nome, cargo: cargo.nome, perfil: novoPerfil, docentePreservado: Boolean(funcionario.professor) };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 30000 });
    return NextResponse.json({ message: "Movimentação funcional registrada no histórico do RH.", ...resultado });
  } catch(error) {
    console.error("MOVIMENTACAO_FUNCIONAL_RH", error);
    const mensagem = error instanceof Error &&
      /FUNCIONARIO_NAO_ENCONTRADO|conta de nível especial|O funcionário|Não é permitido|Departamento|Nenhuma mudança|cadastro docente|Há turmas|Existe outro vínculo/.test(error.message)
      ? error.message : "Não foi possível concluir a movimentação funcional. Nenhum registro foi confirmado.";
    return NextResponse.json({ error: mensagem }, { status: 409 });
  }
}
