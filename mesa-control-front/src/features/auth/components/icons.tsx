/**
 * Iconografía inline de la pantalla de acceso.
 * Todos heredan el color con `stroke="currentColor"`: cero literales de color.
 */

export type FieldIconName = 'mail' | 'lock'

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export function ShieldIcon() {
  return (
    <svg
      data-testid="icon-shield"
      aria-hidden="true"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      {...strokeProps}
    >
      <path d="M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z" />
    </svg>
  )
}

export function FieldIcon({ name }: { name: FieldIconName }) {
  return (
    <svg
      data-testid={`icon-${name}`}
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      {...strokeProps}
    >
      {name === 'mail' ? (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </>
      ) : (
        <>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      )}
    </svg>
  )
}

export function ArrowRightIcon() {
  return (
    <svg
      data-testid="icon-arrow-right"
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      {...strokeProps}
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}
