import "server-only";

export const GB_EM_BYTES =
  1024n * 1024n * 1024n;

export const CODIGOS_PLANOS_BIBLIOTECA = [
  "BIBLIOTECA_ESSENCIAL",
  "BIBLIOTECA_PROFISSIONAL",
  "BIBLIOTECA_AVANCADA",
] as const;

export type CodigoPlanoBiblioteca =
  (typeof CODIGOS_PLANOS_BIBLIOTECA)[number];

export type PlanoBiblioteca = {
  codigo: CodigoPlanoBiblioteca;
  nome: string;
  descricao: string;

  valorMensalCentavos: number;

  armazenamentoGb: number;
  armazenamentoBytes: bigint;

  destaque: boolean;
  recursos: readonly string[];
};

const RECURSOS_BIBLIOTECA = [
  "Biblioteca física e digital",
  "Livros, artigos, pesquisas e documentos",
  "Vídeos, áudios e documentários",
  "Prateleiras virtuais",
  "Empréstimos, reservas e renovações",
  "Favoritos e progresso de leitura",
  "Recomendações acadêmicas",
  "Operador da biblioteca",
  "Relatórios e auditoria",
] as const;

function converterGbParaBytes(
  quantidadeGb: number
): bigint {
  if (
    !Number.isInteger(quantidadeGb) ||
    quantidadeGb <= 0
  ) {
    throw new Error(
      "Quantidade de armazenamento inválida."
    );
  }

  return BigInt(quantidadeGb) * GB_EM_BYTES;
}

export const PLANOS_BIBLIOTECA = {
  BIBLIOTECA_ESSENCIAL: {
    codigo: "BIBLIOTECA_ESSENCIAL",
    nome: "Biblioteca Essencial",
    descricao:
      "Biblioteca Virtual completa para instituições que estão iniciando seu acervo digital.",

    valorMensalCentavos: 9900,

    armazenamentoGb: 10,
    armazenamentoBytes:
      converterGbParaBytes(10),

    destaque: false,
    recursos: RECURSOS_BIBLIOTECA,
  },

  BIBLIOTECA_PROFISSIONAL: {
    codigo: "BIBLIOTECA_PROFISSIONAL",
    nome: "Biblioteca Profissional",
    descricao:
      "Mais armazenamento para instituições com um acervo crescente de livros, artigos e mídias.",

    valorMensalCentavos: 24900,

    armazenamentoGb: 50,
    armazenamentoBytes:
      converterGbParaBytes(50),

    destaque: true,
    recursos: RECURSOS_BIBLIOTECA,
  },

  BIBLIOTECA_AVANCADA: {
    codigo: "BIBLIOTECA_AVANCADA",
    nome: "Biblioteca Avançada",
    descricao:
      "Grande capacidade para instituições com milhares de obras e conteúdo multimídia.",

    valorMensalCentavos: 59900,

    armazenamentoGb: 200,
    armazenamentoBytes:
      converterGbParaBytes(200),

    destaque: false,
    recursos: RECURSOS_BIBLIOTECA,
  },
} satisfies Record<
  CodigoPlanoBiblioteca,
  PlanoBiblioteca
>;

export function normalizarCodigoPlanoBiblioteca(
  valor: unknown
): CodigoPlanoBiblioteca | null {
  const codigo = String(valor || "")
    .trim()
    .toUpperCase();

  const encontrado =
    CODIGOS_PLANOS_BIBLIOTECA.find(
      (item) => item === codigo
    );

  return encontrado || null;
}

export function obterPlanoBiblioteca(
  valor: unknown
): PlanoBiblioteca | null {
  const codigo =
    normalizarCodigoPlanoBiblioteca(valor);

  if (!codigo) {
    return null;
  }

  return PLANOS_BIBLIOTECA[codigo];
}

export function obterValorMensalPlanoBiblioteca(
  plano: PlanoBiblioteca
): number {
  return plano.valorMensalCentavos / 100;
}

export function listarPlanosBiblioteca() {
  return CODIGOS_PLANOS_BIBLIOTECA.map(
    (codigo) => {
      const plano = PLANOS_BIBLIOTECA[codigo];

      // Não enviamos BigInt diretamente para JSON.
      return {
        codigo: plano.codigo,
        nome: plano.nome,
        descricao: plano.descricao,
        valorMensal:
          plano.valorMensalCentavos / 100,
        armazenamentoGb:
          plano.armazenamentoGb,
        destaque: plano.destaque,
        recursos: [...plano.recursos],
      };
    }
  );
}