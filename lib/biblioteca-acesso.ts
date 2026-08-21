import {
  StatusModuloAdicional,
  TipoModuloAdicional,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  isAdminLike,
  temAlgumaPermissao,
  type UsuarioLogado,
} from "@/lib/server-auth";

export class ErroBiblioteca extends Error {
  status: number;
  codigo: string;
  detalhes?: Record<string, unknown>;

  constructor(
    status: number,
    mensagem: string,
    codigo: string,
    detalhes?: Record<string, unknown>
  ) {
    super(mensagem);

    this.name = "ErroBiblioteca";
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

type OperadorBiblioteca = {
  id: number;
  ativo: boolean;

  podeCatalogar: boolean;
  podePublicar: boolean;
  podeArquivar: boolean;
  podeGerenciarEmprestimo: boolean;
  podeGerenciarReserva: boolean;
  podeGerenciarColecao: boolean;
  podeGerenciarLicenca: boolean;
  podeGerenciarOperador: boolean;
  podeVisualizarRelatorio: boolean;
  podeGerenciarConfiguracao: boolean;
};

export type ContextoBiblioteca = {
  instituicaoId: number;
  usuarioId: number;

  modulo: {
    id: number;
    plano: string;
    status: StatusModuloAdicional;
    testeGratisFimEm: Date | null;
    armazenamentoContratadoBytes: bigint;
    armazenamentoExtraBytes: bigint;
  };

  configuracao: {
    id: number;
    nomeExibicao: string;
    permitirDownload: boolean;
    permitirAvaliacao: boolean;
    permitirFavoritos: boolean;
    permitirReserva: boolean;
    permitirRenovacao: boolean;
    permitirSugestaoAquisicao: boolean;
    armazenamentoUtilizadoBytes: bigint;
  } | null;

  operador: OperadorBiblioteca | null;

  armazenamento: {
    contratadoBytes: bigint;
    extraBytes: bigint;
    limiteBytes: bigint;
    utilizadoBytes: bigint;
    disponivelBytes: bigint;
  };
};

const STATUS_COM_ACESSO = new Set<StatusModuloAdicional>([
  StatusModuloAdicional.ATIVO,
  StatusModuloAdicional.TESTE_GRATIS,
  StatusModuloAdicional.EM_ATRASO,
]);

function numeroInteiroPositivo(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

function operadorPossuiPermissao(
  operador: OperadorBiblioteca,
  chave: string
) {
  switch (chave) {
    case "biblioteca.ver":
    case "biblioteca.dashboard.ver":
    case "biblioteca.catalogo.ver":
    case "biblioteca.exemplares.ver":
    case "biblioteca.arquivos.download":
    case "biblioteca.circulacao.ver":
    case "biblioteca.recomendacoes.ver":
    case "biblioteca.licencas.ver":
    case "biblioteca.operadores.ver":
    case "biblioteca.armazenamento.ver":
      return true;

    case "biblioteca.catalogo.criar":
    case "biblioteca.catalogo.editar":
    case "biblioteca.exemplares.gerenciar":
    case "biblioteca.exemplares.manutencao":
    case "biblioteca.arquivos.upload":
    case "biblioteca.arquivos.gerenciar":
      return operador.podeCatalogar;

    case "biblioteca.catalogo.publicar":
    case "biblioteca.avaliacoes.moderar":
      return operador.podePublicar;

    case "biblioteca.catalogo.arquivar":
    case "biblioteca.exemplares.baixar":
    case "biblioteca.arquivos.excluir":
      return operador.podeArquivar;

    case "biblioteca.emprestimos.gerenciar":
    case "biblioteca.renovacoes.gerenciar":
      return operador.podeGerenciarEmprestimo;

    case "biblioteca.reservas.gerenciar":
      return operador.podeGerenciarReserva;

    case "biblioteca.prateleiras.gerenciar":
    case "biblioteca.recomendacoes.gerenciar":
      return operador.podeGerenciarColecao;

    case "biblioteca.licencas.gerenciar":
      return operador.podeGerenciarLicenca;

    case "biblioteca.operadores.gerenciar":
      return operador.podeGerenciarOperador;

    case "biblioteca.relatorios.ver":
    case "biblioteca.relatorios.exportar":
    case "biblioteca.auditoria.ver":
      return operador.podeVisualizarRelatorio;

    case "biblioteca.configuracoes.gerenciar":
    case "biblioteca.armazenamento.gerenciar":
      return operador.podeGerenciarConfiguracao;

    default:
      return false;
  }
}

export async function obterContextoBiblioteca(
  usuario: UsuarioLogado | null
): Promise<ContextoBiblioteca> {
  if (!usuario) {
    throw new ErroBiblioteca(
      401,
      "Usuário não autenticado.",
      "NAO_AUTENTICADO"
    );
  }

  const instituicaoId = numeroInteiroPositivo(
    usuario.instituicaoId
  );

  const usuarioId = numeroInteiroPositivo(usuario.id);

  if (!instituicaoId || !usuarioId) {
    throw new ErroBiblioteca(
      403,
      "O usuário não está vinculado a uma instituição válida.",
      "INSTITUICAO_INVALIDA"
    );
  }

  const [modulo, configuracao, operador] =
    await Promise.all([
      prisma.moduloAdicionalInstituicao.findUnique({
        where: {
          instituicaoId_tipo: {
            instituicaoId,
            tipo: TipoModuloAdicional.BIBLIOTECA_VIRTUAL,
          },
        },
        select: {
          id: true,
          plano: true,
          status: true,
          testeGratisFimEm: true,
          armazenamentoContratadoBytes: true,
          armazenamentoExtraBytes: true,
        },
      }),

      prisma.bibliotecaConfiguracao.findUnique({
        where: {
          instituicaoId,
        },
        select: {
          id: true,
          nomeExibicao: true,
          permitirDownload: true,
          permitirAvaliacao: true,
          permitirFavoritos: true,
          permitirReserva: true,
          permitirRenovacao: true,
          permitirSugestaoAquisicao: true,
          armazenamentoUtilizadoBytes: true,
        },
      }),

      prisma.bibliotecaOperador.findUnique({
        where: {
          instituicaoId_usuarioId: {
            instituicaoId,
            usuarioId,
          },
        },
        select: {
          id: true,
          ativo: true,
          podeCatalogar: true,
          podePublicar: true,
          podeArquivar: true,
          podeGerenciarEmprestimo: true,
          podeGerenciarReserva: true,
          podeGerenciarColecao: true,
          podeGerenciarLicenca: true,
          podeGerenciarOperador: true,
          podeVisualizarRelatorio: true,
          podeGerenciarConfiguracao: true,
        },
      }),
    ]);

  if (!modulo) {
    throw new ErroBiblioteca(
      403,
      "A Biblioteca Virtual não foi contratada por esta instituição.",
      "MODULO_NAO_CONTRATADO"
    );
  }

  if (!STATUS_COM_ACESSO.has(modulo.status)) {
    const mensagens: Partial<
      Record<StatusModuloAdicional, string>
    > = {
      [StatusModuloAdicional.PENDENTE]:
        "A contratação da Biblioteca Virtual ainda está pendente.",
      [StatusModuloAdicional.SUSPENSO]:
        "A Biblioteca Virtual está temporariamente suspensa.",
      [StatusModuloAdicional.CANCELADO]:
        "A contratação da Biblioteca Virtual foi cancelada.",
    };

    throw new ErroBiblioteca(
      403,
      mensagens[modulo.status] ||
      "A Biblioteca Virtual não está disponível.",
      "MODULO_INDISPONIVEL",
      {
        statusModulo: modulo.status,
      }
    );
  }

  if (
    modulo.status === StatusModuloAdicional.TESTE_GRATIS &&
    (!modulo.testeGratisFimEm ||
      modulo.testeGratisFimEm.getTime() <= Date.now())
  ) {
    throw new ErroBiblioteca(
      403,
      "O período gratuito da Biblioteca Virtual terminou.",
      "TESTE_GRATIS_EXPIRADO"
    );
  }

  const contratadoBytes = BigInt(
    modulo.armazenamentoContratadoBytes
  );

  const extraBytes = BigInt(
    modulo.armazenamentoExtraBytes
  );

  const limiteBytes: bigint =
    contratadoBytes + extraBytes;

  const utilizadoBytes: bigint = BigInt(
    configuracao?.armazenamentoUtilizadoBytes ?? 0
  );

  const disponivelCalculado: bigint =
    limiteBytes - utilizadoBytes;

  const disponivelBytes: bigint =
    disponivelCalculado > 0n
      ? disponivelCalculado
      : 0n;

  return {
    instituicaoId,
    usuarioId,

    modulo,

    configuracao,

    operador:
      operador?.ativo === true
        ? operador
        : null,

    armazenamento: {
      contratadoBytes,
      extraBytes,
      limiteBytes,
      utilizadoBytes,
      disponivelBytes,
    },
  };
}

export function exigirPermissaoBiblioteca(
  usuario: UsuarioLogado,
  contexto: ContextoBiblioteca,
  ...chaves: string[]
) {
  const chavesExigidas =
    chaves.length > 0
      ? chaves
      : ["biblioteca.ver"];

  if (
    usuario.isMasterAdmin ||
    isAdminLike(usuario.role)
  ) {
    return;
  }

  if (!contexto.operador) {
    throw new ErroBiblioteca(
      403,
      "Você não está cadastrado como operador ativo da Biblioteca Virtual.",
      "OPERADOR_NAO_AUTORIZADO"
    );
  }

  const possuiPermissaoAdministrativa =
    temAlgumaPermissao(usuario, chavesExigidas);

  const possuiPermissaoDeOperador =
    chavesExigidas.some((chave) =>
      operadorPossuiPermissao(
        contexto.operador as OperadorBiblioteca,
        chave
      )
    );

  if (
    !possuiPermissaoAdministrativa &&
    !possuiPermissaoDeOperador
  ) {
    throw new ErroBiblioteca(
      403,
      "Você não possui permissão para realizar esta ação na Biblioteca Virtual.",
      "SEM_PERMISSAO_BIBLIOTECA",
      {
        permissoesExigidas: chavesExigidas,
      }
    );
  }
}

export function verificarEspacoParaUpload(
  contexto: ContextoBiblioteca,
  tamanhoArquivoBytes: bigint
) {
  if (tamanhoArquivoBytes <= 0n) {
    throw new ErroBiblioteca(
      400,
      "O tamanho do arquivo é inválido.",
      "TAMANHO_ARQUIVO_INVALIDO"
    );
  }

  const {
    limiteBytes,
    utilizadoBytes,
    disponivelBytes,
  } = contexto.armazenamento;

  if (limiteBytes <= 0n) {
    throw new ErroBiblioteca(
      403,
      "A instituição não possui armazenamento contratado para a biblioteca.",
      "ARMAZENAMENTO_NAO_CONTRATADO"
    );
  }

  if (tamanhoArquivoBytes > disponivelBytes) {
    throw new ErroBiblioteca(
      413,
      "O arquivo ultrapassa o espaço disponível da Biblioteca Virtual.",
      "LIMITE_ARMAZENAMENTO_EXCEDIDO",
      {
        tamanhoArquivoBytes:
          tamanhoArquivoBytes.toString(),
        limiteBytes: limiteBytes.toString(),
        utilizadoBytes: utilizadoBytes.toString(),
        disponivelBytes: disponivelBytes.toString(),
      }
    );
  }
}

export function respostaErroBiblioteca(
  erro: unknown
) {
  if (erro instanceof ErroBiblioteca) {
    return {
      status: erro.status,
      corpo: {
        error: erro.message,
        codigo: erro.codigo,
        detalhes: erro.detalhes,
      },
    };
  }

  console.error(
    "Erro inesperado na Biblioteca Virtual:",
    erro
  );

  return {
    status: 500,
    corpo: {
      error:
        "Não foi possível concluir a operação na Biblioteca Virtual.",
      codigo: "ERRO_INTERNO_BIBLIOTECA",
    },
  };
}