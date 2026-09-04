import { prisma } from "@/lib/prisma";

export type ModoLogoDocumentoResolvido =
  | "AUTOMATICA"
  | "PRINCIPAL"
  | "FUNDO_CLARO"
  | "FUNDO_ESCURO"
  | "PERSONALIZADA"
  | "SEM_LOGO";

type ResolverLogoDocumentoInput = {
  instituicaoId: number;
  modoLogo?: string | null;
  logoInstituicaoId?: number | null;
  estiloDocumento?: string | null;
  fallbackLogoUrl?: string | null;
};

export type LogoDocumentoResolvida = {
  logoUrl: string | null;
  modoLogo: ModoLogoDocumentoResolvido;
  tipoSelecionado:
    | "PRINCIPAL"
    | "FUNDO_CLARO"
    | "FUNDO_ESCURO"
    | "PERSONALIZADA"
    | "FALLBACK"
    | "SEM_LOGO";
  logoInstituicaoId: number | null;
};

const MODOS_VALIDOS =
  new Set<ModoLogoDocumentoResolvido>([
    "AUTOMATICA",
    "PRINCIPAL",
    "FUNDO_CLARO",
    "FUNDO_ESCURO",
    "PERSONALIZADA",
    "SEM_LOGO",
  ]);

function normalizarModoLogo(
  valor?: string | null
): ModoLogoDocumentoResolvido {
  const modo =
    String(valor || "AUTOMATICA")
      .trim()
      .toUpperCase() as
      ModoLogoDocumentoResolvido;

  return MODOS_VALIDOS.has(modo)
    ? modo
    : "AUTOMATICA";
}

function cabecalhoEhEscuro(
  estiloDocumento?: string | null
) {
  const estilo =
    String(
      estiloDocumento ||
      "INSTITUCIONAL"
    )
      .trim()
      .toUpperCase();

  /*
   * Mantém a mesma regra que já existe
   * na geração oficial de contratos.
   */
  return (
    estilo ===
      "PHANYX_CLASSICO" ||
    estilo ===
      "PHANYX_MODERNO"
  );
}

export async function resolverLogoDocumentoInstituicao({
  instituicaoId,
  modoLogo: modoLogoRecebido,
  logoInstituicaoId,
  estiloDocumento,
  fallbackLogoUrl,
}: ResolverLogoDocumentoInput): Promise<LogoDocumentoResolvida> {
  const modoLogo =
    normalizarModoLogo(
      modoLogoRecebido
    );

  if (
    modoLogo ===
    "SEM_LOGO"
  ) {
    return {
      logoUrl: null,
      modoLogo,
      tipoSelecionado:
        "SEM_LOGO",
      logoInstituicaoId: null,
    };
  }

  const logosInstitucionais =
    await prisma.instituicaoLogo.findMany({
      where: {
        instituicaoId,
        ativa: true,
      },

      select: {
        id: true,
        tipo: true,
        arquivoUrl: true,
        principal: true,
      },

      orderBy: [
        {
          principal: "desc",
        },
        {
          id: "asc",
        },
      ],
    });

  const encontrarPorTipo = (
    tipoLogo: string
  ) =>
    logosInstitucionais.find(
      (logo) =>
        String(logo.tipo) ===
        tipoLogo
    ) || null;

  const logoPrincipal =
    logosInstitucionais.find(
      (logo) =>
        logo.principal
    ) ||
    encontrarPorTipo(
      "PRINCIPAL"
    );

  const logoPersonalizada =
    logoInstituicaoId
      ? logosInstitucionais.find(
          (logo) =>
            logo.id ===
            logoInstituicaoId
        ) || null
      : null;

  const fallback = () => ({
    logoUrl:
      logoPrincipal?.arquivoUrl ||
      fallbackLogoUrl ||
      null,

    logoInstituicaoId:
      logoPrincipal?.id ||
      null,
  });

  if (
    modoLogo ===
    "PERSONALIZADA"
  ) {
    const selecionada =
      logoPersonalizada;

    const fallbackResolvido =
      fallback();

    return {
      logoUrl:
        selecionada?.arquivoUrl ||
        fallbackResolvido.logoUrl,

      modoLogo,

      tipoSelecionado:
        selecionada
          ? "PERSONALIZADA"
          : fallbackResolvido.logoUrl
            ? "PRINCIPAL"
            : "FALLBACK",

      logoInstituicaoId:
        selecionada?.id ||
        fallbackResolvido
          .logoInstituicaoId,
    };
  }

  if (
    modoLogo ===
    "FUNDO_ESCURO"
  ) {
    const selecionada =
      encontrarPorTipo(
        "FUNDO_ESCURO"
      );

    const fallbackResolvido =
      fallback();

    return {
      logoUrl:
        selecionada?.arquivoUrl ||
        fallbackResolvido.logoUrl,

      modoLogo,

      tipoSelecionado:
        selecionada
          ? "FUNDO_ESCURO"
          : fallbackResolvido.logoUrl
            ? "PRINCIPAL"
            : "FALLBACK",

      logoInstituicaoId:
        selecionada?.id ||
        fallbackResolvido
          .logoInstituicaoId,
    };
  }

  if (
    modoLogo ===
    "FUNDO_CLARO"
  ) {
    const selecionada =
      encontrarPorTipo(
        "FUNDO_CLARO"
      );

    const fallbackResolvido =
      fallback();

    return {
      logoUrl:
        selecionada?.arquivoUrl ||
        fallbackResolvido.logoUrl,

      modoLogo,

      tipoSelecionado:
        selecionada
          ? "FUNDO_CLARO"
          : fallbackResolvido.logoUrl
            ? "PRINCIPAL"
            : "FALLBACK",

      logoInstituicaoId:
        selecionada?.id ||
        fallbackResolvido
          .logoInstituicaoId,
    };
  }

  if (
    modoLogo ===
    "PRINCIPAL"
  ) {
    const fallbackResolvido =
      fallback();

    return {
      logoUrl:
        fallbackResolvido.logoUrl,

      modoLogo,

      tipoSelecionado:
        logoPrincipal
          ? "PRINCIPAL"
          : "FALLBACK",

      logoInstituicaoId:
        fallbackResolvido
          .logoInstituicaoId,
    };
  }

  /*
   * AUTOMATICA:
   * mesma regra já consolidada em Contratos.
   * Cabeçalho escuro procura FUNDO_ESCURO;
   * os demais procuram FUNDO_CLARO.
   */
  const tipoAutomatico =
    cabecalhoEhEscuro(
      estiloDocumento
    )
      ? "FUNDO_ESCURO"
      : "FUNDO_CLARO";

  const selecionada =
    encontrarPorTipo(
      tipoAutomatico
    );

  const fallbackResolvido =
    fallback();

  return {
    logoUrl:
      selecionada?.arquivoUrl ||
      fallbackResolvido.logoUrl,

    modoLogo,

    tipoSelecionado:
      selecionada
        ? tipoAutomatico
        : fallbackResolvido.logoUrl
          ? "PRINCIPAL"
          : "FALLBACK",

    logoInstituicaoId:
      selecionada?.id ||
      fallbackResolvido
        .logoInstituicaoId,
  };
}
