import type { GlobalConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { inviaNotifica } from '../lib/push'

/** Dettagli della prossima partita, mostrati sempre in cima a /prenotazioni. */
export const ProssimaPartita: GlobalConfig = {
  slug: 'prossima-partita',
  label: 'Prossima partita',
  admin: { group: 'Calcetto' },
  access: { read: anyone, update: authenticated },
  hooks: {
    beforeChange: [
      ({ data, context }) => {
        // Il messaggio si invia una volta sola: lo si tiene da parte e il campo si svuota.
        const testo = typeof data.notifica === 'string' ? data.notifica.trim() : ''
        if (testo) context.notifica = testo
        data.notifica = null
        return data
      },
    ],
    afterChange: [
      async ({ doc, context, req }) => {
        if (typeof context.notifica !== 'string') return doc
        try {
          const { inviate } = await inviaNotifica({ title: 'Partita del lunedì', body: context.notifica })
          req.payload.logger.info(`Notifica inviata a ${inviate} dispositivi`)
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Invio notifica fallito' })
        }
        return doc
      },
    ],
  },
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
    {
      name: 'notifica',
      label: 'Invia una notifica a tutti',
      type: 'textarea',
      admin: {
        description:
          'Scrivi un messaggio e salva: arriva subito a chi ha attivato le notifiche (es. "Si gioca alle 21:30"). Il campo si svuota dopo l’invio.',
      },
    },
  ],
}
