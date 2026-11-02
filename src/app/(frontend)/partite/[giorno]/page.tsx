import { getDataset } from '@/lib/data'

import { metadataPartita, Partita } from '../../_pagine/Partita'

export const revalidate = 3600

export async function generateStaticParams() {
  const { partite } = await getDataset()
  return partite.map((p) => ({ giorno: p.giorno }))
}

export async function generateMetadata({ params }: PageProps<'/partite/[giorno]'>) {
  return metadataPartita((await params).giorno)
}

export default async function Page({ params }: PageProps<'/partite/[giorno]'>) {
  return <Partita giorno={(await params).giorno} />
}
