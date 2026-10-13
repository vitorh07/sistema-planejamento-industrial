'use client'

import { ArrowDown, ArrowUp, ArrowUpDown, Download } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CapacityStatus, PhaseStatus, ProjectStatus } from '@/lib/types'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-balance">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground text-pretty">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('rounded-md border bg-card', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2 border-b px-4 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Kpi({
  label,
  value,
  hint,
  tone = 'default',
}: {
  label: string
  value: string
  hint?: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          tone === 'success' && 'text-success',
          tone === 'warning' && 'text-warning',
          tone === 'danger' && 'text-destructive',
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

type Tone = 'green' | 'yellow' | 'red' | 'gray' | 'brand'

const TONE_CLASS: Record<Tone, string> = {
  green: 'bg-green-50 text-green-700 border-green-200',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  gray: 'bg-secondary text-muted-foreground border-border',
  brand: 'bg-accent text-accent-foreground border-fuchsia-200',
}

const STATUS_TONE: Record<ProjectStatus | PhaseStatus | CapacityStatus | string, Tone> = {
  Concluído: 'green',
  Concluída: 'green',
  Disponível: 'green',
  'Em andamento': 'brand',
  Planejado: 'gray',
  Planejada: 'gray',
  Atenção: 'yellow',
  Atrasado: 'red',
  Atrasada: 'red',
  Sobrecarga: 'red',
  Alta: 'red',
  Média: 'yellow',
  Baixa: 'gray',
}

export function Badge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  const t = tone ?? STATUS_TONE[String(children)] ?? 'gray'
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-xs font-medium',
        TONE_CLASS[t],
      )}
    >
      {children}
    </span>
  )
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  allLabel = 'Todos',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  allLabel?: string | null
}) {
  const id = useId()
  return (
    <div className="flex min-w-36 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      >
        {allLabel !== null && <option value="">{allLabel}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end gap-3 rounded-md border bg-secondary/50 p-3">{children}</div>
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="flex min-w-52 flex-1 flex-col gap-1 md:max-w-xs">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        Buscar
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-ring"
      />
    </div>
  )
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div role="group" aria-label={label} className="flex h-9 rounded-md border bg-background p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded px-3 text-sm text-muted-foreground',
              value === o.value && 'bg-primary text-primary-foreground',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ Tabela ordenável ---------------------------- */

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'right' | 'center'
  sortValue?: (row: T) => string | number | null
  render: (row: T) => React.ReactNode
  csv?: (row: T) => string | number | null
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  footer,
  initialSort,
  emptyText = 'Nenhum registro encontrado para os filtros selecionados.',
  maxHeight,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  footer?: React.ReactNode
  initialSort?: { key: string; dir: 'asc' | 'desc' }
  emptyText?: string
  maxHeight?: number
}) {
  const [sort, setSort] = useState(initialSort ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const get = col.sortValue
    return [...rows].sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      if (va === vb) return 0
      if (va === null) return 1
      if (vb === null) return -1
      const res = va < vb ? -1 : 1
      return sort.dir === 'asc' ? res : -res
    })
  }, [rows, sort, columns])

  const toggle = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  return (
    <div className="overflow-auto rounded-md border" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-secondary text-xs text-muted-foreground">
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key
              const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
              return (
                <th
                  key={c.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'whitespace-nowrap px-3 py-2 font-medium',
                    c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : 'text-left',
                  )}
                >
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggle(c.key)}
                      className={cn('inline-flex items-center gap-1 hover:text-foreground', active && 'text-foreground')}
                    >
                      {c.header}
                      <Icon className="size-3" aria-hidden />
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground">
                {emptyText}
              </td>
            </tr>
          )}
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('border-t', onRowClick && 'cursor-pointer hover:bg-accent/50')}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'whitespace-nowrap px-3 py-2',
                    c.align === 'right' && 'text-right tabular-nums',
                    c.align === 'center' && 'text-center',
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot className="sticky bottom-0 border-t-2 bg-secondary font-medium">{footer}</tfoot>}
      </table>
    </div>
  )
}

export function exportCsv<T>(filename: string, columns: Column<T>[], rows: T[]) {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = columns.map((c) => escape(c.header)).join(';')
  const body = rows.map((r) =>
    columns
      .map((c) => {
        const v = c.csv ? c.csv(r) : c.sortValue ? c.sortValue(r) : ''
        return escape(typeof v === 'number' ? String(v).replace('.', ',') : v)
      })
      .join(';'),
  )
  const blob = new Blob(['\uFEFF' + [header, ...body].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function CsvButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-3 text-xs font-medium hover:bg-secondary"
    >
      <Download className="size-3.5" aria-hidden />
      Exportar CSV
    </button>
  )
}

export function ProgressBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded bg-secondary">
        <div className="h-full bg-primary" style={{ width: `${v}%` }} />
      </div>
      <span className="w-12 text-right tabular-nums">{value.toFixed(0)}%</span>
    </div>
  )
}
