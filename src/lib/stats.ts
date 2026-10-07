/**
 * Statistiche della partita del lunedì. Modulo puro: nessun accesso a Payload o a Next,
 * lavora sul modello normalizzato prodotto da `src/lib/data.ts`.
 */

export type Id = number | string
export type Lato = 'A' | 'B'
export type Esito = 'V' | 'N' | 'P'
export type Ruolo = 'portiere' | 'difensore' | 'centrocampista' | 'attaccante'

export interface Squadra {
  id: Id
  nome: string
  colore: string
}

export interface Giocatore {
  id: Id
  slug: string
  nome: string
  cognome: string
  soprannome: string | null
  ruolo: Ruolo
  numeroMaglia: number | null
  attivo: boolean
  squadraAbitualeId: Id | null
  fotoUrl: string | null
}

export interface Riga {
  giocatoreId: Id
  gol: number
  /** null = senza voto, non entra nella media. */
  voto: number | null
}

export interface Partita {
  id: Id
  /** YYYY-MM-DD in ora italiana. */
  giorno: string
  squadraAId: Id
  squadraBId: Id
  golA: number
  golB: number
  autogolA: number
  autogolB: number
  formazioneA: Riga[]
  formazioneB: Riga[]
  note: string | null
}

// ---------------------------------------------------------------------------
// Stagioni e filtri

/** Le stagioni vanno da agosto a luglio: la partita del 2026-09-07 è della stagione "2026-27". */
export function stagioneDi(giorno: string): string {
  const anno = Number(giorno.slice(0, 4))
  const mese = Number(giorno.slice(5, 7))
  const inizio = mese >= 8 ? anno : anno - 1
  return `${inizio}-${String((inizio + 1) % 100).padStart(2, '0')}`
}

/** Stagioni presenti nei dati, dalla più recente. */
export function elencoStagioni(partite: Partita[]): string[] {
  return [...new Set(partite.map((p) => stagioneDi(p.giorno)))].sort().reverse()
}

export type Filtro = { stagione?: string; da?: string; a?: string }

/** Filtra per stagione e/o intervallo di giorni (estremi inclusi). Restituisce le partite in ordine cronologico. */
export function filtraPartite(partite: Partita[], filtro: Filtro = {}): Partita[] {
  return partite
    .filter(
      (p) =>
        (!filtro.stagione || stagioneDi(p.giorno) === filtro.stagione) &&
        (!filtro.da || p.giorno >= filtro.da) &&
        (!filtro.a || p.giorno <= filtro.a),
    )
    .sort((x, y) => x.giorno.localeCompare(y.giorno))
}

const cronologiche = (partite: Partita[]) => [...partite].sort((x, y) => x.giorno.localeCompare(y.giorno))

// ---------------------------------------------------------------------------
// Singola partita

export function esito(golFatti: number, golSubiti: number): Esito {
  return golFatti > golSubiti ? 'V' : golFatti < golSubiti ? 'P' : 'N'
}

export function vincitore(partita: Partita): Lato | null {
  return partita.golA > partita.golB ? 'A' : partita.golB > partita.golA ? 'B' : null
}

export interface Marcatore {
  giocatoreId: Id
  gol: number
}

/** Marcatori di un lato, dal più prolifico. */
export function marcatoriPartita(partita: Partita, lato: Lato): Marcatore[] {
  const righe = lato === 'A' ? partita.formazioneA : partita.formazioneB
  return righe
    .filter((r) => r.gol > 0)
    .map((r) => ({ giocatoreId: r.giocatoreId, gol: r.gol }))
    .sort((x, y) => y.gol - x.gol)
}

export interface MigliorInCampo {
  giocatoreId: Id
  voto: number
  gol: number
  lato: Lato
}

/** Voto più alto; a parità vince chi ha segnato di più, poi chi è nella squadra vincente. */
export function migliorInCampo(partita: Partita): MigliorInCampo | null {
  const vinc = vincitore(partita)
  const candidati: MigliorInCampo[] = [
    ...partita.formazioneA.map((r) => ({ ...r, lato: 'A' as const })),
    ...partita.formazioneB.map((r) => ({ ...r, lato: 'B' as const })),
  ]
    .filter((r): r is Riga & { lato: Lato; voto: number } => r.voto !== null)
    .map((r) => ({ giocatoreId: r.giocatoreId, voto: r.voto, gol: r.gol, lato: r.lato }))

  candidati.sort(
    (x, y) =>
      y.voto - x.voto || y.gol - x.gol || Number(y.lato === vinc) - Number(x.lato === vinc),
  )
  return candidati[0] ?? null
}

