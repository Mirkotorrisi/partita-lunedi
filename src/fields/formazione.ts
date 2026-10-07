import type { ArrayField, Field, Where } from 'payload'

/**
 * Campi di una riga di formazione. Per aggiungere una statistica (es. assist)
 * basta aggiungere qui un campo number e rigenerare i tipi.
 */
const rigaFormazione: Field[] = [
  {
    type: 'row',
    fields: [
      {
        name: 'giocatore',
        label: 'Giocatore',
        type: 'relationship',
        relationTo: 'giocatori',
        required: true,
        admin: { width: '60%' },
        // Solo giocatori attivi, ma il giocatore già selezionato resta valido anche se
        // nel frattempo è stato disattivato (altrimenti le partite vecchie non si salverebbero).
        filterOptions: ({ siblingData }): Where => {
          const current = (siblingData as { giocatore?: unknown } | undefined)?.giocatore
          const currentId =
            current && typeof current === 'object' ? (current as { id: unknown }).id : current
          if (typeof currentId === 'number' || typeof currentId === 'string') {
            return { or: [{ attivo: { equals: true } }, { id: { equals: currentId } }] }
          }
          return { attivo: { equals: true } }
        },
      },
      {
        name: 'gol',
        label: 'Gol',
        type: 'number',
        defaultValue: 0,
        min: 0,
        required: true,
        admin: { width: '20%', step: 1 },
      },
      {
        name: 'voto',
        label: 'Voto',
        type: 'number',
        min: 1,
        max: 10,
        admin: { width: '20%', step: 0.5, placeholder: '—' },
        validate: (value: number | null | undefined) => {
          if (value === null || value === undefined) return true
          if (value < 1 || value > 10) return 'Il voto deve essere tra 1 e 10'
          if (!Number.isInteger(value * 2)) return 'Il voto va a passi di 0,5'
          return true
        },
      },
    ],
  },
]

export const formazioneField = (name: string, label: string): ArrayField => ({
  name,
  label,
  type: 'array',
  labels: { singular: 'Giocatore', plural: 'Giocatori' },
  admin: { initCollapsed: false },
  fields: rigaFormazione,
})
