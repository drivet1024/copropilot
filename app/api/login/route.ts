"use client";

import { useState } from "react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

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
      setError(data.error || "Erreur de connexion");
      return;
    }

    window.location.href = data.redirectTo || "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit}>
      {error ? <p>{error}</p> : null}

      <input name="email" type="email" required />
      <input name="password" type="password" required />

      <button type="submit">Se connecter</button>
    </form>
  );
}