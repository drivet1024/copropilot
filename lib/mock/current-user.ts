import type { UserRole } from "@/lib/permissions/navigation";

type MockCurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export const currentUser: MockCurrentUser = {
  id: "user_1",
  name: "Daniel",
  email: "daniel@example.com",
  role: "CONDO_MANAGER",
};
