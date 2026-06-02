import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

const SESSION_COOKIE_NAME = "copropilot_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type UserRole =
  | "MASTER_USER"
  | "CONDO_MANAGER"
  | "BOARD_MEMBER"
  | "OWNER"
  | "VIEWER";

export type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  organizationId: string | null;
  condoId: string | null;
  unitId: string | null;
};

type SessionTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string | null;
  condoId?: string | null;
  unitId?: string | null;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required.");
  }

  return new TextEncoder().encode(secret);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  };
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
    condoId: user.condoId,
    unitId: user.unitId,
  } satisfies SessionTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getAuthSecret());
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, getCookieOptions());
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const userId = payload.userId;

    if (typeof userId !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        condoId: true,
        email: true,
        id: true,
        name: true,
        organizationId: true,
        role: true,
        status: true,
        unitId: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Invalid session token:", error);
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}