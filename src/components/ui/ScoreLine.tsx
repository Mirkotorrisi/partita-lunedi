import type { Squadra } from '@/lib/stats'

type Size = 'sm' | 'md' | 'lg'

const PUNTEGGIO: Record<Size, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl sm:text-6xl',
}
const NOME: Record<Size, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-base sm:text-lg',
}

/**
 * Squadra A — punteggio — squadra B. La vincente è in testo pieno, la perdente in muted;
 * col pareggio entrambe piene.
 */
export function ScoreLine({
  squadraA,
  squadraB,
  golA,
  golB,
  size = 'md',
}: {
  squadraA: Pick<Squadra, 'nome' | 'colore'>
  squadraB: Pick<Squadra, 'nome' | 'colore'>
  golA: number
  golB: number
  size?: Size
}) {
  const perdeA = golA < golB
  const perdeB = golB < golA

  const nome = (s: Pick<Squadra, 'nome' | 'colore'>, perde: boolean, align: 'start' | 'end') => (
    <span
      className={`flex min-w-0 items-center gap-2 font-semibold ${NOME[size]} ${perde ? 'text-muted' : 'text-text'} ${align === 'end' ? 'flex-row-reverse text-right' : ''}`}
    >
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.colore }} aria-hidden="true" />
      <span className="truncate">{s.nome}</span>
    </span>
  )

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
      {nome(squadraA, perdeA, 'start')}
      <span
        className={`num flex items-center gap-2 leading-none ${PUNTEGGIO[size]}`}
        aria-label={`${squadraA.nome} ${golA}, ${squadraB.nome} ${golB}`}
      >
        <span className={perdeA ? 'text-muted' : 'text-text'}>{golA}</span>
        <span className="text-muted" aria-hidden="true">
          –
        </span>
        <span className={perdeB ? 'text-muted' : 'text-text'}>{golB}</span>
      </span>
      {nome(squadraB, perdeB, 'end')}
    </div>
  )
}