// ---------------------------------------------------------------------------
// Giocatori

export interface Presenza {
  partitaId: Id
  giorno: string
  lato: Lato
  squadraId: Id
  avversarioId: Id
  gol: number
  voto: number | null
  golFatti: number
  golSubiti: number
  esito: Esito
}

/** Partite giocate da un giocatore, in ordine cronologico, con la squadra in cui compariva quel giorno. */
export function presenzeGiocatore(partite: Partita[], giocatoreId: Id): Presenza[] {
  const presenze: Presenza[] = []
  for (const p of cronologiche(partite)) {
    for (const lato of ['A', 'B'] as const) {
      const righe = lato === 'A' ? p.formazioneA : p.formazioneB
      const riga = righe.find((r) => r.giocatoreId === giocatoreId)
      if (!riga) continue
      const golFatti = lato === 'A' ? p.golA : p.golB
      const golSubiti = lato === 'A' ? p.golB : p.golA
      presenze.push({
        partitaId: p.id,
        giorno: p.giorno,
        lato,
        squadraId: lato === 'A' ? p.squadraAId : p.squadraBId,
        avversarioId: lato === 'A' ? p.squadraBId : p.squadraAId,
        gol: riga.gol,
        voto: riga.voto,
        golFatti,
        golSubiti,
        esito: esito(golFatti, golSubiti),
      })
    }
  }
  return presenze
}

export interface PuntoAndamento extends Presenza {
  /** Media degli ultimi (fino a) 5 voti disponibili fino a questa partita inclusa. */
  mediaMobile5: number | null
}

export interface StatsGiocatore {
  giocatoreId: Id
  presenze: number
  gol: number
  mediaGol: number
  /** Numero di partite con voto. */
  voti: number
  mediaVoto: number | null
  votoMax: number | null
  votoMin: number | null
  vittorie: number
  pareggi: number
  sconfitte: number
  /** 0–1 */
  percVittorie: number
  andamento: PuntoAndamento[]
  /** Ultimi 5 voti (cronologici), per le sparkline. */
  ultimiVoti: number[]
}

const media = (valori: number[]) =>
  valori.length ? valori.reduce((t, v) => t + v, 0) / valori.length : null

export const FINESTRA_MEDIA_MOBILE = 5

export function statsGiocatore(partite: Partita[], giocatoreId: Id): StatsGiocatore {
  const presenze = presenzeGiocatore(partite, giocatoreId)
  const voti = presenze.map((p) => p.voto).filter((v): v is number => v !== null)

  const votiFinora: number[] = []
  const andamento = presenze.map((p) => {
    if (p.voto !== null) votiFinora.push(p.voto)
    return { ...p, mediaMobile5: media(votiFinora.slice(-FINESTRA_MEDIA_MOBILE)) }
  })

  const conta = (e: Esito) => presenze.filter((p) => p.esito === e).length
  const gol = presenze.reduce((t, p) => t + p.gol, 0)
  const vittorie = conta('V')

  return {
    giocatoreId,
    presenze: presenze.length,
    gol,
    mediaGol: presenze.length ? gol / presenze.length : 0,
    voti: voti.length,
    mediaVoto: media(voti),
    votoMax: voti.length ? Math.max(...voti) : null,
    votoMin: voti.length ? Math.min(...voti) : null,
    vittorie,
    pareggi: conta('N'),
    sconfitte: conta('P'),
    percVittorie: presenze.length ? vittorie / presenze.length : 0,
    andamento,
    ultimiVoti: voti.slice(-FINESTRA_MEDIA_MOBILE),
  }
}

/** Statistiche di tutti i giocatori che hanno almeno una presenza nelle partite date. */
export function statsTutti(partite: Partita[]): StatsGiocatore[] {
  const ids = new Set<Id>()
  for (const p of partite) for (const r of [...p.formazioneA, ...p.formazioneB]) ids.add(r.giocatoreId)
  return [...ids].map((id) => statsGiocatore(partite, id))
}

// ---------------------------------------------------------------------------
// Classifiche

export interface Posizionato<T> {
  posizione: number
  stats: T
}

const numera = <T>(lista: T[]): Posizionato<T>[] => lista.map((stats, i) => ({ posizione: i + 1, stats }))

