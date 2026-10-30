import config from '@payload-config'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import type { Dispositivi } from '@/payload-types'

import { prossimoLunedi, toGiorno } from './date'

export const COOKIE_DISPOSITIVO = 'pl_device'
/** Chrome limita comunque i cookie a 400 giorni. */
export const DURATA_COOKIE = 400 * 24 * 60 * 60

export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')

export interface DettagliPartita {
  giorno: string
  ora: string | null
  campo: string | null
}

/**
 * Prossima partita: giorno impostato dall'admin (se non è passato), altrimenti il prossimo lunedì.
 * Se per quel giorno la partita è già registrata (risultato inserito) si passa al lunedì successivo.
 */
export async function dettagliPartita(): Promise<DettagliPartita> {
  const payload = await getPayload({ config })
  const g = await payload.findGlobal({ slug: 'prossima-partita', depth: 0 })
  const impostato = g.giorno ? toGiorno(g.giorno) : null
  let giorno = impostato && impostato >= toGiorno(new Date()) ? impostato : prossimoLunedi()

  const { totalDocs } = await payload.count({ collection: 'partite', where: { giorno: { equals: giorno } } })
  if (totalDocs > 0) {
    const domani = new Date(`${giorno}T12:00:00Z`)
    domani.setUTCDate(domani.getUTCDate() + 1)
    giorno = prossimoLunedi(domani)
  }
  return { giorno, ora: g.ora || null, campo: g.campo || null }
}

export const giornoPrenotazioni = async () => (await dettagliPartita()).giorno

/** Dispositivo identificato dal cookie, oppure null. */
export async function dispositivoCorrente(): Promise<Dispositivi | null> {
  const token = (await cookies()).get(COOKIE_DISPOSITIVO)?.value
  if (!token) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'dispositivi',
    where: { tokenHash: { equals: hashToken(token) } },
    depth: 0,
    limit: 1,
  })
  return docs[0] ?? null
}

/** "iPhone · Safari" dallo user agent: serve solo a farlo riconoscere all'admin. */
export function etichettaDa(userAgent: string | null): string {
  const ua = userAgent ?? ''
  const os = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Mac OS X/.test(ua)
            ? 'Mac'
            : /Linux/.test(ua)
              ? 'Linux'
              : 'Dispositivo'
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /(CriOS|Chrome)\//.test(ua)
      ? 'Chrome'
      : /(FxiOS|Firefox)\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : null
  return browser ? `${os} · ${browser}` : os
}
