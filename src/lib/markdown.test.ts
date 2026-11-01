import { describe, expect, it } from 'vitest'

import { analizzaInline, analizzaMarkdown, markdownATesto } from './markdown'

describe('analizzaInline', () => {
  it('riconosce link, grassetto e corsivo', () => {
    expect(analizzaInline('Le **pagelle** sono [qui](https://x.it/p) e _subito_')).toEqual([
      { tipo: 'testo', testo: 'Le ' },
      { tipo: 'forte', figli: [{ tipo: 'testo', testo: 'pagelle' }] },
      { tipo: 'testo', testo: ' sono ' },
      { tipo: 'link', url: 'https://x.it/p', figli: [{ tipo: 'testo', testo: 'qui' }] },
      { tipo: 'testo', testo: ' e ' },
      { tipo: 'corsivo', figli: [{ tipo: 'testo', testo: 'subito' }] },
    ])
  })

  it('trasforma gli URL nudi in link senza la punteggiatura finale', () => {
    expect(analizzaInline('Vedi https://partita-lunedi.netlify.app/partite/2026-10-28.')).toEqual([
      { tipo: 'testo', testo: 'Vedi ' },
      {
        tipo: 'link',
        url: 'https://partita-lunedi.netlify.app/partite/2026-10-28',
        figli: [{ tipo: 'testo', testo: 'https://partita-lunedi.netlify.app/partite/2026-10-28' }],
      },
      { tipo: 'testo', testo: '.' },
    ])
    expect(analizzaInline('(https://it.wikipedia.org/wiki/Calcio_(sport))')).toEqual([
      { tipo: 'testo', testo: '(' },
      {
        tipo: 'link',
        url: 'https://it.wikipedia.org/wiki/Calcio_(sport)',
        figli: [{ tipo: 'testo', testo: 'https://it.wikipedia.org/wiki/Calcio_(sport)' }],
      },
      { tipo: 'testo', testo: ')' },
    ])
  })

  it('accetta link relativi e non annida link nei link', () => {
    expect(analizzaInline('[**pagelle** https://x.it](/partite/2026-10-28)')).toEqual([
      {
        tipo: 'link',
        url: '/partite/2026-10-28',
        figli: [
          { tipo: 'forte', figli: [{ tipo: 'testo', testo: 'pagelle' }] },
          { tipo: 'testo', testo: ' https://x.it' },
        ],
      },
    ])
  })

  it('non scambia asterischi e trattini bassi dentro le parole per corsivo', () => {
    expect(analizzaInline('voto 5*5 e nome_utente_1')).toEqual([{ tipo: 'testo', testo: 'voto 5*5 e nome_utente_1' }])
    expect(analizzaInline('2 * 3 * 4')).toEqual([{ tipo: 'testo', testo: '2 * 3 * 4' }])
  })

  it('lascia il testo com’è quando non c’è markdown', () => {
    expect(analizzaInline('Si gioca alle 21:30')).toEqual([{ tipo: 'testo', testo: 'Si gioca alle 21:30' }])
    expect(analizzaInline('')).toEqual([])
  })
})

describe('analizzaMarkdown', () => {
  it('separa paragrafi con righe vuote e tiene gli a capo dentro il paragrafo', () => {
    expect(analizzaMarkdown('Prima riga\nseconda riga\n\n\nAltro paragrafo  \n')).toEqual([
      {
        tipo: 'paragrafo',
        figli: [{ tipo: 'testo', testo: 'Prima riga' }, { tipo: 'acapo' }, { tipo: 'testo', testo: 'seconda riga' }],
      },
      { tipo: 'paragrafo', figli: [{ tipo: 'testo', testo: 'Altro paragrafo' }] },
    ])
  })

  it('riconosce titoli ed elenchi puntati e numerati', () => {
    expect(analizzaMarkdown('## Convocati\n- Rossi\n* Bianchi\n\n1. primo\n2) secondo')).toEqual([
      { tipo: 'titolo', figli: [{ tipo: 'testo', testo: 'Convocati' }] },
      {
        tipo: 'lista',
        ordinata: false,
        voci: [[{ tipo: 'testo', testo: 'Rossi' }], [{ tipo: 'testo', testo: 'Bianchi' }]],
      },
      {
        tipo: 'lista',
        ordinata: true,
        voci: [[{ tipo: 'testo', testo: 'primo' }], [{ tipo: 'testo', testo: 'secondo' }]],
      },
    ])
  })

  it('gestisce i fine riga di Windows', () => {
    expect(analizzaMarkdown('a\r\n\r\nb')).toHaveLength(2)
  })
})

describe('markdownATesto', () => {
  it('toglie i simboli e tiene gli URL per la notifica', () => {
    const md = '**Pagelle pronte!**\n\nLe trovi [qui](https://x.it/p) o su https://x.it/q.\n\n- *uno*\n- due'
    expect(markdownATesto(md)).toBe('Pagelle pronte!\n\nLe trovi qui (https://x.it/p) o su https://x.it/q.\n\n• uno\n• due')
  })

  it('non cambia un testo senza markdown', () => {
    expect(markdownATesto('Si gioca alle 21:30\nal Condorelli')).toBe('Si gioca alle 21:30\nal Condorelli')
  })
})
