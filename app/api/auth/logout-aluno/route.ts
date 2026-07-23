import { NextRequest } from "next/server";
import { criarLogoutSeguro } from "@/lib/logout-seguro";

export async function GET(
  request: NextRequest
) {
  return criarLogoutSeguro(
    request,
    "/login?portal=aluno"
  );
}

export async function POST(
  request: NextRequest
) {
  return criarLogoutSeguro(
    request,
    "/login?portal=aluno"
  );
}