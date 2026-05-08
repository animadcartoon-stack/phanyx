import nodemailer from "nodemailer";

type EnviarEmailAcessoParams = {
  email: string;
  nome: string;
  senha: string;
  instituicao: string;
};

type EnviarEmailAcessoExistenteParams = {
  email: string;
  nome: string;
  instituicao: string;
};

export async function enviarEmailAcessoExistente({
  email,
  nome,
  instituicao,
}: EnviarEmailAcessoExistenteParams) {
  const transporter = criarTransporter();

  const loginUrl = getLoginUrl();
  const logoUrl = getLogoUrl();
  const imagemFormixUrl = getImagemFormixUrl();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "✅ Seu acesso ao PHANYX já está disponível",
    html: `
      <div style="margin:0;padding:0;background:#0b1120;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1120;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;">
                
                <tr>
                  <td style="padding:20px 28px;background:#ffffff;">
                    <img
                      src="${logoUrl}"
                      alt="PHANYX"
                      style="height:34px;display:block;"
                    />
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 32px 24px 32px;background:linear-gradient(135deg,#2563eb 0%,#0f172a 100%);text-align:center;">
                    <img
                      src="${imagemFormixUrl}"
                      alt="Formix"
                      style="height:120px;max-width:120px;display:block;margin:0 auto 16px auto;"
                    />

                    <div style="font-size:12px;letter-spacing:1.5px;color:#bfdbfe;font-weight:bold;text-transform:uppercase;">
                      PHANYX
                    </div>

                    <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:30px;line-height:1.2;">
                      Seu acesso já está disponível
                    </h1>

                    <p style="margin:12px 0 0 0;color:#dbeafe;font-size:16px;line-height:1.7;">
                      A instituição <strong>${instituicao}</strong> foi ativada e sua conta já existia no sistema.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;color:#e2e8f0;font-size:16px;line-height:1.7;">
                      Olá, <strong>${nome}</strong>.
                    </p>

                    <p style="margin:0 0 24px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">
                      Identificamos que seu usuário administrativo já existia no PHANYX. Por isso, não geramos uma nova senha temporária.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                      <tr>
                        <td style="background:#111827;border:1px solid #334155;border-radius:16px;padding:18px 20px;">
                          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Login
                          </div>
                          <div style="font-size:16px;color:#ffffff;font-weight:bold;word-break:break-word;">
                            ${email}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:28px 0;">
                      <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:14px;font-size:15px;">
                        Acessar painel administrativo
                      </a>
                    </div>

                    <div style="background:#082f49;border:1px solid #0c4a6e;border-radius:16px;padding:18px 20px;margin-top:12px;">
                      <div style="color:#bae6fd;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                        Importante
                      </div>
                      <p style="margin:0;color:#e0f2fe;font-size:14px;line-height:1.7;">
                        Caso não lembre sua senha, use a opção de recuperação de acesso na tela de login ou entre em contato com o suporte.
                      </p>
                    </div>

                    <p style="margin:28px 0 0 0;color:#94a3b8;font-size:13px;line-height:1.7;">
                      Este é um email automático de confirmação de acesso já existente.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px;background:#0b1220;border-top:1px solid #1e293b;">
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
                      PHANYX · Plataforma acadêmica SaaS<br/>
                      Confirmação de acesso administrativo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

type EnviarEmailCobrancaParams = {
  email: string;
  nome: string;
  instituicao: string;
  valor: number | string;
  vencimento?: string | null;
  descricao?: string | null;
  linkCobranca?: string | null;
};

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3001";
}

function getLogoUrl() {
  return `${getBaseUrl()}/icon.png`;
}

function getImagemFormixUrl() {
  return `${getBaseUrl()}/images/formix-bemvindo.png`;
}

function getLoginUrl() {
  return `${getBaseUrl()}/login?portal=admin`;
}

function formatarValorBRL(valor: number | string) {
  const numero = Number(valor);
  if (Number.isNaN(numero)) return String(valor);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataBR(data?: string | null) {
  if (!data) return "-";

  try {
    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function validarConfigEmail() {
  const obrigatorias = [
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_USER",
    "EMAIL_PASS",
    "EMAIL_FROM",
  ];

  const faltando = obrigatorias.filter(
    (chave) => !process.env[chave] || !String(process.env[chave]).trim()
  );

  if (faltando.length > 0) {
    throw new Error(
      `Configuração de email incompleta. Variáveis ausentes: ${faltando.join(", ")}`
    );
  }
}

function criarTransporter() {
  validarConfigEmail();

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

export async function enviarEmailCobranca({
  email,
  nome,
  instituicao,
  valor,
  vencimento,
  descricao,
  linkCobranca,
}: EnviarEmailCobrancaParams) {
  const transporter = criarTransporter();

  const logoUrl = getLogoUrl();
  const imagemFormixUrl = getImagemFormixUrl();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Cobrança PHANYX gerada com sucesso",
    html: `
      <div style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #dbe3ef;">
                
                <tr>
                  <td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
                    <img
                      src="${logoUrl}"
                      alt="PHANYX"
                      style="height:34px;display:block;"
                    />
                  </td>
                </tr>

                <tr>
                  <td style="background:#f59e0b;padding:14px 24px;text-align:center;">
                    <p style="margin:0;font-size:14px;color:#ffffff;font-weight:bold;">
                      Cobrança gerada com sucesso
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:28px;background:#1d4ed8;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="vertical-align:middle;">
                          <div style="color:#dbeafe;font-size:12px;text-transform:uppercase;letter-spacing:1.6px;font-weight:bold;">
                            Plataforma acadêmica SaaS
                          </div>
                          <h1 style="margin:8px 0 0 0;font-size:34px;line-height:1.2;color:#ffffff;">
                            Cobrança PHANYX
                          </h1>
                          <p style="margin:10px 0 0 0;color:#dbeafe;font-size:15px;line-height:1.6;">
                            Sua adesão para a instituição <strong>${instituicao}</strong> foi iniciada.
                          </p>
                        </td>
                        <td align="right" style="vertical-align:middle;">
                          <img
                            src="${imagemFormixUrl}"
                            alt="Formix"
                            style="height:110px;max-width:110px;display:block;"
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px 32px 18px 32px;">
                    <h2 style="margin:0 0 16px 0;font-size:18px;color:#111827;">
                      Olá, ${nome}
                    </h2>

                    <p style="margin:0 0 22px 0;font-size:15px;line-height:1.7;color:#374151;">
                      Sua cobrança da PHANYX foi gerada. Abaixo estão os dados principais para você concluir a contratação da plataforma.
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                      <tr>
                        <td style="background:#f8fafc;border:1px solid #dbe3ef;border-radius:14px;padding:16px 18px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Instituição
                          </div>
                          <div style="font-size:16px;color:#111827;font-weight:bold;">
                            ${instituicao}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="background:#f8fafc;border:1px solid #dbe3ef;border-radius:14px;padding:16px 18px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Valor
                          </div>
                          <div style="font-size:18px;color:#111827;font-weight:bold;">
                            ${formatarValorBRL(valor)}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="background:#f8fafc;border:1px solid #dbe3ef;border-radius:14px;padding:16px 18px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Vencimento
                          </div>
                          <div style="font-size:16px;color:#111827;font-weight:bold;">
                            ${formatarDataBR(vencimento)}
                          </div>
                        </td>
                      </tr>

                      <tr>
                        <td style="background:#f8fafc;border:1px solid #dbe3ef;border-radius:14px;padding:16px 18px;">
                          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Descrição
                          </div>
                          <div style="font-size:15px;color:#111827;font-weight:bold;">
                            ${descricao || "Adesão PHANYX"}
                          </div>
                        </td>
                      </tr>
                    </table>

                    ${
                      linkCobranca
                        ? `
                    <div style="text-align:center;margin:28px 0 10px 0;">
                      <a
                        href="${linkCobranca}"
                        style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:12px;font-size:15px;"
                      >
                        Visualizar cobrança
                      </a>
                    </div>

                    <p style="margin:12px 0 0 0;font-size:13px;color:#6b7280;line-height:1.7;text-align:center;">
                      Se o botão não abrir, copie e cole este link no navegador:<br />
                      <span style="color:#2563eb;word-break:break-all;">${linkCobranca}</span>
                    </p>
                    `
                        : ""
                    }

                    <div style="margin-top:28px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 18px;">
                      <div style="font-size:12px;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:bold;">
                        Próximo passo
                      </div>
                      <p style="margin:0;font-size:14px;line-height:1.7;color:#1e3a8a;">
                        Após a confirmação do pagamento, sua instituição será ativada automaticamente e você receberá um novo email com login e senha de acesso.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.7;text-align:center;">
                      PHANYX • Plataforma acadêmica SaaS<br/>
                      Este é um email automático de cobrança.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}

