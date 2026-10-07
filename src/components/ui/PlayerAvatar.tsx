import Image from 'next/image'

import { iniziali } from '@/lib/format'
import type { Giocatore } from '@/lib/stats'

const TESTO: Record<PlayerAvatarSize, string> = { 32: 'text-xs', 48: 'text-base', 96: 'text-3xl' }

export type PlayerAvatarSize = 32 | 48 | 96

export function PlayerAvatar({
  giocatore,
  size = 32,
  className = '',
}: {
  giocatore: Pick<Giocatore, 'nome' | 'cognome' | 'fotoUrl'>
  size?: PlayerAvatarSize
  className?: string
}) {
  const base = `relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 ${className}`
  const style = { width: size, height: size }

  if (giocatore.fotoUrl) {
    return (
      <span className={base} style={style}>
        <Image
          src={giocatore.fotoUrl}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          className="h-full w-full object-cover"
        />
      </span>
    )
  }

  return (
    <span className={`${base} font-display font-bold text-muted ${TESTO[size]}`} style={style} aria-hidden="true">
      {iniziali(giocatore)}
    </span>
  )
}
