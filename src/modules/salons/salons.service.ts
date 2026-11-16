import { UserRole } from "@prisma/client";
import { ApiError } from "../../lib/api-error";
import { HTTP_STATUS } from "../../lib/http-status";
import { prisma } from "../../lib/prisma";
import type { SalonInput, UpdateSalonInput } from "./salons.schema";

function salonNotFound(): ApiError {
  return new ApiError({
    status: HTTP_STATUS.NOT_FOUND,
    code: "SALON_NOT_FOUND",
    message: "Salon details have not been set up yet",
  });
}

export async function setOwnerSalon(ownerId: string, input: SalonInput) {
  await prisma.user.findUniqueOrThrow({
    where: { id: ownerId, role: UserRole.OWNER },
    select: { id: true },
  });

  const replacement = {
    addressLine2: null,
    phone: null,
    email: null,
    gstin: null,
    latitude: null,
    longitude: null,
    ...input,
  };

  return prisma.salon.upsert({
    where: { ownerId },
    create: { ...input, ownerId },
    update: replacement,
  });
}

export async function getSalonForUser(userId: string, role: UserRole) {
  const ownerId =
    role === UserRole.OWNER
      ? userId
      : (await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ownerId: true } }))
          .ownerId;

  const salon = ownerId ? await prisma.salon.findUnique({ where: { ownerId } }) : null;

  if (!salon) throw salonNotFound();
  return salon;
}

export async function updateOwnSalon(ownerId: string, input: UpdateSalonInput) {
  const salon = await prisma.salon.findUnique({ where: { ownerId }, select: { id: true } });

  if (!salon) throw salonNotFound();
  return prisma.salon.update({ where: { ownerId }, data: input });
}
