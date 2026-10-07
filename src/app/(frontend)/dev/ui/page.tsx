import { CalendarX, Crown } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BallIcon } from '@/components/ui/BallIcon'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { PlayerCell } from '@/components/ui/PlayerCell'
import { ResultBadge } from '@/components/ui/ResultBadge'
import { ScoreLine } from '@/components/ui/ScoreLine'
import { SegmentedBar } from '@/components/ui/SegmentedBar'
import { SkeletonCard, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton'
import { SortableTable, type RigaTabella } from '@/components/ui/SortableTable'
import { StatTile } from '@/components/ui/StatTile'
import { TeamBadge } from '@/components/ui/TeamBadge'
import { VoteChip } from '@/components/ui/VoteChip'
import { getContesto } from '@/lib/data'
import { formatMedia, formatPercentuale } from '@/lib/format'
import { classificaMarcatori, riepilogo, statsGiocatore, statsTutti } from '@/lib/stats'

export const metadata: Metadata = { title: 'UI kit', robots: { index: false } }

function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="section-title">{titolo}</h2>
      {children}
    </section>
  )
}

const TOKEN = [
  'bg',
  'surface',
  'surface-2',
  'border',
  'text',
  'text-muted',
  'accent',
  'accent-2',
  'win',
  'draw',
  'loss',
] as const
const PALETTE = ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-7', 'chart-8', 'chart-altri']

