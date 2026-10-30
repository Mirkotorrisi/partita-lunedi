import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Partita del lunedì',
    short_name: 'Partita',
    description: 'Prenotazioni, risultati, marcatori e pagelle della partita del lunedì.',
    lang: 'it',
    // L'uso principale è prenotarsi: l'icona apre direttamente la lista.
    start_url: '/prenotazioni',
    scope: '/',
    display: 'standalone',
    background_color: '#0B0F14',
    theme_color: '#0B0F14',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [{ name: 'Risultati', url: '/' }],
  }
}
