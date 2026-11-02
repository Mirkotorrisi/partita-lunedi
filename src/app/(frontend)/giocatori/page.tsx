import { Giocatori } from '../_pagine/Giocatori'

export { metadata } from '../_pagine/Giocatori'
export const revalidate = 3600

export default function Page() {
  return <Giocatori />
}
