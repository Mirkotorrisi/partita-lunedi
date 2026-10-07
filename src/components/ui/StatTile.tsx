/** Etichetta piccola + numero grande. `highlight` colora il numero in accent. */
export function StatTile({
  label,
  value,
  sub,
  highlight = false,
  className = '',
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  highlight?: boolean
  className?: string
}) {
  return (
    <div className={`card flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="label min-h-8 [overflow-wrap:anywhere]">{label}</span>
      <span className={`num text-4xl leading-none ${highlight ? 'text-accent' : 'text-text'}`}>{value}</span>
      {sub ? <span className="truncate text-xs text-muted">{sub}</span> : null}
    </div>
  )
}
