import type { CollectionConfig, Field } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateHooks } from '../hooks/revalidate'
import { ABILITA_MAX, ABILITA_MIN, CATEGORIE_ABILITA } from '../lib/abilita'
import { ALTEZZA_CM, ANNO_NASCITA, PIEDE_ESTESO } from '../lib/format'
import { slugify } from '../lib/slugify'

const intero = (value: number | null | undefined) =>
  value === null || value === undefined || Number.isInteger(value) || 'Il numero deve essere intero'

/** Sei gruppi (uno per categoria) con tre numeri da 1 a 99 ciascuno, dal catalogo in lib/abilita. */
const campiAbilita: Field[] = CATEGORIE_ABILITA.map((c) => ({
  name: c.chiave,
  label: c.label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: c.voci.map(
        (v): Field => ({
          name: v.chiave,
          label: v.label,
          type: 'number',
          min: ABILITA_MIN,
          max: ABILITA_MAX,
          validate: intero,
          admin: { width: '33%', step: 1 },
        }),
      ),
    },
  ],
}))

export const RUOLI = [
  { label: 'Portiere', value: 'portiere' },
  { label: 'Difensore', value: 'difensore' },
  { label: 'Centrocampista', value: 'centrocampista' },
  { label: 'Attaccante', value: 'attaccante' },
] as const

export const Giocatori: CollectionConfig = {
  slug: 'giocatori',
  labels: { singular: 'Giocatore', plural: 'Giocatori' },
  admin: {
    useAsTitle: 'nomeCompleto',
    defaultColumns: ['nomeCompleto', 'soprannome', 'ruolo', 'squadraAbituale', 'attivo'],
    listSearchableFields: ['nome', 'cognome', 'soprannome'],
    group: 'Calcetto',
  },
  defaultSort: 'cognome',
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    ...revalidateHooks,
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data) return data
        const nome = (data.nome ?? originalDoc?.nome ?? '').trim()
        const cognome = (data.cognome ?? originalDoc?.cognome ?? '').trim()
        if (!nome || !cognome) return data

        data.nomeCompleto = `${nome} ${cognome}`

        // Lo slug si genera solo se vuoto: cambiare nome non deve rompere i link già condivisi.
        const manuale = typeof data.slug === 'string' ? data.slug.trim() : ''
        const base = slugify(manuale || originalDoc?.slug || `${nome} ${cognome}`)
        let slug = base
        for (let i = 2; ; i++) {
          const { totalDocs } = await req.payload.count({
            collection: 'giocatori',
            where: {
              slug: { equals: slug },
              ...(originalDoc?.id ? { id: { not_equals: originalDoc.id } } : {}),
            },
            req,
          })
          if (totalDocs === 0) break
          slug = `${base}-${i}`
        }
        data.slug = slug
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'nome', label: 'Nome', type: 'text', required: true, admin: { width: '50%' } },
        { name: 'cognome', label: 'Cognome', type: 'text', required: true, admin: { width: '50%' } },
      ],
    },
    {
      name: 'soprannome',
      label: 'Soprannome',
      type: 'text',
      admin: { description: 'Se presente viene mostrato sul sito al posto del nome.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ruolo',
          label: 'Ruolo',
          type: 'select',
          required: true,
          options: [...RUOLI],
          admin: { width: '40%' },
        },
        {
          name: 'numeroMaglia',
          label: 'Numero di maglia',
          type: 'number',
          min: 1,
          max: 99,
          validate: intero,
          admin: { width: '20%', step: 1 },
        },
        {
          name: 'squadraAbituale',
          label: 'Squadra abituale',
          type: 'relationship',
          relationTo: 'squadre',
          admin: {
            width: '40%',
            description: 'Solo informativa: la squadra effettiva si registra in ogni partita.',
          },
        },
      ],
    },
    {
      name: 'foto',
      label: 'Foto',
      type: 'upload',
      relationTo: 'media',
    },
    {
      type: 'collapsible',
      label: 'Dati personali',
      admin: {
        initCollapsed: false,
        description: 'Il giocatore può compilarli da solo dalla sua area nella pagina Prenotazioni.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'piedePreferito',
              label: 'Piede preferito',
              type: 'select',
              options: Object.entries(PIEDE_ESTESO).map(([value, label]) => ({ label, value })),
              admin: { width: '34%' },
            },
            {
              name: 'annoNascita',
              label: 'Anno di nascita',
              type: 'number',
              min: ANNO_NASCITA.min,
              max: ANNO_NASCITA.max,
              validate: intero,
              admin: { width: '33%', step: 1 },
            },
            {
              name: 'altezza',
              label: 'Altezza (cm)',
              type: 'number',
              min: ALTEZZA_CM.min,
              max: ALTEZZA_CM.max,
              validate: intero,
              admin: { width: '33%', step: 1 },
            },
          ],
        },
      ],
    },
    {
      name: 'descrizione',
      label: 'Descrizione',
      type: 'textarea',
      admin: {
        description:
          'Breve presentazione mostrata nella scheda. Si può formattare in markdown: **grassetto**, *corsivo*, ' +
          '[testo](https://…), elenchi con "- ".',
      },
    },
    {
      name: 'abilita',
      label: 'Abilità',
      type: 'group',
      admin: {
        description:
          'Da 1 a 99 come nelle card dei videogiochi. Le voci vuote non contano: il valore di ogni categoria ' +
          'è la media di quelle compilate.',
      },
      fields: campiAbilita,
    },
    {
      name: 'nomeCompleto',
      label: 'Nome completo',
      type: 'text',
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Generato da nome e cognome. Usato nell’URL della scheda giocatore.',
      },
    },
    {
      name: 'attivo',
      label: 'Attivo',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'I non attivi restano nello storico ma non compaiono nelle nuove formazioni.',
      },
    },
  ],
}
