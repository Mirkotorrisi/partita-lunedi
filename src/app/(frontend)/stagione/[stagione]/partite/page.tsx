import { Partite } from '../../../_pagine/Partite'

export { metadata } from '../../../_pagine/Partite'
export const revalidate = 3600

export default async function Page({ params }: PageProps<'/stagione/[stagione]/partite'>) {
  return <Partite stagione={(await params).stagione} />
}
