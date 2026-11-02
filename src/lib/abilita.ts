/**
 * Abilità "da card": sei categorie con tre voci ciascuna, valori da 1 a 99 assegnati dall'admin.
 * Modulo puro: lo usano la collection (per generare i campi), il dataset, i tool MCP e la UI,
 * così il catalogo vive in un posto solo.
 */
import type { Ruolo } from './stats'

export const ABILITA_MIN = 1
export const ABILITA_MAX = 99

export const CATEGORIE_ABILITA = [
  {
    chiave: 'attacco',
    label: 'Attacco',
    voci: [
      { chiave: 'finalizzazione', label: 'Finalizzazione' },
      { chiave: 'potenzaTiro', label: 'Potenza di tiro' },
      { chiave: 'posizionamento', label: 'Posizionamento' },
    ],
  },
  {
    chiave: 'dribbling',
    label: 'Dribbling',
    voci: [
      { chiave: 'controlloPalla', label: 'Controllo palla' },
      { chiave: 'dribbling', label: 'Dribbling' },
      { chiave: 'agilita', label: 'Agilità' },
    ],
  },
  {
    chiave: 'passaggio',
    label: 'Passaggio',
    voci: [
      { chiave: 'passaggioCorto', label: 'Passaggio corto' },
      { chiave: 'passaggioLungo', label: 'Passaggio lungo' },
      { chiave: 'visione', label: 'Visione di gioco' },
    ],
  },
  {
    chiave: 'difesa',
    label: 'Difesa',
    voci: [
      { chiave: 'contrasto', label: 'Contrasto' },
      { chiave: 'marcatura', label: 'Marcatura' },
      { chiave: 'anticipo', label: 'Anticipo' },
    ],
  },
  {
    chiave: 'fisico',
    label: 'Fisico',
    voci: [
      { chiave: 'velocita', label: 'Velocità' },
      { chiave: 'resistenza', label: 'Resistenza' },
      { chiave: 'forza', label: 'Forza' },
    ],
  },
  {
    chiave: 'portiere',
    label: 'Portiere',
    voci: [
      { chiave: 'riflessi', label: 'Riflessi' },
      { chiave: 'parate', label: 'Parate' },
      { chiave: 'uscite', label: 'Uscite' },
    ],
  },
] as const

type Categoria = (typeof CATEGORIE_ABILITA)[number]
export type ChiaveCategoria = Categoria['chiave']

/** Valori per categoria e voce; null = non ancora assegnato. */
export type Abilita = {
  [C in Categoria as C['chiave']]: { [V in C['voci'][number] as V['chiave']]: number | null }
}

/** Forma "sciolta" (es. dati da Payload o da un tool): tutto facoltativo. */
export type AbilitaParziale =
  | {
      [C in Categoria as C['chiave']]?:
        | {
            [V in C['voci'][number] as V['chiave']]?: number | null
          }
        | null
    }
  | null
  | undefined

const inRange = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= ABILITA_MIN && v <= ABILITA_MAX

/** Normalizza: ogni voce presente, fuori range → null. */
export function normalizzaAbilita(input: AbilitaParziale): Abilita {
  const out: Record<string, Record<string, number | null>> = {}
  for (const c of CATEGORIE_ABILITA) {
    const sorgente = (input?.[c.chiave] ?? {}) as Record<string, unknown>
    out[c.chiave] = Object.fromEntries(
      c.voci.map((v) => [v.chiave, inRange(sorgente[v.chiave]) ? sorgente[v.chiave] : null]),
    ) as Record<string, number | null>
  }
  return out as Abilita
}

export const abilitaVuote = (): Abilita => normalizzaAbilita(null)

/**
 * Applica modifiche parziali: cambia solo le voci passate (null le cancella), il resto resta.
 * Serve ai tool MCP, che aggiornano una voce alla volta senza riscrivere tutto il gruppo.
 */
export function unisciAbilita(base: AbilitaParziale, modifiche: AbilitaParziale): Abilita {
  const out = normalizzaAbilita(base) as unknown as Record<string, Record<string, number | null>>
  for (const c of CATEGORIE_ABILITA) {
    const nuove = (modifiche?.[c.chiave] ?? {}) as Record<string, unknown>
    for (const v of c.voci) {
      const valore = nuove[v.chiave]
      if (valore === undefined) continue
      out[c.chiave][v.chiave] = inRange(valore) ? valore : null
    }
  }
  return out as unknown as Abilita
}

const media = (valori: (number | null)[]): number | null => {
  const pieni = valori.filter((v): v is number => v !== null)
  return pieni.length ? Math.round(pieni.reduce((t, v) => t + v, 0) / pieni.length) : null
}

/** Media arrotondata delle voci compilate; null se la categoria è vuota. */
export function valoreCategoria(a: Abilita, chiave: ChiaveCategoria): number | null {
  return media(Object.values(a[chiave] as Record<string, number | null>))
}

/**
 * Valutazione generale: media delle categorie compilate. Per chi non è portiere la categoria
 * "Portiere" non conta (quasi sempre vuota o bassa, falserebbe il totale).
 */
export function valutazioneGenerale(a: Abilita, ruolo: Ruolo): number | null {
  const categorie = CATEGORIE_ABILITA.filter((c) => ruolo === 'portiere' || c.chiave !== 'portiere')
  return media(categorie.map((c) => valoreCategoria(a, c.chiave)))
}

export const abilitaCompilate = (a: Abilita): boolean =>
  CATEGORIE_ABILITA.some((c) => valoreCategoria(a, c.chiave) !== null)

export type FasciaAbilita = 'alta' | 'media' | 'bassa'

/** Fasce come nei videogiochi: 80+ verde, 65–79 giallo, sotto rosso. */
export const fasciaAbilita = (v: number): FasciaAbilita =>
  v >= 80 ? 'alta' : v >= 65 ? 'media' : 'bassa'

export const COLORE_FASCIA: Record<FasciaAbilita, string> = {
  alta: 'var(--win)',
  media: 'var(--draw)',
  bassa: 'var(--loss)',
}
