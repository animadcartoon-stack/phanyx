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
    String(valor).trim() === ""
  ) {
    return null;
  }

  const texto = String(valor).trim();

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
    String(valor).trim() === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isInteger(numero) && numero > 0
    ? numero
    : null;
}

async function gerarCodigoFuncionario(
  instituicaoId: number
) {
  const ultimoFuncionario =
    await prisma.funcionario.findFirst({
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

  const codigoAtual = String(
    ultimoFuncionario?.codigoFuncionario || ""
  ).replace(/\D/g, "");

  const proximoNumero = codigoAtual
    ? Number(codigoAtual) + 1
    : 1;

  return String(proximoNumero).padStart(4, "0");
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

type SnapshotRemuneracaoRH = {
  tipoRemuneracao: TipoRemuneracaoRH | null;

  salarioBase: number | null;
  valorHoraAula: number | null;
  valorHoraTrabalhada: number | null;
  valorPorAula: number | null;
  valorPorTurma: number | null;
  valorPorDisciplina: number | null;

  duracaoHoraAulaMinutos: number | null;
  cargaHorariaSemanal: number | null;
  cargaHorariaMensal: number | null;
};

function remuneracoesSaoIguais(
  anterior: SnapshotRemuneracaoRH,
  nova: SnapshotRemuneracaoRH
) {
  return JSON.stringify(anterior) === JSON.stringify(nova);
}

export async function GET(
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

    const { id } = context.params;

    const professor = await prisma.professor.findFirst({
      where: {
        id: Number(id),
        instituicaoId: user.instituicaoId,
      },
      include: {
  user: true,
  turmas: true,
  polo: true,
  funcionario: {
    include: {
      departamento: true,
    },
  },
},
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(professor);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao buscar professor" },
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
        { error: "Usuário sem instituição vinculada." },
        { status: 400 }
      );
    }

    const professorId = Number(context.params.id);

    if (
      !Number.isInteger(professorId) ||
      professorId <= 0
    ) {
      return NextResponse.json(
        { error: "Professor inválido." },
        { status: 400 }
      );
    }

    const body = await request.json();

    const temCampo = (campo: string) =>
      Object.prototype.hasOwnProperty.call(
        body,
        campo
      );

    const professorExistente =
      await prisma.professor.findFirst({
        where: {
          id: professorId,
          instituicaoId: user.instituicaoId,
        },
        include: {
          user: true,
          funcionario: true,
        },
      });

    if (!professorExistente) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    const nome = limparTexto(body.nome);

    const email = limparTexto(
      body.email
    ).toLowerCase();

    if (!nome) {
      return NextResponse.json(
        {
          error:
            "O nome do professor é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "O email do professor é obrigatório.",
        },
        { status: 400 }
      );
    }

    const usuarioComMesmoEmail =
      await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          id: true,
        },
      });

    if (
      usuarioComMesmoEmail &&
      usuarioComMesmoEmail.id !==
        professorExistente.userId
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
     * Polo
     */
    const poloFoiInformado =
      temCampo("poloId");

    const poloId = poloFoiInformado
      ? numeroInteiroOuNull(body.poloId)
      : professorExistente.poloId;

    if (
      poloFoiInformado &&
      body.poloId !== null &&
      body.poloId !== undefined &&
      String(body.poloId).trim() !== "" &&
      !poloId
    ) {
      return NextResponse.json(
        {
          error:
            "O polo informado é inválido.",
        },
        { status: 400 }
      );
    }

    if (poloId !== null) {
      const polo =
        await prisma.polo.findFirst({
          where: {
            id: poloId,
            instituicaoId:
              user.instituicaoId,
          },
          select: {
            id: true,
          },
        });

      if (!polo) {
        return NextResponse.json(
          {
            error:
              "Polo inválido para esta instituição.",
          },
          { status: 400 }
        );
      }
    }

    /*
     * Vínculo com o RH
     *
     * Enquanto a tela não enviar possuiVinculoRH,
     * preservamos a situação atual.
     */
    const vinculoRHFoiInformado =
      temCampo("possuiVinculoRH");

    const desejaVinculoRH =
      vinculoRHFoiInformado
        ? body.possuiVinculoRH === true
        : Boolean(
            professorExistente.funcionarioId
          );

    if (
      vinculoRHFoiInformado &&
      body.possuiVinculoRH === false &&
      professorExistente.funcionarioId
    ) {
      return NextResponse.json(
        {
          error:
            "Este professor já possui vínculo trabalhista. O vínculo não pode ser removido por esta edição. Faça o desligamento ou arquivamento pelo módulo de RH para preservar o histórico.",
        },
        { status: 409 }
      );
    }

    /*
     * Departamento
     */
    const departamentoFoiInformado =
      temCampo("departamentoId");

    const departamentoId =
      departamentoFoiInformado
        ? numeroInteiroOuNull(
            body.departamentoId
          )
        : professorExistente.funcionario
            ?.departamentoId ?? null;

    if (
      departamentoFoiInformado &&
      body.departamentoId !== null &&
      body.departamentoId !== undefined &&
      String(
        body.departamentoId
      ).trim() !== "" &&
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
     * Remuneração
     */
    const tipoRemuneracaoTexto =
      limparTexto(
        body.tipoRemuneracao
      ).toUpperCase();

    const tipoRemuneracao =
      obterTipoRemuneracao(
        body.tipoRemuneracao
      );

    if (
      tipoRemuneracaoTexto &&
      !tipoRemuneracao
    ) {
      return NextResponse.json(
        {
          error:
            "A modalidade de remuneração informada é inválida.",
        },
        { status: 400 }
      );
    }

    if (
      desejaVinculoRH &&
      !professorExistente.funcionarioId &&
      !tipoRemuneracao
    ) {
      return NextResponse.json(
        {
          error:
            "Selecione a modalidade de remuneração para criar o vínculo do professor com o RH.",
        },
        { status: 400 }
      );
    }

    let codigoFuncionario =
      limparTexto(
        body.codigoFuncionario
      ) ||
      professorExistente.codigoFuncionario ||
      professorExistente.funcionario
        ?.codigoFuncionario ||
      null;

    if (
      desejaVinculoRH &&
      !codigoFuncionario
    ) {
      codigoFuncionario =
        await gerarCodigoFuncionario(
          user.instituicaoId
        );
    }

    const salarioBase =
      numeroDecimalOuNull(
        body.salarioBase
      );

    const valorHoraAula =
      numeroDecimalOuNull(
        body.valorHoraAula
      );

    const valorHoraTrabalhada =
      numeroDecimalOuNull(
        body.valorHoraTrabalhada
      );

    const valorPorAula =
      numeroDecimalOuNull(
        body.valorPorAula
      );

    const valorPorTurma =
      numeroDecimalOuNull(
        body.valorPorTurma
      );

    const valorPorDisciplina =
      numeroDecimalOuNull(
        body.valorPorDisciplina
      );

    const cargaHorariaSemanal =
      numeroDecimalOuNull(
        body.cargaHorariaSemanal
      );

    const duracaoHoraAulaMinutos =
      numeroInteiroOuNull(
        body.duracaoHoraAulaMinutos
      );

    const cargaHorariaMensal =
      numeroInteiroOuNull(
        body.cargaHorariaMensal
      );

    const statusFuncionario =
      temCampo("statusFuncionario")
        ? limparTexto(
            body.statusFuncionario
          ).toUpperCase() || "ATIVO"
        : null;

/*
 * Auditoria da alteração de remuneração
 */
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
        "A data e hora de início da nova remuneração são inválidas.",
    },
    { status: 400 }
  );
}

