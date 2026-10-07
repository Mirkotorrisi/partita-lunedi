import type { CollectionConfig } from 'payload'

import { anyone, authenticated } from '../access'
import { revalidateHooks } from '../hooks/revalidateDataset'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Immagine', plural: 'Immagini' },
  admin: {
    group: 'Sistema',
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
      name: 'alt',
      label: 'Testo alternativo',
      type: 'text',
    },
  ],
  upload: {
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'avatar', width: 192, height: 192, position: 'centre' },
      { name: 'hero', width: 384, height: 384, position: 'centre' },
    ],
    adminThumbnail: 'avatar',
  },
}
