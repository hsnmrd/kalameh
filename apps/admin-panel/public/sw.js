/// <reference lib="webworker" />

const CACHE_NAME = "kalameh-admin-v1"
const OFFLINE_FALLBACK_URL = "/offline.html"

const PRECACHE_ASSETS = [
  OFFLINE_FALLBACK_URL,
  "/favicon.ico",
  "/manifest.webmanifest",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon.png",
]

// Install Event - Pre-cache essential offline and static shell assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate Event - Clean up outdated cache stores
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (name) => name.startsWith("kalameh-admin-") && name !== CACHE_NAME
            )
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Listen for messages from client (e.g. skip waiting when user clicks Update)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// Fetch Event - Route requests according to asset type and strategy
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Only handle GET requests
  if (request.method !== "GET") {
    return
  }

  // Bypass API proxy, backend calls, and non-http(s) schemes
  if (
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/api-proxy") ||
    url.pathname.startsWith("/uploads") ||
    !url.protocol.startsWith("http")
  ) {
    return
  }

  // 1. Navigation Requests (HTML pages) -> Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If valid response, clone into cache for fast subsequent visits
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
        .catch(async () => {
          // Network failed: attempt to retrieve cached version of this page
          const cachedResponse = await caches.match(request)
          if (cachedResponse) {
            return cachedResponse
          }
          // Fallback to offline page
          const offlineFallback = await caches.match(OFFLINE_FALLBACK_URL)
          if (offlineFallback) {
            return offlineFallback
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        })
    )
    return
  }

  // 2. Static Assets (_next/static, fonts, icons, images) -> Cache-first with network fallback
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico"

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background for cache updates
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse)
                })
              }
            })
            .catch(() => {
              // Ignore background fetch failures
            })
          return cachedResponse
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // 3. All other requests -> Network-first
  event.respondWith(fetch(request).catch(() => caches.match(request)))
})
