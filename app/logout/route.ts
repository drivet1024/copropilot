import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "copropilot_session";

export async function GET(request: Request) {
  console.log("[logout] START");

  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete(SESSION_COOKIE_NAME);

  console.log("[logout] cookie deleted", {
    cookieName: SESSION_COOKIE_NAME,
  });

  return response;
}