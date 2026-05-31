# Modules du logiciel — CoproPilot

## 1. Gestion SaaS / multi-tenant

Objectif : permettre à la plateforme de gérer plusieurs clients, plusieurs organisations et plusieurs copropriétés.

Fonctionnalités :
- Création d’un tenant / organisation
- Gestion de plusieurs copropriétés par organisation
- Gestion des abonnements
- Activation ou désactivation d’un client
- Séparation complète des données entre les clients
- Tableau de bord administrateur SaaS

Entités principales :
- Tenant
- Subscription
- Plan
- User
- Membership

---

## 2. Gestion des utilisateurs, rôles et permissions

Objectif : contrôler précisément les accès selon le rôle, l’immeuble, la copropriété et les modules.

Rôles prévus :
- Super administrateur
- Gestionnaire
- Administrateur du syndicat
- Membre du CA
- Copropriétaire
- Locataire
- Fournisseur
- Professionnel externe
- Lecteur seul

Fonctionnalités :
- Invitation d’utilisateurs
- Attribution de rôles
- Permissions personnalisées
- Accès par copropriété
- Accès par immeuble
- Accès par unité
- Accès par document
- Journalisation des changements de permissions

Exemples de permissions :
- users.read
- users.manage
- documents.read
- documents.upload
- maintenance.read
- maintenance.create
- maintenance.update
- maintenance.close
- reserve_fund.read
- reserve_fund.update
- vendors.manage
- ai_assistant.use

---

## 3. Gestion des copropriétés

Objectif : gérer la structure administrative et légale d’une copropriété.

Fonctionnalités :
- Création d’une copropriété
- Informations générales
- Adresse
- Numéro de syndicat
- Année de construction
- Nombre d’unités
- Gestion des bâtiments
- Gestion des unités
- Gestion du conseil d’administration
- Gestion du gestionnaire attitré
- Historique administratif

Entités principales :
- CondoCorporation
- Building
- Unit
- BoardMember
- ManagerAssignment

---

## 4. Gestion des copropriétaires et occupants

Objectif : gérer les copropriétaires, locataires et occupants liés aux unités.

Fonctionnalités :
- Association d’un copropriétaire à une unité
- Gestion des copropriétaires multiples
- Gestion des locataires
- Dates de début et de fin d’occupation
- Coordonnées
- Historique de propriété
- Accès au portail copropriétaire

Entités principales :
- UnitOwnership
- Occupant
- User
- Unit

---

## 5. Gestion documentaire

Objectif : centraliser les documents importants de la copropriété.

Types de documents :
- Déclaration de copropriété
- Règlements de l’immeuble
- Procès-verbaux
- Contrats
- Factures
- Soumissions
- Rapports d’inspection
- Plans
- Photos
- Assurances
- Documents financiers
- Étude du fonds de prévoyance
- Carnet d’entretien
- Fichiers Excel importés

Fonctionnalités :
- Téléversement de fichiers
- Catégories de documents
- Permissions par document
- Versionnement
- Recherche
- Téléchargement sécurisé
- Liaison d’un document à une composante, un fournisseur, une unité ou une intervention
- Préparation future pour l’assistant IA

Entités principales :
- Document
- DocumentCategory
- DocumentVersion
- DocumentAccessRule
- DocumentEmbedding

---

## 6. Carnet d’entretien numérique

Objectif : permettre à une copropriété de gérer son carnet d’entretien conformément aux bonnes pratiques et aux exigences de la Loi 16.

Fonctionnalités :
- Création du carnet d’entretien
- Inventaire des composantes de l’immeuble
- Catégories de composantes
- Fiches techniques
- État des composantes
- Priorité
- Fréquence d’entretien
- Date de dernier entretien
- Date du prochain entretien
- Responsable assigné
- Fournisseur assigné
- Photos et documents liés
- Commentaires
- Historique complet
- Vue liste
- Vue calendrier
- Export PDF

Exemples de composantes :
- Toiture
- Fenêtres
- Balcons
- Ascenseur
- Garage
- Stationnement
- Drainage
- Plomberie
- Électricité
- Chauffage
- Ventilation
- Système incendie
- Revêtement extérieur
- Portes
- Aires communes

Entités principales :
- MaintenanceBook
- AssetCategory
- AssetComponent
- MaintenanceTask
- MaintenanceSchedule
- MaintenanceIntervention
- MaintenanceHistory
- MaintenanceAttachment

---

## 7. Historique et audit log

Objectif : conserver une trace complète des actions importantes dans le logiciel.

Fonctionnalités :
- Historique des modifications
- Historique des entretiens
- Historique des interventions
- Historique des documents
- Historique des permissions
- Identification de l’utilisateur ayant effectué l’action
- Date et heure de l’action
- Ancienne valeur
- Nouvelle valeur
- Commentaire facultatif

