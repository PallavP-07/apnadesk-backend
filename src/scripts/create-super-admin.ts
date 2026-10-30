import { UserRole } from "@prisma/client";
import { z } from "zod";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { hashPassword } from "../lib/password";
import { prisma } from "../lib/prisma";

const minPasswordLength = env.NODE_ENV === "production" ? 12 : 6;

const inputSchema = z.object({
  SUPER_ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  SUPER_ADMIN_PASSWORD: z.string().min(minPasswordLength),
  SUPER_ADMIN_NAME: z.string().trim().min(1).default("Super Admin"),
});

async function main(): Promise<void> {
  const input = inputSchema.parse(process.env);
  const passwordHash = await hashPassword(input.SUPER_ADMIN_PASSWORD);

  const user = await prisma.user.upsert({
    where: { email: input.SUPER_ADMIN_EMAIL },
    update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true },
    create: {
      email: input.SUPER_ADMIN_EMAIL,
      name: input.SUPER_ADMIN_NAME,
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
    select: { id: true, email: true },
  });

  logger.info({ userId: user.id, email: user.email }, "Super admin is ready");
}

main()
  .catch((error) => {
    logger.error({ err: error }, "Failed to create super admin");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
