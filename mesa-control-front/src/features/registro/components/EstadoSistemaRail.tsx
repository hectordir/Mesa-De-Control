import { cx } from '../../../components/ui/cx'

const ESTADOS = [
  { label: 'API de Gestiones', estado: 'Operativa', tono: 'success' },
  { label: 'Base de Datos', estado: 'Sincronizada', tono: 'success' },
  { label: 'Sincronización', estado: 'En tiempo real', tono: 'info' },
] as const

const puntoTono: Record<string, string> = {
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
}

/** Rail lateral: estado del sistema (estático) + tarjeta de consejo. */
export function EstadoSistemaRail() {
  return (
    <aside className="flex flex-col gap-4">
      <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-elevation">
        <h2 className="text-label uppercase text-text-muted">Estado del Sistema</h2>
        <ul className="flex flex-col gap-3">
          {ESTADOS.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-3">
              <span className="text-body text-text-secondary">{item.label}</span>
              <span className="inline-flex items-center gap-2 text-caption font-medium text-text-primary">
                <span
                  aria-hidden="true"
                  className={cx('h-2 w-2 rounded-pill', puntoTono[item.tono])}
                />
                {item.estado}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <section className="flex flex-col gap-2 rounded-card border border-brand-outline bg-brand-soft p-6">
        <h3 className="text-label uppercase text-brand">Consejo</h3>
        <p className="text-body text-text-secondary">
          Ubica el pin con precisión: alimenta el mapa de calor del Análisis
          Mensual y agiliza el despacho de las visitas técnicas.
        </p>
      </section>
    </aside>
  )
}
