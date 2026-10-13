'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { ACTIVITIES, CAPACITY_THRESHOLDS, PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH, SECTORS } from '@/lib/data'
import {
  CURRENT_MONTH,
  MONTHS,
  RECORDS,
  capacityStatus,
  fmtHours,
  fmtMonth,
  fmtNumber,
  fmtPct,
  getProject,
  monthsInRange,
  percent,
  productName,
  sectorCapacity,
  sectorName,
  sumPlanned,
  type CapacityRow,
} from '@/lib/calc'
import type { Activity, SectorId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AXIS, COLORS, ChartBox, GRID, LEGEND_STYLE, TOOLTIP_STYLE, hoursFormatter } from './charts'
import { PRODUCT_OPTIONS, PeriodFilters, useRecordFilters } from './filters'
import { Badge, CsvButton, DataTable, FilterBar, FilterSelect, PageHeader, Panel, exportCsv, type Column } from './kit'

const CAPACITY_COLUMNS: Column<CapacityRow>[] = [
  { key: 'name', header: 'Setor', sortValue: (r) => r.name, render: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'employees', header: 'Funcionários fixos', align: 'right', sortValue: (r) => r.fixedEmployees, render: (r) => fmtNumber(r.fixedEmployees) },
  { key: 'available', header: 'Horas disponíveis', align: 'right', sortValue: (r) => r.available, render: (r) => fmtHours(r.available) },
  { key: 'demand', header: 'Horas necessárias', align: 'right', sortValue: (r) => r.demand, render: (r) => fmtHours(r.demand) },
  {
    key: 'balance',
    header: 'Saldo de capacidade',
    align: 'right',
    sortValue: (r) => r.balance,
    render: (r) => <span className={r.balance < 0 ? 'font-medium text-destructive' : undefined}>{fmtHours(r.balance)}</span>,
  },
  { key: 'occupancy', header: 'Ocupação', align: 'right', sortValue: (r) => r.occupancy, render: (r) => fmtPct(r.occupancy) },
  { key: 'status', header: 'Situação', sortValue: (r) => r.status, render: (r) => <Badge>{r.status}</Badge> },
]

type ActivityRow = Activity & { planned: number }

