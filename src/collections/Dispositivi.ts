import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

/**
 * Browser associati a un giocatore. Nessun accesso pubblico: li gestiscono solo le server action
 * (Local API) e l'admin, che per "resettare" un dispositivo lo elimina.
 */
export const Dispositivi: CollectionConfig = {
  slug: 'dispositivi',
  labels: { singular: 'Dispositivo', plural: 'Dispositivi' },
  admin: {
    useAsTitle: 'etichetta',
    defaultColumns: ['giocatore', 'etichetta', 'ultimoAccesso', 'createdAt'],
    group: 'Calcetto',
    description: 'Eliminare un dispositivo lo scollega dal giocatore: alla prossima visita dovrà selezionarsi di nuovo.',
  },
  defaultSort: '-ultimoAccesso',
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    { name: 'giocatore', label: 'Giocatore', type: 'relationship', relationTo: 'giocatori', required: true, index: true },
    { name: 'etichetta', label: 'Dispositivo', type: 'text', admin: { readOnly: true } },
    { name: 'ultimoAccesso', label: 'Ultimo accesso', type: 'date', admin: { readOnly: true } },
    {
      name: 'tokenHash',
      label: 'Hash del token (cookie)',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'pushSubscription',
      label: 'Sottoscrizione notifiche',
      type: 'json',
      admin: { readOnly: true, position: 'sidebar', description: 'Presente se il giocatore ha attivato le notifiche.' },
    },
    {
      name: 'fingerprint',
      label: 'Fingerprint del browser',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Serve a riconoscere il dispositivo se il cookie viene cancellato.',
      },
    },
  ],
}
