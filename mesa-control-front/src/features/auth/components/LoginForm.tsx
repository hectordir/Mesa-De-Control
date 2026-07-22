import { useRef, useState, type FormEvent } from 'react'
import { Button } from '../../../components/ui'
import { useLogin } from '../hooks/useLogin'
import { FieldWithIcon } from './FieldWithIcon'
import { ArrowRightIcon } from './icons'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export const EMAIL_ERROR = 'Introduce un correo válido'
export const PASSWORD_ERROR = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = EMAIL_ERROR
  if (password.length < MIN_PASSWORD_LENGTH) errors.password = PASSWORD_ERROR
  return errors
}

/** Formulario de acceso: validación en cliente, estados de carga y error. */
export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const emailRef = useRef<HTMLInputElement>(null)
  const { mutate, isPending, error, reset } = useLogin()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isPending) return

    const nextErrors = validate(email, password)
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) return

    reset()
    mutate(
      { email, password },
      {
        onError: () => {
          setPassword('')
          emailRef.current?.focus()
        },
      },
    )
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4"
    >
      {error ? (
        <p
          role="alert"
          className="rounded-control border border-danger px-3 py-2 text-caption text-danger"
        >
          {error.message}
        </p>
      ) : null}

      <FieldWithIcon
        ref={emailRef}
        label="Correo electrónico"
        icon="mail"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="operador@fibex.com"
        value={email}
        error={errors.email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <FieldWithIcon
        label="Contraseña"
        icon="lock"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={password}
        error={errors.password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full gap-[10px] rounded-cta px-4 py-[13px] text-body font-bold tracking-[.03em] shadow-cta hover:brightness-95"
      >
        {isPending ? (
          'Accediendo…'
        ) : (
          <>
            Acceder al sistema
            <ArrowRightIcon />
          </>
        )}
      </Button>
    </form>
  )
}
