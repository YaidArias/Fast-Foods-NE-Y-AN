// ============================================
// COMIDAS RÁPIDAS NE&AN - SERVICE WORKER v4
// Estrategia Network First — sin caché agresivo
// El navegador siempre busca la versión más reciente
// ============================================

const CACHE_NAME    = 'nean-app-v4';
const OFFLINE_PAGE  = '/index.html';

// Solo estos assets se precargan (los más críticos)
const PRECACHE_ASSETS = [
    '/index.html',
    '/manifest.json'
];

// ── Instalación ───────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_ASSETS))
            .catch(err => console.log('Precache failed:', err))
    );
    // Activa inmediatamente sin esperar
    self.skipWaiting();
});

// ── Activación — limpia cachés viejos ─────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// ── Fetch: Network First ──────────────────
// Siempre intenta la red primero.
// Solo usa caché si la red falla (modo offline).
self.addEventListener('fetch', (event) => {
    // Ignorar peticiones que no sean GET
    if (event.request.method !== 'GET') return;

    // Ignorar peticiones a Firebase, ntfy, Cloudinary y fuentes externas
    const url = new URL(event.request.url);
    const isExternal = !url.origin.includes(self.location.origin);
    if (isExternal) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si la red responde bien, actualiza el caché y devuelve la respuesta
                if (response && response.status === 200) {
                    const cloned = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
                }
                return response;
            })
            .catch(() => {
                // Red no disponible — usar caché como fallback
                return caches.match(event.request).then(cached => {
                    if (cached) return cached;
                    // Si no hay caché, devolver la página principal
                    if (event.request.destination === 'document') {
                        return caches.match(OFFLINE_PAGE);
                    }
                });
            })
    );
});

// ── Notificaciones push ───────────────────
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'NUEVO_PEDIDO') {
        const { orderId, customerName, items, total } = event.data.payload;
        const itemsResumen = items
            ? items.map(i => `${i.quantity}x ${i.name}`).join(', ')
            : 'Ver detalles';

        self.registration.showNotification(`Nuevo Pedido - ${orderId}`, {
            body: `${customerName} pidio: ${itemsResumen}. Total: $${Number(total).toLocaleString('es-CO')}`,
            icon:  '/images/icon-192.png',
            badge: '/images/icon-96.png',
            tag:   'nuevo-pedido-' + orderId,
            renotify:            true,
            requireInteraction:  true,
            vibrate: [200, 100, 200, 100, 200],
            actions: [
                { action: 'ver',    title: 'Ver pedido' },
                { action: 'cerrar', title: 'Cerrar' }
            ]
        });
    }
});

// ── Click en notificación ─────────────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'cerrar') return;
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            return clients.openWindow('/');
        })
    );
});