'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { useMemo, useState } from 'react'

export type Direzione = 'asc' | 'desc'

export interface Colonna {
  key: string
  label: string
  /** Etichetta estesa per screen reader / tooltip (es. "Media gol a partita"). */
  title?: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  /** Direzione al primo click: per i numeri di solito "desc". */
  primaDirezione?: Direzione
  className?: string
}

export interface Cella {
  /** Valore usato per ordinare; null finisce sempre in fondo. */
  sort?: number | string | null
  display: React.ReactNode
}

export interface RigaTabella {
  id: string | number
  /** Posizione in classifica, mostrata nella colonna "Pos" (le prime 3 in accent). */
  posizione?: number
  muted?: boolean
  cells: Record<string, Cella>
}

/**
 * Tabella con header cliccabili, righe alternate e colonna giocatore sticky.
 * La prima colonna di `colonne` è quella sticky (dopo l'eventuale "Pos").
 */
export function SortableTable({
  colonne,
  righe,
  caption,
  ordinamentoIniziale,
  limite,
  mostraPosizione = true,
}: {
  colonne: Colonna[]
  righe: RigaTabella[]
  caption: string
  ordinamentoIniziale?: { key: string; direzione: Direzione }
  /** Mostra solo le prime N righe con un pulsante "Vedi tutti". */
  limite?: number
  mostraPosizione?: boolean
}) {
  const [ordine, setOrdine] = useState(ordinamentoIniziale ?? null)
  const [espansa, setEspansa] = useState(false)

  const ordinate = useMemo(() => {
    if (!ordine) return righe
    const segno = ordine.direzione === 'asc' ? 1 : -1
    return [...righe].sort((x, y) => {
      const a = x.cells[ordine.key]?.sort ?? null
      const b = y.cells[ordine.key]?.sort ?? null
      if (a === b) return (x.posizione ?? 0) - (y.posizione ?? 0)
      if (a === null) return 1
      if (b === null) return -1
      const cmp = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'it')
      return cmp * segno || (x.posizione ?? 0) - (y.posizione ?? 0)
    })
  }, [righe, ordine])

  const visibili = limite && !espansa ? ordinate.slice(0, limite) : ordinate

  const clickHeader = (c: Colonna) => {
    setOrdine((prev) =>
      prev?.key === c.key
        ? { key: c.key, direzione: prev.direzione === 'asc' ? 'desc' : 'asc' }
        : { key: c.key, direzione: c.primaDirezione ?? 'desc' },
    )
  }

  const allinea = (a: Colonna['align']) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left')
  const stickyPos = 'sticky left-0 z-10 w-8 min-w-8 sm:w-10 sm:min-w-10'
  const stickyPrima = mostraPosizione ? 'sticky left-8 z-10 sm:left-10' : 'sticky left-0 z-10'

  return (
    <div className="flex flex-col gap-2">
      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0" data-table-scroller>
        <table className="w-full border-separate border-spacing-0 text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {mostraPosizione && (
                <th scope="col" className={`label ${stickyPos} bg-surface px-1.5 py-2 text-left sm:px-2`}>
                  <abbr title="Posizione" className="no-underline">
                    #
                  </abbr>
                </th>
              )}
              {colonne.map((c, i) => {
                const attivo = ordine?.key === c.key
                const ariaSort = attivo ? (ordine.direzione === 'asc' ? 'ascending' : 'descending') : 'none'
                const Icona = attivo ? (ordine.direzione === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={c.sortable ? ariaSort : undefined}
                    className={`label bg-surface px-1.5 py-0 whitespace-nowrap sm:px-2 ${allinea(c.align)} ${i === 0 ? stickyPrima : ''} ${c.className ?? ''}`}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => clickHeader(c)}
                        title={c.title}
                        className={`inline-flex min-h-11 items-center gap-1 uppercase ${attivo ? 'text-text' : ''} ${c.align === 'right' ? 'flex-row-reverse' : ''}`}
                      >
                        {c.label}
                        <Icona
                          className={`h-3.5 w-3.5 ${attivo ? 'text-accent' : 'hidden opacity-50 sm:inline'}`}
                          aria-hidden="true"
                        />
                      </button>
                    ) : (
                      <span className="inline-flex min-h-11 items-center" title={c.title}>
                        {c.label}
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibili.map((r, idx) => {
              const sfondo = idx % 2 === 0 ? 'bg-surface' : 'bg-surface-2'
              return (
                <tr key={r.id} className={r.muted ? 'text-muted' : ''}>
                  {mostraPosizione && (
                    <td
                      className={`${stickyPos} ${sfondo} num rounded-l-lg px-1.5 text-lg sm:px-2 ${r.posizione && r.posizione <= 3 && !r.muted ? 'text-accent' : 'text-muted'}`}
                    >
                      {r.posizione ?? '–'}
                    </td>
                  )}
                  {colonne.map((c, i) => (
                    <td
                      key={c.key}
                      className={`${sfondo} px-1.5 py-1 whitespace-nowrap sm:px-2 ${allinea(c.align)} ${i === 0 ? `${stickyPrima} max-w-[9rem] sm:max-w-none` : ''} ${!mostraPosizione && i === 0 ? 'rounded-l-lg' : ''} ${i === colonne.length - 1 ? 'rounded-r-lg' : ''} ${c.className ?? ''}`}
                    >
                      {r.cells[c.key]?.display ?? '–'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {limite && righe.length > limite && (
        <button
          type="button"
          onClick={() => setEspansa((v) => !v)}
          aria-expanded={espansa}
          className="min-h-11 self-center rounded-full px-4 text-sm font-semibold text-accent hover:bg-surface-2"
        >
          {espansa ? 'Mostra meno' : `Vedi tutti (${righe.length})`}
        </button>
      )}
    </div>
  )
}
