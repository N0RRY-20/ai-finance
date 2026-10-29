/* AI Finance service worker.
 *
 * Hand-written for TanStack Start (SSR + Nitro). Kept intentionally free of
 * Workbox/plugin tooling — the app serves SSR HTML, so HTML is never cached:
 *
 * - Navigations        → network-first, falls back to the offline shell
 * - Hashed static dirs → cache-first (immutable assets, icons, manifest)
 * - Server endpoints   → never intercepted, always network
 */
const VERSION = 'ai-finance-v1'

const ASSET_CACHE = `static-${VERSION}`
const NAV_CACHE = `pages-${VERSION}`
const OFFLINE_URL = '/offline'

const ASSET_PATHS = [
  '/assets/', // hashed Vite output (js, css, fonts, images)
  '/icons/', // PWA icons
  '/manifest.webmanifest',
  '/favicon.ico',
]

/** Requests that must always go to the network (server data). */
function isServerEndpoint(pathname) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_serverFn') ||
    pathname.startsWith('/serverFn')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      // Try to precache the SSR'd offline shell. Don't fail installation
      // if the server is unreachable at install time.
      try {
        const cache = await caches.open(NAV_CACHE)
        await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
      } catch (error) {
        console.warn('[SW] failed to precache offline page', error)
      }
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key !== ASSET_CACHE && key !== NAV_CACHE)
          .map((key) => caches.delete(key)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (isServerEndpoint(url.pathname) || url.pathname === '/sw.js') return

  // 1) Navigations (SSR HTML) → network-first, cached offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(NAV_CACHE)
        try {
          const response = await fetch(request)
          if (response && response.ok) {
            cache.put(request, response.clone())
          }
          return response
        } catch {
          const cached = await cache.match(request)
          if (cached) return cached
          const offlinePage = await cache.match(OFFLINE_URL)
          if (offlinePage) return offlinePage
          return new Response('You are offline.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          })
        }
      })(),
    )
    return
  }

  // 2) Immutable static assets → cache-first.
  if (ASSET_PATHS.some((prefix) => url.pathname.startsWith(prefix))) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request, { ignoreSearch: true })
        if (cached) return cached
        try {
          const response = await fetch(request)
          if (response && response.ok) {
            cache.put(request, response.clone())
          }
          return response
        } catch {
          const fallback = await caches.match(request, { ignoreSearch: true })
          return fallback ?? Response.error()
        }
      })(),
    )
  }

  // Everything else: let the browser handle it (no interception).
})
