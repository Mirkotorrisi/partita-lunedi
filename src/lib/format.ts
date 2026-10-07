import type { Esito, Giocatore, Ruolo } from './stats'

const numero = (cifre: number) =>
  new Intl.NumberFormat('it-IT', { minimumFractionDigits: cifre, maximumFractionDigits: cifre })

const DUE = numero(2)
const UNA = numero(1)

/** Voto singolo: 6 → "6", 6.5 → "6,5". */
export const formatVoto = (voto: number | null | undefined) =>
  voto === null || voto === undefined ? '–' : new Intl.NumberFormat('it-IT').format(voto)

/** Medie (voto, gol a partita): sempre due decimali, es. "6,42". */
export const formatMedia = (n: number | null | undefined) =>
  n === null || n === undefined ? '–' : DUE.format(n)

export const formatUnDecimale = (n: number) => UNA.format(n)

/** 0.4567 → "46%" */
export const formatPercentuale = (quota: number) => `${Math.round(quota * 100)}%`

/** Nome mostrato sul sito: il soprannome se presente. */
export const nomeVisualizzato = (g: Pick<Giocatore, 'nome' | 'cognome' | 'soprannome'>) =>
  g.soprannome || `${g.nome} ${g.cognome}`

/** Nome corto per elenchi compatti (marcatori sotto il punteggio): soprannome o cognome. */
export const nomeBreve = (g: Pick<Giocatore, 'cognome' | 'soprannome'>) => g.soprannome || g.cognome

export const nomeCompleto = (g: Pick<Giocatore, 'nome' | 'cognome'>) => `${g.nome} ${g.cognome}`

export const iniziali = (g: Pick<Giocatore, 'nome' | 'cognome'>) =>
  `${g.nome.charAt(0)}${g.cognome.charAt(0)}`.toUpperCase()

export const RUOLO_BREVE: Record<Ruolo, string> = {
  portiere: 'POR',
  difensore: 'DIF',
  centrocampista: 'CEN',
  attaccante: 'ATT',
}

export const RUOLO_ESTESO: Record<Ruolo, string> = {
  portiere: 'Portiere',
  difensore: 'Difensore',
  centrocampista: 'Centrocampista',
  attaccante: 'Attaccante',
}

export const ESITO_ESTESO: Record<Esito, string> = { V: 'Vittoria', N: 'Pareggio', P: 'Sconfitta' }

// Le date di partita sono giorni di calendario (YYYY-MM-DD): si formattano a mezzogiorno UTC
// così il fuso del server non può spostarle al giorno prima.
const giornoToDate = (giorno: string) => new Date(`${giorno}T12:00:00Z`)
const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('it-IT', { timeZone: 'UTC', ...opts })

/** "06/10/2026" */
export const formatGiorno = (giorno: string) =>
  fmt({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(giornoToDate(giorno))

/** "lunedì 6 ottobre 2026" */
export const formatGiornoEsteso = (giorno: string) =>
  fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(giornoToDate(giorno))

/** "6 ott" */
export const formatGiornoBreve = (giorno: string) =>
  fmt({ day: 'numeric', month: 'short' }).format(giornoToDate(giorno)).replace('.', '')

/** "ott" */
export const formatMeseBreve = (giorno: string) =>
  fmt({ month: 'short' }).format(giornoToDate(giorno)).replace('.', '')

/** "ottobre 2026" */
export const formatMeseAnno = (giorno: string) =>
  fmt({ month: 'long', year: 'numeric' }).format(giornoToDate(giorno))

/** "2026-27" → "Stagione 2026/27" */
export const formatStagione = (stagione: string) => `Stagione ${stagione.replace('-', '/')}`
