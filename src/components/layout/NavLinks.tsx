'use client'

import { CalendarDays, ClipboardCheck, House, Megaphone, Users } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { conStagione, senzaStagione, stagioneDaPathname } from '@/lib/urls'

const VOCI = [
  { href: '/', label: 'Home', icon: House, stagionale: true },
  { href: '/partite', label: 'Partite', icon: CalendarDays, stagionale: true },
  { href: '/giocatori', label: 'Giocatori', icon: Users, stagionale: true },
  { href: '/prenotazioni', label: 'Prenota', icon: ClipboardCheck, stagionale: false },
  { href: '/comunicazioni', label: 'Avvisi', icon: Megaphone, stagionale: false },
] as const

/**
 * Mobile: tab bar fissa in basso (rispetta la safe area).
 * Desktop (≥ lg): barra orizzontale nell'header.
 * Le pagine stagionali conservano la stagione selezionata (letta dal percorso).
 */
export function NavLinks() {
  const pathname = usePathname()
  const stagione = stagioneDaPathname(pathname)
  const corrente = senzaStagione(pathname)

  return (
    <nav
      aria-label="Principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:backdrop-blur-none"
    >
      <ul className="mx-auto grid h-(--tabbar-h) max-w-[1100px] grid-cols-5 lg:flex lg:h-auto lg:gap-1">
        {VOCI.map(({ href, label, icon: Icon, stagionale }) => {
          const attiva = href === '/' ? corrente === '/' : corrente === href || corrente.startsWith(`${href}/`)
          return (
            <li key={href} className="flex">
              <Link
                href={stagionale ? conStagione(href, stagione) : href}
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
