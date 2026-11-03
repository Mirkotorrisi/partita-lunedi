import { COLORE_FASCIA, fasciaAbilita } from '@/lib/abilita'

/** Numero di abilità su sfondo colorato per fascia (verde / giallo / rosso); "–" se non assegnato. */
export function ValoreAbilita({ v, grande = false }: { v: number | null; grande?: boolean }) {
  const misura = grande ? 'h-8 min-w-10 text-lg' : 'h-6 min-w-8 text-sm'
  if (v === null) {
    return (
      <span
        className={`num inline-flex ${misura} items-center justify-center text-muted`}
        aria-label="non assegnato"
      >
        –
      </span>
    )
  }
  return (
    <span
      className={`num inline-flex ${misura} items-center justify-center rounded-md px-1.5 text-bg`}
      style={{ backgroundColor: COLORE_FASCIA[fasciaAbilita(v)] }}
    >
      {v}
    </span>
  )
}
