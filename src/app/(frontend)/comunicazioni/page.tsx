import config from '@payload-config'
import { Megaphone } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import { EmptyState } from '@/components/ui/EmptyState'
import { Markdown } from '@/components/ui/Markdown'
import { formatDataOra } from '@/lib/date'

export const metadata: Metadata = { title: 'Comunicazioni' }
// Le notifiche portano qui: la lista dev'essere sempre aggiornata, quindi niente cache.
export const dynamic = 'force-dynamic'

export default async function ComunicazioniPage() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'comunicazioni', sort: '-createdAt', depth: 0, limit: 50 })

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="section-title">Comunicazioni</h1>
        <p className="text-sm text-muted">Gli avvisi inviati a tutti, dal più recente.</p>
      </header>

      {docs.length === 0 ? (
        <EmptyState icon={Megaphone} message="Nessuna comunicazione per ora." />
      ) : (
        <ol className="flex flex-col gap-3">
          {docs.map((c) => (
            <li key={c.id} className="card flex flex-col gap-1.5">
              <time dateTime={c.createdAt} className="label">
                {formatDataOra(c.createdAt)}
              </time>
              {c.titolo && <h2 className="font-semibold">{c.titolo}</h2>}
              <Markdown testo={c.testo} />
            </li>
          ))}
        </ol>
      )}

      <p className="text-sm text-muted">
        Per riceverle sul telefono attiva le notifiche dalla pagina{' '}
        <Link href="/prenotazioni" className="underline hover:text-text">
          Prenota
        </Link>
        .
      </p>
    </div>
  )
}
