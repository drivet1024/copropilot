import "dotenv/config";

import { processInsuranceRenewals } from "@/lib/jobs/process-insurance-renewals";

async function main() {
  const result = await processInsuranceRenewals();
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
