import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

type RouteContext = {
  params: {
    externalReference: string;
  };
};

type ModoPagamento =
  | "UNICO"
  | "DUAS_FORMAS";

type FormaPagamento =
  | "PIX"
  | "CREDIT_CARD"
  | "BOLETO"
  | "DEBIT_CARD";

type PartePagamento = {
  ordem: number;
  forma: FormaPagamento;
  valor: number;
};

type RecursoAsaas = {
  ordem: number;
  forma: FormaPagamento;
  valor: number;

  tipoIntegracao:
    | "CHECKOUT"
    | "COBRANCA";

  externalReference: string;
  urlPagamento: string;

  asaasCheckoutId: string | null;
  asaasPaymentId: string | null;
  billingTypeAsaas: string | null;

  expiraEm: Date | null;
};

const FORMAS_VALIDAS =
  new Set<FormaPagamento>([
    "PIX",
    "CREDIT_CARD",
    "BOLETO",
    "DEBIT_CARD",
  ]);

function obterExternalReference(
  params: RouteContext["params"]
) {
  return decodeURIComponent(
    String(
      params.externalReference || ""
    )
  ).trim();
}

function obterMensagemErroAsaas(
  resposta: any,
  mensagemPadrao: string
) {
  return (
    resposta?.errors?.[0]?.description ||
    resposta?.error ||
    mensagemPadrao
  );
}

function obterHeadersAsaas() {
  const token = ASAAS_API_KEY;

  if (!token) {
    throw new Error(
      "ASAAS_API_KEY não configurada."
    );
  }

  return {
    accept: "application/json",
    "Content-Type": "application/json",
    access_token: token,
    "User-Agent": "PHANYX/1.0",
  };
}

function normalizarPartes(
  valor: unknown
): PartePagamento[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const partes: PartePagamento[] = [];

  for (const item of valor) {
    const ordem = Number(item?.ordem);

    const forma = String(
      item?.forma || ""
    )
      .trim()
      .toUpperCase() as FormaPagamento;

    const valorParte = Number(
      item?.valor
    );

    if (
      !Number.isInteger(ordem) ||
      ordem < 1 ||
      ordem > 2 ||
      !FORMAS_VALIDAS.has(forma) ||
      !Number.isFinite(valorParte)
    ) {
      continue;
    }

    partes.push({
      ordem,
      forma,
      valor: Number(
        valorParte.toFixed(2)
      ),
    });
  }

  return partes.sort(
    (a, b) => a.ordem - b.ordem
  );
}

function dataDaquiDias(
  quantidadeDias: number
) {
  const data = new Date();

  data.setDate(
    data.getDate() + quantidadeDias
  );

  return data;
}

async function obterOuCriarClienteAsaas({
  nome,
  email,
  whatsapp,
  cpf,
}: {
  nome: string;
  email: string;
  whatsapp: string;
  cpf: string;
}) {
  const url = new URL(
    `${ASAAS_API_URL}/customers`
  );

  url.searchParams.set(
    "cpfCnpj",
    cpf
  );

  url.searchParams.set(
    "limit",
    "1"
  );

  const consultaRes = await fetch(
    url.toString(),
    {
      method: "GET",
      headers: obterHeadersAsaas(),
      cache: "no-store",
    }
  );

  const consulta =
    await consultaRes
      .json()
      .catch(() => null);

  if (!consultaRes.ok) {
    throw new Error(
      obterMensagemErroAsaas(
        consulta,
        "Erro ao consultar cliente no Asaas."
      )
    );
  }

  const clienteExistente =
    Array.isArray(consulta?.data)
      ? consulta.data[0]
      : null;

  const dadosCliente = {
    name: nome,
    email,
    mobilePhone: whatsapp,
    cpfCnpj: cpf,

    externalReference:
      `IBE_CLIENTE_${cpf}`,

    /*
     * Evita que a criação da cobrança
     * envie e-mails automáticos inesperados.
     */
    notificationDisabled: true,
  };

  if (clienteExistente?.id) {
    const clienteId = String(
      clienteExistente.id
    );

    const atualizacaoRes =
      await fetch(
        `${ASAAS_API_URL}/customers/${clienteId}`,
        {
          method: "PUT",
          headers:
            obterHeadersAsaas(),

          body: JSON.stringify(
            dadosCliente
          ),
        }
      );

    const atualizacao =
      await atualizacaoRes
        .json()
        .catch(() => null);

    if (!atualizacaoRes.ok) {
      throw new Error(
        obterMensagemErroAsaas(
          atualizacao,
          "Erro ao atualizar cliente no Asaas."
        )
      );
    }

    return clienteId;
  }

    const clienteRes = await fetch(
    `${ASAAS_API_URL}/customers`,
    {
      method: "POST",
      headers: obterHeadersAsaas(),
      body: JSON.stringify(
        dadosCliente
      ),
    }
  );

  const cliente =
    await clienteRes
      .json()
      .catch(() => null);

  if (
    !clienteRes.ok ||
    !cliente?.id
  ) {
    throw new Error(
      obterMensagemErroAsaas(
        cliente,
        "Erro ao criar cliente no Asaas."
      )
    );
  }

  return String(cliente.id);
}

