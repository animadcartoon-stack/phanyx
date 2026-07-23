import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import {
  getUserFromToken,
  isAdminLike,
} from "@/lib/server-auth";
import { TipoRemuneracaoRH } from "@prisma/client";

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

  return Number.isFinite(numero)
    ? numero
    : null;
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

function dataOuNull(valor: unknown) {
  if (
    valor === undefined ||
    valor === null ||
    limparTexto(valor) === ""
  ) {
    return null;
  }

  const data = new Date(
    limparTexto(valor)
  );

  return Number.isNaN(data.getTime())
    ? null
    : data;
}

type SnapshotRemuneracaoFuncionarioRH = {
  tipoRemuneracao:
    | TipoRemuneracaoRH
    | null;

  salarioBase: number | null;
  valorHoraAula: number | null;
  valorHoraTrabalhada: number | null;
  valorPorAula: number | null;
  valorPorTurma: number | null;
  valorPorDisciplina: number | null;

  duracaoHoraAulaMinutos:
    number | null;

  cargaHorariaSemanal:
    number | null;

  cargaHorariaMensal:
    number | null;

  observacoesRemuneracao:
    string | null;
};

function remuneracoesSaoIguais(
  anterior:
    SnapshotRemuneracaoFuncionarioRH,
  nova:
    SnapshotRemuneracaoFuncionarioRH
) {
  return (
    JSON.stringify(anterior) ===
    JSON.stringify(nova)
  );
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(context.params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            email: true,
            role: true,
            ativo: true,
          },
        },
        departamento: true,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ funcionario });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar funcionário" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: { id: string } }
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

    if (!user.instituicaoId) {
      return NextResponse.json(
        {
          error:
            "Usuário sem instituição vinculada.",
        },
        { status: 400 }
      );
    }

    const id = Number(context.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Funcionário inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const temCampo = (campo: string) =>
      Object.prototype.hasOwnProperty.call(
        body,
        campo
      );

    const funcionario =
      await prisma.funcionario.findFirst({
        where: {
          id,
          instituicaoId: user.instituicaoId,
        },
        include: {
          user: {
            select: {
              id: true,
              nome: true,
              email: true,
              role: true,
            },
          },
          professor: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

    if (!funcionario) {
      return NextResponse.json(
        {
          error:
            "Funcionário não encontrado",
        },
        { status: 404 }
      );
    }

    const nome =
      temCampo("nome")
        ? limparTexto(body.nome)
        : funcionario.nome;

    const email =
      temCampo("email")
        ? limparTexto(
            body.email
          ).toLowerCase()
        : funcionario.user.email;

    const role =
      temCampo("role")
        ? limparTexto(
            body.role
          ).toUpperCase()
        : funcionario.user.role;

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "O nome do funcionário é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "O email do funcionário é obrigatório.",
        },
        { status: 400 }
      );
    }

    const usuarioMesmoEmail =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (
      usuarioMesmoEmail &&
      usuarioMesmoEmail.id !==
        funcionario.userId
    ) {
      return NextResponse.json(
        {
          error:
            "Este email já está sendo utilizado por outro usuário.",
        },
        { status: 400 }
      );
    }

    /*
     * Departamento
     */
    const departamentoId =
      temCampo("departamentoId")
        ? numeroInteiroOuNull(
            body.departamentoId
          )
        : funcionario.departamentoId;

    if (
      temCampo("departamentoId") &&
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

    if (departamentoId !== null) {
      const departamento =
        await prisma.departamento.findFirst({
          where: {
            id: departamentoId,
            instituicaoId:
              user.instituicaoId,
          },
          select: {
            id: true,
          },
        });

      if (!departamento) {
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
    const dataNascimento =
      temCampo("dataNascimento")
        ? dataOuNull(body.dataNascimento)
        : funcionario.dataNascimento;

    const dataAdmissao =
      temCampo("dataAdmissao")
        ? dataOuNull(body.dataAdmissao)
        : funcionario.dataAdmissao;

    const dataDesligamento =
      temCampo("dataDesligamento")
        ? dataOuNull(body.dataDesligamento)
        : funcionario.dataDesligamento;

    if (
      temCampo("dataNascimento") &&
      limparTexto(body.dataNascimento) &&
      !dataNascimento
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
      temCampo("dataAdmissao") &&
      limparTexto(body.dataAdmissao) &&
      !dataAdmissao
    ) {
      return NextResponse.json(
        {
          error:
            "A data de admissão é inválida.",
        },
        { status: 400 }
      );
    }

    if (
      temCampo("dataDesligamento") &&
      limparTexto(body.dataDesligamento) &&
      !dataDesligamento
    ) {
      return NextResponse.json(
        {
          error:
            "A data de desligamento é inválida.",
        },
        { status: 400 }
      );
    }

    /*
     * Remuneração
     */
    const tipoAnteriorEfetivo =
      funcionario.tipoRemuneracao ||
      (funcionario.salarioBase !== null
        ? TipoRemuneracaoRH.MENSAL
        : TipoRemuneracaoRH.SEM_REMUNERACAO);

    const tipoRemuneracaoInformado =
      obterTipoRemuneracao(
        body.tipoRemuneracao
      );

    if (
      temCampo("tipoRemuneracao") &&
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

    const tipoRemuneracaoNovo =
      tipoRemuneracaoInformado ||
      tipoAnteriorEfetivo;

    const normalizarRemuneracao = (
      tipo: TipoRemuneracaoRH,
      valores: Omit<
        SnapshotRemuneracaoFuncionarioRH,
        "tipoRemuneracao"
      >
    ): SnapshotRemuneracaoFuncionarioRH => {
      const permiteSalario =
        tipo === TipoRemuneracaoRH.MENSAL ||
        tipo === TipoRemuneracaoRH.MISTO;

      const permiteHoraAula =
        tipo === TipoRemuneracaoRH.HORA_AULA ||
        tipo === TipoRemuneracaoRH.MISTO;

      const permiteHoraTrabalhada =
        tipo ===
          TipoRemuneracaoRH.HORA_TRABALHADA ||
        tipo === TipoRemuneracaoRH.MISTO;

      const permitePorAula =
        tipo === TipoRemuneracaoRH.POR_AULA ||
        tipo === TipoRemuneracaoRH.MISTO;

      const permitePorTurma =
        tipo === TipoRemuneracaoRH.POR_TURMA ||
        tipo === TipoRemuneracaoRH.MISTO;

      const permitePorDisciplina =
        tipo ===
          TipoRemuneracaoRH.POR_DISCIPLINA ||
        tipo === TipoRemuneracaoRH.MISTO;

      return {
        tipoRemuneracao: tipo,

        salarioBase:
          permiteSalario
            ? valores.salarioBase
            : null,

        valorHoraAula:
          permiteHoraAula
            ? valores.valorHoraAula
            : null,

        valorHoraTrabalhada:
          permiteHoraTrabalhada
            ? valores.valorHoraTrabalhada
            : null,

        valorPorAula:
          permitePorAula
            ? valores.valorPorAula
            : null,

        valorPorTurma:
          permitePorTurma
            ? valores.valorPorTurma
            : null,

        valorPorDisciplina:
          permitePorDisciplina
            ? valores.valorPorDisciplina
            : null,

        duracaoHoraAulaMinutos:
          permiteHoraAula
            ? valores
                .duracaoHoraAulaMinutos || 50
            : null,

        cargaHorariaSemanal:
          valores.cargaHorariaSemanal,

        cargaHorariaMensal:
          valores.cargaHorariaMensal,

        observacoesRemuneracao:
          valores.observacoesRemuneracao,
      };
    };

    const dadosRemuneracaoAnteriores =
      normalizarRemuneracao(
        tipoAnteriorEfetivo,
        {
          salarioBase:
            numeroDecimalOuNull(
              funcionario.salarioBase
            ),

          valorHoraAula:
            numeroDecimalOuNull(
              funcionario.valorHoraAula
            ),

          valorHoraTrabalhada:
            numeroDecimalOuNull(
              funcionario
                .valorHoraTrabalhada
            ),

          valorPorAula:
            numeroDecimalOuNull(
              funcionario.valorPorAula
            ),

          valorPorTurma:
            numeroDecimalOuNull(
              funcionario.valorPorTurma
            ),

          valorPorDisciplina:
            numeroDecimalOuNull(
              funcionario
                .valorPorDisciplina
            ),

          duracaoHoraAulaMinutos:
            numeroInteiroOuNull(
              funcionario
                .duracaoHoraAulaMinutos
            ),

          cargaHorariaSemanal:
            numeroDecimalOuNull(
              funcionario
                .cargaHorariaSemanal
            ),

          cargaHorariaMensal:
            numeroInteiroOuNull(
              funcionario
                .cargaHorariaMensal
            ),

          observacoesRemuneracao:
            limparTexto(
              funcionario
                .observacoesRemuneracao
            ) || null,
        }
      );

    const dadosRemuneracaoNovos =
      normalizarRemuneracao(
        tipoRemuneracaoNovo,
        {
          salarioBase:
            temCampo("salarioBase")
              ? numeroDecimalOuNull(
                  body.salarioBase
                )
              : numeroDecimalOuNull(
                  funcionario.salarioBase
                ),

          valorHoraAula:
            temCampo("valorHoraAula")
              ? numeroDecimalOuNull(
                  body.valorHoraAula
                )
              : numeroDecimalOuNull(
                  funcionario.valorHoraAula
                ),

          valorHoraTrabalhada:
            temCampo(
              "valorHoraTrabalhada"
            )
              ? numeroDecimalOuNull(
                  body.valorHoraTrabalhada
                )
              : numeroDecimalOuNull(
                  funcionario
                    .valorHoraTrabalhada
                ),

          valorPorAula:
            temCampo("valorPorAula")
              ? numeroDecimalOuNull(
                  body.valorPorAula
                )
              : numeroDecimalOuNull(
                  funcionario.valorPorAula
                ),

          valorPorTurma:
            temCampo("valorPorTurma")
              ? numeroDecimalOuNull(
                  body.valorPorTurma
                )
              : numeroDecimalOuNull(
                  funcionario.valorPorTurma
                ),

          valorPorDisciplina:
            temCampo(
              "valorPorDisciplina"
            )
              ? numeroDecimalOuNull(
                  body.valorPorDisciplina
                )
              : numeroDecimalOuNull(
                  funcionario
                    .valorPorDisciplina
                ),

          duracaoHoraAulaMinutos:
            temCampo(
              "duracaoHoraAulaMinutos"
            )
              ? numeroInteiroOuNull(
                  body.duracaoHoraAulaMinutos
                )
              : numeroInteiroOuNull(
                  funcionario
                    .duracaoHoraAulaMinutos
                ),

          cargaHorariaSemanal:
            temCampo(
              "cargaHorariaSemanal"
            )
              ? numeroDecimalOuNull(
                  body.cargaHorariaSemanal
                )
              : numeroDecimalOuNull(
                  funcionario
                    .cargaHorariaSemanal
                ),

          cargaHorariaMensal:
            temCampo(
              "cargaHorariaMensal"
            )
              ? numeroInteiroOuNull(
                  body.cargaHorariaMensal
                )
              : numeroInteiroOuNull(
                  funcionario
                    .cargaHorariaMensal
                ),

          observacoesRemuneracao:
            temCampo(
              "observacoesRemuneracao"
            )
              ? limparTexto(
                  body.observacoesRemuneracao
                ) || null
              : limparTexto(
                  funcionario
                    .observacoesRemuneracao
                ) || null,
        }
      );

    if (
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.MENSAL &&
      dadosRemuneracaoNovos.salarioBase ===
        null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.HORA_AULA &&
      dadosRemuneracaoNovos.valorHoraAula ===
        null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.HORA_TRABALHADA &&
      dadosRemuneracaoNovos
        .valorHoraTrabalhada === null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.POR_AULA &&
      dadosRemuneracaoNovos.valorPorAula ===
        null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.POR_TURMA &&
      dadosRemuneracaoNovos.valorPorTurma ===
        null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.POR_DISCIPLINA &&
      dadosRemuneracaoNovos
        .valorPorDisciplina === null
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
      tipoRemuneracaoNovo ===
        TipoRemuneracaoRH.MISTO &&
      dadosRemuneracaoNovos.salarioBase ===
        null &&
      dadosRemuneracaoNovos.valorHoraAula ===
        null &&
      dadosRemuneracaoNovos
        .valorHoraTrabalhada === null &&
      dadosRemuneracaoNovos.valorPorAula ===
        null &&
      dadosRemuneracaoNovos.valorPorTurma ===
        null &&
      dadosRemuneracaoNovos
        .valorPorDisciplina === null
    ) {
      return NextResponse.json(
        {
          error:
            "Na remuneração mista, informe pelo menos um valor.",
        },
        { status: 400 }
      );
    }

    const houveAlteracaoRemuneracao =
      !remuneracoesSaoIguais(
        dadosRemuneracaoAnteriores,
        dadosRemuneracaoNovos
      );

    const motivoAlteracaoRemuneracao =
      limparTexto(
        body.motivoAlteracaoRemuneracao
      );

    const vigenciaInicioTexto =
      limparTexto(
        body.vigenciaInicioRemuneracao
      );

    const vigenciaInicioRemuneracao =
      vigenciaInicioTexto
        ? new Date(vigenciaInicioTexto)
        : null;

    if (
      vigenciaInicioRemuneracao &&
      Number.isNaN(
        vigenciaInicioRemuneracao.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A data e a hora de início da nova remuneração são inválidas.",
        },
        { status: 400 }
      );
    }

    if (
      houveAlteracaoRemuneracao &&
      !motivoAlteracaoRemuneracao
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o motivo da alteração da remuneração.",
        },
        { status: 400 }
      );
    }

    if (
      houveAlteracaoRemuneracao &&
      !vigenciaInicioRemuneracao
    ) {
      return NextResponse.json(
        {
          error:
            "Informe a data e a hora em que a nova remuneração começa a valer.",
        },
        { status: 400 }
      );
    }

    const statusFuncionario =
      temCampo("statusFuncionario")
        ? limparTexto(
            body.statusFuncionario
          ).toUpperCase() || "ATIVO"
        : funcionario.statusFuncionario;

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: funcionario.userId,
            },
            data: {
              nome,
              email,
              role,
            },
          });

          const funcionarioAtualizado =
            await tx.funcionario.update({
              where: {
                id,
              },
              data: {
                nome,

                cpf:
                  temCampo("cpf")
                    ? body.cpf || null
                    : undefined,

                rg:
                  temCampo("rg")
                    ? body.rg || null
                    : undefined,

                telefone:
                  temCampo("telefone")
                    ? body.telefone || null
                    : undefined,

                dataNascimento:
                  temCampo("dataNascimento")
                    ? dataNascimento
                    : undefined,

                endereco:
                  temCampo("endereco")
                    ? body.endereco || null
                    : undefined,

                numero:
                  temCampo("numero")
                    ? body.numero || null
                    : undefined,

                complemento:
                  temCampo("complemento")
                    ? body.complemento || null
                    : undefined,

                bairro:
                  temCampo("bairro")
                    ? body.bairro || null
                    : undefined,

                cidade:
                  temCampo("cidade")
                    ? body.cidade || null
                    : undefined,

                estado:
                  temCampo("estado")
                    ? body.estado || null
                    : undefined,

                cep:
                  temCampo("cep")
                    ? body.cep || null
                    : undefined,

                cargo:
                  temCampo("cargo")
                    ? body.cargo || null
                    : undefined,

                setor:
                  temCampo("setor")
                    ? body.setor || null
                    : undefined,

                fotoPerfil:
                  temCampo("fotoPerfil")
                    ? body.fotoPerfil || null
                    : undefined,

                documentoUrl:
                  temCampo("documentoUrl")
                    ? body.documentoUrl || null
                    : undefined,

                codigoFuncionario:
                  temCampo(
                    "codigoFuncionario"
                  )
                    ? body.codigoFuncionario ||
                      null
                    : undefined,

                departamentoId:
                  temCampo("departamentoId")
                    ? departamentoId
                    : undefined,

                statusFuncionario:
                  statusFuncionario || "ATIVO",

                motivoStatus:
                  temCampo("motivoStatus")
                    ? body.motivoStatus || null
                    : undefined,

                ativo:
                  temCampo("statusFuncionario")
                    ? statusFuncionario ===
                      "ATIVO"
                    : undefined,

                dataAdmissao:
                  temCampo("dataAdmissao")
                    ? dataAdmissao
                    : undefined,

                dataDesligamento:
                  temCampo("dataDesligamento")
                    ? dataDesligamento
                    : undefined,

                tipoRemuneracao:
                  tipoRemuneracaoNovo,

                salarioBase:
                  dadosRemuneracaoNovos
                    .salarioBase,

                salario:
                  dadosRemuneracaoNovos
                    .salarioBase,

                valorHoraAula:
                  dadosRemuneracaoNovos
                    .valorHoraAula,

                valorHoraTrabalhada:
                  dadosRemuneracaoNovos
                    .valorHoraTrabalhada,

                valorPorAula:
                  dadosRemuneracaoNovos
                    .valorPorAula,

                valorPorTurma:
                  dadosRemuneracaoNovos
                    .valorPorTurma,

                valorPorDisciplina:
                  dadosRemuneracaoNovos
                    .valorPorDisciplina,

                duracaoHoraAulaMinutos:
                  dadosRemuneracaoNovos
                    .duracaoHoraAulaMinutos,

                cargaHorariaSemanal:
                  dadosRemuneracaoNovos
                    .cargaHorariaSemanal,

                cargaHorariaMensal:
                  dadosRemuneracaoNovos
                    .cargaHorariaMensal,

                observacoesRemuneracao:
                  dadosRemuneracaoNovos
                    .observacoesRemuneracao,

                tipoContrato:
                  temCampo("tipoContrato")
                    ? body.tipoContrato || null
                    : undefined,

                jornadaTrabalho:
                  temCampo(
                    "jornadaTrabalho"
                  )
                    ? body.jornadaTrabalho ||
                      null
                    : undefined,

                codigoPonto:
                  temCampo("codigoPonto")
                    ? body.codigoPonto || null
                    : undefined,

                pisPasep:
                  temCampo("pisPasep")
                    ? body.pisPasep || null
                    : undefined,

                banco:
                  temCampo("banco")
                    ? body.banco || null
                    : undefined,

                agencia:
                  temCampo("agencia")
                    ? body.agencia || null
                    : undefined,

                conta:
                  temCampo("conta")
                    ? body.conta || null
                    : undefined,

                pix:
                  temCampo("pix")
                    ? body.pix || null
                    : undefined,
              },
            });

          if (
            houveAlteracaoRemuneracao &&
            vigenciaInicioRemuneracao
          ) {
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

            await tx.historicoRemuneracaoRH.create({
              data: {
                instituicaoId:
                  user.instituicaoId,

                funcionarioId: id,

                professorId:
                  funcionario.professor?.id ||
                  null,

                alteradoPorId:
                  user.id,

                origem:
                  funcionario.professor
                    ? "FUNCIONARIOS_RH_PROFESSOR"
                    : "FUNCIONARIOS_RH_EDICAO",

                funcionarioNomeSnapshot:
                  nome,

                professorNomeSnapshot:
                  funcionario.professor?.nome ||
                  null,

                alteradoPorNomeSnapshot:
                  nomeResponsavel,

                alteradoPorRoleSnapshot:
                  limparTexto(
                    usuarioResponsavel?.role
                  ) ||
                  limparTexto(user.role) ||
                  null,

                tipoAnterior:
                  dadosRemuneracaoAnteriores
                    .tipoRemuneracao,

                tipoNovo:
                  dadosRemuneracaoNovos
                    .tipoRemuneracao!,

                dadosAnteriores:
                  dadosRemuneracaoAnteriores,

                dadosNovos:
                  dadosRemuneracaoNovos,

                vigenciaInicio:
                  vigenciaInicioRemuneracao,

                motivo:
                  motivoAlteracaoRemuneracao,
              },
            });
          }

          return tx.funcionario.findUnique({
            where: {
              id: funcionarioAtualizado.id,
            },
            include: {
              user: true,
              departamento: true,
              professor: true,
            },
          });
        }
      );

    return NextResponse.json({
      message:
        houveAlteracaoRemuneracao
          ? "Funcionário e alteração remuneratória atualizados com sucesso."
          : "Funcionário atualizado com sucesso.",
      funcionario: resultado,
    });
  } catch (error) {
    console.error(
      "ERRO AO ATUALIZAR FUNCIONÁRIO:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar funcionário",
      },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(context.params.id);
    const body = await request.json();
    const acao = String(body?.acao || "").trim().toLowerCase();

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
      include: {
        user: true,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    if (!["bloquear", "desbloquear"].includes(acao)) {
      return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
    }

    const novoStatusAtivo = acao === "desbloquear";

    const usuarioAtualizado = await prisma.user.update({
      where: { id: funcionario.userId },
      data: {
        ativo: novoStatusAtivo,
      },
      select: {
        id: true,
        ativo: true,
      },
    });

    return NextResponse.json({
      message:
        novoStatusAtivo
          ? "Acesso do funcionário desbloqueado com sucesso."
          : "Acesso do funcionário bloqueado com sucesso.",
      user: usuarioAtualizado,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao alterar acesso do funcionário" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const user = await getUserFromToken();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    if (!isAdminLike(user.role)) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const id = Number(context.params.id);

    const funcionario = await prisma.funcionario.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!funcionario) {
      return NextResponse.json(
        { error: "Funcionário não encontrado" },
        { status: 404 }
      );
    }

    await prisma.funcionario.delete({
      where: { id },
    });

    await prisma.user.delete({
      where: { id: funcionario.userId },
    });

    return NextResponse.json({ message: "Funcionário excluído com sucesso" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao excluir funcionário" },
      { status: 500 }
    );
  }
}