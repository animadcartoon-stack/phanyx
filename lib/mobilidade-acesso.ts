export class ErroMobilidade extends Error {
  status: number;
  codigo: string;

  constructor(
    status: number,
    codigo: string,
    mensagem: string
  ) {
    super(mensagem);
    this.name = "ErroMobilidade";
    this.status = status;
    this.codigo = codigo;
  }
}

export type UsuarioMobilidade = {
  instituicaoId?: number | null;
  role?: unknown;
  isMasterAdmin?: boolean | null;
  permissoes?: unknown;
};

function extrairChavesPermissao(
  permissoes: unknown
): string[] {
  if (!Array.isArray(permissoes)) {
    return [];
  }

  return permissoes
    .map((permissao) => {
      if (typeof permissao === "string") {
        return permissao;
      }

      if (
        permissao &&
        typeof permissao === "object" &&
        "chave" in permissao
      ) {
        return String(
          (permissao as { chave?: unknown }).chave ?? ""
        );
      }

      return "";
    })
    .filter(Boolean);
}

function possuiAcessoTotal(
  usuario: UsuarioMobilidade
) {
  const role = String(
    usuario.role ?? ""
  ).toUpperCase();

  return (
    Boolean(usuario.isMasterAdmin) ||
    role === "ADMIN" ||
    role === "SUPER_ADMIN"
  );
}

export function temPermissaoMobilidade(
  usuario: UsuarioMobilidade | null | undefined,
  ...permissoesAceitas: string[]
) {
  if (!usuario) {
    return false;
  }

  if (possuiAcessoTotal(usuario)) {
    return true;
  }

  const chaves =
    extrairChavesPermissao(
      usuario.permissoes
    );

  return (
    chaves.includes("*") ||
    permissoesAceitas.some(
      (chave) =>
        chaves.includes(chave)
    )
  );
}

function exigirUsuarioInstituicao(
  usuario: UsuarioMobilidade | null | undefined
) {
  if (!usuario) {
    throw new ErroMobilidade(
      401,
      "NAO_AUTENTICADO",
      "Usuário não autenticado."
    );
  }

  if (!usuario.instituicaoId) {
    throw new ErroMobilidade(
      403,
      "INSTITUICAO_NAO_IDENTIFICADA",
      "Instituição não identificada."
    );
  }

  return usuario.instituicaoId;
}

export function exigirAcessoMobilidade(
  usuario: UsuarioMobilidade | null | undefined,
  ...permissoesAceitas: string[]
): number {
  const instituicaoId =
    exigirUsuarioInstituicao(
      usuario
    );

  const autorizado =
    temPermissaoMobilidade(
      usuario,
      "mobilidade.ver",
      "mobilidade.gerenciar",
      ...permissoesAceitas
    );

  if (!autorizado) {
    throw new ErroMobilidade(
      403,
      "SEM_PERMISSAO",
      "Usuário sem permissão para acessar Mobilidade Internacional."
    );
  }

  return instituicaoId;
}

export function exigirGerenciamentoMobilidade(
  usuario: UsuarioMobilidade | null | undefined,
  ...permissoesAceitas: string[]
): number {
  const instituicaoId =
    exigirUsuarioInstituicao(
      usuario
    );

  const autorizado =
    temPermissaoMobilidade(
      usuario,
      "mobilidade.gerenciar",
      ...permissoesAceitas
    );

  if (!autorizado) {
    throw new ErroMobilidade(
      403,
      "SEM_PERMISSAO_GERENCIAR",
      "Usuário sem permissão para gerenciar Mobilidade Internacional."
    );
  }

  return instituicaoId;
}

export function respostaErroMobilidade(
  erro: unknown
): {
  status: number;
  corpo: {
    ok: false;
    codigo: string;
  };
} {
  if (erro instanceof ErroMobilidade) {
    return {
      status: erro.status,
      corpo: {
        ok: false,
        codigo: erro.codigo,
      },
    };
  }

  console.error(
    "[mobilidade] Erro não tratado:",
    erro
  );

  return {
    status: 500,
    corpo: {
      ok: false,
      codigo: "ERRO_INTERNO",
    },
  };
}
