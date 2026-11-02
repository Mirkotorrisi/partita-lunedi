import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { Prenotazioni } from '@/components/prenotazioni/Prenotazioni'
import type { GiocatoreScelta } from '@/components/prenotazioni/AreaGiocatore'
import type { Iscritto } from '@/components/prenotazioni/ListaIscritti'
import { InstallaApp } from '@/components/pwa/InstallaApp'
import { getContesto } from '@/lib/data'
import { formatGiornoEsteso, nomeCompleto } from '@/lib/format'
import { dettagliPartita } from '@/lib/prenotazioni'
import { relId } from '@/lib/relations'

export const metadata: Metadata = { title: 'Prenotazioni' }
/**
 * Pagina statica, uguale per tutti: la lista si rigenera a ogni prenotazione (revalidatePath nelle
 * azioni e negli hook di Iscrizioni e Prossima partita). Chi è il visitatore lo stabilisce il client,
 * così un refresh non costa una render. L'ora serve a far scorrere il giorno se nessuno salva nulla.
 */
export const revalidate = 3600

export default async function PrenotazioniPage() {
  const payload = await getPayload({ config })
  const [{ giorno, ora, campo }, ctx] = await Promise.all([dettagliPartita(), getContesto()])
  const { docs } = await payload.find({
    collection: 'iscrizioni',
    where: { giorno: { equals: giorno } },
    sort: 'createdAt',
    depth: 0,
    pagination: false,
  })

  const iscritti = docs.flatMap((d, i): Iscritto[] => {
    const giocatore = ctx.giocatoriById.get(relId(d.giocatore) ?? '')
    if (!giocatore) return []
    return [{ posizione: i + 1, giocatore, squadraId: relId(d.squadra) ?? null, quando: d.createdAt }]
  })

  const scelta: GiocatoreScelta[] = ctx.giocatori
    .filter((g) => g.attivo && typeof g.id === 'number')
    .map((g) => ({
      id: g.id as number,
      nome: nomeCompleto(g),
      soprannome: g.soprannome,
      numeroMaglia: g.numeroMaglia,
      anagrafica: { nome: g.nome, cognome: g.cognome, fotoUrl: g.fotoUrl },
    }))

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="section-title">Prenotazioni</h1>
        <p className="text-sm text-muted first-letter:uppercase">
          {formatGiornoEsteso(giorno)}
          {ora && ` · ore ${ora}`} · {iscritti.length} {iscritti.length === 1 ? 'iscritto' : 'iscritti'}
        </p>
        {campo && <p className="text-sm">Campo: {campo}</p>}
      </header>

      <Prenotazioni giocatori={scelta} iscritti={iscritti} squadre={ctx.squadre} installaApp={<InstallaApp />} />
    </div>
  )
}
