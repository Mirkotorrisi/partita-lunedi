'use client'

import { Button, toast, useDocumentInfo, useForm } from '@payloadcms/ui'
import { useState } from 'react'

import type { Partite } from '@/payload-types'

type Lato = 'A' | 'B'
const UNA_SETTIMANA = 7 * 24 * 60 * 60 * 1000

/**
 * Sulla creazione di una partita copia squadre e formazioni dell'ultima partita,
 * con gol a 0 e voti vuoti, e propone come data il lunedì successivo.
 * Riempie solo il form: nulla viene salvato finché non si preme "Salva".
 */
export function PrecompilaDaUltima() {
  const { id } = useDocumentInfo()
  const { addFieldRow, dispatchFields, getDataByPath, removeFieldRow } = useForm()
  const [loading, setLoading] = useState(false)

  if (id) return null

  const precompila = async () => {
    const giaCompilate =
      ((getDataByPath('formazioneA') as unknown[] | undefined)?.length ?? 0) +
      ((getDataByPath('formazioneB') as unknown[] | undefined)?.length ?? 0)
    if (giaCompilate > 0 && !window.confirm('Sostituire le formazioni già inserite?')) return

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
        const path = `formazione${lato}`
        const esistenti = (getDataByPath(path) as unknown[] | undefined)?.length ?? 0
        for (let i = esistenti - 1; i >= 0; i--) removeFieldRow({ path, rowIndex: i })

        const righe = ultima[`formazione${lato}`] ?? []
        righe.forEach((riga, rowIndex) => {
          addFieldRow({
            path,
            rowIndex,
            schemaPath: `partite.${path}`,
            subFieldState: {
              giocatore: { value: riga.giocatore, initialValue: riga.giocatore, valid: true },
              gol: { value: 0, initialValue: 0, valid: true },
              voto: { value: null, initialValue: null, valid: true },
            },
          })
        })

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
    <div style={{ marginBottom: 'var(--base)' }}>
      <Button buttonStyle="secondary" disabled={loading} margin={false} onClick={precompila} size="medium">
        {loading ? 'Copio…' : 'Precompila dall’ultima partita'}
      </Button>
    </div>
  )
}
