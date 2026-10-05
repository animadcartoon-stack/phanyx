import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  temAlgumaPermissao,
} from "@/lib/server-auth";
import { planoTemRecurso } from "@/lib/plano-acesso";
import { criptografarCredencial } from "@/lib/crypto-credenciais";

export const dynamic = "force-dynamic";

const ROLES_LEITURA = [
  "ADMIN",
  "GERENCIA",
  "SUPER_ADMIN",
  "FINANCEIRO",
];

const ROLES_EDICAO = [
  "ADMIN",
  "GERENCIA",
  "SUPER_ADMIN",
];

const AMBIENTES = [
  "PRODUCAO",
  "HOMOLOGACAO",
  "SANDBOX",
];

function textoOuNull(valor: unknown) {
  if (valor === undefined || valor === null) {
    return null;
  }

  const texto = String(valor).trim();

  return texto || null;
}

function normalizarMaiusculo(
  valor: unknown,
  fallback = ""
) {
  const texto = String(valor ?? fallback)
    .trim()
    .toUpperCase();

  return texto || fallback;
}

function podeVerFinanceiro(
  usuario: Awaited<ReturnType<typeof getUserFromToken>>
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) return true;

  if (ROLES_LEITURA.includes(usuario.role)) {
    return true;
  }

  return temAlgumaPermissao(usuario, [
    "financeiro.ver",
    "financeiro.recebimentos",
    "caixa.ver",
  ]);
}

function podeEditarContas(
  usuario: Awaited<ReturnType<typeof getUserFromToken>>
) {
  if (!usuario) return false;

  if (usuario.isMasterAdmin) return true;

  return ROLES_EDICAO.includes(usuario.role);
}

function serializarConta(conta: any) {
  return {
    id: conta.id,
    nome: conta.nome,
    provedor: conta.provedor,
    tipo: conta.tipo,

    bancoCodigo: conta.bancoCodigo,
    agencia: conta.agencia,
    conta: conta.conta,
    contaDigito: conta.contaDigito,
    titularNome: conta.titularNome,
    titularDocumento: conta.titularDocumento,

    moeda: conta.moeda,

    contaExternaId: conta.contaExternaId,
    integracaoAtiva: conta.integracaoAtiva,
    statusIntegracao: conta.statusIntegracao,
    ambienteIntegracao: conta.ambienteIntegracao,

    suportaBoleto: conta.suportaBoleto,
    padraoRecebimentos: conta.padraoRecebimentos,
    ativa: conta.ativa,

    webhookUrl: conta.webhookUrl,
    webhookAtivo: conta.webhookAtivo,

    ultimaSincronizacaoEm: conta.ultimaSincronizacaoEm,

    credenciaisConfiguradas:
      Boolean(conta.credenciaisCriptografadas),

    webhookSecretConfigurado:
      Boolean(conta.webhookSecretCriptografado),

    createdAt: conta.createdAt,
    updatedAt: conta.updatedAt,
  };
}

function serializarCredenciais(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return null;
  }

  if (typeof valor === "string") {
    const texto = valor.trim();

    return texto || null;
  }

  return JSON.stringify(valor);
}

