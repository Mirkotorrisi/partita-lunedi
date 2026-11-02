import { notFound } from 'next/navigation'

import { TUTTE_LE_STAGIONI } from '@/lib/cache-tags'
import { getContesto } from '@/lib/data'
import { segmentiStagione } from '@/lib/urls'

/**
 * `/stagione/[stagione]/…` replica le pagine principali per una stagione diversa da quella corrente
 * (o per "tutte"). Ogni combinazione è prerenderizzata: la scelta della stagione non costa una
 * render per richiesta. Una stagione sconosciuta è un 404.
 */
// Le stagioni sono tutte note al build: la più recente vive sul percorso nudo, le altre qui.
// Una stagione fuori lista è un 404 secco, senza render.
export const dynamicParams = false

export async function generateStaticParams() {
  const { stagioni } = await getContesto()
  return segmentiStagione(stagioni).map((stagione) => ({ stagione }))
}

export default async function LayoutStagione({ children, params }: LayoutProps<'/stagione/[stagione]'>) {
  const { stagione } = await params
  const { stagioni } = await getContesto()
  if (stagione !== TUTTE_LE_STAGIONI && !stagioni.includes(stagione)) notFound()
  return children
}
