import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { HOME_SEO, SITE_NAME, SITE_URL, toTitle, toolSeo } from '../data/seo'

const setMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector<HTMLElement>(selector)
  if (!element) {
    element = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(element)
  }
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value)
}

/**
 * Actualiza título, descripción, canonical y Open Graph al navegar. El HTML inicial ya sale con
 * estos datos por ruta gracias a `scripts/prerender.mjs`; esto mantiene el head al día en la SPA.
 * Se hace con DOM directo (no `<title>` de React) para no duplicar el <title> del HTML estático.
 */
const RouteSeo = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/'
    const entry = path === '/' ? HOME_SEO : toolSeo[path]

    // Rutas desconocidas (404): sin indexar y con el título genérico.
    setMeta('meta[name="robots"]', { name: 'robots', content: entry ? 'index,follow' : 'noindex' })
    if (!entry) {
      // /cuenta y rutas desconocidas: título de marca y sin indexar.
      document.title = SITE_NAME
      return
    }

    const title = path === '/' ? `${SITE_NAME}: ${entry.title}` : toTitle(entry)
    const url = `${SITE_URL}${path === '/' ? '/' : path}`

    document.title = title
    setMeta('meta[name="description"]', { name: 'description', content: entry.description })
    setMeta('link[rel="canonical"]', { rel: 'canonical', href: url })
    setMeta('meta[property="og:title"]', { property: 'og:title', content: title })
    setMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: entry.description,
    })
    setMeta('meta[property="og:url"]', { property: 'og:url', content: url })
  }, [pathname])

  return null
}

export default RouteSeo
