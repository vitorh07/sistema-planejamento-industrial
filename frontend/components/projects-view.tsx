'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { PROJECTS } from '@/lib/data'
import {
  fmtDate,
  fmtHours,
  fmtNumber,
  monthEnd,
  monthStart,
  productName,
  summarizeProject,
  toTime,
  type ProjectSummary,
} from '@/lib/calc'
import { MONTH_OPTIONS, PRODUCT_OPTIONS } from './filters'
import {
  Badge,
  CsvButton,
  DataTable,
  FilterBar,
  FilterSelect,
  PageHeader,
  ProgressBar,
  SearchInput,
  exportCsv,
  type Column,
} from './kit'

const STATUS_OPTIONS = ['Planejado', 'Em andamento', 'Concluído', 'Atrasado'].map((s) => ({ value: s, label: s }))

const SUMMARIES = PROJECTS.map((p) => summarizeProject(p))

const COLUMNS: Column<ProjectSummary>[] = [
  { key: 'id', header: 'ID', sortValue: (r) => r.project.id, render: (r) => <span className="font-mono text-xs">{r.project.id}</span> },
  { key: 'name', header: 'Projeto', sortValue: (r) => r.project.name, render: (r) => <span className="font-medium">{r.project.name}</span> },
  { key: 'product', header: 'Produto', sortValue: (r) => productName(r.project.product), render: (r) => productName(r.project.product) },
  { key: 'status', header: 'Status', sortValue: (r) => r.status, render: (r) => <Badge>{r.status}</Badge> },
  { key: 'priority', header: 'Prioridade', sortValue: (r) => ({ Alta: 0, Média: 1, Baixa: 2 })[r.project.priority], csv: (r) => r.project.priority, render: (r) => <Badge>{r.project.priority}</Badge> },
  { key: 'start', header: 'Início', sortValue: (r) => r.project.start, csv: (r) => fmtDate(r.project.start), render: (r) => fmtDate(r.project.start) },
  { key: 'end', header: 'Término previsto', sortValue: (r) => r.end, csv: (r) => fmtDate(r.end), render: (r) => fmtDate(r.end) },
  { key: 'area', header: 'Metragem (m²)', align: 'right', sortValue: (r) => r.project.areaM2, render: (r) => (r.project.areaM2 === null ? <span className="text-muted-foreground" title="Horas informadas diretamente">—</span> : fmtNumber(r.project.areaM2)) },
  { key: 'planned', header: 'Horas previstas', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
  { key: 'actual', header: 'Horas realizadas', align: 'right', sortValue: (r) => r.actual, render: (r) => fmtHours(r.actual) },
  { key: 'progress', header: 'Avanço', sortValue: (r) => r.progress, csv: (r) => (r.progress === null ? null : Math.round(r.progress)), render: (r) => <ProgressBar value={r.progress} /> },
  {
    key: 'balance',
    header: 'Saldo de horas',
    align: 'right',
    sortValue: (r) => r.balance,
    render: (r) => <span className={r.balance !== null && r.balance < 0 ? 'text-destructive' : undefined}>{fmtHours(r.balance)}</span>,
  },
]

export function ProjectsView() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [product, setProduct] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SUMMARIES.filter(
      (s) =>
        (!q || s.project.name.toLowerCase().includes(q) || s.project.id.toLowerCase().includes(q) || s.project.client.toLowerCase().includes(q)) &&
        (!status || s.status === status) &&
        (!product || s.project.product === product) &&
        (!from || toTime(s.end) >= toTime(monthStart(from))) &&
        (!to || toTime(s.project.start) <= toTime(monthEnd(to))),
    )
  }, [query, status, product, from, to])

  const totalPlanned = rows.reduce((a, r) => a + r.planned, 0)
  const reported = rows.filter((r) => r.actual !== null)
  const totalActual = reported.length ? reported.reduce((a, r) => a + (r.actual ?? 0), 0) : null

  return (
    <>
      <PageHeader
        title="Gestão de projetos"
        description="Clique em um projeto para ver fases, cronograma, horas e distribuição por setor."
        actions={<CsvButton onClick={() => exportCsv('projetos.csv', COLUMNS, rows)} />}
      />
      <FilterBar>
        <SearchInput value={query} onChange={setQuery} placeholder="Nome, ID ou cliente" />
        <FilterSelect label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        <FilterSelect label="Produto" value={product} onChange={setProduct} options={PRODUCT_OPTIONS} />
        <FilterSelect label="Ativo de" value={from} onChange={setFrom} options={MONTH_OPTIONS} allLabel="Qualquer" />
        <FilterSelect label="Ativo até" value={to} onChange={setTo} options={MONTH_OPTIONS} allLabel="Qualquer" />
      </FilterBar>
      <DataTable
        columns={COLUMNS}
        rows={rows}
        rowKey={(r) => r.project.id}
        onRowClick={(r) => router.push(`/projetos/${r.project.id}`)}
        initialSort={{ key: 'id', dir: 'asc' }}
        footer={
          <tr>
            <td className="px-3 py-2" colSpan={8}>
              Total ({rows.length} projetos)
            </td>
            <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalPlanned)}</td>
            <td className="px-3 py-2 text-right tabular-nums">{fmtHours(totalActual)}</td>
            <td className="px-3 py-2" />
            <td className="px-3 py-2 text-right tabular-nums">
              {fmtHours(totalActual === null ? null : reported.reduce((a, r) => a + (r.balance ?? 0), 0))}
            </td>
          </tr>
        }
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Saldo = horas previstas − horas realizadas apontadas. Projetos sem apontamento exibem “—” (não são tratados como zero), e o saldo total soma apenas projetos com apontamento.
      </p>
    </>
  )
}
