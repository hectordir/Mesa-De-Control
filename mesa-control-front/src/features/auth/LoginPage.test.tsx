import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderAtLogin } from '../../test/renderWithProviders'
import { AuthError } from '../../lib/api/auth'
import { useAuthStore } from '../../stores/auth.store'
import LoginPage from './LoginPage'

vi.mock('../../lib/api/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api/auth')>()
  return { ...actual, login: vi.fn() }
})

const { login } = await import('../../lib/api/auth')
const loginMock = vi.mocked(login)

const okResponse = {
  accessToken: 'jwt-123',
  user: {
    id: 'u-1',
    email: 'operador@fibex.com',
    name: 'Operador',
    role: 'OPERADOR' as const,
  },
}

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email = 'operador@fibex.com',
  password = 'secret123',
) {
  await user.type(screen.getByLabelText('Correo electrónico'), email)
  await user.type(screen.getByLabelText('Contraseña'), password)
}

describe('LoginPage', () => {
  beforeEach(() => {
    loginMock.mockReset()
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
  })

  it('reproduce los elementos del diseño', () => {
    renderAtLogin(<LoginPage />)
    expect(screen.getByText('Acceso restringido')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Fibex Control' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Sistema maestro de gestión operativa y validación de reportes.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toHaveAttribute(
      'placeholder',
      'operador@fibex.com',
    )
    expect(screen.getByLabelText('Contraseña')).toHaveAttribute(
      'type',
      'password',
    )
    expect(
      screen.getByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Conexión encriptada · extremo a extremo'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Mesa de control v2.1 · Fibex Telecom'),
    ).toBeInTheDocument()
  })

  it('valida en cliente y no llama a la API si el correo es inválido', async () => {
    const user = userEvent.setup()
    renderAtLogin(<LoginPage />)
    await fillCredentials(user, 'no-es-correo')
    await user.click(screen.getByRole('button', { name: /Acceder al sistema/i }))

    expect(
      await screen.findByText('Introduce un correo válido'),
    ).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('valida la longitud mínima de la contraseña sin llamar a la API', async () => {
    const user = userEvent.setup()
    renderAtLogin(<LoginPage />)
    await fillCredentials(user, 'operador@fibex.com', 'corta')
    await user.click(screen.getByRole('button', { name: /Acceder al sistema/i }))

    expect(
      await screen.findByText(
        'La contraseña debe tener al menos 8 caracteres',
      ),
    ).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('login correcto guarda el token y navega a /dashboard', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue(okResponse)
    renderAtLogin(<LoginPage />)
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: /Acceder al sistema/i }))

    expect(
      await screen.findByRole('heading', { name: 'Panel de control' }),
    ).toBeInTheDocument()
    expect(loginMock).toHaveBeenCalledWith({
      email: 'operador@fibex.com',
      password: 'secret123',
    })
    expect(useAuthStore.getState().token).toBe('jwt-123')
    expect(useAuthStore.getState().user).toEqual(okResponse.user)
  })

  it('envía el formulario con Enter', async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue(okResponse)
    renderAtLogin(<LoginPage />)
    await fillCredentials(user)
    await user.keyboard('{Enter}')
    await waitFor(() => expect(loginMock).toHaveBeenCalledTimes(1))
  })

  it('credenciales inválidas muestran una alerta, limpian la contraseña y devuelven el foco', async () => {
    const user = userEvent.setup()
    loginMock.mockRejectedValue(
      new AuthError('credentials', 'Credenciales inválidas'),
    )
    renderAtLogin(<LoginPage />)
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: /Acceder al sistema/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Credenciales inválidas')
    await waitFor(() =>
      expect(screen.getByLabelText('Contraseña')).toHaveValue(''),
    )
    expect(screen.getByLabelText('Correo electrónico')).toHaveFocus()
  })

  it('un error de red muestra su mensaje propio', async () => {
    const user = userEvent.setup()
    loginMock.mockRejectedValue(
      new AuthError('network', 'No se pudo conectar con el servidor'),
    )
    renderAtLogin(<LoginPage />)
    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: /Acceder al sistema/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor',
    )
  })

  it('mientras carga deshabilita el botón y evita el doble submit', async () => {
    const user = userEvent.setup()
    let resolveLogin: (value: typeof okResponse) => void = () => {}
    loginMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
    )
    renderAtLogin(<LoginPage />)
    await fillCredentials(user)
    const submit = screen.getByRole('button', { name: /Acceder al sistema/i })
    await user.click(submit)

    await waitFor(() => expect(submit).toBeDisabled())
    expect(submit).toHaveTextContent('Accediendo…')
    await user.click(submit)
    expect(loginMock).toHaveBeenCalledTimes(1)

    resolveLogin(okResponse)
    expect(
      await screen.findByRole('heading', { name: 'Panel de control' }),
    ).toBeInTheDocument()
  })
})
