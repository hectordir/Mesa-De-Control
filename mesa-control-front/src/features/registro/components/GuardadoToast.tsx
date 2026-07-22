/** Toast de confirmación tras guardar una gestión. */
export function GuardadoToast({
  visible,
  onClose,
  mensaje = 'Gestión guardada',
}: {
  visible: boolean
  onClose: () => void
  mensaje?: string
}) {
  if (!visible) return null
  return (
    <div
      role="status"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-card border border-success-outline bg-surface px-4 py-3 shadow-elevation"
    >
      <span
        aria-hidden="true"
        className="flex h-6 w-6 items-center justify-center rounded-pill bg-success text-brand-fg"
      >
        ✓
      </span>
      <span className="text-body font-medium text-text-primary">{mensaje}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="text-text-muted hover:text-text-primary"
      >
        ✕
      </button>
    </div>
  )
}
