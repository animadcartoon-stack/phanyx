import { NextResponse } from "next/server";

function buildLogoutResponse(request: Request) {
  const loginUrl = new URL("/login?portal=aluno", request.url);

  const response = NextResponse.redirect(loginUrl, 303);

  response.cookies.set("token", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function GET(request: Request) {
  return buildLogoutResponse(request);
}

export async function POST(request: Request) {
  return buildLogoutResponse(request);
}