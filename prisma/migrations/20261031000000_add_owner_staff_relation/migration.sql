-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ownerId" UUID;

-- CreateIndex
CREATE INDEX "users_ownerId_idx" ON "users"("ownerId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
