import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  calcularValorDisciplina,
  calcularValorModuloCompleto,
  INSTITUICAO_ID_PADRAO,
  VALOR_CURSO_COMPLETO,
} from "@/lib/ibe/matricula-precos";

type DisciplinaCheckout = Prisma.DisciplinaGetPayload<{
  include: {
    prerequisitosDaDisciplina: {
      include: {
        prerequisito: true;
      };
    };
  };
}>;

type ModoPagamentoIbe =
  | "UNICO"
  | "DUAS_FORMAS";

type FormaPagamentoIbe =
  | "PIX"
  | "CREDIT_CARD"
  | "BOLETO"
  | "DEBIT_CARD";

type PartePagamentoIbe = {
  ordem: number;
  forma: FormaPagamentoIbe;
  valor: number;
};

type RecursoPagamentoAsaas = {
  ordem: number;
  forma: FormaPagamentoIbe;
  valor: number;

  tipoIntegracao:
    | "CHECKOUT"
    | "COBRANCA";

  externalReference: string;
  url: string;

  asaasCheckoutId: string | null;
  asaasPaymentId: string | null;
  billingTypeAsaas: string | null;

  expiraEm: Date | null;
};

const FORMAS_PAGAMENTO_VALIDAS =
  new Set<FormaPagamentoIbe>([
    "PIX",
    "CREDIT_CARD",
    "BOLETO",
    "DEBIT_CARD",
  ]);

export const runtime = "nodejs";

const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

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

function normalizarIds(valor: unknown): number[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return Array.from(
    new Set(
      valor
        .map((item) => Number(item))
        .filter(
          (id) =>
            Number.isInteger(id) &&
            id > 0
        )
    )
  );
}

function removerDuplicadosPorId<
  T extends { id: number }
>(itens: T[]): T[] {
  const idsEncontrados = new Set<number>();

  return itens.filter((item) => {
    if (idsEncontrados.has(item.id)) {
      return false;
    }

    idsEncontrados.add(item.id);
    return true;
  });
}

function obterHeadersAsaas() {
  if (!ASAAS_API_KEY) {
    throw new Error(
      "ASAAS_API_KEY não configurada."
    );
  }

  return {
    accept: "application/json",
    "Content-Type": "application/json",
    access_token: ASAAS_API_KEY,
    "User-Agent": "PHANYX/1.0",
  };
}

