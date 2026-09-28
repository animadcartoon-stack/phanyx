import { StatusItemBiblioteca } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";
import { uploadArquivo } from "@/lib/storage/uploadArquivo";

export const dynamic = "force-dynamic";

const LIMITE_CAPA_BYTES = 4 * 1024 * 1024;

function imagemValida(bytes: Uint8Array, tipo: string) {
  if (tipo === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every(
      (valor, indice) => bytes[indice] === valor
    );
  }

  if (tipo === "image/jpeg") {
    return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  }

  return (
    tipo === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  try {
    const usuario = await getUserFromToken();
    const contexto = await obterContextoBiblioteca(usuario);

    if (!usuario || usuario.impersonacao) {
      throw new ErroBiblioteca(403, "Operação não permitida.", "ACESSO_NEGADO");
    }

    exigirPermissaoBiblioteca(usuario, contexto, "biblioteca.catalogo.editar");

    const itemId = Number(params.itemId);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      throw new ErroBiblioteca(400, "Item inválido.", "ITEM_ID_INVALIDO");
    }

    const item = await prisma.bibliotecaItem.findFirst({
      where: { id: itemId, instituicaoId: contexto.instituicaoId },
      select: { status: true },
    });

    if (!item) {
      throw new ErroBiblioteca(404, "Item não encontrado.", "ITEM_NAO_ENCONTRADO");
    }

    if (item.status === StatusItemBiblioteca.ARQUIVADO) {
      throw new ErroBiblioteca(409, "Restaure o item antes de alterar a capa.", "ITEM_ARQUIVADO");
    }

    const arquivo = (await request.formData()).get("file");
    if (!(arquivo instanceof File) || arquivo.size === 0) {
      throw new ErroBiblioteca(400, "Selecione uma imagem para a capa.", "CAPA_AUSENTE");
    }

    if (arquivo.size > LIMITE_CAPA_BYTES) {
      throw new ErroBiblioteca(413, "A capa deve ter no máximo 4 MB.", "CAPA_MUITO_GRANDE");
    }

    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    if (!imagemValida(bytes, arquivo.type)) {
      throw new ErroBiblioteca(400, "Use uma imagem PNG, JPEG ou WebP válida.", "CAPA_INVALIDA");
    }

    const resultado = await uploadArquivo({
      file: arquivo,
      pasta: `biblioteca/capas/${contexto.instituicaoId}/${itemId}`,
    });

    return NextResponse.json({ ok: true, url: resultado.url });
  } catch (erro) {
    const resposta = respostaErroBiblioteca(erro);
    return NextResponse.json(resposta.corpo, { status: resposta.status });
  }
}
