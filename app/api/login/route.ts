import { NextResponse } from "next/server";
import { SignJWT } from "jose";

import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";

const SESSION_COOKIE_NAME = "copropilot_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("[api/login] JWT_SECRET is missing");
    throw new Error("JWT_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

export async function POST(request: Request) {
  console.log("[api/login] START");

  try {
    const body = await request.json();

    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "missing" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "inactive" },
        { status: 403 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        organizationId: user.organizationId,
        condoId: user.condoId,
        unitId: user.unitId,
      },
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecret());

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/dashboard",
    });

    const isProduction = process.env.NODE_ENV === "production";

response.cookies.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
  ...(isProduction
    ? {
        domain: "copropilot.app",
      }
    : {}),
});

    console.log("[api/login] cookie set", {
      cookieName: SESSION_COOKIE_NAME,
      maxAge: SESSION_MAX_AGE_SECONDS,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("[api/login] ERROR", error);

    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
