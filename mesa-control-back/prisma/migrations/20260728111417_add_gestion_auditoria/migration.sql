-- AlterTable
ALTER TABLE "Gestion" ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "updatedBy" TEXT;

-- AddForeignKey
ALTER TABLE "Gestion" ADD CONSTRAINT "Gestion_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
