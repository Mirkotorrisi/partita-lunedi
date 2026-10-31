/**
 * Endpoint MCP (streamable HTTP) su /mcp: espone i dati della partita agli agenti.
 *
 * Autenticazione: `Authorization: Bearer <MCP_TOKEN>`. Senza MCP_TOKEN in env l'endpoint è spento (503).
 * Stateless: ogni richiesta crea server e transport nuovi, niente sessioni da tenere in memoria
 * (va bene anche su Netlify Functions). Le risposte sono JSON, non stream SSE.
 */
import config from '@payload-config'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { timingSafeEqual } from 'crypto'
import { getPayload } from 'payload'

import { creaServerMcp } from '@/mcp/server'

const tokenValido = (header: string | null): boolean => {
  const atteso = process.env.MCP_TOKEN
  if (!atteso) return false
  const ricevuto = header?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? ''
  const a = Buffer.from(ricevuto)
  const b = Buffer.from(atteso)
  return a.length === b.length && timingSafeEqual(a, b)
}

async function gestisci(request: Request): Promise<Response> {
  if (!process.env.MCP_TOKEN) {
    return Response.json({ error: 'MCP disabilitato: imposta MCP_TOKEN' }, { status: 503 })
  }
  if (!tokenValido(request.headers.get('authorization'))) {
    return Response.json(
      { error: 'Token mancante o non valido' },
      { status: 401, headers: { 'WWW-Authenticate': 'Bearer realm="partita-lunedi"' } },
    )
  }
  // Protezione da DNS rebinding: una pagina web non deve poter chiamare l'endpoint da un'altra origine.
  const origin = request.headers.get('origin')
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return Response.json({ error: 'Origin non consentita' }, { status: 403 })
  }

  const payload = await getPayload({ config })
  const server = creaServerMcp(payload)
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)
  try {
    return await transport.handleRequest(request)
  } finally {
    // Con risposte JSON la risposta è già completa qui: si libera il server della richiesta.
    void transport.close()
  }
}

export const POST = gestisci
export const GET = gestisci
export const DELETE = gestisci
