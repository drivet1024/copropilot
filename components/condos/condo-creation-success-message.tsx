"use client";

import { useEffect, useState } from "react";

import { CONDO_CREATED_MESSAGE_STORAGE_KEY } from "@/components/condos/create-condo-dialog";

export function CondoCreationSuccessMessage() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedMessage = window.sessionStorage.getItem(
      CONDO_CREATED_MESSAGE_STORAGE_KEY
    );

    if (!storedMessage) {
      return;
    }

    window.sessionStorage.removeItem(CONDO_CREATED_MESSAGE_STORAGE_KEY);

    const timeoutId = window.setTimeout(() => {
      setMessage(storedMessage);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  if (!message) {
    return null;
  }

  return (
    <p className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
      {message}
    </p>
  );
}
