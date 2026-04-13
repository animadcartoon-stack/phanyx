import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  gerarCodigoCertificado,
  validarCodigoEstrutura,
} from "@/lib/certificados/assinatura";

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "ip-desconhecido";
}

function getUserAgent(req: NextRequest) {
  return req.headers.get("user-agent") || "user-agent-desconhecido";
}

async function registrarAuditoria({
  codigoConsultado,
  documentoId = null,
  instituicaoId = null,
  valido,
  ip,
  userAgent,
  suspeito,
  risco,
  motivoRisco,
}: {
  codigoConsultado: string;
  documentoId?: number | null;
  instituicaoId?: number | null;
  valido: boolean;
  ip: string;
  userAgent: string;
  suspeito: boolean;
  risco: number;
  motivoRisco?: string | null;
}) {
  await prisma.auditoriaValidacaoDocumento.create({
    data: {
      codigoConsultado,
      documentoId,
      instituicaoId,
      valido,
      ip,
      userAgent,
      suspeito,
      risco,
      motivoRisco: motivoRisco || null,
    },
  });
}

async function ipEstaBloqueado(ip: string) {
  const bloqueio = await prisma.bloqueioIP.findFirst({
    where: {
      ip,
      ativo: true,
      OR: [
        { bloqueadoAte: null },
        { bloqueadoAte: { gt: new Date() } },
      ],
    },
  });

  return Boolean(bloqueio);
}

async function contarTentativasRecentes(ip: string, minutos = 15) {
  const inicio = new Date(Date.now() - minutos * 60 * 1000);

  return prisma.auditoriaValidacaoDocumento.count({
    where: {
      ip,
      criadoEm: {
        gte: inicio,
      },
    },
  });
}

async function bloquearIpSeNecessario(ip: string, risco: number, motivo: string) {
  if (risco < 80) return;

  const jaExiste = await prisma.bloqueioIP.findFirst({
    where: {
      ip,
      ativo: true,
      OR: [
        { bloqueadoAte: null },
        { bloqueadoAte: { gt: new Date() } },
      ],
    },
  });

  if (jaExiste) return;

  const bloqueadoAte = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.bloqueioIP.create({
    data: {
      ip,
      ativo: true,
      motivo,
      bloqueadoAte,
    },
  });
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = getUserAgent(req);

  try {
    const { searchParams } = new URL(req.url);
    const codigo = String(searchParams.get("codigo") || "").trim();

    if (await ipEstaBloqueado(ip)) {
      await registrarAuditoria({
        codigoConsultado: codigo || "sem-codigo",
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 100,
        motivoRisco: "IP bloqueado tentando validar certificado",
      });

      return NextResponse.json(
        { error: "Acesso temporariamente bloqueado para este IP." },
        { status: 403 }
      );
    }

    if (!codigo) {
      await registrarAuditoria({
        codigoConsultado: "sem-codigo",
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 40,
        motivoRisco: "Tentativa sem código",
      });

      return NextResponse.json(
        { error: "Código do certificado não informado." },
        { status: 400 }
      );
    }

    if (!validarCodigoEstrutura(codigo)) {
      await registrarAuditoria({
        codigoConsultado: codigo,
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 65,
        motivoRisco: "Estrutura do código inválida",
      });

      await bloquearIpSeNecessario(ip, 65, "Múltiplas tentativas com código inválido");

      return NextResponse.json(
        { valido: false, error: "Código de certificado inválido." },
        { status: 400 }
      );
    }

    const tentativasRecentes = await contarTentativasRecentes(ip, 15);

    if (tentativasRecentes >= 30) {
      await registrarAuditoria({
        codigoConsultado: codigo,
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 90,
        motivoRisco: "Excesso de tentativas de validação em curto período",
      });

      await bloquearIpSeNecessario(
        ip,
        90,
        "Excesso de tentativas de validação de certificado"
      );

      return NextResponse.json(
        { error: "Muitas tentativas. IP bloqueado temporariamente." },
        { status: 429 }
      );
    }

    const certificado = await prisma.certificado.findUnique({
      where: { codigo },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
          },
        },
        disciplina: {
          select: {
            id: true,
            nome: true,
          },
        },
        instituicao: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!certificado) {
      await registrarAuditoria({
        codigoConsultado: codigo,
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 75,
        motivoRisco: "Código inexistente no banco",
      });

      await bloquearIpSeNecessario(ip, 75, "Tentativas repetidas com código inexistente");

      return NextResponse.json(
        { valido: false, error: "Certificado não encontrado." },
        { status: 404 }
      );
    }

    const codigoEsperado = gerarCodigoCertificado({
      id: certificado.id,
      alunoId: certificado.alunoId,
      disciplinaId: certificado.disciplinaId,
      instituicaoId: certificado.instituicaoId,
      emitidoEm: certificado.emitidoEm,
    });

    if (codigoEsperado !== certificado.codigo) {
      await registrarAuditoria({
        codigoConsultado: codigo,
        documentoId: null,
        instituicaoId: certificado.instituicaoId,
        valido: false,
        ip,
        userAgent,
        suspeito: true,
        risco: 100,
        motivoRisco: "Assinatura criptográfica divergente",
      });

      await bloquearIpSeNecessario(ip, 100, "Possível fraude em certificado");

      return NextResponse.json(
        { valido: false, error: "Assinatura do certificado inválida." },
        { status: 409 }
      );
    }

    await registrarAuditoria({
      codigoConsultado: codigo,
      documentoId: null,
      instituicaoId: certificado.instituicaoId,
      valido: true,
      ip,
      userAgent,
      suspeito: false,
      risco: 0,
      motivoRisco: null,
    });

    return NextResponse.json({
      valido: true,
      certificado: {
        id: certificado.id,
        codigo: certificado.codigo,
        emitidoEm: certificado.emitidoEm,
        aluno: certificado.aluno,
        disciplina: certificado.disciplina,
        instituicao: certificado.instituicao,
      },
    });
  } catch (error: any) {
    await registrarAuditoria({
      codigoConsultado: "erro-interno",
      valido: false,
      ip,
      userAgent,
      suspeito: true,
      risco: 50,
      motivoRisco: `Erro interno na validação: ${error?.message || String(error)}`,
    }).catch(() => null);

    return NextResponse.json(
      {
        error: "Erro ao validar certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}