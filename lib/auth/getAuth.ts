import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export type AuthRole = "ADMIN" | "PROFESSOR" | "ALUNO";

export type AuthContext = {
  userId: number;
  role: AuthRole;
  professorId?: number;
  instituicaoId: number;
};

type TokenPayload = {
  id?: number;
  role?: string;
  instituicaoId?: number;
  professorId?: number;
};

export function getAuth(req: NextRequest): AuthContext {
  const rawRole = req.headers.get("x-role");
  const userId = req.headers.get("x-user-id");
  const professorId = req.headers.get("x-professor-id");
  const instituicaoId = req.headers.get("x-instituicao-id");

  const role = rawRole?.toUpperCase() as AuthRole | undefined;

  if (role && userId && instituicaoId) {
    return {
      role,
      userId: Number(userId),
      professorId: professorId ? Number(professorId) : undefined,
      instituicaoId: Number(instituicaoId),
    };
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    throw new Error("NAO_AUTORIZADO");
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as TokenPayload;

    const tokenRole = String(decoded.role || "").toUpperCase() as
      | AuthRole
      | "";

    if (!decoded.id || !tokenRole || !decoded.instituicaoId) {
      throw new Error("NAO_AUTORIZADO");
    }

    return {
      role: tokenRole,
      userId: Number(decoded.id),
      professorId: decoded.professorId
        ? Number(decoded.professorId)
        : undefined,
      instituicaoId: Number(decoded.instituicaoId),
    };
  } catch {
    throw new Error("NAO_AUTORIZADO");
  }
}

export function assertProfessor(auth: AuthContext) {
  if (auth.role !== "PROFESSOR") {
    throw new Error("SEM_PERMISSAO_PROFESSOR");
  }
}

export function assertAluno(auth: AuthContext) {
  if (auth.role !== "ALUNO") {
    throw new Error("SEM_PERMISSAO_ALUNO");
  }
}

export function assertAdmin(auth: AuthContext) {
  if (auth.role !== "ADMIN") {
    throw new Error("SEM_PERMISSAO_ADMIN");
  }
}