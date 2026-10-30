import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { it } from '@payloadcms/translations/languages/it'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Dispositivi } from './collections/Dispositivi'
import { Giocatori } from './collections/Giocatori'
import { Iscrizioni } from './collections/Iscrizioni'
import { Media } from './collections/Media'
import { Partite } from './collections/Partite'
import { Squadre } from './collections/Squadre'
import { Users } from './collections/Users'
import { ProssimaPartita } from './globals/ProssimaPartita'
import { cloudinaryAdapter, cloudinaryAttivo, cloudinaryUrl } from './plugins/cloudinaryAdapter'

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
  collections: [Partite, Iscrizioni, Giocatori, Squadre, Dispositivi, Media, Users],
  globals: [ProssimaPartita],
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
    // Senza credenziali Cloudinary (sviluppo locale) le immagini vanno su filesystem in ./media.
    cloudStoragePlugin({
      enabled: cloudinaryAttivo(),
      // Stesso schema con o senza Cloudinary: la colonna aggiunta dal plugin esiste anche in locale.
      alwaysInsertFields: true,
      collections: {
        media: {
          adapter: cloudinaryAdapter,
          disableLocalStorage: true,
          // Con il plugin spento Payload usa i propri URL (/api/media/file/…).
          generateFileURL: cloudinaryAttivo() ? ({ filename }) => cloudinaryUrl(filename) : undefined,
        },
      },
    }),
  ],
})
