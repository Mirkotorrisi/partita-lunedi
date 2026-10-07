import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateHooks } from '../hooks/revalidateDataset'

const HEX = /^#[0-9a-fA-F]{6}$/

export const Squadre: CollectionConfig = {
  slug: 'squadre',
  labels: { singular: 'Squadra', plural: 'Squadre' },
  admin: {
    useAsTitle: 'nome',
    defaultColumns: ['nome', 'colore'],
    group: 'Calcetto',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: revalidateHooks,
  fields: [
    {
      name: 'nome',
      label: 'Nome',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'colore',
      label: 'Colore',
      type: 'text',
      required: true,
      defaultValue: '#C6FF3D',
      admin: { description: 'Esadecimale, es. #E11D48. Usato per badge e grafici.' },
      validate: (value: string | null | undefined) =>
        (value && HEX.test(value)) || 'Inserisci un colore esadecimale nel formato #RRGGBB',
    },
  ],
}
