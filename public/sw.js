// Service worker: serve solo per le notifiche push (nessuna cache offline).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

const URL_PREDEFINITO = '/comunicazioni'

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title || 'Partita del lunedì', {
      body,
      icon: '/icon-192-v2.png',
      badge: '/icon-192-v2.png',
      data: { url: url || URL_PREDEFINITO },
    }),
  )
})

// Al tocco si apre la pagina indicata: in una finestra già aperta se c'è, altrimenti in una nuova.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || URL_PREDEFINITO, self.location.origin).href
  event.waitUntil(
    (async () => {
      const aperte = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const esistente = aperte.find((c) => c.url.startsWith(self.location.origin))
      if (esistente) {
        try {
          // navigate() fallisce se la finestra non è controllata da questo worker: si ripiega su openWindow.
          const c = await esistente.navigate(url)
          if (c) return c.focus()
        } catch {}
      }
      return self.clients.openWindow(url)
    })(),
  )
})
