'use client'

import { useState } from 'react'
import { PROJECTS } from '@/lib/data'
import { PROJECT_PHASES, fmtDate, isEndingSoon, productName, projectStatus } from '@/lib/calc'
import type { ProjectPhase } from '@/lib/types'
import { PROJECT_OPTIONS } from './filters'
import { Gantt } from './gantt'
import { Badge, DataTable, FilterBar, FilterSelect, PageHeader, Panel, SegmentedControl, type Column } from './kit'

const STATUS_OPTIONS = ['Planejado', 'Em andamento', 'Concluído', 'Atrasado'].map((s) => ({ value: s, label: s }))

type PhaseRow = ProjectPhase & { projectId: string; projectName: string }

const PHASE_COLUMNS: Column<PhaseRow>[] = [
  { key: 'project', header: 'Projeto', sortValue: (r) => r.projectId, render: (r) => `${r.projectId} · ${r.projectName}` },
  { key: 'phase', header: 'Fase', sortValue: (r) => r.name, render: (r) => r.name },
  { key: 'start', header: 'Início', sortValue: (r) => r.start, render: (r) => fmtDate(r.start) },
  { key: 'end', header: 'Término', sortValue: (r) => r.end, render: (r) => fmtDate(r.end) },
  { key: 'duration', header: 'Duração', align: 'right', sortValue: (r) => r.durationDays, render: (r) => `${r.durationDays} dias` },
  { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge>{r.status}</Badge> },
]

export function ScheduleView() {
  const [projectId, setProjectId] = useState('')
  const [status, setStatus] = useState('')
  const [scale, setScale] = useState<'month' | 'week'>('month')

  const projects = PROJECTS.filter(
    (p) => (!projectId || p.id === projectId) && (!status || projectStatus(p) === status),
  ).sort((a, b) => a.start.localeCompare(b.start))

  const items = projects.map((p) => ({
    id: p.id,
    label: `${p.id} · ${p.name}`,
    sublabel: productName(p.product),
    href: `/projetos/${p.id}`,
    phases: PROJECT_PHASES[p.id],
    flag: (
      <>
        {projectStatus(p) === 'Atrasado' && <Badge>Atrasado</Badge>}
        {isEndingSoon(p) && <Badge tone="yellow">Término próximo</Badge>}
      </>
    ),
  }))

  const phaseRows: PhaseRow[] = projects.flatMap((p) =>
    PROJECT_PHASES[p.id].map((ph) => ({ ...ph, projectId: p.id, projectName: p.name })),
  )

  return (
    <>
      <PageHeader title="Cronograma de projetos" description="Gantt simplificado com as cinco fases padrão de cada projeto." />
      <FilterBar>
        <FilterSelect label="Projeto" value={projectId} onChange={setProjectId} options={PROJECT_OPTIONS} />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <SegmentedControl
          label="Escala"
          value={scale}
          onChange={setScale}
          options={[
            { value: 'month', label: 'Mensal' },
            { value: 'week', label: 'Semanal' },
          ]}
        />
      </FilterBar>
      <Panel title="Linha do tempo" description="Passe o cursor sobre uma barra para ver datas, duração e status da fase.">
        <Gantt items={items} scale={scale} />
      </Panel>
      <Panel title="Fases e datas" className="mt-4">
        <DataTable columns={PHASE_COLUMNS} rows={phaseRows} rowKey={(r) => `${r.projectId}-${r.name}`} maxHeight={420} />
      </Panel>
    </>
  )
}