Exemples d’actions à journaliser :
- Création d’une composante
- Modification d’une date d’échéance
- Changement de priorité
- Ajout d’un document
- Suppression d’un fichier
- Fermeture d’une tâche
- Modification d’un rôle utilisateur
- Import Excel

Entités principales :
- AuditLog
- ActivityFeed

---

## 8. Gestion des fournisseurs

Objectif : centraliser les fournisseurs et les lier aux contrats, documents et interventions.

Catégories de fournisseurs :
- Paysagement
- Déneigement
- Toiture
- Plomberie
- Électricité
- Ascenseur
- Sécurité incendie
- Nettoyage
- Inspection bâtiment
- Assurance
- Comptabilité
- Gestion parasitaire
- Génie
- Architecture

Fonctionnalités :
- Création de fournisseurs
- Contacts multiples
- Catégories
- Contrats
- Dates d’échéance des contrats
- Documents liés
- Assurance responsabilité
- Licence ou certification
- Historique des interventions
- Notes internes

Entités principales :
- Vendor
- VendorContact
- VendorContract
- VendorDocument
- VendorAssignment

---

## 9. Import Excel du carnet d’entretien

Objectif : permettre d’importer rapidement un carnet d’entretien existant.

Fonctionnalités :
- Téléversement d’un fichier Excel
- Lecture des colonnes
- Mapping des colonnes
- Validation des données
- Aperçu avant import
- Détection des erreurs
- Import des composantes
- Import des tâches d’entretien
- Import des fournisseurs
- Rapport d’import

Colonnes recommandées :
- Catégorie
- Composante
- Description
- Emplacement
- État
- Priorité
- Fréquence
- Date du dernier entretien
- Date du prochain entretien
- Coût estimé
- Fournisseur
- Notes

Entités principales :
- ImportBatch
- ImportRow
- ImportError

---

## 10. Fonds de prévoyance

Objectif : aider à planifier les dépenses majeures et les contributions nécessaires au fonds de prévoyance.

Fonctionnalités :
- Solde actuel du fonds
- Contributions annuelles
- Dépenses prévues
- Dépenses réelles
- Lien avec les composantes du carnet d’entretien
- Coût de remplacement estimé
- Année prévue de remplacement
- Inflation
- Scénarios financiers
- Projection sur 5, 10, 25 et 30 ans
- Graphiques
- Export PDF

Entités principales :
- ReserveFund
- ReserveFundScenario
- ReserveFundContribution
- ReserveFundExpense
- ReserveFundProjection

---

## 11. Assistant IA documentaire

Objectif : permettre aux utilisateurs autorisés de poser des questions sur les documents de la copropriété.

Fonctionnalités :
- Analyse de la déclaration de copropriété
- Analyse des règlements
- Analyse des procès-verbaux
- Analyse des contrats
- Réponses basées seulement sur les documents disponibles
- Citations des sources
- Affichage des extraits utilisés
- Avertissement que la réponse n’est pas un avis juridique
- Respect des permissions de documents

Exemples de questions :
- Ai-je le droit d’installer une borne électrique?
- Qui est responsable des fenêtres?
- Est-ce que les animaux sont permis?
- Quelles sont les règles pour les balcons?
- Quel fournisseur est responsable du déneigement?

Entités principales :
- DocumentEmbedding
- AiConversation
- AiMessage
- AiSourceReference

---

## 12. Notifications et rappels

Objectif : informer les bonnes personnes au bon moment.

Fonctionnalités :
- Rappels d’entretien
- Rappels de contrats fournisseurs
- Rappels de documents expirés
- Notifications de nouvelles demandes
- Notifications de tâches en retard
- Notifications courriel
- Notifications dans l’application

Entités principales :
- Notification
- NotificationPreference
- ReminderJob

---

## 13. Rapports et exports

Objectif : permettre d’exporter les données importantes.

Rapports prévus :
- Carnet d’entretien PDF
- Historique des interventions
- Liste des composantes
- Liste des fournisseurs
- Projection du fonds de prévoyance
- Documents manquants
- Tâches en retard
- Rapport de conformité Loi 16

Entités principales :
- Report
- ReportTemplate
- ExportJob

---

## 14. Conformité Loi 16

Objectif : aider les syndicats de copropriété à organiser les informations requises pour respecter leurs obligations.

Fonctionnalités :
- Carnet d’entretien structuré
- Étude du fonds de prévoyance
- Suivi des composantes
- Historique des travaux
- Documents centralisés
- Dates de mise à jour
- Tableau de bord de conformité
- Alertes pour éléments manquants
- Exports pour professionnels

Note :
Le logiciel aide à organiser et suivre les informations, mais ne remplace pas l’avis ou le travail d’un professionnel autorisé lorsque requis.