async function autenticar() {
  const usuario = await getUserFromToken();

  if (
    !usuario ||
    !usuario.instituicaoId ||
    !podeVerFinanceiro(usuario)
  ) {
    return {
      usuario: null,
      resposta: NextResponse.json(
        { error: "NAO_AUTORIZADO" },
        { status: 401 }
      ),
    };
  }

  if (
    !planoTemRecurso(
      usuario.plano || "ESSENCIAL",
      "FINANCEIRO"
    )
  ) {
    return {
      usuario: null,
      resposta: NextResponse.json(
        {
          error:
            "Seu plano não permite acessar o financeiro.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    usuario,
    resposta: null,
  };
}

export async function GET() {
  try {
    const { usuario, resposta } =
      await autenticar();

    if (!usuario) {
      return resposta!;
    }

    const contas =
      await prisma.contaFinanceiraInstituicao.findMany({
        where: {
          instituicaoId: usuario.instituicaoId!,
        },
        orderBy: [
          {
            padraoRecebimentos: "desc",
          },
          {
            ativa: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    return NextResponse.json({
      contas: contas.map(serializarConta),
    });
  } catch (error) {
    console.error(
      "Erro ao listar contas financeiras:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao listar contas financeiras.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest
) {
  try {
    const { usuario, resposta } =
      await autenticar();

    if (!usuario) {
      return resposta!;
    }

    if (!podeEditarContas(usuario)) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para configurar contas financeiras.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const nome = String(
      body?.nome || ""
    ).trim();

    const provedor = normalizarMaiusculo(
      body?.provedor
    );

    const tipo = normalizarMaiusculo(
      body?.tipo,
      "BANCO"
    );

    const moeda = normalizarMaiusculo(
      body?.moeda,
      "BRL"
    );

    const ambienteIntegracao =
      normalizarMaiusculo(
        body?.ambienteIntegracao,
        "PRODUCAO"
      );

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome da conta financeira.",
        },
        { status: 400 }
      );
    }

    if (!provedor) {
      return NextResponse.json(
        {
          error:
            "Informe o provedor financeiro.",
        },
        { status: 400 }
      );
    }

    if (
      !AMBIENTES.includes(
        ambienteIntegracao
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Ambiente de integração inválido.",
        },
        { status: 400 }
      );
    }

    const credenciaisTexto =
      serializarCredenciais(
        body?.credenciais
      );

    const webhookSecret =
      textoOuNull(body?.webhookSecret);

    const credenciaisCriptografadas =
      credenciaisTexto
        ? criptografarCredencial(
            credenciaisTexto
          )
        : null;

    const webhookSecretCriptografado =
      webhookSecret
        ? criptografarCredencial(
            webhookSecret
          )
        : null;

    const padraoRecebimentos =
      Boolean(body?.padraoRecebimentos);

    const conta =
      await prisma.$transaction(
        async (tx) => {
          if (padraoRecebimentos) {
            await tx.contaFinanceiraInstituicao.updateMany({
              where: {
                instituicaoId:
                  usuario.instituicaoId!,
                padraoRecebimentos: true,
              },
              data: {
                padraoRecebimentos: false,
              },
            });
          }

          return tx.contaFinanceiraInstituicao.create({
            data: {
              instituicaoId:
                usuario.instituicaoId!,

              nome,
              provedor,
              tipo,

              bancoCodigo:
                textoOuNull(
                  body?.bancoCodigo
                ),

              agencia:
                textoOuNull(
                  body?.agencia
                ),

              conta:
                textoOuNull(
                  body?.conta
                ),

              contaDigito:
                textoOuNull(
                  body?.contaDigito
                ),

              titularNome:
                textoOuNull(
                  body?.titularNome
                ),

              titularDocumento:
                textoOuNull(
                  body?.titularDocumento
                ),

              moeda,

              contaExternaId:
                textoOuNull(
                  body?.contaExternaId
                ),

              ambienteIntegracao,

              credenciaisCriptografadas,
              webhookSecretCriptografado,

              webhookUrl:
                textoOuNull(
                  body?.webhookUrl
                ),

              webhookAtivo:
                Boolean(
                  body?.webhookAtivo
                ),

              integracaoAtiva:
                Boolean(
                  body?.integracaoAtiva
                ) &&
                Boolean(
                  credenciaisCriptografadas
                ),

              statusIntegracao:
                credenciaisCriptografadas
                  ? "CONFIGURADA"
                  : "NAO_CONFIGURADA",

              suportaBoleto:
                Boolean(
                  body?.suportaBoleto
                ),

              padraoRecebimentos,

              ativa:
                body?.ativa === undefined
                  ? true
                  : Boolean(body.ativa),
            },
          });
        }
      );

    return NextResponse.json(
      {
        message:
          "Conta financeira cadastrada com sucesso.",
        conta: serializarConta(conta),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao cadastrar conta financeira:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao cadastrar conta financeira.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest
) {
  try {
    const { usuario, resposta } =
      await autenticar();

    if (!usuario) {
      return resposta!;
    }

    if (!podeEditarContas(usuario)) {
      return NextResponse.json(
        {
          error:
            "Sem permissão para alterar contas financeiras.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const id = Number(body?.id);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Conta financeira inválida.",
        },
        { status: 400 }
      );
    }

    const existente =
      await prisma.contaFinanceiraInstituicao.findFirst({
        where: {
          id,
          instituicaoId:
            usuario.instituicaoId!,
        },
      });

    if (!existente) {
      return NextResponse.json(
        {
          error:
            "Conta financeira não encontrada.",
        },
        { status: 404 }
      );
    }

    const dados: Record<
      string,
      unknown
    > = {};

    if (body?.nome !== undefined) {
      const nome = String(
        body.nome || ""
      ).trim();

      if (!nome) {
        return NextResponse.json(
          {
            error:
              "Informe o nome da conta financeira.",
          },
          { status: 400 }
        );
      }

      dados.nome = nome;
    }

    if (
      body?.provedor !== undefined
    ) {
      const provedor =
        normalizarMaiusculo(
          body.provedor
        );

      if (!provedor) {
        return NextResponse.json(
          {
            error:
              "Informe o provedor financeiro.",
          },
          { status: 400 }
        );
      }

      dados.provedor = provedor;
    }

    if (body?.tipo !== undefined) {
      dados.tipo =
        normalizarMaiusculo(
          body.tipo,
          "BANCO"
        );
    }

    if (body?.moeda !== undefined) {
      dados.moeda =
        normalizarMaiusculo(
          body.moeda,
          "BRL"
        );
    }

    if (
      body?.ambienteIntegracao !==
      undefined
    ) {
      const ambiente =
        normalizarMaiusculo(
          body.ambienteIntegracao
        );

      if (
        !AMBIENTES.includes(
          ambiente
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Ambiente de integração inválido.",
          },
          { status: 400 }
        );
      }

      dados.ambienteIntegracao =
        ambiente;
    }

    const camposTexto = [
      "bancoCodigo",
      "agencia",
      "conta",
      "contaDigito",
      "titularNome",
      "titularDocumento",
      "contaExternaId",
      "webhookUrl",
    ];

    for (const campo of camposTexto) {
      if (body?.[campo] !== undefined) {
        dados[campo] =
          textoOuNull(
            body[campo]
          );
      }
    }

    if (
      body?.credenciais !== undefined
    ) {
      const credenciaisTexto =
        serializarCredenciais(
          body.credenciais
        );

      dados.credenciaisCriptografadas =
        credenciaisTexto
          ? criptografarCredencial(
              credenciaisTexto
            )
          : null;

      dados.statusIntegracao =
        credenciaisTexto
          ? "CONFIGURADA"
          : "NAO_CONFIGURADA";

      if (!credenciaisTexto) {
        dados.integracaoAtiva =
          false;
      }
    }

    if (
      body?.webhookSecret !==
      undefined
    ) {
      const webhookSecret =
        textoOuNull(
          body.webhookSecret
        );

      dados.webhookSecretCriptografado =
        webhookSecret
          ? criptografarCredencial(
              webhookSecret
            )
          : null;

      if (!webhookSecret) {
        dados.webhookAtivo =
          false;
      }
    }

    const camposBooleanos = [
      "webhookAtivo",
      "integracaoAtiva",
      "suportaBoleto",
      "ativa",
    ];

    for (
      const campo
      of camposBooleanos
    ) {
      if (body?.[campo] !== undefined) {
        dados[campo] =
          Boolean(body[campo]);
      }
    }

    /*
     * VALIDACAO_CREDENCIAL_EFETIVA
     *
     * A integracao nunca pode ser ativada
     * sem credencial configurada.
     * O webhook nunca pode ser ativado
     * sem seu token secreto.
     */
    const possuiCredencialFinal =
      dados.credenciaisCriptografadas !==
      undefined
        ? Boolean(
            dados.credenciaisCriptografadas
          )
        : Boolean(
            existente.credenciaisCriptografadas
          );

    const possuiWebhookSecretFinal =
      dados.webhookSecretCriptografado !==
      undefined
        ? Boolean(
            dados.webhookSecretCriptografado
          )
        : Boolean(
            existente.webhookSecretCriptografado
          );

    const integracaoAtivaFinal =
      dados.integracaoAtiva !== undefined
        ? Boolean(
            dados.integracaoAtiva
          )
        : existente.integracaoAtiva;

    const webhookAtivoFinal =
      dados.webhookAtivo !== undefined
        ? Boolean(
            dados.webhookAtivo
          )
        : existente.webhookAtivo;

    if (
      integracaoAtivaFinal &&
      !possuiCredencialFinal
    ) {
      return NextResponse.json(
        {
          error:
            "Configure as credenciais antes de ativar a integração.",
        },
        { status: 400 }
      );
    }

    if (
      webhookAtivoFinal &&
      !possuiWebhookSecretFinal
    ) {
      return NextResponse.json(
        {
          error:
            "Configure o token do webhook antes de ativá-lo.",
        },
        { status: 400 }
      );
    }

    const alterarPadrao =
      body?.padraoRecebimentos !==
      undefined;

    const novoPadrao =
      Boolean(
        body?.padraoRecebimentos
      );

    const atualizada =
      await prisma.$transaction(
        async (tx) => {
          if (
            alterarPadrao &&
            novoPadrao
          ) {
            await tx.contaFinanceiraInstituicao.updateMany({
              where: {
                instituicaoId:
                  usuario.instituicaoId!,
                padraoRecebimentos:
                  true,
                id: {
                  not: id,
                },
              },
              data: {
                padraoRecebimentos:
                  false,
              },
            });
          }

          if (alterarPadrao) {
            dados.padraoRecebimentos =
              novoPadrao;
          }

          return tx.contaFinanceiraInstituicao.update({
            where: {
              id,
            },
            data: dados,
          });
        }
      );

    return NextResponse.json({
      message:
        "Conta financeira atualizada com sucesso.",
      conta:
        serializarConta(
          atualizada
        ),
    });
  } catch (error) {
    console.error(
      "Erro ao atualizar conta financeira:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar conta financeira.",
      },
      { status: 500 }
    );
  }
}
