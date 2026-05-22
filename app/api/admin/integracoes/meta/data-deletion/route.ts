import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    url: "https://phanyx.com.br/admin/integracoes/marketing",
    confirmation_code: "PHANYX_META_DATA_DELETION_RECEIVED",
  });
}