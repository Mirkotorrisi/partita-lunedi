import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Inter } from 'next/font/google'
import Link from 'next/link'
import { Suspense } from 'react'

import { NavLinks } from '@/components/layout/NavLinks'
import { SeasonSelect } from '@/components/layout/SeasonSelect'
import { getContesto, TUTTE_LE_STAGIONI } from '@/lib/data'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow',
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: 'Partita del lunedì', template: '%s · Partita del lunedì' },
  description: 'Risultati, marcatori e pagelle della partita del lunedì.',
}

export const viewport: Viewport = {
  themeColor: '#0B0F14',
  viewportFit: 'cover',
  colorScheme: 'dark',
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  // Senza searchParams: il layout serve solo l'elenco stagioni, la scelta la legge il client.
  const { stagioni } = await getContesto()

  return (
    <html lang="it" className={`${inter.variable} ${barlow.variable}`}>
      <body className="min-h-dvh">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between gap-4 px-4 lg:h-16">
            <Link href="/" className="flex min-h-11 items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden="true" />
              <span className="font-display text-xl font-bold tracking-wide uppercase">Partita del lunedì</span>
            </Link>
            {/* Da lg in su la nav sta nell'header; sotto è la tab bar fissa in fondo (vedi sotto). */}
            <div className="hidden lg:block">
              <Suspense fallback={null}>
                <NavLinks />
              </Suspense>
            </div>
            <Suspense fallback={<div className="h-11 w-28" />}>
              <SeasonSelect stagioni={stagioni} predefinita={stagioni[0] ?? TUTTE_LE_STAGIONI} tutte={TUTTE_LE_STAGIONI} />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto max-w-[1100px] px-4 pt-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+24px)] lg:pt-6 lg:pb-12">
          {children}
        </main>
        <div className="lg:hidden">
          <Suspense fallback={null}>
            <NavLinks />
          </Suspense>
        </div>
      </body>
    </html>
  )
}
