import type { ReactNode } from 'react'
import { Card } from '../../../components/ui'

/** Tarjeta "glass" de 428px que contiene el formulario de acceso. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <Card className="!rounded-auth flex w-[428px] max-w-full flex-col items-center gap-[22px] !bg-surface-glass px-[44px] pb-[34px] pt-10 !shadow-auth backdrop-blur-[16px]">
      {children}
    </Card>
  )
}
