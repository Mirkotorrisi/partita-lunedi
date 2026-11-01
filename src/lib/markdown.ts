/**
 * Markdown ridotto per gli avvisi: paragrafi, titoli, elenchi, grassetto, corsivo, link e URL nudi.
 * Modulo puro (niente React) così è testabile; il rendering sta in components/ui/Markdown.tsx.
 * Niente HTML grezzo: il testo passa sempre come stringa, quindi non c'è rischio di iniezione.
 */

export type Inline =
  | { tipo: 'testo'; testo: string }
  | { tipo: 'acapo' }
  | { tipo: 'forte'; figli: Inline[] }
  | { tipo: 'corsivo'; figli: Inline[] }
  | { tipo: 'link'; url: string; figli: Inline[] }

export type Blocco =
  | { tipo: 'paragrafo'; figli: Inline[] }
  | { tipo: 'titolo'; figli: Inline[] }
  | { tipo: 'lista'; ordinata: boolean; voci: Inline[][] }

const TITOLO = /^#{1,6}\s+(.*)$/
const VOCE_PUNTATA = /^\s*[-*•]\s+(.*)$/
const VOCE_NUMERATA = /^\s*\d+[.)]\s+(.*)$/

// Un solo regex con alternative, in ordine di priorità: link, grassetto, corsivo, URL nudo.
const INLINE = new RegExp(
  [
    /\[(?<linkTesto>[^\]\n]+)\]\((?<linkUrl>https?:\/\/[^\s)]+|\/[^\s)]*)\)/.source,
    /\*\*(?<forte>[^\n]+?)\*\*/.source,
    /(?<![\w*])\*(?<corsivoA>[^\s*][^\n*]*?)\*(?![\w*])/.source,
    /(?<![\w_])_(?<corsivoB>[^\s_][^\n_]*?)_(?![\w_])/.source,
    /(?<url>https?:\/\/[^\s<>]+)/.source,
  ].join('|'),
  'g',
)

