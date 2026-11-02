import { TUTTE_LE_STAGIONI } from './cache-tags'

export const PREFISSO_STAGIONE = '/stagione/'

/**
 * URL di una pagina nella stagione selezionata. Senza stagione (quella corrente) resta il percorso
 * nudo: `/partite`. Altrimenti `/stagione/2025-26/partite`. La stagione sta nel percorso, non nella
 * query, così ogni combinazione è una pagina statica prerenderizzata.
 */
export function conStagione(path: string, stagione?: string): string {
  if (!stagione) return path
  return `${PREFISSO_STAGIONE}${encodeURIComponent(stagione)}${path === '/' ? '' : path}`
}

/** Stagione selezionata a partire dal pathname (`/stagione/2025-26/partite` → `2025-26`), oppure undefined. */
export function stagioneDaPathname(pathname: string): string | undefined {
  if (!pathname.startsWith(PREFISSO_STAGIONE)) return undefined
  const segmento = pathname.slice(PREFISSO_STAGIONE.length).split('/')[0]
  return segmento ? decodeURIComponent(segmento) : undefined
}

/** Percorso senza il prefisso stagione (`/stagione/2025-26/partite` → `/partite`). */
export function senzaStagione(pathname: string): string {
  if (!pathname.startsWith(PREFISSO_STAGIONE)) return pathname
  const resto = pathname.slice(PREFISSO_STAGIONE.length).split('/').slice(1).join('/')
  return `/${resto}`
}

/** Valori ammessi nel segmento `[stagione]`: le stagioni con partite più "tutte". */
export const segmentiStagione = (stagioni: string[]) => [...stagioni, TUTTE_LE_STAGIONI]
