import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const loginUrl = new URL("/login?portal=professor", request.url);

  const response = NextResponse.redirect(loginUrl);

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });

  return response;
}