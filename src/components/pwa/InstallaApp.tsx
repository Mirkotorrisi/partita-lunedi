'use client'

import { Download, Share } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

/** Invito a mettere l'app nella Home. Sparisce una volta installata. */
export function InstallaApp() {
  const [installata, setInstallata] = useState(true)
  const [ios, setIos] = useState(false)
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Rilevamento dipendente dal browser: si legge solo dopo il montaggio.
    /* eslint-disable react-hooks/set-state-in-effect */
    setInstallata(window.matchMedia('(display-mode: standalone)').matches)
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent))
    /* eslint-enable react-hooks/set-state-in-effect */
    const prima = (e: Event) => {
      e.preventDefault()
      setEvento(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', prima)
    return () => window.removeEventListener('beforeinstallprompt', prima)
  }, [])

  if (installata || (!ios && !evento)) return null

  return (
    <section className="card flex flex-col gap-2" aria-labelledby="installa">
      <h2 id="installa" className="section-title">
        Metti l&apos;app nella Home
      </h2>
      {ios ? (
        <p className="text-sm text-muted">
          Tocca <Share className="inline h-4 w-4" aria-label="Condividi" /> in Safari e poi{' '}
          <strong className="text-text">Aggiungi alla schermata Home</strong>. Poi apri l&apos;app dall&apos;icona: così
          potrai anche ricevere le notifiche.
        </p>
      ) : (
        <div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-bg"
            onClick={() => void evento?.prompt()}
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Installa
          </button>
        </div>
      )}
    </section>
  )
}