async function criarRecursoAsaas({
  parte,
  matriculaExternalReference,
  quantidadePartes,
  clienteAsaasId,
  origin,
}: {
  parte: PartePagamento;
  matriculaExternalReference: string;
  quantidadePartes: number;
  clienteAsaasId: string | null;
  origin: string;
}): Promise<RecursoAsaas> {
  const externalReference =
    `${matriculaExternalReference}_P${parte.ordem}`;

  const paginaRetorno =
    `${origin}/ibe/matricula/pagamento/` +
    `${encodeURIComponent(
      matriculaExternalReference
    )}`;

  const successUrl =
    `${paginaRetorno}` +
    `?retorno=sucesso` +
    `&parte=${parte.ordem}`;

  const cancelUrl =
    `${paginaRetorno}` +
    `?retorno=cancelado` +
    `&parte=${parte.ordem}`;

  const expiredUrl =
    `${paginaRetorno}` +
    `?retorno=expirado` +
    `&parte=${parte.ordem}`;

  /*
   * Pix e crédito usam o Checkout.
   * Apenas abrir o Checkout não confirma
   * nem recebe o pagamento.
   */
  if (
    parte.forma === "PIX" ||
    parte.forma === "CREDIT_CARD"
  ) {
    const payload: Record<
      string,
      unknown
    > = {
      billingTypes: [
        parte.forma,
      ],

      chargeTypes:
        parte.forma === "CREDIT_CARD"
          ? [
              "DETACHED",
              "INSTALLMENT",
            ]
          : ["DETACHED"],

      minutesToExpire: 60,

      externalReference,

      callback: {
        successUrl,
        cancelUrl,
        expiredUrl,
      },

      items: [
        {
          name:
            quantidadePartes === 2
              ? `Matrícula online IBE — parte ${parte.ordem}`
              : "Matrícula online IBE",

          description:
            "Bacharel Livre em Teologia",

          quantity: 1,
          value: parte.valor,
        },
      ],
    };

    if (
      parte.forma === "CREDIT_CARD"
    ) {
      payload.installment = {
        maxInstallmentCount: 12,
      };
    }

    const checkoutRes =
      await fetch(
        `${ASAAS_API_URL}/checkouts`,
        {
          method: "POST",
          headers:
            obterHeadersAsaas(),

          body: JSON.stringify(
            payload
          ),
        }
      );

    const checkout =
      await checkoutRes
        .json()
        .catch(() => null);

    if (
      !checkoutRes.ok ||
      !checkout?.id
    ) {
      throw new Error(
        obterMensagemErroAsaas(
          checkout,
          `Erro ao criar a parte ${parte.ordem} no Checkout Asaas.`
        )
      );
    }

    const checkoutId = String(
      checkout.id
    );

    const urlPagamento =
      typeof checkout.link ===
        "string" &&
      checkout.link.trim()
        ? checkout.link.trim()
        : `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(
            checkoutId
          )}`;

    return {
      ordem: parte.ordem,
      forma: parte.forma,
      valor: parte.valor,

      tipoIntegracao: "CHECKOUT",

      externalReference,
      urlPagamento,

      asaasCheckoutId:
        checkoutId,

      asaasPaymentId: null,
      billingTypeAsaas: null,

      expiraEm: new Date(
        Date.now() +
          60 * 60 * 1000
      ),
    };
  }

  if (!clienteAsaasId) {
    throw new Error(
      "Não foi possível identificar o cliente para gerar a cobrança."
    );
  }

  const vencimento =
    dataDaquiDias(3);

  const dueDate =
    vencimento
      .toISOString()
      .slice(0, 10);

  /*
   * O Asaas não permite criar uma cobrança
   * usando DEBIT_CARD como billingType.
   *
   * Uma fatura CREDIT_CARD pode apresentar
   * a opção de cartão de débito ao pagador.
   */
  const billingType =
    parte.forma === "BOLETO"
      ? "BOLETO"
      : "CREDIT_CARD";

  const pagamentoRes = await fetch(
    `${ASAAS_API_URL}/payments`,
    {
      method: "POST",
      headers: obterHeadersAsaas(),

      body: JSON.stringify({
        customer: clienteAsaasId,
        billingType,

        value: parte.valor,
        dueDate,

        description:
          quantidadePartes === 2
            ? `Matrícula online IBE - parte ${parte.ordem}`
            : "Matrícula online IBE - Bacharel Livre em Teologia",

        externalReference,

        callback: {
          successUrl,
          autoRedirect: true,
        },
      }),
    }
  );

  const pagamento =
    await pagamentoRes
      .json()
      .catch(() => null);

  if (
    !pagamentoRes.ok ||
    !pagamento?.id
  ) {
    throw new Error(
      obterMensagemErroAsaas(
        pagamento,
        `Erro ao criar a cobrança da parte ${parte.ordem}.`
      )
    );
  }

  const urlPagamento = String(
    pagamento.invoiceUrl ||
      pagamento.bankSlipUrl ||
      ""
  ).trim();

  if (!urlPagamento) {
    throw new Error(
      `A parte ${parte.ordem} foi criada, mas o Asaas não retornou o link de pagamento.`
    );
  }

  return {
    ordem: parte.ordem,
    forma: parte.forma,
    valor: parte.valor,

    tipoIntegracao: "COBRANCA",

    externalReference,
    urlPagamento,

    asaasCheckoutId: null,

    asaasPaymentId: String(
      pagamento.id
    ),

    billingTypeAsaas:
      billingType,

    expiraEm: vencimento,
  };
}