function normalizarPartesPagamento(
  valor: unknown
): PartePagamentoIbe[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  const partes: PartePagamentoIbe[] = [];

  for (const item of valor) {
    const ordem = Number(item?.ordem);
    const forma = String(
      item?.forma || ""
    )
      .trim()
      .toUpperCase() as FormaPagamentoIbe;

    const valorParte = Number(
      item?.valor
    );

    if (
      !Number.isInteger(ordem) ||
      ordem < 1 ||
      ordem > 2 ||
      !FORMAS_PAGAMENTO_VALIDAS.has(
        forma
      ) ||
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
  const referenciaCliente =
    `IBE_CLIENTE_${cpf}`;

  const urlConsulta = new URL(
    `${ASAAS_API_URL}/customers`
  );

  urlConsulta.searchParams.set(
    "externalReference",
    referenciaCliente
  );

  urlConsulta.searchParams.set(
    "limit",
    "1"
  );

  const consultaRes = await fetch(
    urlConsulta.toString(),
    {
      method: "GET",
      headers: obterHeadersAsaas(),
      cache: "no-store",
    }
  );

  const consulta = await consultaRes
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

  if (clienteExistente?.id) {
    return String(
      clienteExistente.id
    );
  }

  const clienteRes = await fetch(
    `${ASAAS_API_URL}/customers`,
    {
      method: "POST",
      headers: obterHeadersAsaas(),
      body: JSON.stringify({
        name: nome,
        email,
        mobilePhone: whatsapp,
        cpfCnpj: cpf,

        externalReference:
          referenciaCliente,

        /*
         * Evita os emails automáticos que
         * causaram o problema inicial.
         */
        notificationDisabled: true,
      }),
    }
  );

  const cliente = await clienteRes
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

async function criarRecursoPagamentoAsaas({
  parte,
  matriculaExternalReference,
  origin,
  clienteAsaasId,
  quantidadePartes,
  quantidadeDisciplinas,
}: {
  parte: PartePagamentoIbe;
  matriculaExternalReference: string;
  origin: string;
  clienteAsaasId: string | null;
  quantidadePartes: number;
  quantidadeDisciplinas: number;
}): Promise<RecursoPagamentoAsaas> {
  const pagamentoExternalReference =
    `${matriculaExternalReference}_P${parte.ordem}`;

  const paginaAcompanhamento =
    `${origin}/ibe/matricula/pagamento/` +
    `${encodeURIComponent(
      matriculaExternalReference
    )}`;

  const urlSucesso =
    `${paginaAcompanhamento}` +
    `?retorno=sucesso` +
    `&parte=${parte.ordem}`;

  const urlCancelamento =
    `${paginaAcompanhamento}` +
    `?retorno=cancelado` +
    `&parte=${parte.ordem}`;

  const urlExpiracao =
    `${paginaAcompanhamento}` +
    `?retorno=expirado` +
    `&parte=${parte.ordem}`;

  /*
   * Pix e crédito usam o Checkout.
   * Abrir a tela não cria cobrança.
   */
  if (
    parte.forma === "PIX" ||
    parte.forma === "CREDIT_CARD"
  ) {
    const payloadCheckout: Record<
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

      externalReference:
        pagamentoExternalReference,

      callback: {
        successUrl: urlSucesso,
        cancelUrl: urlCancelamento,
        expiredUrl: urlExpiracao,
      },

      items: [
        {
          name:
            quantidadePartes === 2
              ? `Matrícula online IBE — parte ${parte.ordem}`
              : "Matrícula online IBE",

          description:
            `Bacharel Livre em Teologia — ` +
            `${quantidadeDisciplinas} disciplina` +
            `${
              quantidadeDisciplinas === 1
                ? ""
                : "s"
            }`,

          quantity: 1,
          value: parte.valor,
        },
      ],
    };

    if (
      parte.forma === "CREDIT_CARD"
    ) {
      payloadCheckout.installment = {
        maxInstallmentCount: 12,
      };
    }

    const checkoutRes = await fetch(
      `${ASAAS_API_URL}/checkouts`,
      {
        method: "POST",
        headers: obterHeadersAsaas(),
        body: JSON.stringify(
          payloadCheckout
        ),
      }
    );

    const checkout = await checkoutRes
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

    const url =
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

      externalReference:
        pagamentoExternalReference,

      url,

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

  /*
   * Boleto e débito precisam de uma
   * cobrança vinculada a um cliente.
   */
  if (!clienteAsaasId) {
    throw new Error(
      "Não foi possível identificar o cliente para gerar a cobrança."
    );
  }

  const vencimento =
    dataDaquiDias(3);

  const dueDate = vencimento
    .toISOString()
    .slice(0, 10);

  /*
   * A API não possui DEBIT_CARD como
   * billingType de criação.
   *
   * CREDIT_CARD abre a fatura Asaas,
   * onde a opção de débito pode aparecer.
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

        externalReference:
          pagamentoExternalReference,

        callback: {
          successUrl: urlSucesso,

          /*
           * Débito possui confirmação
           * instantânea na fatura.
           */
          autoRedirect:
            parte.forma ===
            "DEBIT_CARD",
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

  const url = String(
    pagamento.invoiceUrl ||
      pagamento.bankSlipUrl ||
      ""
  ).trim();

  if (!url) {
    throw new Error(
      `A cobrança da parte ${parte.ordem} foi criada, mas o Asaas não retornou o link.`
    );
  }

  return {
    ordem: parte.ordem,
    forma: parte.forma,
    valor: parte.valor,

    tipoIntegracao: "COBRANCA",

    externalReference:
      pagamentoExternalReference,

    url,

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
  recursos: RecursoPagamentoAsaas[]
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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const nome = String(body.nome || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const whatsapp = String(body.whatsapp || "").trim();

    const whatsappNumeros = whatsapp.replace(
      /\D/g,
      ""
    );

    const cpf = String(body.cpf || "").replace(
      /\D/g,
      ""
    );

    const disciplinasIds = normalizarIds(
      body.disciplinas
    );

    const modulosCompletosInformados = new Set(
      normalizarIds(body.modulosCompletos)
    );

    if (!nome || !email || !whatsappNumeros || !cpf) {
      return NextResponse.json(
        {
          error:
            "Nome, email, WhatsApp e CPF são obrigatórios.",
        },
        { status: 400 }
      );
    }

    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um endereço de email válido.",
        },
        { status: 400 }
      );
    }

    if (
      whatsappNumeros.length < 10 ||
      whatsappNumeros.length > 13
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

    if (disciplinasIds.length === 0) {
      return NextResponse.json(
        {
          error:
            "Selecione pelo menos uma disciplina para continuar.",
        },
        { status: 400 }
      );
    }

    /*
     * Busca o curso e suas disciplinas diretamente
     * no banco. O valor enviado pelo navegador não
     * será utilizado.
     */
    const curso = await prisma.curso.findFirst({
      where: {
        instituicaoId: INSTITUICAO_ID_PADRAO,
        ativo: true,
        nome: {
          contains:
            "Bacharel Livre em Teologia",
          mode: "insensitive",
        },
      },
      include: {
        semestres: {
          orderBy: {
            numero: "asc",
          },
          include: {
            disciplinas: {
              include: {
                disciplina: {
                  include: {
                    prerequisitosDaDisciplina: {
                      include: {
                        prerequisito: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!curso) {
      return NextResponse.json(
        {
          error:
            "O curso Bacharel Livre em Teologia não foi encontrado.",
        },
        { status: 404 }
      );
    }

    const disciplinasDiretas =
      await prisma.disciplina.findMany({
        where: {
          instituicaoId:
            INSTITUICAO_ID_PADRAO,
          cursoId: curso.id,
          ativo: true,
          semestre: {
            not: null,
          },
        },
        include: {
          prerequisitosDaDisciplina: {
            include: {
              prerequisito: true,
            },
          },
        },
        orderBy: [
          {
            semestre: "asc",
          },
          {
            nome: "asc",
          },
        ],
      });

    /*
     * Monta os módulos usando a mesma regra da
     * API que alimenta a página pública.
     */
    const modulos = curso.semestres.map(
      (semestre) => {
        const disciplinasVinculadas: DisciplinaCheckout[] =
  semestre.disciplinas
    .map(
      (item) =>
        item.disciplina as DisciplinaCheckout
    )
    .filter((disciplina) => disciplina.ativo);

        const idsVinculadas = new Set(
          disciplinasVinculadas.map(
            (disciplina) => disciplina.id
          )
        );

        const disciplinasDoSemestre: DisciplinaCheckout[] =
  disciplinasDiretas.filter(
            (disciplina) =>
              Number(disciplina.semestre) ===
                Number(semestre.numero) &&
              !idsVinculadas.has(
                disciplina.id
              )
          );

        const disciplinasUnicas: DisciplinaCheckout[] =
  removerDuplicadosPorId<DisciplinaCheckout>([
    ...disciplinasVinculadas,
    ...disciplinasDoSemestre,
  ]);

        return {
          numero: semestre.numero,
          disciplinas: disciplinasUnicas,
        };
      }
    );

    const todasDisciplinas: DisciplinaCheckout[] =
  removerDuplicadosPorId<DisciplinaCheckout>(
    modulos.flatMap(
      (modulo) => modulo.disciplinas
    )
  );

    const idsValidos = new Set(
      todasDisciplinas.map(
        (disciplina) => disciplina.id
      )
    );

    const idsInvalidos =
      disciplinasIds.filter(
        (id) => !idsValidos.has(id)
      );

    if (idsInvalidos.length > 0) {
      return NextResponse.json(
        {
          error:
            "Uma ou mais disciplinas selecionadas não pertencem ao curso.",
        },
        { status: 400 }
      );
    }

    const selecionadasSet = new Set(
      disciplinasIds
    );

    /*
     * Confere os pré-requisitos no servidor.
     */
    for (const disciplina of todasDisciplinas) {
      if (
        !selecionadasSet.has(
          disciplina.id
        )
      ) {
        continue;
      }

      const prerequisitosFaltantes =
        disciplina.prerequisitosDaDisciplina.filter(
          (vinculo) =>
            idsValidos.has(
              vinculo.prerequisito.id
            ) &&
            !selecionadasSet.has(
              vinculo.prerequisito.id
            )
        );

      if (
        prerequisitosFaltantes.length > 0
      ) {
        return NextResponse.json(
          {
            error:
              `A disciplina "${disciplina.nome}" exige: ` +
              prerequisitosFaltantes
                .map(
                  (item) =>
                    item.prerequisito.nome
                )
                .join(", "),
          },
          { status: 400 }
        );
      }
    }

    const cursoCompletoSelecionado =
      todasDisciplinas.length > 0 &&
      todasDisciplinas.every(
        (disciplina) =>
          selecionadasSet.has(
            disciplina.id
          )
      ) &&
      modulos.every((modulo) =>
        modulosCompletosInformados.has(
          modulo.numero
        )
      );

    let valorTotalSeguro = 0;

    if (cursoCompletoSelecionado) {
      valorTotalSeguro =
        VALOR_CURSO_COMPLETO;
    } else {
      for (const modulo of modulos) {
        const idsDoModulo =
          modulo.disciplinas.map(
            (disciplina) =>
              disciplina.id
          );

        const selecionadasDoModulo =
          modulo.disciplinas.filter(
            (disciplina) =>
              selecionadasSet.has(
                disciplina.id
              )
          );

        const moduloInteiroSelecionado =
          idsDoModulo.length > 0 &&
          idsDoModulo.every((id) =>
            selecionadasSet.has(id)
          ) &&
          modulosCompletosInformados.has(
            modulo.numero
          );

        if (moduloInteiroSelecionado) {
          valorTotalSeguro +=
            calcularValorModuloCompleto(
              modulo.numero
            );

          continue;
        }

        valorTotalSeguro +=
          selecionadasDoModulo.reduce(
            (subtotal, disciplina) =>
              subtotal +
              calcularValorDisciplina(
                disciplina.nome
              ),
            0
          );
      }
    }

    valorTotalSeguro = Number(
      valorTotalSeguro.toFixed(2)
    );

    if (
      !Number.isFinite(valorTotalSeguro) ||
      valorTotalSeguro <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Não foi possível calcular o valor da matrícula.",
        },
        { status: 400 }
      );
    }

       const matriculaExternalReference =
      `IBE_MATRICULA_${randomUUID()}`;

    const origin = new URL(req.url).origin;

    /*
     * Nesta etapa criamos somente a pré-matrícula.
     *
     * Nenhuma cobrança, boleto, Pix, cartão
     * ou Checkout é criado no Asaas.
     */
    await prisma.matriculaOnlineIbe.create({
      data: {
        nome,
        email,
        whatsapp,
        cpf,

        valorTotal: valorTotalSeguro,
        valorPago: 0,

        disciplinasIds: JSON.stringify(
          disciplinasIds
        ),

        /*
         * A forma de pagamento será escolhida
         * na página seguinte.
         */
        modoPagamento: "NAO_DEFINIDO",
        quantidadePartes: 0,

        externalReference:
          matriculaExternalReference,

        status:
          "AGUARDANDO_ESCOLHA_PAGAMENTO",
      },
    });

    const urlPagamento =
      `${origin}/ibe/matricula/pagamento/` +
      `${encodeURIComponent(
        matriculaExternalReference
      )}`;

    return NextResponse.json({
      externalReference:
        matriculaExternalReference,

      valorTotal: valorTotalSeguro,

      urlPagamento,

      /*
       * A página atual ainda procura
       * data.checkoutUrl para redirecionar.
       */
      checkoutUrl: urlPagamento,
    });
  } catch (error: unknown) {
    console.error(
      "Erro matrícula IBE:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro ao iniciar a matrícula.";

    return NextResponse.json(
      {
        error: mensagem,
      },
      { status: 500 }
    );
  }
}