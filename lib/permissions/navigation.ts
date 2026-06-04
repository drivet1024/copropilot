import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Building,
  CalendarCheck,
  FileText,
  Handshake,
  Home,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Settings,
  UserRound,
  Users,
} from "lucide-react";

export type UserRole =
  | "MASTER_USER"
  | "CONDO_MANAGER"
  | "BOARD_MEMBER"
  | "OWNER"
  | "VIEWER";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavigationContext = {
  currentCondo?: {
    buildingCount: number;
  } | null;
};

export const adminNavigation: NavigationItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Copropriétés", href: "/condos", icon: Home },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Carnet d’entretien", href: "/maintenance", icon: CalendarCheck },
  { label: "Fonds de prévoyance", href: "/reserve-fund", icon: Landmark },
  { label: "Fournisseurs", href: "/vendors", icon: Handshake },
  { label: "Assistant IA", href: "/ai-assistant", icon: Bot },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export const masterUserNavigation: NavigationItem[] = [
  ...adminNavigation.slice(0, -1),
  { label: "Utilisateurs", href: "/users", icon: Users },
  ...adminNavigation.slice(-1),
];

export const ownerNavigation: NavigationItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ma copropriété", href: "/my-condo", icon: Home },
  { label: "Mon unité", href: "/my-unit", icon: Building },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Carnet d’entretien", href: "/maintenance", icon: CalendarCheck },
  { label: "Mes demandes", href: "/requests", icon: MessageSquare },
  { label: "Communications", href: "/communications", icon: MessageSquare },
  { label: "Assistant IA", href: "/ai-assistant", icon: Bot },
  { label: "Profil", href: "/profile", icon: UserRound },
];

export function getNavigationForRole(
  role: UserRole,
  context: NavigationContext = {}
) {
  if (role === "OWNER") {
    return ownerNavigation;
  }

  const navigation =
    role === "MASTER_USER" ? masterUserNavigation : adminNavigation;
  const shouldUseSingleCondoLabel =
    role === "CONDO_MANAGER" ||
    (role === "BOARD_MEMBER" && Boolean(context.currentCondo));

  return navigation.map((item) =>
    item.href === "/condos" && shouldUseSingleCondoLabel
      ? { ...item, label: "Copropriété" }
      : item
  );
}
