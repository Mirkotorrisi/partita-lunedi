import { describe, expect, it } from 'vitest'

import {
  abilitaCompilate,
  abilitaVuote,
  fasciaAbilita,
  normalizzaAbilita,
  unisciAbilita,
  valoreCategoria,
  valutazioneGenerale,
} from './abilita'

describe('normalizzaAbilita', () => {
  it('riempie ogni voce e scarta i valori fuori range', () => {
    const a = normalizzaAbilita({ attacco: { finalizzazione: 70, potenzaTiro: 120 } })
    expect(a.attacco).toEqual({ finalizzazione: 70, potenzaTiro: null, posizionamento: null })
    expect(a.portiere).toEqual({ riflessi: null, parate: null, uscite: null })
  })

  it('accetta null e undefined', () => {
    expect(normalizzaAbilita(null)).toEqual(abilitaVuote())
    expect(abilitaCompilate(abilitaVuote())).toBe(false)
  })
})

describe('valoreCategoria', () => {
  it('fa la media arrotondata delle voci compilate', () => {
    const a = normalizzaAbilita({ difesa: { contrasto: 70, marcatura: 75 } })
    expect(valoreCategoria(a, 'difesa')).toBe(73)
    expect(valoreCategoria(a, 'attacco')).toBeNull()
  })
})

describe('valutazioneGenerale', () => {
  const a = normalizzaAbilita({
    attacco: { finalizzazione: 80 },
    difesa: { contrasto: 60 },
    portiere: { riflessi: 20 },
  })

  it('per i giocatori di movimento ignora la categoria Portiere', () => {
    expect(valutazioneGenerale(a, 'attaccante')).toBe(70)
  })

  it('per i portieri la include', () => {
    expect(valutazioneGenerale(a, 'portiere')).toBe(53)
  })

  it('è null senza voci compilate', () => {
    expect(valutazioneGenerale(abilitaVuote(), 'difensore')).toBeNull()
  })
})

describe('unisciAbilita', () => {
  it('cambia solo le voci passate e cancella con null', () => {
    const base = { attacco: { finalizzazione: 70, potenzaTiro: 60 }, fisico: { velocita: 50 } }
    const a = unisciAbilita(base, { attacco: { potenzaTiro: null, posizionamento: 65 } })
    expect(a.attacco).toEqual({ finalizzazione: 70, potenzaTiro: null, posizionamento: 65 })
    expect(a.fisico.velocita).toBe(50)
  })
})

describe('fasciaAbilita', () => {
  it('segue le soglie 80 e 65', () => {
    expect(fasciaAbilita(80)).toBe('alta')
    expect(fasciaAbilita(79)).toBe('media')
    expect(fasciaAbilita(65)).toBe('media')
    expect(fasciaAbilita(64)).toBe('bassa')
  })
})
