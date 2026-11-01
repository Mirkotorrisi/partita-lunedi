import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { inviaNotifica } from '../lib/push'

export const URL_COMUNICAZIONI = '/comunicazioni'

/**
 * Avvisi dell'admin a tutti i giocatori. Ogni comunicazione creata parte subito come notifica push
 * e resta leggibile in /comunicazioni: la notifica, una volta cliccata, porta lì.
 */
export const Comunicazioni: CollectionConfig = {
  slug: 'comunicazioni',
  labels: { singular: 'Comunicazione', plural: 'Comunicazioni' },
  admin: {
    useAsTitle: 'testo',
    defaultColumns: ['testo', 'inviate', 'createdAt'],
    group: 'Calcetto',
    description:
      'Ogni comunicazione salvata arriva subito come notifica a chi le ha attivate e resta visibile nella pagina Comunicazioni del sito.',
  },
  defaultSort: '-createdAt',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation, req }) => {
        // Si invia una volta sola, alla creazione: le modifiche successive non rinotificano.
        if (operation !== 'create') return doc
        try {
          const { inviate } = await inviaNotifica({
            title: doc.titolo || 'Partita del lunedì',
            body: doc.testo,
            url: URL_COMUNICAZIONI,
          })
          req.payload.logger.info(`Comunicazione ${doc.id} inviata a ${inviate} dispositivi`)
          await req.payload.update({ collection: 'comunicazioni', id: doc.id, data: { inviate }, req })
          return { ...doc, inviate }
        } catch (err) {
          req.payload.logger.error({ err, msg: 'Invio notifica fallito' })
          return doc
        }
      },
    ],
  },
  fields: [
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      admin: { description: 'Facoltativo: è il titolo della notifica. Se vuoto, "Partita del lunedì".' },
    },
    {
      name: 'testo',
      label: 'Messaggio',
      type: 'textarea',
      required: true,
      admin: { description: 'Es. "Si gioca alle 21:30". Parte come notifica appena salvi.' },
    },
    {
      name: 'inviate',
      label: 'Dispositivi raggiunti',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar', description: 'Quanti dispositivi hanno ricevuto la notifica.' },
    },
  ],
}
