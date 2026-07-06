import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { enviarEmailAcesso } from "@/lib/email";
import {
  criarClienteAsaas,
  criarCobrancaAsaas,
  obterQrCodePixAsaas,
  criarCheckoutAssinaturaAsaas,
  criarAssinaturaAsaas,
} from "@/lib/asaas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getRemoteIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

function getValorPlano(plano: string) {
  const planoNormalizado = String(plano).trim().toUpperCase();

  if (planoNormalizado === "TESTE") return 5;
  if (planoNormalizado === "ESSENCIAL") return 49;
  if (planoNormalizado === "PROFISSIONAL") return 99;
  if (planoNormalizado === "ENTERPRISE") return 199;

  return 99;
}

function getPoliticaPlano(plano: string) {
  const planoNormalizado = String(plano).trim().toUpperCase();

  if (planoNormalizado === "ESSENCIAL") {
    return {
      valorBase: 49,
      valorPorAluno: 3,
      valorPorPoloExtra: 49,
      polosInclusos: 1,
    };
  }

  if (planoNormalizado === "ENTERPRISE") {
    return {
      valorBase: 199,
      valorPorAluno: 7,
      valorPorPoloExtra: 99,
      polosInclusos: 10,
    };
  }

  return {
    valorBase: 99,
    valorPorAluno: 5,
    valorPorPoloExtra: 79,
    polosInclusos: 3,
  };
}

function normalizarEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

function normalizarTelefone(telefone: string) {
  const digits = String(telefone || "").replace(/\D/g, "");
  return digits || null;
}

function normalizarCpfCnpj(valor: string) {
  return String(valor || "").replace(/\D/g, "");
}

function formatarDataISO(data?: string | null) {
  if (!data) return null;

  try {
    return new Date(data).toISOString().split("T")[0];
  } catch {
    return null;
  }
}

function gerarSlugInstituicao(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60);
}

function gerarSenhaTemporaria() {
  const sufixo = Math.floor(1000 + Math.random() * 9000);
  return `Phanyx@${sufixo}`;
}

function normalizarTrialMeses(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isFinite(numero) || numero <= 0) {
    return 0;
  }

  if (numero > 12) {
    return 12;
  }

  return Math.floor(numero);
}

function dataDaquiMesesEmISO(meses: number) {
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  return data.toISOString().split("T")[0];
}

function dataDaquiMeses(meses: number) {
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  return data;
}

function normalizarFormaPagamento(
  valor: string
): "PIX" | "BOLETO" | "CREDIT_CARD" {
  const forma = String(valor || "CREDIT_CARD").trim().toUpperCase();

  if (forma === "BOLETO") return "BOLETO";
  if (forma === "PIX") return "PIX";

  // Compatibilidade com o fluxo antigo.
  if (forma === "RECORRENTE") return "CREDIT_CARD";

  return "CREDIT_CARD";
}
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nomeResponsavel = String(body?.nomeResponsavel || "").trim();
    const nomeInstituicao = String(body?.nomeInstituicao || "").trim();
    const email = normalizarEmail(body?.email || "");
    const telefone = normalizarTelefone(body?.telefone || "");
    const cpfCnpj = normalizarCpfCnpj(body?.cpfCnpj || "");
    const plano = String(body?.plano || "").trim().toUpperCase();
    const formaPagamento = normalizarFormaPagamento(
      body?.formaPagamento || "PIX"
    );
    const cartao = body?.cartao || null;
    const trialMeses = normalizarTrialMeses(body?.trialMeses || body?.trial);

    if (!nomeResponsavel) {
      return NextResponse.json(
        { error: "Nome do responsável é obrigatório." },
        { status: 400 }
      );
    }

    if (!nomeInstituicao) {
      return NextResponse.json(
        { error: "Nome da instituição é obrigatório." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 }
      );
    }

    if (!cpfCnpj) {
      return NextResponse.json(
        { error: "CPF/CNPJ é obrigatório." },
        { status: 400 }
      );
    }

    if (!plano) {
      return NextResponse.json(
        { error: "Plano é obrigatório." },
        { status: 400 }
      );
    }

    const valor = getValorPlano(plano);

    const emailExistente = await prisma.user.findUnique({
  where: { email },
});

