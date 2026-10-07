import type { CollectionConfig } from 'payload'

import type { Partite as Partita, Squadre as Squadra } from '../payload-types'
import { anyone, authenticated } from '../access'
import { formazioneField } from '../fields/formazione'
import { revalidateHooks } from '../hooks/revalidateDataset'
import { validatePartita } from '../hooks/validatePartita'
import { formatDataBreve, toGiorno } from '../lib/date'
import { relId } from '../lib/relations'

type Riga = NonNullable<Partita['formazioneA']>[number]

const sommaGol = (righe: Riga[] | null | undefined): number =>
  (righe ?? []).reduce((tot, r) => tot + (r.gol ?? 0), 0)

export const Partite: CollectionConfig = {
  slug: 'partite',
  labels: { singular: 'Partita', plural: 'Partite' },
  admin: {
    useAsTitle: 'titolo',
    defaultColumns: ['titolo', 'data', 'golA', 'golB'],
    group: 'Calcetto',
  },
  defaultSort: '-data',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (!data) return data
        const quando = data.data ?? originalDoc?.data
        if (quando) data.giorno = toGiorno(quando)
        return data
      },
      validatePartita,
    ],
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        // Il risultato si ricava sempre dalle formazioni: qualsiasi valore inviato viene sovrascritto.
        const formazioneA: Riga[] = data.formazioneA ?? originalDoc?.formazioneA ?? []
        const formazioneB: Riga[] = data.formazioneB ?? originalDoc?.formazioneB ?? []
        const autogolA: number = data.autogolA ?? originalDoc?.autogolA ?? 0
        const autogolB: number = data.autogolB ?? originalDoc?.autogolB ?? 0
        data.golA = sommaGol(formazioneA) + autogolA
        data.golB = sommaGol(formazioneB) + autogolB

        const nomeSquadra = async (value: Squadra | number | null | undefined) => {
          const id = relId(value)
          if (id === undefined) return '?'
          const squadra = await req.payload.findByID({
            collection: 'squadre',
            id,
            depth: 0,
            req,
          })
          return squadra.nome
        }
        const [nomeA, nomeB] = await Promise.all([
          nomeSquadra(data.squadraA ?? originalDoc?.squadraA),
          nomeSquadra(data.squadraB ?? originalDoc?.squadraB),
        ])
        const quando = data.data ?? originalDoc?.data
        data.titolo = `${quando ? formatDataBreve(quando) : '?'} — ${nomeA} ${data.golA}-${data.golB} ${nomeB}`
        return data
      },
    ],
    ...revalidateHooks,
  },
  fields: [
    {
      name: 'precompila',
      type: 'ui',
      admin: {
        components: { Field: '/components/admin/PrecompilaDaUltima#PrecompilaDaUltima' },
      },
    },
    {
      name: 'data',
      label: 'Data',
      type: 'date',
      required: true,
      index: true,
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'dd/MM/yyyy' },
      },
    },
    {
      type: 'collapsible',
      label: 'Squadra A',
      fields: [
        {
          name: 'squadraA',
          label: 'Squadra A',
          type: 'relationship',
          relationTo: 'squadre',
          required: true,
        },
        formazioneField('formazioneA', 'Formazione A'),
        {
          name: 'autogolA',
          label: 'Autogol a favore di A',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: { description: 'Autogol degli avversari che contano come gol per la squadra A.' },
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Squadra B',
      fields: [
        {
          name: 'squadraB',
          label: 'Squadra B',
          type: 'relationship',
          relationTo: 'squadre',
          required: true,
        },
        formazioneField('formazioneB', 'Formazione B'),
        {
          name: 'autogolB',
          label: 'Autogol a favore di B',
          type: 'number',
          defaultValue: 0,
          min: 0,
          admin: { description: 'Autogol degli avversari che contano come gol per la squadra B.' },
        },
      ],
    },
    {
      name: 'note',
      label: 'Note',
      type: 'textarea',
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        {
          name: 'golA',
          label: 'Gol A',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, width: '50%', description: 'Calcolato' },
        },
        {
          name: 'golB',
          label: 'Gol B',
          type: 'number',
          defaultValue: 0,
          admin: { readOnly: true, width: '50%', description: 'Calcolato' },
        },
      ],
    },
    {
      name: 'giorno',
      label: 'Giorno',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'YYYY-MM-DD, una sola partita per giorno. Usato nell’URL.',
      },
    },
    {
      name: 'titolo',
      label: 'Titolo',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
