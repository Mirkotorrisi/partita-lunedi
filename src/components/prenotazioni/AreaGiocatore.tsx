'use client'

import { Check, LogOut, Search, UserRoundCheck } from 'lucide-react'
import { useEffect, useMemo, useState, useTransition } from 'react'

import { aggiornaProfilo, annulla, associa, prenota, riconosci, scollega } from '@/app/(frontend)/prenotazioni/actions'
import { NotificheToggle } from '@/components/pwa/NotificheToggle'
import { calcolaFingerprint } from '@/lib/fingerprint'

export interface GiocatoreScelta {
  id: number
  nome: string
  soprannome: string | null
}

export interface Io extends GiocatoreScelta {
  numeroMaglia: number | null
  iscritto: boolean
}

const BTN = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:opacity-50'
const BTN_PRIMARIO = `${BTN} bg-accent text-bg`
const BTN_SECONDARIO = `${BTN} border border-border text-text hover:border-muted`
const INPUT = 'min-h-11 w-full rounded-xl border border-border bg-surface-2 px-3 text-text placeholder:text-muted'

/** Tutto ciò che dipende dal dispositivo: scelta del giocatore, prenotazione e profilo. */
export function AreaGiocatore({ io, giocatori }: { io: Io | null; giocatori: GiocatoreScelta[] }) {
  return io ? <Prenotazione io={io} /> : <Selezione giocatori={giocatori} />
}

function useAzione() {
  const [pending, startTransition] = useTransition()
  const [errore, setErrore] = useState<string | null>(null)
  const esegui = (fn: () => Promise<{ ok: boolean; errore?: string }>) =>
    startTransition(async () => {
      const res = await fn()
      setErrore(res.ok ? null : (res.errore ?? 'Qualcosa è andato storto'))
    })
  return { pending, errore, esegui }
}

function Selezione({ giocatori }: { giocatori: GiocatoreScelta[] }) {
  const { pending, errore, esegui } = useAzione()
  const [fingerprint, setFingerprint] = useState<string | null>(null)
  const [suggerito, setSuggerito] = useState<{ giocatoreId: number; nome: string } | null>(null)
  const [cerca, setCerca] = useState('')
  const [scelto, setScelto] = useState<GiocatoreScelta | null>(null)

  useEffect(() => {
    let attivo = true
    void (async () => {
      const fp = await calcolaFingerprint()
      if (!attivo) return
      setFingerprint(fp)
      const r = await riconosci(fp)
      if (attivo && r.stato === 'suggerito') setSuggerito({ giocatoreId: r.giocatoreId, nome: r.nome })
    })()
    return () => {
      attivo = false
    }
  }, [])

  const filtrati = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    return q ? giocatori.filter((g) => `${g.nome} ${g.soprannome ?? ''}`.toLowerCase().includes(q)) : giocatori
  }, [giocatori, cerca])

  const conferma = (id: number) => esegui(() => associa(id, fingerprint ?? ''))

  if (fingerprint === null) return <div className="card skeleton h-32" aria-busy="true" />

  if (suggerito && !scelto) {
    return (
      <section className="card flex flex-col gap-3" aria-labelledby="sei-tu">
        <h2 id="sei-tu" className="section-title">
          Sei {suggerito.nome}?
        </h2>
        <p className="text-sm text-muted">Abbiamo riconosciuto questo dispositivo.</p>
        <div className="flex flex-wrap gap-2">
          <button className={BTN_PRIMARIO} disabled={pending} onClick={() => conferma(suggerito.giocatoreId)}>
            <UserRoundCheck className="h-4 w-4" aria-hidden="true" /> Sì, sono io
          </button>
          <button className={BTN_SECONDARIO} disabled={pending} onClick={() => setSuggerito(null)}>
            No, sono un altro
          </button>
        </div>
        {errore && <p role="alert" className="text-sm text-loss">{errore}</p>}
      </section>
    )
  }

  if (scelto) {
    return (
      <section className="card flex flex-col gap-3" aria-labelledby="conferma-scelta">
        <h2 id="conferma-scelta" className="section-title">
          Sei {scelto.soprannome || scelto.nome}?
        </h2>
        <p className="text-sm text-muted">Questo dispositivo resterà collegato a te: non dovrai più sceglierti.</p>
        <div className="flex flex-wrap gap-2">
          <button className={BTN_PRIMARIO} disabled={pending} onClick={() => conferma(scelto.id)}>
            <Check className="h-4 w-4" aria-hidden="true" /> {pending ? 'Un attimo…' : 'Sì, sono io'}
          </button>
          <button className={BTN_SECONDARIO} disabled={pending} onClick={() => setScelto(null)}>
            Indietro
          </button>
        </div>
        {errore && <p role="alert" className="text-sm text-loss">{errore}</p>}
      </section>
    )
  }

  return (
    <section className="card flex flex-col gap-3" aria-labelledby="chi-sei">
      <h2 id="chi-sei" className="section-title">
        Chi sei?
      </h2>
      <p className="text-sm text-muted">Selezionati una volta sola per prenotarti alle prossime partite.</p>
      <label className="relative block">
        <span className="sr-only">Cerca il tuo nome</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          value={cerca}
          onChange={(e) => setCerca(e.target.value)}
          placeholder="Cerca il tuo nome"
          className={`${INPUT} pl-9`}
        />
      </label>
      <ul className="flex max-h-80 flex-col overflow-y-auto rounded-xl border border-border">
        {filtrati.map((g) => (
          <li key={g.id} className="border-b border-border last:border-0">
            <button
              className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-1.5 text-left hover:bg-surface-2"
              onClick={() => setScelto(g)}
            >
              <span className="font-medium">{g.nome}</span>
              {g.soprannome && <span className="text-xs text-muted">{g.soprannome}</span>}
            </button>
          </li>
        ))}
        {!filtrati.length && <li className="px-3 py-3 text-sm text-muted">Nessun giocatore trovato</li>}
      </ul>
    </section>
  )
}

