import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload } from 'payload'
import { z } from 'zod'

import type { Giocatori } from '@/payload-types'

import { normalizza } from '../abbina'
import { risolviGiocatore, risolviSquadra, tuttiIGiocatori, tutteLeSquadre } from '../risolvi'
import { esegui } from '../risposta'
import { numeroMaglia, riferimentoGiocatore, riferimentoSquadra, ruolo } from '../schemi'
import { giocatoreBreve } from '../serializza'

export function registraGiocatori(server: McpServer, payload: Payload) {
  server.registerTool(
    'lista_giocatori',
    {
      title: 'Elenco giocatori',
      description:
        'Elenca i giocatori con id, nome completo, soprannome, ruolo, numero di maglia, squadra abituale e stato. ' +
        'Di default solo gli attivi. Il filtro "cerca" confronta nome, cognome e soprannome.',
      inputSchema: {
        cerca: z.string().optional().describe('Testo da cercare in nome, cognome o soprannome'),
        soloAttivi: z.boolean().default(true).describe('false per includere anche i giocatori disattivati'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ cerca, soloAttivi }) =>
      esegui(async () => {
        const [giocatori, squadre] = await Promise.all([tuttiIGiocatori(payload), tutteLeSquadre(payload)])
        const perSquadra = new Map(squadre.map((s) => [s.id, s]))
        const q = cerca ? normalizza(cerca) : ''
        return giocatori
          .filter((g) => !soloAttivi || g.attivo !== false)
          .filter((g) => !q || normalizza(`${g.nome} ${g.cognome} ${g.soprannome ?? ''}`).includes(q))
          .map((g) => giocatoreBreve(g, perSquadra))
      }),
  )

  const campiGiocatore = {
    soprannome: z.string().max(30).nullable().optional().describe('Soprannome mostrato sul sito; null per toglierlo'),
    numeroMaglia: numeroMaglia.nullable().optional(),
    squadraAbituale: riferimentoSquadra.nullable().optional().describe('Squadra abituale (solo informativa); null per toglierla'),
    attivo: z.boolean().optional().describe('false esclude il giocatore dalle nuove formazioni'),
  }

  const squadraId = async (ref: number | string | null | undefined) =>
    ref === undefined ? undefined : ref === null ? null : (await risolviSquadra(payload, ref)).id

  const conSquadra = async (g: Giocatori) =>
    giocatoreBreve(g, new Map((await tutteLeSquadre(payload)).map((s) => [s.id, s])))

  server.registerTool(
    'crea_giocatore',
    {
      title: 'Crea giocatore',
      description:
        'Crea un nuovo giocatore. Nome, cognome e ruolo sono obbligatori; lo slug e il nome completo si generano da soli. ' +
        'Per modificarne uno esistente usa aggiorna_giocatore.',
      inputSchema: {
        nome: z.string().min(1),
        cognome: z.string().min(1),
        ruolo,
        ...campiGiocatore,
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ nome, cognome, ruolo, soprannome, numeroMaglia, squadraAbituale, attivo }) =>
      esegui(async () => {
        const doc = await payload.create({
          collection: 'giocatori',
          data: {
            nome,
            cognome,
            ruolo: ruolo as 'portiere' | 'difensore' | 'centrocampista' | 'attaccante',
            soprannome: soprannome ?? null,
            numeroMaglia: numeroMaglia ?? null,
            squadraAbituale: await squadraId(squadraAbituale),
            attivo: attivo ?? true,
          },
          depth: 0,
        })
        return { creato: await conSquadra(doc) }
      }),
  )

  server.registerTool(
    'aggiorna_giocatore',
    {
      title: 'Aggiorna giocatore',
      description:
        'Modifica i dati di un giocatore esistente: solo i campi passati vengono cambiati. ' +
        'Per disattivarne uno (lascia la partita senza cancellarlo dallo storico) passa attivo=false.',
      inputSchema: {
        giocatore: riferimentoGiocatore,
        nome: z.string().min(1).optional(),
        cognome: z.string().min(1).optional(),
        ruolo: ruolo.optional(),
        ...campiGiocatore,
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ giocatore, nome, cognome, ruolo, soprannome, numeroMaglia, squadraAbituale, attivo }) =>
      esegui(async () => {
        const esistente = await risolviGiocatore(payload, giocatore)
        const doc = await payload.update({
          collection: 'giocatori',
          id: esistente.id,
          data: {
            ...(nome !== undefined && { nome }),
            ...(cognome !== undefined && { cognome }),
            ...(ruolo !== undefined && { ruolo: ruolo as 'portiere' | 'difensore' | 'centrocampista' | 'attaccante' }),
            ...(soprannome !== undefined && { soprannome }),
            ...(numeroMaglia !== undefined && { numeroMaglia }),
            ...(squadraAbituale !== undefined && { squadraAbituale: await squadraId(squadraAbituale) }),
            ...(attivo !== undefined && { attivo }),
          },
          depth: 0,
        })
        return { aggiornato: await conSquadra(doc) }
      }),
  )
}
