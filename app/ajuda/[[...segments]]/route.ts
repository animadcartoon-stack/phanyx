import guides from "@/lib/central-ajuda/guides.json";
import { helpResponse } from "@/lib/central-ajuda/page.mjs";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return helpResponse(new URL(request.url), guides);
}
