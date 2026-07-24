import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOperadores } from '../../../lib/api/operadores'
import { ADMIN_HEX } from '../lib/admin.presentation'

interface CatItem {
  name: string
  active: boolean
}

type CatStatus = 'loading' | 'error' | 'ready'

const sortByName = (a: CatItem, b: CatItem) => a.name.localeCompare(b.name, 'es')

const MOTIVOS_INICIALES: CatItem[] = [
  { name: 'Caídas Seguidas Internet', active: true },
  { name: 'Falla LOS', active: true },
  { name: 'Fibex Play', active: true },
  { name: 'Garantía', active: true },
  { name: 'Internet Lento', active: true },
  { name: 'Sin Internet', active: true },
  { name: 'Usuario Clave ONT', active: true },
]

const SOLUCIONES_INICIALES: CatItem[] = [
  { name: 'Asesoramiento', active: true },
  { name: 'Atendiendo', active: true },
  { name: 'Contactado - En espera de respuesta', active: true },
  { name: 'Escalado NOC', active: true },
  { name: 'Solucionado', active: true },
]

/** Cabecera + contador de un catálogo. */
function CatShell({
  title,
  icon,
  hex,
  count,
  children,
}: {
  title: string
  icon: string
  hex: string
  count: number
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-elevation">
      <div className="flex items-center gap-[10px] border-b border-border-subtle px-[18px] py-[15px]">
        <span
          aria-hidden="true"
          className="flex h-[22px] w-[22px] items-center justify-center rounded-chip text-[12px]"
          style={{ background: `color-mix(in srgb, ${hex} 15%, var(--color-surface))`, color: hex }}
        >
          {icon}
        </span>
        <div className="text-[13px] font-bold uppercase tracking-[.03em] text-text-secondary">
          {title}
        </div>
        <span className="ml-auto inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill border border-border-subtle bg-bg px-[7px] text-caption font-bold text-text-secondary">
          {count}
        </span>
      </div>
      {children}
    </div>
  )
}

/**
 * Cuerpo editable de un catálogo (input "Añadir nuevo…" + botón +, y lista con
 * toggle activar/desactivar y eliminar por item). Presentacional: el estado y la
 * estrategia de inserción viven en el contenedor, para que Operadores pueda
 * mantener el orden alfabético y Motivos/Soluciones prepender.
 */
