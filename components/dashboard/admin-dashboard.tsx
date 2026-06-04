import {
  Bot,
  CalendarCheck,
  FileText,
  Handshake,
} from "lucide-react";

import { AiAssistantPreview } from "@/components/dashboard/ai-assistant-preview";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { MaintenanceCalendar } from "@/components/dashboard/maintenance-calendar";
import { MaintenanceList } from "@/components/dashboard/maintenance-list";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { ReserveFundCard } from "@/components/dashboard/reserve-fund-card";
import { VendorsCard } from "@/components/dashboard/vendors-card";

const kpis = [
  
  {
    label: "Documents",
    value: "1 284",
    icon: FileText,
    accent: "bg-cyan-50 text-cyan-700",
  },
  {
    label: "Entretiens ouverts",
    value: "23",
    icon: CalendarCheck,
    accent: "bg-amber-50 text-amber-700",
  },
  {
    label: "Fournisseurs",
    value: "86",
    icon: Handshake,
    accent: "bg-emerald-50 text-emerald-700",
  },
];

const maintenanceTasks = [
  {
    title: "Inspection ascenseurs",
    property: "Le 123 Wellington",
    date: "23 mai 2024",
    dueIn: "Cette semaine",
  },
  {
    title: "Entretien système CVAC",
    property: "Résidence Saint-Laurent",
    date: "27 mai 2024",
    dueIn: "À venir",
  },
  {
    title: "Inspection toiture",
    property: "Tours du Canal",
    date: "3 juin 2024",
    dueIn: "Planifié",
  },
];

const calendarEvents = [
  {
    day: "Lun",
    date: "20 mai",
    title: "Inspection garage",
    time: "09:00",
    tone: "border-sky-100 bg-sky-50 text-sky-700",
  },
  {
    day: "Mar",
    date: "21 mai",
    title: "Nettoyage vitres",
    time: "13:30",
    tone: "border-teal-100 bg-teal-50 text-teal-700",
  },
  {
    day: "Jeu",
    date: "23 mai",
    title: "Ascenseurs",
    time: "10:00",
    tone: "border-amber-100 bg-amber-50 text-amber-700",
  },
  {
    day: "Ven",
    date: "24 mai",
    title: "Réunion CA",
    time: "16:00",
    tone: "border-indigo-100 bg-indigo-50 text-indigo-700",
  },
];

const documents = [
  { name: "Budget annuel 2024.pdf", date: "Mis à jour hier" },
  { name: "Contrat entretien ascenseurs.pdf", date: "18 mai 2024" },
  { name: "Procès-verbal CA avril.pdf", date: "12 mai 2024" },
  { name: "Assurance immeuble.pdf", date: "2 mai 2024" },
];

const vendors = [
  { name: "Ascenseurs Montréal", category: "Maintenance", status: "Actif" },
  { name: "Gestion ABC", category: "Administration", status: "Actif" },
  { name: "Nettoyage Pro", category: "Entretien", status: "Actif" },
];

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            accent={kpi.accent}
          />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <MaintenanceList tasks={maintenanceTasks} />
        <RecentDocuments documents={documents} />
      </section>

      <MaintenanceCalendar events={calendarEvents} />

      <section className="grid gap-5 xl:grid-cols-3">
        <ReserveFundCard />
        <VendorsCard vendors={vendors} />
        <AiAssistantPreview
          question="Quels documents sont requis pour préparer l’AGA?"
          answer="Je peux regrouper le budget, les procès-verbaux, les rapports de maintenance et les documents de gouvernance liés à la copropriété sélectionnée."
          icon={Bot}
        />
      </section>
    </div>
  );
}
