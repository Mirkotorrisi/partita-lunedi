export interface Segmento {
  label: string
  value: number
  color: string
}

/**
 * Barra orizzontale segmentata con legenda testuale (il colore non è mai l'unico indizio).
 * Usata per il bilancio V/N/P e per vittorie A / pareggi / vittorie B.
 */
export function SegmentedBar({ segmenti, className = '' }: { segmenti: Segmento[]; className?: string }) {
  const totale = segmenti.reduce((t, s) => t + s.value, 0)
  const descrizione = segmenti.map((s) => `${s.label}: ${s.value}`).join(', ')

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={descrizione}>
        {totale > 0 &&
          segmenti
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.label} style={{ flexGrow: s.value, backgroundColor: s.color }} className="h-full" />
            ))}
      </div>
      <dl className="flex justify-between gap-2 text-sm" aria-hidden="true">
        {segmenti.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-baseline gap-1.5 ${i === segmenti.length - 1 && segmenti.length > 1 ? 'flex-row-reverse' : ''}`}
          >
            <dd className="num text-xl leading-none" style={{ color: s.color }}>
              {s.value}
            </dd>
            <dt className="text-muted">{s.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
