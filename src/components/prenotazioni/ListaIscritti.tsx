import { PlayerCell } from '@/components/ui/PlayerCell'
import { TeamBadge } from '@/components/ui/TeamBadge'
import { TIMEZONE } from '@/lib/date'
import type { Giocatore, Id, Squadra } from '@/lib/stats'

export interface Iscritto {
  /** Posizione assoluta nell'ordine di arrivo (1 = primo a prenotarsi). */
  posizione: number
  giocatore: Giocatore
  squadraId: Id | null
  /** ISO timestamp della prenotazione. */
  quando: string
}

const ORARIO = new Intl.DateTimeFormat('it-IT', {
  timeZone: TIMEZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/**
 * Lista pubblica degli iscritti, divisa per squadra (naturale, o quella assegnata dall'admin)
 * ma con la posizione assoluta di arrivo, perché si gioca a scorrimento.
 */
export function ListaIscritti({
  iscritti,
  squadre,
  ioId,
}: {
  iscritti: Iscritto[]
  squadre: Squadra[]
  ioId: Id | null
}) {
  const gruppi = [
    ...squadre.map((s) => ({ squadra: s as Squadra | null, righe: iscritti.filter((i) => i.squadraId === s.id) })),
    {
      squadra: null,
      righe: iscritti.filter((i) => i.squadraId === null || !squadre.some((s) => s.id === i.squadraId)),
    },
  ].filter((g) => g.righe.length)

  if (!iscritti.length) return <p className="card text-muted">Nessuno si è ancora prenotato. Fai il primo!</p>

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {gruppi.map(({ squadra, righe }) => (
        <section key={squadra?.id ?? 'senza'} className="card flex flex-col gap-2" aria-label={squadra?.nome ?? 'Senza squadra'}>
          <header className="flex items-baseline justify-between gap-2">
            <h3 className="section-title">
              {squadra ? <TeamBadge squadra={squadra} /> : <span className="text-muted">Senza squadra</span>}
            </h3>
            <span className="text-sm text-muted">{righe.length}</span>
          </header>
          <ol className="flex flex-col">
            {righe.map((r) => (
              <li
                key={r.giocatore.id}
                className={`flex items-center gap-3 border-t border-border first:border-0 ${r.giocatore.id === ioId ? 'bg-surface-2' : ''}`}
              >
                <span className="num w-8 shrink-0 text-right text-muted" aria-label={`Prenotato per ${r.posizione}°`}>
                  {r.posizione}
                </span>
                <div className="min-w-0 flex-1">
                  <PlayerCell giocatore={r.giocatore} />
                </div>
                <time dateTime={r.quando} className="shrink-0 text-xs text-muted tabular-nums">
                  {ORARIO.format(new Date(r.quando))}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
