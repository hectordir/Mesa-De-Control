import type { GestionRow } from '../../../lib/api/types'
import { resultadoPresentation } from './resultado.presentation'

/** Iniciales del avatar del operador (máx. 2), `?` si el nombre está vacío. */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[1][0]).toUpperCase()
}

/** 'YYYY-MM-DD' → 'DD/MM/YYYY' (sin dependencias de zona horaria). */
export function formatFecha(fecha: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha)
  if (!m) return fecha
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** Duración en minutos a texto legible; `—` si es nula. */
export function formatDuracion(min: number | null): string {
  if (min === null || min === undefined) return '—'
  if (min < 60) return `${min} min`
  const horas = Math.floor(min / 60)
  const resto = min % 60
  return `${horas}h ${String(resto).padStart(2, '0')}m`
}

/** Zebra: se tinta la fila impar (0-indexed). */
export function esZebra(index: number): boolean {
  return index % 2 === 1
}

/** Rango 1-indexed de filas visibles en la página actual. */
export function rangoPagina(
  page: number,
  pageSize: number,
  total: number,
): { desde: number; hasta: number } {
  if (total <= 0) return { desde: 0, hasta: 0 }
  const desde = (page - 1) * pageSize + 1
  const hasta = Math.min(page * pageSize, total)
  return { desde, hasta }
}

/** Entrecomilla un campo CSV cuando contiene coma, comilla o salto de línea. */
function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

const CSV_HEADER = [
  'Codigo',
  'Operador',
  'Abonado',
  'Telefono',
  'Zona',
  'Canal',
  'Resultado',
  'Fecha',
  'Hora',
  'Duracion',
]

/** CSV de las filas visibles: cabecera + una línea por gestión. */
export function gestionesToCsv(rows: GestionRow[]): string {
  const lineas = [CSV_HEADER.join(',')]
  for (const r of rows) {
    lineas.push(
      [
        r.codigo,
        r.operador.nombre,
        r.abonado,
        r.telefono,
        r.zona,
        r.canal ?? '',
        resultadoPresentation(r.resultado).label,
        formatFecha(r.fecha),
        r.hora,
        formatDuracion(r.duracionMin),
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lineas.join('\n')
}
