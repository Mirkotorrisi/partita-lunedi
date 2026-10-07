import { ChevronLeft, ChevronRight, Crown } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { MatchScorers } from '@/components/partite/MatchScorers'
import { BallIcon } from '@/components/ui/BallIcon'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { PlayerCell } from '@/components/ui/PlayerCell'
import { ScoreLine } from '@/components/ui/ScoreLine'
import { VoteChip } from '@/components/ui/VoteChip'
import { getContesto, type Contesto } from '@/lib/data'
import { formatGiornoBreve, formatGiornoEsteso, formatMedia, formatVoto, nomeVisualizzato } from '@/lib/format'
import { migliorInCampo, type Id, type Lato, type Partita, type Riga, type Ruolo } from '@/lib/stats'

const GIORNO = /^\d{4}-\d{2}-\d{2}$/

/** Cerca su tutto lo storico: il link al dettaglio vale a prescindere dalla stagione selezionata. */
async function trovaPartita(giorno: string) {
  if (!GIORNO.test(giorno)) notFound()
  const ctx = await getContesto()
  const indice = ctx.partite.findIndex((p) => p.giorno === giorno)
  if (indice === -1) notFound()
  return {
    ctx,
    partita: ctx.partite[indice],
    precedente: ctx.partite[indice - 1],
    successiva: ctx.partite[indice + 1],
  }
}

export async function generateMetadata({ params }: PageProps<'/partite/[giorno]'>): Promise<Metadata> {
  const { giorno } = await params
  const { ctx, partita } = await trovaPartita(giorno)
  const a = ctx.squadreById.get(partita.squadraAId)?.nome ?? 'A'
  const b = ctx.squadreById.get(partita.squadraBId)?.nome ?? 'B'
  return {
    title: `${a} ${partita.golA}–${partita.golB} ${b} · ${formatGiornoBreve(partita.giorno)}`,
    description: `Marcatori e pagelle della partita di ${formatGiornoEsteso(partita.giorno)}.`,
  }
}

const ORDINE_RUOLI: Ruolo[] = ['portiere', 'difensore', 'centrocampista', 'attaccante']

/** Per ruolo, dal portiere agli attaccanti; nello stesso ruolo voto più alto in cima (senza voto in fondo), poi chi ha segnato di più. */
const ordinaPagella = (righe: Riga[], giocatori: Contesto['giocatoriById']) => {
  const ruolo = (r: Riga) => {
    const g = giocatori.get(r.giocatoreId)
    return g ? ORDINE_RUOLI.indexOf(g.ruolo) : ORDINE_RUOLI.length
  }
  return [...righe].sort(
    (x, y) => ruolo(x) - ruolo(y) || (y.voto ?? -1) - (x.voto ?? -1) || y.gol - x.gol,
  )
}

const mediaVoti = (righe: Riga[]) => {
  const voti = righe.map((r) => r.voto).filter((v): v is number => v !== null)
  return voti.length ? voti.reduce((t, v) => t + v, 0) / voti.length : null
}

