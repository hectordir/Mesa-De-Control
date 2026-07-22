import { useState } from 'react'
import { Badge, Button, Card, Input, StatCard } from '../components/ui'
import type { BadgeTone } from '../components/ui'

type Theme = 'dark' | 'light'

interface Kpi {
  label: string
  value: string
  hint: string
}

interface Gestion {
  id: string
  cliente: string
  zona: string
  estado: string
  tono: BadgeTone
  asignado: string
}

interface Categoria {
  nombre: string
  porcentaje: number
  barra: string
}

const FECHA = 'Martes 21 de julio, 2026 · turno 08:00 – 16:00'

const KPIS: readonly Kpi[] = [
  { label: 'Tickets activos', value: '128', hint: '+12 vs ayer' },
  { label: 'En espera', value: '34', hint: 'espera media 18 min' },
  { label: 'Resueltos hoy', value: '96', hint: 'objetivo diario 110' },
  { label: 'SLA en riesgo', value: '7', hint: '3 vencen en 1 h' },
]

const GESTIONES: readonly Gestion[] = [
  {
    id: 'G-10241',
    cliente: 'Corporativo Andes',
    zona: 'Norte',
    estado: 'Resuelto',
    tono: 'success',
    asignado: 'M. Herrera',
  },
  {
    id: 'G-10242',
    cliente: 'Clínica San Rafael',
    zona: 'Centro',
    estado: 'Pendiente',
    tono: 'warning',
    asignado: 'L. Cabrera',
  },
  {
    id: 'G-10243',
    cliente: 'Hotel Miramar',
    zona: 'Costa',
    estado: 'Crítico',
    tono: 'danger',
    asignado: 'J. Peralta',
  },
  {
    id: 'G-10244',
    cliente: 'Distribuidora Vega',
    zona: 'Sur',
    estado: 'En proceso',
    tono: 'info',
    asignado: 'A. Molina',
  },
  {
    id: 'G-10245',
    cliente: 'Colegio Bolívar',
    zona: 'Este',
    estado: 'Cerrado',
    tono: 'neutral',
    asignado: 'R. Duarte',
  },
  {
    id: 'G-10246',
    cliente: 'Banco Litoral',
    zona: 'Centro',
    estado: 'Escalado',
    tono: 'danger',
    asignado: 'S. Quiroga',
  },
]

const COLUMNAS = ['ID', 'Cliente', 'Zona', 'Estado', 'Asignado'] as const

const CATEGORIAS: readonly Categoria[] = [
  { nombre: 'Fibra cortada', porcentaje: 38, barra: 'bg-cat-1' },
  { nombre: 'Sin señal', porcentaje: 24, barra: 'bg-cat-2' },
  { nombre: 'Lentitud', porcentaje: 18, barra: 'bg-cat-3' },
  { nombre: 'Facturación', porcentaje: 12, barra: 'bg-cat-4' },
  { nombre: 'Instalación', porcentaje: 8, barra: 'bg-cat-5' },
]

function currentTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'light'
    ? 'light'
    : 'dark'
}

export function DashboardPage() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    setTheme(next)
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-h1 text-text-primary">Mesa de Control</h1>
            <p className="text-caption text-text-muted">{FECHA}</p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            Tema: {theme === 'dark' ? 'oscuro' : 'claro'}
          </Button>
        </header>

        <section
          aria-label="Indicadores del turno"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {KPIS.map((kpi) => (
            <StatCard
              key={kpi.label}
              label={kpi.label}
              value={kpi.value}
              hint={kpi.hint}
            />
          ))}
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <Card.Header>Gestiones recientes</Card.Header>
            <Card.Body className="px-0 py-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-body">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      {COLUMNAS.map((col) => (
                        <th
                          key={col}
                          scope="col"
                          className="px-4 py-3 text-left text-label uppercase text-text-muted"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {GESTIONES.map((g) => (
                      <tr key={g.id} className="border-b border-border-subtle">
                        <td className="px-4 py-3 text-text-primary">{g.id}</td>
                        <td className="px-4 py-3 text-text-secondary">{g.cliente}</td>
                        <td className="px-4 py-3 text-text-secondary">{g.zona}</td>
                        <td className="px-4 py-3">
                          <Badge tone={g.tono}>{g.estado}</Badge>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">{g.asignado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>

          <Card role="region" aria-labelledby="categorias-titulo">
            <Card.Header id="categorias-titulo">
              Distribución por categoría
            </Card.Header>
            <Card.Body>
              <ul className="flex flex-col gap-4">
                {CATEGORIAS.map((c) => (
                  <li key={c.nombre} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-body text-text-secondary">{c.nombre}</span>
                      <span className="text-caption text-text-muted">
                        {c.porcentaje}%
                      </span>
                    </div>
                    <div
                      role="meter"
                      aria-label={c.nombre}
                      aria-valuenow={c.porcentaje}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      className="h-2 w-full overflow-hidden rounded-chip bg-surface-elevated"
                    >
                      <div
                        className={`h-full rounded-chip ${c.barra}`}
                        style={{ width: `${c.porcentaje}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </div>

        <Card>
          <Card.Body>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-xs">
                <Input label="Buscar gestión" placeholder="G-10241" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button>Nueva gestión</Button>
                <Button variant="secondary">Exportar</Button>
                <Button variant="ghost">Filtros</Button>
                <Button variant="danger">Cerrar turno</Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  )
}

export default DashboardPage
