import { Prisma, UserRole } from "@prisma/client";
import { hashPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import { publicUserSelect } from "../auth/auth.service";
import type { CreateAccountInput, UpdateAccountInput } from "./owners.schema";

export async function toUserUpdateData({
  password,
  ...data
}: UpdateAccountInput): Promise<Prisma.UserUpdateInput> {
  return password === undefined ? data : { ...data, passwordHash: await hashPassword(password) };
}

export async function createOwner({ password, ...data }: CreateAccountInput) {
  return prisma.user.create({
    data: { ...data, passwordHash: await hashPassword(password), role: UserRole.OWNER },
    select: publicUserSelect,
  });
}

export function listOwners() {
  return prisma.user.findMany({
    where: { role: UserRole.OWNER },
    orderBy: { createdAt: "desc" },
    select: { ...publicUserSelect, _count: { select: { staff: true } } },
  });
}

export function getOwner(ownerId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: ownerId, role: UserRole.OWNER },
    select: {
      ...publicUserSelect,
      staff: { select: publicUserSelect, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function updateOwner(ownerId: string, input: UpdateAccountInput) {
  return prisma.user.update({
    where: { id: ownerId, role: UserRole.OWNER },
    data: await toUserUpdateData(input),
    select: publicUserSelect,
  });
}

export function setOwnerStatus(ownerId: string, isActive: boolean) {
  return prisma.user.update({
    where: { id: ownerId, role: UserRole.OWNER },
    data: { isActive },
    select: publicUserSelect,
  });
}
