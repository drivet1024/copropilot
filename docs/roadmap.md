# Roadmap — CoproPilot

## Objectif général

Créer une plateforme SaaS simple, fluide et complète pour la gestion de copropriétés au Québec, avec un accent particulier sur le carnet d’entretien, les documents, les fournisseurs, le fonds de prévoyance et la conformité à la Loi 16.

---

## Phase 0 — Fondation du projet

Objectif : mettre en place une base technique propre pour développer avec Visual Studio Code, GitHub et Codex.

Tâches :
- Créer le repo GitHub
- Initialiser le projet Next.js
- Configurer TypeScript
- Configurer Tailwind CSS
- Installer shadcn/ui
- Configurer ESLint
- Configurer Prisma
- Configurer PostgreSQL
- Ajouter Docker Compose
- Ajouter `.env.example`
- Ajouter `README.md`
- Ajouter `AGENTS.md`
- Ajouter la documentation initiale dans `/docs`

Livrables :
- Projet fonctionnel en local
- Repo GitHub initialisé
- Documentation de base
- Environnement prêt pour Codex

---

## Phase 1 — Authentification et base SaaS

Objectif : permettre à plusieurs organisations d’utiliser la plateforme de façon isolée.

Tâches :
- Créer le modèle User
- Ajouter l’authentification
- Créer le modèle Tenant
- Créer le modèle Membership
- Créer les rôles de base
- Protéger les routes privées
- Créer un tableau de bord de base
- Créer un sélecteur d’organisation
- Ajouter les premiers tests de permissions

Livrables :
- Connexion utilisateur
- Dashboard privé
- Structure multi-tenant
- Accès sécurisé par organisation

---

## Phase 2 — Rôles et permissions

Objectif : gérer les droits d’accès personnalisés selon les rôles et permissions.

Tâches :
- Créer les rôles système
- Créer les permissions
- Associer des permissions aux rôles
- Permettre des permissions personnalisées par utilisateur
- Ajouter des vérifications côté serveur
- Ajouter un écran de gestion des accès
- Journaliser les changements de permissions

Livrables :
- Système de permissions fonctionnel
- Rôles personnalisables
- Base sécuritaire pour les modules futurs

---

## Phase 3 — Gestion des copropriétés

Objectif : créer la structure principale de gestion des copropriétés.

Tâches :
- Créer le CRUD des copropriétés
- Créer le CRUD des bâtiments
- Créer le CRUD des unités
- Associer les copropriétaires aux unités
- Gérer les locataires
- Gérer les membres du CA
- Assigner un gestionnaire à une copropriété
- Ajouter l’historique administratif

Livrables :
- Gestion complète de la structure d’une copropriété
- Vue par copropriété
- Vue par immeuble
- Vue par unité

---

## Phase 4 — Gestion documentaire

Objectif : centraliser les documents de chaque copropriété.

Tâches :
- Créer les catégories de documents
- Ajouter le téléversement de fichiers
- Stocker les fichiers localement ou dans un stockage compatible S3
- Gérer les permissions de documents
- Ajouter le versionnement
- Lier les documents aux copropriétés, unités, fournisseurs et composantes
- Ajouter la recherche de documents
- Ajouter le téléchargement sécurisé

Livrables :
- Bibliothèque documentaire
- Permissions par document
- Base prête pour l’assistant IA

---

## Phase 5 — Carnet d’entretien MVP

Objectif : créer le module central du produit.

Tâches :
- Créer le modèle MaintenanceBook
- Créer les catégories de composantes
- Créer les composantes de l’immeuble
- Créer les tâches d’entretien
- Ajouter les dates d’échéance
- Ajouter les priorités
- Ajouter les statuts
- Assigner un responsable
- Assigner un fournisseur
- Ajouter les commentaires
- Ajouter les documents liés
- Ajouter l’historique des interventions
- Ajouter une vue liste
- Ajouter une fiche détaillée par composante

Livrables :
- Carnet d’entretien utilisable
- Inventaire des composantes
- Tâches d’entretien
- Historique des interventions

---

## Phase 6 — Audit log et historique

Objectif : conserver une trace complète des actions importantes.

Tâches :
- Créer le modèle AuditLog
- Journaliser les créations
- Journaliser les modifications
- Journaliser les suppressions
- Journaliser les changements de statut
- Journaliser les imports Excel
- Afficher l’historique sur les fiches d’entretien
- Ajouter un fil d’activité par copropriété

Livrables :
- Historique complet
- Traçabilité des changements
- Base solide pour conformité et confiance utilisateur

---

## Phase 7 — Gestion des fournisseurs

