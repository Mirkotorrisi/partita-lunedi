import { CalendarX, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { MatchScorers } from '@/components/partite/MatchScorers'
import { EmptyState } from '@/components/ui/EmptyState'
import { ScoreLine } from '@/components/ui/ScoreLine'
import { getContesto, TUTTE_LE_STAGIONI } from '@/lib/data'
import { formatGiornoBreve, formatGiornoEsteso, formatMeseAnno, formatStagione } from '@/lib/format'
import type { Partita } from '@/lib/stats'

export const metadata: Metadata = { title: 'Partite' }

/** Partite dalla più recente, raggruppate per mese ("2026-10"). */
function perMese(partite: Partita[]): { mese: string; partite: Partita[] }[] {
  const gruppi = new Map<string, Partita[]>()
  for (const p of [...partite].reverse()) {
    const mese = p.giorno.slice(0, 7)
    gruppi.set(mese, [...(gruppi.get(mese) ?? []), p])
  }
  return [...gruppi].map(([mese, partite]) => ({ mese, partite }))
}

export default async function PartitePage({ searchParams }: PageProps<'/partite'>) {
  const { stagione } = await searchParams
  const ctx = await getContesto(stagione)
  // Il dettaglio conserva la stagione scelta, come fa la nav.
  const query = typeof stagione === 'string' ? `?stagione=${encodeURIComponent(stagione)}` : ''
  const titolo = ctx.stagione === TUTTE_LE_STAGIONI ? 'Tutte le partite' : formatStagione(ctx.stagione)

  if (!ctx.periodo.length) {
    return <EmptyState message="Nessuna partita in questa stagione" icon={CalendarX} />
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="section-title">Partite</h1>
        <span className="text-sm text-muted">
          {titolo} · {ctx.periodo.length} {ctx.periodo.length === 1 ? 'partita' : 'partite'}
        </span>
      </header>

      {perMese(ctx.periodo).map(({ mese, partite }) => (
        <section key={mese} aria-labelledby={`mese-${mese}`} className="flex flex-col gap-3">
          <h2 id={`mese-${mese}`} className="label first-letter:uppercase">
            {formatMeseAnno(`${mese}-01`)}
          </h2>
          <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {partite.map((p) => {
              const squadraA = ctx.squadreById.get(p.squadraAId)
              const squadraB = ctx.squadreById.get(p.squadraBId)
              if (!squadraA || !squadraB) return null
              return (
                <li key={p.id} className="flex">
                  <Link
                    href={`/partite/${p.giorno}${query}`}
                    className="card group flex w-full flex-col gap-3 transition-colors hover:border-muted"
                    aria-label={`${formatGiornoEsteso(p.giorno)}: ${squadraA.nome} ${p.golA}, ${squadraB.nome} ${p.golB}. Vai al dettaglio`}
                  >
                    <span className="flex items-center justify-between text-sm text-muted">
                      <time dateTime={p.giorno}>{formatGiornoBreve(p.giorno)}</time>
                      <ChevronRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </span>
                    <ScoreLine squadraA={squadraA} squadraB={squadraB} golA={p.golA} golB={p.golB} size="sm" />
                    <div className="grid grid-cols-2 gap-4">
                      <MatchScorers partita={p} lato="A" ctx={ctx} className="text-xs text-muted" />
                      <MatchScorers partita={p} lato="B" ctx={ctx} className="text-xs text-muted" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
