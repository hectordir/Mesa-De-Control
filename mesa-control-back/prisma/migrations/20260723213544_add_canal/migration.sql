-- CreateEnum
CREATE TYPE "CategoriaCanal" AS ENUM ('DEPORTES', 'INFANTIL', 'NOTICIAS', 'DOCUMENTALES', 'PREMIUM', 'GENERAL', 'MUSICA');

-- CreateEnum
CREATE TYPE "EstadoCanal" AS ENUM ('OPERATIVO', 'CAIDO');

-- CreateEnum
CREATE TYPE "TipoIncidencia" AS ENUM ('SIN_SENAL', 'VIDEO_PIXELADO', 'IMAGEN_CONGELADA', 'AUDIO_DESINCRONIZADO', 'SENAL_INTERMITENTE');

-- CreateEnum
CREATE TYPE "SeveridadIncidencia" AS ENUM ('CRITICA', 'ALTA', 'MEDIA');

-- CreateTable
CREATE TABLE "Canal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaCanal" NOT NULL,
    "estado" "EstadoCanal" NOT NULL DEFAULT 'OPERATIVO',
    "tipoIncidencia" "TipoIncidencia",
    "severidad" "SeveridadIncidencia",
    "detectadoEn" TIMESTAMP(3),
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Canal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Canal_estado_idx" ON "Canal"("estado");
