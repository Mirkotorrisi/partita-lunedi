import { describe, expect, it } from 'vitest'

import {
  classificaMarcatori,
  classificaMediaVoto,
  classificaPercVittorie,
  distribuzioneMarcatori,
  elencoStagioni,
  filtraPartite,
  marcatoriPartita,
  migliorInCampo,
  presenzeGiocatore,
  records,
  riepilogo,
  scontriDiretti,
  stagioneDi,
  statsGiocatore,
  statsSquadra,
  statsTutti,
  type Partita,
  type Riga,
} from './stats'

const ROSSI = 1
const BLU = 2

let nextId = 100
/** Partita Rossi (A) vs Blu (B): il risultato si ricava dalle formazioni come fa l'hook di Payload. */
function partita(
  giorno: string,
  formazioneA: Riga[],
  formazioneB: Riga[],
  opts: { autogolA?: number; autogolB?: number; scambia?: boolean } = {},
): Partita {
  const autogolA = opts.autogolA ?? 0
  const autogolB = opts.autogolB ?? 0
  const somma = (rr: Riga[]) => rr.reduce((t, r) => t + r.gol, 0)
  return {
    id: nextId++,
    giorno,
    squadraAId: opts.scambia ? BLU : ROSSI,
    squadraBId: opts.scambia ? ROSSI : BLU,
    golA: somma(formazioneA) + autogolA,
    golB: somma(formazioneB) + autogolB,
    autogolA,
    autogolB,
    formazioneA,
    formazioneB,
    note: null,
  }
}
const r = (giocatoreId: number, gol: number, voto: number | null): Riga => ({ giocatoreId, gol, voto })

// Giocatori: 1 Mario, 2 Luca, 3 Paolo, 4 Gino, 5 Ospite (una sola partita)
const P1 = partita('2026-05-04', [r(1, 2, 7.5), r(2, 0, 6)], [r(3, 1, 6.5), r(4, 0, 5.5)]) // 2-1 Rossi
const P2 = partita('2026-05-11', [r(1, 0, 5.5), r(2, 1, 6.5)], [r(3, 1, 6), r(4, 0, null)], { autogolB: 1 }) // 1-2 Blu
const P3 = partita('2026-09-07', [r(1, 1, 7), r(3, 0, 6)], [r(2, 1, 6.5), r(4, 0, 6), r(5, 0, 8.5)]) // 1-1, Paolo e Luca hanno cambiato squadra
// Blu è squadra A in questa partita: lo scontro diretto deve comunque contare giusto.
const P4 = partita('2026-09-14', [r(2, 3, 8), r(4, 0, 6)], [r(1, 1, 6), r(3, 0, 5)], { scambia: true }) // Blu 3-1 Rossi
const TUTTE = [P3, P1, P4, P2] // volutamente non ordinate

describe('stagioni e filtri', () => {
  it('assegna la stagione da agosto a luglio', () => {
    expect(stagioneDi('2026-07-31')).toBe('2025-26')
    expect(stagioneDi('2026-08-01')).toBe('2026-27')
    expect(stagioneDi('2099-12-01')).toBe('2099-00')
  })

  it('elenca le stagioni dalla più recente', () => {
    expect(elencoStagioni(TUTTE)).toEqual(['2026-27', '2025-26'])
  })

  it('filtra per stagione e intervallo e ordina cronologicamente', () => {
    expect(filtraPartite(TUTTE).map((p) => p.giorno)).toEqual([
      '2026-05-04',
      '2026-05-11',
      '2026-09-07',
      '2026-09-14',
    ])
    expect(filtraPartite(TUTTE, { stagione: '2025-26' }).map((p) => p.id)).toEqual([P1.id, P2.id])
    expect(filtraPartite(TUTTE, { da: '2026-05-11', a: '2026-09-07' }).map((p) => p.id)).toEqual([
      P2.id,
      P3.id,
    ])
  })
})

