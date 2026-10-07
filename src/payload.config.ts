import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { it } from '@payloadcms/translations/languages/it'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Giocatori } from './collections/Giocatori'
import { Media } from './collections/Media'
import { Partite } from './collections/Partite'
import { Squadre } from './collections/Squadre'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// In locale un file SQLite; in produzione Turso (libsql://…, con token). Stesso dialetto ovunque.
const databaseUrl = process.env.DATABASE_URL || 'file:./partita-lunedi.db'
const isLocalFile = databaseUrl.startsWith('file:')

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' — Partita del lunedì',
    },
  },
  i18n: {
    supportedLanguages: { it },
    fallbackLanguage: 'it',
  },
  collections: [Partite, Giocatori, Squadre, Media, Users],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteAdapter({
    client: {
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Il push automatico dello schema (solo in dev) resta sul file locale: un `pnpm dev` puntato
    // a Turso non deve mai modificare il database di produzione fuori dalle migrazioni.
    push: isLocalFile,
  }),
  sharp,
  plugins: [
    // Senza token (sviluppo locale) le immagini vanno su filesystem in ./media.
    vercelBlobStorage({
      enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      collections: { media: true },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
