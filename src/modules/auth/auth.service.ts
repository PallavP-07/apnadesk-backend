import { Prisma, UserRole } from "@prisma/client";
import { env } from "../../config/env";
import { ApiError } from "../../lib/api-error";
import { HTTP_STATUS } from "../../lib/http-status";
import { signAccessToken } from "../../lib/jwt";
import { hashPassword, verifyPassword } from "../../lib/password";
import { prisma } from "../../lib/prisma";
import type { LoginInput } from "./auth.schema";

export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  isActive: true,
  ownerId: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

let dummyPasswordHash: Promise<string> | undefined;

// Comparing against a dummy hash keeps response time the same whether or not the email exists.
function getDummyPasswordHash(): Promise<string> {
  dummyPasswordHash ??= hashPassword("timing-safe-dummy-password");
  return dummyPasswordHash;
}

function invalidCredentials(): ApiError {
  return new ApiError({
    status: HTTP_STATUS.UNAUTHORIZED,
    code: "INVALID_CREDENTIALS",
    message: "Invalid email or password",
  });
}

async function loginWithRoles({ email, password }: LoginInput, allowedRoles: UserRole[]) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { owner: { select: { isActive: true } } },
  });

  if (!user?.passwordHash) {
    await verifyPassword(password, await getDummyPasswordHash());
    throw invalidCredentials();
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);

  if (!passwordMatches || !allowedRoles.includes(user.role)) {
    throw invalidCredentials();
  }

  if (!user.isActive) {
    throw new ApiError({
      status: HTTP_STATUS.FORBIDDEN,
      code: "ACCOUNT_DISABLED",
      message: "This account has been disabled",
    });
  }

  if (user.owner && !user.owner.isActive) {
    throw new ApiError({
      status: HTTP_STATUS.FORBIDDEN,
      code: "OWNER_ACCOUNT_DISABLED",
      message: "Your salon's account has been disabled",
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
    select: publicUserSelect,
  });

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    tokenType: "Bearer",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    user: updatedUser,
  };
}

export function loginSuperAdmin(input: LoginInput) {
  return loginWithRoles(input, [UserRole.SUPER_ADMIN]);
}

export function loginUser(input: LoginInput) {
  return loginWithRoles(input, [UserRole.OWNER, UserRole.STAFF]);
}

export function getCurrentUser(userId: string) {
  return prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: publicUserSelect,
  });
}
