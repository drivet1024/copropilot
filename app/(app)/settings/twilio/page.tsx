import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getOptionalString(formData: FormData, key: string) {
  return getFormValue(formData, key) || null;
}

async function saveTwilioConfig(formData: FormData) {
  "use server";

  const data = {
    accountSid: getOptionalString(formData, "accountSid"),
    authToken: getOptionalString(formData, "authToken"),
    messagingServiceSid: getOptionalString(formData, "messagingServiceSid"),
    fromPhoneNumber: getOptionalString(formData, "fromPhoneNumber"),
    isEnabled: formData.get("isEnabled") === "true",
  };

  const existingConfig = await prisma.twilioConfig.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existingConfig) {
    await prisma.twilioConfig.update({
      where: {
        id: existingConfig.id,
      },
      data,
    });
  } else {
    await prisma.twilioConfig.create({
      data,
    });
  }

  revalidatePath("/settings/twilio");
}

export default async function TwilioSettingsPage() {
  await requireRole(["MASTER_USER"]);

  const config = await prisma.twilioConfig.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Configuration Twilio
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Préparez la configuration d’envoi SMS. Aucun SMS réel n’est envoyé
          dans cette étape.
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-base leading-7 text-amber-900 shadow-sm">
        En production, les secrets Twilio devraient être stockés dans des
        variables d’environnement ou chiffrés. Les champs ci-dessous sont
        stockés en clair seulement pour le développement local.
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Paramètres d’envoi
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Activez Twilio seulement lorsque les identifiants sont prêts.
          </p>
        </div>

        <form action={saveTwilioConfig} className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Account SID
              </span>
              <input
                name="accountSid"
                type="text"
                defaultValue={config?.accountSid ?? ""}
                placeholder="AC..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Auth Token
              </span>
              <input
                name="authToken"
                type="password"
                defaultValue={config?.authToken ?? ""}
                placeholder="Token Twilio"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Messaging Service SID
              </span>
              <input
                name="messagingServiceSid"
                type="text"
                defaultValue={config?.messagingServiceSid ?? ""}
                placeholder="MG..."
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Numéro Twilio d’envoi
              </span>
              <input
                name="fromPhoneNumber"
                type="tel"
                defaultValue={config?.fromPhoneNumber ?? ""}
                placeholder="+15145550101"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              name="isEnabled"
              value="true"
              type="checkbox"
              defaultChecked={config?.isEnabled ?? false}
              className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Activé
          </label>

          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            Enregistrer la configuration
          </button>
        </form>
      </section>
    </div>
  );
}
