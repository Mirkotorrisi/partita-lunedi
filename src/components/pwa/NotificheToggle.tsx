'use client'

import { Bell, BellOff } from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'

import { rimuoviPush, salvaPush } from '@/app/(frontend)/prenotazioni/actions'

const CHIAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function chiaveBinaria(base64: string) {
  const b64 = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
}

type Stato = 'caricamento' | 'non-supportate' | 'serve-home' | 'bloccate' | 'spente' | 'accese'

/** Attiva/disattiva le notifiche push per questo dispositivo (deve essere già associato a un giocatore). */
export function NotificheToggle() {
  const [stato, setStato] = useState<Stato>('caricamento')
  const [errore, setErrore] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    void (async () => {
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const standalone = window.matchMedia('(display-mode: standalone)').matches
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !CHIAVE) {
        // Su iPhone le notifiche esistono solo nell'app aggiunta alla Home.
        return setStato(ios && !standalone ? 'serve-home' : 'non-supportate')
      }
      if (Notification.permission === 'denied') return setStato('bloccate')
      const reg = await navigator.serviceWorker.ready
      setStato((await reg.pushManager.getSubscription()) ? 'accese' : 'spente')
    })()
  }, [])

  const attiva = () =>
    startTransition(async () => {
      setErrore(null)
      try {
        if ((await Notification.requestPermission()) !== 'granted') return setStato('bloccate')
        const reg = await navigator.serviceWorker.ready
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chiaveBinaria(CHIAVE!) }))
        const res = await salvaPush(JSON.parse(JSON.stringify(sub)))
        if (!res.ok) throw new Error(res.errore)
        setStato('accese')
      } catch (e) {
        setErrore((e as Error).message || 'Impossibile attivare le notifiche')
      }
    })

  const disattiva = () =>
    startTransition(async () => {
      const reg = await navigator.serviceWorker.ready
      await (await reg.pushManager.getSubscription())?.unsubscribe()
      await rimuoviPush()
      setStato('spente')
    })

  if (stato === 'caricamento' || stato === 'non-supportate') return null
  if (stato === 'serve-home') {
    return <p className="text-sm text-muted">Per le notifiche aggiungi l&apos;app alla Home e aprila da lì.</p>
  }
  if (stato === 'bloccate') {
    return <p className="text-sm text-muted">Notifiche bloccate: riattivale dalle impostazioni del browser.</p>
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text"
        disabled={pending}
        onClick={stato === 'accese' ? disattiva : attiva}
      >
        {stato === 'accese' ? (
          <>
            <BellOff className="h-4 w-4" aria-hidden="true" /> Disattiva le notifiche
          </>
        ) : (
          <>
            <Bell className="h-4 w-4" aria-hidden="true" /> Attiva le notifiche
          </>
        )}
      </button>
      {errore && <p role="alert" className="text-sm text-loss">{errore}</p>}
    </div>
  )
}
