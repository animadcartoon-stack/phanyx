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

export async function POST(req: Request) {
  let checkoutIdCriado: string | null = null;

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

const pagamentoExternalReference =
  `${matriculaExternalReference}_P1`;

const checkoutExpiraEm = new Date(
  Date.now() + 60 * 60 * 1000
);

    const origin = new URL(req.url).origin;

    /*
     * Cria somente uma sessão temporária de
     * Checkout. Não cria boleto antecipadamente.
     */
    const checkoutRes = await fetch(
      `${ASAAS_API_URL}/checkouts`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type":
            "application/json",
          access_token: ASAAS_API_KEY,
          "User-Agent": "PHANYX/1.0",
        },
        body: JSON.stringify({
          billingTypes: [
            "PIX",
            "CREDIT_CARD",
          ],

          chargeTypes: ["DETACHED"],

          minutesToExpire: 60,

          externalReference: pagamentoExternalReference,

          callback: {
            successUrl:
              `${origin}/ibe/matricula/checkout?retorno=sucesso`,

            cancelUrl:
              `${origin}/ibe/matricula/checkout?retorno=cancelado`,

            expiredUrl:
              `${origin}/ibe/matricula/checkout?retorno=expirado`,
          },

          items: [
            {
              name:
                "Matrícula online IBE",

              description:
                `Bacharel Livre em Teologia — ` +
                `${disciplinasIds.length} disciplina` +
                `${
                  disciplinasIds.length === 1
                    ? ""
                    : "s"
                }`,

              quantity: 1,
              value: valorTotalSeguro,
            },
          ],

        }),
      }
    );

    const checkout =
      await checkoutRes
        .json()
        .catch(() => null);

    if (!checkoutRes.ok) {
      console.error(
        "Erro Checkout Asaas:",
        checkout
      );

      return NextResponse.json(
        {
          error: obterMensagemErroAsaas(
            checkout,
            "Erro ao criar o Checkout no Asaas."
          ),
        },
        { status: 400 }
      );
    }

    if (!checkout?.id) {
      console.error(
        "Checkout sem identificador:",
        checkout
      );

      return NextResponse.json(
        {
          error:
            "O Asaas não retornou o identificador do Checkout.",
        },
        { status: 502 }
      );
    }

    const checkoutId = String(checkout.id);

checkoutIdCriado = checkoutId;

    /*
     * Algumas respostas podem trazer o link.
     * Caso não tragam, ele é montado usando
     * o identificador retornado.
     */
    const checkoutUrl =
      typeof checkout.link === "string" &&
      checkout.link.trim()
        ? checkout.link
        : `https://asaas.com/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;

    try {
      await prisma.matriculaOnlineIbe.create({
  data: {
    nome,
    email,
    whatsapp,
    cpf,

    valorTotal: valorTotalSeguro,
    valorPago: 0,

    disciplinasIds:
      JSON.stringify(disciplinasIds),

    modoPagamento: "UNICO",
    quantidadePartes: 1,

    externalReference:
      matriculaExternalReference,

    status: "AGUARDANDO_PAGAMENTO",

    pagamentos: {
      create: {
        ordem: 1,

        tipoIntegracao: "CHECKOUT",

        // Neste Checkout o aluno poderá escolher
        // Pix ou cartão de crédito.
        formaSolicitada: "PIX_CREDIT_CARD",

        valor: valorTotalSeguro,

        status:
          "AGUARDANDO_PAGAMENTO",

        externalReference:
          pagamentoExternalReference,

        asaasCheckoutId:
          checkoutId,

        checkoutUrl,

        expiraEm:
          checkoutExpiraEm,
      },
    },
  },
});
    } catch (databaseError) {
      console.error(
        "Erro ao registrar matrícula:",
        databaseError
      );

      /*
       * Evita deixar um Checkout sem registro
       * correspondente no PHANYX.
       */
      try {
        const cancelamentoRes =
          await fetch(
            `${ASAAS_API_URL}/checkouts/${checkoutIdCriado}/cancel`,
            {
              method: "POST",
              headers: {
                accept:
                  "application/json",
                access_token:
                  ASAAS_API_KEY,
                "User-Agent":
                  "PHANYX/1.0",
              },
            }
          );

        if (!cancelamentoRes.ok) {
          console.error(
            "Falha ao cancelar Checkout órfão:",
            await cancelamentoRes
              .text()
              .catch(() => "")
          );
        }
      } catch (cancelamentoError) {
        console.error(
          "Erro ao cancelar Checkout órfão:",
          cancelamentoError
        );
      }

      throw databaseError;
    }

    return NextResponse.json({
  checkoutId,

  externalReference:
    matriculaExternalReference,

  pagamentoExternalReference,

  checkoutUrl,
  valorTotal: valorTotalSeguro,
});
  } catch (error: any) {
    console.error(
      "Erro matrícula IBE:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao iniciar a matrícula.",
      },
      { status: 500 }
    );
  }
}