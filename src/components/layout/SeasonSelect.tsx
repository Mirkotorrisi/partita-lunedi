'use client'

import { ChevronDown } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

/** Dropdown stagione: scrive `?stagione=` nell'URL, che tutte le pagine leggono. */
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
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const corrente = searchParams.get('stagione')
  const valore = corrente && (corrente === tutte || stagioni.includes(corrente)) ? corrente : predefinita

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('stagione', e.target.value)
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }))
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
