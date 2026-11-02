'use client'

import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { conStagione, senzaStagione, stagioneDaPathname } from '@/lib/urls'

/** Pagine che esistono anche sotto `/stagione/[stagione]`; altrove la scelta porta alla home. */
const STAGIONALI = ['/', '/partite', '/giocatori']

/**
 * Dropdown stagione: porta alla stessa pagina sotto `/stagione/[stagione]/…`. La stagione
 * predefinita (la più recente) resta sul percorso nudo, che è la pagina canonica.
 */
export function SeasonSelect({
  stagioni,
  predefinita,
  tutte,
}: {
  stagioni: string[]
  predefinita: string
  /** Valore che indica "tutte le stagioni". */
  tutte: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  const corrente = stagioneDaPathname(pathname)
  const valore = corrente && (corrente === tutte || stagioni.includes(corrente)) ? corrente : predefinita

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scelta = e.target.value
    const pagina = senzaStagione(pathname)
    const base = STAGIONALI.some((p) => pagina === p || pagina.startsWith(`${p}/`)) ? pagina : '/'
    startTransition(() => router.push(conStagione(base, scelta === predefinita ? undefined : scelta), { scroll: false }))
  }

  return (
    <label className="relative flex items-center">
      <span className="sr-only">Stagione</span>
      <select
        value={valore}
        onChange={onChange}
        aria-busy={pending}
        className={`min-h-11 appearance-none rounded-full border border-border bg-surface-2 py-2 pr-9 pl-4 text-sm font-semibold text-text ${pending ? 'opacity-60' : ''}`}
      >
        {stagioni.map((s) => (
          <option key={s} value={s}>
            {s.replace('-', '/')}
          </option>
        ))}
        <option value={tutte}>Tutte</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted" aria-hidden="true" />
    </label>
  )
}
