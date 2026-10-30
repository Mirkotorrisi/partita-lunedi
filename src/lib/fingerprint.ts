/**
 * Impronta del browser (solo client). Non è un identificatore sicuro — telefoni dello stesso modello
 * possono coincidere — quindi serve solo a *suggerire* chi sei quando il cookie è andato perso.
 */
export async function calcolaFingerprint(): Promise<string> {
  const n = navigator as Navigator & { deviceMemory?: number }
  const parti = [
    n.userAgent,
    n.platform,
    n.languages?.join(',') ?? n.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}@${window.devicePixelRatio}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    n.hardwareConcurrency,
    n.deviceMemory,
    n.maxTouchPoints,
    canvasHash(),
  ]
  const dati = new TextEncoder().encode(parti.join('||'))
  if (crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', dati)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Contesto non sicuro (http): hash FNV ripetuto fino a 64 caratteri esadecimali.
  let h = 2166136261
  let out = ''
  for (let r = 0; out.length < 64; r++) {
    for (const b of dati) h = Math.imul(h ^ (b + r), 16777619)
    out += (h >>> 0).toString(16).padStart(8, '0')
  }
  return out.slice(0, 64)
}

function canvasHash(): string {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.textBaseline = 'top'
    ctx.font = '14px Arial'
    ctx.fillStyle = '#f60'
    ctx.fillRect(10, 1, 60, 20)
    ctx.fillStyle = '#069'
    ctx.fillText('Partita del lunedì ⚽', 2, 15)
    return canvas.toDataURL()
  } catch {
    return ''
  }
}
