import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db/prisma";

const defaultTemplateBody =
  "Bonjour {{ownerName}}, votre assurance pour l’unité {{unitNumber}} arrive à renouvellement le {{insuranceRenewalDate}}. Merci de nous transmettre votre preuve d’assurance à jour.";

const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type SmsTemplateListItem = {
  id: string;
  name: string;
  type: string;
  body: string;
  isActive: boolean;
  updatedAt: Date;
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getIsActive(formData: FormData) {
  return formData.get("isActive") === "true";
}

async function createSmsTemplate(formData: FormData) {
  "use server";

  const name = getFormValue(formData, "name");
  const type = getFormValue(formData, "type") || "INSURANCE_RENEWAL";
  const body = getFormValue(formData, "body");

  if (!name || !body) {
    throw new Error("Le nom et le corps du template sont obligatoires.");
  }

  await prisma.smsTemplate.create({
    data: {
      name,
      type,
      body,
      isActive: getIsActive(formData),
    },
  });

  revalidatePath("/sms-templates");
}

async function updateSmsTemplate(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");
  const name = getFormValue(formData, "name");
  const type = getFormValue(formData, "type") || "INSURANCE_RENEWAL";
  const body = getFormValue(formData, "body");

  if (!id || !name || !body) {
    throw new Error("Le template, le nom et le corps sont obligatoires.");
  }

  await prisma.smsTemplate.update({
    where: { id },
    data: {
      name,
      type,
      body,
      isActive: getIsActive(formData),
    },
  });

  revalidatePath("/sms-templates");
  revalidatePath("/units");
}

async function disableSmsTemplate(formData: FormData) {
  "use server";

  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant du template est obligatoire.");
  }

  await prisma.smsTemplate.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  revalidatePath("/sms-templates");
  revalidatePath("/units");
}

export default async function SmsTemplatesPage() {
  const templatesRaw = await prisma.smsTemplate.findMany({
    orderBy: {
      updatedAt: "desc",
    },
  });

  const templates = templatesRaw as SmsTemplateListItem[];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Templates SMS
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Préparez les messages utilisés pour les rappels d’assurance, sans
          envoyer de SMS automatiquement.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-950">
            Ajouter un template
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Variables supportées : {"{{ownerName}}"}, {"{{unitNumber}}"},{" "}
            {"{{buildingName}}"}, {"{{condoName}}"},{" "}
            {"{{insuranceRenewalDate}}"}.
          </p>
        </div>

        <form action={createSmsTemplate} className="mt-6 space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Nom du template
              </span>
              <input
                name="name"
                type="text"
                required
                placeholder="Renouvellement assurance"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Type
              </span>
              <input
                name="type"
                type="text"
                defaultValue="INSURANCE_RENEWAL"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
              />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700">
              Corps du message
            </span>
            <textarea
              name="body"
              required
              defaultValue={defaultTemplateBody}
              className="min-h-36 w-full rounded-xl border border-slate-300 px-4 py-3 text-base leading-7 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
            />
          </label>

          <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
            <input
              name="isActive"
              value="true"
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            Actif
          </label>

          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
          >
            Ajouter le template
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-950">
            Templates existants
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Modifiez les textes ou désactivez un template sans le supprimer.
          </p>
        </div>

        {templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucun template SMS pour le moment.
          </div>
        ) : (
          <div className="space-y-5">
            {templates.map((template: SmsTemplateListItem) => (
              <div
                key={template.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-950">
                      {template.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {template.type} · Modifié le{" "}
                      {dateFormatter.format(template.updatedAt)}
                    </p>
                  </div>
                  <span
                    className={
                      template.isActive
                        ? "w-fit rounded-full bg-teal-50 px-3 py-1 text-sm font-bold text-teal-700"
                        : "w-fit rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-600"
                    }
                  >
                    {template.isActive ? "Actif" : "Inactif"}
                  </span>
                </div>

                <form action={updateSmsTemplate} className="space-y-4">
                  <input type="hidden" name="id" value={template.id} />
                  <div className="grid gap-4 lg:grid-cols-2">
                    <input
                      name="name"
                      defaultValue={template.name}
                      required
                      className="rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    />
                    <input
                      name="type"
                      defaultValue={template.type}
                      required
                      className="rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                    />
                  </div>
                  <textarea
                    name="body"
                    defaultValue={template.body}
                    required
                    className="min-h-32 w-full rounded-xl border border-slate-300 px-4 py-3 text-base leading-7 text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <input
                        name="isActive"
                        value="true"
                        type="checkbox"
                        defaultChecked={template.isActive}
                        className="h-5 w-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      Actif
                    </label>
                    <button
                      type="submit"
                      className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-teal-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>

                {template.isActive ? (
                  <form action={disableSmsTemplate} className="mt-3">
                    <input type="hidden" name="id" value={template.id} />
                    <button
                      type="submit"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-white"
                    >
                      Désactiver
                    </button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
