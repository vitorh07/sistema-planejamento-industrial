'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  BarChart3,
  CalendarRange,
  Factory,
  FileText,
  FlaskConical,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Menu,
  Wrench,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TODAY } from '@/lib/data'
import { fmtDate } from '@/lib/calc'

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projetos', label: 'Projetos', icon: FolderKanban },
  { href: '/cronograma', label: 'Cronograma', icon: CalendarRange },
  { href: '/capacidade', label: 'Capacidade industrial', icon: Gauge },
  { href: '/ocupacao', label: 'Ocupação mensal', icon: BarChart3 },
  { href: '/horas', label: 'Fabricação e execução', icon: Wrench },
  { href: '/relatorios', label: 'Relatórios', icon: FileText },
  { href: '/teste', label: 'Teste API', icon: FlaskConical },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <div className="flex min-h-screen">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r bg-sidebar transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Factory className="size-5 text-primary" aria-hidden />
          <span className="text-sm font-semibold">PCP Industrial</span>
          <span className="ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            MVP
          </span>
          <button
            type="button"
            className="ml-1 md:hidden"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2" aria-label="Navegação principal">
          <ul className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = isActive(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground',
                      active && 'bg-sidebar-accent font-medium text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    )}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p>Dados fictícios de demonstração</p>
          <p>Data de referência: {fmtDate(TODAY)}</p>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-foreground/20 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background px-4 md:hidden">
          <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">PCP Industrial</span>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
