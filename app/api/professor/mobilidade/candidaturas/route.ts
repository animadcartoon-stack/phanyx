import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { respostaErroMobilidade } from "@/lib/mobilidade-acesso";
import { inscreverDocenteMobilidade } from "@/lib/mobilidade-docente";
import { getUserFromToken } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  if (req.headers.get("sec-fetch-site") === "cross-site" ||
      !req.headers.get("content-type")?.startsWith("application/json")) {
    return NextResponse.json({ codigo: "NAO_AUTORIZADO" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const ofertaId = body?.ofertaId;
  if (!Number.isSafeInteger(ofertaId) || ofertaId <= 0) {
    return NextResponse.json({ codigo: "OFERTA_INDISPONIVEL" }, { status: 400 });
  }

  try {
    const usuario = await getUserFromToken();
    const candidatura = await inscreverDocenteMobilidade(usuario, ofertaId);
    return NextResponse.json({ ok: true, candidatura }, { status: 201 });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError) {
      if (erro.code === "P2002") {
        return NextResponse.json({ codigo: "CANDIDATURA_DUPLICADA" }, { status: 409 });
      }
      if (erro.code === "P2034") {
        return NextResponse.json({ codigo: "TENTE_NOVAMENTE" }, { status: 409 });
      }
    }

    const resposta = respostaErroMobilidade(erro);
    return NextResponse.json(resposta.corpo, { status: resposta.status });
  }
}
