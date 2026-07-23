import { useEffect, useMemo, useState } from 'react'
import { AppTopBar } from '../dashboard/components/AppTopBar'
import type {
  GestionRow,
  HistorialParams,
  HistorialSortKey,
  ResultadoGestion,
  SortDir,
} from '../../lib/api/types'
import { useHistorial } from './hooks/useHistorial'
import { gestionesToCsv } from './lib/historial.presentation'
import { GestionDrawer } from './components/GestionDrawer'
import { HistorialCards } from './components/HistorialCards'
import { HistorialEmpty } from './components/HistorialEmpty'
import { HistorialPagination } from './components/HistorialPagination'
import { HistorialSkeleton } from './components/HistorialSkeleton'
import { HistorialTable } from './components/HistorialTable'
import { HistorialToolbar } from './components/HistorialToolbar'
import { ResultadoFilters } from './components/ResultadoFilters'

const PAGE_SIZE = 10

/** Deriva un valor con retardo (búsqueda debounced, ~300 ms). */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

/** Rango [primer día, último día] del mes en curso, en 'YYYY-MM-DD'. */
function mesEnCurso(): { desde: string; hasta: string } {
  const hoy = new Date()
  const y = hoy.getFullYear()
  const m = hoy.getMonth()
  const mm = String(m + 1).padStart(2, '0')
  const ultimo = new Date(y, m + 1, 0).getDate()
  return {
    desde: `${y}-${mm}-01`,
    hasta: `${y}-${mm}-${String(ultimo).padStart(2, '0')}`,
  }
}

/** Descarga en cliente un CSV con las filas visibles (sin librerías). */
function descargarCsv(nombre: string, contenido: string): void {
  if (typeof URL.createObjectURL !== 'function') return
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Historial General: la sábana completa de gestiones con filtros y detalle. */
export default function HistorialPage() {
  const [search, setSearch] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [resultado, setResultado] = useState<ResultadoGestion | null>(null)
  const [sortKey, setSortKey] = useState<HistorialSortKey>('fecha')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [seleccion, setSeleccion] = useState<GestionRow | null>(null)

  const searchDebounced = useDebounced(search)

  const params: HistorialParams = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: searchDebounced || undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      resultado: resultado ?? undefined,
      sortKey,
      sortDir,
    }),
    [page, searchDebounced, desde, hasta, resultado, sortKey, sortDir],
  )

  const { data, isPending } = useHistorial(params)

  const items = data?.items ?? []
  const counts = data?.counts ?? { total: 0, porResultado: {} }

  // Todo cambio de filtro/orden vuelve a la página 1 (la paginación no lo hace).
  const onSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }
  const onDesdeChange = (value: string) => {
    setDesde(value)
    setPage(1)
  }
  const onHastaChange = (value: string) => {
    setHasta(value)
    setPage(1)
  }
  const onResultadoChange = (value: ResultadoGestion | null) => {
    setResultado(value)
    setPage(1)
  }
  const onSort = (key: HistorialSortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const onExport = () => {
    descargarCsv('historial-gestiones.csv', gestionesToCsv(items))
  }

  const limpiar = () => {
    setSearch('')
    setDesde('')
    setHasta('')
    setResultado(null)
    setPage(1)
  }

  const verMes = () => {
    const { desde: d, hasta: h } = mesEnCurso()
    setDesde(d)
    setHasta(h)
    setSearch('')
    setResultado(null)
    setPage(1)
  }

  return (
    <div className="tabular flex min-h-screen flex-col gap-5 bg-bg p-6 font-sans text-text-primary">
      <AppTopBar />

      <HistorialToolbar
        search={search}
        onSearchChange={onSearchChange}
        desde={desde}
        hasta={hasta}
        onDesdeChange={onDesdeChange}
        onHastaChange={onHastaChange}
        onExport={onExport}
      />

      <ResultadoFilters
        counts={counts}
        activo={resultado}
        onChange={onResultadoChange}
      />

      {isPending ? (
        <HistorialSkeleton />
      ) : items.length === 0 ? (
        <HistorialEmpty onLimpiar={limpiar} onVerMes={verMes} />
      ) : (
        <>
          <div className="hidden lg:block">
            <HistorialTable
              rows={items}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              onOpenRow={setSeleccion}
            />
          </div>
          <div className="lg:hidden">
            <HistorialCards rows={items} onOpenRow={setSeleccion} />
          </div>
          <HistorialPagination
            page={data?.page ?? page}
            pageSize={data?.pageSize ?? PAGE_SIZE}
            total={data?.total ?? 0}
            onPageChange={setPage}
          />
        </>
      )}

      <GestionDrawer gestion={seleccion} onClose={() => setSeleccion(null)} />
    </div>
  )
}
