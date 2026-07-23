-- CreateEnum
CREATE TYPE "CanalGestion" AS ENUM ('LLAMADA', 'WHATSAPP', 'TELEGRAM');

-- AlterTable
ALTER TABLE "Gestion" ADD COLUMN     "canal" "CanalGestion",
ADD COLUMN     "duracion" INTEGER;
