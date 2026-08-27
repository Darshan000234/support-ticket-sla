import { prisma } from "../db";
import type { UserRole } from "../generated/prisma/client";

export async function listUsers(
  role?: UserRole,
) {
  return prisma.user.findMany({
    where: role
      ? { role }
      : undefined,
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}