async function cancelarRecursosAsaas(
  recursos: RecursoAsaas[]
) {
  for (
    const recurso of [...recursos].reverse()
  ) {
    try {
      if (recurso.asaasCheckoutId) {
        await fetch(
          `${ASAAS_API_URL}/checkouts/${recurso.asaasCheckoutId}/cancel`,
          {
            method: "POST",
            headers:
              obterHeadersAsaas(),
          }
        );

        continue;
      }

      if (recurso.asaasPaymentId) {
        await fetch(
          `${ASAAS_API_URL}/payments/${recurso.asaasPaymentId}`,
          {
            method: "DELETE",
            headers:
              obterHeadersAsaas(),
          }
        );
      }
    } catch (error) {
      console.error(
        "Erro ao cancelar recurso Asaas:",
        error
      );
    }
  }
}

export async function GET(
  _req: Request,
  { params }: RouteContext
) {
  try {
    const externalReference =
      obterExternalReference(params);

    if (
      !externalReference ||
      !externalReference.startsWith(
        "IBE_MATRICULA_"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Referência de matrícula inválida.",
        },
        { status: 400 }
      );
    }

    const preMatricula =
      await prisma.matriculaOnlineIbe.findUnique({
        where: {
          externalReference,
        },

        select: {
          externalReference: true,
          nome: true,
          email: true,

          valorTotal: true,
          valorPago: true,

          status: true,
          modoPagamento: true,
          quantidadePartes: true,
          createdAt: true,

          pagamentos: {
            orderBy: {
              ordem: "asc",
            },

            select: {
              ordem: true,
              formaSolicitada: true,
              billingTypeAsaas: true,
              tipoIntegracao: true,

              valor: true,
              status: true,

              checkoutUrl: true,
              expiraEm: true,
              pagoEm: true,
            },
          },
        },
      });

    if (!preMatricula) {
      return NextResponse.json(
        {
          error:
            "Pré-matrícula não encontrada.",
        },
        { status: 404 }
      );
    }

    const valorTotal = Number(
      preMatricula.valorTotal || 0
    );

    const valorPago = Number(
      preMatricula.valorPago || 0
    );

    const saldoRestante = Math.max(
      0,
      Number(
        (
          valorTotal -
          valorPago
        ).toFixed(2)
      )
    );

    return NextResponse.json({
      matricula: {
        externalReference:
          preMatricula.externalReference,

        nome: preMatricula.nome,
        email: preMatricula.email,

        valorTotal,
        valorPago,
        saldoRestante,

        status:
          preMatricula.status,

        modoPagamento:
          preMatricula.modoPagamento,

        quantidadePartes:
          preMatricula.quantidadePartes,

        criadaEm:
          preMatricula.createdAt,
      },

      pagamentos:
        preMatricula.pagamentos.map(
          (pagamento) => ({
            ordem:
              pagamento.ordem,

            forma:
              pagamento.formaSolicitada,

            billingTypeAsaas:
              pagamento.billingTypeAsaas,

            tipoIntegracao:
              pagamento.tipoIntegracao,

            valor: Number(
              pagamento.valor || 0
            ),

            status:
              pagamento.status,

            urlPagamento:
              pagamento.checkoutUrl,

            expiraEm:
              pagamento.expiraEm,

            pagoEm:
              pagamento.pagoEm,
          })
        ),
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao consultar pagamentos da matrícula IBE:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao consultar os pagamentos.";

    return NextResponse.json(
      {
        error: mensagem,
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: RouteContext
) {
  const recursosCriados:
    RecursoAsaas[] = [];

  let preMatriculaId:
    string | null = null;

  try {
    if (!ASAAS_API_KEY) {
      return NextResponse.json(
        {
          error:
            "ASAAS_API_KEY não configurada.",
        },
        { status: 500 }
      );
    }

    const externalReference =
      obterExternalReference(params);

    if (
      !externalReference ||
      !externalReference.startsWith(
        "IBE_MATRICULA_"
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Referência de matrícula inválida.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();

    const modoPagamento:
      ModoPagamento =
      body?.modoPagamento ===
      "DUAS_FORMAS"
        ? "DUAS_FORMAS"
        : "UNICO";

    const partesInformadas =
      normalizarPartes(
        body?.partesPagamento ??
          body?.partes
      );

    const preMatricula =
      await prisma.matriculaOnlineIbe.findUnique({
        where: {
          externalReference,
        },

        include: {
          pagamentos: true,
        },
      });

    if (!preMatricula) {
      return NextResponse.json(
        {
          error:
            "Pré-matrícula não encontrada.",
        },
        { status: 404 }
      );
    }

    preMatriculaId =
      preMatricula.id;

    if (
      preMatricula.status === "PAGO"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta matrícula já está paga.",
        },
        { status: 409 }
      );
    }

    if (
      preMatricula.pagamentos.length >
        0 ||
      preMatricula.quantidadePartes > 0
    ) {
      return NextResponse.json(
        {
          error:
            "As formas de pagamento desta matrícula já foram preparadas.",

          jaPreparado: true,
        },
        { status: 409 }
      );
    }

    const total = Number(
      preMatricula.valorTotal || 0
    );

    if (
      !Number.isFinite(total) ||
      total <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "O valor da matrícula é inválido.",
        },
        { status: 400 }
      );
    }

    const parte1 =
      partesInformadas.find(
        (parte) =>
          parte.ordem === 1
      );

    if (!parte1) {
      return NextResponse.json(
        {
          error:
            "Selecione a primeira forma de pagamento.",
        },
        { status: 400 }
      );
    }

    let partesSeguras:
      PartePagamento[];

    if (modoPagamento === "UNICO") {
      partesSeguras = [
        {
          ordem: 1,
          forma: parte1.forma,
          valor: Number(
            total.toFixed(2)
          ),
        },
      ];
    } else {
      const parte2 =
        partesInformadas.find(
          (parte) =>
            parte.ordem === 2
        );

      if (!parte2) {
        return NextResponse.json(
          {
            error:
              "Selecione a segunda forma de pagamento.",
          },
          { status: 400 }
        );
      }

      const valorPrimeiraParte =
        Number(
          parte1.valor.toFixed(2)
        );

      const valorSegundaParte =
        Number(
          (
            total -
            valorPrimeiraParte
          ).toFixed(2)
        );

      if (
        valorPrimeiraParte < 1 ||
        valorSegundaParte < 1
      ) {
        return NextResponse.json(
          {
            error:
              "Cada parte precisa ter pelo menos R$ 1,00.",
          },
          { status: 400 }
        );
      }

      partesSeguras = [
        {
          ordem: 1,
          forma: parte1.forma,
          valor:
            valorPrimeiraParte,
        },
        {
          ordem: 2,
          forma: parte2.forma,
          valor:
            valorSegundaParte,
        },
      ];
    }

    /*
     * Impede dois cliques simultâneos de
     * criarem pagamentos duplicados.
     */
    const bloqueio =
      await prisma.matriculaOnlineIbe.updateMany({
        where: {
          id: preMatricula.id,
          quantidadePartes: 0,

          status:
            "AGUARDANDO_ESCOLHA_PAGAMENTO",
        },

        data: {
          status:
            "PREPARANDO_PAGAMENTO",

          modoPagamento,

          quantidadePartes:
            partesSeguras.length,
        },
      });

    if (bloqueio.count !== 1) {
      return NextResponse.json(
        {
          error:
            "Os pagamentos desta matrícula já estão sendo preparados.",
        },
        { status: 409 }
      );
    }

    const precisaCliente =
      partesSeguras.some(
        (parte) =>
          parte.forma === "BOLETO" ||
          parte.forma ===
            "DEBIT_CARD"
      );

    let clienteAsaasId:
      string | null = null;

    if (precisaCliente) {
      const cpf = String(
        preMatricula.cpf || ""
      ).replace(/\D/g, "");

      if (cpf.length !== 11) {
        throw new Error(
          "O CPF da pré-matrícula é inválido."
        );
      }

      clienteAsaasId =
        await obterOuCriarClienteAsaas({
          nome:
            preMatricula.nome,

          email:
            preMatricula.email,

          whatsapp: String(
            preMatricula.whatsapp || ""
          ).replace(/\D/g, ""),

          cpf,
        });
    }

    const origin =
      new URL(req.url).origin;

    for (const parte of partesSeguras) {
      const recurso =
        await criarRecursoAsaas({
          parte,

          matriculaExternalReference:
            externalReference,

          quantidadePartes:
            partesSeguras.length,

          clienteAsaasId,

          origin,
        });

      recursosCriados.push(
        recurso
      );
    }

    await prisma.$transaction([
      prisma
        .matriculaOnlineIbePagamento
        .createMany({
          data:
            recursosCriados.map(
              (recurso) => ({
                matriculaOnlineIbeId:
                  preMatricula.id,

                ordem:
                  recurso.ordem,

                tipoIntegracao:
                  recurso.tipoIntegracao,

                formaSolicitada:
                  recurso.forma,

                billingTypeAsaas:
                  recurso
                    .billingTypeAsaas,

                valor:
                  recurso.valor,

                status:
                  "AGUARDANDO_PAGAMENTO",

                externalReference:
                  recurso
                    .externalReference,

                asaasCheckoutId:
                  recurso
                    .asaasCheckoutId,

                asaasPaymentId:
                  recurso
                    .asaasPaymentId,

                checkoutUrl:
                  recurso.urlPagamento,

                expiraEm:
                  recurso.expiraEm,
              })
            ),
        }),

      prisma.matriculaOnlineIbe.update({
        where: {
          id: preMatricula.id,
        },

        data: {
          status:
            "AGUARDANDO_PAGAMENTO",

          modoPagamento,

          quantidadePartes:
            partesSeguras.length,

          asaasPaymentId:
            recursosCriados.find(
              (recurso) =>
                recurso.asaasPaymentId
            )?.asaasPaymentId ||
            null,
        },
      }),
    ]);

    return NextResponse.json({
      ok: true,

      modoPagamento,

      quantidadePartes:
        partesSeguras.length,

      pagamentos:
        recursosCriados.map(
          (recurso) => ({
            ordem:
              recurso.ordem,

            forma:
              recurso.forma,

            valor:
              recurso.valor,

            urlPagamento:
              recurso.urlPagamento,
          })
        ),
    });
  } catch (error: unknown) {
    console.error(
      "Erro ao preparar pagamentos da matrícula IBE:",
      error
    );

    await cancelarRecursosAsaas(
      recursosCriados
    );

    if (preMatriculaId) {
      try {
        await prisma.matriculaOnlineIbe.updateMany({
          where: {
            id: preMatriculaId,

            status:
              "PREPARANDO_PAGAMENTO",
          },

          data: {
            status:
              "AGUARDANDO_ESCOLHA_PAGAMENTO",

            modoPagamento:
              "NAO_DEFINIDO",

            quantidadePartes: 0,
          },
        });
      } catch (rollbackError) {
        console.error(
          "Erro ao desfazer preparação de pagamento:",
          rollbackError
        );
      }
    }

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao preparar os pagamentos.";

    return NextResponse.json(
      {
        error: mensagem,
      },
      { status: 500 }
    );
  }
}