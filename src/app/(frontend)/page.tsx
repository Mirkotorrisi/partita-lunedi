import { Home } from './_pagine/Home'

// Gli hook di Payload rigenerano la pagina al salvataggio; l'ora è solo una rete di sicurezza.
export const revalidate = 3600

export default function Page() {
  return <Home />
}
