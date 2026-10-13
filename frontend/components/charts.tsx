'use client'

import { ResponsiveContainer } from 'recharts'
import { fmtNumber } from '@/lib/calc'

export const COLORS = {
  brand: '#C200DC',
  brandLight: '#E48CF0',
  dark: '#3F3F46',
  gray: '#A1A1AA',
  green: '#16A34A',
  yellow: '#CA8A04',
  red: '#DC2626',
}

export const SERIES = [COLORS.brand, COLORS.dark, COLORS.brandLight, COLORS.gray, '#6B0079', '#71717A']

export const AXIS = { fontSize: 11, fill: '#5F5F66' }
export const GRID = { stroke: '#E4E4E7', strokeDasharray: '3 3' }
export const TOOLTIP_STYLE = {
  contentStyle: { fontSize: 12, borderRadius: 6, border: '1px solid #E4E4E7' },
  labelStyle: { fontWeight: 600, color: '#1A1A1A' },
}
export const LEGEND_STYLE = { fontSize: 12 }

export const hoursFormatter = (v: unknown) =>
  typeof v === 'number' ? `${fmtNumber(v)} h` : '—'
export const pctFormatter = (v: unknown) =>
  typeof v === 'number' ? `${v.toFixed(1).replace('.', ',')}%` : '—'

export function ChartBox({ height = 260, children }: { height?: number; children: React.ReactElement }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
