import { revalidatePath, revalidateTag } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
  RequestContext,
} from 'payload'

import { DATASET_TAG } from '../lib/cache-tags'

/**
 * Le pagine del sito sono statiche: vengono rigenerate solo quando questi hook lo chiedono
 * (più una rete di sicurezza oraria). Fuori da Next (es. script di seed) non c'è nulla da invalidare.
 */
function invalida(req: PayloadRequest, context: RequestContext, azione: () => void) {
  if (context.disableRevalidate) return
  try {
    azione()
  } catch (err) {
    req.payload.logger.debug({ err, msg: 'revalidate ignorato fuori da Next' })
  }
}

// expire: 0 → chi apre il sito subito dopo il salvataggio vede già i dati nuovi.
const invalidaDataset = (req: PayloadRequest, context: RequestContext) =>
  invalida(req, context, () => revalidateTag(DATASET_TAG, { expire: 0 }))

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, req, context }) => {
  invalidaDataset(req, context)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  invalidaDataset(req, context)
  return doc
}

/** Per le collection che entrano nel dataset (partite, giocatori, squadre, media). */
export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}

/** Per le collection/global letti direttamente da una sola pagina statica (es. /prenotazioni). */
export function revalidatePathHooks(path: string): {
  afterChange: [CollectionAfterChangeHook]
  afterDelete: [CollectionAfterDeleteHook]
} {
  const afterChange: CollectionAfterChangeHook = ({ doc, req, context }) => {
    invalida(req, context, () => revalidatePath(path))
    return doc
  }
  const afterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
    invalida(req, context, () => revalidatePath(path))
    return doc
  }
  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}

export function revalidatePathGlobalHook(path: string): GlobalAfterChangeHook {
  return ({ doc, req, context }) => {
    invalida(req, context, () => revalidatePath(path))
    return doc
  }
}
