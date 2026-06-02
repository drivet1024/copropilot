import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "copropilot_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("[auth/session] JWT_SECRET is missing");
    throw new Error("JWT_SECRET is missing");
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser) {
  console.log("[createSession] START", {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    nodeEnv: process.env.NODE_ENV,
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    jwtSecretLength: process.env.JWT_SECRET?.length ?? 0,
  });

  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());

  console.log("[createSession] token created", {
    tokenLength: token.length,
  });

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  console.log("[createSession] cookie set", {
    cookieName: SESSION_COOKIE_NAME,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: SESSION_MAX_AGE_SECONDS,
    readableImmediately: Boolean(cookieStore.get(SESSION_COOKIE_NAME)?.value),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  console.log("[getSessionUser] SESSION DEBUG", {
    hasToken: Boolean(token),
    cookieName: SESSION_COOKIE_NAME,
  });

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as { user?: SessionUser };

    if (!payload.user) {
      console.log("[getSessionUser] no user in token payload");
      return null;
    }

    return payload.user;
  } catch (error) {
    console.error("[getSessionUser] jwt verify failed", error);
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  console.log("[requireRole] checking role", {
    userRole: user.role,
    allowedRoles: roles,
    status: user.status,
  });

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.delete(SESSION_COOKIE_NAME);

  console.log("[destroySession] cookie deleted", {
    cookieName: SESSION_COOKIE_NAME,
  });
}