Objectif : gérer les fournisseurs liés aux entretiens, contrats et documents.

Tâches :
- Créer le CRUD fournisseurs
- Ajouter les catégories de fournisseurs
- Ajouter les contacts fournisseurs
- Ajouter les contrats
- Ajouter les documents fournisseurs
- Lier les fournisseurs aux tâches d’entretien
- Lier les fournisseurs aux interventions
- Ajouter les dates d’échéance de contrats

Livrables :
- Répertoire fournisseurs
- Contrats fournisseurs
- Fournisseurs liés au carnet d’entretien

---

## Phase 8 — Import Excel du carnet d’entretien

Objectif : faciliter la migration des clients existants.

Tâches :
- Créer la page d’import Excel
- Lire le fichier avec ExcelJS
- Détecter les colonnes
- Permettre le mapping des colonnes
- Valider les lignes
- Afficher un aperçu avant import
- Importer les composantes
- Importer les tâches d’entretien
- Importer les fournisseurs
- Générer un rapport d’import
- Journaliser l’import

Livrables :
- Import Excel fonctionnel
- Migration plus rapide des clients
- Rapport d’erreurs clair

---

## Phase 9 — Rapports et exports PDF

Objectif : permettre aux utilisateurs d’exporter les informations importantes.

Tâches :
- Exporter le carnet d’entretien en PDF
- Exporter la liste des composantes
- Exporter l’historique des interventions
- Exporter la liste des fournisseurs
- Exporter les tâches à venir
- Créer un rapport de conformité de base
- Ajouter les options de filtre avant export

Livrables :
- Rapports PDF de base
- Exports utiles pour CA, gestionnaires et professionnels

---

## Phase 10 — Fonds de prévoyance

Objectif : planifier les dépenses majeures et les contributions nécessaires.

Tâches :
- Créer le modèle ReserveFund
- Créer les scénarios financiers
- Associer les composantes aux dépenses prévues
- Ajouter les coûts de remplacement
- Ajouter l’année prévue de remplacement
- Ajouter l’inflation
- Ajouter les contributions annuelles
- Calculer les projections
- Afficher des graphiques
- Exporter les projections en PDF

Livrables :
- Module de fonds de prévoyance
- Projection financière de base
- Scénarios comparables

---

## Phase 11 — Assistant IA documentaire

Objectif : permettre aux utilisateurs de poser des questions sur les documents de la copropriété.

Tâches :
- Extraire le texte des documents
- Découper les documents en sections
- Générer les embeddings
- Stocker les embeddings
- Ajouter la recherche vectorielle
- Créer l’interface de clavardage IA
- Répondre avec sources citées
- Respecter les permissions de documents
- Ajouter un avertissement juridique

Livrables :
- Assistant IA basé sur les documents
- Réponses avec sources
- Recherche intelligente dans les documents

---

## Phase 12 — Notifications et rappels

Objectif : automatiser le suivi des échéances.

Tâches :
- Créer les préférences de notification
- Ajouter les rappels d’entretien
- Ajouter les rappels de contrats fournisseurs
- Ajouter les rappels de documents expirés
- Envoyer des notifications courriel
- Ajouter des notifications dans l’application
- Créer des jobs planifiés avec Redis/BullMQ

Livrables :
- Rappels automatiques
- Meilleur suivi des échéances
- Réduction des oublis

---

## Phase 13 — Abonnements SaaS

Objectif : préparer la commercialisation de la plateforme.

Tâches :
- Créer les plans d’abonnement
- Ajouter les limites par forfait
- Ajouter la gestion des essais gratuits
- Ajouter la facturation
- Ajouter Stripe ou un système équivalent
- Créer un tableau de bord administrateur SaaS
- Gérer les suspensions d’abonnement

Livrables :
- Plateforme commercialisable
- Gestion des forfaits
- Base pour revenus SaaS

---

## Phase 14 — Portail copropriétaire

Objectif : offrir un espace simple aux copropriétaires.

Tâches :
- Créer une vue copropriétaire
- Afficher les documents accessibles
- Afficher les communications
- Afficher les informations de l’unité
- Permettre de soumettre une demande
- Permettre de consulter certaines règles
- Permettre d’utiliser l’assistant IA si autorisé

Livrables :
- Portail copropriétaire
- Accès simple aux informations importantes

---

## Phase 15 — Fonctionnalités futures

Fonctionnalités possibles :
- Paiements en ligne
- Comptabilité
- Assemblées
- Votes électroniques
- Signature électronique
- Application mobile
- PWA
- Marketplace de fournisseurs
- Comparaison de soumissions
- Intégrations comptables
- API publique
- Analyse IA avancée