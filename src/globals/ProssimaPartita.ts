import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'

/** Dettagli della prossima partita, mostrati sempre in cima a /prenotazioni. */
export const ProssimaPartita: GlobalConfig = {
  slug: 'prossima-partita',
  label: 'Prossima partita',
  admin: { group: 'Calcetto' },
  access: { read: anyone, update: authenticated },
  fields: [
    {
      name: 'giorno',
      label: 'Giorno',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
        description: 'Lascia vuoto per il prossimo lunedì. Se è una data passata viene ignorata.',
      },
    },
    {
      name: 'ora',
      label: 'Orario',
      type: 'text',
      admin: { description: 'Es. 21:00', width: '30%' },
      validate: (v: string | null | undefined) => !v || /^([01]\d|2[0-3]):[0-5]\d$/.test(v) || 'Usa il formato HH:mm, es. 21:00',
    },
    { name: 'campo', label: 'Campo', type: 'text', admin: { description: 'Nome o indirizzo del campo.' } },
  ],
}
