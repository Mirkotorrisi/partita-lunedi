'use client'

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  Rectangle,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarShapeProps,
  type TooltipContentProps,
} from 'recharts'

import { formatMedia, formatVoto } from '@/lib/format'

import { CHART_ANIMATION_MS, useReducedMotion } from './useReducedMotion'

/** Una partita del giocatore, già formattata lato server. */
export interface PuntoPartita {
  giorno: string
  /** "6 ott" */
  etichetta: string
  /** "lunedì 6 ottobre 2026" */
  data: string
  squadra: string
  avversario: string
  /** "5–3" dal punto di vista del giocatore */
  risultato: string
  esitoEsteso: string
  voto: number | null
  mediaMobile: number | null
  gol: number
}

const ALTEZZA = 220
const SUFFICIENZA = 6

/** Stesse fasce di VoteChip: ≥ 7 accent, 6–6,5 neutro, < 6 loss. */
const coloreVoto = (voto: number) =>
  voto >= 7 ? 'var(--accent)' : voto >= SUFFICIENZA ? 'var(--text-muted)' : 'var(--loss)'

const assi = {
  x: {
    dataKey: 'etichetta',
    tickLine: false,
    axisLine: false,
    interval: 'preserveStartEnd' as const,
    minTickGap: 12,
    tickMargin: 8,
  },
  y: { tickLine: false, axisLine: false, width: 28, tickMargin: 4 },
}

function Riquadro({ p, children }: { p: PuntoPartita; children: React.ReactNode }) {
  return (
    <div className="flex min-w-44 flex-col gap-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm shadow-lg">
      <span className="text-xs text-muted first-letter:uppercase">{p.data}</span>
      <span className="font-semibold">
        {p.squadra} {p.risultato} {p.avversario}
      </span>
      <span className="text-xs text-muted">{p.esitoEsteso}</span>
      <div className="mt-1 flex flex-col gap-0.5 border-t border-border pt-1.5">{children}</div>
    </div>
  )
}

const Riga = ({ label, value, marker }: { label: string; value: string; marker?: React.ReactNode }) => (
  <span className="flex items-center justify-between gap-4">
    <span className="flex items-center gap-1.5 text-muted">
      {marker}
      {label}
    </span>
    <span className="num text-base">{value}</span>
  </span>
)

function TooltipVoti({ active, payload }: TooltipContentProps) {
  const p = active ? (payload?.[0]?.payload as PuntoPartita | undefined) : undefined
  if (!p) return null
  return (
    <Riquadro p={p}>
      <Riga
        label="Voto"
        value={p.voto === null ? 'S.V.' : formatVoto(p.voto)}
        marker={
          p.voto !== null && (
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: coloreVoto(p.voto) }} />
          )
        }
      />
      <Riga
        label="Media ultime 5"
        value={formatMedia(p.mediaMobile)}
        marker={<span className="h-0.5 w-3 rounded-full bg-accent-2" />}
      />
    </Riquadro>
  )
}

function TooltipGol({ active, payload }: TooltipContentProps) {
  const p = active ? (payload?.[0]?.payload as PuntoPartita | undefined) : undefined
  if (!p) return null
  return (
    <Riquadro p={p}>
      <Riga label="Gol" value={String(p.gol)} />
    </Riquadro>
  )
}

const barra = (fill: (p: PuntoPartita) => string) =>
  function Barra(props: BarShapeProps) {
    const p = props.payload as PuntoPartita
    // CSS custom properties: via style, non come attributi SVG di presentazione.
    return <Rectangle {...props} radius={[4, 4, 0, 0]} style={{ fill: fill(p) }} />
  }

const BarraVoto = barra((p) => (p.voto === null ? 'transparent' : coloreVoto(p.voto)))
const BarraGol = barra(() => 'var(--accent-2)')

/** Colonna per partita col voto (colorata per fascia) e linea della media mobile sulle ultime 5. */
export function VotiChart({ punti }: { punti: PuntoPartita[] }) {
  const reduced = useReducedMotion()
  const votati = punti.filter((p) => p.voto !== null)
  const ultimaMedia = punti.at(-1)?.mediaMobile ?? null

  return (
    <figure className="flex flex-col gap-3">
      <div
        className="chart"
        style={{ height: ALTEZZA }}
        role="img"
        aria-label={`Voti in ${votati.length} partite. Media delle ultime 5: ${formatMedia(ultimaMedia)}.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={punti} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} />
            <XAxis {...assi.x} />
            <YAxis {...assi.y} domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
            <ReferenceLine y={SUFFICIENZA} className="chart-reference" />
            <Tooltip content={TooltipVoti} cursor={{ className: 'chart-cursor' }} isAnimationActive={false} />
            <Bar
              dataKey="voto"
              maxBarSize={24}
              shape={BarraVoto}
              isAnimationActive={!reduced}
              animationDuration={CHART_ANIMATION_MS}
            />
            <Line
              dataKey="mediaMobile"
              type="monotone"
              className="chart-line"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, className: 'chart-dot' }}
              connectNulls
              isAnimationActive={!reduced}
              animationDuration={CHART_ANIMATION_MS}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-accent" aria-hidden="true" />7 o più
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-muted" aria-hidden="true" />6–6,5
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-loss" aria-hidden="true" />
          Sotto il 6
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-3 rounded-full bg-accent-2" aria-hidden="true" />
          Media ultime 5
        </span>
      </figcaption>
    </figure>
  )
}

/** Colonna per partita coi gol segnati. */
export function GolChart({ punti }: { punti: PuntoPartita[] }) {
  const reduced = useReducedMotion()
  const totale = punti.reduce((t, p) => t + p.gol, 0)
  const massimo = Math.max(1, ...punti.map((p) => p.gol))

  return (
    <figure
      className="chart"
      style={{ height: ALTEZZA }}
      role="img"
      aria-label={`${totale} gol in ${punti.length} partite, massimo ${massimo} in una partita.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={punti} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} />
          <XAxis {...assi.x} />
          <YAxis {...assi.y} allowDecimals={false} domain={[0, massimo]} />
          <Tooltip content={TooltipGol} cursor={{ className: 'chart-cursor' }} isAnimationActive={false} />
          <Bar
            dataKey="gol"
            maxBarSize={24}
            shape={BarraGol}
            isAnimationActive={!reduced}
            animationDuration={CHART_ANIMATION_MS}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </figure>
  )
}
