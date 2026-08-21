import { prisma } from "@/lib/prisma";

export type DadosRenderCracha = Record<
  string,
  string | number | null | undefined
>;

export type CrachaEmitidoParaLote = {
  id: number;
  instituicaoId: number;
  tipoPessoa: string;
  pessoaId: number;
  codigoCracha: string | null;
  validadeEm: Date | null;
  instituicao: {
    nome: string;
  };
};

export type PessoaRenderCracha = {
  crachaEmitidoId: number;
  fotoUrl: string | null;
  dados: DadosRenderCracha;
};

function texto(valor: unknown) {
  return String(valor ?? "").trim();
}

function formatarData(valor?: Date | string | null) {
  if (!valor) return "";

  const data =
    valor instanceof Date ? valor : new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
}

function statusLegivel(valor: unknown) {
  const status = texto(valor);

  if (!status) return "";

  return status
    .toLowerCase()
    .split("_")
    .map(
      (parte) =>
        parte.charAt(0).toUpperCase() +
        parte.slice(1)
    )
    .join(" ");
}

function nomeAutomaticoParaCracha(
  valor: unknown
) {
  const nomeCompleto = texto(valor).replace(
    /\s+/g,
    " "
  );

  if (!nomeCompleto) {
    return "";
  }

  const partes = nomeCompleto
    .split(" ")
    .filter(Boolean);

  if (
    partes.length <= 2 ||
    nomeCompleto.length <= 24
  ) {
    return nomeCompleto;
  }

  return `${partes[0]} ${
    partes[partes.length - 1]
  }`;
}

function dadosBase(
  cracha: CrachaEmitidoParaLote
): DadosRenderCracha {
  return {
    codigoCracha: texto(cracha.codigoCracha),
    validadeCracha: formatarData(
      cracha.validadeEm
    ),
    instituicaoNome: cracha.instituicao.nome,
  };
}

function validarLote(
  crachas: CrachaEmitidoParaLote[]
) {
  if (crachas.length === 0) {
    throw new Error(
      "Nenhum crachá foi encontrado para renderização."
    );
  }

  const instituicaoId = crachas[0].instituicaoId;
  const tipoPessoa = texto(
    crachas[0].tipoPessoa
  ).toUpperCase();

  const loteInvalido = crachas.some(
    (cracha) =>
      cracha.instituicaoId !== instituicaoId ||
      texto(cracha.tipoPessoa).toUpperCase() !==
        tipoPessoa ||
      !texto(cracha.codigoCracha)
  );

  if (loteInvalido) {
    throw new Error(
      "O lote possui crachás incompatíveis ou sem código de identificação."
    );
  }

  return {
    instituicaoId,
    tipoPessoa,
  };
}

