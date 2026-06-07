import type { CondoBoardRole } from "@prisma/client";

export const condoBoardRoleLabels: Record<CondoBoardRole, string> = {
  DIRECTOR: "Administrateur sans titre spécifique",
  PRESIDENT: "Président",
  SECRETARY: "Secrétaire",
  TREASURER: "Trésorier",
  VICE_PRESIDENT: "Vice-président",
};

export const condoBoardRoleOrder: CondoBoardRole[] = [
  "PRESIDENT",
  "VICE_PRESIDENT",
  "TREASURER",
  "SECRETARY",
  "DIRECTOR",
];

export const condoBoardRoleDescriptions: Record<CondoBoardRole, string> = {
  DIRECTOR:
    "Participe aux décisions du conseil, vote sur les résolutions, surveille la bonne gestion de l’immeuble et peut être responsable de dossiers précis : entretien, sécurité, assurance, plaintes, contrats, projets spéciaux.",
  PRESIDENT:
    "Dirige les réunions du conseil, s’assure que les décisions sont suivies, représente souvent le syndicat auprès des copropriétaires, fournisseurs ou professionnels. Il ne devrait pas décider seul, sauf mandat clair du conseil ou urgence.",
  SECRETARY:
    "Prépare ou conserve les procès-verbaux, avis de convocation, résolutions, registres, correspondance officielle et documents du syndicat. Le syndicat doit notamment conserver les procès-verbaux du conseil, ceux des assemblées et les états financiers dans son registre.",
  TREASURER:
    "Suit les finances : budget, dépenses, comptes bancaires, fonds de prévoyance, fonds d’autoassurance, charges communes, états financiers. Il présente généralement l’information financière au conseil.",
  VICE_PRESIDENT:
    "Remplace le président lorsqu’il est absent ou incapable d’agir. Peut aussi prendre en charge certains dossiers : travaux, communications, fournisseurs, etc.",
};
