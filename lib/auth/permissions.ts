export type UserRole =
  | "MASTER_USER"
  | "CONDO_MANAGER"
  | "BOARD_MEMBER"
  | "OWNER"
  | "VIEWER";

export function canAccessAdmin(role: UserRole) {
  return role === "MASTER_USER";
}

export function canManageUsers(role: UserRole) {
  return role === "MASTER_USER";
}

export function canManageSettings(role: UserRole) {
  return role === "MASTER_USER";
}

export function canManageCondos(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canManageBuildings(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canManageUnits(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canManageDocuments(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canManageVendors(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canManageMaintenance(role: UserRole) {
  return role === "MASTER_USER" || role === "CONDO_MANAGER";
}

export function canViewCondoData(role: UserRole) {
  return [
    "MASTER_USER",
    "CONDO_MANAGER",
    "BOARD_MEMBER",
    "OWNER",
    "VIEWER",
  ].includes(role);
}
