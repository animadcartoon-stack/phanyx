import { NextResponse } from "next/server";

import {
  ErroBiblioteca,
  exigirPermissaoBiblioteca,
  obterContextoBiblioteca,
  respostaErroBiblioteca,
} from "@/lib/biblioteca-acesso";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const usuario = await getUserFromToken();

    if (!usuario) {
      throw new ErroBiblioteca(
        401,
        "Usuário não autenticado.",
        "NAO_AUTENTICADO"
      );
    }

    const contexto =
      await obterContextoBiblioteca(usuario);

    exigirPermissaoBiblioteca(
      usuario,
      contexto,
      "biblioteca.ver",
      "biblioteca.dashboard.ver"
    );

    return NextResponse.json(
      {
        disponivel: true,
        acessoAdministrativo: true,

        modulo: {
          id: contexto.modulo.id,
          plano: contexto.modulo.plano,
          status: contexto.modulo.status,
          testeGratisFimEm:
            contexto.modulo.testeGratisFimEm,
        },

        configuracao: contexto.configuracao
          ? {
              id: contexto.configuracao.id,
              nomeExibicao:
                contexto.configuracao.nomeExibicao,
              permitirDownload:
                contexto.configuracao.permitirDownload,
              permitirAvaliacao:
                contexto.configuracao.permitirAvaliacao,
              permitirFavoritos:
                contexto.configuracao.permitirFavoritos,
              permitirReserva:
                contexto.configuracao.permitirReserva,
              permitirRenovacao:
                contexto.configuracao.permitirRenovacao,
              permitirSugestaoAquisicao:
                contexto.configuracao
                  .permitirSugestaoAquisicao,
            }
          : null,

        operador: contexto.operador
          ? {
              id: contexto.operador.id,
              ativo: contexto.operador.ativo,
            }
          : null,

        armazenamento: {
          contratadoBytes:
            contexto.armazenamento
              .contratadoBytes.toString(),

          extraBytes:
            contexto.armazenamento
              .extraBytes.toString(),

          limiteBytes:
            contexto.armazenamento
              .limiteBytes.toString(),

          utilizadoBytes:
            contexto.armazenamento
              .utilizadoBytes.toString(),

          disponivelBytes:
            contexto.armazenamento
              .disponivelBytes.toString(),
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (erro) {
    const resposta =
      respostaErroBiblioteca(erro);

    return NextResponse.json(
      resposta.corpo,
      {
        status: resposta.status,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}