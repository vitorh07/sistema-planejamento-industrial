'use client'

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import { CAPACITY_THRESHOLDS, PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH, SECTORS } from '@/lib/data'
import {
  balance,
  filterRecords,
  fmtHours,
  fmtMonth,
  fmtPct,
  getProject,
  groupBy,
  monthsInRange,
  percent,
  productName,
  sectorCapacity,
  sectorName,
  sumActual,
  sumPlanned,
} from '@/lib/calc'
import type { ProductId, SectorId } from '@/lib/types'
import { AXIS, COLORS, ChartBox, GRID, LEGEND_STYLE, SERIES, TOOLTIP_STYLE, hoursFormatter, pctFormatter } from './charts'
import { StandardFilters, useRecordFilters } from './filters'
import { CsvButton, DataTable, FilterBar, PageHeader, Panel, exportCsv, type Column } from './kit'

interface OccupancyRow {
  key: string
  projectId: string
  projectName: string
  product: ProductId
  sector: SectorId
  month: string
  planned: number
  actual: number | null
  balance: number | null
  share: number | null
}

const COLUMNS: Column<OccupancyRow>[] = [
  { key: 'month', header: 'Mês', sortValue: (r) => r.month, csv: (r) => fmtMonth(r.month), render: (r) => fmtMonth(r.month) },
  { key: 'project', header: 'Projeto', sortValue: (r) => r.projectId, csv: (r) => `${r.projectId} - ${r.projectName}`, render: (r) => `${r.projectId} · ${r.projectName}` },
  { key: 'product', header: 'Produto', sortValue: (r) => productName(r.product), render: (r) => productName(r.product) },
  { key: 'sector', header: 'Setor', sortValue: (r) => sectorName(r.sector), render: (r) => sectorName(r.sector) },
  { key: 'planned', header: 'Horas previstas', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
  { key: 'actual', header: 'Horas realizadas', align: 'right', sortValue: (r) => r.actual, render: (r) => fmtHours(r.actual) },
  { key: 'balance', header: 'Saldo', align: 'right', sortValue: (r) => r.balance, render: (r) => <span className={r.balance !== null && r.balance < 0 ? 'text-destructive' : undefined}>{fmtHours(r.balance)}</span> },
  { key: 'share', header: '% da capacidade do setor', align: 'right', sortValue: (r) => r.share, render: (r) => fmtPct(r.share) },
]

export function OccupancyView() {
  const { state, set, filter } = useRecordFilters()
  const months = monthsInRange(state.monthFrom, state.monthTo)
  const records = filterRecords(filter)

  const rows: OccupancyRow[] = [...groupBy(records, (r) => `${r.month}|${r.projectId}|${r.sector}`).entries()].map(([key, rs]) => {
    const [month, projectId, sector] = key.split('|')
    const planned = sumPlanned(rs)
    const actual = sumActual(rs)
    const capacity = (SECTORS.find((s) => s.id === sector)?.fixedEmployees ?? 0) * PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH
    const project = getProject(projectId)!
    return {
      key,
      projectId,
      projectName: project.name,
      product: project.product,
      sector: sector as SectorId,
      month,
      planned,
      actual,
      balance: balance(planned, actual),
      share: percent(planned, capacity),
    }
  })

  const projectIds = [...new Set(records.map((r) => r.projectId))].sort()
  const byProjectMonth = months.map((m) => {
    const point: Record<string, number | string> = { label: fmtMonth(m) }
    for (const pid of projectIds) {
      point[pid] = sumPlanned(records.filter((r) => r.month === m && r.projectId === pid))
    }
    return point
  })

  const sectors = SECTORS.filter((s) => !filter.sector || s.id === filter.sector)
  const occupancyTrend = months.map((m) => {
    const capRows = sectorCapacity([m], records)
    const point: Record<string, number | string | null> = { label: fmtMonth(m) }
    for (const s of sectors) point[s.name] = capRows.find((r) => r.sector === s.id)?.occupancy ?? null
    return point
  })

  const totalPlanned = sumPlanned(records)
  const totalActual = sumActual(records)

  return (
    <>
      <PageHeader
        title="Ocupação mensal"
        description="Distribuição mês a mês das horas de cada projeto pelos setores produtivos."
        actions={<CsvButton onClick={() => exportCsv('ocupacao-mensal.csv', COLUMNS, rows)} />}
      />
      <FilterBar>
        <StandardFilters state={state} set={set} />
      </FilterBar>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Horas previstas por projeto e mês" description="Barras empilhadas por projeto.">
          <ChartBox height={280}>
            <BarChart data={byProjectMonth}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} width={52} />
              <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              {projectIds.map((pid, i) => (
                <Bar key={pid} dataKey={pid} name={pid} stackId="p" fill={SERIES[i % SERIES.length]} />
              ))}
            </BarChart>
          </ChartBox>
        </Panel>
        <Panel title="Ocupação por setor ao longo dos meses" description="Linha vermelha tracejada = limite de 100%.">
          <ChartBox height={280}>
            <LineChart data={occupancyTrend}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} width={44} unit="%" />
              <Tooltip formatter={pctFormatter} {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <ReferenceLine y={CAPACITY_THRESHOLDS.overload} stroke={COLORS.red} strokeDasharray="4 4" />
              {sectors.map((s, i) => (
                <Line key={s.id} type="monotone" dataKey={s.name} stroke={SERIES[i % SERIES.length]} strokeWidth={2} dot={{ r: 2 }} />
              ))}
            </LineChart>
          </ChartBox>
        </Panel>
      </div>

      <Panel title="Detalhamento por projeto, setor e mês" className="mt-4">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(r) => r.key}
          initialSort={{ key: 'month', dir: 'asc' }}
          maxHeight={520}
          footer={
            <tr>
              <td className="px-3 py-2" colSpan={4}>
                Total ({rows.length} linhas)
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalPlanned)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalActual)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(balance(totalPlanned, totalActual))}</td>
              <td className="px-3 py-2" />
            </tr>
          }
        />
        <p className="mt-2 text-xs text-muted-foreground">
          % da capacidade = horas previstas do projeto no setor ÷ (funcionários fixos do setor × {PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH} h) no mês.
        </p>
      </Panel>
    </>
  )
}
