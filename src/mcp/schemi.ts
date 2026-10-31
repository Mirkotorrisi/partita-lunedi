/** Schemi zod condivisi tra i tool. Le descrizioni finiscono nello schema che legge l'agente. */
import { z } from 'zod'

import { RUOLI } from '@/collections/Giocatori'

export const riferimentoGiocatore = z
  .union([z.number().int(), z.string().min(1)])
  .describe('Id numerico oppure nome, cognome, "nome cognome" o soprannome del giocatore')

export const riferimentoSquadra = z
  .union([z.number().int(), z.string().min(1)])
  .describe('Id numerico oppure nome della squadra')

export const riferimentoPartita = z
  .union([z.number().int(), z.string().min(1)])
  .describe('Id numerico, giorno YYYY-MM-DD oppure "ultima" per la partita più recente')

export const giorno = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD').describe('Giorno YYYY-MM-DD')

export const voto = z
  .number()
  .min(1)
  .max(10)
  .multipleOf(0.5)
  .describe('Voto da 1 a 10 a passi di 0,5')

export const gol = z.number().int().min(0).describe('Gol segnati')

export const ruolo = z
  .enum(RUOLI.map((r) => r.value) as [string, ...string[]])
  .describe('Ruolo: portiere, difensore, centrocampista o attaccante')

export const numeroMaglia = z.number().int().min(1).max(99).describe('Numero di maglia da 1 a 99')

export const colore = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Formato #RRGGBB').describe('Colore esadecimale #RRGGBB')

export const rigaFormazione = z.object({
  giocatore: riferimentoGiocatore,
  gol: gol.default(0),
  voto: voto.nullable().optional().describe('Voto; omesso o null se la pagella non è ancora stata fatta'),
})

export const formazione = z
  .array(rigaFormazione)
  .describe('Giocatori della squadra con gol e, se già noti, i voti')
