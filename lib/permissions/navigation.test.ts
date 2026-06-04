import { describe, expect, it } from "vitest";

import { getNavigationForRole } from "./navigation";

describe("role navigation", () => {
  it("gives MASTER_USER access to the users section", () => {
    const labels = getNavigationForRole("MASTER_USER", {
      currentCondo: { buildingCount: 1 },
    }).map((item) => item.label);

    expect(labels).toContain("Utilisateurs");
    expect(labels).toContain("Paramètres");
  });

  it("does not show Utilisateurs to non-master admin roles", () => {
    const labels = getNavigationForRole("CONDO_MANAGER", {
      currentCondo: { buildingCount: 2 },
    }).map((item) => item.label);

    expect(labels).not.toContain("Utilisateurs");
  });

  it("uses singular Copropriété for single-condo manager navigation", () => {
    const labels = getNavigationForRole("CONDO_MANAGER", {
      currentCondo: { buildingCount: 1 },
    }).map((item) => item.label);

    expect(labels).toContain("Copropriété");
    expect(labels).not.toContain("Copropriétés");
  });

  it("keeps copropriété sub-options out of the sidebar", () => {
    const labels = getNavigationForRole("CONDO_MANAGER", {
      currentCondo: { buildingCount: 1 },
    }).map((item) => item.label);

    expect(labels).not.toContain("Immeubles");
    expect(labels).not.toContain("Unités");
    expect(labels).not.toContain("Paiements des frais de condo");
    expect(labels).toContain("Copropriété");
  });

  it("keeps owner navigation scoped to owner portal sections", () => {
    const labels = getNavigationForRole("OWNER", {
      currentCondo: { buildingCount: 3 },
    }).map((item) => item.label);

    expect(labels).toContain("Ma copropriété");
    expect(labels).not.toContain("Immeubles");
    expect(labels).not.toContain("Paiements des frais de condo");
  });
});
