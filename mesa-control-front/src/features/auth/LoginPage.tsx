import { AuthCard } from './components/AuthCard'
import { AuthFooter } from './components/AuthFooter'
import { AuthLayout } from './components/AuthLayout'
import { BrandWordmark } from './components/BrandWordmark'
import { LoginForm } from './components/LoginForm'
import { RestrictedBadge } from './components/RestrictedBadge'

export interface LoginPageProps {
  /** Imagen opcional del fondo (sala NOC). */
  backgroundUrl?: string
}

/** Pantalla "Acceso Fibex Control". */
export default function LoginPage({ backgroundUrl }: LoginPageProps) {
  return (
    <AuthLayout backgroundUrl={backgroundUrl}>
      <AuthCard>
        <RestrictedBadge />
        <BrandWordmark />
        <p className="max-w-[280px] text-center text-caption leading-[1.5] text-text-secondary">
          Sistema maestro de gestión operativa y validación de reportes.
        </p>
        <LoginForm />
        <AuthFooter />
      </AuthCard>
    </AuthLayout>
  )
}
