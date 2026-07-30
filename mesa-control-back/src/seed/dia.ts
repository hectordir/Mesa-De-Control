import { hoyVE } from '../common/time/index';

/**
 * Día calendario de `d` en hora de Venezuela, como `YYYY-MM-DD`.
 * Es la MISMA convención que usan `DashboardService.hoy()` y
 * `SupervisionService.hoy()`: el seed y las consultas deben coincidir o el
 * "día de hoy" del front saldría vacío.
 */
export function diaLocal(d: Date = new Date()): string {
  return hoyVE(d);
}
