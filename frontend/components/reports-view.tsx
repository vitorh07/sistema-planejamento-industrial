'use client'

import { useState } from 'react'
import {
  balance,
  filterRecords,
  fmtHours,
  fmtMonth,
  fmtPct,
  getProject,
  percent,
  productName,
  sectorName,
  sumActual,
  sumPlanned,
  totalsBy,
  type GroupTotal,
} from '@/lib/calc'
import type { HoursRecord } from '@/lib/types'
import { StandardFilters, useRecordFilters } from './filters'
import { CsvButton, DataTable, FilterBar, PageHeader, Panel, ProgressBar, SegmentedControl, exportCsv, type Column } from './kit'

type ReportKind = 'projeto' | 'setor' | 'produto' | 'mes'

const REPORTS: Record<ReportKind, { title: string; header: string; key: (r: HoursRecord) => string; label: (k: string) => string }> = {
  projeto: { title: 'Horas por projeto', header: 'Projeto', key: (r) => r.projectId, label: (k) => `${k} · ${getProject(k)?.name ?? ''}` },
  setor: { title: 'Horas por setor', header: 'Setor', key: (r) => r.sector, label: (k) => sectorName(k as never) },
  produto: { title: 'Horas por produto', header: 'Produto', key: (r) => r.product, label: (k) => productName(k as never) },
  mes: { title: 'Horas por mês', header: 'Mês', key: (r) => r.month, label: (k) => fmtMonth(k) },
}

function columnsFor(header: string): Column<GroupTotal>[] {
  return [
    { key: 'label', header, sortValue: (r) => r.key, csv: (r) => r.label, render: (r) => <span className="font-medium">{r.label}</span> },
    { key: 'planned', header: 'Horas previstas', align: 'right', sortValue: (r) => r.planned, render: (r) => fmtHours(r.planned) },
    { key: 'actual', header: 'Horas realizadas', align: 'right', sortValue: (r) => r.actual, render: (r) => fmtHours(r.actual) },
    { key: 'balance', header: 'Saldo', align: 'right', sortValue: (r) => r.balance, render: (r) => <span className={r.balance !== null && r.balance < 0 ? 'text-destructive' : undefined}>{fmtHours(r.balance)}</span> },
    { key: 'progress', header: 'Previsto x realizado', sortValue: (r) => r.progress, csv: (r) => (r.progress === null ? null : Math.round(r.progress)), render: (r) => <ProgressBar value={r.progress} /> },
  ]
}

export function ReportsView() {
  const { state, set, filter } = useRecordFilters()
  const [kind, setKind] = useState<ReportKind>('projeto')
  const report = REPORTS[kind]
  const records = filterRecords(filter)
  const rows = totalsBy(records, report.key, report.label)
  const columns = columnsFor(report.header)
  const planned = sumPlanned(records)
  const actual = sumActual(records)

  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Consolidações exportáveis em CSV (separador ponto e vírgula, compatível com Excel em português)."
        actions={<CsvButton onClick={() => exportCsv(`relatorio-${kind}-${state.monthFrom}-${state.monthTo}.csv`, columns, rows)} />}
      />
      <FilterBar>
        <SegmentedControl
          label="Agrupar por"
          value={kind}
          onChange={setKind}
          options={[
            { value: 'projeto', label: 'Projeto' },
            { value: 'setor', label: 'Setor' },
            { value: 'produto', label: 'Produto' },
            { value: 'mes', label: 'Mês' },
          ]}
        />
        <StandardFilters state={state} set={set} />
      </FilterBar>
      <Panel title={report.title} description={`${rows.length} linhas · Previsto x realizado: ${fmtPct(percent(actual, planned))}`}>
        <DataTable
          key={kind}
          columns={columns}
          rows={rows}
          rowKey={(r) => r.key}
          initialSort={{ key: 'label', dir: 'asc' }}
          footer={
            <tr>
              <td className="px-3 py-2">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(planned)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(actual)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmtHours(balance(planned, actual))}</td>
              <td className="px-3 py-2">
                <ProgressBar value={percent(actual, planned)} />
              </td>
            </tr>
          }
        />
      </Panel>
    </>
  )
}
