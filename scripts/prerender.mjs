// Post-build: genera un HTML por ruta (dist/<ruta>/index.html) con título, descripción, canonical,
// Open Graph y JSON-LD ya escritos, y el sitemap. La app sigue siendo una SPA: React reemplaza el
// contenido de #root al montar. Vercel sirve estos archivos antes del rewrite catch-all.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_SEO, SITE_NAME, SITE_URL, toTitle, toolSeo } from '../src/data/seo.ts'

const DIST = fileURLToPath(new URL('../dist/', import.meta.url))

const escapeHtml = (text) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const jsonLd = (data) =>
  `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

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
]

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
    `<meta name="twitter:card" content="summary" />`,
    jsonLd(route.schema),
  ].join('\n    ')

  const html = template
    // Funciones de reemplazo: un `$&` en una descripción no debe interpretarse como patrón.
    .replace(/<title>.*?<\/title>/, () => head)
    .replace(
      '<div id="root"></div>',
      () =>
        `<div id="root"><h1>${escapeHtml(route.heading)}</h1><p>${escapeHtml(route.description)}</p></div>`,
    )

  if (html === template) throw new Error(`El template no cambió para ${route.path}: revisa index.html`)

  if (route.path === '/') {
    await writeFile(join(DIST, 'index.html'), html)
  } else {
    await mkdir(join(DIST, route.path), { recursive: true })
    await writeFile(join(DIST, route.path, 'index.html'), html)
  }
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((r) => `  <url><loc>${SITE_URL}${r.path === '/' ? '/' : r.path}</loc></url>`).join('\n')}
</urlset>
`
await writeFile(join(DIST, 'sitemap.xml'), sitemap)

console.log(`prerender: ${routes.length} rutas + sitemap.xml`)
