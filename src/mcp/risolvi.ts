/**
 * Riferimenti "umani" → documenti Payload. I tool accettano id numerici oppure nomi/giorni,
 * così l'agente può scrivere "Rossi" invece di cercare prima l'id.
 */
import type { Payload } from 'payload'

import type { Giocatori, Partite, Squadre } from '@/payload-types'

import { abbinaGiocatore, abbinaSquadra } from './abbina'
import { ErroreTool } from './risposta'

export type Riferimento = number | string

const GIORNO = /^\d{4}-\d{2}-\d{2}$/
const SOLO_CIFRE = /^\d+$/

const nonTrovato = (cosa: string, id: Riferimento) =>
  new ErroreTool(`${cosa} con id ${id} non trovato`)

export const tuttiIGiocatori = async (payload: Payload) =>
  (await payload.find({ collection: 'giocatori', depth: 0, pagination: false, sort: 'cognome' })).docs

export const tutteLeSquadre = async (payload: Payload) =>
  (await payload.find({ collection: 'squadre', depth: 0, pagination: false, sort: 'nome' })).docs

export async function risolviGiocatore(payload: Payload, ref: Riferimento): Promise<Giocatori> {
  if (typeof ref === 'number' || SOLO_CIFRE.test(ref)) {
    const doc = await payload.findByID({ collection: 'giocatori', id: Number(ref), depth: 0, disableErrors: true })
    if (!doc) throw nonTrovato('Giocatore', ref)
    return doc
  }
  const esito = abbinaGiocatore(await tuttiIGiocatori(payload), ref)
  if (!esito.ok) throw new ErroreTool(esito.errore)
  return esito.doc
}

/** Risolve più riferimenti con una sola lettura dell'anagrafica. */
export async function risolviGiocatori(payload: Payload, refs: Riferimento[]): Promise<Giocatori[]> {
  const giocatori = await tuttiIGiocatori(payload)
  const perId = new Map(giocatori.map((g) => [g.id, g]))
  return refs.map((ref) => {
    if (typeof ref === 'number' || SOLO_CIFRE.test(ref)) {
      const doc = perId.get(Number(ref))
      if (!doc) throw nonTrovato('Giocatore', ref)
      return doc
    }
    const esito = abbinaGiocatore(giocatori, ref)
    if (!esito.ok) throw new ErroreTool(esito.errore)
    return esito.doc
  })
}

export async function risolviSquadra(payload: Payload, ref: Riferimento): Promise<Squadre> {
  if (typeof ref === 'number' || SOLO_CIFRE.test(ref)) {
    const doc = await payload.findByID({ collection: 'squadre', id: Number(ref), depth: 0, disableErrors: true })
    if (!doc) throw nonTrovato('Squadra', ref)
    return doc
  }
  const esito = abbinaSquadra(await tutteLeSquadre(payload), ref)
  if (!esito.ok) throw new ErroreTool(esito.errore)
  return esito.doc
}

/** Partita per id, per giorno (YYYY-MM-DD) oppure "ultima" (la più recente già giocata). */
export async function risolviPartita(payload: Payload, ref: Riferimento): Promise<Partite> {
  if (typeof ref === 'number' || SOLO_CIFRE.test(ref)) {
    const doc = await payload.findByID({ collection: 'partite', id: Number(ref), depth: 0, disableErrors: true })
    if (!doc) throw nonTrovato('Partita', ref)
    return doc
  }
  const testo = ref.trim().toLowerCase()
  if (testo === 'ultima') {
    const { docs } = await payload.find({ collection: 'partite', depth: 0, limit: 1, sort: '-data' })
    if (!docs[0]) throw new ErroreTool('Non ci sono ancora partite registrate')
    return docs[0]
  }
  if (GIORNO.test(testo)) {
    const { docs } = await payload.find({
      collection: 'partite',
      where: { giorno: { equals: testo } },
      depth: 0,
      limit: 1,
    })
    if (!docs[0]) throw new ErroreTool(`Nessuna partita il ${testo}. Usa lista_partite per vedere le date.`)
    return docs[0]
  }
  throw new ErroreTool(`Riferimento partita non valido: "${ref}". Usa un id, un giorno YYYY-MM-DD oppure "ultima".`)
}

/** YYYY-MM-DD → ISO a mezzogiorno UTC: in ora italiana resta lo stesso giorno di calendario. */
export function giornoAIso(giorno: string): string {
  if (!GIORNO.test(giorno) || Number.isNaN(Date.parse(`${giorno}T12:00:00Z`))) {
    throw new ErroreTool(`Data non valida: "${giorno}". Usa il formato YYYY-MM-DD.`)
  }
  return `${giorno}T12:00:00.000Z`
}
