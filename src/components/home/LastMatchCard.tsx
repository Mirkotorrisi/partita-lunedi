import { ChevronRight, Crown } from 'lucide-react'
import Link from 'next/link'

import { MatchScorers } from '@/components/partite/MatchScorers'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ScoreLine } from '@/components/ui/ScoreLine'
import type { Contesto } from '@/lib/data'
import { formatGiornoEsteso, formatVoto, nomeVisualizzato } from '@/lib/format'
import { migliorInCampo, type Partita } from '@/lib/stats'

/** Card dell'ultima partita: tutta la card porta al dettaglio. */
export function LastMatchCard({ partita, ctx }: { partita: Partita; ctx: Contesto }) {
  const squadraA = ctx.squadreById.get(partita.squadraAId)
  const squadraB = ctx.squadreById.get(partita.squadraBId)
  if (!squadraA || !squadraB) return null
  const migliore = migliorInCampo(partita)
  const giocatoreMigliore = migliore ? ctx.giocatoriById.get(migliore.giocatoreId) : undefined

  return (
    <Link
      href={`/partite/${partita.giorno}`}
      className="card group flex flex-col gap-4 transition-colors hover:border-muted"
      aria-label={`Ultima partita, ${formatGiornoEsteso(partita.giorno)}: ${squadraA.nome} ${partita.golA}, ${squadraB.nome} ${partita.golB}. Vai al dettaglio`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="label">Ultima partita</span>
        <span className="flex items-center gap-1 text-sm text-muted first-letter:uppercase">
          {formatGiornoEsteso(partita.giorno)}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </div>

      <ScoreLine squadraA={squadraA} squadraB={squadraB} golA={partita.golA} golB={partita.golB} size="lg" />

      <div className="grid grid-cols-2 gap-4">
        <MatchScorers partita={partita} lato="A" ctx={ctx} />
        <MatchScorers partita={partita} lato="B" ctx={ctx} />
      </div>

      {migliore && giocatoreMigliore && (
        <div className="flex items-center gap-3 border-t border-border pt-4">
          <PlayerAvatar giocatore={giocatoreMigliore} size={48} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="label flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              Migliore in campo
            </span>
            <span className="truncate font-semibold">{nomeVisualizzato(giocatoreMigliore)}</span>
          </div>
          <span className="num text-4xl leading-none text-accent" aria-label={`voto ${formatVoto(migliore.voto)}`}>
            {formatVoto(migliore.voto)}
          </span>
        </div>
      )}
    </Link>
  )
}