/** Per gol; a parità per media gol, poi chi ha meno presenze. Esclude chi non ha segnato. */
export function classificaMarcatori(stats: StatsGiocatore[]): Posizionato<StatsGiocatore>[] {
  return numera(
    stats
      .filter((s) => s.gol > 0)
      .sort((x, y) => y.gol - x.gol || y.mediaGol - x.mediaGol || x.presenze - y.presenze),
  )
}

export function classificaPresenze(stats: StatsGiocatore[]): Posizionato<StatsGiocatore>[] {
  return numera([...stats].sort((x, y) => y.presenze - x.presenze || y.gol - x.gol))
}

export type Soglia =
  | { tipo: 'nessuna' }
  | { tipo: 'fissa'; presenze: number }
  /** Frazione delle partite del periodo, es. 0.3 = 30%. */
  | { tipo: 'percentuale'; quota: number }

export function presenzeMinime(soglia: Soglia, partiteTotali: number): number {
  switch (soglia.tipo) {
    case 'nessuna':
      return 0
    case 'fissa':
      return soglia.presenze
    case 'percentuale':
      return Math.ceil(soglia.quota * partiteTotali)
  }
}

export interface ClassificaMediaVoto {
  minimo: number
  sopraSoglia: Posizionato<StatsGiocatore & { mediaVoto: number }>[]
  /** Chi non raggiunge la soglia, comunque ordinato per media. */
  sottoSoglia: (StatsGiocatore & { mediaVoto: number })[]
}

/**
 * Per media voto; a parità chi ha più voti, poi media gol.
 * Chi non ha nessun voto è escluso; chi è sotto soglia finisce in `sottoSoglia`.
 */
export function classificaMediaVoto(
  stats: StatsGiocatore[],
  soglia: Soglia,
  partiteTotali: number,
): ClassificaMediaVoto {
  const minimo = presenzeMinime(soglia, partiteTotali)
  const votati = stats
    .filter((s): s is StatsGiocatore & { mediaVoto: number } => s.mediaVoto !== null)
    .sort((x, y) => y.mediaVoto - x.mediaVoto || y.voti - x.voti || y.mediaGol - x.mediaGol)
  return {
    minimo,
    sopraSoglia: numera(votati.filter((s) => s.presenze >= minimo)),
    sottoSoglia: votati.filter((s) => s.presenze < minimo),
  }
}

export function classificaPercVittorie(
  stats: StatsGiocatore[],
  minimo = 0,
): Posizionato<StatsGiocatore>[] {
  return numera(
    stats
      .filter((s) => s.presenze > 0 && s.presenze >= minimo)
      .sort((x, y) => y.percVittorie - x.percVittorie || y.presenze - x.presenze),
  )
}

export interface FettaMarcatori {
  /** null = fetta "Altri". */
  giocatoreId: Id | null
  gol: number
  /** 0–1 sul totale dei gol dei giocatori (autogol esclusi). */
  quota: number
  /** Quanti giocatori sono raggruppati in "Altri". */
  raggruppati?: number
}

/** Primi `n` marcatori più una fetta "Altri" con il resto (solo se c'è un resto). */
export function distribuzioneMarcatori(stats: StatsGiocatore[], n = 7): FettaMarcatori[] {
  const classifica = classificaMarcatori(stats).map((p) => p.stats)
  const totale = classifica.reduce((t, s) => t + s.gol, 0)
  if (totale === 0) return []
  const fette: FettaMarcatori[] = classifica
    .slice(0, n)
    .map((s) => ({ giocatoreId: s.giocatoreId, gol: s.gol, quota: s.gol / totale }))
  const resto = classifica.slice(n)
  if (resto.length) {
    const gol = resto.reduce((t, s) => t + s.gol, 0)
    fette.push({ giocatoreId: null, gol, quota: gol / totale, raggruppati: resto.length })
  }
  return fette
}

// ---------------------------------------------------------------------------
// Riepiloghi

export interface Riepilogo {
  partite: number
  /** Autogol inclusi. */
  golTotali: number
  mediaGolPartita: number
  /** Media di tutti i voti assegnati, per la linea di riferimento nei grafici. */
  mediaVotoGruppo: number | null
}

export function riepilogo(partite: Partita[]): Riepilogo {
  const golTotali = partite.reduce((t, p) => t + p.golA + p.golB, 0)
  const voti = partite
    .flatMap((p) => [...p.formazioneA, ...p.formazioneB])
    .map((r) => r.voto)
    .filter((v): v is number => v !== null)
  return {
    partite: partite.length,
    golTotali,
    mediaGolPartita: partite.length ? golTotali / partite.length : 0,
    mediaVotoGruppo: media(voti),
  }
}