const ACTIVITY_COLUMNS: Column<ActivityRow>[] = [
  { key: 'product', header: 'Produto', sortValue: (r) => productName(r.product), render: (r) => productName(r.product) },
  { key: 'phase', header: 'Fase', sortValue: (r) => r.phase, render: (r) => r.phase },
  { key: 'stage', header: 'Etapa', sortValue: (r) => r.stage, render: (r) => r.stage },
  { key: 'sector', header: 'Setor responsável', sortValue: (r) => sectorName(r.sector), render: (r) => sectorName(r.sector) },
  { key: 'labor', header: 'Classe de mão de obra', sortValue: (r) => r.laborClass, render: (r) => r.laborClass },
  { key: 'people', header: 'Pessoas (ref.)', align: 'right', sortValue: (r) => r.referencePeople, render: (r) => r.referencePeople },
  {
    key: 'index',
    header: 'Índice h/m²',
    align: 'right',
    sortValue: (r) => r.hoursPerM2 ?? null,
    render: (r) => (r.hoursPerM2 !== undefined ? r.hoursPerM2.toFixed(2).replace('.', ',') : <span className="text-muted-foreground">Direto: {r.directHours} h</span>),
  },
  { key: 'planned', header: 'Horas previstas (carteira)', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
  { key: 'notes', header: 'Observações', render: (r) => <span className="text-muted-foreground">{r.notes || '—'}</span>, csv: (r) => r.notes },
]

const ACTIVITY_ROWS: ActivityRow[] = ACTIVITIES.map((a) => ({
  ...a,
  planned: sumPlanned(RECORDS.filter((r) => r.activityId === a.id)),
}))

function heatClass(occ: number | null) {
  const s = capacityStatus(occ)
  if (occ === null || occ === 0) return 'bg-background text-muted-foreground'
  if (s === 'Sobrecarga') return 'bg-red-100 text-red-800 font-medium'
  if (s === 'Atenção') return 'bg-yellow-100 text-yellow-900'
  return 'bg-green-50 text-green-800'
}

export function CapacityView() {
  const { state, set } = useRecordFilters({ monthFrom: CURRENT_MONTH, monthTo: CURRENT_MONTH })
  const [selected, setSelected] = useState<SectorId>('USI')
  const [activityProduct, setActivityProduct] = useState('')

  const months = monthsInRange(state.monthFrom, state.monthTo)
  const rows = sectorCapacity(months, RECORDS)
  const chartData = rows.map((r) => ({ name: r.name, Capacidade: r.available, Demanda: r.demand }))

  const sectorRecords = RECORDS.filter((r) => r.sector === selected && months.includes(r.month))
  const selectedRow = rows.find((r) => r.sector === selected)!
  const contributors = Object.entries(
    sectorRecords.reduce<Record<string, number>>((acc, r) => {
      acc[r.projectId] = (acc[r.projectId] ?? 0) + r.plannedHours
      return acc
    }, {}),
  )
    .map(([projectId, hours]) => ({ projectId, hours }))
    .sort((a, b) => b.hours - a.hours)

  const totalAvailable = rows.reduce((a, r) => a + r.available, 0)
  const totalDemand = rows.reduce((a, r) => a + r.demand, 0)
  const periodLabel = months.length === 1 ? fmtMonth(months[0]) : `${fmtMonth(months[0])} a ${fmtMonth(months[months.length - 1])}`

  return (
    <>
      <PageHeader
        title="Capacidade industrial"
        description="Comparação entre a capacidade estrutural de cada setor e a demanda de horas prevista pelos projetos."
      />
      <FilterBar>
        <PeriodFilters state={state} set={set} />
        <div className="text-xs text-muted-foreground md:ml-auto md:max-w-md">
          <p>
            <strong className="text-foreground">Capacidade</strong> = funcionários fixos × {PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH} h/mês ×{' '}
            {months.length} {months.length === 1 ? 'mês' : 'meses'}.
          </p>
          <p>
            Disponível {'<'} {CAPACITY_THRESHOLDS.attention}% · Atenção {CAPACITY_THRESHOLDS.attention}–{CAPACITY_THRESHOLDS.overload}% · Sobrecarga {'>'}{' '}
            {CAPACITY_THRESHOLDS.overload}%
          </p>
        </div>
      </FilterBar>

      <div className="grid gap-4 xl:grid-cols-5">
        <Panel
          title={`Capacidade x demanda — ${periodLabel}`}
          description="Clique em um setor para ver os projetos que mais contribuem para a ocupação."
          className="xl:col-span-3"
          actions={<CsvButton onClick={() => exportCsv(`capacidade-${state.monthFrom}-${state.monthTo}.csv`, CAPACITY_COLUMNS, rows)} />}
        >
          <DataTable
            columns={CAPACITY_COLUMNS}
            rows={rows}
            rowKey={(r) => r.sector}
            onRowClick={(r) => setSelected(r.sector)}
            footer={
              <tr>
                <td className="px-3 py-2">Total fábrica</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtNumber(SECTORS.reduce((a, s) => a + s.fixedEmployees, 0))}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalAvailable)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalDemand)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalAvailable - totalDemand)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmtPct(percent(totalDemand, totalAvailable))}</td>
                <td className="px-3 py-2">
                  <Badge>{capacityStatus(percent(totalDemand, totalAvailable))}</Badge>
                </td>
              </tr>
            }
          />
          <div className="mt-4">
            <ChartBox height={240}>
              <BarChart data={chartData}>
                <CartesianGrid {...GRID} vertical={false} />
                <XAxis dataKey="name" tick={AXIS} interval={0} />
                <YAxis tick={AXIS} width={52} />
                <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
                <Legend wrapperStyle={LEGEND_STYLE} />
                <Bar dataKey="Capacidade" fill={COLORS.gray} radius={[2, 2, 0, 0]} />
                <Bar dataKey="Demanda" fill={COLORS.brand} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ChartBox>
          </div>
        </Panel>

        <Panel
          title={`Contribuição por projeto — ${selectedRow.name}`}
          description={`${fmtHours(selectedRow.demand)} necessárias de ${fmtHours(selectedRow.available)} disponíveis (${fmtPct(selectedRow.occupancy)}).`}
          className="xl:col-span-2"
          actions={
            <FilterSelect
              label="Setor"
              value={selected}
              onChange={(v) => setSelected(v as SectorId)}
              options={SECTORS.map((s) => ({ value: s.id, label: s.name }))}
              allLabel={null}
            />
          }
        >
          {contributors.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Sem demanda prevista neste setor no período.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {contributors.map((c) => {
                const project = getProject(c.projectId)!
                const shareOfCapacity = percent(c.hours, selectedRow.available) ?? 0
                return (
                  <li key={c.projectId}>
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <Link href={`/projetos/${c.projectId}`} className="truncate hover:text-primary hover:underline">
                        {c.projectId} · {project.name}
                      </Link>
                      <span className="shrink-0 tabular-nums">{fmtHours(c.hours)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded bg-secondary">
                        <div className="h-full bg-primary" style={{ width: `${Math.min(100, shareOfCapacity)}%` }} />
                      </div>
                      <span className="w-24 text-right text-xs text-muted-foreground tabular-nums">
                        {fmtPct(shareOfCapacity)} da cap.
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Mapa de ocupação mensal por setor" description="Percentual de ocupação de cada setor em cada mês da carteira." className="mt-4">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Setor
                </th>
                {MONTHS.map((m) => (
                  <th key={m} scope="col" className={cn('px-2 py-2 text-center font-medium', months.includes(m) && 'text-primary')}>
                    {fmtMonth(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTORS.map((s) => (
                <tr key={s.id} className="border-t">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium">
                    {s.name}
                  </th>
                  {MONTHS.map((m) => {
                    const occ = sectorCapacity([m], RECORDS).find((r) => r.sector === s.id)!.occupancy
                    return (
                      <td key={m} className={cn('border-l px-2 py-2 text-center tabular-nums', heatClass(occ))}>
                        {occ ? `${Math.round(occ)}%` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title="Mapeamento de atividades"
        description="A quantidade de pessoas é uma referência operacional por atividade e não é somada para obter o total de funcionários da fábrica — a capacidade usa apenas os funcionários fixos de cada setor."
        className="mt-4"
        actions={
          <FilterSelect label="Produto" value={activityProduct} onChange={setActivityProduct} options={PRODUCT_OPTIONS} />
        }
      >
        <DataTable
          columns={ACTIVITY_COLUMNS}
          rows={ACTIVITY_ROWS.filter((a) => !activityProduct || a.product === activityProduct)}
          rowKey={(r) => r.id}
        />
      </Panel>
    </>
  )
}
