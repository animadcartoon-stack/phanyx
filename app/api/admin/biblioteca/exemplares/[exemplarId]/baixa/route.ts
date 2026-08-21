import {
  AcaoAuditoriaBiblioteca,
  StatusEmprestimoBiblioteca,
  StatusExemplarBiblioteca,
  StatusManutencaoExemplarBiblioteca,
  StatusReservaBiblioteca,
} from "@prisma/client";

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ContextoRota = {
  params: {
    exemplarId: string;
  };
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  });
}

function falhar(
  status: number,
  mensagem: string,
  codigo: string
): never {
  throw new ErroBiblioteca(
    status,
    mensagem,
    codigo
  );
}

function obterExemplarId(
  params: ContextoRota["params"]
) {
  const exemplarId =
    Number(params.exemplarId);

  if (
    !Number.isInteger(exemplarId) ||
    exemplarId <= 0
  ) {
    falhar(
      400,
      "Exemplar inválido.",
      "EXEMPLAR_INVALIDO"
    );
  }

  return exemplarId;
}

function obterIp(
  request: NextRequest
) {
  const encaminhado =
    request.headers.get(
      "x-forwarded-for"
    );

  return (
    encaminhado
      ?.split(",")[0]
      ?.trim() ||
    request.headers.get(
      "x-real-ip"
    ) ||
    null
  );
}

function responderErro(
  erro: unknown
) {
  const resposta =
    respostaErroBiblioteca(
      erro
    );

  return responder(
    resposta.corpo,
    resposta.status
  );
}

/* =========================================================
   POST
   Realiza a baixa patrimonial/bibliográfica do exemplar
   ========================================================= */

