import { NextResponse } from "next/server";
import { getUserFromToken } from "@/lib/server-auth";

export async function GET() {
  const user = await getUserFromToken();

  if (
  !user ||
  !["ADMIN", "SUPER_ADMIN", "SECRETARIA", "COORDENADOR"].includes(user.role)
) {
  return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
}

  return NextResponse.json({
    conectado: false,
    instagram: false,
    facebook: false,
    whatsapp: false,
  });
}