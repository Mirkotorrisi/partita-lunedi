'use client'

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'

import { ABILITA_MAX } from '@/lib/abilita'

import { CHART_ANIMATION_MS, useReducedMotion } from './useReducedMotion'

export interface PuntoRadar {
  categoria: string
  valore: number
}

/** Esagono (o pentagono) delle categorie di abilità, come sulle card dei videogiochi. */
export function RadarAbilita({ punti }: { punti: PuntoRadar[] }) {
  const reduced = useReducedMotion()
  const descrizione = punti.map((p) => `${p.categoria} ${p.valore}`).join(', ')

  return (
    <div
      className="chart chart-radar w-full"
      style={{ height: 240 }}
      role="img"
      aria-label={`Abilità per categoria: ${descrizione}.`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={punti}
          outerRadius="72%"
          margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
        >
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis dataKey="categoria" tickLine={false} />
          <PolarRadiusAxis domain={[0, ABILITA_MAX]} tick={false} axisLine={false} />
          <Radar
            dataKey="valore"
            strokeWidth={2}
            fillOpacity={0.3}
            dot={{ r: 3, className: 'chart-radar-dot' }}
            isAnimationActive={!reduced}
            animationDuration={CHART_ANIMATION_MS}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
