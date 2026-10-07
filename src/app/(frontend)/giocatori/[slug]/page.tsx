import { CalendarX, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { GolChart, VotiChart, type PuntoPartita } from '@/components/charts/PlayerTrendCharts'
import { BallIcon } from '@/components/ui/BallIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ResultBadge } from '@/components/ui/ResultBadge'
import { SegmentedBar } from '@/components/ui/SegmentedBar'
import { StatTile } from '@/components/ui/StatTile'
import { TeamBadge } from '@/components/ui/TeamBadge'
import { VoteChip } from '@/components/ui/VoteChip'
import { getContesto, getDataset, TUTTE_LE_STAGIONI } from '@/lib/data'
import {
  ESITO_ESTESO,
  formatGiornoBreve,
  formatGiornoEsteso,
  formatMedia,
  formatPercentuale,
  formatStagione,
  formatVoto,
  nomeCompleto,
  nomeVisualizzato,
  RUOLO_ESTESO,
} from '@/lib/format'
import { statsGiocatore } from '@/lib/stats'

async function trovaGiocatore(slug: string) {
  const { giocatori } = await getDataset()
  const giocatore = giocatori.find((g) => g.slug === decodeURIComponent(slug))
  if (!giocatore) notFound()
  return giocatore
}

export async function generateMetadata({ params }: PageProps<'/giocatori/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const g = await trovaGiocatore(slug)
  return {
    title: nomeVisualizzato(g),
    description: `Presenze, gol e andamento dei voti di ${nomeCompleto(g)}.`,
  }
}

export default async function GiocatorePage({ params, searchParams }: PageProps<'/giocatori/[slug]'>) {
  const [{ slug }, { stagione }] = await Promise.all([params, searchParams])
  const [giocatore, ctx] = await Promise.all([trovaGiocatore(slug), getContesto(stagione)])

  const query = typeof stagione === 'string' ? `?stagione=${encodeURIComponent(stagione)}` : ''
  const periodo = ctx.stagione === TUTTE_LE_STAGIONI ? 'Tutte le stagioni' : formatStagione(ctx.stagione)
  const s = statsGiocatore(ctx.periodo, giocatore.id)
  const squadraAbituale = giocatore.squadraAbitualeId ? ctx.squadreById.get(giocatore.squadraAbitualeId) : undefined
  const nomeSquadra = (id: typeof giocatore.id) => ctx.squadreById.get(id)?.nome ?? '?'

  const punti: PuntoPartita[] = s.andamento.map((p) => ({
    giorno: p.giorno,
    etichetta: formatGiornoBreve(p.giorno),
    data: formatGiornoEsteso(p.giorno),
    squadra: nomeSquadra(p.squadraId),
    avversario: nomeSquadra(p.avversarioId),
    risultato: `${p.golFatti}–${p.golSubiti}`,
    esitoEsteso: ESITO_ESTESO[p.esito],
    voto: p.voto,
    mediaMobile: p.mediaMobile5,
    gol: p.gol,
  }))

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="card flex items-center gap-4">
        <PlayerAvatar giocatore={giocatore} size={96} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-display text-3xl leading-none font-bold uppercase sm:text-4xl">
            {nomeVisualizzato(giocatore)}
          </h1>
          {giocatore.soprannome && <span className="text-sm text-muted">{nomeCompleto(giocatore)}</span>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="label">{RUOLO_ESTESO[giocatore.ruolo]}</span>
            {squadraAbituale && <TeamBadge squadra={squadraAbituale} />}
            {!giocatore.attivo && <span className="text-xs text-muted">Non più in rosa</span>}
          </div>
        </div>
        {giocatore.numeroMaglia !== null && (
          <span
            className="num ml-auto shrink-0 self-start text-5xl leading-none text-muted sm:text-7xl"
            aria-label={`Numero di maglia ${giocatore.numeroMaglia}`}
          >
            {giocatore.numeroMaglia}
          </span>
        )}
      </header>

      {s.presenze === 0 ? (
        <EmptyState message={`Nessuna presenza · ${periodo}`} icon={CalendarX} />
      ) : (
        <>
          <section aria-labelledby="numeri" className="flex flex-col gap-3">
            <h2 id="numeri" className="label">
              {periodo}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label="Presenze" value={s.presenze} sub={`su ${ctx.periodo.length} partite`} />
              <StatTile label="Gol" value={s.gol} sub={`${formatMedia(s.mediaGol)} a partita`} />
              <StatTile
                label="Media voto"
                value={formatMedia(s.mediaVoto)}
                highlight
                sub={s.voti ? `max ${formatVoto(s.votoMax)} · min ${formatVoto(s.votoMin)}` : 'nessun voto'}
              />
              <StatTile label="Vittorie" value={formatPercentuale(s.percVittorie)} sub={`${s.vittorie} su ${s.presenze}`} />
            </div>
            <div className="card">
              <SegmentedBar
                segmenti={[
                  { label: 'Vinte', value: s.vittorie, color: 'var(--win)' },
                  { label: 'Pari', value: s.pareggi, color: 'var(--draw)' },
                  { label: 'Perse', value: s.sconfitte, color: 'var(--loss)' },
                ]}
              />
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            <section aria-labelledby="andamento" className="card flex min-w-0 flex-col gap-3">
              <h2 id="andamento" className="section-title">
                Andamento voti
              </h2>
              {s.voti ? <VotiChart punti={punti} /> : <p className="text-muted">Nessun voto ancora.</p>}
            </section>
            <section aria-labelledby="gol" className="card flex min-w-0 flex-col gap-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id="gol" className="section-title">
                  Gol per partita
                </h2>
                <span className="text-sm text-muted">
                  <span className="num text-base text-text">{s.gol}</span> totali
                </span>
              </div>
              <GolChart punti={punti} />
            </section>
          </div>

          <section aria-labelledby="partite" className="card flex flex-col gap-2">
            <h2 id="partite" className="section-title">
              Partita per partita
            </h2>
            <ul className="flex flex-col">
              {[...s.andamento].reverse().map((p) => {
                const squadra = ctx.squadreById.get(p.squadraId)
                return (
                  <li key={String(p.partitaId)} className="border-b border-border last:border-0">
                    <Link
                      href={`/partite/${p.giorno}${query}`}
                      className="group flex min-h-12 items-center gap-3 py-1.5"
                      aria-label={`${formatGiornoEsteso(p.giorno)}: ${ESITO_ESTESO[p.esito]} ${p.golFatti}–${p.golSubiti} contro ${nomeSquadra(p.avversarioId)}, ${p.gol} gol, voto ${p.voto === null ? 'assente' : formatVoto(p.voto)}`}
                    >
                      <time dateTime={p.giorno} className="w-14 shrink-0 text-sm text-muted">
                        {formatGiornoBreve(p.giorno)}
                      </time>
                      <ResultBadge esito={p.esito} />
                      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                        {squadra && <TeamBadge squadra={squadra} className="max-w-[45%]" />}
                        <span className="num shrink-0 text-base">
                          {p.golFatti}–{p.golSubiti}
                        </span>
                        <span className="truncate text-muted">{nomeSquadra(p.avversarioId)}</span>
                      </span>
                      {p.gol > 0 && (
                        <span className="flex shrink-0 items-center gap-1 text-muted">
                          <BallIcon className="h-3.5 w-3.5" />
                          <span className="num text-base text-text">{p.gol}</span>
                        </span>
                      )}
                      <VoteChip voto={p.voto} />
                      <ChevronRight
                        className="hidden h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 sm:block"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  )
}
