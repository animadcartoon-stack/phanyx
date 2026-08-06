import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromToken, isAdminLike } from "@/lib/server-auth";
import {
  TipoMovimentacaoLotacaoRH,
  TipoRemuneracaoRH,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { enviarEmailPrimeiroAcesso } from "@/lib/email";
import {
  obterPoloAtivoVisivelParaInstituicao,
} from "@/lib/polos-rede";

async function gerarCodigoFuncionario(instituicaoId: number) {
  const ultimoFuncionario = await prisma.funcionario.findFirst({
    where: {
      instituicaoId,
      codigoFuncionario: {
        not: null,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      codigoFuncionario: true,
    },
  });

  const codigoAtual = String(ultimoFuncionario?.codigoFuncionario || "")
    .replace(/\D/g, "");

  const proximoNumero = codigoAtual ? Number(codigoAtual) + 1 : 1;

  return String(proximoNumero).padStart(4, "0");
}

function limparTexto(valor: unknown) {
  return String(valor ?? "").trim();
}

function numeroDecimalOuNull(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    limparTexto(valor) === ""
  ) {
    return null;
  }

  const texto = limparTexto(valor);

  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

function numeroInteiroOuNull(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    limparTexto(valor) === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0
    ? numero
    : null;
}

function obterTipoRemuneracao(
  valor: unknown
): TipoRemuneracaoRH | null {
  const texto = limparTexto(valor).toUpperCase();

  if (!texto) {
    return null;
  }

  const tiposPermitidos = Object.values(
    TipoRemuneracaoRH
  );

  return tiposPermitidos.includes(
    texto as TipoRemuneracaoRH
  )
    ? (texto as TipoRemuneracaoRH)
    : null;
}

function gerarSenhaTemporaria() {
  const sufixo = crypto.randomBytes(4).toString("hex");
  return `Phx@${sufixo}`;
}

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const funcionarios = await prisma.funcionario.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
        departamento: true,
        polo: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            tipoUnidade: true,
            instituicaoId: true,
            instituicaoGeradaId: true,
            ativo: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(funcionarios);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao listar funcionários" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    const instituicaoId = Number(
      user.instituicaoId
    );

    const body = await request.json();

    const poloId =
      numeroInteiroOuNull(body.poloId);

    if (!poloId) {
      return NextResponse.json(
        {
          error:
            "Selecione o polo de lotação do funcionário.",
        },
        { status: 400 }
      );
    }

    const poloSelecionado =
      await obterPoloAtivoVisivelParaInstituicao(
        instituicaoId,
        poloId
      );

    if (!poloSelecionado) {
      return NextResponse.json(
        {
          error:
            "O polo informado não existe, está inativo ou não pertence ao escopo desta instituição.",
        },
        { status: 400 }
      );
    }

    const criarAcessoSistema =
      body.criarAcessoSistema === undefined
        ? true
        : body.criarAcessoSistema === true ||
        body.criarAcessoSistema === "true";

    const nome = limparTexto(body.nome);

    const email = limparTexto(
      body.email
    ).toLowerCase();

    const role =
      limparTexto(body.role).toUpperCase() ||
      "SECRETARIA";

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "O nome do funcionário é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (criarAcessoSistema && !email) {
      return NextResponse.json(
        {
          error:
            "O email é obrigatório para criar o acesso ao sistema.",
        },
        { status: 400 }
      );
    }

    if (criarAcessoSistema) {
      const userExistente =
        await prisma.user.findUnique({
          where: {
            email,
          },
          select: {
            id: true,
          },
        });

      if (userExistente) {
        return NextResponse.json(
          {
            error:
              "Já existe um usuário cadastrado com este email.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Departamento
     */
    const departamentoId =
      numeroInteiroOuNull(
        body.departamentoId
      );

    if (
      body.departamentoId !== null &&
      body.departamentoId !== undefined &&
      limparTexto(body.departamentoId) !== "" &&
      !departamentoId
    ) {
      return NextResponse.json(
        {
          error:
            "O departamento informado é inválido.",
        },
        { status: 400 }
      );
    }

    let departamentoSelecionado:
      | {
        id: number;
        nome: string;
      }
      | null = null;

    if (departamentoId) {
      departamentoSelecionado =
        await prisma.departamento.findFirst({
          where: {
            id: departamentoId,
            instituicaoId,
          },
          select: {
            id: true,
            nome: true,
          },
        });

      if (!departamentoSelecionado) {
        return NextResponse.json(
          {
            error:
              "Departamento inválido para esta instituição.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Datas
     */
    const dataNascimento = body.dataNascimento
      ? new Date(body.dataNascimento)
      : null;

    const dataAdmissao = body.dataAdmissao
      ? new Date(body.dataAdmissao)
      : null;

    if (
      dataNascimento &&
      Number.isNaN(dataNascimento.getTime())
    ) {
      return NextResponse.json(
        {
          error:
            "A data de nascimento é inválida.",
        },
        { status: 400 }
      );
    }

    if (
      dataAdmissao &&
      Number.isNaN(dataAdmissao.getTime())
    ) {
      return NextResponse.json(
        {
          error:
            "A data de admissão é inválida.",
        },
        { status: 400 }
      );
    }

    /*
     * Remuneração
     */
    const salarioBaseInformado =
      numeroDecimalOuNull(
        body.salarioBase
      );

    const tipoRemuneracaoInformado =
      obterTipoRemuneracao(
        body.tipoRemuneracao
      );

    const tipoRemuneracao =
      tipoRemuneracaoInformado ||
      (salarioBaseInformado !== null
        ? TipoRemuneracaoRH.MENSAL
        : TipoRemuneracaoRH.SEM_REMUNERACAO);

    if (
      limparTexto(body.tipoRemuneracao) &&
      !tipoRemuneracaoInformado
    ) {
      return NextResponse.json(
        {
          error:
            "A modalidade de remuneração informada é inválida.",
        },
        { status: 400 }
      );
    }

    const salarioBase =
      tipoRemuneracao ===
        TipoRemuneracaoRH.MENSAL ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? salarioBaseInformado
        : null;

    const valorHoraAula =
      tipoRemuneracao ===
        TipoRemuneracaoRH.HORA_AULA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroDecimalOuNull(
          body.valorHoraAula
        )
        : null;

    const valorHoraTrabalhada =
      tipoRemuneracao ===
        TipoRemuneracaoRH.HORA_TRABALHADA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroDecimalOuNull(
          body.valorHoraTrabalhada
        )
        : null;

    const valorPorAula =
      tipoRemuneracao ===
        TipoRemuneracaoRH.POR_AULA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroDecimalOuNull(
          body.valorPorAula
        )
        : null;

    const valorPorTurma =
      tipoRemuneracao ===
        TipoRemuneracaoRH.POR_TURMA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroDecimalOuNull(
          body.valorPorTurma
        )
        : null;

    const valorPorDisciplina =
      tipoRemuneracao ===
        TipoRemuneracaoRH.POR_DISCIPLINA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroDecimalOuNull(
          body.valorPorDisciplina
        )
        : null;

    const duracaoHoraAulaMinutos =
      tipoRemuneracao ===
        TipoRemuneracaoRH.HORA_AULA ||
        tipoRemuneracao ===
        TipoRemuneracaoRH.MISTO
        ? numeroInteiroOuNull(
          body.duracaoHoraAulaMinutos
        ) || 50
        : null;

    const cargaHorariaSemanal =
      numeroDecimalOuNull(
        body.cargaHorariaSemanal
      );

    const cargaHorariaMensal =
      numeroInteiroOuNull(
        body.cargaHorariaMensal
      );

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.MENSAL &&
      salarioBase === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o salário mensal do funcionário.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.HORA_AULA &&
      valorHoraAula === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor da hora-aula.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.HORA_TRABALHADA &&
      valorHoraTrabalhada === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor da hora trabalhada.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.POR_AULA &&
      valorPorAula === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor por aula.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.POR_TURMA &&
      valorPorTurma === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor por turma.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.POR_DISCIPLINA &&
      valorPorDisciplina === null
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o valor por disciplina.",
        },
        { status: 400 }
      );
    }

    if (
      tipoRemuneracao ===
      TipoRemuneracaoRH.MISTO &&
      salarioBase === null &&
      valorHoraAula === null &&
      valorHoraTrabalhada === null &&
      valorPorAula === null &&
      valorPorTurma === null &&
      valorPorDisciplina === null
    ) {
      return NextResponse.json(
        {
          error:
            "Na remuneração mista, informe pelo menos um valor.",
        },
        { status: 400 }
      );
    }

    /*
     * Identificação e status
     */
    const codigoInformado =
      limparTexto(
        body.codigoFuncionario
      );

    const codigoFuncionario =
      codigoInformado ||
      (await gerarCodigoFuncionario(
        instituicaoId
      ));

    const statusFuncionario =
      limparTexto(
        body.statusFuncionario
      ).toUpperCase() || "ATIVO";

    const instituicao = criarAcessoSistema
      ? await prisma.instituicao.findUnique({
        where: {
          id: instituicaoId,
        },
        select: {
          nome: true,
        },
      })
      : null;

    const senhaTemporaria =
      criarAcessoSistema
        ? gerarSenhaTemporaria()
        : null;

    const senhaHash = senhaTemporaria
      ? await bcrypt.hash(
        senhaTemporaria,
        10
      )
      : null;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          const novoUser = criarAcessoSistema
            ? await tx.user.create({
              data: {
                nome,
                email,
                senha: senhaHash!,
                role,
                instituicaoId,
                precisaTrocarSenha: true,
              },
            })
            : null;

          const funcionario =
            await tx.funcionario.create({
              data: {
                nome,
                cpf: body.cpf || null,
                rg: body.rg || null,
                telefone:
                  body.telefone || null,

                dataNascimento,

                endereco:
                  body.endereco || null,

                numero:
                  body.numero || null,

                complemento:
                  body.complemento || null,

                bairro:
                  body.bairro || null,

                cidade:
                  body.cidade || null,

                estado:
                  body.estado || null,

                cep:
                  body.cep || null,

                cargo:
                  body.cargo || null,

                setor:
                  body.setor || null,

                fotoPerfil:
                  body.fotoPerfil || null,

                documentoUrl:
                  body.documentoUrl || null,

                codigoFuncionario,
                dataAdmissao,

                tipoRemuneracao,

                salarioBase,
                salario: salarioBase,

                valorHoraAula,
                valorHoraTrabalhada,
                valorPorAula,
                valorPorTurma,
                valorPorDisciplina,

                duracaoHoraAulaMinutos,
                cargaHorariaSemanal,
                cargaHorariaMensal,

                observacoesRemuneracao:
                  limparTexto(
                    body.observacoesRemuneracao
                  ) || null,

                tipoContrato:
                  body.tipoContrato || null,

                jornadaTrabalho:
                  body.jornadaTrabalho || null,

                codigoPonto:
                  body.codigoPonto || null,

                pisPasep:
                  body.pisPasep || null,

                banco:
                  body.banco || null,

                agencia:
                  body.agencia || null,

                conta:
                  body.conta || null,

                pix:
                  body.pix || null,

                departamentoId,
                instituicaoId,
                userId: novoUser?.id ?? null,

                poloId,

                statusFuncionario,
                motivoStatus:
                  body.motivoStatus || null,

                ativo:
                  statusFuncionario === "ATIVO",
              },
              include: {
                user: true,
                departamento: true,
                polo: true,
              },
            });

          const usuarioResponsavel =
            await tx.user.findUnique({
              where: {
                id: user.id,
              },
              select: {
                nome: true,
                email: true,
                role: true,
              },
            });

          const nomeResponsavel =
            limparTexto(
              usuarioResponsavel?.nome
            ) ||
            limparTexto(
              usuarioResponsavel?.email
            ) ||
            `Usuário ${user.id}`;

          await tx.funcionarioLotacaoRH.create({
            data: {
              funcionarioId: funcionario.id,
              instituicaoId,

              tipo:
                TipoMovimentacaoLotacaoRH
                  .LOTACAO_INICIAL,

              poloAnteriorId: null,
              poloNovoId: poloSelecionado.id,

              departamentoAnteriorId: null,
              departamentoNovoId:
                departamentoSelecionado?.id ??
                null,

              cargoAnteriorSnapshot: null,
              cargoNovoSnapshot:
                limparTexto(body.cargo) || null,

              setorAnteriorSnapshot: null,
              setorNovoSnapshot:
                limparTexto(body.setor) || null,

              poloAnteriorNomeSnapshot: null,
              poloNovoNomeSnapshot:
                poloSelecionado.nome,

              departamentoAnteriorNomeSnapshot:
                null,

              departamentoNovoNomeSnapshot:
                departamentoSelecionado?.nome ??
                null,

              vigenciaEm:
                dataAdmissao || new Date(),

              motivo:
                "Lotação inicial registrada no cadastro do funcionário.",

              observacoes: null,

              realizadoPorId: user.id,

              realizadoPorNomeSnapshot:
                nomeResponsavel,

              realizadoPorRoleSnapshot:
                limparTexto(
                  usuarioResponsavel?.role
                ) ||
                limparTexto(user.role) ||
                null,
            },
          });

          const dadosRemuneracaoInicial = {
            tipoRemuneracao,
            salarioBase,
            valorHoraAula,
            valorHoraTrabalhada,
            valorPorAula,
            valorPorTurma,
            valorPorDisciplina,
            duracaoHoraAulaMinutos,
            cargaHorariaSemanal,
            cargaHorariaMensal,
          };

          await tx.historicoRemuneracaoRH.create({
            data: {
              instituicaoId,
              funcionarioId:
                funcionario.id,

              professorId: null,

              alteradoPorId:
                user.id,

              origem:
                "FUNCIONARIOS_RH_CADASTRO",

              funcionarioNomeSnapshot:
                nome,

              professorNomeSnapshot:
                null,

              alteradoPorNomeSnapshot:
                nomeResponsavel,

              alteradoPorRoleSnapshot:
                limparTexto(
                  usuarioResponsavel?.role
                ) ||
                limparTexto(user.role) ||
                null,

              tipoAnterior: null,
              tipoNovo:
                tipoRemuneracao,

              dadosAnteriores: {
                tipoRemuneracao: null,
                salarioBase: null,
                valorHoraAula: null,
                valorHoraTrabalhada: null,
                valorPorAula: null,
                valorPorTurma: null,
                valorPorDisciplina: null,
                duracaoHoraAulaMinutos:
                  null,
                cargaHorariaSemanal:
                  null,
                cargaHorariaMensal:
                  null,
              },

              dadosNovos:
                dadosRemuneracaoInicial,

              vigenciaInicio:
                dataAdmissao ||
                new Date(),

              motivo:
                "Cadastro inicial da contratação do funcionário.",
            },
          });

          return funcionario;
        }
      );

    let avisoEmail: string | null = null;

    if (
      criarAcessoSistema &&
      senhaTemporaria
    ) {
      try {
        await enviarEmailPrimeiroAcesso({
          email,
          nome,
          senha: senhaTemporaria,
          instituicao:
            instituicao?.nome || "PHANYX",
          portal: "admin",
        });
      } catch (emailError) {
        console.error(
          "ERRO AO ENVIAR EMAIL DE ACESSO DO FUNCIONÁRIO:",
          emailError
        );

        avisoEmail =
          "Funcionário criado com sucesso, mas houve erro ao enviar o email de acesso.";
      }
    }

    return NextResponse.json(
      {
        ...resultado,
        acessoSistema:
          criarAcessoSistema,
        senhaTemporaria,
        avisoEmail,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ERRO AO CRIAR FUNCIONÁRIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao criar funcionário",
      },
      { status: 500 }
    );
  }
}