const funcionarioAtual =
  professorExistente.funcionario;

const dadosRemuneracaoAnteriores:
  | SnapshotRemuneracaoRH
  | null = funcionarioAtual
  ? {
      tipoRemuneracao:
        funcionarioAtual.tipoRemuneracao ??
        null,

      salarioBase:
        numeroDecimalOuNull(
          funcionarioAtual.salarioBase
        ),

      valorHoraAula:
        numeroDecimalOuNull(
          funcionarioAtual.valorHoraAula
        ),

      valorHoraTrabalhada:
        numeroDecimalOuNull(
          funcionarioAtual.valorHoraTrabalhada
        ),

      valorPorAula:
        numeroDecimalOuNull(
          funcionarioAtual.valorPorAula
        ),

      valorPorTurma:
        numeroDecimalOuNull(
          funcionarioAtual.valorPorTurma
        ),

      valorPorDisciplina:
        numeroDecimalOuNull(
          funcionarioAtual.valorPorDisciplina
        ),

      duracaoHoraAulaMinutos:
        numeroInteiroOuNull(
          funcionarioAtual
            .duracaoHoraAulaMinutos
        ),

      cargaHorariaSemanal:
        numeroDecimalOuNull(
          funcionarioAtual
            .cargaHorariaSemanal
        ),

      cargaHorariaMensal:
        numeroInteiroOuNull(
          funcionarioAtual
            .cargaHorariaMensal
        ),
    }
  : null;

