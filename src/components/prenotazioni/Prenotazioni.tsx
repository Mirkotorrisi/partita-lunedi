'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { chiSono } from '@/app/(frontend)/prenotazioni/actions'
import { AreaGiocatore, type GiocatoreScelta, type Io } from '@/components/prenotazioni/AreaGiocatore'
import { ListaIscritti, type Iscritto } from '@/components/prenotazioni/ListaIscritti'
import type { Squadra } from '@/lib/stats'

/**
 * Copia locale dell'id del giocatore associato al dispositivo. Il cookie httpOnly resta l'unica
 * prova per il server: qui serve solo a mostrare subito la pagina giusta senza una render per visita.
 * Valori: assente = mai verificato; "0" = verificato, nessun giocatore; altrimenti l'id.
 */
const CHIAVE_IO = 'pl_giocatore'
const NESSUNO = 0

const ascoltatori = new Set<() => void>()

const leggiIo = (): number | null => {
  try {
    const v = localStorage.getItem(CHIAVE_IO)
    if (v === null) return null
    const n = Number(v)
    return Number.isInteger(n) && n >= 0 ? n : null
  } catch {
    return NESSUNO
  }
}

const scriviIo = (id: number) => {
  try {
    localStorage.setItem(CHIAVE_IO, String(id))
  } catch {
    // Storage non disponibile (modalità privata): si chiederà al server a ogni visita.
  }
  ascoltatori.forEach((cb) => cb())
}

const sottoscrivi = (cb: () => void) => {
  ascoltatori.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    ascoltatori.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

/** `undefined` durante l'SSR e l'idratazione, poi il valore locale. */
const useIoLocale = () => useSyncExternalStore(sottoscrivi, leggiIo, () => undefined)

/** Area personale + lista iscritti: la parte della pagina che dipende da chi la guarda. */
export function Prenotazioni({
  giocatori,
  iscritti,
  squadre,
  installaApp,
}: {
  giocatori: GiocatoreScelta[]
  iscritti: Iscritto[]
  squadre: Squadra[]
  installaApp: React.ReactNode
}) {
  const ioId = useIoLocale()

  useEffect(() => {
    // Mai verificato su questo browser (prima visita dopo l'associazione, o copia locale persa):
    // lo chiede al cookie una volta sola e se lo segna.
    if (ioId !== null) return
    let attivo = true
    void chiSono().then((id) => {
      if (attivo) scriviIo(id ?? NESSUNO)
    })
    return () => {
      attivo = false
    }
  }, [ioId])

  const aggiorna = (id: number | null) => scriviIo(id ?? NESSUNO)

  const me = ioId ? giocatori.find((g) => g.id === ioId) : undefined
  // Un id locale che non corrisponde più a un giocatore attivo vale come "non associato".
  const io: Io | null = me ? { ...me, iscritto: iscritti.some((i) => i.giocatore.id === me.id) } : null

  return (
    <>
      {ioId === undefined || ioId === null ? (
        <div className="card skeleton h-32" aria-busy="true" />
      ) : (
        <AreaGiocatore io={io} giocatori={giocatori} onAssociato={aggiorna} onScollegato={() => aggiorna(null)} />
      )}
      {installaApp}
      <section aria-labelledby="lista" className="flex flex-col gap-3">
        <h2 id="lista" className="label">
          Lista in ordine di arrivo
        </h2>
        <ListaIscritti iscritti={iscritti} squadre={squadre} ioId={io?.id ?? null} />
      </section>
    </>
  )
}
