import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { relId } from '../lib/relations'

/**
 * Prenotazione di un giocatore a una partita. L'orario è `createdAt` (precisione al millisecondo):
 * si gioca "a scorrimento", quindi l'ordine di arrivo è l'ordine della lista.
 */
export const Iscrizioni: CollectionConfig = {
  slug: 'iscrizioni',
  labels: { singular: 'Iscrizione', plural: 'Iscrizioni' },
  admin: {
    defaultColumns: ['giorno', 'giocatore', 'squadra', 'createdAt'],
    group: 'Calcetto',
  },
  defaultSort: ['-giorno', 'createdAt'],
  indexes: [{ fields: ['giorno', 'giocatore'], unique: true }],
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Alla creazione la squadra "naturale" è quella abituale del giocatore; l'admin può cambiarla.
        if (operation !== 'create' || !data || data.squadra) return data
        const id = relId(data.giocatore)
        if (id === undefined) return data
        const giocatore = await req.payload.findByID({ collection: 'giocatori', id, depth: 0, req })
        data.squadra = relId(giocatore.squadraAbituale) ?? null
        return data
      },
    ],
  },
  fields: [
    {
      name: 'giorno',
      label: 'Giorno della partita',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'YYYY-MM-DD, come il giorno delle partite.' },
    },
    { name: 'giocatore', label: 'Giocatore', type: 'relationship', relationTo: 'giocatori', required: true },
    {
      name: 'squadra',
      label: 'Squadra',
      type: 'relationship',
      relationTo: 'squadre',
      admin: {
        description:
          'Di default la squadra abituale del giocatore. Cambiala per i prestiti: è quella che finisce nella formazione.',
      },
    },
  ],
}