const tipoRemuneracaoNovo =
  temCampo("tipoRemuneracao")
    ? tipoRemuneracao
    : funcionarioAtual
        ?.tipoRemuneracao ?? null;

if (
  desejaVinculoRH &&
  !tipoRemuneracaoNovo
) {
  return NextResponse.json(
    {
      error:
        "Selecione a modalidade de remuneração do professor.",
    },
    { status: 400 }
  );
}

const dadosRemuneracaoNovos:
  | SnapshotRemuneracaoRH
  | null = desejaVinculoRH
  ? {
      tipoRemuneracao:
        tipoRemuneracaoNovo,

      salarioBase:
        temCampo("salarioBase")
          ? salarioBase
          : numeroDecimalOuNull(
              funcionarioAtual?.salarioBase
            ),

      valorHoraAula:
        temCampo("valorHoraAula")
          ? valorHoraAula
          : numeroDecimalOuNull(
              funcionarioAtual?.valorHoraAula
            ),

      valorHoraTrabalhada:
        temCampo("valorHoraTrabalhada")
          ? valorHoraTrabalhada
          : numeroDecimalOuNull(
              funcionarioAtual
                ?.valorHoraTrabalhada
            ),

      valorPorAula:
        temCampo("valorPorAula")
          ? valorPorAula
          : numeroDecimalOuNull(
              funcionarioAtual?.valorPorAula
            ),

      valorPorTurma:
        temCampo("valorPorTurma")
          ? valorPorTurma
          : numeroDecimalOuNull(
              funcionarioAtual?.valorPorTurma
            ),

      valorPorDisciplina:
        temCampo("valorPorDisciplina")
          ? valorPorDisciplina
          : numeroDecimalOuNull(
              funcionarioAtual
                ?.valorPorDisciplina
            ),

      duracaoHoraAulaMinutos:
        temCampo(
          "duracaoHoraAulaMinutos"
        )
          ? duracaoHoraAulaMinutos
          : numeroInteiroOuNull(
              funcionarioAtual
                ?.duracaoHoraAulaMinutos
            ),

      cargaHorariaSemanal:
        temCampo("cargaHorariaSemanal")
          ? cargaHorariaSemanal
          : numeroDecimalOuNull(
              funcionarioAtual
                ?.cargaHorariaSemanal
            ),

      cargaHorariaMensal:
        temCampo("cargaHorariaMensal")
          ? cargaHorariaMensal
          : numeroInteiroOuNull(
              funcionarioAtual
                ?.cargaHorariaMensal
            ),
    }
  : null;