function Prenotazione({ io }: { io: Io }) {
  const { pending, errore, esegui } = useAzione()
  const [soprannome, setSoprannome] = useState(io.soprannome ?? '')
  const [maglia, setMaglia] = useState(io.numeroMaglia?.toString() ?? '')
  const [salvato, setSalvato] = useState(false)

  const salva = () => {
    const numero = maglia.trim() === '' ? null : Number(maglia)
    esegui(async () => {
      const res = await aggiornaProfilo({ soprannome, numeroMaglia: numero })
      setSalvato(res.ok)
      return res
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex flex-col gap-3" aria-labelledby="ciao">
        <h2 id="ciao" className="section-title">
          Ciao {io.soprannome || io.nome}
        </h2>
        {io.iscritto ? (
          <>
            <p className="flex items-center gap-2 text-win">
              <Check className="h-5 w-5" aria-hidden="true" /> Sei in lista per la prossima partita
            </p>
            <div>
              <button className={BTN_SECONDARIO} disabled={pending} onClick={() => esegui(annulla)}>
                Annulla la prenotazione
              </button>
            </div>
          </>
        ) : (
          <div>
            <button className={BTN_PRIMARIO} disabled={pending} onClick={() => esegui(prenota)}>
              {pending ? 'Un attimo…' : 'Ci sono!'}
            </button>
          </div>
        )}
        {errore && <p role="alert" className="text-sm text-loss">{errore}</p>}
      </section>

      <details className="card group">
        <summary className="flex min-h-11 cursor-pointer items-center justify-between font-medium">
          Il mio profilo
          <span className="text-xs text-muted">soprannome e maglia</span>
        </summary>
        <form
          className="mt-3 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            salva()
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="label">Soprannome</span>
            <input
              value={soprannome}
              maxLength={30}
              onChange={(e) => {
                setSoprannome(e.target.value)
                setSalvato(false)
              }}
              placeholder={io.nome}
              className={INPUT}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="label">Numero di maglia</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={99}
              value={maglia}
              onChange={(e) => {
                setMaglia(e.target.value)
                setSalvato(false)
              }}
              className={INPUT}
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className={BTN_PRIMARIO} disabled={pending}>
              Salva
            </button>
            {salvato && <span className="text-sm text-win">Salvato</span>}
          </div>
        </form>
        <div className="mt-4 flex flex-col border-t border-border pt-3">
          <NotificheToggle />
          <button className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text" disabled={pending} onClick={() => esegui(scollega)}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Non sono {io.soprannome || io.nome}
          </button>
        </div>
      </details>
    </div>
  )
}
