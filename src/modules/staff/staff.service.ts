import { UserRole } from "@prisma/client";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { publicUserSelect } from "../auth/auth.service";
import type { CreateAccountInput, UpdateAccountInput } from "../owners/owners.schema";
import { toUserUpdateData } from "../owners/owners.service";

export async function createStaff(ownerId: string, { password, ...data }: CreateAccountInput) {
  return prisma.user.create({
    data: { ...data, passwordHash: await hashPassword(password), role: UserRole.STAFF, ownerId },
    select: publicUserSelect,
  });
}

export function listStaff(ownerId: string) {
  return prisma.user.findMany({
    where: { ownerId, role: UserRole.STAFF },
    orderBy: { createdAt: "desc" },
    select: publicUserSelect,
  });
}

export function getStaff(ownerId: string, staffId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: staffId, ownerId, role: UserRole.STAFF },
    select: publicUserSelect,
  });
}

export async function updateStaff(ownerId: string, staffId: string, input: UpdateAccountInput) {
  return prisma.user.update({
    where: { id: staffId, ownerId, role: UserRole.STAFF },
    data: await toUserUpdateData(input),
    select: publicUserSelect,
  });
}

export function setStaffStatus(ownerId: string, staffId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: staffId, ownerId, role: UserRole.STAFF },
    data: { isActive },
    select: publicUserSelect,
  });
}
