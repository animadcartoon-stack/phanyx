import { createHash, randomUUID } from "crypto";
import { del, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { StatusPagamentoHoleriteRH } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const CHAVE_PERMISSAO_ASSINATURA_RH =
  "rh.holerites_assinar";

const TAMANHO_MAXIMO_ASSINATURA =
  2 * 1024 * 1024;

function calcularSha256(
  valor: string | Buffer,
) {
  return createHash("sha256")
    .update(valor)
    .digest("hex");
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

function usuarioEhAdministrador(user: {
  role: unknown;
  isMasterAdmin: boolean;
}) {
  const role = String(
    user.role || "",
  ).toUpperCase();

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
  let assinaturaRhImagemUrl:
    | string
    | null = null;

  try {
    const sessao =
      await getUserFromToken();

    if (
      !sessao ||
      !sessao.id ||
      !sessao.instituicaoId
    ) {
      return NextResponse.json(
        {
          error: "Não autorizado.",
        },
        {
          status: 401,
        },
      );
    }

    const instituicaoId = Number(
      sessao.instituicaoId,
    );

    const usuarioId = Number(sessao.id);

    const holeriteId = Number(
      params.id,
    );

    if (
      !Number.isInteger(holeriteId) ||
      holeriteId <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um holerite válido.",
        },
        {
          status: 400,
        },
      );
    }

    const body = await req
      .json()
      .catch(() => null);

    const tipoAssinaturaRecebida = String(
      body?.tipoAssinatura || "",
    )
      .trim()
      .toUpperCase();

    const tipoAssinaturaRh =
      tipoAssinaturaRecebida === "DIGITAL"
        ? "DIGITAL_AUTENTICADA"
        : "DESENHO";

    const assinaturaBase64 = String(
      body?.assinaturaBase64 || "",
    ).trim();

    const aceitouTermos =
      body?.aceitouTermos === true;

    if (
      !["DESENHO", "DIGITAL"].includes(
        tipoAssinaturaRecebida,
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
            "É necessário confirmar que os dados do recibo foram conferidos.",
        },
        {
          status: 400,
        },
      );
    }

    let assinaturaBuffer:
      | Buffer
      | null = null;

    if (
      tipoAssinaturaRecebida ===
      "DESENHO"
    ) {
      assinaturaBuffer =
        extrairAssinaturaPng(
          assinaturaBase64,
        );

      if (!assinaturaBuffer) {
        return NextResponse.json(
          {
            error:
              "A imagem da assinatura desenhada é inválida.",
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
    }

    /*
     * Confirma o usuário real no banco.
     * Não utiliza somente os dados do token.
     */
    const usuario =
      await prisma.user.findFirst({
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
          ativo: true,
          instituicaoId: true,
          isMasterAdmin: true,
        },
      });

    if (!usuario) {
      return NextResponse.json(
        {
          error:
            "Usuário não encontrado, inativo ou pertencente a outra instituição.",
        },
        {
          status: 401,
        },
      );
    }

    /*
     * Procura o cadastro de funcionário ligado
     * ao usuário autenticado.
     */
    const funcionarioAssinante =
      await prisma.funcionario.findFirst({
        where: {
          userId: usuario.id,
          instituicaoId,
        },

        select: {
          id: true,
          nome: true,
          cargo: true,
          departamentoId: true,

          permissoes: {
            where: {
              chave:
                CHAVE_PERMISSAO_ASSINATURA_RH,
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
                  chave:
                    CHAVE_PERMISSAO_ASSINATURA_RH,
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

    if (!funcionarioAssinante) {
      return NextResponse.json(
        {
          error:
            "Este acesso institucional não está vinculado a um funcionário. Entre com o login individual do responsável do RH para assinar o recibo.",

          codigo:
            "ASSINANTE_RH_SEM_FUNCIONARIO_VINCULADO",
        },
        {
          status: 403,
        },
      );
    }

    const permissaoIndividual =
      funcionarioAssinante
        ?.permissoes[0];

    const permissaoDepartamento =
      funcionarioAssinante
        ?.departamento
        ?.permissoes[0];

    /*
     * Uma permissão individual cadastrada
     * prevalece sobre a permissão departamental.
     */
    const possuiPermissaoFuncionario =
      Boolean(funcionarioAssinante) &&
      (permissaoIndividual
        ? permissaoIndividual.ativo
        : permissaoDepartamento
          ?.ativo === true);

    const autorizado =
      usuarioEhAdministrador(usuario) ||
      possuiPermissaoFuncionario;

    if (!autorizado) {
      return NextResponse.json(
        {
          error:
            "Você não possui autorização para assinar digitalmente recibos de holerites.",

          codigo:
            "SEM_PERMISSAO_ASSINATURA_RH",
        },
        {
          status: 403,
        },
      );
    }

    const holerite =
      await prisma.holeriteRH.findFirst({
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
              dadosPagamentoHash: true,

              assinadoRhPorId: true,
              assinadoRhEm: true,
              assinaturaRhImagemUrl: true,
            },
          },
        },
      });

    if (!holerite) {
      return NextResponse.json(
        {
          error:
            "Holerite não encontrado nesta instituição.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      holerite.arquivado ||
      holerite.cancelado ||
      ["ARQUIVADO", "CANCELADO"].includes(
        String(
          holerite.status || "",
        ).toUpperCase(),
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Não é possível assinar um holerite arquivado ou cancelado.",
        },
        {
          status: 400,
        },
      );
    }

    const pagamento =
      holerite.pagamentos[0];

    if (!pagamento) {
      return NextResponse.json(
        {
          error:
            "Registre primeiro o pagamento deste holerite.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      pagamento.status ===
      StatusPagamentoHoleriteRH.CONTESTADO
    ) {
      return NextResponse.json(
        {
          error:
            "Este pagamento foi contestado e não pode ser assinado pelo RH enquanto estiver nessa situação.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      ![
        StatusPagamentoHoleriteRH.REGISTRADO,
        StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
      ].includes(pagamento.status)
    ) {
      return NextResponse.json(
        {
          error:
            "Este recibo não está disponível para assinatura do RH.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      pagamento.assinadoRhEm ||
      pagamento.assinadoRhPorId ||
      pagamento.assinaturaRhImagemUrl
    ) {
      return NextResponse.json(
        {
          error:
            "Este recibo já foi assinado digitalmente pelo RH.",

          codigo:
            "RECIBO_JA_ASSINADO_PELO_RH",
        },
        {
          status: 409,
        },
      );
    }

    let assinaturaRhImagemHash:
      | string
      | null = null;

    if (
      tipoAssinaturaRecebida ===
      "DESENHO"
    ) {
      const storeId =
        process.env
          .RH_PONTO_STORE_ID?.trim();

      const tokenBlob =
        process.env
          .RH_PONTO_READ_WRITE_TOKEN?.trim();

      if (
        !storeId ||
        !tokenBlob ||
        !assinaturaBuffer
      ) {
        return NextResponse.json(
          {
            error:
              "O armazenamento privado da assinatura do RH não está configurado.",
          },
          {
            status: 500,
          },
        );
      }

      assinaturaRhImagemHash =
        calcularSha256(
          assinaturaBuffer,
        );

      const caminhoAssinatura = [
        "rh-ponto",
        `instituicoes/${instituicaoId}`,
        `holerites/${holerite.id}`,
        "assinaturas-rh",
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

      assinaturaRhImagemUrl =
        blob.url;
    }

    const agora = new Date();

    const ipAssinaturaRh =
      obterIp(req);

    const userAgentAssinaturaRh =
      String(
        req.headers.get(
          "user-agent",
        ) || "",
      ).slice(0, 2000);

    const confirmacaoAssinaturaRhHash =
      calcularSha256(
        JSON.stringify({
          pagamentoId:
            pagamento.id,

          holeriteId:
            holerite.id,

          funcionarioRecebedorId:
            holerite.funcionarioId,

          reciboNumero:
            pagamento.reciboNumero,

          valorPago: Number(
            pagamento.valorPago,
          ).toFixed(2),

          pagoEm:
            pagamento.pagoEm.toISOString(),

          dadosPagamentoHash:
            pagamento.dadosPagamentoHash,

          assinadoRhPorUserId:
            usuario.id,

          assinadoRhPorFuncionarioId:
            funcionarioAssinante
              ?.id || null,

          nomeAssinante:
            funcionarioAssinante.nome,

          emailAssinante:
            usuario.email,

          roleAssinante: String(
            usuario.role,
          ),

          tipoAssinaturaRh,

          assinaturaRhImagemHash:
            assinaturaRhImagemHash ||
            null,

          assinadoRhEm:
            agora.toISOString(),

          ipAssinaturaRh,

          userAgentAssinaturaRh,

          aceitouTermos: true,
        }),
      );

    await prisma.$transaction(
      async (tx) => {
        const atualizacao =
          await tx.pagamentoHoleriteRH.updateMany({
            where: {
              id: pagamento.id,
              instituicaoId,

              assinadoRhPorId: null,
              assinadoRhEm: null,
              assinaturaRhImagemUrl: null,

              status: {
                in: [
                  StatusPagamentoHoleriteRH.REGISTRADO,
                  StatusPagamentoHoleriteRH.CONFIRMADO_FUNCIONARIO,
                ],
              },
            },

            data: {
              assinadoRhPorId:
                usuario.id,

              assinadoRhEm:
                agora,

              tipoAssinaturaRh,

              assinaturaRhImagemUrl:
                assinaturaRhImagemUrl ||
                null,

              assinaturaRhImagemHash:
                assinaturaRhImagemHash ||
                null,

              assinadoRhNomeSnapshot:
                funcionarioAssinante.nome,

              assinadoRhEmailSnapshot:
                usuario.email,

              assinadoRhRoleSnapshot:
                String(usuario.role),

              ipAssinaturaRh,

              userAgentAssinaturaRh:
                userAgentAssinaturaRh ||
                null,

              confirmacaoAssinaturaRhHash,
            },
          });

        if (
          atualizacao.count !== 1
        ) {
          throw new Error(
            "Este recibo já foi assinado ou alterado por outra solicitação.",
          );
        }

        await tx.historicoRH.create({
          data: {
            funcionarioId:
              holerite.funcionarioId,

            instituicaoId,

            criadoPorId:
              usuario.id,

            tipo:
              "RECIBO_HOLERITE_ASSINADO_PELO_RH",

            titulo:
              "Recibo assinado digitalmente pelo RH",

            descricao:
              `${funcionarioAssinante.nome} assinou digitalmente, como representante do RH, ` +
              `o recibo ${pagamento.reciboNumero} de ${holerite.funcionario.nome}.`,

            dataEvento: agora,

            observacoes: [
              `Pagamento ID: ${pagamento.id}`,
              `Holerite ID: ${holerite.id}`,
              `Recibo: ${pagamento.reciboNumero}`,
              `Usuário assinante ID: ${usuario.id}`,
              funcionarioAssinante
                ? `Funcionário assinante ID: ${funcionarioAssinante.id}`
                : "Assinante administrativo sem cadastro de funcionário vinculado",
              `Nome do funcionário assinante: ${funcionarioAssinante.nome}`,
              `E-mail do assinante: ${usuario.email}`,
              `Perfil: ${String(usuario.role)}`,
              funcionarioAssinante
                ?.departamento
                ?.nome
                ? `Departamento: ${funcionarioAssinante.departamento.nome}`
                : null,
              `Tipo de assinatura: ${tipoAssinaturaRh}`,

              assinaturaRhImagemHash
                ? `Assinatura desenhada SHA-256: ${assinaturaRhImagemHash}`
                : "Assinatura digital autenticada pelo usuário PHANYX",
              `Confirmação SHA-256: ${confirmacaoAssinaturaRhHash}`,
              `IP: ${ipAssinaturaRh || "Não identificado"}`,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        });
      },
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );

    return NextResponse.json({
      message:
        "Recibo assinado digitalmente pelo RH com sucesso.",

      holeriteId:
        holerite.id,

      pagamentoId:
        pagamento.id,

      reciboNumero:
        pagamento.reciboNumero,

      assinadoRhEm:
        agora,

      assinante: {
        userId:
          usuario.id,

        funcionarioId:
          funcionarioAssinante
            ?.id || null,

        nome:
          funcionarioAssinante.nome,

        email:
          usuario.email,

        role:
          String(usuario.role),

        departamento:
          funcionarioAssinante
            ?.departamento
            ?.nome || null,
      },

      tipoAssinaturaRh,

      assinaturaRhImagemHash:
        assinaturaRhImagemHash || null,

      confirmacaoAssinaturaRhHash,
    });
  } catch (error: any) {
    if (assinaturaRhImagemUrl) {
      const tokenBlob =
        process.env
          .RH_PONTO_READ_WRITE_TOKEN?.trim();

      if (tokenBlob) {
        await del(
          assinaturaRhImagemUrl,
          {
            token: tokenBlob,
          },
        ).catch(
          (erroExclusao) => {
            console.error(
              "Não foi possível remover a assinatura órfã do RH:",
              erroExclusao,
            );
          },
        );
      }
    }

    console.error(
      "Erro ao assinar recibo pelo RH:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Erro ao assinar digitalmente o recibo pelo RH.",
      },
      {
        status: 500,
      },
    );
  }
}