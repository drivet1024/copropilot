import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { hashPassword } from "../lib/auth/password";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const masterEmail = process.env.MASTER_USER_EMAIL;
  const masterPassword = process.env.MASTER_USER_PASSWORD;

  if (!masterEmail || !masterPassword) {
    throw new Error("MASTER_USER_EMAIL and MASTER_USER_PASSWORD are required.");
  }

  const organization = await prisma.organization.upsert({
    where: { id: "org_demo" },
    update: {},
    create: {
      id: "org_demo",
      name: "Copropriété Démo",
      condos: {
        create: {
          name: "Condo Le Bellevue",
          address: "123 rue Principale, Montréal",
          buildings: {
            create: {
              name: "Bâtiment A",
              address: "123 rue Principale",
              units: {
                createMany: {
                  data: [
                    { number: "101", floor: "1" },
                    { number: "102", floor: "1" },
                    { number: "201", floor: "2" },
                  ],
                },
              },
            },
          },
          documents: {
            create: [
              {
                title: "Déclaration de copropriété",
                type: "LEGAL",
                url: "/documents/declaration.pdf",
              },
              {
                title: "Budget annuel 2026",
                type: "FINANCE",
                url: "/documents/budget-2026.xlsx",
              },
            ],
          },
          maintenance: {
            create: [
              {
                title: "Inspection toiture",
                description: "Inspection préventive annuelle",
                status: "OPEN",
                priority: "HIGH",
              },
              {
                title: "Nettoyage garage",
                description: "Nettoyage saisonnier du stationnement intérieur",
                status: "IN_PROGRESS",
                priority: "MEDIUM",
              },
            ],
          },
          vendors: {
            create: [
              {
                name: "Toitures Montréal Inc.",
                category: "Toiture",
                email: "contact@toituresmontreal.example",
                phone: "514-555-0101",
              },
              {
                name: "Entretien Propriété Plus",
                category: "Entretien",
                email: "service@proprieteplus.example",
                phone: "514-555-0202",
              },
            ],
          },
        },
      },
    },
  });

  const passwordHash = await hashPassword(masterPassword);

  await prisma.user.upsert({
    where: { email: masterEmail },
    update: {
      name: "Master User",
      organizationId: organization.id,
      passwordHash,
      role: "MASTER_USER",
      status: "ACTIVE",
    },
    create: {
      email: masterEmail,
      name: "Master User",
      organizationId: organization.id,
      passwordHash,
      role: "MASTER_USER",
      status: "ACTIVE",
    },
  });

  console.log("Seed completed:", organization.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