export async function buscarDadosRenderCrachaLote(
  crachas: CrachaEmitidoParaLote[]
): Promise<PessoaRenderCracha[]> {
  const { instituicaoId, tipoPessoa } =
    validarLote(crachas);

  const pessoaIds = [
    ...new Set(
      crachas.map((cracha) => cracha.pessoaId)
    ),
  ];

  if (tipoPessoa === "ALUNO") {
    const pessoas = await prisma.aluno.findMany({
      where: {
        instituicaoId,
        id: {
          in: pessoaIds,
        },
      },
      select: {
        id: true,
        nome: true,
        nomeSocial: true,
        matricula: true,
        fotoPerfil: true,
        statusAluno: true,
        polo: {
          select: {
            nome: true,
          },
        },
      },
    });

    const mapa = new Map<number, any>(
      pessoas.map((pessoa) => [pessoa.id, pessoa] as const)
    );

    return crachas.map((cracha) => {
      const aluno = mapa.get(cracha.pessoaId);

      if (!aluno) {
        throw new Error(
          `Aluno do crachá ${cracha.id} não encontrado.`
        );
      }

      const nomeCompleto =
        texto(aluno.nomeSocial) ||
        texto(aluno.nome);

      const nomePreferencial =
        nomeAutomaticoParaCracha(nomeCompleto);

      return {
        crachaEmitidoId: cracha.id,
        fotoUrl: aluno.fotoPerfil,
        dados: {
          ...dadosBase(cracha),
          alunoNome: aluno.nome,
          alunoNomeSocial:
            aluno.nomeSocial || "",
          alunoNomePreferencial:
            nomePreferencial,
          nome: nomePreferencial,
          numeroMatricula:
            aluno.matricula || "",
          matricula: aluno.matricula || "",
          poloNome: aluno.polo?.nome || "",
          statusAluno: statusLegivel(
            aluno.statusAluno
          ),
          cursoNome: "",
          turmaNome: "",
          semestre: "",
          modalidade: "",
        },
      };
    });
  }

  if (tipoPessoa === "PROFESSOR") {
    const pessoas =
      await prisma.professor.findMany({
        where: {
          instituicaoId,
          id: {
            in: pessoaIds,
          },
        },
        select: {
          id: true,
          nome: true,
          fotoPerfil: true,
          especialidade: true,
          titulacao: true,
          formacao: true,
          codigoFuncionario: true,
          statusProfessor: true,
          departamento: {
            select: {
              nome: true,
            },
          },
          polo: {
            select: {
              nome: true,
            },
          },
        },
      });

    const mapa = new Map<number, any>(
      pessoas.map((pessoa) => [pessoa.id, pessoa] as const)
    );

    return crachas.map((cracha) => {
      const professor = mapa.get(cracha.pessoaId);

      if (!professor) {
        throw new Error(
          `Professor do crachá ${cracha.id} não encontrado.`
        );
      }

      const nome =
        nomeAutomaticoParaCracha(
          professor.nome
        );

      return {
        crachaEmitidoId: cracha.id,
        fotoUrl: professor.fotoPerfil,
        dados: {
          ...dadosBase(cracha),
          professorNome: nome,
          nome,
          departamentoNome:
            professor.departamento?.nome || "",
          disciplinasProfessor:
            professor.especialidade || "",
          especialidade:
            professor.especialidade || "",
          titulacao: professor.titulacao || "",
          formacao: professor.formacao || "",
          codigoFuncionario:
            professor.codigoFuncionario || "",
          poloNome:
            professor.polo?.nome || "",
          statusProfessor: statusLegivel(
            professor.statusProfessor
          ),
        },
      };
    });
  }

  if (tipoPessoa === "FUNCIONARIO") {
    const pessoas =
      await prisma.funcionario.findMany({
        where: {
          instituicaoId,
          id: {
            in: pessoaIds,
          },
        },
        select: {
          id: true,
          nome: true,
          fotoPerfil: true,
          cargo: true,
          setor: true,
          codigoFuncionario: true,
          statusFuncionario: true,
          departamento: {
            select: {
              nome: true,
            },
          },
        },
      });

    const mapa = new Map<number, any>(
      pessoas.map((pessoa) => [pessoa.id, pessoa] as const)
    );

    return crachas.map((cracha) => {
      const funcionario = mapa.get(
        cracha.pessoaId
      );

      if (!funcionario) {
        throw new Error(
          `Funcionário do crachá ${cracha.id} não encontrado.`
        );
      }

      const nome =
        nomeAutomaticoParaCracha(
          funcionario.nome
        );

      return {
        crachaEmitidoId: cracha.id,
        fotoUrl: funcionario.fotoPerfil,
        dados: {
          ...dadosBase(cracha),
          funcionarioNome: nome,
          nome,
          cargo: funcionario.cargo || "",
          setor: funcionario.setor || "",
          codigoFuncionario:
            funcionario.codigoFuncionario || "",
          departamentoNome:
            funcionario.departamento?.nome ||
            "",
          statusFuncionario: statusLegivel(
            funcionario.statusFuncionario
          ),
        },
      };
    });
  }

  if (tipoPessoa === "VISITANTE") {
    const pessoas =
      await prisma.visitante.findMany({
        where: {
          instituicaoId,
          arquivado: false,
          id: {
            in: pessoaIds,
          },
        },
        select: {
          id: true,
          nome: true,
          fotoPerfil: true,
          empresa: true,
          destino: true,
          pessoaVisitada: true,
          setorVisitado: true,
          motivo: true,
          evento: true,
          codigoVisitante: true,
          codigoCracha: true,
          status: true,
          crachaValidoAte: true,
        },
      });

    const mapa = new Map<number, any>(
      pessoas.map((pessoa) => [pessoa.id, pessoa] as const)
    );

    return crachas.map((cracha) => {
      const visitante = mapa.get(
        cracha.pessoaId
      );

      if (!visitante) {
        throw new Error(
          `Visitante do crachá ${cracha.id} não encontrado.`
        );
      }

      const nome =
        nomeAutomaticoParaCracha(
          visitante.nome
        );

      return {
        crachaEmitidoId: cracha.id,
        fotoUrl: visitante.fotoPerfil,
        dados: {
          ...dadosBase(cracha),
          visitanteNome: nome,
          nome,
          visitanteEmpresa:
            visitante.empresa || "",
          visitanteDestino:
            visitante.destino || "",
          empresa: visitante.empresa || "",
          destino: visitante.destino || "",
          pessoaVisitada:
            visitante.pessoaVisitada || "",
          setorVisitado:
            visitante.setorVisitado || "",
          motivo: visitante.motivo || "",
          evento: visitante.evento || "",
          codigoVisitante:
            visitante.codigoVisitante || "",
          codigoCracha:
            visitante.codigoCracha ||
            texto(cracha.codigoCracha),
          validadeCracha: formatarData(
            visitante.crachaValidoAte ||
              cracha.validadeEm
          ),
          statusVisitante: statusLegivel(
            visitante.status
          ),
        },
      };
    });
  }

  throw new Error(
    `Tipo de pessoa não suportado no lote: ${tipoPessoa}.`
  );
}