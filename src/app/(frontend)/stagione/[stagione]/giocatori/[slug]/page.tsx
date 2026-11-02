import { getDataset } from '@/lib/data'

import { Giocatore, metadataGiocatore } from '../../../../_pagine/Giocatore'

export const revalidate = 3600

export async function generateStaticParams() {
  const { giocatori } = await getDataset()
  return giocatori.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps<'/stagione/[stagione]/giocatori/[slug]'>) {
  return metadataGiocatore((await params).slug)
}

export default async function Page({ params }: PageProps<'/stagione/[stagione]/giocatori/[slug]'>) {
  const { slug, stagione } = await params
  return <Giocatore slug={slug} stagione={stagione} />
}