function CatalogoBody({
  title,
  items,
  status = 'ready',
  errorLabel,
  onAdd,
  onToggle,
  onRemove,
}: {
  title: string
  items: CatItem[]
  status?: CatStatus
  errorLabel?: string
  onAdd: (name: string) => void
  onToggle: (idx: number) => void
  onRemove: (idx: number) => void
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const v = draft.trim()
    if (!v) return
    onAdd(v)
    setDraft('')
  }

  return (
    <>
      <div className="flex gap-2 border-b border-border-subtle px-[18px] py-[14px]">
        <input
          aria-label={`Añadir a ${title}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Añadir nuevo…"
          className="min-w-0 flex-1 rounded-[9px] border border-border bg-bg px-3 py-[9px] text-body text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand-ring"
        />
        <button
          type="button"
          onClick={add}
          aria-label={`Agregar a ${title}`}
          className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-[9px] bg-brand text-[18px] font-semibold text-brand-fg hover:opacity-90"
        >
          +
        </button>
      </div>
      <div className="flex max-h-[266px] flex-1 flex-col overflow-y-auto">
        {status === 'loading' ? (
          <div className="px-[18px] py-9 text-center text-body text-text-muted">
            Cargando…
          </div>
        ) : status === 'error' ? (
          <div className="px-[18px] py-9 text-center text-body text-danger">
            {errorLabel ?? 'No se pudo cargar'}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-[18px] py-9 text-body text-text-muted">
            No hay registros
          </div>
        ) : (
          <ul className="flex flex-col gap-2 px-[18px] py-3">
            {items.map((it, idx) => (
              <li
                key={`${it.name}-${idx}`}
                className="flex items-center gap-[11px] rounded-[10px] border border-border-subtle bg-bg px-3 py-[10px]"
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ background: it.active ? ADMIN_HEX.success : ADMIN_HEX.neutral }}
                />
                <span
                  className="min-w-0 flex-1 truncate text-body font-semibold"
                  style={{ color: it.active ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  {it.name}
                </span>
                <button
                  type="button"
                  title="Activar / desactivar"
                  aria-label={`Alternar ${it.name}`}
                  onClick={() => onToggle(idx)}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-pill border text-[13px]"
                  style={{
                    color: it.active ? ADMIN_HEX.success : 'var(--color-text-muted)',
                    background: it.active
                      ? `color-mix(in srgb, ${ADMIN_HEX.success} 16%, transparent)`
                      : 'transparent',
                    borderColor: it.active
                      ? `color-mix(in srgb, ${ADMIN_HEX.success} 40%, transparent)`
                      : 'var(--color-border-subtle)',
                  }}
                >
                  ✓
                </button>
                <button
                  type="button"
                  title="Eliminar"
                  aria-label={`Eliminar ${it.name}`}
                  onClick={() => onRemove(idx)}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-[15px] text-text-muted hover:text-danger"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/** Catálogo editable en local (prepende lo nuevo): Motivos y Soluciones. */
function CatalogoLocal({
  title,
  hex,
  iniciales,
}: {
  title: string
  hex: string
  iniciales: CatItem[]
}) {
  const [items, setItems] = useState<CatItem[]>(iniciales)

  return (
    <CatShell title={title} icon="☰" hex={hex} count={items.length}>
      <CatalogoBody
        title={title}
        items={items}
        onAdd={(name) => setItems((s) => [{ name, active: true }, ...s])}
        onToggle={(idx) =>
          setItems((s) => s.map((x, i) => (i === idx ? { ...x, active: !x.active } : x)))
        }
        onRemove={(idx) => setItems((s) => s.filter((_, i) => i !== idx))}
      />
    </CatShell>
  )
}

/**
 * Operadores: se siembra desde `GET /operadores` y luego se edita en local
 * (add/toggle/remove) SIN persistir (no hay POST /operadores). Se ordena
 * alfabéticamente y se inicializa una sola vez, al llegar la data.
 */
function CatalogoOperadores() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['operadores'],
    queryFn: getOperadores,
  })
  const [items, setItems] = useState<CatItem[]>([])
  const seeded = useRef(false)

  useEffect(() => {
    if (data && !seeded.current) {
      setItems(data.map((o) => ({ name: o.nombre, active: true })).sort(sortByName))
      seeded.current = true
    }
  }, [data])

  const status: CatStatus = isPending ? 'loading' : isError ? 'error' : 'ready'

  return (
    <CatShell title="Operadores" icon="☰" hex={ADMIN_HEX.brand} count={items.length}>
      <CatalogoBody
        title="Operadores"
        items={items}
        status={status}
        errorLabel="No se pudieron cargar los operadores"
        onAdd={(name) => setItems((s) => [...s, { name, active: true }].sort(sortByName))}
        onToggle={(idx) =>
          setItems((s) => s.map((x, i) => (i === idx ? { ...x, active: !x.active } : x)))
        }
        onRemove={(idx) => setItems((s) => s.filter((_, i) => i !== idx))}
      />
    </CatShell>
  )
}

/** Trío de catálogos: Operadores (seeded del back) + Motivos / Soluciones. */
export function Catalogos() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      <CatalogoOperadores />
      <CatalogoLocal title="Motivos SAE" hex={ADMIN_HEX.warning} iniciales={MOTIVOS_INICIALES} />
      <CatalogoLocal title="Soluciones" hex={ADMIN_HEX.success} iniciales={SOLUCIONES_INICIALES} />
    </div>
  )
}
