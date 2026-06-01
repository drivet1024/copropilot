import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logAction } from "@/lib/audit/log-action";
import { hashPassword } from "@/lib/auth/password";
import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type UserRole =
  | "MASTER_USER"
  | "CONDO_MANAGER"
  | "BOARD_MEMBER"
  | "OWNER"
  | "VIEWER";

type UserStatus = "ACTIVE" | "INVITED" | "DISABLED";

const roleOptions: UserRole[] = [
  "MASTER_USER",
  "CONDO_MANAGER",
  "BOARD_MEMBER",
  "OWNER",
  "VIEWER",
];

const statusOptions: UserStatus[] = ["ACTIVE", "INVITED", "DISABLED"];

const roleLabels: Record<UserRole, string> = {
  BOARD_MEMBER: "Conseil",
  CONDO_MANAGER: "Gestionnaire",
  MASTER_USER: "Master",
  OWNER: "Copropriétaire",
  VIEWER: "Lecteur",
};

const statusLabels: Record<UserStatus, string> = {
  ACTIVE: "Actif",
  DISABLED: "Désactivé",
  INVITED: "Invité",
};

type UsersSearchParams = Promise<{
  edit?: string | string[];
  new?: string | string[];
}>;

type UserFormOrganization = {
  id: string;
  name: string;
};

type UserFormCondo = {
  id: string;
  name: string;
};

type UserFormUnit = {
  id: string;
  number: string;
  building: {
    name: string;
    condo: {
      name: string;
    };
  };
};

type UserFormUser = {
  id?: string;
  name?: string | null;
  email?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string | null;
  condoId?: string | null;
  unitId?: string | null;
};

type UserUpdateData = {
  condoId: string | null;
  email: string;
  name: string | null;
  organizationId: string | null;
  passwordHash?: string;
  role: UserRole;
  status: UserStatus;
  unitId: string | null;
};

type UserListItem = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  condoId: string | null;
  organizationId: string | null;
  unitId: string | null;
  condo: { name: string } | null;
  organization: { name: string } | null;
  unit: {
    number: string;
    building: {
      name: string;
    };
  } | null;
};

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

function getOptionalString(formData: FormData, key: string) {
  return getFormValue(formData, key) || null;
}

function getRole(formData: FormData) {
  const role = getFormValue(formData, "role") as UserRole;

  if (!roleOptions.includes(role)) {
    throw new Error("Le rôle est obligatoire.");
  }

  return role;
}

function getStatus(formData: FormData) {
  const status = getFormValue(formData, "status") as UserStatus;

  if (!statusOptions.includes(status)) {
    throw new Error("Le statut est obligatoire.");
  }

  return status;
}