export async function enviarEmailAcesso({
  email,
  nome,
  senha,
  instituicao,
}: EnviarEmailAcessoParams) {
  const transporter = criarTransporter();

  const loginUrl = getLoginUrl();
  const logoUrl = getLogoUrl();
  const imagemFormixUrl = getImagemFormixUrl();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "🚀 Seu acesso ao PHANYX foi liberado",
    html: `
      <div style="margin:0;padding:0;background:#0b1120;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1120;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;">
                
                <tr>
                  <td style="padding:20px 28px;background:#ffffff;">
                    <img
                      src="${logoUrl}"
                      alt="PHANYX"
                      style="height:34px;display:block;"
                    />
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 32px 24px 32px;background:linear-gradient(135deg,#2563eb 0%,#0f172a 100%);text-align:center;">
                    <img
                      src="${imagemFormixUrl}"
                      alt="Formix dando boas-vindas"
                      style="height:130px;max-width:130px;display:block;margin:0 auto 16px auto;"
                    />

                    <div style="font-size:12px;letter-spacing:1.5px;color:#bfdbfe;font-weight:bold;text-transform:uppercase;">
                      PHANYX
                    </div>

                    <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:32px;line-height:1.2;">
                      Bem-vindo ao PHANYX
                    </h1>

                    <p style="margin:12px 0 0 0;color:#dbeafe;font-size:16px;line-height:1.7;">
                      A instituição <strong>${instituicao}</strong> foi ativada com sucesso na plataforma.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;color:#e2e8f0;font-size:16px;line-height:1.7;">
                      Olá, <strong>${nome}</strong>.
                    </p>

                    <p style="margin:0 0 24px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">
                      Seu ambiente administrativo já está pronto. Abaixo estão os dados de acesso inicial da sua conta:
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                      <tr>
                        <td style="background:#111827;border:1px solid #334155;border-radius:16px;padding:18px 20px;">
                          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Login
                          </div>
                          <div style="font-size:16px;color:#ffffff;font-weight:bold;word-break:break-word;">
                            ${email}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#111827;border:1px solid #334155;border-radius:16px;padding:18px 20px;">
                          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Senha temporária
                          </div>
                          <div style="font-size:18px;color:#ffffff;font-weight:bold;letter-spacing:1px;">
                            ${senha}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:28px 0;">
                      <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:14px;font-size:15px;">
                        Acessar painel administrativo
                      </a>
                    </div>

                    <div style="background:#082f49;border:1px solid #0c4a6e;border-radius:16px;padding:18px 20px;margin-top:12px;">
                      <div style="color:#bae6fd;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                        Importante
                      </div>
                      <p style="margin:0;color:#e0f2fe;font-size:14px;line-height:1.7;">
                        Por segurança, recomendamos alterar sua senha no primeiro acesso e manter esses dados em local seguro.
                      </p>
                    </div>

                    <p style="margin:28px 0 0 0;color:#94a3b8;font-size:13px;line-height:1.7;">
                      Se você não solicitou este cadastro, responda este email para nosso suporte.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px;background:#0b1220;border-top:1px solid #1e293b;">
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
                      PHANYX · Plataforma acadêmica SaaS<br/>
                      Este é um email automático de liberação de acesso.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
type PortalAcesso = "admin" | "professor" | "aluno";

type EnviarEmailPrimeiroAcessoParams = {
  email: string;
  nome: string;
  senha: string;
  instituicao: string;
  portal: PortalAcesso;
};

function getLoginUrlPorPortal(portal: PortalAcesso) {
  return `${getBaseUrl()}/login?portal=${portal}`;
}

function getTituloPortal(portal: PortalAcesso) {
  if (portal === "professor") return "painel do professor";
  if (portal === "aluno") return "painel do aluno";
  return "painel administrativo";
}

export async function enviarEmailPrimeiroAcesso({
  email,
  nome,
  senha,
  instituicao,
  portal,
}: EnviarEmailPrimeiroAcessoParams) {
  const transporter = criarTransporter();

  const loginUrl = getLoginUrlPorPortal(portal);
  const logoUrl = getLogoUrl();
  const imagemFormixUrl = getImagemFormixUrl();
  const tituloPortal = getTituloPortal(portal);

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "🚀 Seu acesso ao PHANYX foi liberado",
    html: `
      <div style="margin:0;padding:0;background:#0b1120;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1120;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#0f172a;border:1px solid #1e293b;border-radius:24px;overflow:hidden;">
                
                <tr>
                  <td style="padding:20px 28px;background:#ffffff;">
                    <img
                      src="${logoUrl}"
                      alt="PHANYX"
                      style="height:34px;display:block;"
                    />
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 32px 24px 32px;background:linear-gradient(135deg,#2563eb 0%,#0f172a 100%);text-align:center;">
                    <img
                      src="${imagemFormixUrl}"
                      alt="Formix dando boas-vindas"
                      style="height:130px;max-width:130px;display:block;margin:0 auto 16px auto;"
                    />

                    <div style="font-size:12px;letter-spacing:1.5px;color:#bfdbfe;font-weight:bold;text-transform:uppercase;">
                      PHANYX
                    </div>

                    <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:32px;line-height:1.2;">
                      Bem-vindo ao PHANYX
                    </h1>

                    <p style="margin:12px 0 0 0;color:#dbeafe;font-size:16px;line-height:1.7;">
                      Seu acesso à instituição <strong>${instituicao}</strong> foi liberado com sucesso.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;color:#e2e8f0;font-size:16px;line-height:1.7;">
                      Olá, <strong>${nome}</strong>.
                    </p>

                    <p style="margin:0 0 24px 0;color:#cbd5e1;font-size:15px;line-height:1.7;">
                      Abaixo estão os dados do seu primeiro acesso ao <strong>${tituloPortal}</strong>:
                    </p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 12px;">
                      <tr>
                        <td style="background:#111827;border:1px solid #334155;border-radius:16px;padding:18px 20px;">
                          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Login
                          </div>
                          <div style="font-size:16px;color:#ffffff;font-weight:bold;word-break:break-word;">
                            ${email}
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="background:#111827;border:1px solid #334155;border-radius:16px;padding:18px 20px;">
                          <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">
                            Senha temporária
                          </div>
                          <div style="font-size:18px;color:#ffffff;font-weight:bold;letter-spacing:1px;">
                            ${senha}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:28px 0;">
                      <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 22px;border-radius:14px;font-size:15px;">
                        Acessar agora
                      </a>
                    </div>

                    <div style="background:#082f49;border:1px solid #0c4a6e;border-radius:16px;padding:18px 20px;margin-top:12px;">
                      <div style="color:#bae6fd;font-size:13px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
                        Importante
                      </div>
                      <p style="margin:0;color:#e0f2fe;font-size:14px;line-height:1.7;">
                        No primeiro acesso, você deverá trocar sua senha por segurança.
                      </p>
                    </div>

                    <p style="margin:28px 0 0 0;color:#94a3b8;font-size:13px;line-height:1.7;">
                      Este é um email automático de liberação de acesso.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px;background:#0b1220;border-top:1px solid #1e293b;">
                    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
                      PHANYX · Plataforma acadêmica SaaS
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}
export { criarTransporter };

type EnviarEmailAssinaturaContratoParams = {
  email: string;
  nome: string;
  instituicao: string;
  titulo?: string;
  linkAssinatura: string;
};

export async function enviarEmailAssinaturaContrato({
  email,
  nome,
  instituicao,
  titulo,
  linkAssinatura,
}: EnviarEmailAssinaturaContratoParams) {
  const transporter = criarTransporter();

  const logoUrl = getLogoUrl();
  const imagemFormixUrl = getImagemFormixUrl();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Assinatura de documento - PHANYX",
    html: `
      <div style="margin:0;padding:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
        <table width="100%" cellspacing="0" cellpadding="0" style="background:#eef2f7;padding:32px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #dbe3ef;">
                <tr>
                  <td style="padding:20px 28px;background:#ffffff;border-bottom:1px solid #e5e7eb;">
                    <img src="${logoUrl}" alt="PHANYX" style="height:34px;display:block;" />
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;background:linear-gradient(135deg,#0f172a,#2563eb);text-align:center;">
                    <img src="${imagemFormixUrl}" alt="PHANYX" style="height:120px;max-width:120px;display:block;margin:0 auto 16px auto;" />
                    <div style="font-size:12px;letter-spacing:1.5px;color:#bfdbfe;font-weight:bold;text-transform:uppercase;">
                      Assinatura digital
                    </div>
                    <h1 style="margin:12px 0 0 0;color:#ffffff;font-size:30px;line-height:1.2;">
                      Documento aguardando sua assinatura
                    </h1>
                    <p style="margin:12px 0 0 0;color:#dbeafe;font-size:15px;line-height:1.7;">
                      A instituição <strong>${instituicao}</strong> enviou um documento para assinatura.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:32px;">
                    <p style="margin:0 0 16px 0;color:#111827;font-size:16px;line-height:1.7;">
                      Olá, <strong>${nome}</strong>.
                    </p>

                    <p style="margin:0 0 22px 0;color:#374151;font-size:15px;line-height:1.7;">
                      Você recebeu um documento ${titulo ? `<strong>${titulo}</strong>` : ""} para ler e assinar eletronicamente pela plataforma PHANYX.
                    </p>

                    <div style="text-align:center;margin:30px 0;">
                      <a href="${linkAssinatura}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:bold;padding:15px 26px;border-radius:14px;font-size:15px;">
                        Abrir documento para assinatura
                      </a>
                    </div>

                    <p style="margin:18px 0 0 0;color:#64748b;font-size:13px;line-height:1.7;text-align:center;">
                      Se o botão não abrir, copie e cole este link no navegador:<br/>
                      <span style="color:#2563eb;word-break:break-all;">${linkAssinatura}</span>
                    </p>

                    <div style="margin-top:28px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:16px 18px;">
                      <p style="margin:0;color:#1e3a8a;font-size:14px;line-height:1.7;">
                        Ao assinar, o sistema registrará data, hora, IP e identificação do navegador para segurança e validação do documento.
                      </p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e5e7eb;">
                    <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.7;text-align:center;">
                      PHANYX • Plataforma acadêmica SaaS<br/>
                      Este é um email automático de assinatura de documento.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });
}