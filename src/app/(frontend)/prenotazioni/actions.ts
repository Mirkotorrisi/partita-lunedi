'use server'

import config from '@payload-config'
import { randomBytes } from 'crypto'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import {
  COOKIE_DISPOSITIVO,
  DURATA_COOKIE,
  dispositivoCorrente,
  etichettaDa,
  giornoPrenotazioni,
  hashToken,
} from '@/lib/prenotazioni'
import { relId } from '@/lib/relations'

/** `codice: 'dispositivo'` → il cookie non vale più: il client torna alla scelta del giocatore. */
type Esito = { ok: true } | { ok: false; errore: string; codice?: 'dispositivo' }
export type Riconoscimento =
  | { stato: 'noto' }
  | { stato: 'suggerito'; giocatoreId: number; nome: string }
  | { stato: 'sconosciuto' }

const FINGERPRINT = /^[a-f0-9]{64}$/
const SOPRANNOME_MAX = 30
const ERRORE_DISPOSITIVO: Esito = {
  ok: false,
  errore: 'Dispositivo non riconosciuto: selezionati di nuovo dalla lista.',
  codice: 'dispositivo',
}

const aggiorna = () => revalidatePath('/prenotazioni')

/** Giocatore associato a questo dispositivo (dal cookie), oppure null. Serve al client la prima volta. */
export async function chiSono(): Promise<number | null> {
  const dispositivo = await dispositivoCorrente()
  const id = dispositivo ? relId(dispositivo.giocatore) : undefined
  return typeof id === 'number' ? id : null
}

/**
 * Il cookie è il riconoscimento principale. Se manca (cancellato) si prova con il fingerprint:
 * poiché telefoni identici possono produrre lo stesso fingerprint, un match NON identifica da solo,
 * ma viene solo proposto al giocatore, che deve confermare.
 */
export async function riconosci(fingerprint: string): Promise<Riconoscimento> {
  if (await dispositivoCorrente()) return { stato: 'noto' }
  if (!FINGERPRINT.test(fingerprint)) return { stato: 'sconosciuto' }

  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'dispositivi',
    where: { fingerprint: { equals: fingerprint } },
    depth: 1,
    pagination: false,
  })
  const giocatori = new Map(docs.flatMap((d) => (typeof d.giocatore === 'object' ? [[d.giocatore.id, d.giocatore]] : [])))
  if (giocatori.size !== 1) return { stato: 'sconosciuto' }
  const [giocatore] = giocatori.values()
  return { stato: 'suggerito', giocatoreId: giocatore.id, nome: giocatore.soprannome || giocatore.nomeCompleto || '' }
}

/** Associa il browser a un giocatore e imposta il cookie. Più dispositivi per giocatore sono ammessi. */
export async function associa(giocatoreId: number, fingerprint: string): Promise<Esito> {
  if (!Number.isInteger(giocatoreId)) return { ok: false, errore: 'Giocatore non valido' }
  const payload = await getPayload({ config })
  const giocatore = await payload.findByID({ collection: 'giocatori', id: giocatoreId, depth: 0 }).catch(() => null)
  if (!giocatore || !giocatore.attivo) return { ok: false, errore: 'Giocatore non valido' }

  const token = randomBytes(32).toString('base64url')
  const fp = FINGERPRINT.test(fingerprint) ? fingerprint : null
  const dati = {
    giocatore: giocatoreId,
    tokenHash: hashToken(token),
    fingerprint: fp,
    etichetta: etichettaDa((await headers()).get('user-agent')),
    ultimoAccesso: new Date().toISOString(),
  }

  // Stesso browser che si ri-associa (cookie perso): si ruota il token invece di duplicare il dispositivo.
  const esistente = fp
    ? (
        await payload.find({
          collection: 'dispositivi',
          where: { and: [{ fingerprint: { equals: fp } }, { giocatore: { equals: giocatoreId } }] },
          depth: 0,
          limit: 1,
        })
      ).docs[0]
    : undefined
  if (esistente) await payload.update({ collection: 'dispositivi', id: esistente.id, data: dati })
  else await payload.create({ collection: 'dispositivi', data: dati })

  ;(await cookies()).set(COOKIE_DISPOSITIVO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURATA_COOKIE,
    path: '/',
  })
  aggiorna()
  return { ok: true }
}

/** "Non sono io": scollega questo browser (il dispositivo viene eliminato). */
export async function scollega(): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  if (dispositivo) {
    const payload = await getPayload({ config })
    await payload.delete({ collection: 'dispositivi', id: dispositivo.id })
  }
  ;(await cookies()).delete(COOKIE_DISPOSITIVO)
  aggiorna()
  return { ok: true }
}

export async function prenota(): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  const giocatoreId = dispositivo ? relId(dispositivo.giocatore) : undefined
  if (!dispositivo || typeof giocatoreId !== 'number') return ERRORE_DISPOSITIVO

  const payload = await getPayload({ config })
  const giorno = await giornoPrenotazioni()
  const { totalDocs } = await payload.count({
    collection: 'iscrizioni',
    where: { and: [{ giorno: { equals: giorno } }, { giocatore: { equals: giocatoreId } }] },
  })
  // Idempotente: un doppio tap non crea una seconda riga né sposta l'orario.
  if (totalDocs === 0) {
    try {
      await payload.create({ collection: 'iscrizioni', data: { giorno, giocatore: giocatoreId } })
    } catch (err) {
      // Doppio invio in parallelo: l'indice unico ha già garantito una sola riga.
      const gia = await payload.count({
        collection: 'iscrizioni',
        where: { and: [{ giorno: { equals: giorno } }, { giocatore: { equals: giocatoreId } }] },
      })
      if (gia.totalDocs === 0) throw err
    }
  }
  await segnaAccesso(dispositivo.id)
  aggiorna()
  return { ok: true }
}

