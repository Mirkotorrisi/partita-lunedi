import { Giocatori } from '../../../_pagine/Giocatori'

export { metadata } from '../../../_pagine/Giocatori'
export const revalidate = 3600

export default async function Page({ params }: PageProps<'/stagione/[stagione]/giocatori'>) {
  return <Giocatori stagione={(await params).stagione} />
}
