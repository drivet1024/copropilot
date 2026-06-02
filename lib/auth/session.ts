import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "copropilot_session";

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

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  console.log("[getSessionUser] SESSION DEBUG", {
    hasToken: Boolean(token),
    cookieName: SESSION_COOKIE_NAME,
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    jwtSecretLength: process.env.JWT_SECRET?.length ?? 0,
  });

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as { user?: SessionUser };

    console.log("[getSessionUser] jwt verified", {
      hasUser: Boolean(payload.user),
      userId: payload.user?.id,
      email: payload.user?.email,
      role: payload.user?.role,
      status: payload.user?.status,
    });

    if (!payload.user) {
      return null;
    }

    return payload.user;
  } catch (error) {
    console.error("[getSessionUser] jwt verify failed", {
      error,
      hasJwtSecret: Boolean(process.env.JWT_SECRET),
      jwtSecretLength: process.env.JWT_SECRET?.length ?? 0,
    });

    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    console.log("[requireUser] no user, redirecting to login");
    redirect("/login");
  }

  if (user.status !== "ACTIVE") {
    console.log("[requireUser] user not active", {
      userId: user.id,
      status: user.status,
    });

    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  console.log("[requireRole] checking role", {
    userId: user.id,
    email: user.email,
    userRole: user.role,
    allowedRoles: roles,
    status: user.status,
  });

  if (!roles.includes(user.role)) {
    console.log("[requireRole] role not allowed, redirecting dashboard", {
      userRole: user.role,
      allowedRoles: roles,
    });

    redirect("/dashboard");
  }

  return user;
}