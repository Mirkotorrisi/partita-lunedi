import { describe, expect, it } from 'vitest'

import {
  abilitaCompilate,
  abilitaVuote,
  fasciaAbilita,
  normalizzaAbilita,
  PESI_RUOLO,
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
  it("pesa le categorie per ruolo: un portiere non paga l'attacco scarso", () => {
    const a = normalizzaAbilita({
      portiere: { riflessi: 90 },
      difesa: { contrasto: 70 },
      fisico: { forza: 70 },
      passaggio: { visione: 60 },
      attacco: { finalizzazione: 20 },
      dribbling: { dribbling: 20 },
    })
    // 90·60 + 70·15 + 70·15 + 60·10 = 8100 / 100
    expect(valutazioneGenerale(a, 'portiere')).toBe(81)
  })

  it('per un attaccante la categoria Portiere non conta', () => {
    const a = normalizzaAbilita({ attacco: { finalizzazione: 80 }, portiere: { riflessi: 10 } })
    expect(valutazioneGenerale(a, 'attaccante')).toBe(80)
  })

  it('ridistribuisce i pesi sulle categorie compilate', () => {
    const a = normalizzaAbilita({ difesa: { contrasto: 80 }, attacco: { finalizzazione: 40 } })
    // difensore: difesa 40, attacco 10 → (80·40 + 40·10) / 50
    expect(valutazioneGenerale(a, 'difensore')).toBe(72)
  })

  it('è null senza voci compilate', () => {
    expect(valutazioneGenerale(abilitaVuote(), 'difensore')).toBeNull()
  })
})

describe('PESI_RUOLO', () => {
  it('ogni ruolo somma a 100', () => {
    for (const pesi of Object.values(PESI_RUOLO)) {
      expect(Object.values(pesi).reduce((t, p) => t + p, 0)).toBe(100)
    }
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
