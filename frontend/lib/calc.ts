import {
  ACTIVITIES,
  CAPACITY_THRESHOLDS,
  PHASES,
  PLANNING_MONTHS,
  PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH,
  PRODUCTS,
  PROJECTS,
  SECTORS,
  TODAY,
} from './data'
import type {
  Activity,
  CapacityStatus,
  HoursCategory,
  HoursRecord,
  PhaseStatus,
  ProductId,
  Project,
  ProjectPhase,
  ProjectStatus,
  SectorId,
} from './types'

/* ---------------------------------- Datas --------------------------------- */

const DAY_MS = 86_400_000

export function toTime(date: string) {
  return Date.parse(`${date}T00:00:00Z`)
}

export function addDays(date: string, days: number) {
  return new Date(toTime(date) + days * DAY_MS).toISOString().slice(0, 10)
}

export function diffDays(a: string, b: string) {
  return Math.round((toTime(b) - toTime(a)) / DAY_MS)
}

export function monthOf(date: string) {
  return date.slice(0, 7)
}

export function monthStart(month: string) {
  return `${month}-01`
}

export function monthEnd(month: string) {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const start = toTime(aStart) > toTime(bStart) ? aStart : bStart
  const end = toTime(aEnd) < toTime(bEnd) ? aEnd : bEnd
  const days = diffDays(start, end) + 1
  return days > 0 ? days : 0
}

/* -------------------------------- Lookups --------------------------------- */

export const productName = (id: ProductId) => PRODUCTS.find((p) => p.id === id)?.name ?? id
export const sectorName = (id: SectorId) => SECTORS.find((s) => s.id === id)?.name ?? id
export const getProject = (id: string) => PROJECTS.find((p) => p.id === id)

export const CATEGORY_LABEL: Record<HoursCategory, string> = {
  fabricacao: 'Fabricação',
  setup: 'Setup',
  instalacao: 'Instalação',
}

/* --------------------------------- Fases ---------------------------------- */

function buildPhases(project: Project): ProjectPhase[] {
  let cursor = project.start
  return PHASES.map((name, i) => {
    const durationDays = project.phaseWeeks[i] * 7
    const start = cursor
    const end = addDays(start, durationDays - 1)
    cursor = addDays(end, 1)
    let status: PhaseStatus
    if (project.delayedPhase === name && toTime(end) < toTime(TODAY)) status = 'Atrasada'
    else if (toTime(end) < toTime(TODAY)) status = 'Concluída'
    else if (toTime(start) > toTime(TODAY)) status = 'Planejada'
    else status = 'Em andamento'
    return { name, start, end, durationDays, status }
  })
}

export const PROJECT_PHASES: Record<string, ProjectPhase[]> = Object.fromEntries(
  PROJECTS.map((p) => [p.id, buildPhases(p)]),
)

export function projectEnd(projectId: string) {
  const phases = PROJECT_PHASES[projectId]
  return phases[phases.length - 1].end
}

export function projectStatus(project: Project): ProjectStatus {
  if (project.delayedPhase) return 'Atrasado'
  const end = projectEnd(project.id)
  if (toTime(end) < toTime(TODAY)) return 'Concluído'
  if (toTime(project.start) > toTime(TODAY)) return 'Planejado'
  return 'Em andamento'
}

export function isEndingSoon(project: Project, days = 30) {
  const status = projectStatus(project)
  if (status === 'Concluído') return false
  const remaining = diffDays(TODAY, projectEnd(project.id))
  return remaining >= 0 && remaining <= days
}

/* ------------------------ Geração dos registros de horas ------------------- */

/** Distribui um total entre partes mantendo a soma exata (arredondamento cumulativo). */
function distribute(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (sum === 0) return weights.map(() => 0)
  let acc = 0
  let prevRounded = 0
  return weights.map((w) => {
    acc += (total * w) / sum
    const rounded = Math.round(acc)
    const part = rounded - prevRounded
    prevRounded = rounded
    return part
  })
}

function activityWindow(activity: Activity, phases: ProjectPhase[]) {
  const phase = phases.find((p) => p.name === activity.phase)!
  if (activity.category === 'setup') {
    const end = addDays(phase.start, 13)
    return { start: phase.start, end: toTime(end) < toTime(phase.end) ? end : phase.end }
  }
  return { start: phase.start, end: phase.end }
}

