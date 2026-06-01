import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-red-600">
          Accès
        </p>
        <h1 className="mt-3 text-4xl font-bold text-slate-950">
          Accès non autorisé
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Vous n’avez pas les droits requis pour accéder à cette section.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-600 px-5 text-base font-bold text-white shadow-sm transition hover:bg-teal-700"
        >
          Retour au tableau de bord
        </Link>
      </section>
    </div>
  );
}
