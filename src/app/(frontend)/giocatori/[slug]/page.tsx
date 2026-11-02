import { getDataset } from '@/lib/data'

import { Giocatore, metadataGiocatore } from '../../_pagine/Giocatore'

export const revalidate = 3600

export async function generateStaticParams() {
  const { giocatori } = await getDataset()
  return giocatori.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps<'/giocatori/[slug]'>) {
  return metadataGiocatore((await params).slug)
}

export default async function Page({ params }: PageProps<'/giocatori/[slug]'>) {
  return <Giocatore slug={(await params).slug} />
}
