import { prisma } from "@/lib/db/prisma";

export async function logAction(input: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  metadata?: unknown;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity || null,
      entityId: input.entityId || null,
      metadata:
        input.metadata === undefined
          ? undefined
          : JSON.parse(JSON.stringify(input.metadata)),
      userId: input.userId || null,
    },
  });
}
