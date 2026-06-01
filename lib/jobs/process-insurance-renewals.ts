import { prisma } from "@/lib/db/prisma";
import { renderSmsTemplate } from "@/lib/sms/render-template";
import { sendSms } from "@/lib/sms/twilio";

const defaultInsuranceTemplate =
  "Bonjour {{ownerName}}, rappel de la gestion de la copropriété {{condoName}} : votre assurance habitation pour l’unité {{unitNumber}} arrive à renouvellement le {{insuranceRenewalDate}}, soit dans {{daysUntilRenewal}} jour(s). Merci de nous transmettre votre preuve d’assurance à jour.";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDaysUntilRenewal(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const renewalDate = new Date(date);
  renewalDate.setHours(0, 0, 0, 0);

  const diffMs = renewalDate.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

async function getOrCreateInsuranceTemplate() {
  const template = await prisma.smsTemplate.findFirst({
    where: {
      type: "INSURANCE_RENEWAL",
      isActive: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (template) {
    return template;
  }

  return prisma.smsTemplate.create({
    data: {
      name: "Renouvellement assurance habitation",
      type: "INSURANCE_RENEWAL",
      body: defaultInsuranceTemplate,
      isActive: true,
    },
  });
}

export async function processInsuranceRenewals() {
  const now = new Date();

  const fourWeeksFromNow = new Date();
  fourWeeksFromNow.setDate(now.getDate() + 28);

  const template = await getOrCreateInsuranceTemplate();

  const units = await prisma.unit.findMany({
    where: {
      insuranceRenewalDate: {
        gte: now,
        lte: fourWeeksFromNow,
      },
      mobile: {
        not: null,
      },
    },
    include: {
      building: {
        include: {
          condo: true,
        },
      },
    },
    orderBy: {
      insuranceRenewalDate: "asc",
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const unit of units) {
    if (!unit.insuranceRenewalDate || !unit.mobile) {
      skipped++;
      continue;
    }

    const existingLog = await prisma.insuranceReminderLog.findUnique({
      where: {
        unitId_insuranceRenewalDate_reminderType: {
          unitId: unit.id,
          insuranceRenewalDate: unit.insuranceRenewalDate,
          reminderType: "SMS_4_WEEKS_BEFORE",
        },
      },
    });

    if (existingLog) {
      skipped++;
      continue;
    }

    const daysUntilRenewal = getDaysUntilRenewal(unit.insuranceRenewalDate);

    const body = renderSmsTemplate(template.body, {
      ownerName: unit.ownerName,
      unitNumber: unit.number,
      buildingName: unit.building.name,
      condoName: unit.building.condo.name,
      insuranceRenewalDate: formatDate(unit.insuranceRenewalDate),
      daysUntilRenewal: String(daysUntilRenewal),
    });

    try {
      const result = await sendSms({
        to: unit.mobile,
        body,
      });

      await prisma.insuranceReminderLog.create({
        data: {
          unitId: unit.id,
          insuranceRenewalDate: unit.insuranceRenewalDate,
          reminderType: "SMS_4_WEEKS_BEFORE",
          sentTo: unit.mobile,
          messageBody: body,
          status: result.success ? "SENT" : "SKIPPED",
          errorMessage: result.reason || null,
        },
      });

      if (result.success && !result.skipped) {
        sent++;
      } else {
        skipped++;
      }
    } catch (error) {
      await prisma.insuranceReminderLog.create({
        data: {
          unitId: unit.id,
          insuranceRenewalDate: unit.insuranceRenewalDate,
          reminderType: "SMS_4_WEEKS_BEFORE",
          sentTo: unit.mobile,
          messageBody: body,
          status: "ERROR",
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
        },
      });

      skipped++;
    }
  }

  return {
    processed: units.length,
    sent,
    skipped,
  };
}
