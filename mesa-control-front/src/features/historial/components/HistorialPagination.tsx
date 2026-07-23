import { Button } from '../../../components/ui'
import { rangoPagina } from '../lib/historial.presentation'

interface HistorialPaginationProps {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

/** Paginación server-side: rango visible + anterior/siguiente. */
export function HistorialPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: HistorialPaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const { desde, hasta } = rangoPagina(page, pageSize, total)

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-between gap-3 text-caption text-text-secondary"
    >
      <span className="tabular-nums">
        {desde}–{hasta} de {total}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <span className="tabular-nums text-text-muted">
          {page} / {totalPaginas}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPaginas}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
