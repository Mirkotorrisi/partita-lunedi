import config from '@payload-config'
import type { Metadata } from 'next'
import { getPayload } from 'payload'

import { AreaGiocatore, type Io } from '@/components/prenotazioni/AreaGiocatore'
import { InstallaApp } from '@/components/pwa/InstallaApp'
import { ListaIscritti, type Iscritto } from '@/components/prenotazioni/ListaIscritti'
import { getContesto } from '@/lib/data'
import { formatGiornoEsteso, nomeCompleto } from '@/lib/format'
import { dettagliPartita, dispositivoCorrente } from '@/lib/prenotazioni'
import { relId } from '@/lib/relations'

export const metadata: Metadata = { title: 'Prenotazioni' }
// Lista sempre fresca: le prenotazioni non passano dalla cache del dataset.
export const dynamic = 'force-dynamic'

export default async function PrenotazioniPage() {
  const payload = await getPayload({ config })
  const [{ giorno, ora, campo }, ctx, dispositivo] = await Promise.all([dettagliPartita(), getContesto(), dispositivoCorrente()])
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

  const ioId = dispositivo ? relId(dispositivo.giocatore) : undefined
  const me = ioId !== undefined ? ctx.giocatoriById.get(ioId) : undefined
  const io: Io | null =
    me && typeof me.id === 'number'
      ? {
          id: me.id,
          nome: nomeCompleto(me),
          soprannome: me.soprannome,
          numeroMaglia: me.numeroMaglia,
          iscritto: iscritti.some((i) => i.giocatore.id === me.id),
          anagrafica: { nome: me.nome, cognome: me.cognome, fotoUrl: me.fotoUrl },
        }
      : null

  const scelta = ctx.giocatori
    .filter((g) => g.attivo && typeof g.id === 'number')
    .map((g) => ({ id: g.id as number, nome: nomeCompleto(g), soprannome: g.soprannome }))

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

      <AreaGiocatore io={io} giocatori={scelta} />
      <InstallaApp />

      <section aria-labelledby="lista" className="flex flex-col gap-3">
        <h2 id="lista" className="label">
          Lista in ordine di arrivo
        </h2>
        <ListaIscritti iscritti={iscritti} squadre={ctx.squadre} ioId={io?.id ?? null} />
      </section>
    </div>
  )
}
