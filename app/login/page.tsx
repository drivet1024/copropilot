"use client";

import { useState } from "react";

function getErrorMessage(error: string | null) {
  if (!error) return null;

  switch (error) {
    case "missing":
      return "Veuillez entrer votre courriel et votre mot de passe.";
    case "invalid":
      return "Courriel ou mot de passe invalide.";
    case "inactive":
      return "Ce compte n’est pas actif.";
    case "server_error":
      return "Erreur serveur. Veuillez réessayer.";
    default:
      return "Erreur de connexion.";
  }
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);

      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || "unknown");
        setIsLoading(false);
        return;
      }

      window.location.href = data.redirectTo || "/dashboard";
    } catch (error) {
      console.error("[login/page] submit error", error);
      setError("server_error");
      setIsLoading(false);
    }
  }

  const errorMessage = getErrorMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Connexion</h1>

        <p className="mt-2 text-sm text-slate-500">
          Connectez-vous à CoproPilot.
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Courriel
            </label>

            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Mot de passe
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}