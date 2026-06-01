# Jobs CoproPilot

## Rappels d’assurance habitation

Le job `processInsuranceRenewals` détecte les unités dont la date de
renouvellement d’assurance arrive dans les 28 prochains jours, prépare le SMS à
partir du template actif `INSURANCE_RENEWAL`, puis journalise chaque tentative.

Fréquence recommandée : quotidienne, par exemple à 08:00.

Endpoint interne :

```http
POST /api/jobs/insurance-renewals
Authorization: Bearer <JOBS_SECRET>
```

Script local :

```powershell
npm run jobs:insurance-renewals
```

Options d’exécution automatique :

- Développement local : utiliser Windows Task Scheduler pour appeler `npm run jobs:insurance-renewals`.
- Développement local : appeler manuellement `POST /api/jobs/insurance-renewals`.
- Production : utiliser un cron externe.
- Production Vercel : utiliser Vercel Cron Jobs.
- Production VPS : utiliser un worker Node séparé.

Le log `InsuranceReminderLog` empêche les doublons grâce à une contrainte unique
sur l’unité, la date de renouvellement et le type de rappel.
