'use client'

import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import {
  CATEGORY_LABEL,
  balance,
  filterRecords,
  fmtHours,
  fmtPct,
  getProject,
  groupBy,
  monthsInRange,
  percent,
  sectorName,
  sumActual,
  sumPlanned,
  fmtMonth,
} from '@/lib/calc'
import type { HoursCategory, HoursRecord } from '@/lib/types'
import { AXIS, COLORS, ChartBox, GRID, LEGEND_STYLE, TOOLTIP_STYLE, hoursFormatter } from './charts'
import { StandardFilters, useRecordFilters } from './filters'
import { CsvButton, DataTable, FilterBar, FilterSelect, PageHeader, Panel, ProgressBar, exportCsv, type Column } from './kit'

const CATEGORIES: HoursCategory[] = ['fabricacao', 'setup', 'instalacao']
const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABEL[c] }))

interface HoursRow {
  key: string
  projectId: string
  projectName: string
  stage: string
  sector: string
  category: HoursCategory
  source: HoursRecord['source']
  planned: number
  actual: number | null
  balance: number | null
  progress: number | null
}

const COLUMNS: Column<HoursRow>[] = [
  { key: 'project', header: 'Projeto', sortValue: (r) => r.projectId, csv: (r) => `${r.projectId} - ${r.projectName}`, render: (r) => `${r.projectId} · ${r.projectName}` },
  { key: 'category', header: 'Categoria', sortValue: (r) => r.category, csv: (r) => CATEGORY_LABEL[r.category], render: (r) => CATEGORY_LABEL[r.category] },
  { key: 'stage', header: 'Etapa', sortValue: (r) => r.stage, render: (r) => r.stage },
  { key: 'sector', header: 'Setor', sortValue: (r) => sectorName(r.sector as never), csv: (r) => sectorName(r.sector as never), render: (r) => sectorName(r.sector as never) },
  { key: 'source', header: 'Origem', sortValue: (r) => r.source, render: (r) => (r.source === 'índice' ? 'Índice × m²' : 'Informada') },
  { key: 'planned', header: 'Previstas', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
  { key: 'actual', header: 'Realizadas', align: 'right', sortValue: (r) => r.actual, render: (r) => fmtHours(r.actual) },
  { key: 'balance', header: 'Saldo', align: 'right', sortValue: (r) => r.balance, render: (r) => <span className={r.balance !== null && r.balance < 0 ? 'text-destructive' : undefined}>{fmtHours(r.balance)}</span> },
  { key: 'progress', header: 'Realizado', sortValue: (r) => r.progress, csv: (r) => (r.progress === null ? null : Math.round(r.progress)), render: (r) => <ProgressBar value={r.progress} /> },
]

export function HoursView() {
  const { state, set, filter } = useRecordFilters()
  const [category, setCategory] = useState('')
  const months = monthsInRange(state.monthFrom, state.monthTo)
  const base = filterRecords(filter)
  const records = category ? base.filter((r) => r.category === category) : base

  const rows: HoursRow[] = [...groupBy(records, (r) => `${r.projectId}|${r.activityId}`).entries()].map(([key, rs]) => {
    const first = rs[0]
    const planned = sumPlanned(rs)
    const actual = sumActual(rs)
    return {
      key,
      projectId: first.projectId,
      projectName: getProject(first.projectId)!.name,
      stage: first.stage,
      sector: first.sector,
      category: first.category,
      source: first.source,
      planned,
      actual,
      balance: balance(planned, actual),
      progress: percent(actual, planned),
    }
  })

  const visibleCategories = category ? [category as HoursCategory] : CATEGORIES
  const kpis = visibleCategories.map((c) => {
    const rs = records.filter((r) => r.category === c)
    const planned = sumPlanned(rs)
    const actual = sumActual(rs)
    return { c, planned, actual, balance: balance(planned, actual), progress: percent(actual, planned) }
  })

  const series = months.map((m) => {
    const rs = records.filter((r) => r.month === m)
    const point: Record<string, number | string | null> = { label: fmtMonth(m) }
    for (const c of visibleCategories) {
      const cr = rs.filter((r) => r.category === c)
      point[`${c}_p`] = sumPlanned(cr)
      point[`${c}_a`] = sumActual(cr)
    }
    return point
  })

  const CAT_COLOR: Record<HoursCategory, [string, string]> = {
    fabricacao: [COLORS.brand, '#6B0079'],
    setup: [COLORS.gray, COLORS.dark],
    instalacao: [COLORS.brandLight, '#A100B8'],
  }

  return (
    <>
      <PageHeader
        title="Horas de fabricação e execução em campo"
        description="Fabricação, setup e instalação são controlados separadamente: previsto, realizado, saldo e percentual realizado."
        actions={<CsvButton onClick={() => exportCsv('horas-fabricacao-execucao.csv', COLUMNS, rows)} />}
      />
      <FilterBar>
        <StandardFilters state={state} set={set} />
        <FilterSelect label="Categoria" value={category} onChange={setCategory} options={CATEGORY_OPTIONS} allLabel="Todas" />
      </FilterBar>

      <div className="grid gap-3 md:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.c} className="rounded-md border bg-card p-4">
            <p className="text-sm font-semibold">{CATEGORY_LABEL[k.c]}</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Previstas</dt>
              <dd className="text-right font-medium tabular-nums">{fmtHours(k.planned)}</dd>
              <dt className="text-muted-foreground">Realizadas</dt>
              <dd className="text-right font-medium tabular-nums">{fmtHours(k.actual)}</dd>
              <dt className="text-muted-foreground">Saldo</dt>
              <dd className={`text-right font-medium tabular-nums ${k.balance !== null && k.balance < 0 ? 'text-destructive' : ''}`}>
                {fmtHours(k.balance)}
              </dd>
              <dt className="text-muted-foreground">% realizado</dt>
              <dd className="text-right font-medium tabular-nums">{fmtPct(k.progress)}</dd>
            </dl>
          </div>
        ))}
      </div>

      <Panel title="Previsto x realizado por mês e categoria" className="mt-4">
        <ChartBox height={280}>
          <BarChart data={series}>
            <CartesianGrid {...GRID} vertical={false} />
            <XAxis dataKey="label" tick={AXIS} />
            <YAxis tick={AXIS} width={52} />
            <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
            <Legend wrapperStyle={LEGEND_STYLE} />
            {visibleCategories.map((c) => [
              <Bar key={`${c}_p`} dataKey={`${c}_p`} name={`${CATEGORY_LABEL[c]} prevista`} fill={CAT_COLOR[c][0]} />,
              <Bar key={`${c}_a`} dataKey={`${c}_a`} name={`${CATEGORY_LABEL[c]} realizada`} fill={CAT_COLOR[c][1]} />,
            ])}
          </BarChart>
        </ChartBox>
      </Panel>

      <Panel title="Horas por projeto e etapa" className="mt-4">
        <DataTable columns={COLUMNS} rows={rows} rowKey={(r) => r.key} initialSort={{ key: 'project', dir: 'asc' }} maxHeight={520} />
        <p className="mt-2 text-xs text-muted-foreground">
          Origem “Índice × m²”: horas = metragem do projeto × índice h/m² da atividade. Origem “Informada”: horas definidas diretamente, sem
          metragem.
        </p>
      </Panel>
    </>
  )
}
