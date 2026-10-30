import config from '@payload-config'
import { getPayload } from 'payload'
import webpush from 'web-push'

export const pushAttivo = () =>
  Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT)

/** Notifica a tutti i dispositivi che hanno attivato le notifiche; elimina le sottoscrizioni scadute. */
export async function inviaNotifica(msg: { title: string; body: string; url?: string }) {
  const payload = await getPayload({ config })
  if (!pushAttivo()) {
    payload.logger.warn('Notifica push non inviata: mancano le variabili VAPID')
    return { inviate: 0, scadute: 0 }
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  )

  const { docs } = await payload.find({
    collection: 'dispositivi',
    where: { pushSubscription: { exists: true } },
    depth: 0,
    pagination: false,
  })
  const testo = JSON.stringify({ ...msg, url: msg.url ?? '/prenotazioni' })
  let inviate = 0
  let scadute = 0
  await Promise.allSettled(
    docs.map(async (d) => {
      try {
        await webpush.sendNotification(d.pushSubscription as unknown as webpush.PushSubscription, testo)
        inviate++
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          scadute++
          await payload.update({ collection: 'dispositivi', id: d.id, data: { pushSubscription: null } })
        } else {
          payload.logger.error({ err, msg: 'Invio push fallito' })
        }
      }
    }),
  )
  return { inviate, scadute }
}
