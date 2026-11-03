import { RadarAbilita, type PuntoRadar } from '@/components/charts/RadarAbilita'
import { ValoreAbilita } from '@/components/ui/ValoreAbilita'
import {
  CATEGORIE_ABILITA,
  categorieRilevanti,
  COLORE_FASCIA,
  fasciaAbilita,
  PESI_RUOLO,
  valoreCategoria,
  valutazioneGenerale,
  type Abilita,
} from '@/lib/abilita'
import type { Ruolo } from '@/lib/stats'

/**
 * Abilità del giocatore: valutazione generale col radar delle categorie, poi una card per
 * categoria con le singole voci. Le categorie senza alcuna voce compilata non compaiono.
 */
export function SchedaAbilita({ abilita, ruolo }: { abilita: Abilita; ruolo: Ruolo }) {
  // Nel generale e nel radar entrano solo le categorie che pesano per il ruolo (PESI_RUOLO),
  // nell'ordine del catalogo così la forma del radar è confrontabile tra giocatori.
  const pesate = new Set(categorieRilevanti(ruolo).map((c) => c.chiave))
  const rilevanti = CATEGORIE_ABILITA.filter((c) => pesate.has(c.chiave))
  const valori = new Map(
    CATEGORIE_ABILITA.map((c) => [c.chiave, valoreCategoria(abilita, c.chiave)]),
  )
  const compilate = CATEGORIE_ABILITA.filter((c) => valori.get(c.chiave) !== null)
  if (compilate.length === 0) return null

  const generale = valutazioneGenerale(abilita, ruolo)
  // Il radar ha senso solo completo: con un vertice mancante la forma mentirebbe.
  const punti: PuntoRadar[] | null = rilevanti.every((c) => valori.get(c.chiave) !== null)
    ? rilevanti.map((c) => ({ categoria: c.label, valore: valori.get(c.chiave) as number }))
    : null

  return (
    <section aria-labelledby="abilita" className="flex flex-col gap-3">
      <h2 id="abilita" className="label">
        Abilità
      </h2>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="card flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="label">Generale</span>
            <ValoreAbilita v={generale} grande />
          </div>
          {punti ? (
            <RadarAbilita punti={punti} />
          ) : (
            <p className="text-sm text-muted">
              Il radar compare quando tutte le categorie del ruolo sono compilate.
            </p>
          )}
          <p className="text-xs text-muted">
            Pesato sul ruolo:{' '}
            {categorieRilevanti(ruolo)
              .map((c) => `${c.label} ${PESI_RUOLO[ruolo][c.chiave]}%`)
              .join(' · ')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
          {compilate.map((c) => {
            const v = valori.get(c.chiave) as number
            const voci = abilita[c.chiave] as Record<string, number | null>
            return (
              <div key={c.chiave} className="card flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <ValoreAbilita v={v} grande />
                  <span className="font-semibold">{c.label}</span>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
                  aria-hidden="true"
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v}%`, backgroundColor: COLORE_FASCIA[fasciaAbilita(v)] }}
                  />
                </div>
                <ul className="flex flex-col gap-1.5 text-sm">
                  {c.voci.map((voce) => (
                    <li key={voce.chiave} className="flex items-center gap-2">
                      <ValoreAbilita v={voci[voce.chiave]} />
                      <span className="text-muted">{voce.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
