/**
 * Popola il database con 2 squadre, 16 giocatori e 16 partite finte.
 *
 *   pnpm seed           → solo se non ci sono partite
 *   pnpm seed reset     → cancella partite, giocatori e squadre e ricrea tutto
 *
 * I dati sono deterministici (PRNG con seme fisso): ogni esecuzione produce lo stesso risultato.
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Giocatori, Partite, Squadre } from '@/payload-types'

type Ruolo = Giocatori['ruolo']
type Riga = NonNullable<Partite['formazioneA']>[number]

// `payload run` inoltra solo argomenti posizionali, non i flag.
const reset = process.argv.includes('reset')
const context = { disableRevalidate: true }

// mulberry32
function prng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = prng(20261006)
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const shuffle = <T>(arr: T[]) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
/** Estrazione di Poisson (Knuth), sufficiente per numeri piccoli come i gol. */
const poisson = (lambda: number) => {
  const l = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rand()
  } while (p > l)
  return k - 1
}
const mezzo = (n: number) => Math.round(n * 2) / 2
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

type Profilo = {
  nome: string
  cognome: string
  soprannome?: string
  ruolo: Ruolo
  squadra: 'A' | 'B'
  /** Gol attesi a partita. */
  gol: number
  /** Voto medio di base. */
  livello: number
  /** Probabilità di presentarsi a una partita. */
  presenza: number
  attivo?: boolean
}

const PROFILI: Profilo[] = [
  { nome: 'Luca', cognome: 'Ferri', ruolo: 'portiere', squadra: 'A', gol: 0.02, livello: 6.4, presenza: 0.95 },
  { nome: 'Davide', cognome: 'Greco', soprannome: 'Saracinesca', ruolo: 'portiere', squadra: 'B', gol: 0.02, livello: 6.6, presenza: 0.9 },
  { nome: 'Marco', cognome: 'Rinaldi', ruolo: 'difensore', squadra: 'A', gol: 0.25, livello: 6.2, presenza: 0.85 },
  { nome: 'Andrea', cognome: 'Colombo', ruolo: 'difensore', squadra: 'A', gol: 0.15, livello: 6.0, presenza: 0.9 },
  { nome: 'Simone', cognome: 'Galli', soprannome: 'Il Muro', ruolo: 'difensore', squadra: 'B', gol: 0.2, livello: 6.5, presenza: 0.95 },
  { nome: 'Matteo', cognome: 'Conti', ruolo: 'difensore', squadra: 'B', gol: 0.3, livello: 6.1, presenza: 0.8 },
  { nome: 'Alessandro', cognome: 'Marino', ruolo: 'centrocampista', squadra: 'A', gol: 0.6, livello: 6.6, presenza: 0.9 },
  { nome: 'Francesco', cognome: 'Bruno', soprannome: 'Ciccio', ruolo: 'centrocampista', squadra: 'A', gol: 0.5, livello: 6.3, presenza: 0.85 },
  { nome: 'Giuseppe', cognome: 'Esposito', soprannome: 'Peppe', ruolo: 'centrocampista', squadra: 'B', gol: 0.7, livello: 6.8, presenza: 0.9 },
  { nome: 'Lorenzo', cognome: 'Ricci', ruolo: 'centrocampista', squadra: 'B', gol: 0.45, livello: 6.2, presenza: 0.85 },
  { nome: 'Mario', cognome: 'Rossi', soprannome: 'Bomber', ruolo: 'attaccante', squadra: 'A', gol: 1.6, livello: 6.9, presenza: 0.95 },
  { nome: 'Federico', cognome: 'Lombardi', ruolo: 'attaccante', squadra: 'A', gol: 1.1, livello: 6.4, presenza: 0.8 },
  { nome: 'Niccolò', cognome: 'Moretti', soprannome: 'Nico', ruolo: 'attaccante', squadra: 'B', gol: 1.4, livello: 6.7, presenza: 0.9 },
  { nome: 'Gabriele', cognome: 'Barbieri', ruolo: 'attaccante', squadra: 'B', gol: 1.0, livello: 6.3, presenza: 0.85 },
  // Giocatori occasionali: servono per vedere la soglia minima di presenze.
  { nome: 'Stefano', cognome: 'Fontana', ruolo: 'centrocampista', squadra: 'A', gol: 0.8, livello: 7.4, presenza: 0.15 },
  { nome: 'Paolo', cognome: 'Santoro', ruolo: 'difensore', squadra: 'B', gol: 0.2, livello: 5.8, presenza: 0.2, attivo: false },
]

