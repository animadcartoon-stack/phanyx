import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import {
  criarClienteAsaas,
  criarCobrancaAsaas,
} from "@/lib/asaas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const IBE_INSTITUICAO_ID = Number(
  process.env.IBE_INSTITUICAO_ID || 1
);

const EMAIL_MASTER_PHANYX =
  "academicophanyx@gmail.com";

type UsuarioAutenticado = {
  id: number;
  nome?: string | null;
  email?: string | null;
  role?: string | null;
  instituicaoId?: number | null;
  isMasterAdmin?: boolean | null;
};

function normalizarEmail(valor: unknown) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

function somenteNumeros(valor: unknown) {
  return String(valor || "").replace(/\D/g, "");
}

function normalizarValor(valor: unknown) {
  const texto = String(valor ?? "")
    .trim()
    .replace(/\s/g, "");

  if (!texto) {
    return 0;
  }

  /*
   * Aceita:
   * 350
   * 350.00
   * 350,00
   * 1.350,00
   */
  if (
    texto.includes(".") &&
    texto.includes(",")
  ) {
    return Number(
      texto
        .replace(/\./g, "")
        .replace(",", ".")
    );
  }

  return Number(texto.replace(",", "."));
}

function dataIsoValida(valor: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const [ano, mes, dia] = valor
    .split("-")
    .map(Number);

  const data = new Date(
    Date.UTC(ano, mes - 1, dia)
  );

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function dataHojeSaoPaulo() {
  const partes = new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const ano =
    partes.find(
      (parte) => parte.type === "year"
    )?.value || "";

  const mes =
    partes.find(
      (parte) => parte.type === "month"
    )?.value || "";

  const dia =
    partes.find(
      (parte) => parte.type === "day"
    )?.value || "";

  return `${ano}-${mes}-${dia}`;
}

function converterDataParaBanco(
  valor: string
) {
  const [ano, mes, dia] = valor
    .split("-")
    .map(Number);

  /*
   * Meio-dia UTC evita que a data apareça
   * como o dia anterior por causa do fuso.
   */
  return new Date(
    Date.UTC(ano, mes - 1, dia, 12, 0, 0)
  );
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

function normalizarDisciplinas(
  valor: unknown
) {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (item) =>
            Number.isInteger(item) &&
            item > 0
        )
    )
  );
}

function verificarAcesso(
  usuario: UsuarioAutenticado | null
) {
  if (!usuario) {
    return {
      autorizado: false,
      ehMaster: false,
    };
  }

  const role = String(
    usuario.role || ""
  ).toUpperCase();

  const email = normalizarEmail(
    usuario.email
  );

  const ehMasterReal =
    email === EMAIL_MASTER_PHANYX &&
    (
      role === "SUPER_ADMIN" ||
      usuario.isMasterAdmin === true
    );

  const ehUsuarioIbe =
    Number(usuario.instituicaoId) ===
      IBE_INSTITUICAO_ID &&
    [
      "ADMIN",
      "FINANCEIRO",
      "SECRETARIA",
      "SUPER_ADMIN",
    ].includes(role);

  return {
    autorizado:
      ehMasterReal || ehUsuarioIbe,
    ehMaster: ehMasterReal,
  };
}

