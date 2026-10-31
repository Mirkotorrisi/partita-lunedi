import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Payload } from 'payload'

import { registraGiocatori } from './tools/giocatori'
import { registraPagelle } from './tools/pagelle'
import { registraPartite } from './tools/partite'
import { registraProssimaPartita } from './tools/prossima-partita'
import { registraSquadre } from './tools/squadre'

const ISTRUZIONI = `Dati della "partita del lunedì" (calcetto tra amici): giocatori, due squadre fisse, partite con formazioni, gol e pagelle.
Convenzioni:
- I giocatori e le squadre si possono indicare per id oppure per nome/soprannome; i giorni sono YYYY-MM-DD (ora italiana).
- I voti vanno da 1 a 10 a passi di 0,5. Il risultato di una partita si calcola dai gol delle formazioni più gli autogol: non si inserisce a mano.
- Le stagioni vanno da agosto a luglio ("2026-27").
- Per le pagelle di una partita già registrata usa inserisci_pagelle (aggiorna solo i voti citati). aggiorna_partita con una formazione la sostituisce per intero.`

/** Un server per richiesta (modalità stateless): i tool sono economici da registrare. */
export function creaServerMcp(payload: Payload): McpServer {
  const server = new McpServer(
    { name: 'partita-lunedi', version: '0.1.0' },
    { instructions: ISTRUZIONI },
  )
  registraGiocatori(server, payload)
  registraSquadre(server, payload)
  registraPartite(server, payload)
  registraPagelle(server, payload)
  registraProssimaPartita(server, payload)
  return server
}
