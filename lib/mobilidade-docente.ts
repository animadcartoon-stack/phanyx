import { Prisma } from "@prisma/client";
import { ErroMobilidade } from "@/lib/mobilidade-acesso";
import { CHAVE_INSCRICOES_DOCENTES, CHAVE_MOBILIDADE_DOCENTE } from "@/lib/mobilidade-docente-config";
import { prisma } from "@/lib/prisma";
import type { UsuarioLogado } from "@/lib/server-auth";

const statusesEncerrados = ["INELEGIVEL", "APROVADA", "REPROVADA", "DESISTENTE", "CANCELADA"] as const;

export function candidaturaDocenteEditavel(status: string) {
  return !statusesEncerrados.some((encerrado) => encerrado === status);
}

export function filtroDocumentosDocente(): Prisma.MobilidadeCandidaturaWhereInput {
  return { status: { notIn: [...statusesEncerrados] } };
}

async function configuracaoDocente(db: Prisma.TransactionClient, instituicaoId: number) {
  const configuracoes = await db.configuracaoPortalInstituicao.findMany({
    where: {
      instituicaoId,
      portal: "PROFESSOR",
      chavePagina: { in: [CHAVE_MOBILIDADE_DOCENTE, CHAVE_INSCRICOES_DOCENTES] },
    },
    select: { chavePagina: true, visivel: true },
  });

  return {
    visivel: configuracoes.some(({ chavePagina, visivel }) => chavePagina === CHAVE_MOBILIDADE_DOCENTE && visivel),
    inscricoes: configuracoes.some(({ chavePagina, visivel }) => chavePagina === CHAVE_INSCRICOES_DOCENTES && visivel),
  };
}

export async function exigirContextoMobilidadeDocente(
  usuario: UsuarioLogado | null,
  db: Prisma.TransactionClient = prisma,
) {
  if (usuario?.role !== "PROFESSOR" || !usuario.instituicaoId) {
    throw new ErroMobilidade(401, "NAO_AUTORIZADO", "Não autorizado.");
  }

  const instituicaoId = usuario.instituicaoId;
  const [configuracao, professor] = await Promise.all([
    configuracaoDocente(db, instituicaoId),
    db.professor.findFirst({
      where: { instituicaoId, userId: usuario.id, ativo: true },
      select: { id: true, nome: true, telefone: true },
    }),
  ]);

  if (!configuracao.visivel || !professor) {
    throw new ErroMobilidade(404, "MOBILIDADE_DOCENTE_INDISPONIVEL", "Mobilidade docente indisponível.");
  }

  return {
    instituicaoId,
    professor,
    usuario,
    podeInscrever: configuracao.inscricoes && !usuario.impersonacao,
  };
}

// As datas do formulário do Admin representam dias de calendário em UTC.
export function diaOferta(agora: Date) {
  return new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
}

export function filtroOfertasDocentes(
  instituicaoId: number,
  agora: Date,
  apenasAbertas = false,
): Prisma.MobilidadeOfertaWhereInput {
  const hoje = diaOferta(agora);
  const amanha = new Date(hoje.getTime() + 86_400_000);

  return {
    instituicaoId,
    publico: { in: ["PROFESSORES", "AMBOS"] },
    publicadoEm: { lte: agora },
    status: { in: apenasAbertas ? ["INSCRICOES_ABERTAS"] : ["INSCRICOES_AGENDADAS", "INSCRICOES_ABERTAS"] },
    programa: {
      instituicaoId,
      ativo: true,
      status: "ATIVO",
      direcao: { in: ["SAIDA", "BIDIRECIONAL"] },
    },
    AND: [
      { OR: [{ inscricoesFim: null }, { inscricoesFim: { gte: hoje } }] },
      ...(apenasAbertas ? [{ OR: [{ inscricoesInicio: null }, { inscricoesInicio: { lt: amanha } }] }] : []),
    ],
  };
}

export async function inscreverDocenteMobilidade(usuario: UsuarioLogado | null, ofertaId: number) {
  return prisma.$transaction(async (tx) => {
    const { instituicaoId, professor, podeInscrever, usuario: docente } =
      await exigirContextoMobilidadeDocente(usuario, tx);
    if (!podeInscrever) {
      throw new ErroMobilidade(403, "INSCRICOES_DOCENTES_DESATIVADAS", "Inscrições docentes indisponíveis.");
    }

    const agora = new Date();
    const oferta = await tx.mobilidadeOferta.findFirst({
      where: { ...filtroOfertasDocentes(instituicaoId, agora, true), id: ofertaId },
      select: {
        id: true,
        requisitosDocumentos: {
          where: { ativo: true, instituicaoId },
          select: { id: true, tipo: true, titulo: true, descricao: true, obrigatorio: true, exigeValidade: true, ordem: true },
        },
      },
    });

    if (!oferta) {
      throw new ErroMobilidade(404, "OFERTA_INDISPONIVEL", "Oferta indisponível para inscrição docente.");
    }

    return tx.mobilidadeCandidatura.create({
      data: {
        instituicaoId,
        ofertaId: oferta.id,
        professorId: professor.id,
        vinculoCandidato: "PROFESSOR_PHANYX",
        nomeSnapshot: professor.nome,
        emailSnapshot: docente.email,
        telefoneSnapshot: professor.telefone,
        criadoPorId: docente.id,
        status: "ENVIADA",
        enviadaEm: agora,
        documentos: {
          create: oferta.requisitosDocumentos.map(({ id, descricao, ...requisito }) => ({
            ...requisito,
            instituicaoId,
            requisitoOfertaId: id,
            descricaoRequisito: descricao,
          })),
        },
      },
      select: { id: true },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
