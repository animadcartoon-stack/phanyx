import { NextRequest } from "next/server";
import { criarLogoutSeguro } from "@/lib/logout-seguro";

export async function POST(
  request: NextRequest
) {
  return criarLogoutSeguro(
    request,
    "/login?portal=admin"
  );
}