import Link from 'next/link'

import { nomeVisualizzato, RUOLO_BREVE, RUOLO_ESTESO } from '@/lib/format'
import type { Giocatore } from '@/lib/stats'

import { PlayerAvatar } from './PlayerAvatar'

/** Avatar + nome (o soprannome) + numero di maglia e ruolo abbreviato. Tutta la cella è un link alla scheda. */
export function PlayerCell({
  giocatore,
  muted = false,
  trailing,
}: {
  giocatore: Giocatore
  muted?: boolean
  /** Contenuto extra subito dopo il nome (es. icona "migliore in campo"). */
  trailing?: React.ReactNode
}) {
  return (
    <Link
      href={`/giocatori/${giocatore.slug}`}
      className={`group flex min-h-11 min-w-0 items-center gap-2.5 py-1 ${muted ? 'opacity-60' : ''}`}
    >
      <PlayerAvatar giocatore={giocatore} size={32} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate font-medium group-hover:underline">{nomeVisualizzato(giocatore)}</span>
          {trailing}
        </span>
        <span className="text-xs text-muted">
          {giocatore.numeroMaglia !== null && (
            <>
              <span className="tabular-nums" aria-label={`numero ${giocatore.numeroMaglia}`}>
                #{giocatore.numeroMaglia}
              </span>
              <span aria-hidden="true"> · </span>
            </>
          )}
          <abbr title={RUOLO_ESTESO[giocatore.ruolo]} className="no-underline">
            {RUOLO_BREVE[giocatore.ruolo]}
          </abbr>
        </span>
      </span>
    </Link>
  )
}
