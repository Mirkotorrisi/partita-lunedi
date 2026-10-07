'use client'

import { Search, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/ui/EmptyState'
import { PlayerCell } from '@/components/ui/PlayerCell'
import { SortableTable, type RigaTabella } from '@/components/ui/SortableTable'
import { TeamBadge } from '@/components/ui/TeamBadge'
import { formatMedia, formatPercentuale, nomeVisualizzato, RUOLO_BREVE, RUOLO_ESTESO } from '@/lib/format'
import type { Giocatore, Id, Ruolo, Squadra } from '@/lib/stats'

export interface VoceGiocatore {
  giocatore: Giocatore
  presenze: number
  gol: number
  mediaVoto: number | null
  percVittorie: number
}

const RUOLI = Object.keys(RUOLO_BREVE) as Ruolo[]

/** Minuscolo e senza accenti: "Niccolò" si trova anche scrivendo "nicco". */
const normalizza = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

function Chip({
  attivo,
  onClick,
  children,
  title,
}: {
  attivo: boolean
  onClick: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={attivo}
      onClick={onClick}
      title={title}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors ${
        attivo ? 'border-accent bg-accent text-bg' : 'border-border bg-surface-2 text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

/** Elenco giocatori con ricerca, filtro per ruolo e squadra abituale, e tabella ordinabile. */
export function PlayerList({ voci, squadre }: { voci: VoceGiocatore[]; squadre: Squadra[] }) {
  const [testo, setTesto] = useState('')
  const [ruolo, setRuolo] = useState<Ruolo | null>(null)
  const [squadraId, setSquadraId] = useState<Id | null>(null)
  const [ancheExRosa, setAncheExRosa] = useState(false)

  const filtrate = useMemo(() => {
    const cerca = normalizza(testo.trim())
    return voci.filter(({ giocatore: g }) => {
      if (!ancheExRosa && !g.attivo) return false
      if (ruolo && g.ruolo !== ruolo) return false
      if (squadraId !== null && g.squadraAbitualeId !== squadraId) return false
      return !cerca || normalizza(`${g.nome} ${g.cognome} ${g.soprannome ?? ''}`).includes(cerca)
    })
  }, [voci, testo, ruolo, squadraId, ancheExRosa])

  const exRosa = voci.filter((v) => !v.giocatore.attivo).length

  const righe: RigaTabella[] = filtrate.map(({ giocatore: g, presenze, gol, mediaVoto, percVittorie }) => {
    const squadra = g.squadraAbitualeId !== null ? squadre.find((s) => s.id === g.squadraAbitualeId) : undefined
    const assente = presenze === 0
    return {
      id: String(g.id),
      muted: assente,
      cells: {
        giocatore: { sort: nomeVisualizzato(g), display: <PlayerCell giocatore={g} muted={!g.attivo} /> },
        squadra: { sort: squadra?.nome ?? null, display: squadra ? <TeamBadge squadra={squadra} muted /> : '–' },
        presenze: { sort: presenze, display: presenze },
        gol: { sort: gol, display: gol },
        media: {
          sort: mediaVoto,
          display: <span className={`num text-base ${assente ? '' : 'text-text'}`}>{formatMedia(mediaVoto)}</span>,
        },
        vittorie: { sort: assente ? null : percVittorie, display: assente ? '–' : formatPercentuale(percVittorie) },
      },
    }
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <label className="relative flex items-center">
          <span className="sr-only">Cerca giocatore</span>
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Cerca per nome o soprannome"
            className="min-h-11 w-full rounded-full border border-border bg-surface-2 py-2 pr-4 pl-10 text-base text-text placeholder:text-muted lg:max-w-sm"
          />
        </label>

        <div className="flex flex-col gap-2 lg:flex-row">
          <div role="group" aria-label="Ruolo" className="flex flex-wrap gap-2">
            <Chip attivo={ruolo === null} onClick={() => setRuolo(null)}>
              Tutti
            </Chip>
            {RUOLI.map((r) => (
              <Chip key={r} attivo={ruolo === r} onClick={() => setRuolo(ruolo === r ? null : r)} title={RUOLO_ESTESO[r]}>
                {RUOLO_BREVE[r]}
              </Chip>
            ))}
          </div>
          <span className="mx-1 hidden w-px shrink-0 self-stretch bg-border lg:block" aria-hidden="true" />
          <div role="group" aria-label="Squadra abituale" className="flex flex-wrap gap-2">
            {squadre.map((s) => (
              <Chip key={String(s.id)} attivo={squadraId === s.id} onClick={() => setSquadraId(squadraId === s.id ? null : s.id)}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.colore }} aria-hidden="true" />
                {s.nome}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-muted">
          <span aria-live="polite" className="whitespace-nowrap">
            {filtrate.length} {filtrate.length === 1 ? 'giocatore' : 'giocatori'}
          </span>
          {exRosa > 0 && (
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={ancheExRosa}
                onChange={(e) => setAncheExRosa(e.target.checked)}
                className="h-4 w-4 accent-(--accent)"
              />
              Includi chi non è più in rosa ({exRosa})
            </label>
          )}
        </div>
      </div>

      {righe.length ? (
        <div className="card">
          <SortableTable
            caption="Giocatori: squadra abituale, presenze, gol, media voto e percentuale di vittorie"
            colonne={[
              { key: 'giocatore', label: 'Giocatore', sortable: true, primaDirezione: 'asc' },
              { key: 'squadra', label: 'Squadra', sortable: true, primaDirezione: 'asc', className: 'hidden sm:table-cell' },
              { key: 'presenze', label: 'PG', title: 'Partite giocate', align: 'right', sortable: true },
              { key: 'gol', label: 'Gol', align: 'right', sortable: true },
              { key: 'media', label: 'MV', title: 'Media voto', align: 'right', sortable: true },
              { key: 'vittorie', label: '%V', title: 'Percentuale di vittorie', align: 'right', sortable: true },
            ]}
            righe={righe}
            ordinamentoIniziale={{ key: 'presenze', direzione: 'desc' }}
            mostraPosizione={false}
          />
        </div>
      ) : (
        <EmptyState message="Nessun giocatore corrisponde ai filtri" icon={UserX} />
      )}
    </div>
  )
}
