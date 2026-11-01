import Link from 'next/link'
import type { ReactNode } from 'react'

import { analizzaMarkdown, type Blocco, type Inline } from '@/lib/markdown'

const LINK = 'underline underline-offset-2 decoration-muted hover:text-accent [overflow-wrap:anywhere]'

// Host del sito pubblicato (Netlify lo espone in URL): un link assoluto al sito stesso resta nella PWA
// invece di aprire una nuova scheda.
const HOST_SITO = new URL(process.env.URL ?? 'https://partita-lunedi.netlify.app').host

const percorsoInterno = (url: string): string | null => {
  if (url.startsWith('/')) return url
  try {
    const u = new URL(url)
    return u.host === HOST_SITO ? `${u.pathname}${u.search}${u.hash}` : null
  } catch {
    return null
  }
}

function inline(nodi: Inline[]): ReactNode[] {
  return nodi.map((n, i) => {
    switch (n.tipo) {
      case 'testo':
        return n.testo
      case 'acapo':
        return <br key={i} />
      case 'forte':
        return <strong key={i}>{inline(n.figli)}</strong>
      case 'corsivo':
        return <em key={i}>{inline(n.figli)}</em>
      case 'link': {
        const interno = percorsoInterno(n.url)
        return interno !== null ? (
          <Link key={i} href={interno} className={LINK}>
            {inline(n.figli)}
          </Link>
        ) : (
          <a key={i} href={n.url} className={LINK} target="_blank" rel="noopener noreferrer">
            {inline(n.figli)}
          </a>
        )
      }
    }
  })
}

function blocco(b: Blocco, i: number): ReactNode {
  switch (b.tipo) {
    case 'paragrafo':
      return <p key={i}>{inline(b.figli)}</p>
    case 'titolo':
      return (
        <p key={i} className="font-semibold">
          {inline(b.figli)}
        </p>
      )
    case 'lista':
      return b.ordinata ? (
        <ol key={i} className="list-decimal pl-5">
          {b.voci.map((v, j) => (
            <li key={j}>{inline(v)}</li>
          ))}
        </ol>
      ) : (
        <ul key={i} className="list-disc pl-5">
          {b.voci.map((v, j) => (
            <li key={j}>{inline(v)}</li>
          ))}
        </ul>
      )
  }
}

/** Testo scritto in markdown ridotto (vedi lib/markdown.ts): link cliccabili, grassetto, elenchi. */
export function Markdown({ testo, className }: { testo: string; className?: string }) {
  return <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>{analizzaMarkdown(testo).map(blocco)}</div>
}
