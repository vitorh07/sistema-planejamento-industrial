'use client'

import Link from 'next/link'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CAPACITY_THRESHOLDS, PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH, PROJECTS, SECTORS } from '@/lib/data'
import {
  filterRecords,
  fmtDate,
  fmtHours,
  fmtNumber,
  fmtPct,
  isEndingSoon,
  monthlySeries,
  monthsInRange,
  percent,
  productName,
  projectEnd,
  projectStatus,
  sectorCapacity,
  sumActual,
  sumPlanned,
  totalsBy,
} from '@/lib/calc'
import { AXIS, COLORS, ChartBox, GRID, LEGEND_STYLE, SERIES, TOOLTIP_STYLE, hoursFormatter, pctFormatter } from './charts'
import { StandardFilters, useRecordFilters } from './filters'
import { Badge, FilterBar, Kpi, PageHeader, Panel } from './kit'

export function DashboardView() {
  const { state, set, filter } = useRecordFilters()
  const months = monthsInRange(state.monthFrom, state.monthTo)
  const records = filterRecords(filter)

  const projects = PROJECTS.filter(
    (p) => (!filter.projectId || p.id === filter.projectId) && (!filter.product || p.product === filter.product),
  )
  const active = projects.filter((p) => ['Em andamento', 'Atrasado'].includes(projectStatus(p)))
  const delayed = projects.filter((p) => projectStatus(p) === 'Atrasado')

  const planned = sumPlanned(records)
  const actual = sumActual(records)

  const capacityRows = sectorCapacity(months, records).filter((r) => !filter.sector || r.sector === filter.sector)
  const totalAvailable = capacityRows.reduce((a, r) => a + r.available, 0)
  const totalDemand = capacityRows.reduce((a, r) => a + r.demand, 0)
  const occupancy = percent(totalDemand, totalAvailable)

  const sectorsAtRisk = SECTORS.filter((s) => !filter.sector || s.id === filter.sector).filter((s) =>
    months.some((m) => (sectorCapacity([m], records).find((r) => r.sector === s.id)?.occupancy ?? 0) > CAPACITY_THRESHOLDS.overload),
  )

  const series = monthlySeries(records, months)
  const sectorFilteredAvailable = SECTORS.filter((s) => !filter.sector || s.id === filter.sector).reduce(
    (a, s) => a + s.fixedEmployees * PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH,
    0,
  )
  const demandSeries = series.map((p) => ({ ...p, capacity: sectorFilteredAvailable }))

  const byProduct = totalsBy(records, (r) => r.product, (k) => productName(k as never)).sort((a, b) => b.planned - a.planned)

  const occupancyBySector = capacityRows.map((r) => ({ name: r.name, occupancy: r.occupancy ?? 0, status: r.status }))

  const alerts = PROJECTS.filter((p) => projectStatus(p) === 'Atrasado' || isEndingSoon(p))

  return (
    <>
      <PageHeader
        title="Dashboard executivo"
        description="Visão consolidada de projetos, horas e ocupação da capacidade industrial."
      />
      <FilterBar>
        <StandardFilters state={state} set={set} />
      </FilterBar>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Projetos ativos" value={fmtNumber(active.length)} hint="Em andamento + atrasados" />
        <Kpi label="Horas previstas" value={fmtHours(planned)} hint="No período filtrado" />
        <Kpi
          label="Horas realizadas"
          value={fmtHours(actual)}
          hint={actual === null ? 'Sem apontamentos no período' : `${fmtPct(percent(actual, planned))} do previsto`}
        />
        <Kpi
          label="Ocupação da capacidade"
          value={fmtPct(occupancy)}
          tone={occupancy === null ? 'default' : occupancy > 100 ? 'danger' : occupancy >= 85 ? 'warning' : 'success'}
          hint={`${fmtHours(totalDemand)} / ${fmtHours(totalAvailable)}`}
        />
        <Kpi
          label="Setores com sobrecarga"
          value={fmtNumber(sectorsAtRisk.length)}
          tone={sectorsAtRisk.length > 0 ? 'danger' : 'success'}
          hint="Algum mês acima de 100%"
        />
        <Kpi
          label="Projetos atrasados"
          value={fmtNumber(delayed.length)}
          tone={delayed.length > 0 ? 'danger' : 'success'}
          hint={delayed.map((p) => p.id).join(', ') || 'Nenhum'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Horas previstas x realizadas por mês" description="Meses futuros ainda não possuem apontamentos.">
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

        <Panel
          title="Ocupação por setor no período"
          description={`Atenção a partir de ${CAPACITY_THRESHOLDS.attention}% · Sobrecarga acima de ${CAPACITY_THRESHOLDS.overload}%`}
        >
          <ChartBox>
            <BarChart data={occupancyBySector}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="name" tick={AXIS} interval={0} />
              <YAxis tick={AXIS} width={40} unit="%" />
              <Tooltip formatter={pctFormatter} {...TOOLTIP_STYLE} />
              <ReferenceLine y={CAPACITY_THRESHOLDS.overload} stroke={COLORS.red} strokeDasharray="4 4" />
              <ReferenceLine y={CAPACITY_THRESHOLDS.attention} stroke={COLORS.yellow} strokeDasharray="4 4" />
              <Bar dataKey="occupancy" name="Ocupação" radius={[2, 2, 0, 0]}>
                {occupancyBySector.map((s) => (
                  <Cell
                    key={s.name}
                    fill={s.status === 'Sobrecarga' ? COLORS.red : s.status === 'Atenção' ? COLORS.yellow : COLORS.green}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartBox>
        </Panel>

        <Panel title="Distribuição das horas previstas por produto">
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <ChartBox height={220}>
              <PieChart>
                <Pie data={byProduct} dataKey="planned" nameKey="label" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {byProduct.map((p, i) => (
                    <Cell key={p.key} fill={SERIES[i % SERIES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
              </PieChart>
            </ChartBox>
            <ul className="flex flex-col gap-2 text-sm">
              {byProduct.map((p, i) => (
                <li key={p.key} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} aria-hidden />
                  <span className="flex-1">{p.label}</span>
                  <span className="tabular-nums">{fmtHours(p.planned)}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                    {fmtPct(percent(p.planned, planned))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Fabricação x execução em campo" description="Horas previstas por mês, categorias independentes.">
          <ChartBox>
            <BarChart data={series}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} width={48} />
              <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Bar dataKey="fabricacao" name="Fabricação" stackId="a" fill={COLORS.brand} />
              <Bar dataKey="execucao" name="Execução em campo" stackId="a" fill={COLORS.gray} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartBox>
        </Panel>

        <Panel
          title="Evolução mensal da demanda industrial"
          description="Demanda prevista comparada à capacidade estrutural mensal dos setores filtrados."
          className="lg:col-span-2"
        >
          <ChartBox>
            <LineChart data={demandSeries}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} />
              <YAxis tick={AXIS} width={52} />
              <Tooltip formatter={hoursFormatter} {...TOOLTIP_STYLE} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              <Line type="monotone" dataKey="planned" name="Demanda prevista" stroke={COLORS.brand} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="step" dataKey="capacity" name="Capacidade disponível" stroke={COLORS.dark} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ChartBox>
        </Panel>
      </div>

      <Panel title="Pontos de atenção" description="Projetos atrasados ou com término previsto em até 30 dias." className="mt-4">
        <ul className="divide-y text-sm">
          {alerts.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-2">
              <Link href={`/projetos/${p.id}`} className="font-medium hover:text-primary hover:underline">
                {p.id} · {p.name}
              </Link>
              <Badge>{projectStatus(p)}</Badge>
              {isEndingSoon(p) && <Badge tone="yellow">Término próximo</Badge>}
              {p.delayedPhase && <span className="text-xs text-muted-foreground">Fase atrasada: {p.delayedPhase}</span>}
              <span className="ml-auto text-xs text-muted-foreground">Término previsto: {fmtDate(projectEnd(p.id))}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  )
}
