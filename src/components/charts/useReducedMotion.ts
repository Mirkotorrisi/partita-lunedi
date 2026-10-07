'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (cb: () => void) => {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', cb)
  return () => mql.removeEventListener('change', cb)
}

/** true se l'utente ha chiesto meno animazioni. Sul server vale true (niente animazioni in SSR). */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => true,
  )
}

/** Durata standard delle animazioni dei grafici (≤ 400ms). */
export const CHART_ANIMATION_MS = 400
