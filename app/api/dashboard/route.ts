import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const [
    organizationCount,
    condoCount,
    buildingCount,
    unitCount,
    documentCount,
    maintenanceOpenCount,
    vendorCount,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.condo.count(),
    prisma.building.count(),
    prisma.unit.count(),
    prisma.document.count(),
    prisma.maintenanceTask.count({
      where: {
        status: {
          in: ["OPEN", "IN_PROGRESS"],
        },
      },
    }),
    prisma.vendor.count(),
  ]);

  const condos = await prisma.condo.findMany({
    include: {
      buildings: {
        include: {
          units: true,
        },
      },
      documents: true,
      maintenance: true,
      vendors: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    stats: {
      organizations: organizationCount,
      condos: condoCount,
      buildings: buildingCount,
      units: unitCount,
      documents: documentCount,
      openMaintenanceTasks: maintenanceOpenCount,
      vendors: vendorCount,
    },
    condos,
  });
}