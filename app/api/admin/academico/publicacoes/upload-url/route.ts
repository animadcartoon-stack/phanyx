import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

const LIMITE_500_MB = 500 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getUserFromToken();
    const role = String(user?.role || "").toUpperCase();

    if (!user || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,

      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const parsed = JSON.parse(String(clientPayload || "{}"));
        const atividadeId = Number(parsed?.atividadeId);

        if (!atividadeId || !Number.isFinite(atividadeId)) {
          throw new Error("Publicação inválida para upload.");
        }

        const atividade = await prisma.atividade.findFirst({
          where: {
            id: atividadeId,
            instituicaoId: user.instituicaoId,
          },
          select: { id: true },
        });

        if (!atividade) {
          throw new Error("Publicação não encontrada.");
        }

        return {
          addRandomSuffix: true,
          maximumSizeInBytes: LIMITE_500_MB,
          allowedContentTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/zip",
            "application/x-zip-compressed",
            "application/x-rar-compressed",
            "application/x-7z-compressed",
            "application/octet-stream",
            "text/*",
            "image/*",
            "video/*",
            "audio/*",
          ],
          tokenPayload: JSON.stringify({
            userId: user.id,
            instituicaoId: user.instituicaoId,
            atividadeId,
          }),
        };
      },

      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar upload da publicação",
      },
      { status: 400 }
    );
  }
}