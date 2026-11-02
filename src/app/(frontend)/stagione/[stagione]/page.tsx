import { Home } from '../../_pagine/Home'

export const revalidate = 3600

export default async function Page({ params }: PageProps<'/stagione/[stagione]'>) {
  return <Home stagione={(await params).stagione} />
}
