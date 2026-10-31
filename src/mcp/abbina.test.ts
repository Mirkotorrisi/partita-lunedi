import { describe, expect, it } from 'vitest'

import { abbinaGiocatore, abbinaSquadra, applicaPagelle, normalizza } from './abbina'

const giocatori = [
  { id: 1, nome: 'Marco', cognome: 'Rossi', soprannome: 'Il Pupo', nomeCompleto: 'Marco Rossi', slug: 'marco-rossi', attivo: true },
  { id: 2, nome: 'Marco', cognome: 'Bianchi', nomeCompleto: 'Marco Bianchi', slug: 'marco-bianchi', attivo: true },
  { id: 3, nome: 'Luca', cognome: 'Verdi', nomeCompleto: 'Luca Verdi', slug: 'luca-verdi', attivo: false },
  { id: 4, nome: 'Luca', cognome: 'Neri', nomeCompleto: 'Luca Neri', slug: 'luca-neri', attivo: true },
  { id: 5, nome: 'José', cognome: "D'Alò", nomeCompleto: "José D'Alò", slug: 'jose-d-alo', attivo: true },
]

describe('normalizza', () => {
  it('toglie accenti, apostrofi e maiuscole', () => {
    expect(normalizza("  José D'Alò ")).toBe('jose d alo')
  })
})

describe('abbinaGiocatore', () => {
  it('trova per nome completo, anche invertito o con accenti diversi', () => {
    expect(abbinaGiocatore(giocatori, 'marco rossi')).toEqual({ ok: true, doc: giocatori[0] })
    expect(abbinaGiocatore(giocatori, 'Rossi Marco')).toEqual({ ok: true, doc: giocatori[0] })
    expect(abbinaGiocatore(giocatori, 'Jose Dalo')).toMatchObject({ ok: false })
    expect(abbinaGiocatore(giocatori, "jose d'alo")).toEqual({ ok: true, doc: giocatori[4] })
  })

  it('trova per soprannome, slug e cognome', () => {
    expect(abbinaGiocatore(giocatori, 'il pupo')).toEqual({ ok: true, doc: giocatori[0] })
    expect(abbinaGiocatore(giocatori, 'marco-bianchi')).toEqual({ ok: true, doc: giocatori[1] })
    expect(abbinaGiocatore(giocatori, 'Bianchi')).toEqual({ ok: true, doc: giocatori[1] })
  })

  it('segnala i nomi ambigui elencando i candidati', () => {
    const esito = abbinaGiocatore(giocatori, 'Marco')
    expect(esito.ok).toBe(false)
    if (!esito.ok) expect(esito.errore).toContain('Marco Bianchi (id 2)')
  })

  it('a parità preferisce il giocatore attivo', () => {
    expect(abbinaGiocatore(giocatori, 'Luca')).toEqual({ ok: true, doc: giocatori[3] })
  })

  it('accetta un prefisso se è univoco', () => {
    expect(abbinaGiocatore(giocatori, 'pup')).toEqual({ ok: true, doc: giocatori[0] })
    expect(abbinaGiocatore(giocatori, 'Marco B')).toEqual({ ok: true, doc: giocatori[1] })
  })

  it('dice quando non trova nessuno', () => {
    expect(abbinaGiocatore(giocatori, 'Zidane')).toMatchObject({ ok: false })
    expect(abbinaGiocatore(giocatori, '   ')).toMatchObject({ ok: false })
  })
})

describe('abbinaSquadra', () => {
  const squadre = [
    { id: 1, nome: 'Rossi' },
    { id: 2, nome: 'Neri' },
    { id: 3, nome: 'Neri Juniores' },
  ]
  it('preferisce la corrispondenza esatta a quella parziale', () => {
    expect(abbinaSquadra(squadre, 'neri')).toEqual({ ok: true, doc: squadre[1] })
    expect(abbinaSquadra(squadre, 'junior')).toEqual({ ok: true, doc: squadre[2] })
    expect(abbinaSquadra(squadre, 'r')).toMatchObject({ ok: false })
    expect(abbinaSquadra(squadre, 'Blu')).toMatchObject({ ok: false })
  })
})

describe('applicaPagelle', () => {
  const a = [
    { id: 'r1', giocatore: 1, gol: 2, voto: null },
    { id: 'r2', giocatore: 2, gol: 0, voto: 6 },
  ]
  const b = [{ id: 'r3', giocatore: 4, gol: 1, voto: null }]

  it('aggiorna i voti in entrambe le formazioni senza toccare le altre righe', () => {
    const esito = applicaPagelle(a, b, [
      { giocatoreId: 1, voto: 7.5 },
      { giocatoreId: 4, voto: 6, gol: 2 },
    ])
    expect(esito.formazioneA).toEqual([
      { id: 'r1', giocatore: 1, gol: 2, voto: 7.5 },
      { id: 'r2', giocatore: 2, gol: 0, voto: 6 },
    ])
    expect(esito.formazioneB).toEqual([{ id: 'r3', giocatore: 4, gol: 2, voto: 6 }])
    expect(esito.nonInFormazione).toEqual([])
  })

  it('toglie il voto con null e segnala chi non è in formazione', () => {
    const esito = applicaPagelle(a, b, [
      { giocatoreId: 2, voto: null },
      { giocatoreId: 99, voto: 5 },
    ])
    expect(esito.formazioneA[1].voto).toBeNull()
    expect(esito.nonInFormazione).toEqual([99])
  })
})
