import { NextResponse } from "next/server";

import { processInsuranceRenewals } from "@/lib/jobs/process-insurance-renewals";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.JOBS_SECRET;

  if (!expectedToken) {
    return NextResponse.json(
      { error: "JOBS_SECRET is not configured." },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processInsuranceRenewals();

  return NextResponse.json({
    status: "ok",
    result,
  });
}
