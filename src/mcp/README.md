# Server MCP

Endpoint `POST /mcp` (streamable HTTP, stateless, risposte JSON) che espone i dati della partita agli agenti
tramite la Local API di Payload: passano dagli stessi hook dell'admin (validazioni, risultato calcolato,
revalidazione della cache, notifiche push).

## Attivazione

1. `MCP_TOKEN=$(openssl rand -hex 32)` in `.env` (e nelle variabili di Netlify). Senza token l'endpoint risponde 503.
2. Il client manda `Authorization: Bearer <token>`.

Claude Code, nel progetto, legge `.mcp.json` (usa `MCP_TOKEN` dall'ambiente della shell):

```sh
export MCP_TOKEN=…   # lo stesso valore di .env
pnpm dev
claude            # in /mcp compare "partita-lunedi"
```

Oppure contro il sito pubblicato:

```sh
claude mcp add --transport http partita-lunedi https://<sito>/mcp --header "Authorization: Bearer <token>"
```

## Tool

| Lettura | Scrittura |
| --- | --- |
| `lista_giocatori`, `lista_squadre` | `crea_giocatore`, `aggiorna_giocatore`, `crea_squadra`, `aggiorna_squadra` |
| `lista_partite`, `dettaglio_partita` | `crea_partita`, `aggiorna_partita`, `inserisci_pagelle` |
| `prossima_partita` | `aggiorna_prossima_partita`, `iscrivi_giocatore`, `annulla_iscrizione` |

Giocatori, squadre e partite si indicano per id oppure per nome/soprannome/giorno (`risolvi.ts`, logica in `abbina.ts`).
Non ci sono tool di cancellazione: si fa dall'admin.

## Prova rapida

```sh
npx @modelcontextprotocol/inspector --cli http://localhost:3000/mcp --transport http \
  --header "Authorization: Bearer $MCP_TOKEN" --method tools/list
```
