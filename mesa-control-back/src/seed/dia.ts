/**
 * Día calendario de `d` en la zona horaria del servidor, como `YYYY-MM-DD`.
 * Es la MISMA convención que usan `DashboardService.hoy()` y
 * `SupervisionService.hoy()`: el seed y las consultas deben coincidir o el
 * "día de hoy" del front saldría vacío.
 */
export function diaLocal(d: Date = new Date()): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}