describe('singola partita', () => {
  it('elenca i marcatori dal più prolifico', () => {
    expect(marcatoriPartita(P4, 'A')).toEqual([{ giocatoreId: 2, gol: 3 }])
    expect(marcatoriPartita(P1, 'B')).toEqual([{ giocatoreId: 3, gol: 1 }])
    expect(marcatoriPartita(P2, 'B')).toEqual([{ giocatoreId: 3, gol: 1 }]) // l'autogol non ha marcatore
  })

  it('sceglie il migliore in campo per voto, poi gol, poi squadra vincente', () => {
    expect(migliorInCampo(P3)?.giocatoreId).toBe(5)
    const pari = partita('2026-01-05', [r(1, 0, 7)], [r(2, 1, 7)])
    expect(migliorInCampo(pari)?.giocatoreId).toBe(2) // stesso voto, più gol
    const pariGol = partita('2026-01-12', [r(1, 0, 7)], [r(2, 0, 7)], { autogolB: 1 })
    expect(migliorInCampo(pariGol)?.giocatoreId).toBe(2) // stesso voto e gol: vince chi è nella squadra vincente
  })

  it('restituisce null se nessuno ha voto', () => {
    expect(migliorInCampo(partita('2026-01-19', [r(1, 0, null)], [r(2, 0, null)]))).toBeNull()
  })
})

describe('giocatore', () => {
  it('usa la squadra della formazione per vittorie e sconfitte', () => {
    const pres = presenzeGiocatore(TUTTE, 3)
    expect(pres.map((p) => [p.squadraId, p.esito])).toEqual([
      [BLU, 'P'], // P1: Blu perde 2-1
      [BLU, 'V'], // P2: Blu vince 2-1
      [ROSSI, 'N'], // P3: Paolo gioca con i Rossi
      [ROSSI, 'P'], // P4: Rossi (lato B) perde 1-3
    ])
  })

  it('calcola presenze, gol, medie e bilancio', () => {
    const s = statsGiocatore(TUTTE, 1)
    expect(s.presenze).toBe(4)
    expect(s.gol).toBe(4)
    expect(s.mediaGol).toBe(1)
    expect(s.mediaVoto).toBeCloseTo((7.5 + 5.5 + 7 + 6) / 4)
    expect(s.votoMax).toBe(7.5)
    expect(s.votoMin).toBe(5.5)
    expect([s.vittorie, s.pareggi, s.sconfitte]).toEqual([1, 1, 2])
    expect(s.percVittorie).toBe(0.25)
  })

  it('esclude dalla media chi non ha voto', () => {
    const s = statsGiocatore(TUTTE, 4)
    expect(s.presenze).toBe(4)
    expect(s.voti).toBe(3)
    expect(s.mediaVoto).toBeCloseTo((5.5 + 6 + 6) / 3)
  })

  it('calcola la media mobile sugli ultimi 5 voti disponibili', () => {
    // La terza partita è senza voto: non sposta la media mobile.
    const giornate = [5, 6, null, 7, 8, 9, 10].map((voto, i) =>
      partita(`2026-02-0${i + 1}`, [r(1, 0, voto)], [r(2, 0, 6)]),
    )
    const s = statsGiocatore(giornate, 1)
    expect(s.andamento.map((a) => a.mediaMobile5)).toEqual([5, 5.5, 5.5, 6, 6.5, 7, 8])
    expect(s.ultimiVoti).toEqual([6, 7, 8, 9, 10])
  })

  it('gestisce un giocatore senza presenze', () => {
    const s = statsGiocatore(TUTTE, 999)
    expect(s).toMatchObject({ presenze: 0, gol: 0, mediaGol: 0, mediaVoto: null, percVittorie: 0 })
  })
})