export default async function DevUiPage({ searchParams }: PageProps<'/dev/ui'>) {
  if (process.env.NODE_ENV === 'production') notFound()

  const { stagione } = await searchParams
  const ctx = await getContesto(stagione)
  const [rossi, blu] = ctx.squadre
  const giocatori = ctx.giocatori
  const esempio = giocatori.find((g) => g.soprannome) ?? giocatori[0]
  const senzaSoprannome = giocatori.find((g) => !g.soprannome) ?? giocatori[0]
  const stats = statsTutti(ctx.periodo)
  const tot = riepilogo(ctx.periodo)
  const sEsempio = esempio ? statsGiocatore(ctx.periodo, esempio.id) : null

  const righe: RigaTabella[] = classificaMarcatori(stats).flatMap(({ posizione, stats: s }) => {
    const g = ctx.giocatoriById.get(s.giocatoreId)
    if (!g) return []
    return [
      {
        id: g.id,
        posizione,
        cells: {
          giocatore: { sort: g.cognome, display: <PlayerCell giocatore={g} /> },
          gol: { sort: s.gol, display: <span className="num text-lg">{s.gol}</span> },
          presenze: { sort: s.presenze, display: s.presenze },
          mediaGol: { sort: s.mediaGol, display: formatMedia(s.mediaGol) },
        },
      },
    ]
  })

  if (!rossi || !blu || !esempio || !senzaSoprannome) {
    return <EmptyState message="Servono i dati del seed: esegui pnpm seed" />
  }

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <span className="label">Sviluppo</span>
        <h1 className="num text-5xl uppercase">UI kit</h1>
        <p className="text-muted">Tutti i componenti condivisi, con i dati del seed ({ctx.stagione}).</p>
      </header>

      <Sezione titolo="Colori">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {TOKEN.map((t) => (
            <div key={t} className="flex flex-col gap-1.5">
              <div className="h-12 rounded-lg border border-border" style={{ background: `var(--${t})` }} />
              <code className="text-xs text-muted">--{t}</code>
            </div>
          ))}
        </div>
        <span className="label mt-2">Palette grafici</span>
        <div className="flex flex-wrap gap-2">
          {PALETTE.map((t) => (
            <div key={t} className="flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full" style={{ background: `var(--${t})` }} />
              <code className="text-[10px] text-muted">{t.replace('chart-', '')}</code>
            </div>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="Tipografia">
        <div className="card flex flex-col gap-3">
          <span className="num text-6xl text-accent">5–4</span>
          <span className="num text-5xl">48px Barlow</span>
          <span className="section-title">Titolo sezione 20px</span>
          <p>Testo Inter 15px: la partita del lunedì, con risultati e pagelle.</p>
          <p className="text-sm">Testo Inter 14px per tabelle ed elenchi.</p>
          <span className="label">Etichetta 12px muted</span>
        </div>
      </Sezione>

      <Sezione titolo="PlayerAvatar">
        <div className="card flex items-end gap-4">
          <PlayerAvatar giocatore={esempio} size={32} />
          <PlayerAvatar giocatore={esempio} size={48} />
          <PlayerAvatar giocatore={esempio} size={96} />
          <p className="text-sm text-muted">Senza foto mostra le iniziali. Le foto si caricano dall&apos;admin.</p>
        </div>
      </Sezione>

      <Sezione titolo="PlayerCell">
        <div className="card flex flex-col gap-1">
          <PlayerCell giocatore={esempio} />
          <PlayerCell giocatore={senzaSoprannome} />
          <PlayerCell
            giocatore={esempio}
            trailing={<Crown className="h-3.5 w-3.5 text-accent" aria-label="Migliore in campo" />}
          />
          <PlayerCell giocatore={senzaSoprannome} muted />
        </div>
      </Sezione>

      <Sezione titolo="StatTile">
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Partite" value={tot.partite} />
          <StatTile label="Gol totali" value={tot.golTotali} />
          <StatTile label="Media gol" value={formatMedia(tot.mediaGolPartita)} sub="a partita" />
        </div>
        {sEsempio && (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Media voto" value={formatMedia(sEsempio.mediaVoto)} highlight />
            <StatTile label="% vittorie" value={formatPercentuale(sEsempio.percVittorie)} />
          </div>
        )}
      </Sezione>

      <Sezione titolo="ResultBadge · VoteChip · TeamBadge · BallIcon">
        <div className="card flex flex-wrap items-center gap-4">
          <ResultBadge esito="V" />
          <ResultBadge esito="N" />
          <ResultBadge esito="P" />
          <span className="h-6 w-px bg-border" />
          <VoteChip voto={8} />
          <VoteChip voto={7} />
          <VoteChip voto={6.5} />
          <VoteChip voto={6} />
          <VoteChip voto={5.5} />
          <VoteChip voto={null} />
          <span className="h-6 w-px bg-border" />
          <TeamBadge squadra={rossi} />
          <TeamBadge squadra={blu} muted />
          <span className="h-6 w-px bg-border" />
          <span className="inline-flex items-center gap-1 text-sm">
            <BallIcon className="h-4 w-4" />
            <span className="num text-base">×2</span>
          </span>
        </div>
      </Sezione>

      <Sezione titolo="ScoreLine">
        <div className="card flex flex-col gap-6">
          <ScoreLine squadraA={rossi} squadraB={blu} golA={5} golB={4} size="lg" />
          <ScoreLine squadraA={rossi} squadraB={blu} golA={3} golB={3} size="md" />
          <ScoreLine squadraA={rossi} squadraB={blu} golA={2} golB={6} size="sm" />
        </div>
      </Sezione>

      <Sezione titolo="SegmentedBar">
        <div className="card flex flex-col gap-6">
          {sEsempio && (
            <SegmentedBar
              segmenti={[
                { label: 'V', value: sEsempio.vittorie, color: 'var(--win)' },
                { label: 'N', value: sEsempio.pareggi, color: 'var(--draw)' },
                { label: 'P', value: sEsempio.sconfitte, color: 'var(--loss)' },
              ]}
            />
          )}
          <SegmentedBar
            segmenti={[
              { label: rossi.nome, value: 6, color: rossi.colore },
              { label: 'Pareggi', value: 2, color: 'var(--text-muted)' },
              { label: blu.nome, value: 8, color: blu.colore },
            ]}
          />
        </div>
      </Sezione>

      <Sezione titolo="SortableTable">
        <div className="card">
          <SortableTable
            caption="Classifica marcatori"
            colonne={[
              { key: 'giocatore', label: 'Giocatore', sortable: true, primaDirezione: 'asc' },
              { key: 'gol', label: 'Gol', align: 'right', sortable: true },
              { key: 'presenze', label: 'PG', title: 'Partite giocate', align: 'right', sortable: true },
              { key: 'mediaGol', label: 'G/P', title: 'Media gol a partita', align: 'right', sortable: true },
            ]}
            righe={righe}
            ordinamentoIniziale={{ key: 'gol', direzione: 'desc' }}
            limite={5}
          />
        </div>
      </Sezione>

      <Sezione titolo="EmptyState">
        <EmptyState message="Nessuna partita in questa stagione" icon={CalendarX} />
      </Sezione>

      <Sezione titolo="Skeleton">
        <div className="grid gap-3 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonTable rows={4} />
          <SkeletonChart height={160} />
        </div>
      </Sezione>
    </div>
  )
}
