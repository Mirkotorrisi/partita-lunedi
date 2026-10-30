const LATO = 512

/**
 * Ritaglia al centro un quadrato e lo riduce a 512px in JPEG (solo client).
 * Rispetta l'orientamento EXIF e converte i formati che il server non gestirebbe (es. HEIC su iPhone).
 */
export async function ridimensionaFoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const lato = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = Math.min(LATO, lato)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Il browser non supporta l’elaborazione delle immagini')
  ctx.drawImage(bitmap, (bitmap.width - lato) / 2, (bitmap.height - lato) / 2, lato, lato, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Foto non valida'))), 'image/jpeg', 0.85),
  )
}
