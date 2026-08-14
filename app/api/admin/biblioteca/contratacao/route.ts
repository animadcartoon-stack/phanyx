import { randomUUID } from "crypto";
import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  Prisma,
  StatusContratacaoModulo,
  StatusModuloAdicional,
  TipoModuloAdicional,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { obterPermissoesDoUsuario } from "@/lib/server-permissions";
import { criarCheckoutBibliotecaAsaas } from "@/lib/asaas";

import {
  listarPlanosBiblioteca,
  obterPlanoBiblioteca,
  obterValorMensalPlanoBiblioteca,
} from "@/lib/biblioteca-planos";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BYTES_POR_GB = 1024n * 1024n * 1024n;

function instituicaoValida(valor: unknown) {
  const instituicaoId = Number(valor);

  if (
    !Number.isInteger(instituicaoId) ||
    instituicaoId <= 0
  ) {
    return null;
  }

  return instituicaoId;
}

function possuiPermissao(
  permissoes: string[],
  ...chaves: string[]
) {
  return (
    permissoes.includes("*") ||
    chaves.some((chave) =>
      permissoes.includes(chave)
    )
  );
}

function bytesParaGb(bytes: bigint) {
  return Number(
    (
      Number(bytes) /
      Number(BYTES_POR_GB)
    ).toFixed(2)
  );
}

function somenteDigitos(valor: unknown) {
  return String(valor || "").replace(/\D/g, "");
}

