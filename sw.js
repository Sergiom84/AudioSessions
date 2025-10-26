// ============================================
// AUDIO SESSIONS - SERVICE WORKER
// Progressive Web App functionality
// ============================================

const CACHE_NAME = 'audio-sessions-v2.0.0';
const RUNTIME_CACHE = 'runtime-v2.0.0';

// Archivos esenciales para funcionalidad offline
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/house.html',
  '/techno.html',
  '/progressive.html',
  '/remember.html',
  '/private.html',
  '/player.html',
  '/style.css',
  '/global-player.js',
  '/features.js',
  '/manifest.json'
];

// Archivos que se cachean bajo demanda
const CACHE_ON_DEMAND = [
  '/attached_assets/'
];

// ============================================
// INSTALL - Cachear archivos esenciales
// ============================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(ESSENTIAL_FILES);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================
// ACTIVATE - Limpiar cachés antiguos
// ============================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name !== CACHE_NAME && name !== RUNTIME_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Tomar control inmediatamente
      })
  );
});

// ============================================
// FETCH - Estrategia de caché
// ============================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // No cachear peticiones a APIs externas (Archive.org, Google Scripts, etc.)
  if (!url.origin.includes(self.location.origin)) {
    return; // Dejar que el navegador maneje peticiones externas
  }

  // No cachear API endpoints del backend
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({
          error: 'Offline',
          message: 'No hay conexión a internet'
        }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503
        });
      })
    );
    return;
  }

  // Estrategia: Cache First, Network Fallback
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cachedResponse;
        }

        // No está en caché, hacer fetch
        return fetch(request)
          .then((networkResponse) => {
            // Solo cachear respuestas válidas
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Cachear la respuesta para futuras peticiones
            const responseToCache = networkResponse.clone();

            caches.open(RUNTIME_CACHE)
              .then((cache) => {
                // Cachear imágenes y assets
                if (url.pathname.startsWith('/attached_assets/') ||
                    url.pathname.endsWith('.png') ||
                    url.pathname.endsWith('.jpg') ||
                    url.pathname.endsWith('.jpeg') ||
                    url.pathname.endsWith('.svg')) {
                  console.log('[SW] Caching asset:', url.pathname);
                  cache.put(request, responseToCache);
                }
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('[SW] Fetch failed:', error);

            // Fallback offline page (opcional)
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }

            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ============================================
// MENSAJES DEL CLIENTE
// ============================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((name) => caches.delete(name))
          );
        })
        .then(() => {
          return self.registration.unregister();
        })
    );
  }
});

// ============================================
// SYNC - Sincronización en background (futuro)
// ============================================
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-favorites') {
    event.waitUntil(syncFavorites());
  }
});

async function syncFavorites() {
  // Futura implementación para sincronizar favoritos con servidor
  console.log('[SW] Syncing favorites...');
}

// ============================================
// PUSH NOTIFICATIONS (futuro)
// ============================================
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'Nueva sesión disponible',
    icon: '/attached_assets/Fondo_ppal.png',
    badge: '/attached_assets/Fondo_ppal.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Audio Sessions', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

console.log('[SW] Service Worker loaded successfully');
