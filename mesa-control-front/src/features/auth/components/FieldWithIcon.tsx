import type { ComponentPropsWithRef } from 'react'
import { Input } from '../../../components/ui'
import { FieldIcon, type FieldIconName } from './icons'

export interface FieldWithIconProps extends ComponentPropsWithRef<'input'> {
  label: string
  icon: FieldIconName
  error?: string
}

/** Campo del formulario de acceso: label + input con icono a la izquierda. */
export function FieldWithIcon({
  label,
  icon,
  error,
  ...props
}: FieldWithIconProps) {
  return (
    <Input
      label={label}
      error={error}
      leadingIcon={<FieldIcon name={icon} />}
      labelClassName="text-text-secondary"
      wrapperClassName="gap-2"
      /* `!` fuerza fondo y anillo del diseño por encima de los del primitivo */
      className="!bg-bg-field !py-3 focus:!ring-4 focus:!ring-brand-ring"
      {...props}
    />
  )
}
