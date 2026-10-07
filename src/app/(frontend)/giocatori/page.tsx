import type { Metadata } from 'next'

import { PlayerList, type VoceGiocatore } from '@/components/giocatori/PlayerList'
import { getContesto, TUTTE_LE_STAGIONI } from '@/lib/data'
import { formatStagione } from '@/lib/format'
import { statsGiocatore } from '@/lib/stats'

export const metadata: Metadata = { title: 'Giocatori' }

export default async function GiocatoriPage({ searchParams }: PageProps<'/giocatori'>) {
  const { stagione } = await searchParams
  const ctx = await getContesto(stagione)
  const periodo = ctx.stagione === TUTTE_LE_STAGIONI ? 'Tutte le stagioni' : formatStagione(ctx.stagione)

  // Tutta la rosa, anche chi non ha presenze nel periodo: in tabella resta in grigio.
  const voci: VoceGiocatore[] = ctx.giocatori.map((giocatore) => {
    const s = statsGiocatore(ctx.periodo, giocatore.id)
    return { giocatore, presenze: s.presenze, gol: s.gol, mediaVoto: s.mediaVoto, percVittorie: s.percVittorie }
  })

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <header className="flex items-baseline justify-between gap-2">
        <h1 className="section-title">Giocatori</h1>
        <span className="text-sm text-muted">{periodo}</span>
      </header>
      <PlayerList voci={voci} squadre={ctx.squadre} />
    </div>
  )
}
