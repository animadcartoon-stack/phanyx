import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

type Portal = "admin" | "professor" | "aluno";

function normalizarRole(role: string) {
  return role.trim().toLowerCase();
}

function podeEntrarNoPortal(portal: Portal, role: string) {
  const roleNormalizada = String(role || "").trim().toLowerCase();

  if (portal === "aluno") {
    return roleNormalizada === "aluno";
  }

  if (portal === "professor") {
    return roleNormalizada === "professor";
  }

  if (portal === "admin") {
  return [
    "admin",
    "gerencia",
    "secretaria",
    "coordenador",
    "financeiro",
    "suporte",
  ].includes(roleNormalizada);
}

  return false;
}

function mensagemPortalIncorreto(portal: Portal) {
  if (portal === "admin") {
    return "Este acesso é exclusivo da instituição/administração.";
  }

  if (portal === "professor") {
    return "Este login é exclusivo para professores.";
  }

  return "Este login é exclusivo para alunos.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, senha, portal } = body as {
      email?: string;
      senha?: string;
      portal?: Portal;
    };

    if (!email || !senha) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const portalNormalizado: Portal =
      portal === "admin" || portal === "professor" || portal === "aluno"
        ? portal
        : "admin";

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 401 }
      );
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return NextResponse.json({ error: "Senha inválida" }, { status: 401 });
    }

    if (!user.instituicaoId) {
      return NextResponse.json(
        { error: "Usuário sem instituição vinculada" },
        { status: 403 }
      );
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET não definido");
    }

    const roleNormalizada = normalizarRole(user.role);

if (!podeEntrarNoPortal(portalNormalizado, roleNormalizada)) {
  return NextResponse.json(
    { error: mensagemPortalIncorreto(portalNormalizado) },
    { status: 403 }
  );
}

    const token = jwt.sign(
      {
        id: user.id,
        role: roleNormalizada,
        email: user.email,
        instituicaoId: user.instituicaoId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({
  user: {
    id: user.id,
    nome: user.nome,
    role: roleNormalizada,
    precisaTrocarSenha: user.precisaTrocarSenha ?? false,
  },
});

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ERRO LOGIN:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}