/** Lunedì delle partite: fine stagione 2025-26 e inizio 2026-27. */
const DATE = [
  '2026-04-13', '2026-04-20', '2026-04-27', '2026-05-04', '2026-05-11', '2026-05-18',
  '2026-05-25', '2026-06-08', '2026-06-15', '2026-06-22', '2026-07-06',
  '2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05',
]

async function main() {
  const payload = await getPayload({ config })

  const { totalDocs } = await payload.count({ collection: 'partite' })
  if (totalDocs > 0 && !reset) {
    payload.logger.warn(`Ci sono già ${totalDocs} partite. Usa "pnpm seed reset" per ricreare i dati.`)
    process.exit(1)
  }

  if (reset) {
    for (const collection of ['partite', 'giocatori', 'squadre'] as const) {
      await payload.delete({ collection, where: { id: { exists: true } }, context })
    }
  }

  const rossi = await payload.create({ collection: 'squadre', data: { nome: 'Rossi', colore: '#F43F5E' }, context })
  const blu = await payload.create({ collection: 'squadre', data: { nome: 'Blu', colore: '#3B82F6' }, context })
  const squadre: Record<'A' | 'B', Squadre> = { A: rossi, B: blu }

  // Numeri di maglia nello stesso ordine di PROFILI.
  const MAGLIE = [1, 12, 5, 3, 4, 2, 8, 6, 14, 16, 9, 11, 10, 7, 18, 13]
  const giocatori: { profilo: Profilo; doc: Giocatori }[] = []
  for (const [i, profilo] of PROFILI.entries()) {
    const doc = await payload.create({
      collection: 'giocatori',
      data: {
        nome: profilo.nome,
        cognome: profilo.cognome,
        soprannome: profilo.soprannome,
        ruolo: profilo.ruolo,
        numeroMaglia: MAGLIE[i],
        squadraAbituale: squadre[profilo.squadra].id,
        attivo: profilo.attivo ?? true,
      },
      context,
    })
    giocatori.push({ profilo, doc })
  }

  for (const giorno of DATE) {
    const presenti = giocatori.filter((g) => rand() < g.profilo.presenza)
    const lati: Record<'A' | 'B', typeof giocatori> = { A: [], B: [] }
    for (const g of presenti) lati[g.profilo.squadra].push(g)

    // Squadre equilibrate: chi è in più passa dall'altra parte (per questa partita soltanto).
    while (Math.abs(lati.A.length - lati.B.length) > 1) {
      const [da, a] = lati.A.length > lati.B.length ? (['A', 'B'] as const) : (['B', 'A'] as const)
      const candidati = lati[da].filter((g) => g.profilo.ruolo !== 'portiere')
      const scelto = pick(candidati)
      lati[da] = lati[da].filter((g) => g !== scelto)
      lati[a].push(scelto)
    }

    const forma = rand() * 0.6 - 0.3 // giornata buona o storta per tutto il gruppo
    const righe = (lato: 'A' | 'B'): Riga[] =>
      shuffle(lati[lato]).map(({ profilo, doc }) => ({
        giocatore: doc.id,
        gol: poisson(profilo.gol),
        voto: null,
      }))
    const formazioneA = righe('A')
    const formazioneB = righe('B')
    const autogolA = rand() < 0.1 ? 1 : 0
    const autogolB = rand() < 0.1 ? 1 : 0
    const golA = formazioneA.reduce((t, r) => t + (r.gol ?? 0), 0) + autogolA
    const golB = formazioneB.reduce((t, r) => t + (r.gol ?? 0), 0) + autogolB

    const vota = (formazione: Riga[], esito: number) => {
      for (const riga of formazione) {
        const { profilo } = giocatori.find((g) => g.doc.id === riga.giocatore)!
        // Ogni tanto qualcuno resta senza voto: non deve entrare nella media.
        if (rand() < 0.05) continue
        const v = profilo.livello + forma + esito * 0.4 + (riga.gol ?? 0) * 0.5 + (rand() - 0.5) * 1.6
        riga.voto = clamp(mezzo(v), 4, 9.5)
      }
    }
    vota(formazioneA, Math.sign(golA - golB))
    vota(formazioneB, Math.sign(golB - golA))

    await payload.create({
      collection: 'partite',
      data: {
        data: `${giorno}T19:00:00.000Z`,
        squadraA: rossi.id,
        squadraB: blu.id,
        formazioneA,
        formazioneB,
        autogolA,
        autogolB,
      },
      context,
    })
  }

  payload.logger.info(`Seed completato: 2 squadre, ${giocatori.length} giocatori, ${DATE.length} partite.`)
  process.exit(0)
}

await main()