function UserFormFields({
  condos,
  organizations,
  units,
  user,
}: {
  condos: UserFormCondo[];
  organizations: UserFormOrganization[];
  units: UserFormUnit[];
  user?: UserFormUser;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Nom</span>
        <input
          name="name"
          type="text"
          defaultValue={user?.name ?? ""}
          placeholder="Marie Tremblay"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={user?.email ?? ""}
          placeholder="utilisateur@copropilot.local"
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Mot de passe temporaire
        </span>
        <input
          name="password"
          type="password"
          required={!user?.id}
          autoComplete="new-password"
          placeholder={user?.id ? "Laisser vide pour conserver" : "Temporaire"}
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Rôle</span>
        <select
          name="role"
          required
          defaultValue={user?.role ?? "VIEWER"}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          {roleOptions.map((role: UserRole) => (
            <option key={role} value={role}>
              {roleLabels[role]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">Statut</span>
        <select
          name="status"
          required
          defaultValue={user?.status ?? "ACTIVE"}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          {statusOptions.map((status: UserStatus) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Organisation
        </span>
        <select
          name="organizationId"
          defaultValue={user?.organizationId ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          <option value="">Aucune organisation</option>
          {organizations.map((organization: UserFormOrganization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm font-semibold text-slate-700">
          Copropriété
        </span>
        <select
          name="condoId"
          defaultValue={user?.condoId ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          <option value="">Aucune copropriété</option>
          {condos.map((condo: UserFormCondo) => (
            <option key={condo.id} value={condo.id}>
              {condo.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm font-semibold text-slate-700">Unité</span>
        <select
          name="unitId"
          defaultValue={user?.unitId ?? ""}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
        >
          <option value="">Aucune unité</option>
          {units.map((unit: UserFormUnit) => (
            <option key={unit.id} value={unit.id}>
              {unit.number} · {unit.building.name} · {unit.building.condo.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

async function createUser(formData: FormData) {
  "use server";

  const actor = await requireRole(["MASTER_USER"]);
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");
  const role = getRole(formData);

  if (!email || !password) {
    throw new Error("L’email et le mot de passe temporaire sont obligatoires.");
  }

  const createdUser = await prisma.user.create({
    data: {
      condoId: getOptionalString(formData, "condoId"),
      email,
      name: getOptionalString(formData, "name"),
      organizationId: getOptionalString(formData, "organizationId"),
      passwordHash: await hashPassword(password),
      role,
      status: getStatus(formData),
      unitId: getOptionalString(formData, "unitId"),
    },
    select: {
      id: true,
    },
  });

  await logAction({
    action: "USER_CREATED",
    entity: "User",
    entityId: createdUser.id,
    userId: actor.id,
  });

  revalidatePath("/users");
  redirect("/users");
}

async function updateUser(formData: FormData) {
  "use server";

  const actor = await requireRole(["MASTER_USER"]);
  const id = getFormValue(formData, "id");
  const email = getFormValue(formData, "email").toLowerCase();
  const password = getFormValue(formData, "password");

  if (!id || !email) {
    throw new Error("L’utilisateur et l’email sont obligatoires.");
  }

  const data: UserUpdateData = {
    condoId: getOptionalString(formData, "condoId"),
    email,
    name: getOptionalString(formData, "name"),
    organizationId: getOptionalString(formData, "organizationId"),
    role: getRole(formData),
    status: getStatus(formData),
    unitId: getOptionalString(formData, "unitId"),
  };

  if (password) {
    data.passwordHash = await hashPassword(password);
  }

  await prisma.user.update({
    where: {
      id,
    },
    data,
  });

  await logAction({
    action: "USER_UPDATED",
    entity: "User",
    entityId: id,
    userId: actor.id,
  });

  revalidatePath("/users");
  redirect("/users");
}

async function disableUser(formData: FormData) {
  "use server";

  const actor = await requireRole(["MASTER_USER"]);
  const id = getFormValue(formData, "id");

  if (!id) {
    throw new Error("L’identifiant de l’utilisateur est obligatoire.");
  }

  if (id === actor.id) {
    throw new Error("Vous ne pouvez pas désactiver votre propre compte.");
  }

  await prisma.user.update({
    where: {
      id,
    },
    data: {
      status: "DISABLED",
    },
  });

  await logAction({
    action: "USER_DISABLED",
    entity: "User",
    entityId: id,
    userId: actor.id,
  });

  revalidatePath("/users");
  redirect("/users");
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: UsersSearchParams;
}) {
  const actor = await requireRole(["MASTER_USER"]);
  const params = searchParams ? await searchParams : {};
  const editUserId = getSearchParam(params.edit);
  const isNewUserModalOpen = getSearchParam(params.new) === "1" && !editUserId;

  const [usersRaw, organizationsRaw, condosRaw, unitsRaw, selectedUserRaw] =
    await Promise.all([
      prisma.user.findMany({
        select: {
          condo: {
            select: {
              name: true,
            },
          },
          condoId: true,
          email: true,
          id: true,
          lastLoginAt: true,
          name: true,
          organization: {
            select: {
              name: true,
            },
          },
          organizationId: true,
          role: true,
          status: true,
          unit: {
            select: {
              number: true,
              building: {
                select: {
                  name: true,
                },
              },
            },
          },
          unitId: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.organization.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      prisma.condo.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      prisma.unit.findMany({
        include: {
          building: {
            include: {
              condo: true,
            },
          },
        },
        orderBy: {
          number: "asc",
        },
      }),
      editUserId
        ? prisma.user.findUnique({
            where: {
              id: editUserId,
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
          })
        : Promise.resolve(null),
    ]);

  const users = usersRaw as UserListItem[];
  const organizations = organizationsRaw as UserFormOrganization[];
  const condos = condosRaw as UserFormCondo[];
  const units = unitsRaw as UserFormUnit[];
  const selectedUser = selectedUserRaw as UserFormUser | null;

  const activeUsers = users.filter((user: UserListItem) => user.status === "ACTIVE").length;
  const managers = users.filter(
    (user: UserListItem) => user.role === "CONDO_MANAGER"
  ).length;
  const disabledUsers = users.filter(
    (user: UserListItem) => user.status === "DISABLED"
  ).length;

  const kpis = [
    { label: "Utilisateurs", value: users.length },
    { label: "Actifs", value: activeUsers },
    { label: "Gestionnaires", value: managers },
    { label: "Désactivés", value: disabledUsers },
  ];

  return (
    <div className="w-full space-y-8">
      <section>
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          CoproPilot
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Utilisateurs
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Gérez les accès, rôles et permissions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi: { label: string; value: number }) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-base font-semibold text-slate-500">
              {kpi.label}
            </p>
            <p className="mt-4 text-4xl font-bold text-slate-950">
              {kpi.value}
            </p>
          </div>
        ))}
      </section>

      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Liste des utilisateurs
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Consultez et modifiez les accès sans exposer les mots de passe.
            </p>
          </div>

          <Link
            href="/users?new=1"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Ajouter un utilisateur
          </Link>
        </div>

        {users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-base font-medium text-slate-500">
            Aucun utilisateur pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Utilisateur",
                    "Rôle",
                    "Statut",
                    "Organisation",
                    "Copropriété",
                    "Unité",
                    "Dernière connexion",
                    "Actions",
                  ].map((header: string) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white text-[15px]">
                {users.map((user: UserListItem) => (
                  <tr
                    key={user.id}
                    className="border-t border-slate-200 align-middle hover:bg-slate-50"
                  >
                    <td className="min-w-72 px-4 py-4">
                      <p className="text-base font-semibold text-slate-950">
                        {user.name ?? "Sans nom"}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {user.email}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {roleLabels[user.role]}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                        {statusLabels[user.status]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {user.organization?.name ?? "Aucune"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {user.condo?.name ?? "Aucune"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                      {user.unit
                        ? `${user.unit.number} · ${user.unit.building.name}`
                        : "Aucune"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                      {user.lastLoginAt
                        ? user.lastLoginAt.toLocaleString("fr-CA")
                        : "Jamais"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/users?edit=${encodeURIComponent(user.id)}`}
                          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Modifier
                        </Link>
                        <form action={disableUser} className="m-0">
                          <input type="hidden" name="id" value={user.id} />
                          <button
                            type="submit"
                            disabled={user.id === actor.id}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-red-200 px-4 text-sm font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            Désactiver
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isNewUserModalOpen ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="new-user-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Nouvel accès
                    </p>
                    <h2
                      id="new-user-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Ajouter un utilisateur
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      Créez un accès avec un rôle, un statut et une portée.
                    </p>
                  </div>
                  <Link
                    href="/users"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                <form action={createUser}>
                  <div className="p-6">
                    <UserFormFields
                      condos={condos}
                      organizations={organizations}
                      units={units}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/users"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      Ajouter l’utilisateur
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : null}

      {selectedUser ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="edit-user-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <div className="max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
                      Modification
                    </p>
                    <h2
                      id="edit-user-title"
                      className="mt-2 text-2xl font-bold text-slate-950"
                    >
                      Modifier l’utilisateur
                    </h2>
                    <p className="mt-2 text-base text-slate-500">
                      {selectedUser.email}
                    </p>
                  </div>
                  <Link
                    href="/users"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    Annuler
                  </Link>
                </div>

                <form action={updateUser}>
                  <input type="hidden" name="id" value={selectedUser.id} />

                  <div className="p-6">
                    <UserFormFields
                      condos={condos}
                      organizations={organizations}
                      units={units}
                      user={selectedUser}
                    />
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
                    <Link
                      href="/users"
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Annuler
                    </Link>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
                    >
                      Enregistrer les modifications
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </>
      ) : editUserId ? (
        <>
          <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <section
              aria-labelledby="missing-user-title"
              aria-modal="true"
              role="dialog"
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-base shadow-2xl lg:p-8"
            >
              <h2
                id="missing-user-title"
                className="text-2xl font-bold text-slate-950"
              >
                Utilisateur introuvable
              </h2>
              <p className="mt-3 text-slate-500">
                L’utilisateur sélectionné n’existe pas ou n’est plus
                disponible.
              </p>
              <Link
                href="/users"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
              >
                Revenir à la liste
              </Link>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
