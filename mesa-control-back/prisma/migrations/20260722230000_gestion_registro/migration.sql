-- AlterTable
-- Columnas nuevas del formulario Registro · Nueva Gestión.
-- NOT NULL con DEFAULT '' / false: las filas del seed histórico se rellenan sin
-- requerir un reseed; `coordenadas` es opcional (pin exacto 'lat, lng').
ALTER TABLE "Gestion"
    ADD COLUMN "abonado" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "telefono" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "detalle" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "solucion" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "tipo" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "requiereVisita" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "observacion" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "coordenadas" TEXT;
