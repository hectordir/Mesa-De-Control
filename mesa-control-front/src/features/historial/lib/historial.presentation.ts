import type { GestionRow } from '../../../lib/api/types'
import { mesActualVE } from '../../../lib/tiempoVE'
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

/**
 * Texto de celda: degrada a `—` los valores vacíos.
 * Aplica a `nombreCliente`/`telefono`, que pueden llegar en `''` en filas
 * históricas anteriores a la validación obligatoria del POST.
 */
export function textoODash(value: string | null | undefined): string {
  const t = (value ?? '').trim()
  return t === '' ? '—' : t
}

/**
 * Presentación del identificador Fibex del cliente: `1002451` → `LG-1002451`.
 * Es el ÚNICO punto donde se arma el prefijo; toda la UI (tabla, cards, drawer,
 * modal y CSV) pasa por aquí para no divergir. Sin abonado no hay prefijo que
 * poner: degrada al mismo guion que `textoODash` en vez de un `LG-` huérfano.
 *
 * Ojo: nada que ver con `GestionRow.codigo` (LG-#### derivado del id de BD),
 * que sigue sin mostrarse en ninguna parte.
 */
export function formatAbonado(abonado: string | null | undefined): string {
  const t = (abonado ?? '').trim()
  return t === '' ? textoODash(t) : `LG-${t}`
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
  // `Abonado` es el identificador del cliente en Fibex: el único id de fila que
  // se expone al usuario (el `codigo` LG-xxxx derivado del id de BD no se pinta).
  'Abonado',
  'Operador',
  'Cliente',
  'Telefono',
  'Zona',
  'Resultado',
  'Fecha',
  'Hora',
]

/** CSV de las filas visibles: cabecera + una línea por gestión. */
export function gestionesToCsv(rows: GestionRow[]): string {
  const lineas = [CSV_HEADER.join(',')]
  for (const r of rows) {
    lineas.push(
      [
        formatAbonado(r.abonado),
        r.operador.nombre,
        r.nombreCliente,
        r.telefono,
        r.zona,
        resultadoPresentation(r.resultado).label,
        formatFecha(r.fecha),
        r.hora,
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return lineas.join('\n')
}

/**
 * Rango [primer día, último día] del mes en curso en 'YYYY-MM-DD', calculado
 * sobre la hora de la operación (Venezuela) y no sobre la del navegador: es el
 * mismo mes que agrega el backend.
 */
export function mesEnCurso(): { desde: string; hasta: string } {
  const [anio, mes] = mesActualVE().split('-').map(Number)
  const mm = `${mes}`.padStart(2, '0')
  // Día 0 del mes siguiente = último del actual; `Date` aquí es sólo una
  // calculadora de calendario, no un reloj.
  const ultimo = new Date(anio, mes, 0).getDate()
  return {
    desde: `${anio}-${mm}-01`,
    hasta: `${anio}-${mm}-${`${ultimo}`.padStart(2, '0')}`,
  }
}
