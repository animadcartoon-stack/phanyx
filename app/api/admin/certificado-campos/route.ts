import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const campos = await prisma.certificadoCampo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({ campos });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao buscar campos do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const tipo = String(body?.tipo || "").trim();

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo do campo não informado." },
        { status: 400 }
      );
    }

    const campo = await prisma.certificadoCampo.create({
      data: {
        instituicaoId: user.instituicaoId,
        tipo,
        x: Number(body?.x ?? 100),
        y: Number(body?.y ?? 100),
        largura: Number(body?.largura ?? 220),
        altura: Number(body?.altura ?? 40),
        fonte: String(body?.fonte || "Helvetica"),
        tamanho: Number(body?.tamanho ?? 18),
        cor: String(body?.cor || "#1e3a8a"),
        alinhamento: String(body?.alinhamento || "left"),
        pagina: Number(body?.pagina ?? 1),
        dadosJson: body?.dadosJson ?? null,
      },
    });

    return NextResponse.json(campo);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao criar campo do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const lineHeight = body?.lineHeight;
    const marcador = body?.marcador;
    const id = Number(body?.id);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "Campo inválido." },
        { status: 400 }
      );
    }

    const campoExistente = await prisma.certificadoCampo.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!campoExistente) {
      return NextResponse.json(
        { error: "Campo não encontrado." },
        { status: 404 }
      );
    }

    const campoAtualizado = await prisma.certificadoCampo.update({
      where: { id },
      data: {

        x: typeof body?.x === "number" ? body.x : campoExistente.x,
        y: typeof body?.y === "number" ? body.y : campoExistente.y,
        largura:
          typeof body?.largura === "number"
            ? body.largura
            : campoExistente.largura,
        altura:
          typeof body?.altura === "number"
            ? body.altura
            : campoExistente.altura,
        fonte:
          typeof body?.fonte === "string"
            ? body.fonte
            : campoExistente.fonte,
        tamanho:
          typeof body?.tamanho === "number"
            ? body.tamanho
            : campoExistente.tamanho,
        cor:
          typeof body?.cor === "string"
            ? body.cor
            : campoExistente.cor,
        alinhamento:
        typeof body?.alinhamento === "string"
      ? body.alinhamento
      : campoExistente.alinhamento,

  // 👇 AQUI É O QUE FALTAVA
  lineHeight:
    typeof lineHeight === "number"
      ? lineHeight
      : campoExistente.lineHeight,

  marcador:
    typeof marcador === "string"
      ? marcador
      : campoExistente.marcador,

      dadosJson:
  body?.dadosJson !== undefined
    ? body.dadosJson
    : campoExistente.dadosJson
},
    });

    return NextResponse.json(campoAtualizado);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao atualizar campo do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json(
        { error: "Campo inválido." },
        { status: 400 }
      );
    }

    const campoExistente = await prisma.certificadoCampo.findFirst({
      where: {
        id,
        instituicaoId: user.instituicaoId,
      },
    });

    if (!campoExistente) {
      return NextResponse.json(
        { error: "Campo não encontrado." },
        { status: 404 }
      );
    }

    await prisma.certificadoCampo.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao excluir campo do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromToken();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await req.json();
    const camposRecebidos = Array.isArray(body?.campos) ? body.campos : [];

    const idsValidosNaTela = camposRecebidos
      .map((campo: any) => Number(campo?.bancoId || campo?.id))
      .filter(
        (id: number) =>
          Number.isFinite(id) && id > 0 && id < 1000000000
      );

    await prisma.$transaction(async (tx) => {
      if (body?.removerAusentes === true) {
  await tx.certificadoCampo.deleteMany({
    where: {
      instituicaoId: user.instituicaoId,
      id: {
        notIn: idsValidosNaTela.length ? idsValidosNaTela : [0],
      },
    },
  });
}

      for (const campo of camposRecebidos) {
        const id = Number(campo?.bancoId || campo?.id);
        const idValido =
          Number.isFinite(id) && id > 0 && id < 1000000000;

        const {
  id: _id,
  bancoId: _bancoId,
  tempId: _tempId,
  arrayPreview: _arrayPreview,
  idOriginalArray: _idOriginalArray,
  dadosJson: dadosJsonRecebido,
  ...campoSemIds
} = campo;

const tipo = String(campoSemIds?.tipo || "").trim();

if (!tipo) {
  continue;
}

const dadosJson = {
  ...(dadosJsonRecebido || {}),
  ...campoSemIds,
};

        const data = {
  instituicaoId: user.instituicaoId,
  tipo,
          x: Number(campo?.x ?? 100),
          y: Number(campo?.y ?? 100),
          largura: Number(campo?.largura ?? 220),
          altura: Number(campo?.altura ?? 40),
          fonte: String(campo?.fonte || "Helvetica"),
          tamanho: Number(campo?.tamanho ?? 18),
          cor: String(campo?.cor || "#1e3a8a"),
          alinhamento: String(campo?.alinhamento || "left"),
          pagina: Number(campo?.pagina ?? 1),
          ordem: Number(campo?.ordem ?? 0),
          lineHeight:
            campo?.lineHeight !== undefined && campo?.lineHeight !== null
              ? Number(campo.lineHeight)
              : null,
          marcador:
            typeof campo?.marcador === "string"
              ? campo.marcador
              : null,
          dadosJson,
        };

        if (idValido) {
          await tx.certificadoCampo.updateMany({
            where: {
              id,
              instituicaoId: user.instituicaoId,
            },
            data,
          });
        } else {
          await tx.certificadoCampo.create({
            data,
          });
        }
      }

      await tx.certificado.updateMany({
        where: {
          instituicaoId: user.instituicaoId,
        },
        data: {
          arquivoUrl: null,
        },
      });
    });

    const campos = await prisma.certificadoCampo.findMany({
      where: {
        instituicaoId: user.instituicaoId,
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json({
  ok: true,
  campos: campos.map((campo: any) => {
    const dados = campo.dadosJson || {};

    return {
      ...campo,
      ...dados,
      bancoId: campo.id,
      id: campo.id,
    };
  }),
});
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Erro ao salvar modelo completo do certificado.",
        detalhe: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}