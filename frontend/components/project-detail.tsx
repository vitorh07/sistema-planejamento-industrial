'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH, SECTORS } from '@/lib/data'
import {
  CATEGORY_LABEL,
  PROJECT_PHASES,
  RECORDS,
  balance,
  fmtDate,
  fmtHours,
  fmtMonth,
  fmtNumber,
  fmtPct,
  getProject,
  isEndingSoon,
  monthlySeries,
  percent,
  productName,
  sectorName,
  sumActual,
  sumPlanned,
  summarizeProject,
  totalsBy,
} from '@/lib/calc'
import type { HoursCategory } from '@/lib/types'
import { cn } from '@/lib/utils'
import { AXIS, COLORS, ChartBox, GRID, LEGEND_STYLE, TOOLTIP_STYLE, hoursFormatter } from './charts'
import { Gantt } from './gantt'
import { Badge, DataTable, Kpi, Panel, ProgressBar, type Column } from './kit'
import type { ProjectPhase } from '@/lib/types'
import type { GroupTotal } from '@/lib/calc'

const PHASE_COLUMNS: Column<ProjectPhase>[] = [
  { key: 'name', header: 'Fase', render: (r) => <span className="font-medium">{r.name}</span> },
  { key: 'start', header: 'Início', render: (r) => fmtDate(r.start) },
  { key: 'end', header: 'Término', render: (r) => fmtDate(r.end) },
  { key: 'duration', header: 'Duração', align: 'right', render: (r) => `${r.durationDays} dias` },
  { key: 'status', header: 'Status', render: (r) => <Badge>{r.status}</Badge> },
]

const SECTOR_COLUMNS: Column<GroupTotal>[] = [
  { key: 'label', header: 'Setor', sortValue: (r) => r.label, render: (r) => <span className="font-medium">{r.label}</span> },
  { key: 'planned', header: 'Previstas', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
  { key: 'actual', header: 'Realizadas', align: 'right', sortValue: (r) => r.actual, render: (r) => fmtHours(r.actual) },
  { key: 'balance', header: 'Saldo', align: 'right', sortValue: (r) => r.balance, render: (r) => <span className={r.balance !== null && r.balance < 0 ? 'text-destructive' : undefined}>{fmtHours(r.balance)}</span> },
  { key: 'progress', header: 'Realizado', sortValue: (r) => r.progress, render: (r) => <ProgressBar value={r.progress} /> },
]

export function ProjectDetail({ id }: { id: string }) {
  const project = getProject(id)!
  const summary = summarizeProject(project)
  const phases = PROJECT_PHASES[id]
  const records = RECORDS.filter((r) => r.projectId === id)
  const months = [...new Set(records.map((r) => r.month))].sort()
  const series = monthlySeries(records, months)
  const bySector = totalsBy(records, (r) => r.sector, (k) => sectorName(k as never)).sort((a, b) => b.planned - a.planned)
  const projectSectors = SECTORS.filter((s) => bySector.some((b) => b.key === s.id))

  const categories = (['fabricacao', 'setup', 'instalacao'] as HoursCategory[]).map((c) => {
    const rs = records.filter((r) => r.category === c)
    const planned = sumPlanned(rs)
    const actual = sumActual(rs)
    return { c, planned, actual, balance: balance(planned, actual), progress: percent(actual, planned) }
  })

  return (
    <>
      <Link href="/projetos" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para projetos
      </Link>
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{project.id}</p>
          <h1 className="text-xl font-semibold text-balance">{project.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.client} · {productName(project.product)} ·{' '}
            {project.areaM2 === null ? 'Horas informadas diretamente (sem metragem)' : `${fmtNumber(project.areaM2)} m²`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{summary.status}</Badge>
          <Badge>{project.priority}</Badge>
          {isEndingSoon(project) && <Badge tone="yellow">Término próximo</Badge>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Horas previstas" value={fmtHours(summary.planned)} />
        <Kpi label="Horas realizadas" value={fmtHours(summary.actual)} />
        <Kpi label="Avanço" value={fmtPct(summary.progress)} hint="Realizado ÷ previsto" />
        <Kpi
          label="Saldo de horas"
          value={fmtHours(summary.balance)}
          tone={summary.balance !== null && summary.balance < 0 ? 'danger' : 'default'}
        />
        <Kpi label="Término previsto" value={fmtDate(summary.end)} hint={`Início: ${fmtDate(project.start)}`} />
      </div>

      <Panel title="Fases e cronograma" className="mt-4">
        <Gantt items={[{ id: project.id, label: project.id, sublabel: productName(project.product), phases }]} scale="week" labelWidth={120} />
        <div className="mt-4">
          <DataTable columns={PHASE_COLUMNS} rows={phases} rowKey={(r) => r.name} />
        </div>
        {project.delayedPhase && (
          <p className="mt-2 text-sm text-destructive">
            A fase {project.delayedPhase} ultrapassou a data prevista de término sem conclusão.
          </p>
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Horas previstas x realizadas por mês">
          <ChartBox>
            <BarChart data={series}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} width={48} />
              <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="planned" name="Previstas" fill={COLORS.brand} radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" name="Realizadas" fill={COLORS.dark} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartBox>
        </Panel>
        <Panel title="Fabricação, setup e instalação">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Categoria</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Previstas</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Realizadas</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Saldo</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium">Realizado</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((k) => (
                  <tr key={k.c} className="border-t">
                    <th scope="row" className="px-3 py-2 text-left font-medium">{CATEGORY_LABEL[k.c]}</th>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtHours(k.planned)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtHours(k.actual)}</td>
                    <td className={cn('px-3 py-2 text-right tabular-nums', k.balance !== null && k.balance < 0 && 'text-destructive')}>
                      {fmtHours(k.balance)}
                    </td>
                    <td className="px-3 py-2">
                      <ProgressBar value={k.progress} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="mb-2 mt-5 text-sm font-semibold">Horas por setor</h3>
          <DataTable columns={SECTOR_COLUMNS} rows={bySector} rowKey={(r) => r.key} />
        </Panel>
      </div>

      <Panel
        title="Ocupação mensal nos setores"
        description={`Horas previstas do projeto e o percentual que representam da capacidade mensal de cada setor (fixos × ${PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH} h).`}
        className="mt-4"
      >
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">Setor</th>
                {months.map((m) => (
                  <th key={m} scope="col" className="px-3 py-2 text-right font-medium">{fmtMonth(m)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projectSectors.map((s) => (
                <tr key={s.id} className="border-t">
                  <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-medium">{s.name}</th>
                  {months.map((m) => {
                    const h = sumPlanned(records.filter((r) => r.sector === s.id && r.month === m))
                    const share = percent(h, s.fixedEmployees * PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH)
                    return (
                      <td key={m} className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                        {h === 0 ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <>
                            {fmtHours(h)}
                            <span className="ml-1 text-xs text-muted-foreground">({fmtPct(share)})</span>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
