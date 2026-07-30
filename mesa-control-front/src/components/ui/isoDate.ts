/** Conversión entre 'YYYY-MM-DD' y `Date` local, sin pasar por UTC. */

/** 'YYYY-MM-DD' → Date local (evita el corrimiento de zona horaria de UTC). */
export function parseISO(value: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return undefined
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** Date → 'YYYY-MM-DD' (componentes locales, mismo contrato que el `<input>`). */
export function toISO(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}
