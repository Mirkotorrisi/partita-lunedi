import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import type { Giocatori, Media, Partite } from '@/payload-types'

import { DATASET_TAG } from './cache-tags'
import { relId } from './relations'
import { elencoStagioni, filtraPartite, type Giocatore, type Id, type Partita, type Riga, type Squadra } from './stats'

export interface Dataset {
  partite: Partita[]
  giocatori: Giocatore[]
  squadre: Squadra[]
}

const toRighe = (righe: Partite['formazioneA']): Riga[] =>
  (righe ?? []).flatMap((r) => {
    const giocatoreId = relId(r.giocatore)
    return giocatoreId === undefined ? [] : [{ giocatoreId, gol: r.gol ?? 0, voto: r.voto ?? null }]
  })

const fotoUrl = (foto: Giocatori['foto']): string | null => {
  if (!foto || typeof foto !== 'object') return null
  const media = foto as Media
  return media.sizes?.hero?.url ?? media.url ?? null
}

/**
 * Tutto il dataset in un'unica lettura. Il volume è piccolo (centinaia di partite al massimo),
 * quindi le statistiche si calcolano in memoria. La cache viene invalidata dagli hook di Payload.
 */
export const getDataset = unstable_cache(
  async (): Promise<Dataset> => {
    const payload = await getPayload({ config })
    const [partite, giocatori, squadre] = await Promise.all([
      payload.find({ collection: 'partite', depth: 0, pagination: false, sort: 'data' }),
      payload.find({ collection: 'giocatori', depth: 1, pagination: false, sort: 'cognome' }),
      payload.find({ collection: 'squadre', depth: 0, pagination: false, sort: 'nome' }),
    ])

    return {
      partite: partite.docs.flatMap((p): Partita[] => {
        const squadraAId = relId(p.squadraA)
        const squadraBId = relId(p.squadraB)
        if (!p.giorno || squadraAId === undefined || squadraBId === undefined) return []
        return [
          {
            id: p.id,
            giorno: p.giorno,
            squadraAId,
            squadraBId,
            golA: p.golA ?? 0,
            golB: p.golB ?? 0,
            autogolA: p.autogolA ?? 0,
            autogolB: p.autogolB ?? 0,
            formazioneA: toRighe(p.formazioneA),
            formazioneB: toRighe(p.formazioneB),
            note: p.note ?? null,
          },
        ]
      }),
      giocatori: giocatori.docs.map((g) => ({
        id: g.id,
        slug: g.slug ?? String(g.id),
        nome: g.nome,
        cognome: g.cognome,
        soprannome: g.soprannome || null,
        ruolo: g.ruolo,
        numeroMaglia: g.numeroMaglia ?? null,
        attivo: g.attivo ?? true,
        squadraAbitualeId: relId(g.squadraAbituale) ?? null,
        fotoUrl: fotoUrl(g.foto),
      })),
      squadre: squadre.docs.map((s) => ({ id: s.id, nome: s.nome, colore: s.colore })),
    }
  },
  ['dataset'],
  { tags: [DATASET_TAG] },
)

export const TUTTE_LE_STAGIONI = 'tutte'

export interface Contesto extends Dataset {
  /** Partite del periodo selezionato, in ordine cronologico. */
  periodo: Partita[]
  stagioni: string[]
  /** Stagione selezionata, oppure TUTTE_LE_STAGIONI. */
  stagione: string
  giocatoriById: Map<Id, Giocatore>
  squadreById: Map<Id, Squadra>
}

/**
 * Dataset + filtro stagione da `?stagione=`. Senza parametro (o con un valore sconosciuto)
 * vale la stagione più recente con almeno una partita.
 */
export async function getContesto(stagioneParam?: string | string[]): Promise<Contesto> {
  const dataset = await getDataset()
  const stagioni = elencoStagioni(dataset.partite)
  const richiesta = Array.isArray(stagioneParam) ? stagioneParam[0] : stagioneParam
  const stagione =
    richiesta === TUTTE_LE_STAGIONI || (richiesta && stagioni.includes(richiesta))
      ? richiesta
      : (stagioni[0] ?? TUTTE_LE_STAGIONI)

  return {
    ...dataset,
    periodo: filtraPartite(dataset.partite, stagione === TUTTE_LE_STAGIONI ? {} : { stagione }),
    stagioni,
    stagione,
    giocatoriById: new Map(dataset.giocatori.map((g) => [g.id, g])),
    squadreById: new Map(dataset.squadre.map((s) => [s.id, s])),
  }
}
