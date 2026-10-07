import { ESITO_ESTESO } from '@/lib/format'
import type { Esito } from '@/lib/stats'

const COLORI: Record<Esito, string> = {
  V: 'bg-win text-bg',
  N: 'bg-draw text-bg',
  P: 'bg-loss text-bg',
}

export function ResultBadge({ esito, className = '' }: { esito: Esito; className?: string }) {
  return (
    <span
      className={`num inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-sm ${COLORI[esito]} ${className}`}
      title={ESITO_ESTESO[esito]}
    >
      <span aria-hidden="true">{esito}</span>
      <span className="sr-only">{ESITO_ESTESO[esito]}</span>
    </span>
  )
}
