-- CreateEnum
CREATE TYPE "ResultadoGestion" AS ENUM ('SOLUCIONADO_MESA', 'ENVIADO_SOPORTE2', 'ESCALADO_NOC', 'PENDIENTE_CLIENTE', 'REAGENDADO');

-- CreateTable
CREATE TABLE "Gestion" (
    "id" TEXT NOT NULL,
    "operadorId" TEXT NOT NULL,
    "resultado" "ResultadoGestion" NOT NULL,
    "motivo" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Gestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Gestion_fecha_idx" ON "Gestion"("fecha");

-- CreateIndex
CREATE INDEX "Gestion_operadorId_fecha_idx" ON "Gestion"("operadorId", "fecha");

-- AddForeignKey
ALTER TABLE "Gestion" ADD CONSTRAINT "Gestion_operadorId_fkey" FOREIGN KEY ("operadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
