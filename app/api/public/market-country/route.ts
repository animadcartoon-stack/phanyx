import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { marketCountries, type MarketCountry } from "@/lib/market-pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  const country = (await headers()).get("x-vercel-ip-country")?.toUpperCase() || "";
  const supported = marketCountries.includes(country as MarketCountry);
  return NextResponse.json({ country: supported ? country : null }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