function activityPlanned(project: Project, activity: Activity) {
  const projectDirect = project.directHours?.[activity.id]
  if (projectDirect !== undefined) return { hours: projectDirect, source: 'direto' as const }
  if (activity.directHours !== undefined) return { hours: activity.directHours, source: 'direto' as const }
  if (project.areaM2 && activity.hoursPerM2) {
    return { hours: Math.round(project.areaM2 * activity.hoursPerM2), source: 'índice' as const }
  }
  return { hours: 0, source: 'direto' as const }
}

function buildRecords(): HoursRecord[] {
  const records: HoursRecord[] = []
  for (const project of PROJECTS) {
    const phases = PROJECT_PHASES[project.id]
    const activities = ACTIVITIES.filter((a) => a.product === project.product)
    for (const activity of activities) {
      const { hours, source } = activityPlanned(project, activity)
      if (hours <= 0) continue
      const win = activityWindow(activity, phases)
      const months = PLANNING_MONTHS.filter(
        (m) => overlapDays(win.start, win.end, monthStart(m), monthEnd(m)) > 0,
      )
      const weights = months.map((m) => overlapDays(win.start, win.end, monthStart(m), monthEnd(m)))
      const plannedParts = distribute(hours, weights)
      const areaParts =
        source === 'índice' && project.areaM2 ? distribute(project.areaM2, weights) : null

      months.forEach((month, i) => {
        const mStart = monthStart(month)
        const mEnd = monthEnd(month)
        const windowDays = weights[i]
        const elapsed = overlapDays(win.start, win.end, mStart, toTime(mEnd) < toTime(TODAY) ? mEnd : TODAY)
        const actual =
          elapsed > 0 && toTime(mStart) <= toTime(TODAY)
            ? Math.round(plannedParts[i] * (elapsed / windowDays) * project.performance)
            : null
        records.push({
          id: `${project.id}-${activity.id}-${month}`,
          projectId: project.id,
          month,
          product: project.product,
          sector: activity.sector,
          activityId: activity.id,
          stage: activity.stage,
          phase: activity.phase,
          category: activity.category,
          areaM2: areaParts ? areaParts[i] : null,
          source,
          plannedHours: plannedParts[i],
          actualHours: actual,
        })
      })
    }
  }
  return records
}

export const RECORDS: HoursRecord[] = buildRecords()

/** Meses que efetivamente possuem registros. */
export const MONTHS = PLANNING_MONTHS.filter((m) => RECORDS.some((r) => r.month === m))
export const CURRENT_MONTH = monthOf(TODAY)

/* ------------------------------- Agregações -------------------------------- */

export interface RecordFilter {
  monthFrom?: string
  monthTo?: string
  months?: string[]
  projectId?: string
  product?: ProductId
  sector?: SectorId
  categories?: HoursCategory[]
}

export function filterRecords(filter: RecordFilter, records = RECORDS) {
  return records.filter(
    (r) =>
      (!filter.monthFrom || r.month >= filter.monthFrom) &&
      (!filter.monthTo || r.month <= filter.monthTo) &&
      (!filter.months || filter.months.includes(r.month)) &&
      (!filter.projectId || r.projectId === filter.projectId) &&
      (!filter.product || r.product === filter.product) &&
      (!filter.sector || r.sector === filter.sector) &&
      (!filter.categories || filter.categories.includes(r.category)),
  )
}

export function sumPlanned(records: HoursRecord[]) {
  return records.reduce((acc, r) => acc + r.plannedHours, 0)
}

/** Retorna null quando nenhum registro possui horas realizadas informadas. */
export function sumActual(records: HoursRecord[]): number | null {
  const reported = records.filter((r) => r.actualHours !== null)
  if (reported.length === 0) return null
  return reported.reduce((acc, r) => acc + (r.actualHours ?? 0), 0)
}

export function balance(planned: number, actual: number | null) {
  return actual === null ? null : planned - actual
}

export function percent(part: number | null, total: number) {
  if (part === null || total === 0) return null
  return (part / total) * 100
}

export function groupBy<T, K extends string>(items: T[], key: (item: T) => K) {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const k = key(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  }
  return map
}

export function monthsInRange(from?: string, to?: string) {
  return MONTHS.filter((m) => (!from || m >= from) && (!to || m <= to))
}