export async function GET() {
  try {
    const usuario =
      await getUserFromToken() as
        | UsuarioAutenticado
        | null;

    const acesso =
      verificarAcesso(usuario);

    if (
      !usuario ||
      !acesso.autorizado
    ) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para consultar os boletos do IBE.",
        },
        { status: 403 }
      );
    }

    const boletos =
      await prisma.matriculaOnlineIbe.findMany({
        where: {
          instituicaoId:
            IBE_INSTITUICAO_ID,

          origem: {
            in: [
              "BOLETO_ADMIN",
              "BOLETO_MASTER",
            ],
          },
        },

        include: {
          pagamentos: {
            orderBy: {
              ordem: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });

    return NextResponse.json({
      boletos,
    });
  } catch (error) {
    console.error(
      "Erro ao consultar boletos IBE:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao consultar os boletos.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  let preMatriculaId:
    | string
    | null = null;

  let externalReference:
    | string
    | null = null;

  try {
    const usuario =
      await getUserFromToken() as
        | UsuarioAutenticado
        | null;

    const acesso =
      verificarAcesso(usuario);

    if (
      !usuario ||
      !acesso.autorizado
    ) {
      return NextResponse.json(
        {
          error:
            "Somente o PHANYX Master ou usuários autorizados do IBE Polos podem gerar este boleto.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const nome = String(
      body?.nome || ""
    ).trim();

    const email =
      normalizarEmail(body?.email);

    const whatsapp =
      somenteNumeros(body?.whatsapp);

    const cpf =
      somenteNumeros(body?.cpf);

    const valor =
      normalizarValor(body?.valor);

    const vencimento = String(
      body?.vencimento || ""
    ).trim();

    const descricao =
      String(
        body?.descricao ||
          "Matrícula IBE"
      ).trim() || "Matrícula IBE";

    const disciplinasIds =
      normalizarDisciplinas(
        body?.disciplinasIds
      );

    if (nome.length < 3) {
      return NextResponse.json(
        {
          error:
            "Informe o nome completo do interessado.",
        },
        { status: 400 }
      );
    }

    if (!emailValido(email)) {
      return NextResponse.json(
        {
          error:
            "Informe um endereço de e-mail válido.",
        },
        { status: 400 }
      );
    }

    if (
      whatsapp.length < 10 ||
      whatsapp.length > 13
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um número de WhatsApp válido.",
        },
        { status: 400 }
      );
    }

    if (cpf.length !== 11) {
      return NextResponse.json(
        {
          error:
            "Informe um CPF válido com 11 números.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(valor) ||
      valor <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um valor de boleto válido.",
        },
        { status: 400 }
      );
    }

    if (!dataIsoValida(vencimento)) {
      return NextResponse.json(
        {
          error:
            "Informe uma data de vencimento válida.",
        },
        { status: 400 }
      );
    }

    const hoje =
      dataHojeSaoPaulo();

    if (vencimento < hoje) {
      return NextResponse.json(
        {
          error:
            "O vencimento não pode ser anterior à data atual.",
        },
        { status: 400 }
      );
    }

    const identificador =
      randomUUID()
        .replace(/-/g, "")
        .slice(0, 16)
        .toUpperCase();

    externalReference =
      `IBE_MATRICULA_ADMIN_` +
      `${Date.now()}_${identificador}`;

    /*
     * Procura um cliente Asaas que já tenha
     * sido salvo pelo PHANYX para este CPF
     * ou endereço de e-mail.
     */
    const cobrancaAnterior =
      await prisma.matriculaOnlineIbe.findFirst({
        where: {
          instituicaoId:
            IBE_INSTITUICAO_ID,

          asaasCustomerId: {
            not: null,
          },

          OR: [
            { cpf },
            { email },
          ],
        },

        select: {
          asaasCustomerId: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    let asaasCustomerId =
      cobrancaAnterior?.asaasCustomerId ||
      null;

    if (!asaasCustomerId) {
      const clienteAsaas =
        await criarClienteAsaas({
          name: nome,
          email,
          cpfCnpj: cpf,
          mobilePhone: whatsapp,

          externalReference:
            `IBE_INTERESSADO_${cpf}`,

          notificationDisabled: false,
        });

      asaasCustomerId =
        clienteAsaas.id;
    }

    /*
     * Salva primeiro no PHANYX.
     *
     * Assim, quando o Asaas disparar o
     * webhook, a cobrança já poderá ser
     * encontrada pelo externalReference.
     */
    const preMatricula =
      await prisma.matriculaOnlineIbe.create({
        data: {
          nome,
          email,
          whatsapp,
          cpf,

          instituicaoId:
            IBE_INSTITUICAO_ID,

          origem: acesso.ehMaster
            ? "BOLETO_MASTER"
            : "BOLETO_ADMIN",

          criadoPorId: usuario.id,

          descricao,

          vencimentoEscolhido:
            converterDataParaBanco(
              vencimento
            ),

          asaasCustomerId,

          valorTotal: valor,
          valorPago: 0,

          disciplinasIds:
            JSON.stringify(
              disciplinasIds
            ),

          status:
            "AGUARDANDO_PAGAMENTO",

          modoPagamento: "UNICO",
          quantidadePartes: 1,

          externalReference,

          pagamentos: {
            create: {
              ordem: 1,

              tipoIntegracao:
                "COBRANCA",

              formaSolicitada:
                "BOLETO",

              billingTypeAsaas:
                "BOLETO",

              valor,

              status:
                "AGUARDANDO_PAGAMENTO",

              externalReference,
            },
          },
        },

        include: {
          pagamentos: true,
        },
      });

    preMatriculaId =
      preMatricula.id;

    /*
     * Somente agora a cobrança é criada
     * no Asaas.
     */
    const cobrancaAsaas =
      await criarCobrancaAsaas({
        customer:
          asaasCustomerId,

        billingType: "BOLETO",

        value: valor,

        dueDate: vencimento,

        description: descricao,

        externalReference,

        postalService: false,
      });

    const boletoUrl =
      cobrancaAsaas.bankSlipUrl ||
      cobrancaAsaas.invoiceUrl ||
      null;

    await prisma.$transaction([
      prisma.matriculaOnlineIbe.update({
        where: {
          id: preMatricula.id,
        },

        data: {
          asaasPaymentId:
            cobrancaAsaas.id,
        },
      }),

      prisma.matriculaOnlineIbePagamento.update({
        where: {
          externalReference,
        },

        data: {
          asaasPaymentId:
            cobrancaAsaas.id,

          billingTypeAsaas:
            cobrancaAsaas.billingType ||
            "BOLETO",

          checkoutUrl:
            boletoUrl,

          status:
            "AGUARDANDO_PAGAMENTO",
        },
      }),
    ]);

    return NextResponse.json(
      {
        ok: true,

        mensagem:
          "Boleto gerado com sucesso.",

        boleto: {
          matriculaOnlineIbeId:
            preMatricula.id,

          asaasPaymentId:
            cobrancaAsaas.id,

          externalReference,

          nome,
          email,
          cpf,
          whatsapp,
          valor,
          vencimento,
          descricao,

          status:
            cobrancaAsaas.status,

          boletoUrl,
          bankSlipUrl:
            cobrancaAsaas.bankSlipUrl ||
            null,

          invoiceUrl:
            cobrancaAsaas.invoiceUrl ||
            null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao gerar boleto avulso IBE:",
      error
    );

    /*
     * Se a pré-matrícula chegou a ser
     * criada, mantemos o registro para
     * auditoria e marcamos como erro.
     */
    if (
      preMatriculaId &&
      externalReference
    ) {
      await prisma
        .$transaction([
          prisma.matriculaOnlineIbe.updateMany({
            where: {
              id: preMatriculaId,

              status: {
                not: "PAGO",
              },
            },

            data: {
              status: "ERRO",
            },
          }),

          prisma.matriculaOnlineIbePagamento.updateMany({
            where: {
              externalReference,

              status: {
                not: "PAGO",
              },
            },

            data: {
              status: "ERRO",
            },
          }),
        ])
        .catch((erroAtualizacao) => {
          console.error(
            "Erro ao marcar boleto como ERRO:",
            erroAtualizacao
          );
        });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o boleto.",
      },
      { status: 500 }
    );
  }
}