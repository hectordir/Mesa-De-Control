import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { fetchMonitorDiario } from './lib/api/dashboard'
import type { MonitorDiarioResumen } from './lib/api/types'
import { useAuthStore } from './stores/auth.store'

vi.mock('./lib/api/dashboard', () => ({
  fetchMonitorDiario: vi.fn(),
}))

/** Lo mínimo del contrato para que el dashboard pinte su estado con datos. */
const resumen: MonitorDiarioResumen = {
  fecha: '2026-07-22',
  kpis: {
    clientesAtendidos: 78,
    efectividadMesa: 81,
    enviadoSoporte2: 11,
    escaladoNoc: 7,
    pendienteCliente: 0,
  },
  operadores: [
    { id: 'op-1', nombre: 'Jhon Rivas', clientes: 78, mesa: 63, soporte2: 11, noc: 7 },
  ],
  distribucion: [
    { resultado: 'SOLUCIONADO_MESA', total: 63 },
    { resultado: 'ENVIADO_SOPORTE2', total: 11 },
    { resultado: 'ESCALADO_NOC', total: 7 },
    { resultado: 'PENDIENTE_CLIENTE', total: 0 },
    { resultado: 'REAGENDADO', total: 0 },
  ],
  topAverias: [{ motivo: 'Corte de fibra (FTTH)', total: 40 }],
  actividad: [
    {
      id: 'act-1',
      operador: 'Jhon Rivas',
      resultado: 'SOLUCIONADO_MESA',
      ubicacion: 'Cond. Los Robles',
      hora: '2026-07-22T10:42:00.000Z',
    },
  ],
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(fetchMonitorDiario).mockResolvedValue(resumen)
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.clear()
    useAuthStore.setState({ token: null, user: null })
    window.history.pushState({}, '', '/')
  })

  it('sin sesión monta la pantalla de acceso', async () => {
    render(<App />)
    expect(
      await screen.findByRole('button', { name: /Acceder al sistema/i }),
    ).toBeInTheDocument()
  })

  it('con sesión monta el dashboard', async () => {
    useAuthStore.setState({
      token: 'jwt-123',
      user: {
        id: 'u-1',
        email: 'operador@fibex.com',
        name: 'Operador',
        role: 'OPERADOR',
      },
    })
    render(<App />)
    expect(
      await screen.findByRole('heading', { name: 'Monitor Diario', level: 1 }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('table', { name: /resumen por operador/i }),
    ).toBeInTheDocument()
  })
})