describe('classifiche', () => {
  const stats = statsTutti(TUTTE)

  it('ordina i marcatori per gol, media gol, poi meno presenze', () => {
    // Mario 4 gol/4 pres, Luca 5 gol/4 pres, Paolo 2 gol/4 pres
    expect(classificaMarcatori(stats).map((p) => [p.posizione, p.stats.giocatoreId])).toEqual([
      [1, 2],
      [2, 1],
      [3, 3],
    ])
    const pari = statsTutti([
      partita('2026-03-02', [r(1, 2, 6), r(2, 1, 6)], [r(3, 0, 6)]),
      partita('2026-03-09', [r(2, 1, 6)], [r(3, 0, 6)]),
    ])
    // Mario 2 gol in 1 presenza batte Luca 2 gol in 2 presenze
    expect(classificaMarcatori(pari).map((p) => p.stats.giocatoreId)).toEqual([1, 2])
  })

  it('applica la soglia minima di presenze alla media voto', () => {
    const nessuna = classificaMediaVoto(stats, { tipo: 'nessuna' }, 4)
    expect(nessuna.sopraSoglia[0].stats.giocatoreId).toBe(5) // 8.5 in una partita

    const fissa = classificaMediaVoto(stats, { tipo: 'fissa', presenze: 2 }, 4)
    expect(fissa.minimo).toBe(2)
    expect(fissa.sopraSoglia.map((p) => p.stats.giocatoreId)).not.toContain(5)
    expect(fissa.sottoSoglia.map((s) => s.giocatoreId)).toEqual([5])
    expect(fissa.sopraSoglia[0].stats.giocatoreId).toBe(2) // Luca: (6+6.5+6.5+8)/4

    const perc = classificaMediaVoto(stats, { tipo: 'percentuale', quota: 0.3 }, 4)
    expect(perc.minimo).toBe(2) // ceil(1.2)
  })

  it('ordina per percentuale vittorie', () => {
    const c = classificaPercVittorie(stats)
    // Luca (V P N V) e Gino (P V N V) al 50%, Ospite (N) ultimo
    expect(c.slice(0, 2).map((p) => p.stats.giocatoreId).sort()).toEqual([2, 4])
    expect(c[0].stats.percVittorie).toBe(0.5)
    expect(c.at(-1)?.stats.giocatoreId).toBe(5)
    expect(classificaPercVittorie(stats, 2).map((p) => p.stats.giocatoreId)).not.toContain(5)
  })

  it('raggruppa i marcatori oltre i primi n in "Altri"', () => {
    const fette = distribuzioneMarcatori(stats, 2)
    expect(fette).toEqual([
      { giocatoreId: 2, gol: 5, quota: 5 / 11 },
      { giocatoreId: 1, gol: 4, quota: 4 / 11 },
      { giocatoreId: null, gol: 2, quota: 2 / 11, raggruppati: 1 },
    ])
    expect(distribuzioneMarcatori(stats, 7).some((f) => f.giocatoreId === null)).toBe(false)
    expect(distribuzioneMarcatori([], 7)).toEqual([])
  })
})

describe('riepilogo, squadre e record', () => {
  it('riassume il periodo', () => {
    const s = riepilogo(TUTTE)
    expect(s.partite).toBe(4)
    expect(s.golTotali).toBe(3 + 3 + 2 + 4)
    expect(s.mediaGolPartita).toBe(3)
  })

  it('calcola il bilancio di squadra a prescindere dal lato', () => {
    expect(statsSquadra(TUTTE, ROSSI)).toEqual({
      squadraId: ROSSI,
      partite: 4,
      vittorie: 1,
      pareggi: 1,
      sconfitte: 2,
      golFatti: 2 + 1 + 1 + 1,
      golSubiti: 1 + 2 + 1 + 3,
    })
    expect(scontriDiretti(TUTTE, BLU, ROSSI)).toMatchObject({ vittorie1: 2, pareggi: 1, vittorie2: 1, gol1: 7, gol2: 5 })
  })

  it('trova i record', () => {
    const rec = records(TUTTE)
    expect(rec.partitaConPiuGol).toMatchObject({ partitaId: P4.id, gol: 4 })
    expect(rec.migliorVoto).toMatchObject({ giocatoreId: 5, voto: 8.5 })
    expect(rec.piuGolInPartita).toMatchObject({ giocatoreId: 2, gol: 3 })
    // Luca segna in P2, P3, P4; Mario in P3 e P4 dopo lo 0 di P2
    expect(rec.strisciaGol).toMatchObject({ giocatoreId: 2, partite: 3, dal: '2026-05-11', al: '2026-09-14' })
  })

  it('non trova record senza partite', () => {
    expect(records([])).toEqual({ partitaConPiuGol: null, migliorVoto: null, piuGolInPartita: null, strisciaGol: null })
  })
})
