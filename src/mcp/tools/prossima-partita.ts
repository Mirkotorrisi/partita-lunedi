import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload } from 'payload'
import { z } from 'zod'

import { dettagliPartita } from '@/lib/prenotazioni'
import { relId } from '@/lib/relations'

import { etichettaGiocatore } from '../abbina'
import { giornoAIso, risolviGiocatore, risolviSquadra } from '../risolvi'
import { ErroreTool, esegui } from '../risposta'
import { giorno, riferimentoGiocatore, riferimentoSquadra } from '../schemi'
import { caricaAnagrafiche } from '../serializza'

const ORA = /^([01]\d|2[0-3]):[0-5]\d$/

export function registraProssimaPartita(server: McpServer, payload: Payload) {
  /** Iscritti a un giorno in ordine di arrivo, con la squadra in cui giocheranno. */
  const iscritti = async (g: string) => {
    const [{ docs }, anagrafiche] = await Promise.all([
      payload.find({
        collection: 'iscrizioni',
        where: { giorno: { equals: g } },
        depth: 0,
        pagination: false,
        sort: 'createdAt',
      }),
      caricaAnagrafiche(payload),
    ])
    return docs.map((d, i) => {
      const gId = relId(d.giocatore)
      const sId = relId(d.squadra)
      const giocatore = typeof gId === 'number' ? anagrafiche.giocatori.get(gId) : undefined
      const squadra = typeof sId === 'number' ? anagrafiche.squadre.get(sId) : undefined
      return {
        ordine: i + 1,
        giocatoreId: gId ?? null,
        giocatore: giocatore ? etichettaGiocatore(giocatore) : '?',
        squadra: squadra?.nome ?? null,
        iscrittoIl: d.createdAt,
      }
    })
  }

  server.registerTool(
    'prossima_partita',
    {
      title: 'Prossima partita',
      description:
        'Giorno, orario e campo della prossima partita (il prossimo lunedì se l’admin non ha impostato altro) ' +
        'e la lista degli iscritti in ordine di prenotazione, con la squadra in cui giocheranno. ' +
        'Utile per preparare le formazioni di crea_partita.',
      inputSchema: {
        giorno: giorno.optional().describe('Per vedere gli iscritti di un giorno diverso da quello della prossima partita'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ giorno: richiesto }) =>
      esegui(async () => {
        const dettagli = await dettagliPartita()
        const g = richiesto ?? dettagli.giorno
        return { ...dettagli, giorno: g, iscritti: await iscritti(g) }
      }),
  )

  server.registerTool(
    'aggiorna_prossima_partita',
    {
      title: 'Aggiorna prossima partita',
      description:
        'Imposta giorno, orario e campo della prossima partita mostrati in /prenotazioni. Solo i campi passati cambiano. ' +
        'Il campo "notifica" invia SUBITO una notifica push a tutti i giocatori che le hanno attivate: usalo solo se richiesto esplicitamente.',
      inputSchema: {
        giorno: giorno.nullable().optional().describe('Giorno della partita; null per tornare al prossimo lunedì'),
        ora: z.string().regex(ORA, 'Formato HH:mm').nullable().optional().describe('Orario, es. 21:00; null per toglierlo'),
        campo: z.string().nullable().optional().describe('Nome o indirizzo del campo; null per toglierlo'),
        notifica: z
          .string()
          .min(1)
          .optional()
          .describe(
            'Messaggio da inviare subito a tutti come notifica push; resta leggibile in /comunicazioni, dove è reso in markdown ' +
              '(grassetto, corsivo, [testo](url), elenchi con "- "; gli URL diventano link). Nella notifica arriva come testo semplice.',
          ),
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ giorno: g, ora, campo, notifica }) =>
      esegui(async () => {
        if (g === undefined && ora === undefined && campo === undefined && notifica === undefined) {
          throw new ErroreTool('Nessun campo da aggiornare')
        }
        await payload.updateGlobal({
          slug: 'prossima-partita',
          data: {
            ...(g !== undefined && { giorno: g === null ? null : giornoAIso(g) }),
            ...(ora !== undefined && { ora }),
            ...(campo !== undefined && { campo }),
            ...(notifica !== undefined && { notifica }),
          },
          depth: 0,
        })
        return { ...(await dettagliPartita()), notificaInviata: notifica !== undefined }
      }),
  )

  server.registerTool(
    'iscrivi_giocatore',
    {
      title: 'Iscrivi giocatore',
      description:
        'Prenota un giocatore per la prossima partita (o per un giorno indicato) come se avesse usato /prenotazioni. ' +
        'Se è già iscritto non cambia nulla. La squadra di default è quella abituale del giocatore.',
      inputSchema: {
        giocatore: riferimentoGiocatore,
        giorno: giorno.optional().describe('Default: giorno della prossima partita'),
        squadra: riferimentoSquadra.optional().describe('Squadra in cui giocherà, se diversa da quella abituale (prestito)'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ giocatore, giorno: richiesto, squadra }) =>
      esegui(async () => {
        const g = richiesto ?? (await dettagliPartita()).giorno
        const doc = await risolviGiocatore(payload, giocatore)
        const squadraId = squadra === undefined ? undefined : (await risolviSquadra(payload, squadra)).id
        const { totalDocs } = await payload.count({
          collection: 'iscrizioni',
          where: { and: [{ giorno: { equals: g } }, { giocatore: { equals: doc.id } }] },
        })
        if (totalDocs === 0) {
          await payload.create({
            collection: 'iscrizioni',
            data: { giorno: g, giocatore: doc.id, ...(squadraId !== undefined && { squadra: squadraId }) },
          })
        }
        return { giorno: g, giaIscritto: totalDocs > 0, iscritti: await iscritti(g) }
      }),
  )

  server.registerTool(
    'annulla_iscrizione',
    {
      title: 'Annulla iscrizione',
      description: 'Toglie un giocatore dalla lista degli iscritti alla prossima partita (o a un giorno indicato).',
      inputSchema: {
        giocatore: riferimentoGiocatore,
        giorno: giorno.optional().describe('Default: giorno della prossima partita'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    ({ giocatore, giorno: richiesto }) =>
      esegui(async () => {
        const g = richiesto ?? (await dettagliPartita()).giorno
        const doc = await risolviGiocatore(payload, giocatore)
        const { docs } = await payload.delete({
          collection: 'iscrizioni',
          where: { and: [{ giorno: { equals: g } }, { giocatore: { equals: doc.id } }] },
          depth: 0,
        })
        return { giorno: g, rimosso: docs.length > 0, iscritti: await iscritti(g) }
      }),
  )
}
