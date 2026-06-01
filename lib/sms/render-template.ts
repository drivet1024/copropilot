export function renderSmsTemplate(
  template: string,
  data: {
    ownerName?: string | null;
    unitNumber?: string | null;
    buildingName?: string | null;
    condoName?: string | null;
    insuranceRenewalDate?: string | null;
    daysUntilRenewal?: string | null;
  }
) {
  return template
    .replaceAll("{{ownerName}}", data.ownerName || "")
    .replaceAll("{{unitNumber}}", data.unitNumber || "")
    .replaceAll("{{buildingName}}", data.buildingName || "")
    .replaceAll("{{condoName}}", data.condoName || "")
    .replaceAll("{{insuranceRenewalDate}}", data.insuranceRenewalDate || "")
    .replaceAll("{{daysUntilRenewal}}", data.daysUntilRenewal || "");
}
