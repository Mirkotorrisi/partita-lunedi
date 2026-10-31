/** Forme compatte dei documenti: solo i campi utili all'agente, con nomi al posto degli id. */
import type { Payload } from 'payload'

import type { Giocatori, Partite, Squadre } from '@/payload-types'
import { relId } from '@/lib/relations'

import { etichettaGiocatore } from './abbina'
import { tuttiIGiocatori, tutteLeSquadre } from './risolvi'

export interface Anagrafiche {
  giocatori: Map<number, Giocatori>
  squadre: Map<number, Squadre>
}

export async function caricaAnagrafiche(payload: Payload): Promise<Anagrafiche> {
  const [giocatori, squadre] = await Promise.all([tuttiIGiocatori(payload), tutteLeSquadre(payload)])
  return {
    giocatori: new Map(giocatori.map((g) => [g.id, g])),
    squadre: new Map(squadre.map((s) => [s.id, s])),
  }
}

export const squadraBreve = (s: Squadre) => ({ id: s.id, nome: s.nome, colore: s.colore })

export const giocatoreBreve = (g: Giocatori, squadre?: Map<number, Squadre>) => {
  const squadraId = relId(g.squadraAbituale)
  const squadra = typeof squadraId === 'number' ? squadre?.get(squadraId) : undefined
  return {
    id: g.id,
    nomeCompleto: g.nomeCompleto ?? `${g.nome} ${g.cognome}`,
    soprannome: g.soprannome ?? null,
    ruolo: g.ruolo,
    numeroMaglia: g.numeroMaglia ?? null,
    squadraAbituale: squadra ? squadra.nome : squadraId ?? null,
    attivo: g.attivo !== false,
    slug: g.slug ?? null,
  }
}

const nomeSquadra = (ref: Partite['squadraA'], squadre: Map<number, Squadre>) => {
  const id = relId(ref)
  const s = typeof id === 'number' ? squadre.get(id) : undefined
  return s ? { id: s.id, nome: s.nome } : { id: id ?? null, nome: '?' }
}

const righe = (formazione: Partite['formazioneA'], giocatori: Map<number, Giocatori>) =>
  (formazione ?? []).map((r) => {
    const id = relId(r.giocatore)
    const g = typeof id === 'number' ? giocatori.get(id) : undefined
    return {
      giocatoreId: id ?? null,
      giocatore: g ? etichettaGiocatore(g) : '?',
      gol: r.gol ?? 0,
      voto: r.voto ?? null,
    }
  })

const votiMancanti = (p: Partite) =>
  [...(p.formazioneA ?? []), ...(p.formazioneB ?? [])].filter((r) => r.voto === null || r.voto === undefined).length

export const partitaBreve = (p: Partite, a: Anagrafiche) => ({
  id: p.id,
  giorno: p.giorno,
  titolo: p.titolo,
  squadraA: nomeSquadra(p.squadraA, a.squadre).nome,
  squadraB: nomeSquadra(p.squadraB, a.squadre).nome,
  golA: p.golA ?? 0,
  golB: p.golB ?? 0,
  giocatori: (p.formazioneA?.length ?? 0) + (p.formazioneB?.length ?? 0),
  votiMancanti: votiMancanti(p),
})

export const partitaCompleta = (p: Partite, a: Anagrafiche) => ({
  id: p.id,
  giorno: p.giorno,
  titolo: p.titolo,
  squadraA: nomeSquadra(p.squadraA, a.squadre),
  golA: p.golA ?? 0,
  autogolA: p.autogolA ?? 0,
  formazioneA: righe(p.formazioneA, a.giocatori),
  squadraB: nomeSquadra(p.squadraB, a.squadre),
  golB: p.golB ?? 0,
  autogolB: p.autogolB ?? 0,
  formazioneB: righe(p.formazioneB, a.giocatori),
  note: p.note ?? null,
  votiMancanti: votiMancanti(p),
})
