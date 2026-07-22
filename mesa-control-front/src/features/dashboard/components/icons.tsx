/**
 * Iconografía inline del Monitor Diario.
 * Heredan el color con `currentColor`: cero literales de color.
 */
import type { ReactNode } from 'react'

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

interface IconProps {
  size?: number
}

function Svg({
  name,
  size = 16,
  children,
}: IconProps & { name: string; children: ReactNode }) {
  return (
    <svg
      data-testid={`icon-${name}`}
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...strokeProps}
    >
      {children}
    </svg>
  )
}

export function MoonIcon({ size }: IconProps) {
  return (
    <Svg name="moon" size={size}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </Svg>
  )
}

export function SunIcon({ size }: IconProps) {
  return (
    <Svg name="sun" size={size}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Svg>
  )
}

export function SearchIcon({ size }: IconProps) {
  return (
    <Svg name="search" size={size}>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  )
}

export function CalendarIcon({ size }: IconProps) {
  return (
    <Svg name="calendar" size={size}>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </Svg>
  )
}

export function ChevronDownIcon({ size = 12 }: IconProps) {
  return (
    <Svg name="chevron-down" size={size}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function SendIcon({ size }: IconProps) {
  return (
    <Svg name="send" size={size}>
      <path d="M21 4 3 11l7 3 3 7 8-17z" />
      <path d="m10 14 4-4" />
    </Svg>
  )
}

export function LogoutIcon({ size }: IconProps) {
  return (
    <Svg name="logout" size={size}>
      <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
      <path d="M9 8 5 12l4 4M5 12h10" />
    </Svg>
  )
}

export function RowsIcon({ size = 22 }: IconProps) {
  return (
    <Svg name="rows" size={size}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M3.5 14.5h17" />
    </Svg>
  )
}

export function BarsIcon({ size = 22 }: IconProps) {
  return (
    <Svg name="bars" size={size}>
      <path d="M4 7h13M4 12h9M4 17h16" />
    </Svg>
  )
}

export function RadarIcon({ size = 20 }: IconProps) {
  return (
    <Svg name="radar" size={size}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function AlertTriangleIcon({ size = 16 }: IconProps) {
  return (
    <Svg name="alert-triangle" size={size}>
      <path d="M12 4.5 21 19.5H3L12 4.5z" />
      <path d="M12 10v4M12 17h.01" />
    </Svg>
  )
}

export function GaugeIcon({ size = 16 }: IconProps) {
  return (
    <Svg name="gauge" size={size}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 12V6M12 12l4 3" />
    </Svg>
  )
}

export function GridIcon({ size = 20 }: IconProps) {
  return (
    <Svg name="grid" size={size}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path d="M9 3.5v17M15 3.5v17M3.5 9h17M3.5 15h17" />
    </Svg>
  )
}
