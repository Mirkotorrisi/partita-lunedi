'use client'

import { useState } from 'react'
import { Pie, PieChart, ResponsiveContainer, Sector, type PieSectorShapeProps } from 'recharts'

import { CHART_ANIMATION_MS, useReducedMotion } from './useReducedMotion'

export interface FettaDonut {
  key: string
  nome: string
  gol: number
  /** Percentuale già formattata, es. "18%". */
  percentuale: string
  colore: string
}

/**
 * Donut dei marcatori con totale al centro e legenda sotto.
 * Hover o tap su fetta/voce: la evidenzia e mostra nome e gol al centro.
 */
export function ScorersDonut({ fette, totale }: { fette: FettaDonut[]; totale: number }) {
  const reduced = useReducedMotion()
  const [selezionata, setSelezionata] = useState<number | null>(null)
  const [hover, setHover] = useState<number | null>(null)

  // Su touch il tap emula mouseenter: l'anteprima al passaggio vale solo con un puntatore vero,
  // altrimenti resterebbe "appiccicata" e il secondo tap non deselezionerebbe.
  const anteprima = (i: number | null) => {
    if (window.matchMedia('(hover: hover)').matches) setHover(i)
  }
  const attiva = hover ?? selezionata
  const fettaAttiva = attiva !== null ? fette[attiva] : null
  const toggle = (i: number) => setSelezionata((s) => (s === i ? null : i))

  const shape = ({ key: _key, ...props }: PieSectorShapeProps & { key?: React.Key | null }) => {
    const i = props.index
    const spenta = attiva !== null && attiva !== i
    return (
      <Sector
        {...props}
        outerRadius={attiva === i ? Number(props.outerRadius) + 4 : props.outerRadius}
        strokeWidth={2}
        // CSS custom properties: via style, non come attributi SVG di presentazione.
        style={{
          fill: fette[i]?.colore,
          fillOpacity: spenta ? 0.3 : 1,
          stroke: 'var(--surface)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'fill-opacity 150ms',
        }}
      />
    )
  }

  return (
    <figure className="flex flex-col gap-4">
      <div className="relative h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={fette}
              dataKey="gol"
              nameKey="nome"
              innerRadius="62%"
              outerRadius="88%"
              startAngle={90}
              endAngle={-270}
              cornerRadius={4}
              isAnimationActive={!reduced}
              animationDuration={CHART_ANIMATION_MS}
              shape={shape}
              onClick={(_, i) => toggle(i)}
              onMouseEnter={(_, i) => anteprima(i)}
              onMouseLeave={() => anteprima(null)}
              rootTabIndex={-1}
            />
          </PieChart>
        </ResponsiveContainer>
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          aria-live="polite"
        >
          {fettaAttiva ? (
            <>
              <span className="num text-5xl leading-none">{fettaAttiva.gol}</span>
              <span className="mt-1 max-w-[8.5rem] truncate text-sm font-semibold">{fettaAttiva.nome}</span>
              <span className="text-xs text-muted">{fettaAttiva.percentuale} dei gol</span>
            </>
          ) : (
            <>
              <span className="num text-6xl leading-none">{totale}</span>
              <span className="label mt-1">Gol</span>
            </>
          )}
        </div>
      </div>

      <figcaption className="sr-only">
        Distribuzione dei gol: {fette.map((f) => `${f.nome} ${f.gol} gol (${f.percentuale})`).join(', ')}.
      </figcaption>

      <ul className="flex flex-col" aria-label="Legenda marcatori">
        {fette.map((f, i) => (
          <li key={f.key}>
            <button
              type="button"
              aria-pressed={selezionata === i}
              onClick={() => toggle(i)}
              onMouseEnter={() => anteprima(i)}
              onMouseLeave={() => anteprima(null)}
              className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm ${
                attiva === i ? 'bg-surface-2' : ''
              } ${attiva !== null && attiva !== i ? 'text-muted' : ''}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: f.colore }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{f.nome}</span>
              <span className="num text-base tabular-nums">{f.gol}</span>
              <span className="w-10 text-right text-xs text-muted tabular-nums">{f.percentuale}</span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  )
}
