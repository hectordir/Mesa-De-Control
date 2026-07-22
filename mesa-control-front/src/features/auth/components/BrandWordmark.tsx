/** Wordmark de dos líneas: FIBEX (texto primario) / CONTROL (marca). */
export function BrandWordmark() {
  return (
    <div
      role="img"
      aria-label="Fibex Control"
      className="flex flex-col items-center text-[34px] font-bold leading-none tracking-[.22em] pl-[.22em]"
    >
      <span className="text-text-primary">FIBEX</span>
      <span className="text-brand">CONTROL</span>
    </div>
  )
}
