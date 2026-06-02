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

    console.log("[api/login] credentials received", {
      email,
      hasPassword: Boolean(password),
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      jwtSecretLength: process.env.JWT_SECRET?.length ?? 0,
      nodeEnv: process.env.NODE_ENV,
    });

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "missing" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("[api/login] user not found", { email });

      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 401 }
      );
    }

    console.log("[api/login] user found", {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      hasPasswordHash: Boolean(user.passwordHash),
    });

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { ok: false, error: "inactive" },
        { status: 403 }
      );
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { ok: false, error: "invalid" },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log("[api/login] invalid password", {
        userId: user.id,
      });

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
      },
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(getJwtSecret());

    console.log("[api/login] token created", {
      tokenLength: token.length,
    });

    const response = NextResponse.json({
      ok: true,
      redirectTo: "/dashboard",
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });

    console.log("[api/login] response cookie set", {
      cookieName: SESSION_COOKIE_NAME,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
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