export interface MonthPoint {
  month: string
  label: string
  planned: number
  actual: number | null
  fabricacao: number
  setup: number
  instalacao: number
  execucao: number
  fabricacaoActual: number | null
  execucaoActual: number | null
}

export function monthlySeries(records: HoursRecord[], months: string[]): MonthPoint[] {
  return months.map((month) => {
    const rs = records.filter((r) => r.month === month)
    const fab = rs.filter((r) => r.category === 'fabricacao')
    const exe = rs.filter((r) => r.category !== 'fabricacao')
    return {
      month,
      label: fmtMonth(month),
      planned: sumPlanned(rs),
      actual: sumActual(rs),
      fabricacao: sumPlanned(fab),
      setup: sumPlanned(rs.filter((r) => r.category === 'setup')),
      instalacao: sumPlanned(rs.filter((r) => r.category === 'instalacao')),
      execucao: sumPlanned(exe),
      fabricacaoActual: sumActual(fab),
      execucaoActual: sumActual(exe),
    }
  })
}

export interface GroupTotal {
  key: string
  label: string
  planned: number
  actual: number | null
  balance: number | null
  progress: number | null
}

export function totalsBy(
  records: HoursRecord[],
  key: (r: HoursRecord) => string,
  label: (key: string) => string,
): GroupTotal[] {
  return [...groupBy(records, key).entries()].map(([k, rs]) => {
    const planned = sumPlanned(rs)
    const actual = sumActual(rs)
    return { key: k, label: label(k), planned, actual, balance: balance(planned, actual), progress: percent(actual, planned) }
  })
}

/* ------------------------------- Projetos ---------------------------------- */

export interface ProjectSummary {
  project: Project
  status: ProjectStatus
  end: string
  planned: number
  actual: number | null
  progress: number | null
  balance: number | null
}

export function summarizeProject(project: Project, records = RECORDS): ProjectSummary {
  const own = records.filter((r) => r.projectId === project.id)
  const planned = sumPlanned(own)
  const actual = sumActual(own)
  return {
    project,
    status: projectStatus(project),
    end: projectEnd(project.id),
    planned,
    actual,
    progress: percent(actual, planned),
    balance: balance(planned, actual),
  }
}

export function projectsActiveInRange(from?: string, to?: string) {
  const start = from ? monthStart(from) : '0000-01-01'
  const end = to ? monthEnd(to) : '9999-12-31'
  return PROJECTS.filter(
    (p) => toTime(p.start) <= toTime(end) && toTime(projectEnd(p.id)) >= toTime(start),
  )
}

/* ------------------------------- Capacidade -------------------------------- */

export function capacityStatus(occupancy: number | null): CapacityStatus {
  if (occupancy === null) return 'Disponível'
  if (occupancy > CAPACITY_THRESHOLDS.overload) return 'Sobrecarga'
  if (occupancy >= CAPACITY_THRESHOLDS.attention) return 'Atenção'
  return 'Disponível'
}

export interface CapacityRow {
  sector: SectorId
  name: string
  fixedEmployees: number
  available: number
  demand: number
  balance: number
  occupancy: number | null
  status: CapacityStatus
}

/** Capacidade estrutural = funcionários fixos × horas produtivas × nº de meses. */
export function sectorCapacity(months: string[], records: HoursRecord[]): CapacityRow[] {
  return SECTORS.map((s) => {
    const available = s.fixedEmployees * PRODUCTIVE_HOURS_PER_EMPLOYEE_MONTH * months.length
    const demand = sumPlanned(records.filter((r) => r.sector === s.id && months.includes(r.month)))
    const occupancy = percent(demand, available)
    return {
      sector: s.id,
      name: s.name,
      fixedEmployees: s.fixedEmployees,
      available,
      demand,
      balance: available - demand,
      occupancy,
      status: capacityStatus(occupancy),
    }
  })
}

/* -------------------------------- Formatação ------------------------------- */

const numberFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const pctFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const MONTH_NAMES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export const fmtNumber = (n: number | null) => (n === null ? '—' : numberFmt.format(n))
export const fmtHours = (n: number | null) => (n === null ? '—' : `${numberFmt.format(n)} h`)
export const fmtPct = (n: number | null) => (n === null ? '—' : `${pctFmt.format(n)}%`)

export function fmtMonth(month: string) {
  const [y, m] = month.split('-')
  return `${MONTH_NAMES[Number(m) - 1]}/${y.slice(2)}`
}

export function fmtDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