function Pagella({
  partita,
  lato,
  ctx,
  migliore,
}: {
  partita: Partita
  lato: Lato
  ctx: Contesto
  migliore: Id | null
}) {
  const squadra = ctx.squadreById.get(lato === 'A' ? partita.squadraAId : partita.squadraBId)
  const righe = lato === 'A' ? partita.formazioneA : partita.formazioneB
  if (!squadra) return null
  const id = `pagella-${lato}`

  return (
    <section aria-labelledby={id} className="card flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className="section-title flex min-w-0 items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: squadra.colore }} aria-hidden="true" />
          <span className="truncate">{squadra.nome}</span>
        </h2>
        <span className="shrink-0 text-sm text-muted">
          Media <span className="num text-base text-text">{formatMedia(mediaVoti(righe))}</span>
        </span>
      </div>

      {righe.length ? (
        <ul className="flex flex-col">
          {ordinaPagella(righe, ctx.giocatoriById).map((r) => {
            const g = ctx.giocatoriById.get(r.giocatoreId)
            if (!g) return null
            const mvp = r.giocatoreId === migliore
            return (
              <li
                key={String(r.giocatoreId)}
                className="flex items-center gap-3 border-b border-border py-1 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <PlayerCell
                    giocatore={g}
                    trailing={
                      mvp ? (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Migliore in campo" />
                      ) : undefined
                    }
                  />
                </div>
                {r.gol > 0 && (
                  <span className="flex shrink-0 items-center gap-1 text-sm text-muted">
                    <BallIcon className="h-3.5 w-3.5" />
                    <span className="num text-base text-text">{r.gol}</span>
                    <span className="sr-only">gol</span>
                  </span>
                )}
                <VoteChip voto={r.voto} />
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-muted">Formazione non inserita.</p>
      )}
    </section>
  )
}

export default async function PartitaPage({ params, searchParams }: PageProps<'/partite/[giorno]'>) {
  const [{ giorno }, { stagione }] = await Promise.all([params, searchParams])
  const { ctx, partita, precedente, successiva } = await trovaPartita(giorno)
  const squadraA = ctx.squadreById.get(partita.squadraAId)
  const squadraB = ctx.squadreById.get(partita.squadraBId)
  if (!squadraA || !squadraB) notFound()

  const query = typeof stagione === 'string' ? `?stagione=${encodeURIComponent(stagione)}` : ''
  const migliore = migliorInCampo(partita)
  const giocatoreMigliore = migliore ? ctx.giocatoriById.get(migliore.giocatoreId) : undefined
  const haMarcatori = partita.golA + partita.golB > 0

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <Link
        href={`/partite${query}`}
        className="-ml-1 flex min-h-11 items-center gap-1 self-start text-sm text-muted hover:text-text"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Tutte le partite
      </Link>

      <section aria-labelledby="risultato" className="card flex flex-col gap-4">
        <h1 id="risultato" className="label first-letter:uppercase">
          <time dateTime={partita.giorno}>{formatGiornoEsteso(partita.giorno)}</time>
        </h1>
        <ScoreLine squadraA={squadraA} squadraB={squadraB} golA={partita.golA} golB={partita.golB} size="lg" />

        {haMarcatori && (
          <div className="grid grid-cols-2 gap-4">
            <MatchScorers partita={partita} lato="A" ctx={ctx} />
            <MatchScorers partita={partita} lato="B" ctx={ctx} />
          </div>
        )}

        {migliore && giocatoreMigliore && (
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <PlayerAvatar giocatore={giocatoreMigliore} size={48} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="label flex items-center gap-1">
                <Crown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                Migliore in campo
              </span>
              <Link href={`/giocatori/${giocatoreMigliore.slug}`} className="truncate font-semibold hover:underline">
                {nomeVisualizzato(giocatoreMigliore)}
              </Link>
            </div>
            <span className="num text-4xl leading-none text-accent" aria-label={`voto ${formatVoto(migliore.voto)}`}>
              {formatVoto(migliore.voto)}
            </span>
          </div>
        )}

        {partita.note && <p className="border-t border-border pt-4 text-sm whitespace-pre-line text-muted">{partita.note}</p>}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Pagella partita={partita} lato="A" ctx={ctx} migliore={migliore?.giocatoreId ?? null} />
        <Pagella partita={partita} lato="B" ctx={ctx} migliore={migliore?.giocatoreId ?? null} />
      </div>

      {(precedente || successiva) && (
        <nav aria-label="Altre partite" className="grid grid-cols-2 gap-3">
          {precedente ? (
            <Link
              href={`/partite/${precedente.giorno}${query}`}
              className="card flex min-h-11 items-center gap-2 text-sm hover:border-muted"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
              <span className="flex flex-col">
                <span className="label">Precedente</span>
                {formatGiornoBreve(precedente.giorno)}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {successiva && (
            <Link
              href={`/partite/${successiva.giorno}${query}`}
              className="card flex min-h-11 items-center justify-end gap-2 text-right text-sm hover:border-muted"
            >
              <span className="flex flex-col">
                <span className="label">Successiva</span>
                {formatGiornoBreve(successiva.giorno)}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
            </Link>
          )}
        </nav>
      )}
    </div>
  )
}
