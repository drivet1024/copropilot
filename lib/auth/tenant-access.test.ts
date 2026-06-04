import { describe, expect, it } from "vitest";

import type { SessionUser } from "./session";
import {
  assertCondoAccess,
  getBuildingWhereForUser,
  getCondoWhereForUser,
  getUnitWhereForUser,
  getUserCondoScope,
  TenantAccessError,
} from "./tenant-access";

function makeUser(overrides: Partial<SessionUser>): SessionUser {
  return {
    id: "user_1",
    email: "user@example.com",
    name: "User",
    role: "VIEWER",
    status: "ACTIVE",
    organizationId: null,
    condoId: null,
    unitId: null,
    ...overrides,
  };
}

describe("tenant access helpers", () => {
  it("gives MASTER_USER a global scope and no Prisma filter", () => {
    const user = makeUser({ role: "MASTER_USER" });

    expect(getUserCondoScope(user)).toEqual({ type: "all" });
    expect(getCondoWhereForUser(user)).toBeUndefined();
    expect(getBuildingWhereForUser(user)).toBeUndefined();
    expect(getUnitWhereForUser(user)).toBeUndefined();
    expect(() => assertCondoAccess(user, "condo_b")).not.toThrow();
  });

  it("limits a condo manager to their own condo", () => {
    const user = makeUser({ role: "CONDO_MANAGER", condoId: "condo_a" });

    expect(getUserCondoScope(user)).toEqual({
      type: "condo",
      condoId: "condo_a",
    });
    expect(getCondoWhereForUser(user)).toEqual({ id: "condo_a" });
    expect(getBuildingWhereForUser(user)).toEqual({ condoId: "condo_a" });
    expect(getUnitWhereForUser(user)).toEqual({
      building: { condoId: "condo_a" },
    });
    expect(() => assertCondoAccess(user, "condo_a")).not.toThrow();
  });

  it("rejects access to another condo", () => {
    const user = makeUser({ role: "CONDO_MANAGER", condoId: "condo_a" });

    expect(() => assertCondoAccess(user, "condo_b")).toThrow(
      TenantAccessError
    );
  });

  it("denies tenant data to non-master users without condoId", () => {
    const user = makeUser({ role: "BOARD_MEMBER", condoId: null });

    expect(getUserCondoScope(user)).toEqual({ type: "none" });
    expect(getCondoWhereForUser(user)).toEqual({ id: { in: [] } });
    expect(getBuildingWhereForUser(user)).toEqual({ condoId: { in: [] } });
    expect(getUnitWhereForUser(user)).toEqual({
      building: { condoId: { in: [] } },
    });
    expect(() => assertCondoAccess(user, "condo_a")).toThrow(
      TenantAccessError
    );
  });
});
