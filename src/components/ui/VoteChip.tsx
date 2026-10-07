import { formatVoto } from '@/lib/format'

/** Voto in un chip colorato per fascia: ≥ 7 accent, 6–6,5 testo, < 6 loss. */
export function VoteChip({ voto }: { voto: number | null }) {
  if (voto === null) {
    return (
      <span className="num inline-flex h-7 min-w-10 items-center justify-center rounded-lg bg-surface-2 px-2 text-base text-muted">
        <span aria-hidden="true">–</span>
        <span className="sr-only">Senza voto</span>
      </span>
    )
  }
  const colore = voto >= 7 ? 'text-accent' : voto >= 6 ? 'text-text' : 'text-loss'
  return (
    <span
      className={`num inline-flex h-7 min-w-10 items-center justify-center rounded-lg border border-border bg-surface-2 px-2 text-base ${colore}`}
    >
      {formatVoto(voto)}
    </span>
  )
}
