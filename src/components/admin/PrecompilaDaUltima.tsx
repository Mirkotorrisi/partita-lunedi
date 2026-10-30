'use client'

import { Button, toast, useDocumentInfo, useForm } from '@payloadcms/ui'
import { useState } from 'react'

import { prossimoLunedi, toGiorno } from '@/lib/date'
import type { Iscrizioni, Partite } from '@/payload-types'

type Lato = 'A' | 'B'
const UNA_SETTIMANA = 7 * 24 * 60 * 60 * 1000

/**
 * Sulla creazione di una partita copia squadre e formazioni dell'ultima partita,
 * con gol a 0 e voti vuoti, e propone come data il lunedì successivo.
 * In alternativa, "dalle iscrizioni" divide gli iscritti al giorno della partita per squadra naturale.
 * Riempie solo il form: nulla viene salvato finché non si preme "Salva".
 */
export function PrecompilaDaUltima() {
  const { id } = useDocumentInfo()
  const { addFieldRow, dispatchFields, getDataByPath, removeFieldRow } = useForm()
  const [loading, setLoading] = useState(false)

  if (id) return null

  /** Sostituisce la formazione di un lato con questi giocatori (gol a 0, voti vuoti). */
  const riempiLato = (lato: Lato, giocatori: unknown[]) => {
    const path = `formazione${lato}`
    const esistenti = (getDataByPath(path) as unknown[] | undefined)?.length ?? 0
    for (let i = esistenti - 1; i >= 0; i--) removeFieldRow({ path, rowIndex: i })
    giocatori.forEach((giocatore, rowIndex) => {
      addFieldRow({
        path,
        rowIndex,
        schemaPath: `partite.${path}`,
        subFieldState: {
          giocatore: { value: giocatore, initialValue: giocatore, valid: true },
          gol: { value: 0, initialValue: 0, valid: true },
          voto: { value: null, initialValue: null, valid: true },
        },
      })
    })
  }

  const confermaSostituzione = () => {
    const giaCompilate =
      ((getDataByPath('formazioneA') as unknown[] | undefined)?.length ?? 0) +
      ((getDataByPath('formazioneB') as unknown[] | undefined)?.length ?? 0)
    return giaCompilate === 0 || window.confirm('Sostituire le formazioni già inserite?')
  }

  const precompilaDaIscrizioni = async () => {
    if (!confermaSostituzione()) return
    setLoading(true)
    try {
      const data = getDataByPath('data') as string | undefined
      const impostata = ((await (await fetch('/api/globals/prossima-partita?depth=0')).json()) as { giorno?: string }).giorno
      const giorno = data ? toGiorno(data) : impostata ? toGiorno(impostata) : prossimoLunedi()
      const query = `where[giorno][equals]=${giorno}&sort=createdAt&limit=0&depth=0`
      const res = await fetch(`/api/iscrizioni?${query}`, { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { docs } = (await res.json()) as { docs: Iscrizioni[] }
      if (!docs.length) {
        toast.info(`Nessuna iscrizione per il ${giorno}`)
        return
      }

      // Squadre già scelte nel form, altrimenti le prime due che compaiono tra gli iscritti.
      const scelte = (['A', 'B'] as Lato[]).map((l) => getDataByPath(`squadra${l}`) as number | undefined)
      const viste = [...new Set(docs.flatMap((d) => (typeof d.squadra === 'number' ? [d.squadra] : [])))]
      const squadraA = scelte[0] ?? viste.find((id) => id !== scelte[1])
      const squadraB = scelte[1] ?? viste.find((id) => id !== squadraA)

      // Ognuno nella propria squadra naturale; senza squadra (o di una terza) va dove servono numeri pari.
      const lati: Record<Lato, number[]> = { A: [], B: [] }
      for (const d of docs) {
        const giocatore = typeof d.giocatore === 'object' ? d.giocatore.id : d.giocatore
        const squadra = typeof d.squadra === 'object' ? d.squadra?.id : d.squadra
        const lato: Lato =
          squadra === squadraA ? 'A' : squadra === squadraB ? 'B' : lati.A.length <= lati.B.length ? 'A' : 'B'
        lati[lato].push(giocatore)
      }
      for (const lato of ['A', 'B'] as Lato[]) riempiLato(lato, lati[lato])
      if (squadraA !== undefined) dispatchFields({ type: 'UPDATE', path: 'squadraA', value: squadraA })
      if (squadraB !== undefined) dispatchFields({ type: 'UPDATE', path: 'squadraB', value: squadraB })
      if (!data) dispatchFields({ type: 'UPDATE', path: 'data', value: `${giorno}T12:00:00.000Z` })

      toast.success(`${docs.length} iscritti inseriti: controlla i prestiti tra le squadre prima di salvare`)
    } catch (err) {
      toast.error(`Impossibile leggere le iscrizioni (${(err as Error).message})`)
    } finally {
      setLoading(false)
    }
  }

  const precompila = async () => {
    if (!confermaSostituzione()) return

    setLoading(true)
    try {
      const res = await fetch('/api/partite?sort=-data&limit=1&depth=0', { credentials: 'include' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { docs } = (await res.json()) as { docs: Partite[] }
      const ultima = docs[0]
      if (!ultima) {
        toast.info('Non ci sono partite precedenti da copiare')
        return
      }

      for (const lato of ['A', 'B'] as Lato[]) {
        riempiLato(
          lato,
          (ultima[`formazione${lato}`] ?? []).map((r) => r.giocatore),
        )
        dispatchFields({ type: 'UPDATE', path: `squadra${lato}`, value: ultima[`squadra${lato}`] })
        dispatchFields({ type: 'UPDATE', path: `autogol${lato}`, value: 0 })
      }

      if (!getDataByPath('data')) {
        const prossima = new Date(new Date(ultima.data).getTime() + UNA_SETTIMANA)
        dispatchFields({ type: 'UPDATE', path: 'data', value: prossima.toISOString() })
      }

      toast.success(`Formazioni copiate da: ${ultima.titolo ?? 'ultima partita'}`)
    } catch (err) {
      toast.error(`Impossibile copiare l'ultima partita (${(err as Error).message})`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ marginBottom: 'var(--base)', display: 'flex', gap: 'var(--base)', flexWrap: 'wrap' }}>
      <Button buttonStyle="secondary" disabled={loading} margin={false} onClick={precompila} size="medium">
        {loading ? 'Copio…' : 'Precompila dall’ultima partita'}
      </Button>
      <Button buttonStyle="secondary" disabled={loading} margin={false} onClick={precompilaDaIscrizioni} size="medium">
        Precompila dalle iscrizioni
      </Button>
    </div>
  )
}
