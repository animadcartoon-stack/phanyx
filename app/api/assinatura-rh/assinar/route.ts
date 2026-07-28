import {
  createHash,
  randomUUID,
} from "crypto";
import {
  del,
  put,
} from "@vercel/blob";
import {
  StatusLancamentoComissaoRH,
  StatusLancamentoRemuneracaoVariavelRH,
  StatusPagamentoHoleriteRH,
} from "@prisma/client";
import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const TAMANHO_MAXIMO_ASSINATURA =
  2 * 1024 * 1024;

function calcularSha256(
  valor: string | Buffer,
) {
  return createHash("sha256")
    .update(valor)
    .digest("hex");
}

function somenteNumeros(valor: unknown) {
  return String(valor || "").replace(
    /\D/g,
    "",
  );
}

function normalizarNome(valor: unknown) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cpfValido(valor: unknown) {
  const cpf = somenteNumeros(valor);

  if (
    cpf.length !== 11 ||
    /^(\d)\1{10}$/.test(cpf)
  ) {
    return false;
  }

  function calcularDigito(
    quantidade: number,
  ) {
    let soma = 0;

    for (
      let indice = 0;
      indice < quantidade;
      indice += 1
    ) {
      soma +=
        Number(cpf[indice]) *
        (quantidade + 1 - indice);
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  }

  const primeiroDigito =
    calcularDigito(9);

  const segundoDigito =
    calcularDigito(10);

  return (
    primeiroDigito === Number(cpf[9]) &&
    segundoDigito === Number(cpf[10])
  );
}

function obterIp(req: NextRequest) {
  const encaminhado = req.headers.get(
    "x-forwarded-for",
  );

  const primeiroIp = encaminhado
    ?.split(",")[0]
    ?.trim();

  return (
    primeiroIp ||
    req.headers.get("x-real-ip") ||
    null
  );
}

function extrairAssinaturaPng(
  assinaturaBase64: string,
) {
  const correspondencia =
    assinaturaBase64.match(
      /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/,
    );

  if (!correspondencia) {
    return null;
  }

  const buffer = Buffer.from(
    correspondencia[1],
    "base64",
  );

  const assinaturaPngValida =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  if (!assinaturaPngValida) {
    return null;
  }

  return buffer;
}

export async function POST(
  req: NextRequest,
) {
  let assinaturaImagemUrl:
    | string
    | null = null;

  try {
    const body = await req.json();

    const token = String(
      body.token || "",
    ).trim();

    const nome = String(
      body.nome || "",
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 200);

    const cpf = somenteNumeros(body.cpf);

    const tipoAssinatura = String(
      body.tipoAssinatura || "",
    )
      .trim()
      .toUpperCase();

    const assinaturaBase64 = String(
      body.assinaturaBase64 || "",
    ).trim();

    const aceitouTermos =
      body.aceitouTermos === true;

    if (
      !token ||
      token.length < 20 ||
      token.length > 200
    ) {
      return NextResponse.json(
        {
          error:
            "Link de assinatura inválido ou expirado.",
        },
        {
          status: 400,
        },
      );
    }

    if (nome.length < 3) {
      return NextResponse.json(
        {
          error:
            "Informe seu nome completo.",
        },
        {
          status: 400,
        },
      );
    }

    if (!cpfValido(cpf)) {
      return NextResponse.json(
        {
          error:
            "Informe um CPF válido.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !["DESENHO", "DIGITAL"].includes(
        tipoAssinatura,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Informe uma forma de assinatura válida.",
        },
        {
          status: 400,
        },
      );
    }

    if (!aceitouTermos) {
      return NextResponse.json(
        {
          error:
            "É necessário declarar que conferiu o recibo e reconhece o recebimento.",
        },
        {
          status: 400,
        },
      );
    }

    const assinaturaBuffer =
      extrairAssinaturaPng(
        assinaturaBase64,
      );

    if (!assinaturaBuffer) {
      return NextResponse.json(
        {
          error:
            "A imagem da assinatura é inválida.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      assinaturaBuffer.length >
      TAMANHO_MAXIMO_ASSINATURA
    ) {
      return NextResponse.json(
        {
          error:
            "A assinatura não pode ultrapassar 2 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const tokenAssinaturaHash =
      calcularSha256(token);

    const pagamento =
      await prisma.pagamentoHoleriteRH.findFirst({
        where: {
          tokenAssinaturaHash,
        },

        select: {
          id: true,
          instituicaoId: true,
          funcionarioId: true,
          holeriteId: true,
          registradoPorId: true,

          status: true,
          reciboNumero: true,
          valorPago: true,
          pagoEm: true,

          dadosPagamentoHash: true,

          funcionarioNomeSnapshot: true,
          funcionarioCpfSnapshot: true,

          tokenAssinaturaExpiraEm: true,
          confirmadoPeloFuncionarioEm: true,

          funcionario: {
            select: {
              id: true,
              nome: true,
              cpf: true,
              userId: true,

              user: {
                select: {
                  id: true,
                  ativo: true,
                },
              },
            },
          },

          holerite: {
            select: {
              id: true,
              status: true,
              arquivado: true,
              cancelado: true,

              eventos: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      });

    if (!pagamento) {
      return NextResponse.json(
        {
          error:
            "Link de assinatura inválido ou expirado.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      pagamento.status !==
        StatusPagamentoHoleriteRH.REGISTRADO ||
      pagamento
        .confirmadoPeloFuncionarioEm
    ) {
      return NextResponse.json(
        {
          error:
            "Este recibo já foi assinado ou não está mais disponível.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      !pagamento
        .tokenAssinaturaExpiraEm ||
      pagamento
        .tokenAssinaturaExpiraEm
        .getTime() < Date.now()
    ) {
      return NextResponse.json(
        {
          error:
            "Este link expirou. Solicite um novo link ao RH.",
        },
        {
          status: 410,
        },
      );
    }

    if (
      pagamento.holerite.arquivado ||
      pagamento.holerite.cancelado ||
      ["ARQUIVADO", "CANCELADO"].includes(
        String(
          pagamento.holerite.status || "",
        ).toUpperCase(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Este holerite foi arquivado ou cancelado.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !pagamento.funcionario.user.ativo
    ) {
      return NextResponse.json(
        {
          error:
            "O usuário deste funcionário está inativo.",
        },
        {
          status: 403,
        },
      );
    }

    const cpfEsperado = somenteNumeros(
      pagamento
        .funcionarioCpfSnapshot ||
        pagamento.funcionario.cpf,
    );

    if (!cpfEsperado) {
      return NextResponse.json(
        {
          error:
            "O CPF do funcionário não está cadastrado. Solicite a atualização ao RH.",
        },
        {
          status: 400,
        },
      );
    }

    if (cpf !== cpfEsperado) {
      return NextResponse.json(
        {
          error:
            "O CPF informado não corresponde ao funcionário deste recibo.",
        },
        {
          status: 403,
        },
      );
    }

    const nomeEsperado =
      pagamento
        .funcionarioNomeSnapshot ||
      pagamento.funcionario.nome;

    if (
      normalizarNome(nome) !==
      normalizarNome(nomeEsperado)
    ) {
      return NextResponse.json(
        {
          error:
            "O nome informado não corresponde ao funcionário deste recibo.",
        },
        {
          status: 403,
        },
      );
    }

    const storeId =
      process.env
        .RH_PONTO_STORE_ID?.trim();

    const tokenBlob =
      process.env
        .RH_PONTO_READ_WRITE_TOKEN?.trim();

    if (!storeId || !tokenBlob) {
      return NextResponse.json(
        {
          error:
            "O armazenamento privado de documentos do RH não está configurado.",
        },
        {
          status: 500,
        },
      );
    }

    const assinaturaImagemHash =
      calcularSha256(
        assinaturaBuffer,
      );

    const caminhoAssinatura = [
      "rh-ponto",
      `instituicoes/${pagamento.instituicaoId}`,
      `holerites/${pagamento.holeriteId}`,
      "assinaturas",
      `${randomUUID()}.png`,
    ].join("/");

    const blob = await put(
      caminhoAssinatura,
      assinaturaBuffer,
      {
        access: "private",
        storeId,
        token: tokenBlob,
        contentType: "image/png",
        addRandomSuffix: false,
      },
    );

    assinaturaImagemUrl = blob.url;

    const agora = new Date();
    const ipConfirmacao = obterIp(req);

    const userAgentConfirmacao = String(
      req.headers.get("user-agent") || "",
    ).slice(0, 2000);

    const confirmacaoHash =
      calcularSha256(
        JSON.stringify({
          pagamentoId: pagamento.id,
          holeriteId:
            pagamento.holeriteId,
          funcionarioId:
            pagamento.funcionarioId,

          reciboNumero:
            pagamento.reciboNumero,

          valorPago: Number(
            pagamento.valorPago,
          ).toFixed(2),

          pagoEm:
            pagamento.pagoEm.toISOString(),

          dadosPagamentoHash:
            pagamento.dadosPagamentoHash,

          nome,
          cpf,
          tipoAssinatura,

          assinaturaImagemHash,

          confirmadoEm:
            agora.toISOString(),

          ipConfirmacao,
          userAgentConfirmacao,

          aceitouTermos: true,
        }),
      );

    const eventoIds =
      pagamento.holerite.eventos.map(
        (evento) => evento.id,
      );

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const atualizacaoPagamento =
            await tx.pagamentoHoleriteRH.updateMany({
              where: {
                id: pagamento.id,

                status:
                  StatusPagamentoHoleriteRH.REGISTRADO,

                confirmadoPeloFuncionarioEm:
                  null,

                tokenAssinaturaHash,
              },

              data: {
                status:
                  StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,

                confirmadoPeloFuncionarioEm:
                  agora,

                confirmadoPorUserId:
                  pagamento.funcionario
                    .userId,

                tipoAssinatura,

                assinaturaImagemUrl,
                assinaturaImagemHash,

                ipConfirmacao,

                userAgentConfirmacao:
                  userAgentConfirmacao ||
                  null,

                confirmacaoHash,
              },
            });

          if (
            atualizacaoPagamento.count !== 1
          ) {
            throw new Error(
              "Este recibo já foi processado por outra solicitação.",
            );
          }

          const atualizacaoHolerite =
            await tx.holeriteRH.updateMany({
              where: {
                id: pagamento.holeriteId,
                instituicaoId:
                  pagamento.instituicaoId,

                arquivado: false,
                cancelado: false,

                status: {
                  notIn: [
                    "PAGO",
                    "ARQUIVADO",
                    "CANCELADO",
                  ],
                },
              },

              data: {
                status: "PAGO",

                pagoEm:
                  pagamento.pagoEm,

                pagoPorId:
                  pagamento.registradoPorId,
              },
            });

          if (
            atualizacaoHolerite.count !== 1
          ) {
            throw new Error(
              "O holerite foi alterado e não pôde ser confirmado como pago.",
            );
          }

          let comissoesPagas = 0;
          let remuneracoesPagas = 0;

          if (eventoIds.length > 0) {
            const comissoes =
              await tx.lancamentoComissaoRH.updateMany({
                where: {
                  instituicaoId:
                    pagamento.instituicaoId,

                  holeriteEventoId: {
                    in: eventoIds,
                  },

                  status:
                    StatusLancamentoComissaoRH.ENVIADO_HOLERITE,
                },

                data: {
                  status:
                    StatusLancamentoComissaoRH.PAGO,

                  pagoEm:
                    pagamento.pagoEm,
                },
              });

            comissoesPagas =
              comissoes.count;

            const remuneracoes =
              await tx.lancamentoRemuneracaoVariavelRH.updateMany(
                {
                  where: {
                    instituicaoId:
                      pagamento.instituicaoId,

                    holeriteEventoId: {
                      in: eventoIds,
                    },

                    status:
                      StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE,
                  },

                  data: {
                    status:
                      StatusLancamentoRemuneracaoVariavelRH.PAGO,

                    pagoEm:
                      pagamento.pagoEm,
                  },
                },
              );

            remuneracoesPagas =
              remuneracoes.count;
          }

          await tx.historicoRH.create({
            data: {
              funcionarioId:
                pagamento.funcionarioId,

              instituicaoId:
                pagamento.instituicaoId,

              criadoPorId:
                pagamento.funcionario
                  .userId,

              tipo:
                "RECIBO_PAGAMENTO_HOLERITE_ASSINADO",

              titulo:
                "Recebimento confirmado pelo funcionário",

              descricao:
                `${nome} assinou o recibo ` +
                `${pagamento.reciboNumero} e confirmou o recebimento do holerite.`,

              dataEvento: agora,

              observacoes: [
                `Pagamento ID: ${pagamento.id}`,
                `Holerite ID: ${pagamento.holeriteId}`,
                `Tipo de assinatura: ${tipoAssinatura}`,
                `Valor confirmado: R$ ${Number(
                  pagamento.valorPago,
                ).toFixed(2)}`,
                `Assinatura SHA-256: ${assinaturaImagemHash}`,
                `Confirmação SHA-256: ${confirmacaoHash}`,
                `IP: ${ipConfirmacao || "Não identificado"}`,
                `Comissões atualizadas: ${comissoesPagas}`,
                `Remunerações variáveis atualizadas: ${remuneracoesPagas}`,
              ].join("\n"),
            },
          });

          return {
            comissoesPagas,
            remuneracoesPagas,
          };
        },
        {
          maxWait: 10_000,
          timeout: 30_000,
        },
      );

    return NextResponse.json({
      message:
        "Recibo assinado e recebimento confirmado com sucesso.",

      pagamentoId: pagamento.id,
      holeriteId:
        pagamento.holeriteId,

      reciboNumero:
        pagamento.reciboNumero,

      confirmadoEm: agora,

      status:
        StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,

      comissoesPagas:
        resultado.comissoesPagas,

      remuneracoesPagas:
        resultado.remuneracoesPagas,
    });
  } catch (error: any) {
    if (assinaturaImagemUrl) {
      const tokenBlob =
        process.env
          .RH_PONTO_READ_WRITE_TOKEN?.trim();

      if (tokenBlob) {
        await del(
          assinaturaImagemUrl,
          {
            token: tokenBlob,
          },
        ).catch(
          (erroExclusao) => {
            console.error(
              "Não foi possível remover a assinatura órfã:",
              erroExclusao,
            );
          },
        );
      }
    }

    console.error(
      "Erro ao assinar recibo de pagamento:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao assinar o recibo de pagamento.",
      },
      {
        status: 500,
      },
    );
  }
}