import { redirect } from "next/navigation";

import { logAction } from "@/lib/audit/log-action";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type LoginSearchParams = Promise<{
  error?: string | string[];
}>;

function getSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function loginAction(formData: FormData) {
  "use server";

  const email = getFormValue(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");

  if (!email || !password) {
    redirect("/login?error=1");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      condoId: true,
      email: true,
      id: true,
      name: true,
      organizationId: true,
      passwordHash: true,
      role: true,
      status: true,
      unitId: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || !user.passwordHash) {
    redirect("/login?error=1");
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    redirect("/login?error=1");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      lastLoginAt: new Date(),
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

  const token = await createSessionToken(updatedUser);

  await setSessionCookie(token);
  await logAction({
    action: "LOGIN_SUCCESS",
    entity: "User",
    entityId: updatedUser.id,
    userId: updatedUser.id,
  });

  redirect("/dashboard");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: LoginSearchParams;
}) {
  const params = searchParams ? await searchParams : {};
  const hasError = getSearchParam(params.error) === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
            CoproPilot
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950">
            Connexion à CoproPilot
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-500">
            Accédez à votre espace de gestion de copropriété.
          </p>
        </div>

        {hasError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            Email ou mot de passe invalide.
          </div>
        ) : null}

        <form action={loginAction} className="mt-7 space-y-5">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@copropilot.local"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Mot de passe
            </span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-teal-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            Se connecter
          </button>
        </form>
      </section>
    </main>
  );
}
