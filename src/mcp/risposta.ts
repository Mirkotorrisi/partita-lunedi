import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { APIError, ValidationError } from 'payload'

/** Errore "atteso" (input sbagliato, documento non trovato): arriva all'agente come messaggio, non come crash. */
export class ErroreTool extends Error {}

/** Risposta di un tool: JSON leggibile, così l'agente ha gli id per le chiamate successive. */
export const ok = (dati: unknown): CallToolResult => ({
  content: [{ type: 'text', text: typeof dati === 'string' ? dati : JSON.stringify(dati, null, 2) }],
})

export const errore = (messaggio: string): CallToolResult => ({
  isError: true,
  content: [{ type: 'text', text: messaggio }],
})

export function messaggioErrore(err: unknown): string {
  if (err instanceof ErroreTool) return err.message
  if (err instanceof ValidationError) {
    const campi = err.data.errors.map((e) => `${e.path}: ${e.message}`).join('; ')
    return `Dati non validi — ${campi || err.message}`
  }
  if (err instanceof APIError) return err.message
  if (err instanceof Error) return err.message
  return String(err)
}

/** Esegue un tool traducendo qualsiasi eccezione in un errore MCP strutturato. */
export async function esegui(fn: () => Promise<unknown>): Promise<CallToolResult> {
  try {
    return ok(await fn())
  } catch (err) {
    return errore(messaggioErrore(err))
  }
}
