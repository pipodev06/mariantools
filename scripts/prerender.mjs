// Post-build: genera un HTML por ruta (dist/<ruta>/index.html) con título, descripción, canonical,
// Open Graph y JSON-LD ya escritos, y el sitemap. La app sigue siendo una SPA: React reemplaza el
// contenido de #root al montar. También escribe /cuenta (noindex) y 404.html (noindex): Vercel responde
// con 404.html y estado 404 a las rutas que no existen, en vez de un 200 con la SPA.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_SEO, SITE_NAME, SITE_URL, legalSeo, toTitle, toolSeo } from '../src/data/seo.ts'
import { faq } from '../src/data/faq.ts'
import { toolInfo } from '../src/data/toolInfo.ts'

const OG_IMAGE = `${SITE_URL}/og-image.png`
const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

// Texto "Cómo usar" de la herramienta en el HTML estático, para que se indexe sin ejecutar JavaScript.
const infoHtml = (path) => {
  if (path === '/') {
    // Enlaces a todas las herramientas en el HTML estático del inicio (descubrimiento sin ejecutar JavaScript).
    const links = Object.entries(toolSeo).map(([p, e]) => `<li><a href="${p}">${escapeHtml(e.title)}</a></li>`)
    return `<h2>Herramientas</h2><ul>${links.join('')}</ul>`
  }
  if (path === '/preguntas-frecuentes') {
    return faq.map(({ q, a }) => `<h2>${escapeHtml(q)}</h2><p>${escapeHtml(a)}</p>`).join('')
  }
  const info = toolInfo[path]
  if (!info) return ''
  const list = (tag, items) => `<${tag}>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</${tag}>`
  return [
    '<h2>Cómo usar</h2>',
    list('ol', info.steps),
    info.tips ? list('ul', info.tips) : '',
    ...(info.faq ?? []).map(({ q, a }) => `<h3>${escapeHtml(q)}</h3><p>${escapeHtml(a)}</p>`),
  ].join('')
}

const routes = [
  {
    path: '/',
    heading: HOME_SEO.title,
    title: `${SITE_NAME}: ${HOME_SEO.title}`,
    description: HOME_SEO.description,
    schema: { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${SITE_URL}/`, inLanguage: 'es' },
  },
  ...Object.entries(toolSeo).map(([path, entry]) => ({
    path,
    heading: entry.title,
    title: toTitle(entry),
    description: entry.description,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: entry.title,
      url: `${SITE_URL}${path}`,
      description: entry.description,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      inLanguage: 'es',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
  })),
  ...Object.entries(legalSeo).map(([path, entry]) => ({
    path,
    heading: entry.title,
    title: toTitle(entry),
    description: entry.description,
    schema:
      path === '/preguntas-frecuentes'
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            inLanguage: 'es',
            mainEntity: faq.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }
        : {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: entry.title,
            url: `${SITE_URL}${path}`,
            description: entry.description,
            inLanguage: 'es',
          },
  })),
]

// Rutas que existen pero no se indexan: se escriben con robots noindex y fuera del sitemap.
const unindexed = [
  { path: '/cuenta', file: 'cuenta/index.html', heading: 'Mi cuenta', title: SITE_NAME },
  { path: '/404', file: '404.html', heading: 'Página no encontrada', title: `Página no encontrada | ${SITE_NAME}` },
]

// Sin rewrite catch-all, una ruta de App.tsx que no se prerenderice daría 404 al recargar: se corta el build.
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const known = new Set(['/', ...routes.map((r) => r.path), ...unindexed.map((r) => r.path)])
for (const [, segment] of appSource.matchAll(/path="([^"*]+)"/g)) {
  if (!known.has(`/${segment}`)) throw new Error(`La ruta /${segment} de App.tsx no se prerenderiza: agrégala a seo.ts o a "unindexed"`)
}

const template = await readFile(join(DIST, 'index.html'), 'utf8')

for (const route of routes) {
  const url = `${SITE_URL}${route.path}`
  const head = [
    `<title>${escapeHtml(route.title)}</title>`,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${OG_IMAGE}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${OG_IMAGE}" />`,
    jsonLd(route.schema),
  ].join('\n    ')

  const html = template
    // Funciones de reemplazo: un `$&` en una descripción no debe interpretarse como patrón.
    .replace(/<title>.*?<\/title>/, () => head)
    .replace(
      '<div id="root"></div>',
      () =>
        `<div id="root"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.description)}</p>${infoHtml(route.path)}</div>`,
    )

  if (html === template) throw new Error(`El template no cambió para ${route.path}: revisa index.html`)

  if (route.path === '/') {
    await writeFile(join(DIST, 'index.html'), html)
  } else {
    await mkdir(join(DIST, route.path), { recursive: true })
    await writeFile(join(DIST, route.path, 'index.html'), html)
  }
}

for (const route of unindexed) {
  const html = template
    .replace(/<title>.*?<\/title>/, () => `<title>${escapeHtml(route.title)}</title>
    <meta name="robots" content="noindex" />`)
    .replace('<div id="root"></div>', () => `<div id="root"><h1>${escapeHtml(route.heading)}</h1></div>`)
  if (html === template) throw new Error(`El template no cambió para ${route.path}: revisa index.html`)
  if (route.file.includes('/')) await mkdir(join(DIST, route.file, '..'), { recursive: true })
  await writeFile(join(DIST, route.file), html)
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(join(DIST, 'sitemap.xml'), sitemap)

console.log(`prerender: ${routes.length} rutas + sitemap.xml`)
