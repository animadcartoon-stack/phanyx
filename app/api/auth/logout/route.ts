import { NextRequest } from "next/server";
import { criarLogoutAdmin } from "@/lib/logout-seguro";

export async function POST(
  request: NextRequest
) {
  return criarLogoutAdmin(request);
}
