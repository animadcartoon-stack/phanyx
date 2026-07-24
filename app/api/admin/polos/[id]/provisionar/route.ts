import { NextResponse } from "next/server";
import { NivelAcessoInstituicao, Prisma, Role, StatusComercialPolo } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";

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
  _req: Request,
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

    if (!Number.isInteger(poloId) || poloId <= 0) {
      return NextResponse.json(
        { error: "Polo inválido" },
        { status: 400 }
      );
    }

    const polo = await prisma.polo.findFirst({
      where: {
        id: poloId,
        instituicaoId: user.instituicaoId,
      },
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
            plano: true,
            statusAssinatura: true,
            isentaPagamento: true,
            motivoIsencao: true,
            redeInstitucionalId: true,
            herdaPlanoContratante: true,
          },
        },
      },
    });

    if (!polo) {
      return NextResponse.json(
        { error: "Polo não encontrado" },
        { status: 404 }
      );
    }

    if (polo.instituicaoGeradaId) {
      return NextResponse.json(
        {
          error:
            "Este polo já possui uma instituição independente vinculada.",
          instituicaoId: polo.instituicaoGeradaId,
        },
        { status: 409 }
      );
    }

    if (
      !polo.ativo ||
      polo.statusComercial !== StatusComercialPolo.ATIVO
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
        { error: "A instituição contratante está inativa" },
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

    /*
     * Neste primeiro fluxo, o responsável local precisa usar um
     * e-mail ainda não cadastrado no PHANYX.
     *
     * Posteriormente, o seletor de instituições permitirá que um
     * mesmo usuário já existente acesse várias instituições.
     */
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

    /*
     * Uma instituição que já herdou o plano de outra não pode
     * criar novas unidades da rede.
     *
     * Somente a contratante original pode fazer o provisionamento.
     */
    const redeComoContratante =
      await prisma.redeInstitucional.findUnique({
        where: {
          instituicaoContratanteId:
            polo.instituicao.id,
        },
        select: {
          id: true,
          nome: true,
          instituicaoContratanteId: true,
        },
      });

    if (polo.instituicao.herdaPlanoContratante) {
      return NextResponse.json(
        {
          error:
            "Somente a instituição contratante da rede pode criar novas unidades.",
        },
        { status: 403 }
      );
    }

    if (
      polo.instituicao.redeInstitucionalId &&
      !redeComoContratante
    ) {
      return NextResponse.json(
        {
          error:
            "Esta instituição pertence a uma rede, mas não é a contratante principal.",
        },
        { status: 403 }
      );
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const senhaCriptografada = await bcrypt.hash(
      senhaTemporaria,
      10
    );

    const slugBase =
      criarSlugBase(polo.nome) || "unidade";

    const slug = `${slugBase}-${randomBytes(4).toString(
      "hex"
    )}`;

    const agora = new Date();

    const resultado = await prisma.$transaction(
      async (tx) => {
        let redeId = redeComoContratante?.id ?? null;

        if (!redeId) {
          const novaRede =
            await tx.redeInstitucional.create({
              data: {
                nome: `Rede ${polo.instituicao.nome}`,
                instituicaoContratanteId:
                  polo.instituicao.id,
                ativo: true,
              },
              select: {
                id: true,
              },
            });

          redeId = novaRede.id;

          await tx.instituicao.update({
            where: {
              id: polo.instituicao.id,
            },
            data: {
              redeInstitucionalId: redeId,
              herdaPlanoContratante: false,
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
              plano: polo.instituicao.plano,
              statusAssinatura:
                polo.instituicao.statusAssinatura,
              isentaPagamento:
                polo.instituicao.isentaPagamento,
              motivoIsencao:
                polo.instituicao.motivoIsencao,
              redeInstitucionalId: redeId,
              herdaPlanoContratante: true,
            },
            select: {
              id: true,
              nome: true,
              slug: true,
            },
          });

        await tx.configuracaoInstituicao.create({
          data: {
            instituicaoId: novaInstituicao.id,
            nomeFantasia: polo.nome,
            razaoSocial: polo.nome,
            cnpj: polo.cnpj,
            telefone: polo.responsavelTelefone,
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

        const novoUsuario = await tx.user.create({
          data: {
            nome: responsavelNome,
            email: responsavelEmail,
            senha: senhaCriptografada,
            instituicaoId: novaInstituicao.id,
            role: Role.ADMIN,
            ativo: true,
            precisaTrocarSenha: true,
            acessoTodosPolos: true,
          },
          select: {
            id: true,
            nome: true,
            email: true,
            instituicaoId: true,
          },
        });

        /*
         * O usuário central que executou a criação recebe acesso
         * explícito à nova instituição.
         *
         * Outros diretores e reitores serão vinculados depois
         * pela tela de gestão da rede.
         */
        await tx.userInstituicaoAcesso.upsert({
          where: {
            userId_instituicaoId: {
              userId: usuarioCriadorId,
              instituicaoId: novaInstituicao.id,
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
            userId: usuarioCriadorId,
            instituicaoId: novaInstituicao.id,
            nivelAcesso:
              NivelAcessoInstituicao.ADMINISTRADOR_REDE,
            ativo: true,
            criadoPorId: usuarioCriadorId,
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

    /*
     * A senha temporária é devolvida uma única vez.
     * Ela nunca é gravada em texto puro no banco.
     */
    return NextResponse.json(
      {
        sucesso: true,
        mensagem:
          "Instituição independente e acesso criados com sucesso.",
        redeId: resultado.redeId,
        instituicao: resultado.novaInstituicao,
        usuario: resultado.novoUsuario,
        credenciaisTemporarias: {
          login: responsavelEmail,
          senha: senhaTemporaria,
          precisaTrocarSenha: true,
        },
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