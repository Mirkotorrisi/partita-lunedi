import { CalendarX } from 'lucide-react'

import { CHART_ALTRI, CHART_PALETTE } from '@/components/charts/palette'
import { ScorersDonut, type FettaDonut } from '@/components/charts/ScorersDonut'
import { LastMatchCard } from '@/components/home/LastMatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerCell } from '@/components/ui/PlayerCell'
import { SortableTable, type RigaTabella } from '@/components/ui/SortableTable'
import { StatTile } from '@/components/ui/StatTile'
import { getContesto } from '@/lib/data'
import { formatMedia, formatPercentuale, formatStagione, formatVoto, nomeVisualizzato } from '@/lib/format'
import {
  classificaMarcatori,
  classificaMediaVoto,
  distribuzioneMarcatori,
  riepilogo,
  statsTutti,
  type Soglia,
} from '@/lib/stats'

const MARCATORI_IN_TORTA = 7
/** Per entrare nella classifica delle medie serve almeno il 30% delle presenze del periodo. */
const SOGLIA_MEDIE: Soglia = { tipo: 'percentuale', quota: 0.3 }

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const { stagione } = await searchParams
  const ctx = await getContesto(stagione)
  const ultima = ctx.periodo.at(-1)

  if (!ultima) {
    return <EmptyState message="Nessuna partita in questa stagione" icon={CalendarX} />
  }

  const stats = statsTutti(ctx.periodo)
  const tot = riepilogo(ctx.periodo)
  const classifica = classificaMarcatori(stats)
  const golGiocatori = classifica.reduce((t, p) => t + p.stats.gol, 0)

  const fette: FettaDonut[] = distribuzioneMarcatori(stats, MARCATORI_IN_TORTA).map((f, i) => {
    const g = f.giocatoreId !== null ? ctx.giocatoriById.get(f.giocatoreId) : undefined
    return {
      key: String(f.giocatoreId ?? 'altri'),
      nome: g ? nomeVisualizzato(g) : `Altri (${f.raggruppati})`,
      gol: f.gol,
      percentuale: formatPercentuale(f.quota),
      colore: f.giocatoreId === null ? CHART_ALTRI : CHART_PALETTE[i],
    }
  })

  const righe: RigaTabella[] = classifica.flatMap(({ posizione, stats: s }) => {
    const g = ctx.giocatoriById.get(s.giocatoreId)
    if (!g) return []
    return [
      {
        id: String(g.id),
        posizione,
        cells: {
          giocatore: { sort: nomeVisualizzato(g), display: <PlayerCell giocatore={g} /> },
          gol: { sort: s.gol, display: <span className="num text-lg">{s.gol}</span> },
          presenze: { sort: s.presenze, display: s.presenze },
          mediaGol: { sort: s.mediaGol, display: formatMedia(s.mediaGol) },
        },
      },
    ]
  })

  const medie = classificaMediaVoto(stats, SOGLIA_MEDIE, ctx.periodo.length)
  const righeMedie: RigaTabella[] = [
    ...medie.sopraSoglia.map(({ posizione, stats: s }) => ({ posizione, s, muted: false })),
    ...medie.sottoSoglia.map((s) => ({ posizione: undefined, s, muted: true })),
  ].flatMap(({ posizione, s, muted }) => {
    const g = ctx.giocatoriById.get(s.giocatoreId)
    if (!g) return []
    return [
      {
        id: String(g.id),
        posizione,
        muted,
        cells: {
          giocatore: { sort: nomeVisualizzato(g), display: <PlayerCell giocatore={g} muted={muted} /> },
          media: {
            sort: s.mediaVoto,
            display: <span className={`num text-lg ${muted ? '' : 'text-text'}`}>{formatMedia(s.mediaVoto)}</span>,
          },
          voti: { sort: s.voti, display: s.voti },
          max: { sort: s.votoMax, display: formatVoto(s.votoMax) },
          min: { sort: s.votoMin, display: formatVoto(s.votoMin) },
        },
      },
    ]
  })

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <h1 className="sr-only">Partita del lunedì — {formatStagione(ctx.stagione)}</h1>

      <LastMatchCard partita={ultima} ctx={ctx} />

      <section aria-labelledby="riepilogo" className="flex flex-col gap-3">
        <h2 id="riepilogo" className="sr-only">
          Riepilogo stagione
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <StatTile label="Partite" value={tot.partite} />
          <StatTile label="Gol totali" value={tot.golTotali} />
          <StatTile label="Gol a partita" value={formatMedia(tot.mediaGolPartita)} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <section aria-labelledby="torta" className="card flex min-w-0 flex-col gap-3">
          <h2 id="torta" className="section-title">
            Chi segna
          </h2>
          {fette.length ? (
            <ScorersDonut fette={fette} totale={golGiocatori} />
          ) : (
            <p className="text-muted">Nessun gol in questa stagione.</p>
          )}
          {tot.golTotali > golGiocatori && (
            <p className="text-xs text-muted">Esclusi {tot.golTotali - golGiocatori} autogol.</p>
          )}
        </section>

        <section aria-labelledby="marcatori" className="card flex min-w-0 flex-col gap-3 lg:col-span-2">
          <h2 id="marcatori" className="section-title">
            Classifica marcatori
          </h2>
          <SortableTable
            caption="Classifica marcatori: gol, presenze e media gol a partita"
            colonne={[
              { key: 'giocatore', label: 'Giocatore', sortable: true, primaDirezione: 'asc' },
              { key: 'gol', label: 'Gol', align: 'right', sortable: true },
              { key: 'presenze', label: 'PG', title: 'Partite giocate', align: 'right', sortable: true },
              { key: 'mediaGol', label: 'G/P', title: 'Media gol a partita', align: 'right', sortable: true },
            ]}
            righe={righe}
            ordinamentoIniziale={{ key: 'gol', direzione: 'desc' }}
            limite={10}
          />
        </section>
      </div>

      <section aria-labelledby="medie" className="card flex min-w-0 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="medie" className="section-title">
            Medie voto
          </h2>
          {medie.minimo > 0 && (
            <span className="text-xs text-muted">
              In classifica con almeno {medie.minimo} {medie.minimo === 1 ? 'presenza' : 'presenze'}
            </span>
          )}
        </div>
        {righeMedie.length ? (
          <SortableTable
            caption="Classifica media voto: media, numero di voti, voto massimo e minimo"
            colonne={[
              { key: 'giocatore', label: 'Giocatore', sortable: true, primaDirezione: 'asc' },
              { key: 'media', label: 'Media', align: 'right', sortable: true },
              { key: 'voti', label: 'Voti', title: 'Partite con voto', align: 'right', sortable: true },
              { key: 'max', label: 'Max', title: 'Voto più alto', align: 'right', sortable: true },
              { key: 'min', label: 'Min', title: 'Voto più basso', align: 'right', sortable: true },
            ]}
            righe={righeMedie}
            ordinamentoIniziale={{ key: 'media', direzione: 'desc' }}
            limite={10}
          />
        ) : (
          <p className="text-muted">Nessun voto in questa stagione.</p>
        )}
      </section>
    </div>
  )
}
