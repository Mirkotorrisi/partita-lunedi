import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload } from 'payload'
import { z } from 'zod'

import { COLORE_DEFAULT } from '@/collections/Squadre'

import { risolviSquadra, tutteLeSquadre } from '../risolvi'
import { esegui } from '../risposta'
import { colore, riferimentoSquadra } from '../schemi'
import { squadraBreve } from '../serializza'

export function registraSquadre(server: McpServer, payload: Payload) {
  server.registerTool(
    'lista_squadre',
    {
      title: 'Elenco squadre',
      description: 'Elenca le squadre con id, nome e colore. Di solito sono due e restano fisse tra le partite.',
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    () => esegui(async () => (await tutteLeSquadre(payload)).map(squadraBreve)),
  )

  server.registerTool(
    'crea_squadra',
    {
      title: 'Crea squadra',
      description: 'Crea una squadra con nome (unico) e colore usato per badge e grafici.',
      inputSchema: {
        nome: z.string().min(1),
        colore: colore.optional().describe('Colore #RRGGBB; se omesso si usa quello di default'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ nome, colore }) =>
      esegui(async () => {
        const doc = await payload.create({
          collection: 'squadre',
          data: { nome, colore: colore ?? COLORE_DEFAULT },
          depth: 0,
        })
        return { creata: squadraBreve(doc) }
      }),
  )

  server.registerTool(
    'aggiorna_squadra',
    {
      title: 'Aggiorna squadra',
      description: 'Rinomina una squadra o ne cambia il colore. Solo i campi passati vengono modificati.',
      inputSchema: {
        squadra: riferimentoSquadra,
        nome: z.string().min(1).optional(),
        colore: colore.optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ squadra, nome, colore }) =>
      esegui(async () => {
        const esistente = await risolviSquadra(payload, squadra)
        const doc = await payload.update({
          collection: 'squadre',
          id: esistente.id,
          data: { ...(nome !== undefined && { nome }), ...(colore !== undefined && { colore }) },
          depth: 0,
        })
        return { aggiornata: squadraBreve(doc) }
      }),
  )
}