function textoOpcional(valor: unknown) {
  const texto = String(valor || "").trim();

  return texto || undefined;
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

  const ano = partes.find(
    (parte) => parte.type === "year"
  )?.value;

  const mes = partes.find(
    (parte) => parte.type === "month"
  )?.value;

  const dia = partes.find(
    (parte) => parte.type === "day"
  )?.value;

  if (!ano || !mes || !dia) {
    throw new Error(
      "Não foi possível calcular a data da cobrança."
    );
  }

  return `${ano}-${mes}-${dia}`;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
          codigo: "NAO_AUTENTICADO",
        },
        { status: 401 }
      );
    }

    const instituicaoId = instituicaoValida(
      user.instituicaoId
    );

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição válida vinculada.",
          codigo: "INSTITUICAO_INVALIDA",
        },
        { status: 403 }
      );
    }

    const permissoes =
      await obterPermissoesDoUsuario(user);

    const podeVer = possuiPermissao(
      permissoes,
      "biblioteca.contratacao.ver",
      "biblioteca.contratacao.gerenciar",
      "biblioteca.contratacao.cancelar"
    );

    if (!podeVer) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para consultar a contratação da Biblioteca Virtual.",
          codigo: "SEM_PERMISSAO",
        },
        { status: 403 }
      );
    }

    const podeGerenciar =
      possuiPermissao(
        permissoes,
        "biblioteca.contratacao.gerenciar"
      ) && user.impersonacao !== true;

    const podeCancelar =
      possuiPermissao(
        permissoes,
        "biblioteca.contratacao.cancelar"
      ) && user.impersonacao !== true;

    const [
      modulo,
      contratacaoAtual,
      configuracao,
    ] = await Promise.all([
      prisma.moduloAdicionalInstituicao.findUnique({
        where: {
          instituicaoId_tipo: {
            instituicaoId,
            tipo:
              TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
          },
        },
        select: {
          id: true,
          plano: true,
          status: true,
          valorMensal: true,
          armazenamentoContratadoBytes: true,
          armazenamentoExtraBytes: true,
          inicioEm: true,
          testeGratisFimEm: true,
          proximaCobrancaEm: true,
          suspensoEm: true,
          canceladoEm: true,
          motivoSuspensao: true,
          motivoCancelamento: true,
          asaasSubscriptionId: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      }),

      prisma.moduloAdicionalContratacao.findFirst({
        where: {
          instituicaoId,
          tipo:
            TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
        },
        orderBy: {
          criadoEm: "desc",
        },
        select: {
          id: true,
          plano: true,
          status: true,
          valorMensal: true,
          armazenamentoContratadoBytes: true,
          checkoutUrl: true,
          checkoutExpiraEm: true,
          pagoEm: true,
          canceladoEm: true,
          expiradoEm: true,
          falhouEm: true,
          criadoEm: true,
          atualizadoEm: true,
        },
      }),

      prisma.bibliotecaConfiguracao.findUnique({
        where: {
          instituicaoId,
        },
        select: {
          armazenamentoUtilizadoBytes: true,
        },
      }),
    ]);

    const contratadoBytes = BigInt(
      modulo?.armazenamentoContratadoBytes ?? 0
    );

    const extraBytes = BigInt(
      modulo?.armazenamentoExtraBytes ?? 0
    );

    const utilizadoBytes = BigInt(
      configuracao?.armazenamentoUtilizadoBytes ??
        0
    );

    const limiteBytes =
      contratadoBytes + extraBytes;

    const disponivelCalculado =
      limiteBytes - utilizadoBytes;

    const disponivelBytes =
      disponivelCalculado > 0n
        ? disponivelCalculado
        : 0n;

    const checkoutValido = Boolean(
      contratacaoAtual?.status ===
        "AGUARDANDO_PAGAMENTO" &&
        contratacaoAtual.checkoutUrl &&
        contratacaoAtual.checkoutExpiraEm &&
        contratacaoAtual.checkoutExpiraEm.getTime() >
          Date.now()
    );

    return NextResponse.json({
      ok: true,

      planos: listarPlanosBiblioteca(),

      modulo: modulo
        ? {
            id: modulo.id,
            plano: modulo.plano,
            status: modulo.status,
            valorMensal: Number(
              modulo.valorMensal
            ),
            cortesia:
              Number(modulo.valorMensal) === 0,

            armazenamento: {
              contratadoBytes:
                contratadoBytes.toString(),
              contratadoGb:
                bytesParaGb(contratadoBytes),

              extraBytes: extraBytes.toString(),
              extraGb: bytesParaGb(extraBytes),

              limiteBytes: limiteBytes.toString(),
              limiteGb: bytesParaGb(limiteBytes),

              utilizadoBytes:
                utilizadoBytes.toString(),
              utilizadoGb:
                bytesParaGb(utilizadoBytes),

              disponivelBytes:
                disponivelBytes.toString(),
              disponivelGb:
                bytesParaGb(disponivelBytes),
            },

            inicioEm: modulo.inicioEm,
            testeGratisFimEm:
              modulo.testeGratisFimEm,
            proximaCobrancaEm:
              modulo.proximaCobrancaEm,
            suspensoEm: modulo.suspensoEm,
            canceladoEm: modulo.canceladoEm,
            motivoSuspensao:
              modulo.motivoSuspensao,
            motivoCancelamento:
              modulo.motivoCancelamento,

            possuiAssinaturaAsaas: Boolean(
              modulo.asaasSubscriptionId
            ),

            criadoEm: modulo.criadoEm,
            atualizadoEm: modulo.atualizadoEm,
          }
        : null,

      contratacaoAtual: contratacaoAtual
        ? {
            id: contratacaoAtual.id,
            plano: contratacaoAtual.plano,
            status: contratacaoAtual.status,
            valorMensal: Number(
              contratacaoAtual.valorMensal
            ),
            armazenamentoGb: bytesParaGb(
              BigInt(
                contratacaoAtual
                  .armazenamentoContratadoBytes
              )
            ),
            checkoutValido,
            checkoutUrl:
              podeGerenciar && checkoutValido
                ? contratacaoAtual.checkoutUrl
                : null,
            checkoutExpiraEm:
              contratacaoAtual.checkoutExpiraEm,
            pagoEm: contratacaoAtual.pagoEm,
            canceladoEm:
              contratacaoAtual.canceladoEm,
            expiradoEm:
              contratacaoAtual.expiradoEm,
            falhouEm: contratacaoAtual.falhouEm,
            criadoEm: contratacaoAtual.criadoEm,
            atualizadoEm:
              contratacaoAtual.atualizadoEm,
          }
        : null,

      permissoes: {
        podeGerenciar,
        podeCancelar,
        impersonacao: user.impersonacao === true,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao consultar contratação da biblioteca:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível consultar a contratação da Biblioteca Virtual.",
        codigo:
          "ERRO_CONSULTA_CONTRATACAO_BIBLIOTECA",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
) {
  let contratacaoCriadaId: string | null = null;
  let instituicaoProcessadaId: number | null =
    null;

  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
          codigo: "NAO_AUTENTICADO",
        },
        { status: 401 }
      );
    }

    const instituicaoId = instituicaoValida(
      user.instituicaoId
    );

    if (!instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição válida vinculada.",
          codigo: "INSTITUICAO_INVALIDA",
        },
        { status: 403 }
      );
    }

    instituicaoProcessadaId = instituicaoId;

    if (user.impersonacao === true) {
      return NextResponse.json(
        {
          error:
            "Não é permitido contratar módulos durante uma sessão de suporte por impersonação.",
          codigo:
            "CONTRATACAO_BLOQUEADA_IMPERSONACAO",
        },
        { status: 403 }
      );
    }

    const permissoes =
      await obterPermissoesDoUsuario(user);

    const podeGerenciar = possuiPermissao(
      permissoes,
      "biblioteca.contratacao.gerenciar"
    );

    if (!podeGerenciar) {
      return NextResponse.json(
        {
          error:
            "Você não possui permissão para contratar a Biblioteca Virtual.",
          codigo: "SEM_PERMISSAO",
        },
        { status: 403 }
      );
    }

    let body: {
      planoCodigo?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Os dados da contratação são inválidos.",
          codigo: "JSON_INVALIDO",
        },
        { status: 400 }
      );
    }

    const plano = obterPlanoBiblioteca(
      body?.planoCodigo
    );

    if (!plano) {
      return NextResponse.json(
        {
          error:
            "Selecione um plano válido para a Biblioteca Virtual.",
          codigo: "PLANO_INVALIDO",
        },
        { status: 400 }
      );
    }

    const instituicao =
      await prisma.instituicao.findFirst({
        where: {
          id: instituicaoId,
          ativo: true,
        },
        select: {
          id: true,
          nome: true,

          configuracaoInstituicao: {
            select: {
              nomeFantasia: true,
              razaoSocial: true,
              cnpj: true,
              telefone: true,
              email: true,
              cep: true,
              endereco: true,
              numero: true,
              cidade: true,
              responsavelNome: true,
            },
          },
        },
      });

    if (!instituicao) {
      return NextResponse.json(
        {
          error:
            "A instituição não foi encontrada ou está inativa.",
          codigo: "INSTITUICAO_NAO_ENCONTRADA",
        },
        { status: 404 }
      );
    }

    const configuracao =
      instituicao.configuracaoInstituicao;

    const cpfCnpj = somenteDigitos(
      configuracao?.cnpj
    );

    if (
      cpfCnpj.length !== 11 &&
      cpfCnpj.length !== 14
    ) {
      return NextResponse.json(
        {
          error:
            "Cadastre um CPF ou CNPJ válido nas configurações da instituição antes de contratar a biblioteca.",
          codigo: "CPF_CNPJ_NAO_CADASTRADO",
        },
        { status: 422 }
      );
    }

    const email = String(
      configuracao?.email || user.email || ""
    )
      .trim()
      .toLowerCase();

    if (
      !email ||
      !email.includes("@")
    ) {
      return NextResponse.json(
        {
          error:
            "Cadastre um e-mail válido nas configurações da instituição antes de contratar a biblioteca.",
          codigo: "EMAIL_NAO_CADASTRADO",
        },
        { status: 422 }
      );
    }

    const nomeCobranca = String(
      configuracao?.razaoSocial ||
        configuracao?.nomeFantasia ||
        configuracao?.responsavelNome ||
        instituicao.nome
    ).trim();

    if (!nomeCobranca) {
      return NextResponse.json(
        {
          error:
            "Cadastre o nome ou a razão social da instituição antes de contratar a biblioteca.",
          codigo: "NOME_COBRANCA_INVALIDO",
        },
        { status: 422 }
      );
    }

    const agora = new Date();

    const limiteProcessamento = new Date(
      agora.getTime() - 10 * 60 * 1000
    );

    const chaveVigente =
      `BIBLIOTECA_VIRTUAL:${instituicaoId}`;

    await prisma.moduloAdicionalContratacao.updateMany({
      where: {
        instituicaoId,
        tipo:
          TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
        chaveVigente: {
          not: null,
        },
        status: {
          in: [
            StatusContratacaoModulo.CRIADA,
            StatusContratacaoModulo
              .AGUARDANDO_PAGAMENTO,
          ],
        },
        OR: [
          {
            checkoutExpiraEm: {
              lte: agora,
            },
          },
          {
            status:
              StatusContratacaoModulo.CRIADA,
            criadoEm: {
              lte: limiteProcessamento,
            },
          },
        ],
      },
      data: {
        status:
          StatusContratacaoModulo.EXPIRADA,
        chaveVigente: null,
        expiradoEm: agora,
      },
    });

    const [
      moduloExistente,
      contratacaoVigente,
    ] = await Promise.all([
      prisma.moduloAdicionalInstituicao.findUnique({
        where: {
          instituicaoId_tipo: {
            instituicaoId,
            tipo:
              TipoModuloAdicional
                .BIBLIOTECA_VIRTUAL,
          },
        },
        select: {
          id: true,
          plano: true,
          status: true,
        },
      }),

      prisma.moduloAdicionalContratacao.findUnique({
        where: {
          chaveVigente,
        },
        select: {
          id: true,
          plano: true,
          status: true,
          checkoutUrl: true,
          checkoutExpiraEm: true,
        },
      }),
    ]);

    if (
      moduloExistente &&
      [
        StatusModuloAdicional.ATIVO,
        StatusModuloAdicional.TESTE_GRATIS,
        StatusModuloAdicional.EM_ATRASO,
      ].includes(moduloExistente.status)
    ) {
      return NextResponse.json(
        {
          error:
            "A Biblioteca Virtual já está ativa para esta instituição.",
          codigo: "BIBLIOTECA_JA_ATIVA",
          modulo: {
            id: moduloExistente.id,
            plano: moduloExistente.plano,
            status: moduloExistente.status,
          },
        },
        { status: 409 }
      );
    }

    if (
      moduloExistente?.status ===
      StatusModuloAdicional.SUSPENSO
    ) {
      return NextResponse.json(
        {
          error:
            "A Biblioteca Virtual está suspensa. Regularize ou reative a contratação existente antes de iniciar uma nova.",
          codigo: "BIBLIOTECA_SUSPENSA",
        },
        { status: 409 }
      );
    }

    if (contratacaoVigente) {
      const checkoutAindaValido = Boolean(
        contratacaoVigente.status ===
          StatusContratacaoModulo
            .AGUARDANDO_PAGAMENTO &&
          contratacaoVigente.checkoutUrl &&
          contratacaoVigente.checkoutExpiraEm &&
          contratacaoVigente.checkoutExpiraEm.getTime() >
            Date.now()
      );

      if (checkoutAindaValido) {
        return NextResponse.json({
          ok: true,
          reutilizado: true,
          contratacaoId:
            contratacaoVigente.id,
          plano: contratacaoVigente.plano,
          checkoutUrl:
            contratacaoVigente.checkoutUrl,
          checkoutExpiraEm:
            contratacaoVigente.checkoutExpiraEm,
        });
      }

      return NextResponse.json(
        {
          ok: true,
          emProcessamento: true,
          contratacaoId:
            contratacaoVigente.id,
          codigo:
            "CONTRATACAO_EM_PROCESSAMENTO",
          retryAfterSeconds: 15,
        },
        { status: 202 }
      );
    }

    const valorMensal =
      obterValorMensalPlanoBiblioteca(plano);

    const contratacaoId = randomUUID();

    const externalReference =
      `PHANYX_BIBLIOTECA:${contratacaoId}`;

    const preparacao =
      await prisma.$transaction(
        async (tx) => {
          const moduloAtual =
            await tx.moduloAdicionalInstituicao.findUnique({
              where: {
                instituicaoId_tipo: {
                  instituicaoId,
                  tipo:
                    TipoModuloAdicional
                      .BIBLIOTECA_VIRTUAL,
                },
              },
              select: {
                id: true,
                status: true,
              },
            });

          if (
            moduloAtual &&
            [
              StatusModuloAdicional.ATIVO,
              StatusModuloAdicional.TESTE_GRATIS,
              StatusModuloAdicional.EM_ATRASO,
              StatusModuloAdicional.SUSPENSO,
            ].includes(moduloAtual.status)
          ) {
            return {
              bloqueado: true as const,
              status: moduloAtual.status,
            };
          }

          const dadosModulo = {
            plano: plano.codigo,
            status:
              StatusModuloAdicional.PENDENTE,
            valorMensal:
              valorMensal.toFixed(2),

            armazenamentoContratadoBytes:
              plano.armazenamentoBytes,

            armazenamentoExtraBytes: 0n,

            inicioEm: null,
            testeGratisFimEm: null,
            proximaCobrancaEm: null,
            suspensoEm: null,
            canceladoEm: null,

            motivoSuspensao: null,
            motivoCancelamento: null,

            asaasSubscriptionId: null,
            asaasCustomerId: null,
            asaasBillingType: "CREDIT_CARD",
            asaasCycle: "MONTHLY",

            atualizadoPorId: user.id,
          };

          const modulo = moduloAtual
            ? await tx.moduloAdicionalInstituicao.update({
                where: {
                  id: moduloAtual.id,
                },
                data: dadosModulo,
              })
            : await tx.moduloAdicionalInstituicao.create({
                data: {
                  instituicaoId,
                  tipo:
                    TipoModuloAdicional
                      .BIBLIOTECA_VIRTUAL,

                  ...dadosModulo,

                  criadoPorId: user.id,
                },
              });

          const contratacao =
            await tx.moduloAdicionalContratacao.create({
              data: {
                id: contratacaoId,
                moduloId: modulo.id,
                instituicaoId,
                tipo:
                  TipoModuloAdicional
                    .BIBLIOTECA_VIRTUAL,

                plano: plano.codigo,
                status:
                  StatusContratacaoModulo.CRIADA,

                valorMensal:
                  valorMensal.toFixed(2),

                armazenamentoContratadoBytes:
                  plano.armazenamentoBytes,

                chaveVigente,
                externalReference,
                solicitadoPorId: user.id,
              },
              select: {
                id: true,
                externalReference: true,
              },
            });

          return {
            bloqueado: false as const,
            contratacao,
          };
        }
      );

    if (preparacao.bloqueado) {
      return NextResponse.json(
        {
          error:
            "A situação atual da biblioteca não permite iniciar uma nova contratação.",
          codigo:
            "CONTRATACAO_NAO_PERMITIDA",
          statusModulo: preparacao.status,
        },
        { status: 409 }
      );
    }

    contratacaoCriadaId =
      preparacao.contratacao.id;

    const checkout =
      await criarCheckoutBibliotecaAsaas({
        contratacaoId:
          preparacao.contratacao.id,

        externalReference:
          preparacao.contratacao
            .externalReference,

        planoNome: plano.nome,
        armazenamentoGb:
          plano.armazenamentoGb,
        valorMensal,
        nextDueDate: dataHojeSaoPaulo(),

        nomeResponsavel: nomeCobranca,
        email,
        cpfCnpj,

        telefone: textoOpcional(
          somenteDigitos(
            configuracao?.telefone
          )
        ),

        postalCode: textoOpcional(
          somenteDigitos(configuracao?.cep)
        ),

        address: textoOpcional(
          configuracao?.endereco
        ),

        addressNumber: textoOpcional(
          configuracao?.numero
        ),

        city: textoOpcional(
          configuracao?.cidade
        ),
      });

    const checkoutExpiraEm = new Date(
      Date.now() + 120 * 60 * 1000
    );

    await prisma.moduloAdicionalContratacao.updateMany({
      where: {
        id: preparacao.contratacao.id,
        instituicaoId,
        status:
          StatusContratacaoModulo.CRIADA,
      },
      data: {
        status:
          StatusContratacaoModulo
            .AGUARDANDO_PAGAMENTO,

        asaasCheckoutId: checkout.id,
        checkoutUrl: checkout.url,
        checkoutExpiraEm,
        ultimoErro: null,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        contratacaoId:
          preparacao.contratacao.id,
        plano: plano.codigo,
        valorMensal,
        armazenamentoGb:
          plano.armazenamentoGb,
        checkoutUrl: checkout.url,
        checkoutExpiraEm,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      contratacaoCriadaId &&
      instituicaoProcessadaId
    ) {
      try {
        const mensagem =
          error instanceof Error
            ? error.message.slice(0, 2000)
            : "Falha desconhecida ao criar checkout.";

        await prisma.moduloAdicionalContratacao.updateMany({
          where: {
            id: contratacaoCriadaId,
            instituicaoId:
              instituicaoProcessadaId,
            status:
              StatusContratacaoModulo.CRIADA,
          },
          data: {
            status:
              StatusContratacaoModulo.FALHA,
            chaveVigente: null,
            falhouEm: new Date(),
            ultimoErro: mensagem,
          },
        });
      } catch (erroAtualizacao) {
        console.error(
          "Erro ao registrar falha da contratação da biblioteca:",
          erroAtualizacao
        );
      }
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Já existe uma contratação da Biblioteca Virtual em andamento. Atualize a página para continuar.",
          codigo:
            "CONTRATACAO_BIBLIOTECA_DUPLICADA",
        },
        { status: 409 }
      );
    }

    console.error(
      "Erro ao iniciar contratação da biblioteca:",
      {
        contratacaoId:
          contratacaoCriadaId,
        mensagem:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      }
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível iniciar o checkout da Biblioteca Virtual.",
        codigo:
          "ERRO_CHECKOUT_BIBLIOTECA",
      },
      {
        status: contratacaoCriadaId
          ? 502
          : 500,
      }
    );
  }
}