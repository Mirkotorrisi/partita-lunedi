import { getContesto } from '@/lib/data'

import { metadataPartita, Partita } from '../../../../_pagine/Partita'

export const revalidate = 3600

/** Le partite della stagione del segmento: la lista di quella stagione linka solo quelle. */
export async function generateStaticParams({ params }: { params: { stagione: string } }) {
  const { periodo } = await getContesto(params.stagione)
  return periodo.map((p) => ({ giorno: p.giorno }))
}

export async function generateMetadata({ params }: PageProps<'/stagione/[stagione]/partite/[giorno]'>) {
  return metadataPartita((await params).giorno)
}

export default async function Page({ params }: PageProps<'/stagione/[stagione]/partite/[giorno]'>) {
  const { giorno, stagione } = await params
  return <Partita giorno={giorno} stagione={stagione} />
}
