import { NextResponse } from "next/server";
import {
  NivelAcessoInstituicao,
  Prisma,
  Role,
  StatusComercialPolo,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import {
  filtroPoloGerenciavel,
  obterContextoGestaoPolos,
} from "@/lib/polos-rede";
import { recalcularAssinaturaPhanyx } from "@/lib/recalcular-assinatura-phanyx";

function normalizarEmail(valor: unknown) {
  return String(valor ?? "").trim().toLowerCase();
}

function criarSlugBase(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function gerarSenhaTemporaria() {
  return randomBytes(9).toString("base64url");
}

function emailValido(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      );
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json(
        { error: "Sem permissão" },
        { status: 403 }
      );
    }

    const usuarioCriadorId = Number(user.id);
    const poloId = Number(params.id);

    if (
      !Number.isInteger(usuarioCriadorId) ||
      usuarioCriadorId <= 0
    ) {
      return NextResponse.json(
        { error: "Sessão inválida" },
        { status: 401 }
      );
    }

    if (
      !Number.isInteger(poloId) ||
      poloId <= 0
    ) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const permitirGerenciarPolosSolicitado =
      body.permitirGerenciarPolos === true;

    const contexto = await obterContextoGestaoPolos(
      user.instituicaoId
    );

    if (!contexto) {
      return NextResponse.json(
        { error: "Instituição não encontrada" },
        { status: 404 }
      );
    }

    if (!contexto.podeGerenciarPolos) {
      return NextResponse.json(
        {
          error:
            "A gestão de polos não está habilitada para esta unidade. Essa permissão é controlada pela instituição contratante.",
        },
        { status: 403 }
      );
    }

    /*
     * Uma unidade delegada pode criar novos polos,
     * mas não pode repassar essa autorização.
     */
    if (
      permitirGerenciarPolosSolicitado &&
      !contexto.ehInstituicaoContratante
    ) {
      return NextResponse.json(
        {
          error:
            "Somente a instituição contratante pode permitir que uma nova unidade crie e gerencie outros polos.",
        },
        { status: 403 }
      );
    }

    const polo = await prisma.polo.findFirst({
      where: filtroPoloGerenciavel(
        contexto,
        poloId
      ),
      select: {
        id: true,
        nome: true,
        codigo: true,
        cnpj: true,
        tipoUnidade: true,
        statusComercial: true,
        ativo: true,
        cep: true,
        endereco: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true,
        responsavelNome: true,
        responsavelEmail: true,
        responsavelTelefone: true,
        responsavelCargo: true,
        instituicaoGeradaId: true,
        instituicao: {
          select: {
            id: true,
            nome: true,
            ativo: true,
            redeInstitucionalId: true,
            herdaPlanoContratante: true,
          },
        },
      },
    });

    if (!polo) {
      return NextResponse.json(
        {
          error:
            "Polo não encontrado ou não pertencente ao escopo de gestão desta unidade.",
        },
        { status: 404 }
      );
    }

    if (polo.instituicaoGeradaId) {
      return NextResponse.json(
        {
          error:
            "Este polo já possui uma instituição independente vinculada.",
          instituicaoId:
            polo.instituicaoGeradaId,
        },
        { status: 409 }
      );
    }

    if (
      !polo.ativo ||
      polo.statusComercial !==
      StatusComercialPolo.ATIVO
    ) {
      return NextResponse.json(
        {
          error:
            "O polo precisa estar comercialmente ativo antes da criação da instituição e do acesso.",
        },
        { status: 409 }
      );
    }

    if (!polo.instituicao.ativo) {
      return NextResponse.json(
        {
          error:
            "A instituição que cadastrou este polo está inativa.",
        },
        { status: 409 }
      );
    }

    const instituicaoContratante =
      await prisma.instituicao.findUnique({
        where: {
          id: contexto.instituicaoContratanteId,
        },
        select: {
          id: true,
          nome: true,
          ativo: true,
          plano: true,
          statusAssinatura: true,
          isentaPagamento: true,
          motivoIsencao: true,
          redeInstitucionalId: true,
          herdaPlanoContratante: true,
        },
      });

    if (!instituicaoContratante) {
      return NextResponse.json(
        {
          error:
            "A instituição contratante da rede não foi encontrada.",
        },
        { status: 404 }
      );
    }

    if (!instituicaoContratante.ativo) {
      return NextResponse.json(
        {
          error:
            "A instituição contratante da rede está inativa.",
        },
        { status: 409 }
      );
    }

    if (
      instituicaoContratante.herdaPlanoContratante
    ) {
      return NextResponse.json(
        {
          error:
            "A instituição identificada como contratante possui uma configuração de rede inválida.",
        },
        { status: 409 }
      );
    }

    const responsavelNome = String(
      polo.responsavelNome ?? ""
    ).trim();

    const responsavelEmail = normalizarEmail(
      polo.responsavelEmail
    );

    if (!responsavelNome) {
      return NextResponse.json(
        {
          error:
            "Informe o nome do responsável pelo polo antes de criar o acesso institucional.",
        },
        { status: 400 }
      );
    }

    if (!responsavelEmail) {
      return NextResponse.json(
        {
          error:
            "Informe o e-mail do responsável pelo polo antes de criar o acesso institucional.",
        },
        { status: 400 }
      );
    }

    if (!emailValido(responsavelEmail)) {
      return NextResponse.json(
        {
          error:
            "O e-mail informado para o responsável é inválido.",
        },
        { status: 400 }
      );
    }

    const usuarioComMesmoEmail =
      await prisma.user.findFirst({
        where: {
          email: {
            equals: responsavelEmail,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          nome: true,
          email: true,
          instituicaoId: true,
        },
      });

    if (usuarioComMesmoEmail) {
      return NextResponse.json(
        {
          error:
            "Já existe um usuário no PHANYX com o e-mail do responsável. Use um e-mail exclusivo para o primeiro administrador desta unidade.",
        },
        { status: 409 }
      );
    }

    const senhaTemporaria =
      gerarSenhaTemporaria();

    const senhaCriptografada =
      await bcrypt.hash(
        senhaTemporaria,
        10
      );

    const slugBase =
      criarSlugBase(polo.nome) || "unidade";

    const slug = `${slugBase}-${randomBytes(
      4
    ).toString("hex")}`;

    const agora = new Date();

    const nomeUnidadePrincipal =
      polo.cidade?.trim()
        ? `SEDE - ${polo.cidade.trim()}`
        : polo.bairro?.trim()
          ? `SEDE - ${polo.bairro.trim()}`
          : `SEDE - ${polo.nome.trim()}`;

    const permitirGerenciarPolos =
      contexto.ehInstituicaoContratante &&
      permitirGerenciarPolosSolicitado;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          let redeId = contexto.redeId;

          /*
           * Na primeira unidade da contratante,
           * a rede ainda pode não existir.
           */
          if (!redeId) {
            if (
              !contexto.ehInstituicaoContratante
            ) {
              throw new Error(
                "A unidade autorizada não possui uma rede institucional válida."
              );
            }

            const rede =
              await tx.redeInstitucional.upsert({
                where: {
                  instituicaoContratanteId:
                    instituicaoContratante.id,
                },
                update: {
                  ativo: true,
                },
                create: {
                  nome: `Rede ${instituicaoContratante.nome}`,
                  instituicaoContratanteId:
                    instituicaoContratante.id,
                  ativo: true,
                },
                select: {
                  id: true,
                },
              });

            redeId = rede.id;

            await tx.instituicao.update({
              where: {
                id: instituicaoContratante.id,
              },
              data: {
                redeInstitucionalId:
                  redeId,
                herdaPlanoContratante:
                  false,
              },
            });
          }

          const novaInstituicao =
            await tx.instituicao.create({
              data: {
                nome: polo.nome,
                slug,
                ativo: true,
                updatedAt: agora,

                /*
                 * Plano, assinatura e isenção sempre
                 * vêm da contratante da rede.
                 */
                plano:
                  instituicaoContratante.plano,

                statusAssinatura:
                  instituicaoContratante.statusAssinatura,

                isentaPagamento:
                  instituicaoContratante.isentaPagamento,

                motivoIsencao:
                  instituicaoContratante.motivoIsencao,

                redeInstitucionalId:
                  redeId,

                herdaPlanoContratante:
                  true,

                /*
                 * Por padrão, toda nova unidade nasce
                 * sem permissão para criar outros polos.
                 */
                podeCriarGerenciarPolos:
                  permitirGerenciarPolos,
              },
              select: {
                id: true,
                nome: true,
                slug: true,
                podeCriarGerenciarPolos:
                  true,
              },
            });

          await tx.configuracaoInstituicao.create({
            data: {
              instituicaoId:
                novaInstituicao.id,
              nomeFantasia: polo.nome,
              nomeUnidadePrincipal,
              razaoSocial: polo.nome,
              cnpj: polo.cnpj,
              telefone:
                polo.responsavelTelefone,
              email: responsavelEmail,
              cep: polo.cep,
              endereco: polo.endereco,
              numero: polo.numero,
              cidade: polo.cidade,
              estado: polo.estado,
              responsavelNome,
              responsavelCargo:
                polo.responsavelCargo,
            },
          });

          const novoUsuario =
            await tx.user.create({
              data: {
                nome: responsavelNome,
                email: responsavelEmail,
                senha:
                  senhaCriptografada,
                instituicaoId:
                  novaInstituicao.id,
                role: Role.ADMIN,
                ativo: true,
                precisaTrocarSenha: true,

                /*
                 * O administrador local administra
                 * somente a própria instituição.
                 */
                acessoTodosPolos: false,
              },
              select: {
                id: true,
                nome: true,
                email: true,
                instituicaoId: true,
              },
            });

          /*
           * O usuário que criou a unidade recebe
           * acesso explícito a ela.
           */
          await tx.userInstituicaoAcesso.upsert({
            where: {
              userId_instituicaoId: {
                userId: usuarioCriadorId,
                instituicaoId:
                  novaInstituicao.id,
              },
            },
            update: {
              ativo: true,
              nivelAcesso:
                NivelAcessoInstituicao.ADMINISTRADOR_REDE,
              revogadoEm: null,
              revogadoPorId: null,
              motivoRevogacao: null,
            },
            create: {
              userId:
                usuarioCriadorId,
              instituicaoId:
                novaInstituicao.id,
              nivelAcesso:
                NivelAcessoInstituicao.ADMINISTRADOR_REDE,
              ativo: true,
              criadoPorId:
                usuarioCriadorId,
            },
          });

          await tx.polo.update({
            where: {
              id: polo.id,
            },
            data: {
              instituicaoGeradaId:
                novaInstituicao.id,
            },
          });

          return {
            redeId,
            novaInstituicao,
            novoUsuario,
          };
        }
      );

    let recalculoAssinatura:
      | Awaited<
        ReturnType<
          typeof recalcularAssinaturaPhanyx
        >
      >
      | null = null;

    let avisoCobranca: string | null =
      null;

    try {
      recalculoAssinatura =
        await recalcularAssinaturaPhanyx(
          contexto.instituicaoContratanteId,
          {
            sincronizarAsaas: true,
            atualizarCobrancasPendentes:
              false,
            motivo: `Criação da unidade institucional ${polo.nome}`,
          }
        );
    } catch (erroRecalculo) {
      console.error(
        "A instituição foi criada, mas houve erro ao recalcular a assinatura:",
        erroRecalculo
      );

      avisoCobranca =
        "A instituição e o acesso foram criados, mas a assinatura não pôde ser atualizada automaticamente. O recálculo financeiro deverá ser reprocessado.";
    }

    console.info(
      "Unidade institucional provisionada:",
      {
        poloId: polo.id,
        instituicaoCriadoraId:
          contexto.instituicaoId,
        instituicaoContratanteId:
          contexto.instituicaoContratanteId,
        novaInstituicaoId:
          resultado.novaInstituicao.id,
        redeId: resultado.redeId,
        podeCriarGerenciarPolos:
          resultado.novaInstituicao
            .podeCriarGerenciarPolos,
        criadoPorId:
          usuarioCriadorId,
        criadoEm:
          agora.toISOString(),
      }
    );

    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Instituição independente e acesso criados com sucesso.",

        redeId: resultado.redeId,

        instituicao:
          resultado.novaInstituicao,

        usuario:
          resultado.novoUsuario,

        credenciaisTemporarias: {
          login: responsavelEmail,
          senha: senhaTemporaria,
          precisaTrocarSenha: true,
        },

        permissaoPolos: {
          podeCriarGerenciarPolos:
            resultado.novaInstituicao
              .podeCriarGerenciarPolos,

          controladaPelaContratante:
            true,
        },

        cobranca:
          recalculoAssinatura,

        aviso:
          avisoCobranca,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao provisionar instituição do polo:",
      error
    );

    if (
      error instanceof
      Prisma.PrismaClientKnownRequestError
    ) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "Não foi possível concluir porque um dos dados já está sendo usado por outro cadastro.",
          },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Erro ao criar a instituição e o acesso do polo.",
      },
      { status: 500 }
    );
  }
}