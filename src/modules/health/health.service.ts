import { prisma } from "../../lib/prisma";

export async function checkDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}

