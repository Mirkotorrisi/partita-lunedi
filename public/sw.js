// Service worker: serve solo per le notifiche push (nessuna cache offline).
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title || 'Partita del lunedì', {
      body,
      icon: '/icon-192-v2.png',
      badge: '/icon-192-v2.png',
      data: { url: url || '/prenotazioni' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || '/prenotazioni', self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((aperte) => {
      const esistente = aperte.find((c) => c.url.startsWith(self.location.origin))
      return esistente ? esistente.navigate(url).then((c) => c?.focus()) : self.clients.openWindow(url)
    }),
  )
})
