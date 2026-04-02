import { NextRequest } from "next/server";

export type AuthRole = "ADMIN" | "PROFESSOR" | "ALUNO";

export type AuthContext = {
  userId: number;
  role: AuthRole;
  professorId?: number;
  instituicaoId: number;
};

export function getAuth(req: NextRequest): AuthContext {
  const rawRole = req.headers.get("x-role");
  const userId = req.headers.get("x-user-id");
  const professorId = req.headers.get("x-professor-id");
  const instituicaoId = req.headers.get("x-instituicao-id");

  const role = rawRole?.toUpperCase() as AuthRole | undefined;

  if (!role || !userId || !instituicaoId) {
    throw new Error("NAO_AUTORIZADO");
  }

  return {
    role,
    userId: Number(userId),
    professorId: professorId ? Number(professorId) : undefined,
    instituicaoId: Number(instituicaoId),
  };
}

export function assertProfessor(auth: AuthContext) {
  if (auth.role !== "PROFESSOR" || !auth.professorId) {
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