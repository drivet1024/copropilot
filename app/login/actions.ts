"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();

  const password = String(formData.get("password") || "");

  console.log("[loginAction] START", {
    email,
    hasPassword: Boolean(password),
  });

  if (!email || !password) {
    console.log("[loginAction] missing email or password");
    redirect("/login?error=missing");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("[loginAction] user not found", { email });
    redirect("/login?error=invalid");
  }

  console.log("[loginAction] user found", {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });

  if (user.status !== "ACTIVE") {
    console.log("[loginAction] user not active", {
      userId: user.id,
      status: user.status,
    });

    redirect("/login?error=inactive");
  }

 if (user.status !== "ACTIVE") {
  console.log("[loginAction] user not active", {
    userId: user.id,
    status: user.status,
  });

  redirect("/login?error=inactive");
}

if (!user.passwordHash) {
  console.log("[loginAction] user has no passwordHash", {
    userId: user.id,
    email: user.email,
  });

  redirect("/login?error=invalid");
}

const isPasswordValid = await verifyPassword(password, user.passwordHash);

if (!isPasswordValid) {
  console.log("[loginAction] invalid password", {
    userId: user.id,
  });

  redirect("/login?error=invalid");
}
  

  console.log("[loginAction] password valid, creating session", {
    userId: user.id,
  });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
  });

  console.log("[loginAction] session created, redirecting");

  redirect("/dashboard");
}