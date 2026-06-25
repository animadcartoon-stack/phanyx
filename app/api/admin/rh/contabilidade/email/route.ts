import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TokenPayload = {
  id: number;
  role: string;
  email: string;
  instituicaoId: number;
};

const NOMES_RELATORIO: Record<string, string> = {
  contabil: "Relatório Contábil da Competência",
  folha: "Folha / Holerites",
  encargos: "Encargos e Provisões",
  rescisao: "Rescisões",
  ferias: "Férias",
  beneficios: "Benefícios",
  ocorrencias: "Ocorrências Funcionais",
  exames: "Exames Médicos / ASO",
  historico: "Histórico Funcional",
  arquivados: "Arquivados / Auditoria",
  geral: "Relatório Geral RH",
};

async function obterUsuarioLogado() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET!
  ) as TokenPayload;

  const role = String(decoded.role || "").toUpperCase();

  const podeAcessar = [
    "ADMIN",
    "FUNCIONARIO",
    "SECRETARIA",
    "FINANCEIRO",
    "COORDENADOR",
    "SUPORTE",
    "GERENCIA",
  ].includes(role);

  if (!podeAcessar || !decoded.instituicaoId) return null;

  return decoded;
}

function validarEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function limparTexto(texto: any) {
  return String(texto || "")
    .replace(/</g, "")
    .replace(/>/g, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const usuario = await obterUsuarioLogado();

    if (!usuario) {
      return NextResponse.json(
        { error: "Não autorizado." },
        { status: 401 }
      );
    }

    const body = await req.json();

    const mes = String(body?.mes || "").padStart(2, "0");
    const ano = String(body?.ano || "");
    const tipo = String(body?.tipo || "contabil");
    const emailDestino = limparTexto(body?.emailDestino);
    const assunto =
      limparTexto(body?.assunto) ||
      `${NOMES_RELATORIO[tipo] || "Relatório RH"} - ${mes}/${ano}`;

    const mensagem =
      limparTexto(body?.mensagem) ||
      "Segue em anexo o relatório RH da competência selecionada para conferência.";

    if (!validarEmail(emailDestino)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para envio." },
        { status: 400 }
      );
    }

    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_PORT ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      return NextResponse.json(
        {
          error:
            "Configuração SMTP incompleta. Verifique SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS.",
        },
        { status: 500 }
      );
    }

    const baseUrl = new URL(req.url).origin;
    const cookieHeader = req.headers.get("cookie") || "";

    const query = `mes=${encodeURIComponent(mes)}&ano=${encodeURIComponent(
      ano
    )}&tipo=${encodeURIComponent(tipo)}`;

    const [pdfRes, excelRes] = await Promise.all([
      fetch(`${baseUrl}/api/admin/rh/contabilidade/pdf?${query}`, {
        cache: "no-store",
        headers: {
          cookie: cookieHeader,
        },
      }),

      fetch(`${baseUrl}/api/admin/rh/contabilidade/excel?${query}`, {
        cache: "no-store",
        headers: {
          cookie: cookieHeader,
        },
      }),
    ]);

    if (!pdfRes.ok) {
      const erroPdf = await pdfRes.text();
      throw new Error(
        erroPdf || "Erro ao gerar PDF para envio por e-mail."
      );
    }

    if (!excelRes.ok) {
      const erroExcel = await excelRes.text();
      throw new Error(
        erroExcel || "Erro ao gerar Excel para envio por e-mail."
      );
    }

    const pdfBuffer = Buffer.from(await pdfRes.arrayBuffer());
    const excelBuffer = Buffer.from(await excelRes.arrayBuffer());

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: String(process.env.SMTP_SECURE || "true") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const nomeRelatorio = NOMES_RELATORIO[tipo] || "Relatório RH";

    await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `PHANYX <${process.env.SMTP_USER}>`,
      to: emailDestino,
      subject: assunto,
      text: `${mensagem}

Relatório: ${nomeRelatorio}
Competência: ${mes}/${ano}
Emitido por: ${usuario.email}

Anexos:
- PDF
- Excel

PHANYX`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827;">
          <h2>${nomeRelatorio}</h2>

          <p>${mensagem}</p>

          <p><strong>Competência:</strong> ${mes}/${ano}</p>
          <p><strong>Emitido por:</strong> ${usuario.email}</p>

          <p>Seguem anexos:</p>

          <ul>
            <li>Relatório em PDF</li>
            <li>Relatório em Excel</li>
          </ul>

          <hr />

          <p style="font-size: 12px; color: #6b7280;">
            Relatório gerado automaticamente pelo Sistema RH.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `relatorio-rh-${tipo}-${mes}-${ano}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
        {
          filename: `relatorio-rh-${tipo}-${mes}-${ano}.xls`,
          content: excelBuffer,
          contentType: "application/vnd.ms-excel",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      message: "Relatório enviado por e-mail com sucesso.",
    });
  } catch (error: any) {
    console.error("Erro ao enviar relatório RH por e-mail:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao enviar relatório RH por e-mail.",
      },
      { status: 500 }
    );
  }
}