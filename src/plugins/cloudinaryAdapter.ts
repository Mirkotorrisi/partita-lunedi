import type { Adapter, HandleDelete, HandleUpload } from '@payloadcms/plugin-cloud-storage/types'
import type { UploadApiResponse } from 'cloudinary'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const cloudinaryAttivo = () =>
  Boolean(process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

/** Tutti i file stanno nella cartella "partita-lunedi/" di Cloudinary (così non si mescolano con altri progetti sullo stesso account); il public_id è il nome senza estensione. */
const CARTELLA = 'partita-lunedi'
const publicId = (filename: string) => `${CARTELLA}/${filename.replace(/\.[^/.]+$/, '')}`

export const cloudinaryUrl = (filename: string) => cloudinary.url(`${CARTELLA}/${filename}`, { secure: true })

export const cloudinaryAdapter: Adapter = () => ({
  name: 'cloudinary-adapter',

  handleUpload: (async ({ file }) => {
    // upload_stream è basato su callback: lo si avvolge in una Promise. Il file è già tutto in memoria.
    await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto', public_id: publicId(file.filename), overwrite: false },
        (error, result) => {
          if (error) return reject(error)
          if (!result) return reject(new Error('Cloudinary non ha restituito alcun risultato'))
          resolve(result)
        },
      )
      stream.end(file.buffer)
    })
    // Un errore fa fallire l'upload: meglio un messaggio chiaro che un documento con l'URL rotto.
  }) satisfies HandleUpload,

  handleDelete: (async ({ filename, req }) => {
    try {
      await cloudinary.uploader.destroy(publicId(filename))
    } catch (err) {
      req.payload.logger.error({ err, msg: 'Eliminazione da Cloudinary fallita' })
    }
  }) satisfies HandleDelete,

  // I file si servono direttamente da Cloudinary (vedi generateFileURL): questo handler non viene usato.
  staticHandler: () => new Response('Not implemented', { status: 501 }),
})
