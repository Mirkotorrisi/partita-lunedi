import { revalidateTag } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest, RequestContext } from 'payload'

import { DATASET_TAG } from '../lib/cache-tags'

function invalidate(req: PayloadRequest, context: RequestContext) {
  if (context.disableRevalidate) return
  try {
    // expire: 0 → chi apre il sito subito dopo il salvataggio vede già i dati nuovi.
    revalidateTag(DATASET_TAG, { expire: 0 })
  } catch (err) {
    // Fuori da Next (es. script di seed) non c'è una cache da invalidare.
    req.payload.logger.debug({ err, msg: 'revalidateTag ignorato fuori da Next' })
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook = ({ doc, req, context }) => {
  invalidate(req, context)
  return doc
}

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ doc, req, context }) => {
  invalidate(req, context)
  return doc
}

export const revalidateHooks = {
  afterChange: [revalidateAfterChange],
  afterDelete: [revalidateAfterDelete],
}