const houveAlteracaoRemuneracao =
  Boolean(
    dadosRemuneracaoAnteriores &&
      dadosRemuneracaoNovos &&
      !remuneracoesSaoIguais(
        dadosRemuneracaoAnteriores,
        dadosRemuneracaoNovos
      )
  );

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
        "Informe a data e hora em que a nova remuneração começa a valer.",
    },
    { status: 400 }
  );
}

    const resultado =
      await prisma.$transaction(
        async (tx) => {
          await tx.user.update({
            where: {
              id: professorExistente.userId,
            },
            data: {
              nome,
              email,
            },
          });

          let funcionarioId =
            professorExistente.funcionarioId;

          if (desejaVinculoRH) {
            if (funcionarioId) {
              await tx.funcionario.update({
                where: {
                  id: funcionarioId,
                },
                data: {
                  nome,
                  cpf: body.cpf || null,
                  rg: body.rg || null,
                  telefone:
                    body.telefone || null,

                  dataNascimento:
                    body.dataNascimento
                      ? new Date(
                          body.dataNascimento
                        )
                      : null,

                  fotoPerfil:
                    body.fotoPerfil || null,

                  documentoUrl:
                    body.documentoUrl || null,

                  codigoFuncionario,

                  cargo: temCampo("cargo")
                    ? limparTexto(body.cargo) ||
                      "Professor"
                    : undefined,

                  setor: temCampo("setor")
                    ? limparTexto(body.setor) ||
                      "Acadêmico"
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
                      ? body.complemento ||
                        null
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

                  cep: temCampo("cep")
                    ? body.cep || null
                    : undefined,

                  dataAdmissao:
                    temCampo("dataAdmissao")
                      ? body.dataAdmissao
                        ? new Date(
                            body.dataAdmissao
                          )
                        : null
                      : undefined,

                  salarioBase:
                    temCampo("salarioBase")
                      ? salarioBase
                      : undefined,

                  salario:
                    temCampo("salarioBase")
                      ? salarioBase
                      : undefined,

                  tipoRemuneracao:
                    temCampo(
                      "tipoRemuneracao"
                    )
                      ? tipoRemuneracao
                      : undefined,

                  valorHoraAula:
                    temCampo(
                      "valorHoraAula"
                    )
                      ? valorHoraAula
                      : undefined,

                  valorHoraTrabalhada:
                    temCampo(
                      "valorHoraTrabalhada"
                    )
                      ? valorHoraTrabalhada
                      : undefined,

                  valorPorAula:
                    temCampo("valorPorAula")
                      ? valorPorAula
                      : undefined,

                  valorPorTurma:
                    temCampo("valorPorTurma")
                      ? valorPorTurma
                      : undefined,

                  valorPorDisciplina:
                    temCampo(
                      "valorPorDisciplina"
                    )
                      ? valorPorDisciplina
                      : undefined,

                  duracaoHoraAulaMinutos:
                    temCampo(
                      "duracaoHoraAulaMinutos"
                    )
                      ? duracaoHoraAulaMinutos
                      : undefined,

                  cargaHorariaSemanal:
                    temCampo(
                      "cargaHorariaSemanal"
                    )
                      ? cargaHorariaSemanal
                      : undefined,

                  cargaHorariaMensal:
                    temCampo(
                      "cargaHorariaMensal"
                    )
                      ? cargaHorariaMensal
                      : undefined,

                  observacoesRemuneracao:
                    temCampo(
                      "observacoesRemuneracao"
                    )
                      ? limparTexto(
                          body.observacoesRemuneracao
                        ) || null
                      : undefined,

                  tipoContrato:
                    temCampo("tipoContrato")
                      ? body.tipoContrato ||
                        null
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
                      ? body.codigoPonto ||
                        null
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

                  pix: temCampo("pix")
                    ? body.pix || null
                    : undefined,

                  departamentoId:
                    departamentoFoiInformado
                      ? departamentoId
                      : undefined,

                  statusFuncionario:
                    statusFuncionario ??
                    undefined,

                  motivoStatus:
                    temCampo("motivoStatus")
                      ? body.motivoStatus ||
                        null
                      : undefined,

                  ativo:
                    statusFuncionario !== null
                      ? statusFuncionario ===
                        "ATIVO"
                      : undefined,
                },
              });
              if (
  houveAlteracaoRemuneracao &&
  dadosRemuneracaoAnteriores &&
  dadosRemuneracaoNovos &&
  vigenciaInicioRemuneracao
) {
  const nomeUsuarioResponsavel =
    limparTexto(
      (
        user as {
          nome?: string;
        }
      ).nome
    ) || `Usuário ${user.id}`;

  await tx.historicoRemuneracaoRH.create({
    data: {
      instituicaoId:
        user.instituicaoId,

      funcionarioId,
      professorId,

      alteradoPorId:
        user.id,

      origem:
        "PROFESSORES_RH",

      funcionarioNomeSnapshot:
        funcionarioAtual?.nome ||
        nome,

      professorNomeSnapshot:
        professorExistente.nome,

      alteradoPorNomeSnapshot:
        nomeUsuarioResponsavel,

      alteradoPorRoleSnapshot:
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
            } else {
              const statusInicial =
                statusFuncionario || "ATIVO";

              const novoFuncionario =
                await tx.funcionario.create({
                  data: {
                    nome,
                    cpf: body.cpf || null,
                    rg: body.rg || null,
                    telefone:
                      body.telefone || null,

                    dataNascimento:
                      body.dataNascimento
                        ? new Date(
                            body.dataNascimento
                          )
                        : null,

                    endereco:
                      body.endereco || null,
                    numero:
                      body.numero || null,
                    complemento:
                      body.complemento ||
                      null,
                    bairro:
                      body.bairro || null,
                    cidade:
                      body.cidade || null,
                    estado:
                      body.estado || null,
                    cep: body.cep || null,

                    cargo:
                      limparTexto(
                        body.cargo
                      ) || "Professor",

                    setor:
                      limparTexto(
                        body.setor
                      ) || "Acadêmico",

                    fotoPerfil:
                      body.fotoPerfil || null,

                    documentoUrl:
                      body.documentoUrl ||
                      null,

                    codigoFuncionario,

                    dataAdmissao:
                      body.dataAdmissao
                        ? new Date(
                            body.dataAdmissao
                          )
                        : null,

                    salarioBase,
                    salario: salarioBase,

                    tipoRemuneracao,

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
                      body.tipoContrato ||
                      null,

                    jornadaTrabalho:
                      body.jornadaTrabalho ||
                      null,

                    codigoPonto:
                      body.codigoPonto ||
                      null,

                    pisPasep:
                      body.pisPasep || null,

                    banco:
                      body.banco || null,
                    agencia:
                      body.agencia || null,
                    conta:
                      body.conta || null,
                    pix: body.pix || null,

                    departamentoId,

                    instituicaoId:
                      user.instituicaoId,

                    userId:
                      professorExistente.userId,

                    statusFuncionario:
                      statusInicial,

                    motivoStatus:
                      body.motivoStatus ||
                      null,

                    ativo:
                      statusInicial ===
                      "ATIVO",
                  },
                });

              funcionarioId =
                novoFuncionario.id;
            }
          }

          return tx.professor.update({
            where: {
              id: professorId,
            },
            data: {
              nome,
              cpf: body.cpf || null,
              rg: body.rg || null,
              telefone:
                body.telefone || null,

              dataNascimento:
                body.dataNascimento
                  ? new Date(
                      body.dataNascimento
                    )
                  : null,

              titulacao:
                body.titulacao || null,

              especialidade:
                body.especialidade ||
                null,

              formacao:
                body.formacao || null,

              areaAtuacao:
                body.areaAtuacao || null,

              miniBio:
                body.miniBio || null,

              codigoFuncionario,
              fotoPerfil:
                body.fotoPerfil || null,

              documentoUrl:
                body.documentoUrl || null,

              slug: body.slug || null,
              poloId,

              funcionarioId:
                funcionarioId ?? null,
            },
            include: {
              user: true,
              polo: true,
              funcionario: {
                include: {
                  departamento: true,
                },
              },
            },
          });
        }
      );

    return NextResponse.json({
      message:
        "Professor atualizado com sucesso",
      professor: resultado,
    });
  } catch (error) {
    console.error(
      "ERRO AO ATUALIZAR PROFESSOR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erro ao atualizar professor",
      },
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

    const professorId = Number(context.params.id);

    const professor = await prisma.professor.findFirst({
      where: {
        id: professorId,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado" },
        { status: 404 }
      );
    }

    if (professor.funcionarioId) {
  return NextResponse.json(
    {
      error:
        "Este professor possui vínculo trabalhista com o RH e não pode ser excluído diretamente. Realize o desligamento ou arquivamento pelo módulo de RH para preservar holerites, documentos, ponto e histórico.",
    },
    { status: 409 }
  );
}

    await prisma.turma.updateMany({
      where: {
        professorId: professorId,
        instituicaoId: user.instituicaoId,
      },
      data: {
        professorId: null,
      },
    });

    await prisma.professor.delete({
      where: { id: professorId },
    });

    await prisma.user.delete({
      where: { id: professor.userId },
    });

    return NextResponse.json({
      message: "Professor deletado com sucesso",
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error?.message || "Erro ao deletar professor",
      },
      { status: 500 }
    );
  }
}