/** Un URL nudo non si porta dietro la punteggiatura che lo segue ("vedi https://x.it." → "https://x.it"). */
const ritagliaUrl = (url: string): string => {
  let fine = url.length
  while (fine > 0 && /[.,;:!?'"]/.test(url[fine - 1])) fine--
  // Una parentesi chiusa finale resta solo se bilanciata dentro l'URL.
  while (fine > 0 && url[fine - 1] === ')') {
    const aperte = (url.slice(0, fine).match(/\(/g) ?? []).length
    const chiuse = (url.slice(0, fine).match(/\)/g) ?? []).length
    if (chiuse <= aperte) break
    fine--
  }
  return url.slice(0, fine)
}

export function analizzaInline(testo: string): Inline[] {
  const nodi: Inline[] = []
  const aggiungiTesto = (t: string) => {
    if (!t) return
    const ultimo = nodi[nodi.length - 1]
    if (ultimo?.tipo === 'testo') ultimo.testo += t
    else nodi.push({ tipo: 'testo', testo: t })
  }

  let pos = 0
  INLINE.lastIndex = 0
  for (let m = INLINE.exec(testo); m; m = INLINE.exec(testo)) {
    const g = m.groups ?? {}
    let lunghezza = m[0].length
    let nodo: Inline
    if (g.linkUrl !== undefined) {
      nodo = { tipo: 'link', url: g.linkUrl, figli: senzaLink(analizzaInline(g.linkTesto)) }
    } else if (g.forte !== undefined) {
      nodo = { tipo: 'forte', figli: analizzaInline(g.forte) }
    } else if (g.corsivoA !== undefined || g.corsivoB !== undefined) {
      nodo = { tipo: 'corsivo', figli: analizzaInline(g.corsivoA ?? g.corsivoB) }
    } else {
      const url = ritagliaUrl(g.url)
      lunghezza = url.length
      nodo = { tipo: 'link', url, figli: [{ tipo: 'testo', testo: url }] }
    }
    aggiungiTesto(testo.slice(pos, m.index))
    nodi.push(nodo)
    pos = m.index + lunghezza
    INLINE.lastIndex = pos
  }
  aggiungiTesto(testo.slice(pos))
  return nodi
}

/** Unisce i nodi di testo adiacenti (dopo aver sciolto un link resta testo accanto a testo). */
const compatta = (nodi: Inline[]): Inline[] =>
  nodi.reduce<Inline[]>((acc, n) => {
    const ultimo = acc[acc.length - 1]
    if (n.tipo === 'testo' && ultimo?.tipo === 'testo') ultimo.testo += n.testo
    else acc.push(n.tipo === 'testo' ? { ...n } : n)
    return acc
  }, [])

/** Dentro un link non si annidano altri link: restano come testo. */
const senzaLink = (nodi: Inline[]): Inline[] =>
  compatta(
    nodi.flatMap((n) => {
      if (n.tipo === 'link') return n.figli
      if (n.tipo === 'forte' || n.tipo === 'corsivo') return [{ ...n, figli: senzaLink(n.figli) }]
      return [n]
    }),
  )

/** Righe consecutive di un paragrafo restano andate a capo (come whitespace-pre-line). */
const paragrafo = (righe: string[]): Blocco => ({
  tipo: 'paragrafo',
  figli: righe.flatMap((r, i) => (i === 0 ? analizzaInline(r) : [{ tipo: 'acapo' } as Inline, ...analizzaInline(r)])),
})

export function analizzaMarkdown(testo: string): Blocco[] {
  const blocchi: Blocco[] = []
  let righeParagrafo: string[] = []
  const chiudiParagrafo = () => {
    if (righeParagrafo.length) blocchi.push(paragrafo(righeParagrafo))
    righeParagrafo = []
  }

  for (const riga of testo.replace(/\r\n?/g, '\n').split('\n')) {
    const pulita = riga.trimEnd()
    if (!pulita.trim()) {
      chiudiParagrafo()
      continue
    }
    const titolo = pulita.match(TITOLO)
    if (titolo) {
      chiudiParagrafo()
      blocchi.push({ tipo: 'titolo', figli: analizzaInline(titolo[1].trim()) })
      continue
    }
    const voce = pulita.match(VOCE_PUNTATA) ?? pulita.match(VOCE_NUMERATA)
    if (voce) {
      chiudiParagrafo()
      const ordinata = VOCE_NUMERATA.test(pulita) && !VOCE_PUNTATA.test(pulita)
      const ultimo = blocchi[blocchi.length - 1]
      if (ultimo?.tipo === 'lista' && ultimo.ordinata === ordinata) ultimo.voci.push(analizzaInline(voce[1]))
      else blocchi.push({ tipo: 'lista', ordinata, voci: [analizzaInline(voce[1])] })
      continue
    }
    righeParagrafo.push(pulita.trimStart())
  }
  chiudiParagrafo()
  return blocchi
}

const inlineATesto = (nodi: Inline[]): string =>
  nodi
    .map((n) => {
      switch (n.tipo) {
        case 'testo':
          return n.testo
        case 'acapo':
          return '\n'
        case 'forte':
        case 'corsivo':
          return inlineATesto(n.figli)
        case 'link': {
          const etichetta = inlineATesto(n.figli)
          return etichetta === n.url ? n.url : `${etichetta} (${n.url})`
        }
      }
    })
    .join('')

/** Testo semplice per la notifica push: niente simboli, i link diventano "testo (url)". */
export function markdownATesto(testo: string): string {
  return analizzaMarkdown(testo)
    .map((b) => {
      switch (b.tipo) {
        case 'paragrafo':
        case 'titolo':
          return inlineATesto(b.figli)
        case 'lista':
          return b.voci.map((v, i) => `${b.ordinata ? `${i + 1}.` : '•'} ${inlineATesto(v)}`).join('\n')
      }
    })
    .join('\n\n')
}
