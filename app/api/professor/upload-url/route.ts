import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getUserFromToken } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await getUserFromToken();

    if (!user || (user.role !== "PROFESSOR" && user.role !== "professor")) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
    }

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let aulaId: number | null = null;

        try {
          const parsed = JSON.parse(String(clientPayload || "{}"));
          aulaId = Number(parsed?.aulaId);
        } catch {
          aulaId = null;
        }

        if (!aulaId || !Number.isFinite(aulaId) || aulaId <= 0) {
          throw new Error("Aula inválida para upload.");
        }

        const professor = await prisma.professor.findFirst({
          where: {
            userId: user.id,
            instituicaoId: user.instituicaoId,
          },
          select: { id: true },
        });

        if (!professor) {
          throw new Error("Professor não encontrado.");
        }

        const aula = await prisma.aula.findFirst({
          where: {
            id: aulaId,
            instituicaoId: user.instituicaoId,
            turma: {
              professorId: professor.id,
              instituicaoId: user.instituicaoId,
            },
          },
          select: { id: true },
        });

        if (!aula) {
          throw new Error("Aula não encontrada ou sem acesso.");
        }

        const safePath = String(pathname || "");
        const lower = safePath.toLowerCase();

        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/*",
            "video/*",
            "audio/*",
            "application/zip",
            "application/x-rar-compressed",
            "text/*",
          ],
          tokenPayload: JSON.stringify({
            userId: user.id,
            instituicaoId: user.instituicaoId,
            aulaId,
            originalPathname: lower,
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Upload concluído:", {
          blobUrl: blob.url,
          pathname: blob.pathname,
          tokenPayload,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro ao gerar upload",
      },
      { status: 400 }
    );
  }
}