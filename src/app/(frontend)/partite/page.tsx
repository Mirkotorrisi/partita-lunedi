import { Partite } from '../_pagine/Partite'

export { metadata } from '../_pagine/Partite'
export const revalidate = 3600

export default function Page() {
  return <Partite />
}