export async function annulla(): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  const giocatoreId = dispositivo ? relId(dispositivo.giocatore) : undefined
  if (!dispositivo || typeof giocatoreId !== 'number') return ERRORE_DISPOSITIVO

  const payload = await getPayload({ config })
  await payload.delete({
    collection: 'iscrizioni',
    where: { and: [{ giorno: { equals: await giornoPrenotazioni() } }, { giocatore: { equals: giocatoreId } }] },
  })
  aggiorna()
  return { ok: true }
}

/** Soprannome e numero di maglia: gli unici campi che il giocatore può modificare da solo. */
export async function aggiornaProfilo(input: { soprannome: string; numeroMaglia: number | null }): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  const giocatoreId = dispositivo ? relId(dispositivo.giocatore) : undefined
  if (!dispositivo || typeof giocatoreId !== 'number') return ERRORE_DISPOSITIVO

  const soprannome = String(input.soprannome ?? '').trim().replace(/\s+/g, ' ')
  if (soprannome.length > SOPRANNOME_MAX) {
    return { ok: false, errore: `Il soprannome può avere al massimo ${SOPRANNOME_MAX} caratteri` }
  }
  const numero = input.numeroMaglia
  if (numero !== null && (!Number.isInteger(numero) || numero < 1 || numero > 99)) {
    return { ok: false, errore: 'Il numero di maglia deve essere tra 1 e 99' }
  }

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'giocatori',
    id: giocatoreId,
    data: { soprannome: soprannome || null, numeroMaglia: numero },
  })
  await segnaAccesso(dispositivo.id)
  aggiorna()
  return { ok: true }
}

async function segnaAccesso(id: number) {
  const payload = await getPayload({ config })
  await payload.update({ collection: 'dispositivi', id, data: { ultimoAccesso: new Date().toISOString() } })
}

/** Sottoscrizione push di questo dispositivo (deve già essere associato a un giocatore). */
export async function salvaPush(sub: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  if (!dispositivo) return ERRORE_DISPOSITIVO
  const valida =
    typeof sub?.endpoint === 'string' &&
    sub.endpoint.startsWith('https://') &&
    typeof sub.keys?.p256dh === 'string' &&
    typeof sub.keys?.auth === 'string'
  if (!valida) return { ok: false, errore: 'Sottoscrizione non valida' }

  const payload = await getPayload({ config })
  await payload.update({
    collection: 'dispositivi',
    id: dispositivo.id,
    data: { pushSubscription: { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } } },
  })
  return { ok: true }
}

export async function rimuoviPush(): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  if (!dispositivo) return ERRORE_DISPOSITIVO
  const payload = await getPayload({ config })
  await payload.update({ collection: 'dispositivi', id: dispositivo.id, data: { pushSubscription: null } })
  return { ok: true }
}

const FOTO_MAX_BYTE = 1024 * 1024

/** Foto profilo: arriva già ridimensionata dal browser, qui si valida e si salva. */
export async function caricaFoto(formData: FormData): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  const giocatoreId = dispositivo ? relId(dispositivo.giocatore) : undefined
  if (!dispositivo || typeof giocatoreId !== 'number') return ERRORE_DISPOSITIVO

  const file = formData.get('foto')
  if (!(file instanceof File) || file.size === 0) return { ok: false, errore: 'Nessuna foto selezionata' }
  if (file.size > FOTO_MAX_BYTE) return { ok: false, errore: 'La foto è troppo grande' }
  if (file.type !== 'image/jpeg') return { ok: false, errore: 'Formato non supportato' }

  const payload = await getPayload({ config })
  const giocatore = await payload.findByID({ collection: 'giocatori', id: giocatoreId, depth: 0 })
  const precedente = relId(giocatore.foto)

  const media = await payload.create({
    collection: 'media',
    data: { alt: `Foto di ${giocatore.nomeCompleto}` },
    file: {
      data: Buffer.from(await file.arrayBuffer()),
      mimetype: 'image/jpeg',
      name: `${giocatore.slug ?? giocatoreId}-${Date.now()}.jpg`,
      size: file.size,
    },
  })
  await payload.update({ collection: 'giocatori', id: giocatoreId, data: { foto: media.id } })
  // La vecchia foto non serve più: si elimina per non accumulare file.
  if (precedente !== undefined) await payload.delete({ collection: 'media', id: precedente }).catch(() => undefined)

  await segnaAccesso(dispositivo.id)
  aggiorna()
  return { ok: true }
}

export async function rimuoviFoto(): Promise<Esito> {
  const dispositivo = await dispositivoCorrente()
  const giocatoreId = dispositivo ? relId(dispositivo.giocatore) : undefined
  if (!dispositivo || typeof giocatoreId !== 'number') return ERRORE_DISPOSITIVO

  const payload = await getPayload({ config })
  const giocatore = await payload.findByID({ collection: 'giocatori', id: giocatoreId, depth: 0 })
  const precedente = relId(giocatore.foto)
  await payload.update({ collection: 'giocatori', id: giocatoreId, data: { foto: null } })
  if (precedente !== undefined) await payload.delete({ collection: 'media', id: precedente }).catch(() => undefined)
  aggiorna()
  return { ok: true }
}
