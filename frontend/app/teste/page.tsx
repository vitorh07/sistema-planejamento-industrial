'use client'

import { useEffect, useState } from 'react'

type Row = Record<string, unknown>

export default function TestePage() {
  const [rows, setRows] = useState<Row[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('http://127.0.0.1:8000/dados')
      .then((res) => {
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`)
        return res.json()
      })
      .then((data: Row[]) => {
        setRows(data)
        if (data.length > 0) setColumns(Object.keys(data[0]))
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        Carregando dados da API…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <strong>Erro ao buscar dados:</strong> {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Nenhum dado retornado pela API.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Teste de consumo da API</h1>
        <p className="text-sm text-muted-foreground">
          Endpoint: <code className="rounded bg-muted px-1 py-0.5 text-xs">GET http://127.0.0.1:8000/dados</code>
          {' · '}
          <span>{rows.length} registro(s)</span>
        </p>
      </div>

      <div className="overflow-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="whitespace-nowrap border-b px-4 py-2.5 text-left font-medium text-muted-foreground"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                {columns.map((col) => (
                  <td key={col} className="whitespace-nowrap px-4 py-2 text-foreground">
                    {row[col] == null ? (
                      <span className="text-muted-foreground/50">—</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