if (emailExistente) {
  return NextResponse.json(
    {
      error:
        "Já existe um usuário com este email. Use outro email para criar a instituição.",
    },
    { status: 400 }
  );
}

    const adesaoPendenteExistente = await prisma.adesaoInstituicao.findFirst({
      where: {
        email,
        nomeInstituicao,
        plano,
        status: {
          in: ["PENDING", "PENDENTE", "AGUARDANDO_PAGAMENTO", "PROCESSANDO"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (adesaoPendenteExistente) {
      await prisma.adesaoInstituicao.update({
        where: { id: adesaoPendenteExistente.id },
        data: { status: "CANCELADO" },
      });
    }

    const cliente = await criarClienteAsaas({
  name: nomeResponsavel,
  email,
  cpfCnpj,
  phone: telefone || undefined,
  postalCode: "88701-000",
  address: "Rua Lauro Müller",
  addressNumber: "123",
  province: "Centro",
  city: "Tubarão",
  notificationDisabled: trialMeses > 0,
});

    if (!cliente?.id) {
      throw new Error("Asaas não retornou o ID do cliente.");
    }

    const adesao = await prisma.adesaoInstituicao.create({
  data: {
    nomeResponsavel,
    nomeInstituicao,
    email,
    telefone,
    cpfCnpj,
    plano,
    valor,
    status: trialMeses > 0 ? "PROCESSANDO_TESTE" : "PENDENTE",
    pixCode: "",
    asaasId: null,
  },
});

if (trialMeses > 0) {
  try {
    const politicaPlano = getPoliticaPlano(plano);
    const testeGratisInicioEm = new Date();
    const testeGratisFimEm = dataDaquiMeses(trialMeses);
    const primeiraCobrancaEm = dataDaquiMesesEmISO(trialMeses);

    if (formaPagamento === "CREDIT_CARD") {
  const checkout = await criarCheckoutAssinaturaAsaas({
    value: valor,
    plano,
    email,
    nomeResponsavel,
    cpfCnpj,
    telefone: telefone || "48999999999",
    postalCode: "88701-000",
    address: "Rua Lauro Müller",
    addressNumber: "123",
    province: "Centro",
    city: "Tubarão",
    externalReference: String(adesao.id),
    nextDueDate: primeiraCobrancaEm,
  });

  await prisma.adesaoInstituicao.update({
    where: { id: adesao.id },
    data: {
      status: "AGUARDANDO_CHECKOUT",
      asaasId: checkout.id,
    },
  });

  return NextResponse.json({
    ok: true,
    trial: true,
    checkout: true,
    trialMeses,
    primeiraCobrancaEm,
    adesao: {
      id: adesao.id,
      status: "AGUARDANDO_CHECKOUT",
    },
    checkoutUrl: checkout.url,
  });
}

const assinatura = await criarAssinaturaAsaas({
  customer: cliente.id,
  billingType: formaPagamento,
  value: valor,
  nextDueDate: primeiraCobrancaEm,
  cycle: "MONTHLY",
  description: `Assinatura PHANYX - Plano ${plano} - ${trialMeses} meses grátis`,
  externalReference: String(adesao.id),
});

    const slugBase = gerarSlugInstituicao(nomeInstituicao);
    const slugFinal = `${slugBase}-${Date.now()}`;

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const instituicao = await prisma.instituicao.create({
  data: {
    nome: nomeInstituicao,
    slug: slugFinal,
    plano,
    statusAssinatura: "TESTE_GRATIS",
    isentaPagamento: false,
    updatedAt: new Date(),
  },
});

    const admin = await prisma.user.create({
      data: {
        nome: nomeResponsavel,
        email,
        senha: senhaHash,
        role: "ADMIN",
        precisaTrocarSenha: true,
        instituicao: {
          connect: { id: instituicao.id },
        },
      },
    });

    const adesaoAtualizada = await prisma.adesaoInstituicao.update({
      where: { id: adesao.id },
      data: {
        status: "TESTE_GRATIS",
        asaasId: assinatura.id,
        instituicaoId: instituicao.id,
      },
    });

    const assinaturaPhanyx = await prisma.assinaturaPhanyx.create({
  data: {
    instituicaoId: instituicao.id,
    adesaoInstituicaoId: adesao.id,

    plano,
    status: "TESTE_GRATIS",

    testeGratisInicioEm,
    testeGratisFimEm,
    primeiraCobrancaEm: testeGratisFimEm,
    proximaCobrancaEm: testeGratisFimEm,

    asaasCustomerId: cliente.id,
    asaasSubscriptionId: assinatura.id,
    asaasBillingType: assinatura.billingType || formaPagamento,
    asaasCycle: assinatura.cycle || "MONTHLY",

    valorBase: politicaPlano.valorBase,
    valorPorAluno: politicaPlano.valorPorAluno,
    valorPorPoloExtra: politicaPlano.valorPorPoloExtra,
    valorMensalAtual: valor,

    alunosAtivosReferencia: 0,
    polosReferencia: 1,
  },
});

    try {
  console.log("📧 ENVIANDO EMAIL DE ACESSO TRIAL:", {
    email: admin.email,
    nome: admin.nome,
    instituicao: instituicao.nome,
  });

  const resultadoEmail = await enviarEmailAcesso({
    email: admin.email,
    nome: admin.nome,
    senha: senhaTemporaria,
    instituicao: instituicao.nome,
  });

  console.log("✅ RESULTADO EMAIL ACESSO TRIAL:", resultadoEmail);
} catch (emailError) {
  console.error("❌ ERRO AO ENVIAR EMAIL DE ACESSO TRIAL:", emailError);
}

    return NextResponse.json({
      ok: true,
      trial: true,
      trialMeses,
      primeiraCobrancaEm,
      adesao: {
        id: adesaoAtualizada.id,
        status: adesaoAtualizada.status,
        instituicaoId: instituicao.id,
      },
      assinatura: {
  id: assinatura.id,
  nextDueDate: assinatura.nextDueDate,
  cycle: assinatura.cycle,
  billingType: assinatura.billingType,
},
assinaturaPhanyx: {
  id: assinaturaPhanyx.id,
  status: assinaturaPhanyx.status,
  testeGratisInicioEm: assinaturaPhanyx.testeGratisInicioEm,
  testeGratisFimEm: assinaturaPhanyx.testeGratisFimEm,
  primeiraCobrancaEm: assinaturaPhanyx.primeiraCobrancaEm,
  asaasSubscriptionId: assinaturaPhanyx.asaasSubscriptionId,
},
      instituicao: {
        id: instituicao.id,
        nome: instituicao.nome,
        plano: instituicao.plano,
        statusAssinatura: instituicao.statusAssinatura,
      },
      admin: {
        id: admin.id,
        nome: admin.nome,
        email: admin.email,
      },
      acesso: {
        login: admin.email,
        senhaTemporaria,
        portal: "/login?portal=admin",
      },
    });
  } catch (err: any) {
    console.error("🔥 ERRO AO CRIAR TESTE GRÁTIS PHANYX:", err);

    await prisma.adesaoInstituicao.update({
      where: { id: adesao.id },
      data: {
        status: "ERRO",
      },
    });

    return NextResponse.json(
      {
        error:
          err?.message ||
          "Erro ao iniciar teste grátis e assinatura futura no Asaas.",
      },
      { status: 500 }
    );
  }
}

    try {
      const dueDate = new Date().toISOString().split("T")[0];

      let asaasId: string | null = null;
      let pixCode = "";
      let linkCobranca: string | null = null;
      let vencimentoFormatado = formatarDataISO(dueDate);

      const cobranca = await criarCobrancaAsaas({
        customer: cliente.id,
        billingType: formaPagamento,
        value: valor,
        dueDate,
        description: `Adesão PHANYX - ${plano}`,
        externalReference: String(adesao.id),
      });

      if (!cobranca?.id) {
        throw new Error("Asaas não retornou o ID da cobrança.");
      }

      asaasId = String(cobranca.id);

      if (formaPagamento === "PIX") {
        const qr = await obterQrCodePixAsaas(asaasId);
        pixCode =
  qr?.payload ||
  qr?.encodedImage ||
  "";
      }


      if (formaPagamento === "BOLETO" || formaPagamento === "CREDIT_CARD") {
  linkCobranca =
    cobranca?.invoiceUrl ||
    cobranca?.bankSlipUrl ||
    null;
}

      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          asaasId,
          pixCode: pixCode || "",
          status: "PENDENTE",
        },
      });

      return NextResponse.json({
        ok: true,
        adesao: {
          id: adesao.id,
          status: "PENDENTE",
          pixCode: pixCode || "",
          asaasId,
          vencimento: vencimentoFormatado,
        },
        pixCode: pixCode || "",
        invoiceUrl: linkCobranca,
      });
    } catch (err: any) {
      console.error("🔥 ERRO REAL ASAAS:", err);

      await prisma.adesaoInstituicao.update({
        where: { id: adesao.id },
        data: {
          status: "ERRO",
        },
      });

      return NextResponse.json(
        {
          error: err?.message || "Erro ao gerar cobrança no Asaas",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("ERRO CRIAR ADESAO:", error);

    return NextResponse.json(
      {
        error: "Erro ao criar adesão",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}