// ---------------------------------------------------------------------------
// Squadre

export interface StatsSquadra {
  squadraId: Id
  partite: number
  vittorie: number
  pareggi: number
  sconfitte: number
  golFatti: number
  golSubiti: number
}

export function statsSquadra(partite: Partita[], squadraId: Id): StatsSquadra {
  const s: StatsSquadra = { squadraId, partite: 0, vittorie: 0, pareggi: 0, sconfitte: 0, golFatti: 0, golSubiti: 0 }
  for (const p of partite) {
    const lato: Lato | null = p.squadraAId === squadraId ? 'A' : p.squadraBId === squadraId ? 'B' : null
    if (!lato) continue
    const fatti = lato === 'A' ? p.golA : p.golB
    const subiti = lato === 'A' ? p.golB : p.golA
    s.partite++
    s.golFatti += fatti
    s.golSubiti += subiti
    const e = esito(fatti, subiti)
    if (e === 'V') s.vittorie++
    else if (e === 'N') s.pareggi++
    else s.sconfitte++
  }
  return s
}

export interface ScontriDiretti {
  squadra1Id: Id
  squadra2Id: Id
  partite: number
  vittorie1: number
  pareggi: number
  vittorie2: number
  gol1: number
  gol2: number
}

/** Bilancio tra due squadre, indipendentemente da chi era "A" o "B" in ogni partita. */
export function scontriDiretti(partite: Partita[], squadra1Id: Id, squadra2Id: Id): ScontriDiretti {
  const s: ScontriDiretti = { squadra1Id, squadra2Id, partite: 0, vittorie1: 0, pareggi: 0, vittorie2: 0, gol1: 0, gol2: 0 }
  for (const p of partite) {
    let gol1: number
    let gol2: number
    if (p.squadraAId === squadra1Id && p.squadraBId === squadra2Id) [gol1, gol2] = [p.golA, p.golB]
    else if (p.squadraAId === squadra2Id && p.squadraBId === squadra1Id) [gol1, gol2] = [p.golB, p.golA]
    else continue
    s.partite++
    s.gol1 += gol1
    s.gol2 += gol2
    if (gol1 > gol2) s.vittorie1++
    else if (gol2 > gol1) s.vittorie2++
    else s.pareggi++
  }
  return s
}

// ---------------------------------------------------------------------------
// Record

export interface Records {
  partitaConPiuGol: { partitaId: Id; giorno: string; gol: number } | null
  migliorVoto: { giocatoreId: Id; partitaId: Id; giorno: string; voto: number } | null
  piuGolInPartita: { giocatoreId: Id; partitaId: Id; giorno: string; gol: number } | null
  strisciaGol: { giocatoreId: Id; partite: number; dal: string; al: string } | null
}

/** A parità vale il record più recente (le partite sono scorse in ordine cronologico con `>=`). */
export function records(partite: Partita[]): Records {
  const out: Records = { partitaConPiuGol: null, migliorVoto: null, piuGolInPartita: null, strisciaGol: null }

  for (const p of cronologiche(partite)) {
    const gol = p.golA + p.golB
    if (!out.partitaConPiuGol || gol >= out.partitaConPiuGol.gol) {
      out.partitaConPiuGol = { partitaId: p.id, giorno: p.giorno, gol }
    }
    for (const r of [...p.formazioneA, ...p.formazioneB]) {
      if (r.voto !== null && (!out.migliorVoto || r.voto >= out.migliorVoto.voto)) {
        out.migliorVoto = { giocatoreId: r.giocatoreId, partitaId: p.id, giorno: p.giorno, voto: r.voto }
      }
      if (r.gol > 0 && (!out.piuGolInPartita || r.gol >= out.piuGolInPartita.gol)) {
        out.piuGolInPartita = { giocatoreId: r.giocatoreId, partitaId: p.id, giorno: p.giorno, gol: r.gol }
      }
    }
  }

  // Striscia: presenze consecutive del giocatore con almeno un gol (le assenze non la interrompono).
  for (const s of statsTutti(partite)) {
    let inizio = 0
    s.andamento.forEach((pres, i) => {
      if (pres.gol === 0) {
        inizio = i + 1
        return
      }
      const lunghezza = i - inizio + 1
      if (!out.strisciaGol || lunghezza > out.strisciaGol.partite) {
        out.strisciaGol = {
          giocatoreId: s.giocatoreId,
          partite: lunghezza,
          dal: s.andamento[inizio].giorno,
          al: pres.giorno,
        }
      }
    })
  }

  return out
}
