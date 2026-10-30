export const TIMEZONE = 'Europe/Rome'

/** Giorno di calendario (YYYY-MM-DD) in ora italiana. Usato come chiave unica e nell'URL. */
export function toGiorno(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

/** Data in formato italiano, es. 06/10/2026. */
export function formatDataBreve(date: Date | string): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

/** Lunedì (YYYY-MM-DD, ora italiana) della prossima partita: oggi se è lunedì, altrimenti il successivo. */
export function prossimoLunedi(da: Date = new Date()): string {
  const d = new Date(`${toGiorno(da)}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + ((8 - d.getUTCDay()) % 7))
  return d.toISOString().slice(0, 10)
}
