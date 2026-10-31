/**
 * Abbinamento di nomi "umani" ai documenti. Modulo puro (niente Payload) così è testabile:
 * l'agente scrive "Rossi" o "il Pupo", qui si decide a chi corrisponde.
 */

export type Abbinamento<T> = { ok: true; doc: T } | { ok: false; errore: string }

export interface GiocatoreAbbinabile {
  id: number
  nome: string
  cognome: string
  soprannome?: string | null
  slug?: string | null
  nomeCompleto?: string | null
  attivo?: boolean | null
}

export interface SquadraAbbinabile {
  id: number
  nome: string
}

/** Minuscolo, senza accenti e punteggiatura, spazi singoli. */
export const normalizza = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export const etichettaGiocatore = (g: GiocatoreAbbinabile): string => {
  const nome = g.nomeCompleto || `${g.nome} ${g.cognome}`
  return g.soprannome ? `${nome} "${g.soprannome}"` : nome
}

const elenco = (candidati: GiocatoreAbbinabile[]) =>
  candidati.map((g) => `${etichettaGiocatore(g)} (id ${g.id})`).join(', ')

/**
 * Prova in ordine: nome completo esatto (anche "cognome nome", soprannome, slug), poi una sola
 * parola (nome, cognome o soprannome), poi inizio/contenuto del nome completo o del soprannome.
 * A parità di candidati preferisce i giocatori attivi; se resta ambiguo lo dice, con i candidati.
 */
export function abbinaGiocatore<T extends GiocatoreAbbinabile>(
  giocatori: T[],
  testo: string,
): Abbinamento<T> {
  const q = normalizza(testo)
  if (!q) return { ok: false, errore: 'Nome del giocatore vuoto' }

  const completo = (g: T) => normalizza(g.nomeCompleto || `${g.nome} ${g.cognome}`)
  const invertito = (g: T) => normalizza(`${g.cognome} ${g.nome}`)
  const sopr = (g: T) => normalizza(g.soprannome ?? '')
  const livelli: Array<(g: T) => boolean> = [
    (g) => completo(g) === q || invertito(g) === q || sopr(g) === q || normalizza(g.slug ?? '') === q,
    (g) => normalizza(g.nome) === q || normalizza(g.cognome) === q,
    (g) => completo(g).startsWith(q) || sopr(g).startsWith(q),
    (g) => completo(g).includes(q) || sopr(g).includes(q),
  ]

  for (const livello of livelli) {
    const trovati = giocatori.filter(livello)
    if (trovati.length === 0) continue
    if (trovati.length === 1) return { ok: true, doc: trovati[0] }
    const attivi = trovati.filter((g) => g.attivo !== false)
    if (attivi.length === 1) return { ok: true, doc: attivi[0] }
    return {
      ok: false,
      errore: `"${testo}" è ambiguo: ${elenco(trovati)}. Usa l'id o il nome completo.`,
    }
  }
  return { ok: false, errore: `Nessun giocatore trovato per "${testo}". Usa lista_giocatori per vedere i nomi.` }
}

export function abbinaSquadra<T extends SquadraAbbinabile>(squadre: T[], testo: string): Abbinamento<T> {
  const q = normalizza(testo)
  if (!q) return { ok: false, errore: 'Nome della squadra vuoto' }
  const esatte = squadre.filter((s) => normalizza(s.nome) === q)
  if (esatte.length === 1) return { ok: true, doc: esatte[0] }
  const parziali = squadre.filter((s) => normalizza(s.nome).includes(q))
  if (parziali.length === 1) return { ok: true, doc: parziali[0] }
  if (parziali.length > 1) {
    return {
      ok: false,
      errore: `"${testo}" è ambiguo: ${parziali.map((s) => `${s.nome} (id ${s.id})`).join(', ')}`,
    }
  }
  return { ok: false, errore: `Nessuna squadra trovata per "${testo}". Usa lista_squadre per vedere i nomi.` }
}

// ---------------------------------------------------------------------------
// Pagelle

export interface RigaFormazione {
  giocatore: number
  gol: number
  voto?: number | null
  id?: string | null
}

export interface Pagella {
  giocatoreId: number
  /** null = toglie il voto. */
  voto: number | null
  /** Se presente aggiorna anche i gol. */
  gol?: number
}

export interface EsitoPagelle {
  formazioneA: RigaFormazione[]
  formazioneB: RigaFormazione[]
  /** Giocatori delle pagelle che non sono in nessuna delle due formazioni. */
  nonInFormazione: number[]
}

/**
 * Applica i voti alle righe esistenti, in qualunque delle due formazioni stia il giocatore.
 * Le righe non toccate restano identiche (incluso l'id, così Payload non le ricrea).
 */
export function applicaPagelle(
  formazioneA: RigaFormazione[],
  formazioneB: RigaFormazione[],
  pagelle: Pagella[],
): EsitoPagelle {
  const perGiocatore = new Map(pagelle.map((p) => [p.giocatoreId, p]))
  const applica = (righe: RigaFormazione[]) =>
    righe.map((r) => {
      const p = perGiocatore.get(r.giocatore)
      if (!p) return r
      perGiocatore.delete(r.giocatore)
      return { ...r, voto: p.voto, gol: p.gol ?? r.gol }
    })
  const nuovaA = applica(formazioneA)
  const nuovaB = applica(formazioneB)
  return { formazioneA: nuovaA, formazioneB: nuovaB, nonInFormazione: [...perGiocatore.keys()] }
}
