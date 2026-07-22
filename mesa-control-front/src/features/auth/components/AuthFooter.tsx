/** Pie de la tarjeta de acceso: estado de cifrado + versión del producto. */
export function AuthFooter() {
  return (
    <footer className="w-full border-t border-border-subtle pt-5 text-center">
      <p className="flex items-center justify-center gap-2 text-[10px] font-semibold uppercase leading-[1.6] tracking-[.09em] text-text-muted">
        <span
          data-testid="secure-dot"
          aria-hidden="true"
          className="inline-block h-[6px] w-[6px] shrink-0 rounded-pill bg-info"
        />
        Conexión encriptada · extremo a extremo
      </p>
      <p className="text-[10px] font-semibold uppercase leading-[1.6] tracking-[.09em] text-text-muted">
        Mesa de control v2.1 · Fibex Telecom
      </p>
    </footer>
  )
}
