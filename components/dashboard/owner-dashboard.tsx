import {
  Bot,
  Building,
  CalendarCheck,
  FileText,
  Home,
  Landmark,
  type LucideIcon,
  MessageSquare,
  Plus,
} from "lucide-react";

import { AiAssistantPreview } from "@/components/dashboard/ai-assistant-preview";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type OwnerDashboardProps = {
  user: {
    name: string | null;
  };
};

const condoDetails = [
  { label: "Nom", value: "Le 123 Wellington" },
  { label: "Adresse", value: "123 rue Wellington, Montréal" },
  { label: "Nombre d’unités", value: "48" },
  { label: "Gestionnaire", value: "Gestion ABC" },
  { label: "Président du CA", value: "Sophie Martin" },
];

const unitDetails = [
  { label: "Unité", value: "302" },
  { label: "Bâtiment", value: "Bâtiment A" },
  { label: "Statut", value: "Copropriétaire occupant" },
  { label: "Quote-part", value: "2,14 %" },
  { label: "Stationnement", value: "P-14" },
  { label: "Casier", value: "C-302" },
];

const documents = [
  "Déclaration de copropriété.pdf",
  "Règlements de l’immeuble.pdf",
  "Budget annuel 2024.pdf",
  "Procès-verbal AGA 2024.pdf",
  "Assurance de l’immeuble.pdf",
  "Étude du fonds de prévoyance.pdf",
];

const communications = [
  "Avis de travaux dans le garage",
  "Convocation à l’assemblée annuelle",
  "Mise à jour du règlement de l’immeuble",
  "Avis du gestionnaire",
];

const requests = [
  { title: "Problème de bruit", status: "En cours" },
  { title: "Demande d’accès au garage", status: "Ouverte" },
];

const maintenance = [
  { title: "Inspection ascenseurs", date: "23 mai 2024" },
  { title: "Entretien système CVAC", date: "27 mai 2024" },
  { title: "Inspection toiture", date: "3 juin 2024" },
];

const reserveFund = [
  { label: "Solde actuel", value: "1 245 680 $" },
  { label: "Dernière étude", value: "2024" },
  { label: "Prochaine mise à jour prévue", value: "2027" },
  { label: "Dépense majeure à venir", value: "Toiture — 2034" },
];

function DetailList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:items-center"
        >
          <dt className="text-sm font-semibold text-slate-500">
            {item.label}
          </dt>
          <dd className="text-sm font-bold text-slate-950">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SimpleList({
  items,
  icon: Icon,
}: {
  items: string[];
  icon: LucideIcon;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <Icon className="size-4" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-slate-700">{item}</p>
        </div>
      ))}
    </div>
  );
}

export function OwnerDashboard({ user }: OwnerDashboardProps) {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm lg:p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-teal-600">
          Portail copropriétaire
        </p>
        <h2 className="mt-3 text-4xl font-bold text-slate-950">
          Bonjour {user.name ?? "Daniel"} 👋
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
          Voici les informations importantes de votre copropriété.
        </p>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DashboardCard
          title="Ma copropriété"
          className="h-full"
          action={
            <div className="flex size-9 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Home className="size-5" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={condoDetails} />
        </DashboardCard>

        <DashboardCard
          title="Mon unité"
          className="h-full"
          action={
            <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <Building className="size-5" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={unitDetails} />
        </DashboardCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <DashboardCard
          title="Documents importants"
          className="h-full"
          action={
            <div className="flex size-9 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <FileText className="size-5" aria-hidden="true" />
            </div>
          }
        >
          <SimpleList items={documents} icon={FileText} />
        </DashboardCard>

        <DashboardCard
          title="Communications récentes"
          className="h-full"
          action={
            <div className="flex size-9 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
              <MessageSquare className="size-5" aria-hidden="true" />
            </div>
          }
        >
          <SimpleList items={communications} icon={MessageSquare} />
        </DashboardCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardCard
          title="Mes demandes"
          className="h-full"
          action={
            <Button className="h-9 rounded-xl bg-sky-600 px-3 text-white hover:bg-sky-700">
              <Plus className="size-4" aria-hidden="true" />
              Créer une demande
            </Button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Demandes ouvertes
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">2</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-500">
                Demandes fermées
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-950">5</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {requests.map((request) => (
              <div
                key={request.title}
                className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
              >
                <p className="text-sm font-semibold text-slate-700">
                  {request.title}
                </p>
                <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50">
                  {request.status}
                </Badge>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Carnet d’entretien"
          className="h-full"
          action={
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
              Lecture seule
            </Badge>
          }
        >
          <div className="space-y-4">
            {maintenance.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <CalendarCheck className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item.date}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Fonds de prévoyance"
          className="h-full"
          action={
            <div className="flex size-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Landmark className="size-5" aria-hidden="true" />
            </div>
          }
        >
          <DetailList items={reserveFund} />
        </DashboardCard>
      </section>

      <AiAssistantPreview
        question="Puis-je installer une borne électrique dans mon stationnement?"
        answer="Selon les documents disponibles, l’installation d’une borne électrique doit être approuvée par le conseil d’administration lorsqu’elle touche les parties communes ou l’infrastructure électrique."
        disclaimer="Les réponses sont basées sur les documents accessibles et ne constituent pas un avis juridique."
        icon={Bot}
      />
    </div>
  );
}
