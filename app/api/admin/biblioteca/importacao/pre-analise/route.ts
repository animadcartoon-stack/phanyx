import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";

import {
  analisarArquivoImportacao,
  ErroArquivoImportacao,
} from "@/lib/biblioteca-importacao";

import { abrirArquivoImportacao } from "@/lib/biblioteca-importacao-pacote";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const LIMITE_ARQUIVO_BYTES =
  4 * 1024 * 1024;

const EXTENSOES_PERMITIDAS =
  new Set([
    "zip",
    "csv",
    "xls",
    "xlsx",
    "mrc",
    "marc",
    "xml",
  ]);

function responder(
  corpo: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    },
  );
}

function responderErro(
  erro: unknown,
) {
  if (
    erro instanceof
    ErroArquivoImportacao
  ) {
    const resposta =
      respostaErroBiblioteca(
        new ErroBiblioteca(
          erro.status,
          erro.message,
          erro.codigo,
        ),
      );

    return responder(
      resposta.corpo,
      resposta.status,
    );
  }

  const resposta =
    respostaErroBiblioteca(
      erro,
    );

  return responder(
    resposta.corpo,
    resposta.status,
  );
}

function extensaoArquivo(
  nome: string,
) {
  const partes =
    nome
      .toLowerCase()
      .split(".");

  if (partes.length < 2) {
    return "";
  }

  return (
    partes.at(-1) ?? ""
  );
}

export async function POST(
  request: NextRequest,
) {
  try {
    const usuario =
      await getUserFromToken();

    const contexto =
      await obterContextoBiblioteca(
        usuario,
      );

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO",
      );
    }

    if (usuario.impersonacao) {
      throw new ErroBiblioteca(
        403,
        "Não é permitido importar acervo durante uma sessão de suporte.",
        "OPERACAO_BLOQUEADA_EM_IMPERSONACAO",
      );
    }

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.catalogo.criar",
    );

    const formulario =
      await request.formData();

    const entrada =
      formulario.get("arquivo");

    if (
      !entrada ||
      typeof entrada === "string" ||
      typeof entrada.arrayBuffer !==
        "function"
    ) {
      throw new ErroBiblioteca(
        400,
        "Envie um arquivo de acervo para análise.",
        "ARQUIVO_NAO_INFORMADO",
      );
    }

    const arquivo = entrada;

    if (arquivo.size <= 0) {
      throw new ErroBiblioteca(
        400,
        "O arquivo enviado está vazio.",
        "ARQUIVO_VAZIO",
      );
    }

    if (
      arquivo.size >
      LIMITE_ARQUIVO_BYTES
    ) {
      throw new ErroBiblioteca(
        413,
        "O arquivo ultrapassa o limite desta etapa de pré-análise.",
        "ARQUIVO_MUITO_GRANDE",
        {
          limiteBytes:
            LIMITE_ARQUIVO_BYTES,
          tamanhoBytes:
            arquivo.size,
        },
      );
    }

    const extensao =
      extensaoArquivo(
        arquivo.name,
      );

    if (
      !EXTENSOES_PERMITIDAS.has(
        extensao,
      )
    ) {
      throw new ErroBiblioteca(
        400,
        "Use um arquivo CSV, XLS, XLSX, MARC21/ISO2709 (.mrc/.marc) MARCXML (.xml) ou ZIP com catálogo e imagens.",
        "FORMATO_NAO_SUPORTADO",
        {
          extensao:
            extensao || null,
        },
      );
    }

    const buffer =
      Buffer.from(
        await arquivo.arrayBuffer(),
      );

    const pacote = await abrirArquivoImportacao(buffer, arquivo.name);
    const analise = analisarArquivoImportacao(pacote.buffer, pacote.nomeArquivo);

    return responder({
      ok: true,
      arquivo: {
        ...analise.arquivo,
        tamanhoBytes:
          arquivo.size,
        extensao,
      },
      resumo:
        analise.resumo,
      colunas:
        analise.colunas,
      amostra:
        analise.amostra,
      alertas:
        analise.alertas,
      camposDestino:
        analise.camposDestino,
    });
  } catch (erro) {
    return responderErro(
      erro,
    );
  }
}