export async function POST(
  request: NextRequest,
  { params }: ContextoRota
) {
  try {
    const usuario =
      await getUserFromToken();

    if (!usuario) {
      falhar(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(
        usuario
      );

    if (usuario.impersonacao) {
      falhar(
        403,
        "Não é permitido dar baixa em exemplares durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO"
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.exemplares.baixar"
    );

    const exemplarId =
      obterExemplarId(params);

    let corpo: {
      motivo?: unknown;
    };

    try {
      corpo =
        await request.json();
    } catch {
      falhar(
        400,
        "O corpo da requisição contém um JSON inválido.",
        "JSON_INVALIDO"
      );
    }

    const motivo =
      typeof corpo.motivo === "string"
        ? corpo.motivo.trim()
        : "";

    if (!motivo) {
      falhar(
        400,
        "Informe o motivo da baixa do exemplar.",
        "MOTIVO_BAIXA_OBRIGATORIO"
      );
    }

    if (motivo.length > 5_000) {
      falhar(
        400,
        "O motivo da baixa excede o limite permitido.",
        "MOTIVO_BAIXA_MUITO_LONGO"
      );
    }

    const ip =
      obterIp(request);

    const userAgent =
      request.headers.get(
        "user-agent"
      );

    const resultado =
      await prisma.$transaction(
        async (transacao) => {
          /*
           * Serializa alterações no exemplar.
           *
           * As futuras rotas de circulação
           * também deverão bloquear o exemplar
           * antes de emprestar/reservar.
           */
          await transacao.$queryRaw`
            SELECT "id"
            FROM "BibliotecaExemplar"
            WHERE "id" = ${exemplarId}
              AND "instituicaoId" = ${contexto.instituicaoId}
            FOR UPDATE
          `;

          const exemplar =
            await transacao
              .bibliotecaExemplar
              .findFirst({
                where: {
                  id: exemplarId,

                  instituicaoId:
                    contexto.instituicaoId,
                },

                select: {
                  id: true,
                  itemId: true,

                  tipo: true,
                  status: true,

                  codigoInterno: true,
                  codigoBarras: true,
                  numeroTombo: true,
                  patrimonio: true,

                  permiteEmprestimo:
                    true,

                  baixadoEm: true,
                  motivoBaixa: true,
                },
              });

          if (!exemplar) {
            falhar(
              404,
              "Exemplar não encontrado.",
              "EXEMPLAR_NAO_ENCONTRADO"
            );
          }

          if (
            exemplar.status ===
            StatusExemplarBiblioteca.BAIXADO ||
            exemplar.baixadoEm
          ) {
            falhar(
              409,
              "Este exemplar já foi baixado do acervo.",
              "EXEMPLAR_JA_BAIXADO"
            );
          }

          const manutencaoAberta =
            await transacao
              .bibliotecaManutencaoExemplar
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status:
                    StatusManutencaoExemplarBiblioteca.ABERTA,
                },

                select: {
                  id: true,
                  motivo: true,
                  iniciadaEm: true,
                },
              });

          if (
            exemplar.status ===
            StatusExemplarBiblioteca.MANUTENCAO ||
            manutencaoAberta
          ) {
            falhar(
              409,
              "Não é possível dar baixa neste exemplar enquanto existe uma manutenção em andamento. Conclua ou cancele a manutenção antes da baixa.",
              "EXEMPLAR_EM_MANUTENCAO"
            );
          }

          /*
           * Não permite baixar um exemplar
           * que ainda está com um usuário.
           */
          const emprestimoAberto =
            await transacao
              .bibliotecaEmprestimo
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status: {
                    in: [
                      StatusEmprestimoBiblioteca.ATIVO,
                      StatusEmprestimoBiblioteca.ATRASADO,
                    ],
                  },
                },

                select: {
                  id: true,
                  status: true,
                  usuarioId: true,
                  vencimentoEm: true,
                },
              });

          if (emprestimoAberto) {
            falhar(
              409,
              "Não é possível dar baixa neste exemplar porque existe um empréstimo em aberto. Registre a devolução antes da baixa.",
              "EXEMPLAR_COM_EMPRESTIMO_ABERTO"
            );
          }

          /*
           * Se existir reserva especificamente
           * vinculada a este exemplar, ela deve
           * ser resolvida antes da baixa.
           */
          const reservaAtiva =
            await transacao
              .bibliotecaReserva
              .findFirst({
                where: {
                  instituicaoId:
                    contexto.instituicaoId,

                  exemplarId,

                  status: {
                    in: [
                      StatusReservaBiblioteca.AGUARDANDO,
                      StatusReservaBiblioteca.DISPONIVEL,
                    ],
                  },
                },

                select: {
                  id: true,
                  status: true,
                  usuarioId: true,
                },
              });

          if (reservaAtiva) {
            falhar(
              409,
              "Não é possível dar baixa neste exemplar porque existe uma reserva ativa vinculada a ele.",
              "EXEMPLAR_COM_RESERVA_ATIVA"
            );
          }

          const agora =
            new Date();

          const atualizado =
            await transacao
              .bibliotecaExemplar
              .update({
                where: {
                  id: exemplar.id,
                },

                data: {
                  status:
                    StatusExemplarBiblioteca.BAIXADO,

                  baixadoEm:
                    agora,

                  motivoBaixa:
                    motivo,

                  permiteEmprestimo:
                    false,

                  atualizadoPorId:
                    usuario.id,
                },

                select: {
                  id: true,
                  itemId: true,

                  tipo: true,
                  status: true,

                  codigoInterno: true,
                  codigoBarras: true,
                  numeroTombo: true,
                  patrimonio: true,

                  permiteEmprestimo:
                    true,

                  baixadoEm: true,
                  motivoBaixa: true,

                  atualizadoEm: true,
                },
              });

          await transacao
            .bibliotecaAuditoria
            .create({
              data: {
                instituicaoId:
                  contexto.instituicaoId,

                usuarioId:
                  usuario.id,

                entidade:
                  "BibliotecaExemplar",

                entidadeId:
                  String(
                    exemplar.id
                  ),

                acao:
                  AcaoAuditoriaBiblioteca.BAIXAR,

                descricao:
                  "Baixa de exemplar realizada na Biblioteca Virtual.",

                dadosAnteriores: {
                  status:
                    exemplar.status,

                  codigoInterno:
                    exemplar.codigoInterno,

                  numeroTombo:
                    exemplar.numeroTombo,

                  patrimonio:
                    exemplar.patrimonio,

                  permiteEmprestimo:
                    exemplar.permiteEmprestimo,

                  baixadoEm:
                    exemplar.baixadoEm,

                  motivoBaixa:
                    exemplar.motivoBaixa,
                },

                dadosPosteriores: {
                  status:
                    atualizado.status,

                  codigoInterno:
                    atualizado.codigoInterno,

                  numeroTombo:
                    atualizado.numeroTombo,

                  patrimonio:
                    atualizado.patrimonio,

                  permiteEmprestimo:
                    atualizado.permiteEmprestimo,

                  baixadoEm:
                    atualizado.baixadoEm,

                  motivoBaixa:
                    atualizado.motivoBaixa,
                },

                metadados: {
                  origem:
                    "api_admin_biblioteca_exemplar_baixa",

                  itemId:
                    atualizado.itemId,
                },

                ip,
                userAgent,
              },
            });

          return atualizado;
        },
        {
          maxWait: 5_000,
          timeout: 10_000,
        }
      );

    return responder({
      ok: true,

      mensagem:
        "Baixa do exemplar realizada com sucesso.",

      exemplar:
        resultado,
    });
  } catch (erro) {
    return responderErro(
      erro
    );
  }
}