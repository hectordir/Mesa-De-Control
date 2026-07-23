-- CreateEnum
CREATE TYPE "EstadoAtencion" AS ENUM ('SOLUCIONADO', 'EN_PROCESO', 'ESCALADO');

-- CreateTable
CREATE TABLE "AtencionApp" (
    "id" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "abonado" TEXT NOT NULL,
    "canal" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "solucion" TEXT NOT NULL,
    "estado" "EstadoAtencion" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AtencionApp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AtencionApp_estado_idx" ON "AtencionApp"("estado");

-- CreateIndex
CREATE INDEX "AtencionApp_canal_idx" ON "AtencionApp"("canal");

-- AddForeignKey
ALTER TABLE "AtencionApp" ADD CONSTRAINT "AtencionApp_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
