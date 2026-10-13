'use client'

import Link from 'next/link'
import { TODAY, PHASES } from '@/lib/data'
import { addDays, diffDays, fmtDate, fmtMonth, monthEnd, monthOf, monthStart, toTime } from '@/lib/calc'
import type { PhaseName, ProjectPhase } from '@/lib/types'
import { cn } from '@/lib/utils'

export const PHASE_COLOR: Record<PhaseName, string> = {
  Planejamento: '#D4D4D8',
  Engenharia: '#71717A',
  Fabricação: '#C200DC',
  'Execução em campo': '#E48CF0',
  Encerramento: '#3F3F46',
}

export interface GanttItem {
  id: string
  label: string
  sublabel?: string
  href?: string
  phases: ProjectPhase[]
  flag?: React.ReactNode
}

function buildColumns(start: string, end: string, scale: 'month' | 'week') {
  const cols: { key: string; label: string; start: string; end: string }[] = []
  if (scale === 'month') {
    let m = monthOf(start)
    while (m <= monthOf(end)) {
      cols.push({ key: m, label: fmtMonth(m), start: monthStart(m), end: monthEnd(m) })
      const [y, mm] = m.split('-').map(Number)
      m = mm === 12 ? `${y + 1}-01` : `${y}-${String(mm + 1).padStart(2, '0')}`
    }
  } else {
    const weekday = (new Date(toTime(start)).getUTCDay() + 6) % 7
    let cursor = addDays(start, -weekday)
    while (toTime(cursor) <= toTime(end)) {
      const [, mm, dd] = cursor.split('-')
      cols.push({ key: cursor, label: `${dd}/${mm}`, start: cursor, end: addDays(cursor, 6) })
      cursor = addDays(cursor, 7)
    }
  }
  return cols
}

export function Gantt({
  items,
  scale,
  labelWidth = 220,
}: {
  items: GanttItem[]
  scale: 'month' | 'week'
  labelWidth?: number
}) {
  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum projeto para os filtros selecionados.</p>
  }
  const allStarts = items.flatMap((i) => i.phases.map((p) => p.start)).sort()
  const allEnds = items.flatMap((i) => i.phases.map((p) => p.end)).sort()
  const columns = buildColumns(allStarts[0], allEnds[allEnds.length - 1], scale)
  const rangeStart = columns[0].start
  const rangeEnd = columns[columns.length - 1].end
  const totalDays = diffDays(rangeStart, rangeEnd) + 1
  const colWidth = scale === 'month' ? 90 : 34
  const width = columns.length * colWidth
  const x = (date: string) => (diffDays(rangeStart, date) / totalDays) * width
  const todayX = toTime(TODAY) >= toTime(rangeStart) && toTime(TODAY) <= toTime(rangeEnd) ? x(TODAY) : null

  return (
    <div>
      <div className="overflow-x-auto rounded-md border">
        <div style={{ width: labelWidth + width }} className="text-xs">
          <div className="flex border-b bg-secondary">
            <div style={{ width: labelWidth }} className="sticky left-0 z-10 shrink-0 border-r bg-secondary px-3 py-2 font-medium text-muted-foreground">
              Projeto
            </div>
            {columns.map((c) => (
              <div key={c.key} style={{ width: colWidth }} className="shrink-0 border-r px-1 py-2 text-center text-muted-foreground last:border-r-0">
                {c.label}
              </div>
            ))}
          </div>
          {items.map((item) => (
            <div key={item.id} className="flex border-b last:border-b-0">
              <div style={{ width: labelWidth }} className="sticky left-0 z-10 shrink-0 border-r bg-background px-3 py-2">
                <div className="flex items-center gap-1.5">
                  {item.href ? (
                    <Link href={item.href} className="truncate font-medium hover:text-primary hover:underline">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{item.label}</span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5 text-muted-foreground">
                  {item.sublabel && <span className="truncate">{item.sublabel}</span>}
                  {item.flag}
                </div>
              </div>
              <div className="relative shrink-0" style={{ width, height: 48 }}>
                {columns.map((c, i) => (
                  <div key={c.key} className="absolute inset-y-0 border-r border-border/60" style={{ left: (i + 1) * colWidth - 1 }} aria-hidden />
                ))}
                {todayX !== null && <div className="absolute inset-y-0 w-px bg-destructive" style={{ left: todayX }} aria-hidden />}
                {item.phases.map((p) => {
                  const left = x(p.start)
                  const w = Math.max(x(addDays(p.end, 1)) - left, 3)
                  const delayed = p.status === 'Atrasada'
                  return (
                    <div
                      key={p.name}
                      title={`${p.name}: ${fmtDate(p.start)} a ${fmtDate(p.end)} (${p.durationDays} dias) · ${p.status}`}
                      className={cn('absolute top-1/2 h-5 -translate-y-1/2 rounded-sm', delayed && 'ring-2 ring-destructive ring-offset-1')}
                      style={{
                        left,
                        width: w,
                        background: delayed
                          ? `repeating-linear-gradient(45deg, ${PHASE_COLOR[p.name]}, ${PHASE_COLOR[p.name]} 4px, #DC2626 4px, #DC2626 8px)`
                          : PHASE_COLOR[p.name],
                        opacity: p.status === 'Concluída' ? 0.55 : 1,
                      }}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <GanttLegend />
    </div>
  )
}

export function GanttLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {PHASES.map((p) => (
        <span key={p} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ background: PHASE_COLOR[p] }} aria-hidden />
          {p}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span
          className="size-2.5 rounded-sm ring-1 ring-destructive"
          style={{ background: 'repeating-linear-gradient(45deg, #C200DC, #C200DC 2px, #DC2626 2px, #DC2626 4px)' }}
          aria-hidden
        />
        Fase atrasada
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-3 w-px bg-destructive" aria-hidden />
        Hoje ({fmtDate(TODAY)})
      </span>
      <span>Fases concluídas aparecem esmaecidas.</span>
    </div>
  )
}
