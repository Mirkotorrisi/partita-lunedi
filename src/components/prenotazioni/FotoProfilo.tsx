'use client'

import { Camera, Trash2 } from 'lucide-react'
import { useRef, useState, useTransition } from 'react'

import { caricaFoto, rimuoviFoto } from '@/app/(frontend)/prenotazioni/actions'
import { PlayerAvatar } from '@/components/ui/PlayerAvatar'
import { ridimensionaFoto } from '@/lib/ridimensiona-foto'
import type { Giocatore } from '@/lib/stats'

export function FotoProfilo({ giocatore }: { giocatore: Pick<Giocatore, 'nome' | 'cognome' | 'fotoUrl'> }) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [errore, setErrore] = useState<string | null>(null)

  const scelta = (file: File | undefined) => {
    if (!file) return
    startTransition(async () => {
      setErrore(null)
      try {
        const formData = new FormData()
        formData.set('foto', await ridimensionaFoto(file), 'foto.jpg')
        const res = await caricaFoto(formData)
        if (!res.ok) setErrore(res.errore)
      } catch {
        setErrore('Non riesco a leggere questa immagine, prova con un’altra')
      } finally {
        if (input.current) input.current.value = ''
      }
    })
  }

  const rimuovi = () =>
    startTransition(async () => {
      setErrore(null)
      await rimuoviFoto()
    })

  return (
    <div className="flex flex-col gap-2">
      <span className="label">Foto profilo</span>
      <div className="flex items-center gap-4">
        <PlayerAvatar giocatore={giocatore} size={96} className={pending ? 'opacity-50' : ''} />
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:border-muted disabled:opacity-50"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            <Camera className="h-4 w-4" aria-hidden="true" /> {giocatore.fotoUrl ? 'Cambia foto' : 'Carica una foto'}
          </button>
          {giocatore.fotoUrl && (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-muted hover:text-text disabled:opacity-50"
              disabled={pending}
              onClick={rimuovi}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Rimuovi
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-label="Scegli una foto"
        onChange={(e) => scelta(e.target.files?.[0])}
      />
      {errore && <p role="alert" className="text-sm text-loss">{errore}</p>}
    </div>
  )
}
