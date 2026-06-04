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
  organizationId: string | null;
  condoId: string | null;
  unitId: string | null;
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

  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify(token, getJwtSecret());
    const payload = verified.payload as { user?: SessionUser };

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
    redirect("/login");
  }

  if (user.status !== "ACTIVE") {
    redirect("/login");
  }

  return user;
}

export async function requireRole(roles: UserRole[]) {
  const user = await requireUser();

  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}
