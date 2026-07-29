import { createHash, randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import {
  StatusLancamentoComissaoRH,
  StatusLancamentoRemuneracaoVariavelRH,
  StatusPagamentoHoleriteRH,
  TipoConfirmacaoRecebimentoHoleriteRH,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CHAVE_PERMISSAO = "rh.holerites_assinar";
const TAMANHO_MAXIMO_ARQUIVO = 10 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

function respostaSemCache(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function calcularSha256(valor: string | Buffer) {
  return createHash("sha256").update(valor).digest("hex");
}

function obterIp(req: NextRequest) {
  const encaminhado = req.headers.get("x-forwarded-for");

  return (
    encaminhado?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null
  );
}

function arquivoPossuiAssinaturaValida(
  buffer: Buffer,
  mimeInformado: string,
) {
  const ehPdf =
    buffer.length >= 5 &&
    buffer.subarray(0, 5).toString("ascii") === "%PDF-";

  const ehPng =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  const ehJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  if (mimeInformado === "application/pdf") return ehPdf;
  if (mimeInformado === "image/png") return ehPng;
  if (mimeInformado === "image/jpeg") return ehJpeg;

  return false;
}

function extensaoPorMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/png") return "png";
  return "jpg";
}

function usuarioEhAdministrador(user: {
  role: unknown;
  isMasterAdmin: boolean;
}) {
  const role = String(user.role || "").toUpperCase();

  return (
    role === "ADMIN" ||
    role === "SUPER_ADMIN" ||
    user.isMasterAdmin === true
  );
}

export async function POST(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      id: string;
    };
  },
) {
  let arquivoUrlCriado: string | null = null;

  try {
    const sessao = await getUserFromToken();

    if (!sessao?.id || !sessao.instituicaoId) {
      return respostaSemCache({ error: "Não autorizado." }, 401);
    }

    const instituicaoId = Number(sessao.instituicaoId);
    const usuarioId = Number(sessao.id);
    const holeriteId = Number(params.id);

    if (!Number.isInteger(holeriteId) || holeriteId <= 0) {
      return respostaSemCache(
        { error: "Informe um holerite válido." },
        400,
      );
    }

    const usuario = await prisma.user.findFirst({
      where: {
        id: usuarioId,
        instituicaoId,
        ativo: true,
      },

      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        isMasterAdmin: true,
      },
    });

    if (!usuario) {
      return respostaSemCache(
        {
          error:
            "Usuário não encontrado, inativo ou pertencente a outra instituição.",
        },
        401,
      );
    }

    const funcionarioRh = await prisma.funcionario.findFirst({
      where: {
        userId: usuario.id,
        instituicaoId,
      },

      select: {
        id: true,
        nome: true,
        cargo: true,

        permissoes: {
          where: {
            chave: CHAVE_PERMISSAO,
          },
          take: 1,
          select: {
            ativo: true,
          },
        },

        departamento: {
          select: {
            id: true,
            nome: true,

            permissoes: {
              where: {
                chave: CHAVE_PERMISSAO,
              },
              take: 1,
              select: {
                ativo: true,
              },
            },
          },
        },
      },
    });

    if (!funcionarioRh) {
      return respostaSemCache(
        {
          error:
            "Entre com o login individual do funcionário responsável pelo RH para enviar o documento assinado.",
          codigo:
            "RESPONSAVEL_RH_SEM_FUNCIONARIO_VINCULADO",
        },
        403,
      );
    }

    const permissaoIndividual = funcionarioRh.permissoes[0];
    const permissaoDepartamento =
      funcionarioRh.departamento?.permissoes[0];

    const autorizado =
      usuarioEhAdministrador(usuario) ||
      (permissaoIndividual
        ? permissaoIndividual.ativo
        : permissaoDepartamento?.ativo === true);

    if (!autorizado) {
      return respostaSemCache(
        {
          error:
            "Você não possui autorização para enviar recibos assinados manualmente.",
          codigo:
            "SEM_PERMISSAO_RECIBO_MANUAL",
        },
        403,
      );
    }

    const formData = await req.formData();

    const arquivoForm = formData.get("arquivo");
    const observacao = String(
      formData.get("observacao") || "",
    ).trim();

    const dataAssinaturaTexto = String(
      formData.get("dataAssinaturaDeclarada") || "",
    ).trim();

    if (!(arquivoForm instanceof File)) {
      return respostaSemCache(
        {
          error:
            "Selecione o documento assinado pelo funcionário.",
        },
        400,
      );
    }

    if (!TIPOS_PERMITIDOS.has(arquivoForm.type)) {
      return respostaSemCache(
        {
          error:
            "Envie um arquivo PDF, PNG, JPG ou JPEG.",
        },
        400,
      );
    }

    if (
      arquivoForm.size <= 0 ||
      arquivoForm.size > TAMANHO_MAXIMO_ARQUIVO
    ) {
      return respostaSemCache(
        {
          error:
            "O documento deve possuir até 10 MB.",
        },
        400,
      );
    }

    if (observacao.length < 10) {
      return respostaSemCache(
        {
          error:
            "Informe uma observação com pelo menos 10 caracteres sobre a assinatura manual.",
        },
        400,
      );
    }

    let dataAssinaturaDeclarada: Date | null = null;

    if (dataAssinaturaTexto) {
      const dataConvertida = new Date(dataAssinaturaTexto);

      if (Number.isNaN(dataConvertida.getTime())) {
        return respostaSemCache(
          {
            error:
              "Informe uma data válida para a assinatura manual.",
          },
          400,
        );
      }

      if (
        dataConvertida.getTime() >
        Date.now() + 5 * 60 * 1000
      ) {
        return respostaSemCache(
          {
            error:
              "A data da assinatura não pode estar no futuro.",
          },
          400,
        );
      }

      dataAssinaturaDeclarada = dataConvertida;
    }

    const arquivoBuffer = Buffer.from(
      await arquivoForm.arrayBuffer(),
    );

    if (
      !arquivoPossuiAssinaturaValida(
        arquivoBuffer,
        arquivoForm.type,
      )
    ) {
      return respostaSemCache(
        {
          error:
            "O conteúdo do arquivo não corresponde ao formato informado.",
        },
        400,
      );
    }

    const holerite = await prisma.holeriteRH.findFirst({
      where: {
        id: holeriteId,
        instituicaoId,
      },

      select: {
        id: true,
        funcionarioId: true,
        competenciaMes: true,
        competenciaAno: true,
        status: true,
        arquivado: true,
        cancelado: true,

        funcionario: {
          select: {
            id: true,
            nome: true,
            userId: true,
            user: {
              select: {
                id: true,
                ativo: true,
              },
            },
          },
        },

        eventos: {
          select: {
            id: true,
          },
        },

        pagamentos: {
          where: {
            status: {
              notIn: [
                StatusPagamentoHoleriteRH.CANCELADO,
                StatusPagamentoHoleriteRH.SUBSTITUIDO,
              ],
            },
          },
          orderBy: {
            registradoEm: "desc",
          },
          take: 1,
          select: {
            id: true,
            status: true,
            reciboNumero: true,
            valorPago: true,
            pagoEm: true,
            registradoPorId: true,
            dadosPagamentoHash: true,
            confirmadoPeloFuncionarioEm: true,
            tipoConfirmacaoRecebimento: true,

            documentosAssinadosManualmente: {
              where: {
                ativo: true,
              },
              take: 1,
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!holerite) {
      return respostaSemCache(
        {
          error:
            "Holerite não encontrado nesta instituição.",
        },
        404,
      );
    }

    if (
      holerite.arquivado ||
      holerite.cancelado ||
      ["ARQUIVADO", "CANCELADO"].includes(
        String(holerite.status || "").toUpperCase(),
      )
    ) {
      return respostaSemCache(
        {
          error:
            "Não é possível enviar documento para um holerite arquivado ou cancelado.",
        },
        400,
      );
    }

    if (holerite.funcionario.user?.ativo) {
      return respostaSemCache(
        {
          error:
            "Este funcionário possui acesso individual ativo ao PHANYX. Utilize o fluxo de assinatura digital.",
          codigo:
            "FUNCIONARIO_POSSUI_ACESSO_ATIVO",
        },
        409,
      );
    }

    const pagamento = holerite.pagamentos[0];

    if (!pagamento) {
      return respostaSemCache(
        {
          error:
            "Registre primeiro o pagamento e gere o recibo deste holerite.",
        },
        409,
      );
    }

    if (
      pagamento.status !==
      StatusPagamentoHoleriteRH.REGISTRADO
    ) {
      return respostaSemCache(
        {
          error:
            "Este recibo não está disponível para confirmação manual.",
        },
        409,
      );
    }

    if (
      pagamento.documentosAssinadosManualmente.length > 0
    ) {
      return respostaSemCache(
        {
          error:
            "Este recibo já possui um documento assinado manualmente.",
          codigo:
            "DOCUMENTO_MANUAL_JA_ENVIADO",
        },
        409,
      );
    }

    const storeId =
      process.env.RH_PONTO_STORE_ID?.trim();

    const tokenBlob =
      process.env.RH_PONTO_READ_WRITE_TOKEN?.trim();

    if (!storeId || !tokenBlob) {
      return respostaSemCache(
        {
          error:
            "O armazenamento privado de documentos do RH não está configurado.",
        },
        500,
      );
    }

    const arquivoHash = calcularSha256(arquivoBuffer);
    const extensao = extensaoPorMime(arquivoForm.type);

    const caminhoArquivo = [
      "rh-ponto",
      `instituicoes/${instituicaoId}`,
      `holerites/${holerite.id}`,
      "recibos-assinados-manualmente",
      `${randomUUID()}.${extensao}`,
    ].join("/");

    const blob = await put(caminhoArquivo, arquivoBuffer, {
      access: "private",
      storeId,
      token: tokenBlob,
      contentType: arquivoForm.type,
      addRandomSuffix: false,
    });

    arquivoUrlCriado = blob.url;

    const agora = new Date();
    const momentoConfirmacao =
      dataAssinaturaDeclarada || agora;

    const ipEnvio = obterIp(req);

    const userAgentEnvio = String(
      req.headers.get("user-agent") || "",
    ).slice(0, 2000);

    const confirmacaoHash = calcularSha256(
      JSON.stringify({
        instituicaoId,
        holeriteId: holerite.id,
        pagamentoId: pagamento.id,
        reciboNumero: pagamento.reciboNumero,
        funcionarioId: holerite.funcionarioId,
        funcionarioNome: holerite.funcionario.nome,
        valorPago: Number(pagamento.valorPago).toFixed(2),
        pagoEm: pagamento.pagoEm.toISOString(),
        dadosPagamentoHash: pagamento.dadosPagamentoHash,
        tipoConfirmacao:
          TipoConfirmacaoRecebimentoHoleriteRH.DOCUMENTO_MANUAL,
        arquivoHash,
        arquivoNome: arquivoForm.name,
        arquivoMime: arquivoForm.type,
        arquivoTamanho: arquivoForm.size,
        dataAssinaturaDeclarada:
          dataAssinaturaDeclarada?.toISOString() || null,
        enviadoPorUserId: usuario.id,
        enviadoPorFuncionarioId: funcionarioRh.id,
        enviadoPorNome: funcionarioRh.nome,
        enviadoPorEmail: usuario.email,
        observacao,
        ipEnvio,
        userAgentEnvio,
        criadoEm: agora.toISOString(),
      }),
    );

    const eventoIds = holerite.eventos.map(
      (evento) => evento.id,
    );

    const resultado = await prisma.$transaction(
      async (tx) => {
        const atualizacaoPagamento =
          await tx.pagamentoHoleriteRH.updateMany({
            where: {
              id: pagamento.id,
              instituicaoId,
              status:
                StatusPagamentoHoleriteRH.REGISTRADO,
              confirmadoPeloFuncionarioEm: null,
              tipoConfirmacaoRecebimento: null,
            },

            data: {
              status:
                StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
              tipoConfirmacaoRecebimento:
                TipoConfirmacaoRecebimentoHoleriteRH.DOCUMENTO_MANUAL,
              confirmadoPeloFuncionarioEm:
                momentoConfirmacao,
              confirmadoPorUserId: null,
              tokenAssinaturaHash: null,
              tokenAssinaturaExpiraEm: null,
            },
          });

        if (atualizacaoPagamento.count !== 1) {
          throw new Error(
            "Este recibo já foi confirmado ou alterado por outra solicitação.",
          );
        }

        const documento =
          await tx.documentoAssinadoManualHoleriteRH.create({
            data: {
              instituicaoId,
              funcionarioId:
                holerite.funcionarioId,
              holeriteId: holerite.id,
              pagamentoHoleriteId:
                pagamento.id,
              enviadoPorId: usuario.id,
              enviadoPorFuncionarioIdSnapshot:
                funcionarioRh.id,
              enviadoPorNomeSnapshot:
                funcionarioRh.nome,
              enviadoPorEmailSnapshot:
                usuario.email,
              arquivoUrl: arquivoUrlCriado!,
              arquivoNome: arquivoForm.name,
              arquivoMime: arquivoForm.type,
              arquivoTamanho: arquivoForm.size,
              arquivoHash,
              dataAssinaturaDeclarada,
              observacao,
              ipEnvio,
              userAgentEnvio:
                userAgentEnvio || null,
              confirmacaoHash,
            },
          });

        const atualizacaoHolerite =
          await tx.holeriteRH.updateMany({
            where: {
              id: holerite.id,
              instituicaoId,
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
              pagoEm: pagamento.pagoEm,
              pagoPorId:
                pagamento.registradoPorId ||
                usuario.id,
            },
          });

        if (atualizacaoHolerite.count !== 1) {
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
                instituicaoId,
                holeriteEventoId: {
                  in: eventoIds,
                },
                status:
                  StatusLancamentoComissaoRH.ENVIADO_HOLERITE,
              },

              data: {
                status:
                  StatusLancamentoComissaoRH.PAGO,
                pagoEm: pagamento.pagoEm,
              },
            });

          comissoesPagas = comissoes.count;

          const remuneracoes =
            await tx.lancamentoRemuneracaoVariavelRH.updateMany({
              where: {
                instituicaoId,
                holeriteEventoId: {
                  in: eventoIds,
                },
                status:
                  StatusLancamentoRemuneracaoVariavelRH.ENVIADO_HOLERITE,
              },

              data: {
                status:
                  StatusLancamentoRemuneracaoVariavelRH.PAGO,
                pagoEm: pagamento.pagoEm,
              },
            });

          remuneracoesPagas = remuneracoes.count;
        }

        await tx.historicoRH.create({
          data: {
            funcionarioId:
              holerite.funcionarioId,
            instituicaoId,
            criadoPorId: usuario.id,
            tipo:
              "RECIBO_HOLERITE_ASSINADO_MANUALMENTE_ENVIADO",
            titulo:
              "Recibo assinado manualmente enviado",
            descricao:
              `${funcionarioRh.nome} enviou o documento assinado manualmente por ` +
              `${holerite.funcionario.nome}, referente ao recibo ${pagamento.reciboNumero}.`,
            dataEvento: agora,
            observacoes: [
              `Documento ID: ${documento.id}`,
              `Pagamento ID: ${pagamento.id}`,
              `Holerite ID: ${holerite.id}`,
              `Recibo: ${pagamento.reciboNumero}`,
              `Funcionário recebedor ID: ${holerite.funcionarioId}`,
              `Responsável pelo envio - usuário ID: ${usuario.id}`,
              `Responsável pelo envio - funcionário ID: ${funcionarioRh.id}`,
              `Responsável pelo envio: ${funcionarioRh.nome}`,
              `Arquivo: ${arquivoForm.name}`,
              `MIME: ${arquivoForm.type}`,
              `Tamanho: ${arquivoForm.size} bytes`,
              `Arquivo SHA-256: ${arquivoHash}`,
              `Confirmação SHA-256: ${confirmacaoHash}`,
              dataAssinaturaDeclarada
                ? `Data declarada da assinatura: ${dataAssinaturaDeclarada.toISOString()}`
                : "Data declarada da assinatura: não informada",
              `IP: ${ipEnvio || "Não identificado"}`,
              `Comissões atualizadas: ${comissoesPagas}`,
              `Remunerações variáveis atualizadas: ${remuneracoesPagas}`,
              `Observação: ${observacao}`,
            ].join("\n"),
          },
        });

        return {
          documentoId: documento.id,
          comissoesPagas,
          remuneracoesPagas,
        };
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    return respostaSemCache({
      message:
        "Documento assinado manualmente enviado e recebimento confirmado com sucesso.",
      holeriteId: holerite.id,
      pagamentoId: pagamento.id,
      reciboNumero: pagamento.reciboNumero,
      documentoId: resultado.documentoId,
      tipoConfirmacao:
        TipoConfirmacaoRecebimentoHoleriteRH.DOCUMENTO_MANUAL,
      confirmadoEm: momentoConfirmacao,
      enviadoPor: {
        userId: usuario.id,
        funcionarioId: funcionarioRh.id,
        nome: funcionarioRh.nome,
        email: usuario.email,
      },
      comissoesPagas:
        resultado.comissoesPagas,
      remuneracoesPagas:
        resultado.remuneracoesPagas,
    });
  } catch (error: any) {
    if (arquivoUrlCriado) {
      const tokenBlob =
        process.env
          .RH_PONTO_READ_WRITE_TOKEN?.trim();

      if (tokenBlob) {
        await del(arquivoUrlCriado, {
          token: tokenBlob,
        }).catch((erroExclusao) => {
          console.error(
            "Não foi possível remover o documento manual órfão:",
            erroExclusao,
          );
        });
      }
    }

    console.error(
      "Erro ao enviar recibo assinado manualmente:",
      error,
    );

    return respostaSemCache(
      {
        error:
          error?.message ||
          "Erro ao enviar o recibo assinado manualmente.",
      },
      500,
    );
  }
}