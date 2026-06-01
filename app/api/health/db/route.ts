import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const condoCount = await prisma.condo.count();

  return NextResponse.json({
    status: "ok",
    database: "connected",
    condos: condoCount,
  });
}