import type { Squadra } from '@/lib/stats'

/** Pallino nel colore della squadra + nome. Il colore non va mai su grandi superfici. */
export function TeamBadge({
  squadra,
  muted = false,
  className = '',
}: {
  squadra: Pick<Squadra, 'nome' | 'colore'>
  muted?: boolean
  className?: string
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-1.5 ${muted ? 'text-muted' : 'text-text'} ${className}`}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: squadra.colore }}
        aria-hidden="true"
      />
      <span className="truncate">{squadra.nome}</span>
    </span>
  )
}
