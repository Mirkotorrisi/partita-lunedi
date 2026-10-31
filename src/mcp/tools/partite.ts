import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload, Where } from 'payload'
import { z } from 'zod'

import type { Partite } from '@/payload-types'

import { giornoAIso, risolviGiocatori, risolviPartita, risolviSquadra } from '../risolvi'
import { ErroreTool, esegui } from '../risposta'
import { formazione, giorno, riferimentoPartita, riferimentoSquadra } from '../schemi'
import { caricaAnagrafiche, partitaBreve, partitaCompleta } from '../serializza'

type Riga = NonNullable<Partite['formazioneA']>[number]
type RigaInput = z.infer<typeof formazione>[number]

/** Stagione "2026-27" → intervallo di giorni (agosto–luglio), come in lib/stats. */
function intervalloStagione(stagione: string): { da: string; a: string } {
  const m = stagione.match(/^(\d{4})-(\d{2})$/)
  if (!m) throw new ErroreTool(`Stagione non valida: "${stagione}". Usa il formato 2026-27.`)
  const inizio = Number(m[1])
  return { da: `${inizio}-08-01`, a: `${inizio + 1}-07-31` }
}

export function registraPartite(server: McpServer, payload: Payload) {
  /** Righe di formazione con i giocatori risolti (nomi → id) in una sola lettura. */
  const righeDa = async (input: RigaInput[]): Promise<Riga[]> => {
    const giocatori = await risolviGiocatori(
      payload,
      input.map((r) => r.giocatore),
    )
    return input.map((r, i) => ({ giocatore: giocatori[i].id, gol: r.gol, voto: r.voto ?? null }))
  }

  server.registerTool(
    'lista_partite',
    {
      title: 'Elenco partite',
      description:
        'Elenca le partite dalla più recente, con id, giorno, risultato e quanti voti mancano nelle pagelle. ' +
        'Filtra per stagione (es. "2026-27", da agosto a luglio) o per intervallo di giorni. ' +
        'Per formazioni e voti di una partita usa dettaglio_partita.',
      inputSchema: {
        stagione: z.string().optional().describe('Stagione nel formato "2026-27"'),
        da: giorno.optional().describe('Primo giorno incluso'),
        a: giorno.optional().describe('Ultimo giorno incluso'),
        limite: z.number().int().min(1).max(200).default(20).describe('Numero massimo di partite'),
      },
      annotations: { readOnlyHint: true },
    },
    ({ stagione, da, a, limite }) =>
      esegui(async () => {
        const periodo: { da?: string; a?: string } = stagione ? intervalloStagione(stagione) : {}
        const condizioni: Where[] = []
        const inizio = da ?? periodo.da
        const fine = a ?? periodo.a
        if (inizio) condizioni.push({ giorno: { greater_than_equal: inizio } })
        if (fine) condizioni.push({ giorno: { less_than_equal: fine } })
        const [{ docs, totalDocs }, anagrafiche] = await Promise.all([
          payload.find({
            collection: 'partite',
            where: condizioni.length ? { and: condizioni } : {},
            depth: 0,
            limit: limite,
            sort: '-data',
          }),
          caricaAnagrafiche(payload),
        ])
        return {
          totale: totalDocs,
          mostrate: docs.length,
          partite: docs.map((p) => partitaBreve(p, anagrafiche)),
        }
      }),
  )

  server.registerTool(
    'dettaglio_partita',
    {
      title: 'Dettaglio partita',
      description:
        'Formazioni complete di una partita con gol e voti di ogni giocatore, autogol, note e risultato. ' +
        'Da qui si vede chi è ancora senza voto prima di usare inserisci_pagelle.',
      inputSchema: { partita: riferimentoPartita },
      annotations: { readOnlyHint: true },
    },
    ({ partita }) =>
      esegui(async () => {
        const [doc, anagrafiche] = await Promise.all([risolviPartita(payload, partita), caricaAnagrafiche(payload)])
        return partitaCompleta(doc, anagrafiche)
      }),
  )

  const campiPartita = {
    autogolA: z.number().int().min(0).optional().describe('Autogol degli avversari che contano per la squadra A'),
    autogolB: z.number().int().min(0).optional().describe('Autogol degli avversari che contano per la squadra B'),
    note: z.string().nullable().optional().describe('Note libere sulla partita; null per toglierle'),
  }

  server.registerTool(
    'crea_partita',
    {
      title: 'Crea partita',
      description:
        'Registra una partita: data, le due squadre e le formazioni con i gol di ciascuno (i voti si possono aggiungere subito ' +
        'o dopo con inserisci_pagelle). Il risultato si calcola dai gol delle formazioni più gli autogol. ' +
        'Una sola partita per giorno; un giocatore non può stare in entrambe le formazioni.',
      inputSchema: {
        data: giorno.describe('Giorno della partita, YYYY-MM-DD'),
        squadraA: riferimentoSquadra,
        squadraB: riferimentoSquadra,
        formazioneA: formazione,
        formazioneB: formazione,
        ...campiPartita,
      },
      annotations: { readOnlyHint: false, destructiveHint: false },
    },
    ({ data, squadraA, squadraB, formazioneA, formazioneB, autogolA, autogolB, note }) =>
      esegui(async () => {
        const [sqA, sqB, righeA, righeB] = await Promise.all([
          risolviSquadra(payload, squadraA),
          risolviSquadra(payload, squadraB),
          righeDa(formazioneA),
          righeDa(formazioneB),
        ])
        const doc = await payload.create({
          collection: 'partite',
          data: {
            data: giornoAIso(data),
            squadraA: sqA.id,
            squadraB: sqB.id,
            formazioneA: righeA,
            formazioneB: righeB,
            autogolA: autogolA ?? 0,
            autogolB: autogolB ?? 0,
            note: note ?? null,
          },
          depth: 0,
        })
        return { creata: partitaCompleta(doc, await caricaAnagrafiche(payload)) }
      }),
  )

  server.registerTool(
    'aggiorna_partita',
    {
      title: 'Aggiorna partita',
      description:
        'Modifica una partita esistente: solo i campi passati cambiano. Una formazione passata SOSTITUISCE per intero ' +
        'quella salvata (voti compresi): per cambiare solo i voti usa inserisci_pagelle, che è più sicuro.',
      inputSchema: {
        partita: riferimentoPartita,
        data: giorno.optional().describe('Nuovo giorno della partita'),
        squadraA: riferimentoSquadra.optional(),
        squadraB: riferimentoSquadra.optional(),
        formazioneA: formazione.optional(),
        formazioneB: formazione.optional(),
        ...campiPartita,
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    },
    ({ partita, data, squadraA, squadraB, formazioneA, formazioneB, autogolA, autogolB, note }) =>
      esegui(async () => {
        const esistente = await risolviPartita(payload, partita)
        const doc = await payload.update({
          collection: 'partite',
          id: esistente.id,
          data: {
            ...(data !== undefined && { data: giornoAIso(data) }),
            ...(squadraA !== undefined && { squadraA: (await risolviSquadra(payload, squadraA)).id }),
            ...(squadraB !== undefined && { squadraB: (await risolviSquadra(payload, squadraB)).id }),
            ...(formazioneA !== undefined && { formazioneA: await righeDa(formazioneA) }),
            ...(formazioneB !== undefined && { formazioneB: await righeDa(formazioneB) }),
            ...(autogolA !== undefined && { autogolA }),
            ...(autogolB !== undefined && { autogolB }),
            ...(note !== undefined && { note }),
          },
          depth: 0,
        })
        return { aggiornata: partitaCompleta(doc, await caricaAnagrafiche(payload)) }
      }),
  )
}
