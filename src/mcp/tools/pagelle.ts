import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload } from 'payload'
import { z } from 'zod'

import { relId } from '@/lib/relations'

import { applicaPagelle, etichettaGiocatore, type RigaFormazione } from '../abbina'
import { risolviGiocatori, risolviPartita } from '../risolvi'
import { ErroreTool, esegui } from '../risposta'
import { gol, riferimentoGiocatore, riferimentoPartita, voto } from '../schemi'
import { caricaAnagrafiche, partitaCompleta } from '../serializza'

export function registraPagelle(server: McpServer, payload: Payload) {
  server.registerTool(
    'inserisci_pagelle',
    {
      title: 'Inserisci pagelle',
      description:
        'Assegna i voti (ed eventualmente corregge i gol) ai giocatori di una partita già registrata, in qualunque ' +
        'formazione si trovino. Le righe non citate restano come sono. Se un giocatore non è in formazione la chiamata ' +
        'fallisce senza salvare nulla: aggiungilo prima con aggiorna_partita. Restituisce la partita aggiornata e chi è ancora senza voto.',
      inputSchema: {
        partita: riferimentoPartita.default('ultima'),
        pagelle: z
          .array(
            z.object({
              giocatore: riferimentoGiocatore,
              voto: voto.nullable().describe('Voto 1–10 a passi di 0,5; null toglie il voto'),
              gol: gol.optional().describe('Se presente corregge anche i gol del giocatore'),
            }),
          )
          .min(1),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
    },
    ({ partita, pagelle }) =>
      esegui(async () => {
        const doc = await risolviPartita(payload, partita)
        const giocatori = await risolviGiocatori(
          payload,
          pagelle.map((p) => p.giocatore),
        )
        const visti = new Set<number>()
        for (const g of giocatori) {
          if (visti.has(g.id)) throw new ErroreTool(`${etichettaGiocatore(g)} compare due volte nelle pagelle`)
          visti.add(g.id)
        }

        const righe = (formazione: typeof doc.formazioneA): RigaFormazione[] =>
          (formazione ?? []).flatMap((r) => {
            const id = relId(r.giocatore)
            return typeof id === 'number' ? [{ id: r.id, giocatore: id, gol: r.gol ?? 0, voto: r.voto ?? null }] : []
          })
        const esito = applicaPagelle(
          righe(doc.formazioneA),
          righe(doc.formazioneB),
          pagelle.map((p, i) => ({ giocatoreId: giocatori[i].id, voto: p.voto, gol: p.gol })),
        )
        if (esito.nonInFormazione.length) {
          const nomi = giocatori.filter((g) => esito.nonInFormazione.includes(g.id)).map(etichettaGiocatore)
          throw new ErroreTool(
            `Non in formazione nella partita ${doc.giorno}: ${nomi.join(', ')}. Nessun voto salvato. ` +
              'Aggiungili con aggiorna_partita oppure togli la riga.',
          )
        }

        const aggiornata = await payload.update({
          collection: 'partite',
          id: doc.id,
          data: { formazioneA: esito.formazioneA, formazioneB: esito.formazioneB },
          depth: 0,
        })
        const anagrafiche = await caricaAnagrafiche(payload)
        const completa = partitaCompleta(aggiornata, anagrafiche)
        const senzaVoto = [...completa.formazioneA, ...completa.formazioneB]
          .filter((r) => r.voto === null)
          .map((r) => r.giocatore)
        return { votiSalvati: pagelle.length, ancoraSenzaVoto: senzaVoto, partita: completa }
      }),
  )
}
