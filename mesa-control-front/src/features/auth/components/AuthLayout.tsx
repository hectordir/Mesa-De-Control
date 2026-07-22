import type { ReactNode } from 'react'

export interface AuthLayoutProps {
  children: ReactNode
  /** Imagen opcional de fondo (sala NOC). Sin ella queda solo el degradado. */
  backgroundUrl?: string
}

/** Pantalla completa: capa de fondo + velo en degradado + tarjeta centrada. */
export function AuthLayout({ children, backgroundUrl }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-bg p-10">
      <div
        data-testid="auth-background"
        aria-hidden="true"
        className="absolute inset-0 bg-bg bg-cover bg-center"
        style={
          backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : undefined
        }
      />
      <div
        data-testid="auth-overlay"
        aria-hidden="true"
        className="absolute inset-0 bg-auth-overlay"
      />
      <div className="relative flex w-full justify-center">{children}</div>
    </div>
  )
}
