'use client'

import { CalendarDays, House, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const VOCI = [
  { href: '/', label: 'Home', icon: House },
  { href: '/partite', label: 'Partite', icon: CalendarDays },
  { href: '/giocatori', label: 'Giocatori', icon: Users },
] as const

/**
 * Mobile: tab bar fissa in basso (rispetta la safe area).
 * Desktop (≥ lg): barra orizzontale nell'header.
 * I link conservano la stagione selezionata.
 */
export function NavLinks() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const stagione = searchParams.get('stagione')
  const query = stagione ? `?stagione=${encodeURIComponent(stagione)}` : ''

  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:backdrop-blur-none"
    >
      <ul className="mx-auto grid h-(--tabbar-h) max-w-[1100px] grid-cols-3 lg:flex lg:h-auto lg:gap-1">
        {VOCI.map(({ href, label, icon: Icon }) => {
          const attiva = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
          return (
            <li key={href} className="flex">
              <Link
                href={`${href}${query}`}
                aria-current={attiva ? 'page' : undefined}
                className={`flex w-full flex-col items-center justify-center gap-1 text-[11px] font-semibold uppercase tracking-wide lg:min-h-11 lg:flex-row lg:gap-2 lg:rounded-full lg:px-4 lg:text-sm lg:normal-case lg:tracking-normal ${
                  attiva ? 'text-accent lg:bg-surface-2' : 'text-muted hover:text-text'
                }`}
              >
                <Icon className="h-6 w-6 lg:h-4 lg:w-4" aria-hidden="true" />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
