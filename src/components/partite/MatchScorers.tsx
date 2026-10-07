import { BallIcon } from '@/components/ui/BallIcon'
import type { Contesto } from '@/lib/data'
import { nomeBreve } from '@/lib/format'
import { marcatoriPartita, type Lato, type Partita } from '@/lib/stats'

/** Marcatori di un lato (autogol in fondo), allineati a destra per la squadra B. */
export function MatchScorers({
  partita,
  lato,
  ctx,
  className = 'text-sm text-muted',
}: {
  partita: Partita
  lato: Lato
  ctx: Pick<Contesto, 'giocatoriById'>
  className?: string
}) {
  const lista = marcatoriPartita(partita, lato).flatMap(({ giocatoreId, gol }) => {
    const g = ctx.giocatoriById.get(giocatoreId)
    return g ? [{ id: giocatoreId, nome: nomeBreve(g), gol }] : []
  })
  const autogol = lato === 'A' ? partita.autogolA : partita.autogolB

  return (
    <ul className={`flex flex-col gap-0.5 ${className} ${lato === 'B' ? 'items-end text-right' : ''}`}>
      {lista.map((m) => (
        <li key={m.id} className="flex items-center gap-1.5">
          <BallIcon className="h-3 w-3 shrink-0" />
          <span>
            {m.nome}
            {m.gol > 1 && <span className="ml-1 font-semibold text-text">×{m.gol}</span>}
          </span>
        </li>
      ))}
      {autogol > 0 && (
        <li className="flex items-center gap-1.5 italic">
          <BallIcon className="h-3 w-3 shrink-0" />
          <span>Autogol{autogol > 1 ? ` ×${autogol}` : ''}</span>
        </li>
      )}
    </ul>
  )
}
