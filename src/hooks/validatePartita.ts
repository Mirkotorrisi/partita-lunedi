import { ValidationError, type CollectionBeforeValidateHook, type ValidationFieldError } from 'payload'

import type { Giocatori, Partite } from '../payload-types'
import { formatDataBreve } from '../lib/date'
import { relId } from '../lib/relations'

type Riga = NonNullable<Partite['formazioneA']>[number]
type Id = number | string

const idsFormazione = (righe: Riga[] | null | undefined): Id[] =>
  (righe ?? []).map((r) => relId<Giocatori>(r.giocatore)).filter((id): id is Id => id !== undefined)

const duplicati = (ids: Id[]): Id[] => [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]

/**
 * Validazioni che coinvolgono più campi. Gira dopo il calcolo di `giorno`
 * e lancia un ValidationError con i path dei campi, così l'admin li evidenzia.
 */
export const validatePartita: CollectionBeforeValidateHook<Partite> = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data) return data
  const errors: ValidationFieldError[] = []

  const nomi = async (ids: Id[]) => {
    const { docs } = await req.payload.find({
      collection: 'giocatori',
      where: { id: { in: ids } },
      depth: 0,
      limit: ids.length,
      pagination: false,
      req,
    })
    return docs.map((g) => g.nomeCompleto ?? `#${g.id}`).join(', ')
  }

  const idsA = idsFormazione(data.formazioneA ?? originalDoc?.formazioneA)
  const idsB = idsFormazione(data.formazioneB ?? originalDoc?.formazioneB)

  const dupA = duplicati(idsA)
  if (dupA.length) {
    errors.push({ path: 'formazioneA', message: `Giocatore inserito più volte: ${await nomi(dupA)}` })
  }
  const dupB = duplicati(idsB)
  if (dupB.length) {
    errors.push({ path: 'formazioneB', message: `Giocatore inserito più volte: ${await nomi(dupB)}` })
  }
  const inEntrambe = [...new Set(idsA.filter((id) => idsB.includes(id)))]
  if (inEntrambe.length) {
    errors.push({
      path: 'formazioneB',
      message: `Giocatore presente in entrambe le formazioni: ${await nomi(inEntrambe)}`,
    })
  }

  const squadraA = relId(data.squadraA ?? originalDoc?.squadraA)
  const squadraB = relId(data.squadraB ?? originalDoc?.squadraB)
  if (squadraA !== undefined && squadraA === squadraB) {
    errors.push({ path: 'squadraB', message: 'La squadra B deve essere diversa dalla squadra A' })
  }

  if (data.giorno) {
    const { totalDocs } = await req.payload.count({
      collection: 'partite',
      where: {
        giorno: { equals: data.giorno },
        ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
      },
      req,
    })
    if (totalDocs > 0) {
      errors.push({
        path: 'data',
        message: `Esiste già una partita il ${formatDataBreve(`${data.giorno}T12:00:00Z`)}`,
      })
    }
  }

  if (errors.length) throw new ValidationError({ collection: 'partite', errors, req })
  return data
}
