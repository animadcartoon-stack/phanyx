import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function extrairIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return (
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "desconhecido"
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const codigo = (searchParams.get("codigo") || "").trim().toUpperCase();

    if (!codigo) {
      return NextResponse.json(
        { valido: false, error: "Código de validação não informado." },
        { status: 400 }
      );
    }

    const ip = extrairIp(req);
    const userAgent = req.headers.get("user-agent") || "desconhecido";
    const agora = new Date();

    // 1) Verificar bloqueio ativo
    const bloqueioAtivo = await prisma.bloqueioIP.findFirst({
      where: {
        ip,
        ativo: true,
        OR: [{ bloqueadoAte: null }, { bloqueadoAte: { gt: agora } }],
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    if (bloqueioAtivo) {
      return NextResponse.json(
        {
          valido: false,
          bloqueado: true,
          mensagem: "IP bloqueado por segurança.",
          motivo: bloqueioAtivo.motivo || "Bloqueio antifraude",
          bloqueadoAte: bloqueioAtivo.bloqueadoAte,
        },
        { status: 403 }
      );
    }

    // 2) Buscar histórico recente desse IP
    const janelaCurta = new Date(Date.now() - 10 * 60 * 1000);
    const janelaLonga = new Date(Date.now() - 60 * 60 * 1000);

    const tentativas10Min = await prisma.auditoriaValidacaoDocumento.findMany({
      where: {
        ip,
        criadoEm: {
          gte: janelaCurta,
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 100,
    });

    const tentativas1Hora = await prisma.auditoriaValidacaoDocumento.findMany({
      where: {
        ip,
        criadoEm: {
          gte: janelaLonga,
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
      take: 300,
    });

    let scoreRisco = 0;
    const motivos: string[] = [];

    const total10Min = tentativas10Min.length;
    const invalidas10Min = tentativas10Min.filter((t) => !t.valido).length;
    const repeticoesCodigo10Min = tentativas10Min.filter(
      (t) => t.codigoConsultado === codigo
    ).length;
    const suspeitas1Hora = tentativas1Hora.filter((t) => t.suspeito).length;

    if (total10Min >= 5) {
      scoreRisco += 20;
      motivos.push("Muitas tentativas em 10 minutos");
    }

    if (total10Min >= 10) {
      scoreRisco += 20;
      motivos.push("Volume muito alto de consultas");
    }

    if (invalidas10Min >= 3) {
      scoreRisco += 25;
      motivos.push("Muitas tentativas inválidas");
    }

    if (invalidas10Min >= 5) {
      scoreRisco += 20;
      motivos.push("Alta reincidência de tentativas inválidas");
    }

    if (repeticoesCodigo10Min >= 3) {
      scoreRisco += 10;
      motivos.push("Repetição do mesmo código");
    }

    if (repeticoesCodigo10Min >= 6) {
      scoreRisco += 15;
      motivos.push("Repetição excessiva do mesmo código");
    }

    if (suspeitas1Hora >= 5) {
      scoreRisco += 15;
      motivos.push("Histórico recente suspeito");
    }

    if (userAgent === "desconhecido" || userAgent.toLowerCase() === "node") {
      scoreRisco += 10;
      motivos.push("User-Agent incomum");
    }

    // 3) Bloqueio automático forte
    if (scoreRisco >= 90) {
      await prisma.bloqueioIP.create({
        data: {
          ip,
          motivo: `Auto bloqueio antifraude: ${motivos.join(" | ")}`,
          ativo: true,
          bloqueadoAte: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        },
      });

      return NextResponse.json(
        {
          valido: false,
          bloqueado: true,
          risco: scoreRisco,
          mensagem: "IP bloqueado automaticamente por comportamento suspeito.",
        },
        { status: 403 }
      );
    }

    // 4) Bloqueio temporário
    if (scoreRisco >= 70) {
      await prisma.auditoriaValidacaoDocumento.create({
        data: {
          codigoConsultado: codigo,
          valido: false,
          ip,
          userAgent,
          suspeito: true,
          risco: scoreRisco,
          motivoRisco: motivos.join(" | "),
        },
      });

      return NextResponse.json(
        {
          valido: false,
          bloqueado: true,
          risco: scoreRisco,
          mensagem: "Acesso bloqueado por comportamento suspeito.",
        },
        { status: 429 }
      );
    }

    // 5) Buscar documento
    const documento = await prisma.documentoGerado.findFirst({
      where: {
        codigoValidacao: codigo,
      },
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            nomeSocial: true,
            matricula: true,
            cpf: true,
          },
        },
        matricula: {
          select: {
            id: true,
            semestre: true,
            status: true,
            curso: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        template: {
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

    // 6) Não encontrado
    if (!documento) {
      await prisma.auditoriaValidacaoDocumento.create({
        data: {
          codigoConsultado: codigo,
          valido: false,
          ip,
          userAgent,
          suspeito: scoreRisco >= 40,
          risco: scoreRisco,
          motivoRisco: motivos.join(" | ") || "Documento não encontrado",
        },
      });

      return NextResponse.json({
        valido: false,
        codigo,
        statusValidacao: "NAO_ENCONTRADO",
        mensagem: "Documento não encontrado ou inválido.",
      });
    }

    // 7) Documento inválido/cancelado
    const statusDocumento = String(documento.status || "").toUpperCase();
    const documentoAtivo =
      !statusDocumento ||
      !["CANCELADO", "CANCELADA", "INVALIDADO", "INVALIDADA", "INATIVO"].includes(
        statusDocumento
      );

    if (!documentoAtivo) {
      await prisma.auditoriaValidacaoDocumento.create({
        data: {
          codigoConsultado: codigo,
          documentoId: documento.id,
          instituicaoId: documento.instituicaoId,
          valido: false,
          ip,
          userAgent,
          suspeito: scoreRisco >= 40,
          risco: scoreRisco,
          motivoRisco: motivos.join(" | ") || "Documento invalidado",
        },
      });

      return NextResponse.json({
        valido: false,
        codigo,
        statusValidacao: "INVALIDADO",
        mensagem: "Documento localizado, porém está cancelado ou inválido.",
        documento: {
          id: documento.id,
          titulo: documento.titulo,
          tipo: documento.tipo,
          status: documento.status,
          criadoEm: documento.criadoEm,
          instituicao: documento.instituicao,
        },
      });
    }

    // 8) Sucesso
    await prisma.auditoriaValidacaoDocumento.create({
      data: {
        codigoConsultado: codigo,
        documentoId: documento.id,
        instituicaoId: documento.instituicaoId,
        valido: true,
        ip,
        userAgent,
        suspeito: scoreRisco >= 40,
        risco: scoreRisco,
        motivoRisco: motivos.join(" | ") || null,
      },
    });

    return NextResponse.json({
      valido: true,
      codigo,
      statusValidacao: "VALIDO",
      mensagem: "Documento válido e localizado na base institucional.",
      documento: {
        id: documento.id,
        titulo: documento.titulo,
        tipo: documento.tipo,
        status: documento.status,
        criadoEm: documento.criadoEm,
        atualizadoEm: documento.atualizadoEm,
        exigeAssinatura: documento.exigeAssinatura,
        aluno: documento.aluno,
        matricula: documento.matricula,
        template: documento.template,
        instituicao: documento.instituicao,
      },
      risco: scoreRisco,
    });
  } catch (error: any) {
    console.error("Erro ao validar documento:", error);
    return NextResponse.json(
      {
        valido: false,
        error: error?.message || "Erro ao validar documento.",
      },
      { status: 500 }
    );
  }
}