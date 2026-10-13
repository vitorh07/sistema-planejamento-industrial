'use client'

import { useState } from 'react'
import { PRODUCTS, PROJECTS, SECTORS } from '@/lib/data'
import { MONTHS, fmtMonth, type RecordFilter } from '@/lib/calc'
import type { ProductId, SectorId } from '@/lib/types'
import { FilterSelect } from './kit'

export const PROJECT_OPTIONS = PROJECTS.map((p) => ({ value: p.id, label: `${p.id} · ${p.name}` }))
export const PRODUCT_OPTIONS = PRODUCTS.map((p) => ({ value: p.id, label: p.name }))
export const SECTOR_OPTIONS = SECTORS.map((s) => ({ value: s.id, label: s.name }))
export const MONTH_OPTIONS = MONTHS.map((m) => ({ value: m, label: fmtMonth(m) }))

export interface FilterState {
  monthFrom: string
  monthTo: string
  projectId: string
  product: string
  sector: string
}

export function useRecordFilters(initial?: Partial<FilterState>) {
  const [state, setState] = useState<FilterState>({
    monthFrom: MONTHS[0],
    monthTo: MONTHS[MONTHS.length - 1],
    projectId: '',
    product: '',
    sector: '',
    ...initial,
  })
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    setState((s) => {
      const next = { ...s, [key]: value }
      if (key === 'monthFrom' && next.monthTo < value) next.monthTo = value
      if (key === 'monthTo' && next.monthFrom > value) next.monthFrom = value
      return next
    })
  const filter: RecordFilter = {
    monthFrom: state.monthFrom,
    monthTo: state.monthTo,
    projectId: state.projectId || undefined,
    product: (state.product || undefined) as ProductId | undefined,
    sector: (state.sector || undefined) as SectorId | undefined,
  }
  return { state, set, filter }
}

export function PeriodFilters({
  state,
  set,
}: {
  state: FilterState
  set: ReturnType<typeof useRecordFilters>['set']
}) {
  return (
    <>
      <FilterSelect
        label="De"
        value={state.monthFrom}
        onChange={(v) => set('monthFrom', v)}
        options={MONTH_OPTIONS}
        allLabel={null}
      />
      <FilterSelect
        label="Até"
        value={state.monthTo}
        onChange={(v) => set('monthTo', v)}
        options={MONTH_OPTIONS}
        allLabel={null}
      />
    </>
  )
}

export function StandardFilters({
  state,
  set,
  show = ['period', 'project', 'product', 'sector'],
}: {
  state: FilterState
  set: ReturnType<typeof useRecordFilters>['set']
  show?: ('period' | 'project' | 'product' | 'sector')[]
}) {
  return (
    <>
      {show.includes('period') && <PeriodFilters state={state} set={set} />}
      {show.includes('project') && (
        <FilterSelect label="Projeto" value={state.projectId} onChange={(v) => set('projectId', v)} options={PROJECT_OPTIONS} />
      )}
      {show.includes('product') && (
        <FilterSelect label="Produto" value={state.product} onChange={(v) => set('product', v)} options={PRODUCT_OPTIONS} />
      )}
      {show.includes('sector') && (
        <FilterSelect label="Setor" value={state.sector} onChange={(v) => set('sector', v)} options={SECTOR_OPTIONS} />
      )}
    </>
  )
}
